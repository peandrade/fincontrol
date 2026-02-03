import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  checkRateLimit,
  getClientIp,
  rateLimitPresets,
  rateLimitHeaders,
} from "@/lib/rate-limit";

describe("Rate Limit", () => {
  beforeEach(() => {
    // Reset time mocking between tests
    vi.useRealTimers();
  });

  describe("checkRateLimit", () => {
    it("should allow first request", () => {
      const result = checkRateLimit("192.168.1.1", {
        limit: 5,
        windowSeconds: 60,
        identifier: "test",
      });

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.limit).toBe(5);
    });

    it("should track requests across multiple calls", () => {
      const ip = "192.168.1.2";
      const config = {
        limit: 3,
        windowSeconds: 60,
        identifier: "test-multi",
      };

      const result1 = checkRateLimit(ip, config);
      const result2 = checkRateLimit(ip, config);
      const result3 = checkRateLimit(ip, config);
      const result4 = checkRateLimit(ip, config);

      expect(result1.success).toBe(true);
      expect(result1.remaining).toBe(2);

      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(1);

      expect(result3.success).toBe(true);
      expect(result3.remaining).toBe(0);

      expect(result4.success).toBe(false);
      expect(result4.remaining).toBe(0);
    });

    it("should use different buckets for different identifiers", () => {
      const ip = "192.168.1.3";

      const result1 = checkRateLimit(ip, {
        limit: 1,
        windowSeconds: 60,
        identifier: "bucket-a",
      });

      const result2 = checkRateLimit(ip, {
        limit: 1,
        windowSeconds: 60,
        identifier: "bucket-b",
      });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it("should reset after window expires", async () => {
      vi.useFakeTimers();

      const ip = "192.168.1.4";
      const config = {
        limit: 1,
        windowSeconds: 1, // 1 second window
        identifier: "test-reset",
      };

      const result1 = checkRateLimit(ip, config);
      expect(result1.success).toBe(true);

      const result2 = checkRateLimit(ip, config);
      expect(result2.success).toBe(false);

      // Advance time past the window
      vi.advanceTimersByTime(1100);

      const result3 = checkRateLimit(ip, config);
      expect(result3.success).toBe(true);
    });
  });

  describe("getClientIp", () => {
    it("should extract IP from x-forwarded-for header", () => {
      const request = new Request("http://localhost", {
        headers: {
          "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178",
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe("203.0.113.195");
    });

    it("should extract IP from x-real-ip header", () => {
      const request = new Request("http://localhost", {
        headers: {
          "x-real-ip": "203.0.113.195",
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe("203.0.113.195");
    });

    it("should return unknown when no IP headers present", () => {
      const request = new Request("http://localhost");

      const ip = getClientIp(request);
      expect(ip).toBe("unknown");
    });
  });

  describe("rateLimitPresets", () => {
    it("should have correct auth preset values", () => {
      expect(rateLimitPresets.auth.limit).toBe(5);
      expect(rateLimitPresets.auth.windowSeconds).toBe(60);
    });

    it("should have correct register preset values", () => {
      expect(rateLimitPresets.register.limit).toBe(3);
      expect(rateLimitPresets.register.windowSeconds).toBe(3600);
    });

    it("should have correct passwordReset preset values", () => {
      expect(rateLimitPresets.passwordReset.limit).toBe(3);
      expect(rateLimitPresets.passwordReset.windowSeconds).toBe(300);
    });
  });

  describe("rateLimitHeaders", () => {
    it("should generate correct headers", () => {
      const result = {
        success: true,
        remaining: 4,
        resetIn: 60,
        limit: 5,
      };

      const headers = rateLimitHeaders(result);

      expect(headers["X-RateLimit-Limit"]).toBe("5");
      expect(headers["X-RateLimit-Remaining"]).toBe("4");
      expect(headers["X-RateLimit-Reset"]).toBe("60");
    });
  });
});
