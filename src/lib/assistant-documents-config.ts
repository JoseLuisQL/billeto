export const ASSISTANT_DOCUMENT_SUPPORTED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ASSISTANT_DOCUMENT_MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
export const ASSISTANT_DOCUMENT_MAX_PDF_PAGES = 6;
export const ASSISTANT_DOCUMENT_DUPLICATE_WINDOW_HOURS = 24;
export const ASSISTANT_DOCUMENT_MIN_CONFIDENCE = 0.72;
export const ASSISTANT_DOCUMENT_STORAGE_DIR = ".data/assistant-documents";

export function isSupportedAssistantDocumentMimeType(value: string) {
  return ASSISTANT_DOCUMENT_SUPPORTED_MIME_TYPES.includes(
    value as (typeof ASSISTANT_DOCUMENT_SUPPORTED_MIME_TYPES)[number]
  );
}
