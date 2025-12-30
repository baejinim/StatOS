import { ServerClient } from "postmark";

import { HackerNewsPost } from "@/types/hackernews";

/**
 * Email service for sending HN digest emails via Postmark
 */

// Email constants
export const BASE_EMAIL = "hi@brianlovin.com";

export const BASE_URL =
  process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://brianlovin.com";

const POSTMARK_TEMPLATE_ID = 18037634;

// Lazy initialization of Postmark client to avoid build-time errors
let postmarkClient: ServerClient | null = null;

function getPostmarkClient(): ServerClient {
  if (!postmarkClient) {
    if (!process.env.POSTMARK_CLIENT_ID) {
      throw new Error("POSTMARK_CLIENT_ID environment variable is not set");
    }
    postmarkClient = new ServerClient(process.env.POSTMARK_CLIENT_ID);
  }
  return postmarkClient;
}

export interface DigestEmailData {
  to: string;
  date: string;
  posts: HackerNewsPost[];
  unsubscribeUrl: string;
}

/**
 * Send a Hacker News digest email to a subscriber
 */
export async function sendHNDigestEmail({ to, date, posts, unsubscribeUrl }: DigestEmailData) {
  const client = getPostmarkClient();
  const result = await client.sendEmailWithTemplate({
    From: BASE_EMAIL,
    To: to,
    TemplateId: POSTMARK_TEMPLATE_ID,
    TemplateModel: {
      date,
      posts,
      unsubscribe_url: unsubscribeUrl,
    },
  });

  console.log(`✅ Sent HN digest to ${to}`, {
    messageId: result.MessageID,
    submittedAt: result.SubmittedAt,
  });

  return result;
}
