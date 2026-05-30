export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to avoid issues with server components
    const pdf = await import("pdf-parse/lib/pdf-parse.js");
    const data = await pdf.default(buffer);
    return data.text.trim();
  } catch {
    // Fallback: return raw buffer as text (handles plain text uploads)
    return buffer.toString("utf-8").trim();
  }
}
