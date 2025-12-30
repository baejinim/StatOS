import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createMetadata } from "@/lib/metadata";
import { isFeatureEnabled } from "@/lib/features";

import { HNPageClient } from "./HNPageClient";

export const metadata: Metadata = createMetadata({
  title: "Hacker News",
  description: "A minimal, clean interface for reading Hacker News.",
  path: "/hn",
});

export const revalidate = 3600;

export default function HNPage() {
  if (!isFeatureEnabled("hn")) {
    notFound();
  }
  return <HNPageClient />;
}
