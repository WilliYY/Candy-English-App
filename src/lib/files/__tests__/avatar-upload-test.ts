import { isValidAvatarUploadMetadata } from "@/lib/files/avatar-upload";

describe("avatar upload policy", () => {
  it("accepts only a bounded optimized JPEG", () => {
    const valid = {
      mimeType: "image/jpeg" as const,
      sizeBytes: 512 * 1024,
      uri: "file:///cache/avatar.jpg",
    };

    expect(isValidAvatarUploadMetadata(valid)).toBe(true);
    expect(
      isValidAvatarUploadMetadata({
        ...valid,
        mimeType: "image/png" as "image/jpeg",
      }),
    ).toBe(false);
    expect(
      isValidAvatarUploadMetadata({
        ...valid,
        sizeBytes: 2 * 1024 * 1024 + 1,
      }),
    ).toBe(false);
    expect(
      isValidAvatarUploadMetadata({
        ...valid,
        sizeBytes: 0,
      }),
    ).toBe(false);
  });
});
