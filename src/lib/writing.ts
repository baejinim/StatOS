import { InfiniteScrollPage, useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import type { NotionItem } from "@/lib/notion";
import { getAllWritingPostsAsNotionItems } from "@/lib/writing/fs";

export type WritingPage = InfiniteScrollPage<NotionItem>;

export function useWritingPosts() {
  return useInfiniteScroll<NotionItem>((index: number, previousPage: WritingPage | null) => {
    if (previousPage && !previousPage.nextCursor) return null;
    if (index === 0) return `/api/writing?limit=20`;
    return `/api/writing?cursor=${previousPage?.nextCursor}&limit=20`;
  });
}

export async function getAllWritingPosts(): Promise<NotionItem[]> {
  return getAllWritingPostsAsNotionItems();
}
