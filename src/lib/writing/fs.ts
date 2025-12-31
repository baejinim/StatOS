import fs from "fs";
import matter from "gray-matter";
import katex from "katex";
import path from "path";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { visit } from "unist-util-visit";
import { z } from "zod";

import type { NotionItem, ProcessedBlock, RichTextContent } from "@/lib/writing/types";

const writingDirectory = path.join(process.cwd(), "src/content/writing");

// Valid categories whitelist
const VALID_CATEGORIES = ["mathstat", "regression", "projects"] as const;

// Frontmatter schema with validation
const FrontmatterSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine((date) => {
      const d = new Date(date);
      return !isNaN(d.getTime());
    }, "Date must be a valid date"),
  category: z.enum(VALID_CATEGORIES, {
    message: `Category must be one of: ${VALID_CATEGORIES.join(", ")}`,
  }),
  slug: z.string().optional(),
  tags: z.array(z.string()).optional(),
  summary: z.string().optional(),
  excerpt: z.string().optional(),
  featureImage: z.string().url().optional().or(z.literal("")),
});

export type WritingPostFrontmatter = z.infer<typeof FrontmatterSchema>;

export interface WritingPost {
  slug: string;
  frontmatter: WritingPostFrontmatter;
  content: string;
  searchText: string; // For full-text search (title + summary + tags + content)
}

/**
 * Normalize and create a URL-safe slug from a string
 * Handles Korean, special characters, etc.
 */
function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFD") // Decompose characters (e.g., é -> e + ´)
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^\w\s-]/g, "") // Remove special characters except word chars, spaces, hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Extract plain text from markdown content (for search indexing)
 * Removes markdown syntax and normalizes whitespace
 */
