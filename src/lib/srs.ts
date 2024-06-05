import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";

import {
  createEmptyCard,
  formatDate,
  fsrs,
  generatorParameters,
  Grades as FSRSGrades,
  Grade as FSRSGrade,
  Rating as FSRSRating,
  Card as FSRSCard,
  CardInput,
  State as FSRSState,
} from "ts-fsrs";
import { useEffect, useLayoutEffect } from "react";
import { z, ZodError } from "zod";

const params = generatorParameters({
  enable_fuzz: true,
  maximum_interval: 1000,
  request_retention: 0.9,
});

const f = fsrs(params);

export interface Card extends FSRSCard {
  id: string;
  front: string;
  back: string;
}

export type Grade = FSRSGrade;
export const Grades = FSRSGrades;
export const Rating = FSRSRating;
export const State = FSRSState;

type LoadState = "loading" | "loaded" | "error";

interface SRSMetaState {
  loadState: LoadState;
  error?: string;
}

interface SRSState {
  cards: Map<string, Card>;
  currentCardId?: string;
  newCardsPerDay: number;
  schedule: {
    newAddedCount: number;
    new: string[];
    learning: string[];
    review: string[];
  };
  next: () => void;
  rateCurrentCard: (rate: Grade) => void;
  hydrateCards: (cards: Pick<Card, "id" | "front" | "back">[]) => void;
  reschedule: () => void;
}

const StoreCardSchema = z.array(
  z.object({
    id: z.string(),
    due: z.coerce.date(),
    stability: z.number(),
    difficulty: z.number(),
    elapsed_days: z.number(),
    scheduled_days: z.number(),
    reps: z.number(),
    lapses: z.number(),
    state: z.number().int().min(0).max(3),
    last_review: z.coerce.date().optional(),
  }),
);
const StoreScheduleSchema = z.object({
  newAddedCount: z.number().min(0),
  new: z.array(z.string()),
  learning: z.array(z.string()),
  review: z.array(z.string()),
});

const STORE_NAME = "srsStore";

const srsStorage = createJSONStorage(() => localStorage, {
  // deserialize: JSON.parse,
  reviver: (key, value) => {
    if (key === "cards") {
      const cardsArray = StoreCardSchema.parse(value);
      const cardsMap = new Map<string, Card>();
      cardsArray.forEach((card) => {
        cardsMap.set(card.id, {
          ...card,
          front: "",
          back: "",
        });
      });
      return cardsMap;
    } else if (key === "schedule") {
      return StoreScheduleSchema.parse(value);
    }
    return value;
  },
  // serialize: JSON.stringify,
  replacer: (key, value) => {
    if (key === "cards") {
      // skip front and back values
      const a = Array.from((value as Map<string, Card>).values()).map(
        (card: Card) => ({
          ...card,
          front: undefined,
          back: undefined,
        }),
      );
      return a;
    }
    return value;
  },
});

const useSRSMetaStore = create<SRSMetaState>()(() => ({
  loadState: "loading",
  error: undefined,
}));

