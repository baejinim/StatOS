import { ImageResponse } from "@vercel/og";
import fs from "fs/promises";
import path from "path";

// Timeout helper for network requests
const FONT_TIMEOUT_MS = 5000;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms),
  );
  return Promise.race([promise, timeout]);
}

// OG Image dimensions
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
export const OG_PADDING = 56;

// Colors (light mode only)
export const PRIMARY_COLOR = "#171717";
export const TERTIARY_COLOR = "#BFBFBF";

// Font sizes
export const TITLE_SIZE = 64;
export const URL_SIZE = 32;

// Avatar
export const AVATAR_SIZE = 100;

// Font loading from Google Fonts with timeout protection, validation, and retry logic
async function loadGoogleFont(
  font: string,
  weight: number,
  text: string,
  retries: number = 3,
): Promise<ArrayBuffer> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const url = `https://fonts.googleapis.com/css2?family=${font}:wght@${weight}&text=${encodeURIComponent(text)}`;

      const cssResponse = await withTimeout(fetch(url), FONT_TIMEOUT_MS);
      const css = await cssResponse.text();
      const resource = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);

      if (!resource) {
        throw new Error(`Failed to parse font URL from CSS for ${font} ${weight}`);
      }

      const fontUrl = resource[1];
      // Add timestamp to bypass caching issues
      const fontUrlWithCache = `${fontUrl}&t=${Date.now()}`;
      const fontResponse = await withTimeout(fetch(fontUrlWithCache), FONT_TIMEOUT_MS);

      if (!fontResponse.ok) {
        throw new Error(`Failed to fetch font: ${fontUrl} (status: ${fontResponse.status})`);
      }

      const arrayBuffer = await fontResponse.arrayBuffer();

      // Validate font data is not empty and has reasonable size
      if (arrayBuffer.byteLength === 0) {
        throw new Error(`Font data is empty for ${font} ${weight}`);
      }

      if (arrayBuffer.byteLength < 1000) {
        throw new Error(
          `Font data too small (${arrayBuffer.byteLength} bytes) for ${font} ${weight}`,
        );
      }

      console.log(`✓ Loaded font ${font} ${weight} (${arrayBuffer.byteLength} bytes)`);
      return arrayBuffer;
    } catch (error) {
      console.error(
        `[Attempt ${attempt}/${retries}] Font loading failed for ${font} ${weight}:`,
        error,
      );

      if (attempt === retries) {
        throw new Error(
          `Failed to load font ${font} ${weight} after ${retries} attempts: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      // Exponential backoff before retry
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
    }
  }

  throw new Error(`Font loading failed for ${font} ${weight}`);
}

// Load avatar as base64 (async file I/O)
export async function loadAvatar(): Promise<string | null> {
  const avatarPath = path.join(process.cwd(), "public/img/avatar.jpg");

  try {
    const avatarBuffer = await fs.readFile(avatarPath);
    // Only use avatar if it's reasonably sized (< 100KB for OG)
    if (avatarBuffer.length > 100 * 1024) {
      console.warn(`Avatar file too large (${avatarBuffer.length} bytes), skipping`);
      return null;
    }
    const base64 = avatarBuffer.toString("base64");
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.warn(`Failed to load avatar from ${avatarPath}:`, error);
    return null;
  }
}

interface OGImageProps {
  title: string;
  url: string;
}

/**
 * Truncate title for OG images to fit within specified number of lines
 * At 64px font size, ~150 characters fits comfortably in 3 lines
 */
export function truncateOGTitle(title: string, maxLines: number = 3): string {
  // Approximate characters per line at 64px font size on 1088px width
  const charsPerLine = 50;
  const maxLength = charsPerLine * maxLines;

  if (title.length <= maxLength) return title;

  const truncated = title.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  return lastSpace > 0 ? `${truncated.slice(0, lastSpace)}...` : `${truncated}...`;
}

export async function generateOGImage({ title, url }: OGImageProps): Promise<ImageResponse> {
  try {
    console.log(`[OG] Generating image for: "${title}"`);

    const avatarData = await loadAvatar();

    console.log(`[OG] All assets loaded successfully`);

    return new ImageResponse(
      <div
        style={{
          width: OG_WIDTH,
          height: OG_HEIGHT,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: OG_PADDING,
          backgroundColor: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Avatar at the top */}
        {avatarData && (
          <div style={{ display: "flex" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarData}
              alt="Avatar"
              width={AVATAR_SIZE}
              height={AVATAR_SIZE}
              style={{
                borderRadius: "50%",
              }}
            />
          </div>
        )}

        {/* Title and URL at the bottom */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: TITLE_SIZE,
              fontWeight: 700,
              color: PRIMARY_COLOR,
              lineHeight: 1.2,
              letterSpacing: "-0.12rem",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {title.length > 80 ? title.slice(0, 80) + "..." : title}
          </div>
          <div
            style={{
              fontSize: URL_SIZE,
              fontWeight: 400,
              color: TERTIARY_COLOR,
            }}
          >
            {url}
          </div>
        </div>
      </div>,
    );
  } catch (error) {
    console.error(`[OG] Error generating image for "${title}":`, error);
    throw error;
  }
}
