import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  getCached,
  setCache,
  clearCache,
  invalidateCache,
  getCacheStats,
} from "@/lib/fetch-cache";

describe("Fetch Cache", () => {
  beforeEach(() => {
    // Clear cache before each test
    clearCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("setCache and getCached", () => {
    it("should store and retrieve data from cache", () => {
      const key = "test-key";
      const data = { name: "test", value: 123 };

      setCache(key, data);
      const cached = getCached(key);

      expect(cached).toEqual(data);
    });

    it("should return null for non-existent key", () => {
      const cached = getCached("non-existent");
      expect(cached).toBeNull();
    });

    it("should return null for expired cache", () => {
      vi.useFakeTimers();

      const key = "expiring-key";
      const data = { test: true };

      setCache(key, data, 1000); // 1 second TTL

      // Verify it's cached initially
      expect(getCached(key)).toEqual(data);

      // Advance time past TTL
      vi.advanceTimersByTime(1100);

      // Should return null after expiration
      expect(getCached(key)).toBeNull();
    });
  });

  describe("clearCache", () => {
    it("should clear all cache when called without pattern", () => {
      setCache("key1", { a: 1 });
      setCache("key2", { b: 2 });
      setCache("key3", { c: 3 });

      clearCache();

      expect(getCached("key1")).toBeNull();
      expect(getCached("key2")).toBeNull();
      expect(getCached("key3")).toBeNull();
    });

    it("should clear only matching keys when pattern is provided", () => {
      setCache("api/users", { users: [] });
      setCache("api/transactions", { transactions: [] });
      setCache("config", { setting: true });

      clearCache("api/");

      expect(getCached("api/users")).toBeNull();
      expect(getCached("api/transactions")).toBeNull();
      expect(getCached("config")).toEqual({ setting: true });
    });
  });

  describe("invalidateCache", () => {
    it("should invalidate multiple patterns", () => {
      setCache("GET:/api/users", { users: [] });
      setCache("GET:/api/transactions", { transactions: [] });
      setCache("GET:/api/cards", { cards: [] });

      invalidateCache("users", "transactions");

      expect(getCached("GET:/api/users")).toBeNull();
      expect(getCached("GET:/api/transactions")).toBeNull();
      expect(getCached("GET:/api/cards")).toEqual({ cards: [] });
    });
  });

  describe("getCacheStats", () => {
    it("should return cache statistics", () => {
      setCache("key1", { a: 1 });
      setCache("key2", { b: 2 });

      const stats = getCacheStats();

      expect(stats.size).toBe(2);
      expect(stats.entries).toHaveLength(2);
      expect(stats.entries[0]).toHaveProperty("key");
      expect(stats.entries[0]).toHaveProperty("age");
      expect(stats.entries[0]).toHaveProperty("ttl");
      expect(stats.entries[0]).toHaveProperty("valid");
    });

    it("should mark expired entries as invalid", () => {
      vi.useFakeTimers();

      setCache("valid-key", { test: true }, 10000); // 10 second TTL
      setCache("expiring-key", { test: true }, 1000); // 1 second TTL

      vi.advanceTimersByTime(1100);

      const stats = getCacheStats();

      // Note: getCacheStats returns current state, doesn't clean up
      const validEntry = stats.entries.find((e) => e.key === "valid-key");
      const expiredEntry = stats.entries.find((e) => e.key === "expiring-key");

      expect(validEntry?.valid).toBe(true);
      expect(expiredEntry?.valid).toBe(false);
    });
  });
});
