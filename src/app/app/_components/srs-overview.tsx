"use client";

import { useSRS } from "@/lib/srs";

export default function SRSOverview() {
  const {loadState, schedule} = useSRS();

  if (loadState === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>SRS Overview</h1>
      <div>Schedule:</div>
    </div>
  );
}
