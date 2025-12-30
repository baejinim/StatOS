import { Redis } from "@upstash/redis";

/**
 * Email subscription management using Upstash Redis
 */

// TypeScript interface for subscription rows (keeping interface for compatibility)
export interface EmailSubscriptionRow {
  email: string;
  type: string;
}

// Lazy initialization of Redis client to avoid build-time errors
let redis: Redis | null = null;

function getRedisClient(): Redis {
  if (!redis) {
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      throw new Error("UPSTASH_REDIS_REST_URL environment variable is not set");
    }
    if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error("UPSTASH_REDIS_REST_TOKEN environment variable is not set");
    }
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

// Redis key for HN subscribers set
const HN_SUBSCRIBERS_KEY = "hn:subscribers";

/**
 * Fetch all email subscribers for Hacker News digest
 */
export async function getHNSubscribers(): Promise<EmailSubscriptionRow[]> {
  const client = getRedisClient();
  const emails = await client.smembers(HN_SUBSCRIBERS_KEY);
  return emails.map((email) => ({ email, type: "HACKER_NEWS" }));
}

/**
 * Fetch a single subscriber by email
 */
export async function getSubscriberByEmail(email: string): Promise<EmailSubscriptionRow | null> {
  const client = getRedisClient();
  const exists = await client.sismember(HN_SUBSCRIBERS_KEY, email);
  return exists ? { email, type: "HACKER_NEWS" } : null;
}

/**
 * Delete a subscription by email
 */
export async function deleteSubscription(email: string): Promise<boolean> {
  const client = getRedisClient();
  const removed = await client.srem(HN_SUBSCRIBERS_KEY, email);
  return removed > 0;
}

/**
 * Get count of HN subscribers
 */
export async function getHNSubscriberCount(): Promise<number> {
  const client = getRedisClient();
  return await client.scard(HN_SUBSCRIBERS_KEY);
}

/**
 * Create a new subscription
 */
export async function createSubscription(
  email: string,
): Promise<{ success: boolean; alreadyExists: boolean }> {
  const client = getRedisClient();
  // Check if subscription already exists
  const exists = await client.sismember(HN_SUBSCRIBERS_KEY, email);
  if (exists) {
    return { success: false, alreadyExists: true };
  }

  // Add to subscribers set
  await client.sadd(HN_SUBSCRIBERS_KEY, email);
  return { success: true, alreadyExists: false };
}

/**
 * Bulk add subscribers (for backfill)
 */
export async function bulkAddSubscribers(emails: string[]): Promise<number> {
  if (emails.length === 0) return 0;
  const client = getRedisClient();
  // Use pipeline for bulk operations
  const pipeline = client.pipeline();
  for (const email of emails) {
    pipeline.sadd(HN_SUBSCRIBERS_KEY, email);
  }
  await pipeline.exec();
  return emails.length;
}
