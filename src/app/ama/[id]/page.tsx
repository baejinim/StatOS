import type { Metadata } from "next";
import { notFound } from "next/navigation";

import AMADetail from "@/app/ama/AMADetail";
import { createMetadata, truncateDescription } from "@/lib/metadata";
import { isFeatureEnabled } from "@/lib/features";
import { getAmaItemContent } from "@/lib/notion";

export const revalidate = 3600;

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  if (!isFeatureEnabled("ama")) {
    return {
      title: "Not Found",
    };
  }
  const params = await props.params;
  const id = params.id;

  try {
    const item = await getAmaItemContent(id);

    if (!item) {
      return {
        title: "AMA Question Not Found",
      };
    }

    const description = item.description || `Question answered by Brian Lovin`;

    return createMetadata({
      title: item.title,
      description: truncateDescription(description),
      path: `/ama/${id}`,
    });
  } catch {
    return {
      title: "AMA Question",
    };
  }
}

export default function AMADetailPage() {
  if (!isFeatureEnabled("ama")) {
    notFound();
  }
  return <AMADetail />;
}
