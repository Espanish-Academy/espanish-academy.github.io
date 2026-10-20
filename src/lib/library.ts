/**
 * Helpers for Google Drive links.
 */
export const driveFolderUrl = (id: string) => `https://drive.google.com/drive/folders/${id}`
export const driveEmbedUrl = (id: string) => `https://drive.google.com/embeddedfolderview?id=${id}#grid`

/** Accepts a Drive folder link (or just the id) and returns the folder id. */
export function parseDriveFolder(input: string): string | null {
  const v = input.trim()
  const m = v.match(/\/folders\/([A-Za-z0-9_-]{10,})/) ?? v.match(/[?&]id=([A-Za-z0-9_-]{10,})/) ?? v.match(/^([A-Za-z0-9_-]{20,})$/)
  return m ? m[1] : null
}

/** Reads a Drive file or folder link. Returns the id and whether it is a folder. */
export function parseDriveLink(input: string): { id: string; folder: boolean } | null {
  const v = input.trim()
  const f = v.match(/\/folders\/([A-Za-z0-9_-]{10,})/)
  if (f) return { id: f[1], folder: true }
  const d = v.match(/\/d\/([A-Za-z0-9_-]{10,})/) ?? v.match(/[?&]id=([A-Za-z0-9_-]{10,})/)
  return d ? { id: d[1], folder: false } : null
}
