"use client";

import { useSRS, Rating } from "@/lib/srs";

export default function SRS() {
  const { cards, schedule, getCurrentCard, next, rateCurrentCard, loadState } = useSRS();

  const currentCard = getCurrentCard();

  if (loadState === "loading") {
    return <div>Loading...</div>;
  }

  if (!currentCard) {
    return <div>
      You have finished all cards for today!
    </div>
  }

  return (
    <div>
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
          Front:
          {currentCard?.front}
        </div>
        <div className="">
          Back:
          {currentCard?.back}
        </div>

        <button
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => {
            rateCurrentCard(Rating.Again);
            next();
          }}
        >
          Again
        </button>
        <button
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => {
            rateCurrentCard(Rating.Good);
            next();
          }}
        >
          Good
        </button>
      </div>
      <ul className="text-muted">
        {Array.from(cards.values()).map((card) => (
          <li key={card.id}>
            <span>id: {card.id}</span>
            <span>state: {card.state}</span>
            <span>due: {card.due.toISOString()}</span>
            <span>scheduled_days: {card.scheduled_days}</span>
            <span>elapsed_days: {card.elapsed_days}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

