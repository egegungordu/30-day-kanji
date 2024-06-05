"use client";

import SRSDashboard from "./_components/srs-dashboard";
import SRSOnboarding from "./_components/srs-onboarding";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const useOnboardingStore = create<{
  onboardingStage: "onboarding" | "onboarded";
  setOnboardingStage: (stage: "onboarding" | "onboarded") => void;
}>()(
  persist(
    (set) => ({
      onboardingStage: "onboarding",
      setOnboardingStage: (stage) => set({ onboardingStage: stage }),
    }),
    {
      name: "onboarding",
    },
  ),
);

export default function Page() {
  const { onboardingStage, setOnboardingStage } = useOnboardingStore();

  const handleOnboardingFinished = () => {
    setOnboardingStage("onboarded");
  };

  return (
    <div className="h-full py-8">
      {onboardingStage === "onboarding" && (
        <SRSOnboarding onOnboardingFinished={handleOnboardingFinished} />
      )}
      {onboardingStage === "onboarded" && <SRSDashboard />}
    </div>
  );
}
