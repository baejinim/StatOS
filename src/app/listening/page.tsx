import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ListeningHistory } from "@/components/ListeningHistory";
import { createMetadata } from "@/lib/metadata";
import { isFeatureEnabled } from "@/lib/features";
import { getListeningHistoryDatabaseItems } from "@/lib/notion";

export const metadata: Metadata = createMetadata({
  title: "Listening",
  description: "My listening history, synced from Spotify every hour",
  path: "/listening",
});

export const revalidate = 3600;

export default async function ListeningPage() {
  if (!isFeatureEnabled("listening")) {
    notFound();
  }
  // Fetch initial page of music data on the server
  const initialPage = await getListeningHistoryDatabaseItems(undefined, 20);

  return <ListeningHistory initialData={[initialPage]} />;
}
