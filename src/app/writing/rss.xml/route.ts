import { Feed } from "feed";

import { SITE_CONFIG } from "@/lib/metadata";
import { getAllWritingPosts } from "@/lib/writing";

/**
 * Get base URL with fallback for local development
 */
function getBaseUrl(): string {
  // Try environment variable first
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  // Fallback to SITE_CONFIG
  if (SITE_CONFIG.url) {
    return SITE_CONFIG.url;
  }
  // Final fallback for local development
  return process.env.NODE_ENV === "production"
    ? "https://localhost"
    : "http://localhost:3000";
}

export async function GET() {
  try {
    const baseUrl = getBaseUrl();

    // Fetch all writing posts (already sorted by date descending)
    const posts = await getAllWritingPosts();

    // Ensure posts are sorted by date (newest first) - already sorted in getAllWritingPosts
    const sortedPosts = [...posts].sort((a, b) => {
      const dateA = new Date(a.published || a.createdTime).getTime();
      const dateB = new Date(b.published || b.createdTime).getTime();
      return dateB - dateA;
    });

    // Get the most recent post date for feed updated time
    const mostRecentDate = sortedPosts.length > 0
      ? new Date(sortedPosts[0].published || sortedPosts[0].createdTime)
      : new Date();

    // Create the feed
    const feed = new Feed({
      title: `${SITE_CONFIG.name} - Writing`,
      description: "Essays, guides, and thoughts on design, engineering, and product development",
      id: `${baseUrl}/writing`,
      link: `${baseUrl}/writing`,
      language: "en",
      image: `${baseUrl}/api/og`,
      favicon: `${baseUrl}/favicon.ico`,
      copyright: `All rights reserved ${new Date().getFullYear()}, ${SITE_CONFIG.author.name}`,
      updated: mostRecentDate,
      feedLinks: {
        rss: `${baseUrl}/writing/rss.xml`,
      },
      author: {
        name: SITE_CONFIG.author.name,
        link: baseUrl,
      },
    });

    // Add each post to the feed
    sortedPosts.forEach((post) => {
      // Ensure absolute URL
      const postUrl = `${baseUrl}/writing/${post.slug}`;

      // Parse and validate date
      let publishDate: Date;
      try {
        const dateString = post.published || post.createdTime;
        publishDate = new Date(dateString);
        if (isNaN(publishDate.getTime())) {
          console.warn(`Invalid date for post ${post.slug}: ${dateString}`);
          publishDate = new Date(); // Fallback to current date
        }
      } catch {
        publishDate = new Date();
      }

      // Ensure title and description are not empty
      const title = post.title || "Untitled";
      let description = post.excerpt || "";
      
      // Truncate description if too long (240-300 chars recommended for RSS)
      if (description.length > 300) {
        description = description.substring(0, 297) + "...";
      }

      feed.addItem({
        title,
        id: postUrl, // Use absolute URL as ID for uniqueness
        link: postUrl,
        description,
        date: publishDate,
        published: publishDate,
        image: post.featureImage ? (post.featureImage.startsWith("http") ? post.featureImage : `${baseUrl}${post.featureImage}`) : undefined,
        author: [
          {
            name: SITE_CONFIG.author.name,
            link: baseUrl,
          },
        ],
      });
    });

    // Return RSS XML with proper content-type
    return new Response(feed.rss2(), {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error generating RSS feed:", error);
    return new Response("Error generating RSS feed", { status: 500 });
  }
}
