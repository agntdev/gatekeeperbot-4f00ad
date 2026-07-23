import { MemorySessionStorage } from "./toolkit/index.js";

/**
 * Durable key-value storage for domain data (member records, group settings,
 * moderation logs). Uses the toolkit's MemorySessionStorage internally for the
 * test harness. In production, this would swap to RedisSessionStorage via env.
 *
 * Keys are strings (e.g. "member:123:456", "group:123:settings").
 * Values are JSON-serializable objects.
 */

interface StorageRecord {
  [key: string]: unknown;
}

const store = new MemorySessionStorage<StorageRecord>();

export async function getStorage(): Promise<{
  get(key: string): Promise<StorageRecord | undefined>;
  set(key: string, value: StorageRecord): Promise<void>;
  delete(key: string): Promise<void>;
}> {
  return {
    async get(key: string) {
      return store.read(key);
    },
    async set(key: string, value: StorageRecord) {
      await store.write(key, value);
    },
    async delete(key: string) {
      await store.delete(key);
    },
  };
}