function extractPlainTextFromMarkdown(markdown: string): string {
  const processor = remark().use(remarkGfm).use(remarkMath);
  const tree = processor.parse(markdown);
  const textParts: string[] = [];

  function extractText(node: any): void {
    // Skip code blocks and math expressions for search indexing
    if (node.type === "code" || node.type === "math" || node.type === "inlineMath") {
      return;
    }
    if (node.type === "text") {
      textParts.push(node.value);
    }
    if (node.children) {
      node.children.forEach(extractText);
    }
  }

  visit(tree, extractText);

  // Normalize: remove markdown syntax remnants, normalize whitespace
  return textParts
    .join(" ")
    .replace(/[#*_`\[\]()]/g, " ") // Remove markdown syntax characters
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}

/**
 * Convert markdown AST to ProcessedBlock format with math support
 */
function markdownToBlocks(markdown: string): ProcessedBlock[] {
  // Parse markdown with math support
  const processor = remark().use(remarkGfm).use(remarkMath);
  const tree = processor.parse(markdown);

  const blocks: ProcessedBlock[] = [];
  let blockIdCounter = 0;

  // Map to store rendered math HTML by node
  const mathHtmlMap = new Map<any, string>();

  // First pass: render math expressions with KaTeX
  visit(tree, (node: any) => {
    if (node.type === "inlineMath") {
      try {
        const html = katex.renderToString(node.value, {
          throwOnError: false,
          displayMode: false,
        });
        mathHtmlMap.set(node, html);
      } catch (error) {
        console.warn("KaTeX rendering error for inline math:", node.value, error);
        mathHtmlMap.set(node, node.value);
      }
    } else if (node.type === "math") {
      try {
        const html = katex.renderToString(node.value, {
          throwOnError: false,
          displayMode: true,
        });
        mathHtmlMap.set(node, html);
      } catch (error) {
        console.warn("KaTeX rendering error for block math:", node.value, error);
        mathHtmlMap.set(node, node.value);
      }
    }
  });

  function createRichText(
    text: string,
    annotations?: Partial<RichTextContent["annotations"]>,
  ): RichTextContent {
    return {
      type: "text",
      text: {
        content: text,
      },
      annotations: {
        bold: annotations?.bold || false,
        italic: annotations?.italic || false,
        strikethrough: annotations?.strikethrough || false,
        underline: annotations?.underline || false,
        code: annotations?.code || false,
        color: "default",
      },
    };
  }

  // Helper to check if node contains math
  function hasMath(node: any): boolean {
    let found = false;
    visit(node, (n: any) => {
      if (n.type === "math" || n.type === "inlineMath") {
        found = true;
      }
    });
    return found;
  }

  // Removed unused rich-text-with-math helper to simplify pipeline

  // Helper to check if paragraph contains block math (should be split)
  function hasBlockMath(node: any): boolean {
    let found = false;
    visit(node, (n: any) => {
      if (n.type === "math") {
        found = true;
      }
    });
    return found;
  }

  // Build HTML for a paragraph node that may contain inline math
  function buildParagraphHtml(node: any): string {
    let html = "";

    function traverse(n: any): void {
      if (!n) return;
      if (n.type === "text") {
        html += n.value;
      } else if (n.type === "inlineMath") {
        const mathHtml = mathHtmlMap.get(n) || n.value;
        html += mathHtml;
      } else if (n.type === "strong") {
        html += "<strong>";
        if (n.children) n.children.forEach(traverse);
        html += "</strong>";
      } else if (n.type === "emphasis") {
        html += "<em>";
        if (n.children) n.children.forEach(traverse);
        html += "</em>";
      } else if (n.type === "inlineCode") {
        html += "<code>";
        if (n.children) n.children.forEach(traverse);
        html += "</code>";
      } else if (n.type === "link") {
        const href = (n.url || "").replace(/\"/g, "&quot;");
        html += `<a href="${href}" target="_blank" rel="noopener noreferrer" class="link-body">`;
        if (n.children) n.children.forEach(traverse);
        html += "</a>";
      } else if (n.children) {
        n.children.forEach(traverse);
      }
    }

    if (node.children) node.children.forEach(traverse);
    return html;
  }

  function processNode(node: any): void {
    const id = `block-${blockIdCounter++}`;

    switch (node.type) {
      case "heading":
        const level = node.depth;
        const headingText = extractTextFromNode(node);
        blocks.push({
          id,
          type: level === 1 ? "heading_1" : level === 2 ? "heading_2" : "heading_3",
          content: [createRichText(headingText)],
        });
        break;

      case "paragraph":
        const paraText = extractTextFromNode(node);
        if (paraText.trim()) {
          // Check if paragraph contains block math - if so, split it
          if (hasBlockMath(node)) {
            // Split paragraph: extract block math as separate blocks
            let currentParagraph: any[] = [];

            function processParagraphChildren(children: any[]): void {
              for (const child of children) {
                if (child.type === "math") {
                  // Flush current paragraph if it has content
                  if (currentParagraph.length > 0) {
                    const paraNode = { ...node, children: currentParagraph };
                    const paraHasInlineMath = hasMath(paraNode) && !hasBlockMath(paraNode);
                    if (paraHasInlineMath) {
                      const htmlContent = buildParagraphHtml(paraNode);
                      blocks.push({
                        id: `block-${blockIdCounter++}`,
                        type: "paragraph",
                        content: [],
                        mathHtml: htmlContent,
                      });
                    } else {
                      blocks.push({
                        id: `block-${blockIdCounter++}`,
                        type: "paragraph",
                        content: extractRichTextFromNode(paraNode),
                      });
                    }
                    currentParagraph = [];
                  }
                  // Add block math as separate block
                  const blockMathHtml = mathHtmlMap.get(child) || child.value;
                  blocks.push({
                    id: `block-${blockIdCounter++}`,
                    type: "math",
                    content: [],
                    mathHtml: blockMathHtml,
                  });
                } else {
                  currentParagraph.push(child);
                }
              }
            }

            processParagraphChildren(node.children || []);

            // Flush remaining paragraph content
            if (currentParagraph.length > 0) {
              const paraNode = { ...node, children: currentParagraph };
              const paraHasInlineMath = hasMath(paraNode) && !hasBlockMath(paraNode);
              if (paraHasInlineMath) {
                const htmlContent = buildParagraphHtml(paraNode);
                blocks.push({
                  id: `block-${blockIdCounter++}`,
                  type: "paragraph",
                  content: [],
                  mathHtml: htmlContent,
                });
              } else {
                blocks.push({
                  id: `block-${blockIdCounter++}`,
                  type: "paragraph",
                  content: extractRichTextFromNode(paraNode),
                });
              }
            }
          } else if (hasMath(node)) {
            // Paragraph contains only inline math
            const htmlContent = buildParagraphHtml(node);
            blocks.push({
              id,
              type: "paragraph",
              content: [],
              mathHtml: htmlContent,
            });
          } else {
            // Regular paragraph without math
            blocks.push({
              id,
              type: "paragraph",
              content: extractRichTextFromNode(node),
            });
          }
        }
        break;

      case "math":
        // Block math: $$ ... $$ - render as separate block, not inside paragraph
        const blockMathHtml = mathHtmlMap.get(node) || node.value;
        blocks.push({
          id,
          type: "math", // Separate type for block math
          content: [],
          mathHtml: blockMathHtml, // Store HTML without wrapper div (will be added in renderBlocks)
        });
        break;

      case "blockquote":
        blocks.push({
          id,
          type: "quote",
          content: extractRichTextFromNode(node),
        });
        break;

      case "list":
        const isOrdered = node.ordered;
        visit(node, "listItem", (listItem: any) => {
          const itemText = extractTextFromNode(listItem);
          if (itemText.trim()) {
            blocks.push({
              id: `block-${blockIdCounter++}`,
              type: isOrdered ? "numbered_list_item" : "bulleted_list_item",
              content: extractRichTextFromNode(listItem),
            });
          }
        });
        break;

      case "code":
        blocks.push({
          id,
          type: "code",
          content: [createRichText(node.value)],
          language: node.lang || "plaintext",
        });
        break;

      case "thematicBreak":
        blocks.push({
          id,
          type: "divider",
          content: [],
        });
        break;

      case "image":
        blocks.push({
          id,
          type: "image",
          content: [
            {
              type: "text",
              text: {
                content: node.url,
              },
              annotations: {
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
                color: "default",
              },
            },
          ],
        });
        break;
    }
  }

  function extractTextFromNode(node: any): string {
    if (node.type === "text") {
      return node.value;
    }
    if (node.children) {
      return node.children.map((child: any) => extractTextFromNode(child)).join("");
    }
    return "";
  }

  function extractRichTextFromNode(node: any): RichTextContent[] {
    const result: RichTextContent[] = [];

    function traverse(n: any): void {
      if (n.type === "text") {
        result.push(createRichText(n.value));
      } else if (
        n.type === "strong" ||
        n.type === "emphasis" ||
        n.type === "inlineCode" ||
        n.type === "link"
      ) {
        if (n.children) {
          n.children.forEach((child: any) => {
            if (child.type === "text") {
              const annotations: Partial<RichTextContent["annotations"]> = {};
              if (n.type === "strong") annotations.bold = true;
              if (n.type === "emphasis") annotations.italic = true;
              if (n.type === "inlineCode") annotations.code = true;

              const richText = createRichText(child.value, annotations);
              if (n.type === "link") {
                richText.text.link = n.url;
              }
              result.push(richText);
            } else {
              traverse(child);
            }
          });
        }
      } else if (n.children) {
        n.children.forEach(traverse);
      }
    }

    if (node.children) {
      node.children.forEach(traverse);
    }

    return result.length > 0 ? result : [createRichText(extractTextFromNode(node))];
  }

  visit(tree, (node) => {
    if (
      [
        "heading",
        "paragraph",
        "blockquote",
        "list",
        "code",
        "thematicBreak",
        "image",
        "math",
      ].includes(node.type)
    ) {
      processNode(node);
    }
  });

  return blocks;
}

/**
 * Validate and parse frontmatter
 */
function validateFrontmatter(
  data: unknown,
  filePath: string,
  isDev: boolean = process.env.NODE_ENV === "development",
): WritingPostFrontmatter {
  const result = FrontmatterSchema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    const message = `Invalid frontmatter in ${filePath}: ${errors}`;

    if (isDev) {
      console.error(`❌ ${message}`);
      console.error("Frontmatter data:", JSON.stringify(data, null, 2));
    }

    throw new Error(message);
  }

  return result.data;
}

/**
 * Get all writing posts from the file system with validation
 */
export function getAllWritingPosts(): WritingPost[] {
  if (!fs.existsSync(writingDirectory)) {
    return [];
  }

  const files = fs.readdirSync(writingDirectory, { recursive: true });
  const posts: WritingPost[] = [];
  const slugMap = new Map<string, string>(); // slug -> file path (for conflict detection)
  const isDev = process.env.NODE_ENV === "development";

  for (const file of files) {
    if (typeof file === "string" && file.endsWith(".mdx")) {
      const filePath = path.join(writingDirectory, file);
      const fileContents = fs.readFileSync(filePath, "utf8");
      const { data, content } = matter(fileContents);

      // Validate frontmatter
      const frontmatter = validateFrontmatter(data, filePath, isDev);

      // Determine slug: frontmatter slug takes precedence, otherwise normalize from file path
      let slug: string;
      if (frontmatter.slug) {
        slug = normalizeSlug(frontmatter.slug);
      } else {
        // Extract from file path: remove .mdx, normalize directory separators
        const baseName = file.replace(/\.mdx$/, "").replace(/\//g, "-");
        slug = normalizeSlug(baseName);
      }

      // Check for slug conflicts
      if (slugMap.has(slug)) {
        const existingFile = slugMap.get(slug);
        const message = `Slug conflict: "${slug}" is used by both "${filePath}" and "${existingFile}"`;

        if (isDev) {
          console.error(`❌ ${message}`);
        }

        throw new Error(message);
      }

      slugMap.set(slug, filePath);

      // Extract plain text for search indexing
      const plainText = extractPlainTextFromMarkdown(content);
      const searchText = [
        frontmatter.title,
        frontmatter.summary || "",
        frontmatter.excerpt || "",
        frontmatter.tags?.join(" ") || "",
        plainText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      posts.push({
        slug,
        frontmatter,
        content,
        searchText,
      });
    }
  }

  return posts.sort((a, b) => {
    const dateA = new Date(a.frontmatter.date).getTime();
    const dateB = new Date(b.frontmatter.date).getTime();
    return dateB - dateA; // Sort by date descending
  });
}

/**
 * Get a writing post by slug
 */
export function getWritingPostBySlug(slug: string): WritingPost | null {
  const posts = getAllWritingPosts();
  return posts.find((post) => post.slug === slug) || null;
}

/**
 * Convert a WritingPost to NotionItem format
 */
export function writingPostToNotionItem(
  post: WritingPost,
): NotionItem & { tags?: string[]; searchText?: string } {
  return {
    id: post.slug,
    title: post.frontmatter.title,
    category: post.frontmatter.category, // Already validated, guaranteed to exist
    status: "Published",
    createdTime: post.frontmatter.date,
    published: post.frontmatter.date,
    slug: post.slug,
    excerpt: post.frontmatter.excerpt || post.frontmatter.summary || "",
    featureImage: post.frontmatter.featureImage,
    tags: post.frontmatter.tags || [],
    searchText: post.searchText,
  } as NotionItem & { tags?: string[]; searchText?: string };
}

/**
 * Convert a WritingPost to ProcessedBlock format for rendering
 */
export function writingPostToBlocks(post: WritingPost): ProcessedBlock[] {
  return markdownToBlocks(post.content);
}

/**
 * Get all writing posts as NotionItem format
 */
export function getAllWritingPostsAsNotionItems(): NotionItem[] {
  return getAllWritingPosts().map(writingPostToNotionItem);
}

/**
 * Get writing post content by slug (compatible with existing API)
 */
export function getWritingPostContentBySlug(
  slug: string,
): { blocks: ProcessedBlock[]; metadata: NotionItem } | null {
  const post = getWritingPostBySlug(slug);
  if (!post) {
    return null;
  }

  return {
    blocks: writingPostToBlocks(post),
    metadata: writingPostToNotionItem(post),
  };
}
