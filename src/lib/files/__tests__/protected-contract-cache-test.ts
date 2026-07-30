import { isValidProtectedContractMetadata } from "@/lib/files/protected-contract-cache";

describe("protected contract cache policy", () => {
  it("accepts only bounded PDF metadata", () => {
    const valid = {
      contractId: "contract-1",
      fileName: "contrato.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1024,
    };

    expect(isValidProtectedContractMetadata(valid)).toBe(true);
    expect(
      isValidProtectedContractMetadata({
        ...valid,
        mimeType: "text/html",
      }),
    ).toBe(false);
    expect(
      isValidProtectedContractMetadata({
        ...valid,
        sizeBytes: 8 * 1024 * 1024 + 1,
      }),
    ).toBe(false);
    expect(
      isValidProtectedContractMetadata({
        ...valid,
        sizeBytes: 0,
      }),
    ).toBe(false);
  });
});
