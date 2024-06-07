import { Button } from "@/components/ui/button";
import { useId, useLayoutEffect, useState } from "react";
import { createWithEqualityFn } from "zustand/traditional";
import {
  RiArrowLeftLine,
  RiErrorWarningLine,
  RiExternalLinkLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import Link from "next/link";
import ExternalLink from "@/components/ui/external-link";

function OnboardPage1() {
  return (
    <div className="w-full min-h-96">
      <h1 className="text-2xl sm:text-3xl font-medium px-2 sm:px-16 text-muted-foreground text-center">
        Welcome to the{" "}
        <span className="font-bold tracking-wider text-foreground">
          30 Day Kanji
        </span>{" "}
        challenge!
      </h1>
      <p className="bg-accent/50 text-accent-foreground/80 px-5 py-3 rounded-xl text-sm mt-6">
        <RiErrorWarningLine className="mr-2 inline-block" />
        <span className="font-bold">IMPORTANT:</span> Intended for people who
        can already understand and read japanese, but struggle with writing.
      </p>
      <ul className="list-disc list-inside space-y-3 text-sm">
        <li className="mt-6 text-muted-foreground">
          This is a 30 day learning challenge to learn how to write the{" "}
          <span className="font-bold text-primary">2,136 常用漢字</span> (jouyou
          kanji) in Japanese.
        </li>
        <li className="mt-2 text-muted-foreground">
          You will be learning how to write by using the{" "}
          <span className="font-bold text-primary">Spaced Repetition</span>{" "}
          method.
        </li>
        <li className="mt-2  text-muted-foreground">
          To finish the challenge, you will need to see{" "}
          <span className="font-bold text-primary">72 new kanji</span> a day.
        </li>
      </ul>
    </div>
  );
}

function OnboardPage2() {
  return (
    <div className="w-full min-h-96">
      <h1 className="text-2xl sm:text-3xl font-medium px-2 sm:px-16 text-muted-foreground text-center">
        Before you start
      </h1>
      <ul className="list-disc list-inside space-y-3 text-sm">
        <li className="mt-6 text-muted-foreground">
          This challenge is done in 30 days, but you will have to keep doing the
          cards to retain your knowledge.{" "}
          <ExternalLink href="https://ncase.me/remember/">
            That is how SRS works.
          </ExternalLink>
        </li>
        <li className="mt-2 text-muted-foreground">
          All progress you have is stored in your browser, if you delete your
          browser data,{" "}
          <span className="text-foreground font-semibold">
            you will lose all your progress.
          </span>
        </li>
        <li className="mt-2 text-muted-foreground">
          You won&apos;t be able to sync your progress on other devices. If you want
          a better, more customized experience, you can use the{" "}
          <ExternalLink href="https://github.com/egegungordu/30-day-kanji/releases">
            30 day anki deck
          </ExternalLink>{" "}
          with{" "}
          <ExternalLink href="https://ankiweb.net">Anki</ExternalLink>
        </li>
      </ul>
    </div>
  );
}

const useOnboardingStepsStore = createWithEqualityFn<{
  currentStep: number;
  registeredChildren: Map<string, number>;
  registerChild: (id: string) => number;
  unregisterChild: (id: string) => void;
  next: () => void;
  previous: () => void;
}>()(
  (set, get) => ({
    currentStep: 0,
    registeredChildren: new Map<string, number>(),
    registerChild: (id: string) => {
      if (get().registeredChildren.has(id)) {
        return get().registeredChildren.get(id)!;
      }
      const currentSize = get().registeredChildren.size;
      get().registeredChildren.set(id, currentSize);
      set({ registeredChildren: get().registeredChildren });
      return currentSize;
    },
    unregisterChild: (id: string) => {
      get().registeredChildren.delete(id);
      set({ registeredChildren: get().registeredChildren });
    },
    next: () => {
      if (get().currentStep === get().registeredChildren.size - 1) {
        return;
      }
      set({ currentStep: get().currentStep + 1 });
    },
    previous: () => {
      if (get().currentStep === 0) {
        return;
      }
      set({ currentStep: get().currentStep - 1 });
    },
  }),
  Object.is,
);

function OnboardingSteps({
  children,
  onOnboardingFinished,
}: {
  children?: React.ReactNode;
  onOnboardingFinished?: () => void;
}) {
  const { currentStep, next, previous, registeredChildren } =
    useOnboardingStepsStore();

  useLayoutEffect(() => {
    useOnboardingStepsStore.setState(useOnboardingStepsStore.getInitialState());
  }, []);

  return (
    <div className="flex flex-col justify-between sm:justify-center h-full">
      <div className="mt-24">{children}</div>

      <div className="flex flex-col mt-12 pt-auto mb-8 gap-4">
        <div className="flex gap-2 justify-center">
          <Button
            disabled={0 === currentStep}
            variant="ghost"
            className="w-24"
            onClick={previous}
          >
            Previous
          </Button>
          <Button
            variant={
              currentStep === registeredChildren.size - 1
                ? "default"
                : "outline"
            }
            className="w-24"
            onClick={() => {
              if (currentStep === registeredChildren.size - 1) {
                onOnboardingFinished?.();
              } else {
                next();
              }
            }}
          >
            {currentStep === registeredChildren.size - 1 ? "Finish" : "Next"}
          </Button>
        </div>

        <div className="flex gap-1 justify-center">
          {Array.from(registeredChildren.entries()).map(([id, order]) => (
            <div
              key={id}
              className={cn("size-1.5 bg-muted-foreground/50 rounded-full", {
                "bg-primary/80": currentStep >= order,
              })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function OnboardingStep({ children }: { children?: React.ReactNode }) {
  const currentStep = useOnboardingStepsStore((state) => state.currentStep);
  const registerChild = useOnboardingStepsStore((state) => state.registerChild);
  const unregisterChild = useOnboardingStepsStore(
    (state) => state.unregisterChild,
  );
  const id = useId();
  const [index, setIndex] = useState(-1);

  useLayoutEffect(() => {
    setIndex(registerChild(id));
    return () => unregisterChild(id);
  }, []);

  if (currentStep !== index) {
    return null;
  }

  return <>{children}</>;
}

export default function SRSOnboarding({
  onOnboardingFinished,
}: {
  onOnboardingFinished: () => void;
}) {
  return (
    <div className="mx-auto max-w-screen-sm relative shadow-xl grid place-items-center h-full px-6 sm:px-12 bg-gradient-to-tr rounded-2xl from-background via-popover to-background">
      <Link href="/" className="absolute top-4 left-4">
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <RiArrowLeftLine className="size-4 mr-2 mt-0.5" />
          Back
        </Button>
      </Link>

      <OnboardingSteps onOnboardingFinished={onOnboardingFinished}>
        <OnboardingStep>
          <OnboardPage1 />
        </OnboardingStep>
        <OnboardingStep>
          <OnboardPage2 />
        </OnboardingStep>
      </OnboardingSteps>
    </div>
  );
}
