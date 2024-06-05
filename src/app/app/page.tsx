"use client";

import SRSDashboard from "./_components/srs-dashboard";
import SRSOnboarding from "./_components/srs-onboarding";
import { useState } from "react";

export default function Page() {
  const [userStage, setUserStage] = useState(
    "onboarding" as "onboarding" | "onboarded",
  );

  const handleOnboardingFinished = () => {
    setUserStage("onboarded");
  };

  return (
    <div className="h-full py-8">
      {userStage === "onboarding" && (
        <SRSOnboarding onOnboardingFinished={handleOnboardingFinished} />
      )}
      {userStage === "onboarded" && <SRSDashboard />}
    </div>
  );
}
