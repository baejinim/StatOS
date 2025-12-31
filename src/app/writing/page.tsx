import type { Metadata } from "next";
import Link from "next/link";

import {
  List,
  ListItem,
  ListItemLabel,
  Section,
  SectionHeading,
} from "@/components/shared/ListComponents";
import { PageTitle } from "@/components/Typography";
import { createMetadata } from "@/lib/metadata";
import { getAllWritingPosts } from "@/lib/writing";

export const metadata: Metadata = createMetadata({
  title: "Writing",
  description:
    "Thoughts on design, engineering, and building products. Essays and reflections from Brian Lovin.",
  path: "/writing",
});

export const revalidate = 3600;

export default async function WritingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string; category?: string }>;
}) {
  const params = await searchParams;
  // Normalize search query: trim, lowercase, normalize whitespace
  const searchQuery = (params.q || "").trim().toLowerCase().replace(/\s+/g, " ");
  // Normalize tag and category filters
  const tagFilter = (params.tag || "").trim();
  const categoryFilter = (params.category || "").trim().toLowerCase();

  let posts = await getAllWritingPosts();

  // Apply filters
  posts = posts.filter((post) => {
    // Search query filter (title + summary + tags + content via searchText)
    if (searchQuery) {
      const searchText = (post as any).searchText || "";
      // Normalize search text for comparison
      const normalizedSearchText = searchText.replace(/\s+/g, " ");
      if (!normalizedSearchText.includes(searchQuery)) {
        return false;
      }
    }

    // Tag filter
    if (tagFilter) {
      const postTags = (post as any).tags || [];
      if (!postTags.includes(tagFilter)) return false;
    }

    // Category filter (whitelist validation already done in fs.ts)
    if (categoryFilter) {
      if (post.category?.toLowerCase() !== categoryFilter.toLowerCase()) return false;
    }

    // Ensure category is valid (should never happen due to validation, but safety check)
    if (!post.category || !["mathstat", "regression", "projects"].includes(post.category)) {
      console.warn(`Post ${post.slug} has invalid category: ${post.category}`);
      return false;
    }

    return true;
  });

  // Group posts by year
  const postsByYear: Record<string, typeof posts> = {};
  posts.forEach((post) => {
    const publishedDate = post.published || post.createdTime;
    const year = new Date(publishedDate).getFullYear().toString();
    if (!postsByYear[year]) {
      postsByYear[year] = [];
    }
    postsByYear[year].push(post);
  });

  // Sort years in descending order
  const sortedYears = Object.keys(postsByYear).sort((a, b) => parseInt(b) - parseInt(a));

  // (Filters computed from params; global tag/category lists removed to keep code minimal)

  return (
    <div data-scrollable className="flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-xl flex-1 flex-col gap-16 py-16 leading-[1.6]">
        <Section>
          <PageTitle>Writing</PageTitle>
          {/* Simple filter UI - can be enhanced later */}
          {(searchQuery || tagFilter || categoryFilter) && (
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {searchQuery && (
                <span className="bg-tertiary rounded px-2 py-1">Search: {searchQuery}</span>
              )}
              {tagFilter && <span className="bg-tertiary rounded px-2 py-1">Tag: {tagFilter}</span>}
              {categoryFilter && (
                <span className="bg-tertiary rounded px-2 py-1">Category: {categoryFilter}</span>
              )}
              <Link href="/writing" className="text-secondary hover:text-primary underline">
                Clear filters
              </Link>
            </div>
          )}
        </Section>
        {sortedYears.length > 0 ? (
          sortedYears.map((year) => (
            <Section key={year}>
              <SectionHeading>{year}</SectionHeading>
              <List>
                {postsByYear[year]
                  .filter((post) => post.slug) // Only show posts that have slugs
                  .map((post) => (
                    <ListItem key={post.id} href={`/writing/${post.slug}`}>
                      <ListItemLabel className="line-clamp-none">{post.title}</ListItemLabel>
                    </ListItem>
                  ))}
              </List>
            </Section>
          ))
        ) : (
          <Section>
            <p className="text-tertiary">No posts found matching your filters.</p>
          </Section>
        )}
      </div>
    </div>
  );
}
