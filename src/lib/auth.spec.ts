import { describe, expect, it } from "vitest";
import { signSession, verifySession } from "./session-token";

describe("auth session token", () => {
  it("signs and verifies a valid session", async () => {
    const token = await signSession({
      id: "user-123",
      email: "demo@signalforge.dev",
      role: "user"
    });

    const verified = await verifySession(token);
    expect(verified).toEqual({
      id: "user-123",
      email: "demo@signalforge.dev",
      role: "user"
    });
  });
});
