"use client";

import { useEffect, useRef, useState } from "react";

interface PdfCanvasViewerProps {
  readonly blob: Blob;
  readonly className?: string;
}

type LoadState = "loading" | "ready" | "error";

/**
 * Renders a PDF blob as canvas elements using PDF.js.
 * Works on all browsers including mobile Chrome/Brave/Safari
 * which do not support inline PDF in <iframe> or <object>.
 */
export function PdfCanvasViewer({ blob, className }: PdfCanvasViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const canvases: HTMLCanvasElement[] = [];

    async function render() {
      try {
        // Dynamic import so pdfjs-dist is only loaded when preview is opened
        const pdfjsLib = await import("pdfjs-dist");

        // Worker is copied to /public/pdf.worker.min.mjs via the build setup
        // (see next.config.ts or package.json pdf:fonts script).
        // Using an absolute public path works in both dev and production.
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const arrayBuffer = await blob.arrayBuffer();
        if (cancelled) return;

        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        if (cancelled) return;

        setPageCount(pdf.numPages);

        const container = containerRef.current;
        if (!container) return;

        // Clear any previous renders
        container.innerHTML = "";

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          if (cancelled) return;

          const page = await pdf.getPage(pageNum);
          if (cancelled) return;

          // Scale to fill container width (A4 ratio)
          const containerWidth = container.clientWidth || 600;
          const viewport = page.getViewport({ scale: 1 });
          const scale = containerWidth / viewport.width;
          const scaledViewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          canvas.width = scaledViewport.width;
          canvas.height = scaledViewport.height;
          canvas.style.width = "100%";
          canvas.style.display = "block";
          canvas.style.marginBottom = pageNum < pdf.numPages ? "8px" : "0";
          canvas.setAttribute(
            "aria-label",
            `หน้า ${pageNum} จาก ${pdf.numPages}`,
          );
          canvases.push(canvas);
          container.appendChild(canvas);

          const ctx = canvas.getContext("2d");
          if (!ctx) continue;

          await page.render({
            canvas,
            canvasContext: ctx,
            viewport: scaledViewport,
          }).promise;
          if (cancelled) return;
        }

        setLoadState("ready");
      } catch (err) {
        if (!cancelled) {
          console.error("[PdfCanvasViewer] render error", err);
          setLoadState("error");
        }
      }
    }

    void render();

    return () => {
      cancelled = true;
      canvases.forEach((c) => c.remove());
    };
  }, [blob]);

  return (
    <div className={className}>
      {loadState === "loading" && (
        <div className="flex h-full min-h-80 items-center justify-center">
          <div className="text-muted-foreground flex flex-col items-center gap-3">
            <svg
              aria-hidden="true"
              className="size-8 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                d="M4 12a8 8 0 018-8v8H4z"
                fill="currentColor"
              />
            </svg>
            <p className="text-sm">กำลังโหลดตัวอย่าง PDF…</p>
          </div>
        </div>
      )}

      {loadState === "error" && (
        <div className="flex h-full min-h-80 items-center justify-center">
          <p className="text-muted-foreground text-sm">
            ไม่สามารถแสดงตัวอย่างได้ กดดาวน์โหลด PDF เพื่อบันทึกไฟล์
          </p>
        </div>
      )}

      {/* Canvas pages are injected here by the effect */}
      <div
        aria-label={`ตัวอย่างรายงาน PDF (${pageCount} หน้า)`}
        className={loadState !== "ready" ? "hidden" : undefined}
        ref={containerRef}
      />
    </div>
  );
}
