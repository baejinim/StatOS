import { SITE_CONFIG } from "@/lib/metadata";
import { generateOGImage } from "@/lib/og-utils";
import { getWritingPostContentBySlug } from "@/lib/writing/fs";

export const runtime = "nodejs";
export const revalidate = 86400; // 24 hours
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

/**
 * Get base URL with fallback
 */
function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || SITE_CONFIG.url || "http://localhost:3000";
}

export default async function Image(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const slug = params.slug;
  const content = await getWritingPostContentBySlug(slug);

  const baseUrl = getBaseUrl();
  const baseHost = baseUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  if (!content) {
    // Fallback to generic title if post not found
    return generateOGImage({
      title: "Writing",
      url: `${baseHost}/writing`,
    });
  }

  const { metadata } = content;

  return generateOGImage({
    title: metadata.title || "Writing",
    url: `${baseHost}/writing/${slug}`,
  });
}
