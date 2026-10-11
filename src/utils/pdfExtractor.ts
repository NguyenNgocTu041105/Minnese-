import * as pdfjsLib from 'pdfjs-dist';

if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }
}

/**
 * Extracts plain text from a PDF file using pdfjs-dist text layer
 */
export async function extractTextFromPdf(
  file: File,
  maxPages = 150,
  onProgress?: (current: number, total: number) => void
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const totalPages = Math.min(pdf.numPages, maxPages);
  const textChunks: string[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    try {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items
        .map((item: any) => (item.str ? item.str : ''))
        .filter(Boolean);

      const pageText = pageStrings.join(' ').trim();
      if (pageText) {
        textChunks.push(`--- Trang ${pageNum} ---\n${pageText}`);
      }
      if (onProgress) {
        onProgress(pageNum, totalPages);
      }
    } catch (pageErr) {
      console.warn(`Lỗi đọc trang PDF ${pageNum}:`, pageErr);
    }
  }

  return textChunks.join('\n\n');
}

/**
 * Renders PDF pages to base64 JPEG images for Gemini Vision OCR
 * (Used when PDF is a scanned document/photocopy with no digital text layer)
 */
export async function renderPdfPagesToImages(
  file: File,
  maxPages = 8,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const totalPages = Math.min(pdf.numPages, maxPages);
  const base64Images: string[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    try {
      const page = await pdf.getPage(pageNum);
      // Render with optimized scale to keep payload under limits while retaining sharp Chinese character clarity
      const baseViewport = page.getViewport({ scale: 1.0 });
      const maxDim = Math.max(baseViewport.width, baseViewport.height);
      const targetScale = maxDim > 1200 ? 1200 / maxDim : 1.0;
      const viewport = page.getViewport({ scale: targetScale });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      if (ctx) {
        // Draw white background before rendering to prevent transparent background issues
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: ctx,
          viewport: viewport,
          canvas: canvas,
        } as any).promise;

        const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
        base64Images.push(dataUrl);
      }

      if (onProgress) {
        onProgress(pageNum, totalPages);
      }
    } catch (err) {
      console.warn(`Lỗi render trang PDF ${pageNum} thành ảnh:`, err);
    }
  }

  return base64Images;
}

/**
 * Converts an image file (PNG, JPG, WebP) to base64 data URL
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
