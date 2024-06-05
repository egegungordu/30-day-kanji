"use client";

import { Button } from "@/components/ui/button";
import Loader from "@/components/ui/loader";
import { useSRS, Rating, Grade } from "@/lib/srs";
import { relativeTime } from "@/lib/utils";
import Link from "next/link";
import { useLayoutEffect, useReducer } from "react";
import { RiArrowLeftLine } from "react-icons/ri";

function ReviewScreen({ onFinishReview }: { onFinishReview?: () => void }) {
  const { schedule, getCurrentCard, rateCurrentCardAndAdvance, loadState } =
    useSRS();

  const currentCard = getCurrentCard();

  const handleClickRateButton = (rate: Grade) => {
    const nextCardId = rateCurrentCardAndAdvance(rate);
    if (!nextCardId) {
      console.log({ nextCardId });
      onFinishReview?.();
    }
  };

  if (loadState === "loading") {
    return <Loader />;
  }

  return (
    <div className="">
      <div>
        Schedule:
        <span>New: {schedule.new.length}</span>
        <span>Learning: {schedule.learning.length}</span>
        <span>Review: {schedule.review.length}</span>
      </div>
      <div className="bg-secondary/20 p-2 rounded-xl border">
        <div>Current: {currentCard?.id}</div>
        <div className="">
          State:
          {currentCard?.state}
        </div>
        <div className="">
          Kanji:
          {currentCard?.kanji}
        </div>
        <div className="">
          Reading:
          {currentCard?.reading}
        </div>

        <div className="flex">
          <div className="flex flex-col items-center">
            &lt;{currentCard && relativeTime(currentCard.againDue)}
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => handleClickRateButton(Rating.Again)}
            >
              Again
            </button>
          </div>
          <div className="flex flex-col items-center">
            &lt;{currentCard && relativeTime(currentCard.goodDue)}
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => handleClickRateButton(Rating.Good)}
            >
              Good
            </button>
          </div>
        </div>
      </div>
      {/* <ul className="text-muted"> */}
      {/*   {Array.from(cards.values()).map((card) => ( */}
      {/*     <li key={card.id}> */}
      {/*       <span>id: {card.id}</span> */}
      {/*       <span>state: {card.state}</span> */}
      {/*       <span>due: {card.due.toISOString()}</span> */}
      {/*       <span>scheduled_days: {card.scheduled_days}</span> */}
      {/*       <span>elapsed_days: {card.elapsed_days}</span> */}
      {/*       <span>last_review: {card.last_review?.toISOString()}</span> */}
      {/*     </li> */}
      {/*   ))} */}
      {/* </ul> */}
    </div>
  );
}

function OverviewScreen({ onStartReview }: { onStartReview?: () => void }) {
  const { schedule } = useSRS();

  const isDoneForToday =
    schedule.new.length === 0 &&
    schedule.learning.length === 0 &&
    schedule.review.length === 0;

  return (
    <div>
      <div>
        Schedule:
        <span>New: {schedule.new.length}</span>
        <span>Learning: {schedule.learning.length}</span>
        <span>Review: {schedule.review.length}</span>
      </div>
      {isDoneForToday ? (
        <div className="text-muted-foreground">
          You have finished all cards for today!
        </div>
      ) : (
        <Button onClick={onStartReview}>Start Review</Button>
      )}
    </div>
  );
}

export default function SRSDasbhoard() {
  const { loadState, hydrateCards } = useSRS();

  const [isReviewing, switchIsReviewing] = useReducer((state) => !state, false);

  useLayoutEffect(() => {
    hydrateCards(() => {
      console.log("hydrated cards");
    });
  }, []);

  if (loadState === "loading") {
    return <Loader />;
  }

  return (
    <div className="mx-auto max-w-screen-md bg-card h-fit min-h-full p-4 rounded-xl shadow-xl">
      <Link href="/" className="top-4 left-4">
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <RiArrowLeftLine className="size-4 mr-2 mt-0.5" />
          Back
        </Button>
      </Link>
      {isReviewing ? (
        <ReviewScreen onFinishReview={switchIsReviewing} />
      ) : (
        <OverviewScreen onStartReview={switchIsReviewing} />
      )}
    </div>
  );
}
