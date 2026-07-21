import { describe, it, expect, beforeAll, vi } from "vitest";

// Mock JSDOM DOM API components in Node.js environment
class MockImage {
  width = 2400; // Original oversized width
  height = 1800; // Original oversized height
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  _src = "";

  set src(value: string) {
    this._src = value;
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 10);
  }
  get src() {
    return this._src;
  }
}

class MockFileReader {
  onload: ((event: any) => void) | null = null;
  onloadend: (() => void) | null = null;
  result = "data:text/plain;base64,dGVzdC10ZXh0LWNvbnRlbnQ=";
  readAsDataURL(file: any) {
    setTimeout(() => {
      const event = { target: { result: this.result } };
      if (this.onload) this.onload(event);
      if (this.onloadend) this.onloadend();
    }, 10);
  }
}

class MockFile {
  name: string;
  type: string;
  constructor(bits: any[], name: string, options?: any) {
    this.name = name;
    this.type = options?.type || "";
  }
}

// Copy of production client-side image compression logic
function compressImage(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || "");
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve((event.target?.result as string) || "");
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed);
      };
      img.onerror = () => resolve((event.target?.result as string) || "");
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

describe("Client-Side Image Compression Script", () => {
  beforeAll(() => {
    // Inject mock browser APIs into global context
    globalThis.Image = MockImage as any;
    globalThis.FileReader = MockFileReader as any;
    globalThis.File = MockFile as any;

    globalThis.document = {
      createElement: vi.fn().mockImplementation((tag) => {
        if (tag === "canvas") {
          return {
            getContext: vi.fn().mockReturnValue({
              drawImage: vi.fn(),
            }),
            toDataURL: vi.fn().mockReturnValue("data:image/jpeg;base64,mocked_compressed_result"),
            width: 0,
            height: 0,
          };
        }
        return {};
      }),
    } as any;
  });

  it("should fall back directly to base64 FileReader for non-image files", async () => {
    const file = new File(["test-text-content"], "notes.txt", { type: "text/plain" });
    const res = await compressImage(file);
    expect(res).toContain("data:text/plain;base64,");
  });

  it("should draw original image to canvas and export base64 compressed data URL", async () => {
    const file = new File(["dummy-img-bits"], "screenshot.png", { type: "image/png" });
    const res = await compressImage(file, 1200, 1200, 0.75);
    
    expect(res).toBe("data:image/jpeg;base64,mocked_compressed_result");
  });

  it("should calculate correct down-scaled bounds while preserving landscape aspect ratio", async () => {
    const file = new File(["dummy-img-bits"], "screenshot.png", { type: "image/png" });

    // Set canvas dimensions tracker
    let lastWidth = 0;
    let lastHeight = 0;

    const mockCanvas = {
      getContext: vi.fn().mockReturnValue({
        drawImage: vi.fn(),
      }),
      toDataURL: vi.fn().mockReturnValue("data:image/jpeg;base64,mocked_compressed_result"),
      set width(val) { lastWidth = val; },
      get width() { return lastWidth; },
      set height(val) { lastHeight = val; },
      get height() { return lastHeight; }
    };

    vi.mocked(document.createElement).mockReturnValue(mockCanvas as any);

    await compressImage(file, 1200, 1200);

    // Initial width 2400, height 1800
    // Width > Height -> Limit by MaxWidth = 1200
    // New Height = 1800 * 1200 / 2400 = 900
    expect(lastWidth).toBe(1200);
    expect(lastHeight).toBe(900);
  });
});
