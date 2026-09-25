import { describe, expect, it } from "vitest";

import { resolveAuthAvatarUrl } from "@/auth/user-profile";

describe("resolveAuthAvatarUrl", () => {
  it("accepts trusted Google and GitHub avatar URLs", () => {
    expect(
      resolveAuthAvatarUrl({
        avatar_url: "https://lh3.googleusercontent.com/a/example=s96-c",
      }),
    ).toBe("https://lh3.googleusercontent.com/a/example=s96-c");

    expect(
      resolveAuthAvatarUrl({
        picture: "https://avatars.githubusercontent.com/u/12345?v=4",
      }),
    ).toBe("https://avatars.githubusercontent.com/u/12345?v=4");
  });

  it("rejects untrusted, insecure, and malformed avatar URLs", () => {
    expect(
      resolveAuthAvatarUrl({ avatar_url: "https://example.com/avatar.png" }),
    ).toBeNull();
    expect(
      resolveAuthAvatarUrl({
        avatar_url: "http://lh3.googleusercontent.com/a/example",
      }),
    ).toBeNull();
    expect(resolveAuthAvatarUrl({ picture: "not-a-url" })).toBeNull();
  });
});
