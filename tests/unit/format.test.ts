import { describe, it, expect } from "vitest";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

describe("Unit Tests: formatBytes", () => {
  it("0 bytes を正しくフォーマットする", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("バイト単位を正しくフォーマットする", () => {
    expect(formatBytes(500)).toBe("500 B");
  });

  it("KB単位を正しく変換する", () => {
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(2048)).toBe("2 KB");
  });

  it("MB単位を正しく変換する", () => {
    expect(formatBytes(1024 * 1024)).toBe("1 MB");
    expect(formatBytes(1.5 * 1024 * 1024)).toBe("1.5 MB");
  });
});
