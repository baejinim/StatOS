import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createMetadata } from "@/lib/metadata";
import { isFeatureEnabled } from "@/lib/features";

export const metadata: Metadata = createMetadata({
  title: "AMA",
  description:
    "Ask me anything about design, engineering, startups, or life. I'll do my best to answer your questions.",
  path: "/ama",
});

export const revalidate = 3600;

export default function AMAPage() {
  if (!isFeatureEnabled("ama")) {
    notFound();
  }
  return <div className="bg-secondary dark:bg-primary flex flex-1" />;
}
