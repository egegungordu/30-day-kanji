import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";

import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Grades as FSRSGrades,
  Grade as FSRSGrade,
  Rating as FSRSRating,
  Card as FSRSCard,
  State as FSRSState,
} from "ts-fsrs";
import { z, ZodError } from "zod";

const params = generatorParameters({
  enable_fuzz: true,
  maximum_interval: 1000,
  request_retention: 0.93,
});

const f = fsrs(params);

interface CardFace {
  id: string;
  kanji: string;
  reading: string;
  targetKanji: string;
  sentence: string;
}
export type Card = FSRSCard & CardFace;
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
  nextDayReset: Date;
  newAddedCount: number;
  schedule: {
    new: string[];
    learning: string[];
    review: string[];
  };
  rateCurrentCardAndAdvance: (rate: Grade) => string | undefined;
  hydrateCards: (cards: CardFace[]) => void;
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
  new: z.array(z.string()),
  learning: z.array(z.string()),
  review: z.array(z.string()),
});
const StoreDateSchema = z.coerce.date();

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
          kanji: "",
          reading: "",
          targetKanji: "",
          sentence: "",
        });
      });
      return cardsMap;
    } else if (key === "schedule") {
      return StoreScheduleSchema.parse(value);
    } else if (key === "nextDayReset") {
      return StoreDateSchema.parse(value);
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
          kanji: undefined,
          reading: undefined,
          targetKanji: undefined,
          sentence: undefined,
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

// TODO: FIX: this approach is too bug prone, surely will cause issues later on
// consider seperating the fetch (react query) ?
const useSRSStore = create<SRSState>()(
  devtools(
    persist(
      (set, get) => ({
        cards: new Map<string, Card>(),
        currentCardId: "",
        newCardsPerDay: 5,
        nextDayReset: new Date(),
        newAddedCount: 0,
        schedule: {
          new: [],
          learning: [], // also relearning
          review: [],
        },
        rateCurrentCardAndAdvance: (rate: Grade) => {
          const card = get().cards.get(get().currentCardId ?? "");
          if (card) {
            const recordLog = f.repeat(card, Date.now());
            const oldCardState = card.state;
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
            set({
              cards: get().cards,
              newAddedCount:
                oldCardState === State.New
                  ? get().newAddedCount + 1
                  : get().newAddedCount,
            });
            get().reschedule();
            const queue = get()
              .schedule.new.concat(get().schedule.learning)
              .concat(get().schedule.review);
            const nextCardId = queue[0];
            set({
              currentCardId: nextCardId,
            });
            return nextCardId;
          }
        },
        hydrateCards: (cards: CardFace[]) => {
          const newCards = cards.map((card) => {
            const existingCard = get().cards.get(card.id);
            if (existingCard) {
              return {
                ...existingCard,
                kanji: card.kanji,
                reading: card.reading,
                targetKanji: card.targetKanji,
                sentence: card.sentence,
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
          if (now > get().nextDayReset) {
            const nextDayReset = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() + 1,
              4,
              0,
              0,
              0,
            );
            set({
              nextDayReset: nextDayReset,
              newAddedCount: 0,
            });
          }
          const currentCards = Array.from(get().cards.values());
          const newCardCount = get().newCardsPerDay - get().newAddedCount;
          const newCardIds = currentCards
            .filter((c) => c.state === State.New)
            .map((c) => c.id)
            .slice(0, newCardCount);
          let learningCardIds = currentCards
            .filter(
              (c) => c.state === State.Learning || c.state === State.Relearning,
            )
            .sort((a, b) => a.due.getTime() - b.due.getTime())
            .map((c) => c.id);
          const reviewCardIds = currentCards
            .filter((c) => c.state === State.Review && c.due < now)
            .sort((a, b) => a.due.getTime() - b.due.getTime())
            .map((c) => c.id);
          set({
            schedule: {
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
          nextDayReset: state.nextDayReset,
          newAddedCount: state.newAddedCount,
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
                const updatedState = useSRSStore.getState();
                useSRSMetaStore.setState({ loadState: "loaded" });
                const queue = updatedState.schedule.new
                  .concat(updatedState.schedule.learning)
                  .concat(updatedState.schedule.review);
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
  return fetch("/api/srs").then((res) => res.json() as Promise<CardFace[]>);
  /* await new Promise((resolve) => setTimeout(resolve, 100)); */
  /* return Array.from({ length: 2200 }, (_, i) => ({ */
  /*   id: i.toString(), */
  /*   reading: "けいこう", */
  /*   kanji: "傾向", */
  /*   targetKanji: "向", */
  /*   sentence: "若者にはお金を無駄に使う傾向がある。", */
  /* })); */
}

export function useSRS() {
  const { cards, schedule, rateCurrentCardAndAdvance, currentCardId } =
    useSRSStore();
  const { loadState, error } = useSRSMetaStore();

  return {
    loadState,
    error,
    cards,
    getCurrentCard: () => {
      const currentCard = cards.get(currentCardId ?? "");
      if (!currentCard) {
        return undefined;
      }
      const repeats = f.repeat(currentCard, Date.now());
      return {
        ...currentCard,
        goodDue: repeats[Rating.Good].card.due,
        againDue: repeats[Rating.Again].card.due,
      };
    },
    hydrateCards: (onHydrateFinished: () => void) =>
      (useSRSStore.persist.rehydrate() as Promise<void>).then(
        onHydrateFinished,
      ),
    rateCurrentCardAndAdvance,
    schedule,
    reset: () => {
      useSRSMetaStore.setState({ loadState: "loading", error: undefined });
      useSRSStore.persist.clearStorage();
      useSRSStore.persist.rehydrate();
    },
  };
}
