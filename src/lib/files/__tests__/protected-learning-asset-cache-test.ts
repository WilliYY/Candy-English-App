import { isValidProtectedLearningAssetMetadata } from "@/lib/files/protected-learning-asset-cache";

describe("protected learning asset metadata", () => {
  it("accepts supported files inside the safe size limit", () => {
    expect(
      isValidProtectedLearningAssetMetadata({
        assetId: "activity-1",
        fileName: "colors.pdf",
        mimeType: "application/pdf",
        sizeBytes: 2048,
      }),
    ).toBe(true);
  });

  it("rejects empty, unsupported or oversized metadata", () => {
    expect(
      isValidProtectedLearningAssetMetadata({
        assetId: "",
        fileName: "colors.pdf",
        mimeType: "application/pdf",
        sizeBytes: 2048,
      }),
    ).toBe(false);
    expect(
      isValidProtectedLearningAssetMetadata({
        assetId: "activity-1",
        fileName: "colors.pdf",
        mimeType: "application/pdf",
        sizeBytes: 51 * 1024 * 1024,
      }),
    ).toBe(false);
  });
});