const useSRSStore = create<SRSState>()(
  devtools(
    persist(
      (set, get) => ({
        cards: new Map<string, Card>(),
        currentCardId: "",
        newCardsPerDay: 5,
        schedule: {
          newAddedCount: 0,
          new: [],
          learning: [], // also relearning
          review: [],
        },
        next: () => {
          // first new, then learning, then review
          const queue = get()
            .schedule.new.concat(get().schedule.learning)
            .concat(get().schedule.review);
          const nextCardId = queue[0];
          const schedule = get().schedule;
          const newSchedule =
            get().cards.get(nextCardId)?.state === State.New
              ? {
                  ...schedule,
                  newAddedCount: schedule.newAddedCount + 1,
                }
              : schedule;
          set({
            currentCardId: nextCardId,
            schedule: newSchedule,
          });
          get().reschedule();
        },
        rateCurrentCard: (rate: Grade) => {
          const card = get().cards.get(get().currentCardId ?? "");
          if (card) {
            const recordLog = f.repeat(card, Date.now());
            const newCardValues = recordLog[rate].card;
            card.due = newCardValues.due;
            card.stability = newCardValues.stability;
            card.difficulty = newCardValues.difficulty;
            card.elapsed_days = newCardValues.elapsed_days;
            card.scheduled_days = newCardValues.scheduled_days;
            card.reps = newCardValues.reps;
            card.lapses = newCardValues.lapses;
            card.state = newCardValues.state;
            card.last_review = newCardValues.last_review;
            set({ cards: get().cards });
            get().reschedule();
          }
        },
        hydrateCards: (cards: Pick<Card, "id" | "front" | "back">[]) => {
          const newCards = cards.map((card) => {
            const existingCard = get().cards.get(card.id);
            if (existingCard) {
              return {
                ...existingCard,
                front: card.front,
                back: card.back,
              };
            } else {
              return {
                ...createEmptyCard(new Date()),
                ...card,
              };
            }
          });
          set({ cards: new Map(newCards.map((c) => [c.id, c])) });
        },
        reschedule: () => {
          const now = new Date();
          const currentCards = Array.from(get().cards.values());
          const newCardCount =
            get().newCardsPerDay - get().schedule.newAddedCount;
          const newCardIds = currentCards
            .filter((c) => c.state === State.New)
            .map((c) => c.id)
            .slice(0, newCardCount);
          const learningCardIds = currentCards
            .filter(
              (c) => c.state === State.Learning || c.state === State.Relearning,
            )
            .map((c) => c.id);
          const reviewCardIds = currentCards
            .filter((c) => c.state === State.Review && c.due < now)
            .map((c) => c.id);
          set({
            schedule: {
              newAddedCount: get().schedule.newAddedCount,
              new: newCardIds,
              learning: learningCardIds,
              review: reviewCardIds,
            },
          });
        },
      }),
      {
        name: STORE_NAME,
        version: 0,
        storage: srsStorage,
        skipHydration: true,
        partialize: (state) => ({
          cards: state.cards,
          schedule: state.schedule,
        }),
        onRehydrateStorage: () => {
          return (_, error) => {
            if (error) {
              console.error(
                "an error happened during hydration, removing local storage",
                error,
              );
              if (error instanceof ZodError) {
                useSRSMetaStore.setState({
                  loadState: "error",
                  error: "Invalid format in local storage",
                });
              } else {
                useSRSMetaStore.setState({
                  loadState: "error",
                  error: "Unknown error",
                });
              }
            } else {
              console.log("hydration finished");
              const hydrate = async () => {
                const kanjiCards = await getKanjiCards();
                const state = useSRSStore.getState();
                state.hydrateCards(kanjiCards);
                state.reschedule();
                useSRSMetaStore.setState({ loadState: "loaded" });
                const queue = state.schedule.new
                  .concat(state.schedule.learning)
                  .concat(state.schedule.review);
                const nextCardId = queue[0];
                useSRSStore.setState({ currentCardId: nextCardId });
              };

              hydrate();
            }
          };
        },
      },
    ),
  ),
);

async function getKanjiCards() {
  console.warn("CALLING BACKEND");
  await new Promise((resolve) => setTimeout(resolve, 0));
  return Array.from({ length: 100 }, (_, i) => ({
    id: i.toString(),
    front: "asd" + Math.sin(i).toString(36).substring(2, 15),
    back: "asd" + Math.sin(i).toString(36).substring(2, 15),
  }));
}

export function useSRS() {
  const { cards, schedule, rateCurrentCard, next, currentCardId } =
    useSRSStore();
  const { loadState, error } = useSRSMetaStore();

  /* useLayoutEffect(() => { */
  /*   (useSRSStore.persist.rehydrate() as Promise<void>).then(); */
  /* }, []); */

  return {
    loadState,
    error,
    cards,
    getCurrentCard: () => cards.get(currentCardId ?? ""),
    hydrateCards: (onHydrateFinished: () => void) =>
      (useSRSStore.persist.rehydrate() as Promise<void>).then(
        onHydrateFinished,
      ),
    rateCurrentCard,
    schedule,
    next,
    reset: () => {
      useSRSMetaStore.setState({ loadState: "loading", error: undefined });
      useSRSStore.persist.clearStorage();
      useSRSStore.persist.rehydrate();
    },
  };
}
