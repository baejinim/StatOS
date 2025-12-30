import { cachedResponse, errorResponse } from "@/lib/api-utils";
import { getAllWritingPostsAsNotionItems } from "@/lib/writing/fs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const cursor = searchParams.get("cursor");

    const allItems = getAllWritingPostsAsNotionItems();

    // Simple pagination: if cursor is provided, find the index and return next page
    let startIndex = 0;
    if (cursor) {
      const cursorIndex = allItems.findIndex((item) => item.id === cursor);
      if (cursorIndex >= 0) {
        startIndex = cursorIndex + 1;
      }
    }

    const items = allItems.slice(startIndex, startIndex + limit);
    const nextCursor = startIndex + limit < allItems.length ? items[items.length - 1]?.id || null : null;

    return cachedResponse({ items, nextCursor }, 86400); // 24 hour cache
  } catch (error) {
    console.error("Error fetching writing posts:", error);
    return errorResponse("Failed to fetch writing posts");
  }
}
