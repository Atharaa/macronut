import { describe, it, expect } from "vitest";
import { ping } from "@/lib/ping";

describe("ping", () => {
  it("returns pong", () => {
    expect(ping()).toBe("pong");
  });
});
