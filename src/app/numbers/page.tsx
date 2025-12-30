"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { LiveNumber } from "@/components/LiveNumber";
import { isFeatureEnabled } from "@/lib/features";

export default function NumbersPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isFeatureEnabled("numbers")) {
      router.replace("/404");
    }
  }, [router]);

  if (!isFeatureEnabled("numbers")) {
    return null;
  }
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const birthsPerSecond = 4.3;
  const deathsPerSecond = 2.0;
  const populationRate = birthsPerSecond - deathsPerSecond;

  const populationBase = 8118000000;
  const populationBaseTime = new Date("2024-01-01T00:00:00Z");

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-8">
      <div className="grid gap-8 text-4xl sm:grid-cols-2 md:grid-cols-3">
        <div className="flex flex-col gap-2">
          <div className="text-secondary text-sm">World Population</div>
          <LiveNumber
            base={populationBase}
            baseTime={populationBaseTime}
            rate={populationRate}
            className="text-primary"
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-secondary text-sm">Births Today</div>
          <LiveNumber
            base={0}
            baseTime={startOfDay}
            rate={birthsPerSecond}
            className="text-primary"
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-secondary text-sm">Deaths Today</div>
          <LiveNumber
            base={0}
            baseTime={startOfDay}
            rate={deathsPerSecond}
            className="text-primary"
          />
        </div>
      </div>
    </div>
  );
}
