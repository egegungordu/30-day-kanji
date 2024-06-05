"use client";

import Loader from "@/components/ui/loader";
import SRSDashboard from "./_components/srs-dashboard";
import SRSOnboarding from "./_components/srs-onboarding";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useLayoutEffect } from "react";

const useOnboardingStore = create<{
  loading: boolean;
  onboardingStage: "onboarding" | "onboarded";
  setOnboardingStage: (stage: "onboarding" | "onboarded") => void;
}>()(
  persist(
    (set) => ({
      loading: true,
      onboardingStage: "onboarding",
      setOnboardingStage: (stage) => set({ onboardingStage: stage }),
    }),
    {
      name: "onboarding",
      partialize: (state) => ({
        onboardingStage: state.onboardingStage,
      }),
      skipHydration: true,
    },
  ),
);

export default function Page() {
  const { loading, onboardingStage, setOnboardingStage } = useOnboardingStore();

  useLayoutEffect(() => {
    (useOnboardingStore.persist.rehydrate() as Promise<void>).then(() => {
      useOnboardingStore.setState({ loading: false });
    });
  }, []);

  const handleOnboardingFinished = () => {
    setOnboardingStage("onboarded");
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="h-full py-8">
      {onboardingStage === "onboarding" && (
        <SRSOnboarding onOnboardingFinished={handleOnboardingFinished} />
      )}
      {onboardingStage === "onboarded" && <SRSDashboard />}
    </div>
  );
}
