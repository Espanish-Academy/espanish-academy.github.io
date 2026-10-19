/**
 * The teacher's shared Google Drive folder ("Para alumnos", owned by the academy's own Google account).
 * It is shared as "anyone with the link can view", so the app can show it without any sign-in.
 * Add a new section by adding a line here (the folder id is the last part of its Drive link).
 */
export const LIBRARY_ROOT = '1OPd7XdQ1zv69_Bynm3BSy2ZfEP5OWGyx'

export const LIBRARY: { slug: string; id: string; emoji: string; title: string }[] = [
  { slug: 'theory', id: '19kWMecG0lA4mUbOr1aQVEQReRTq1yief', emoji: '📘', title: 'Theory' },
  { slug: 'videos', id: '1eoyBLpABqglhQaaUx2D29yW6HUpl1Jl0', emoji: '🎬', title: 'Videos' },
  { slug: 'exercises', id: '1do9hPOsdKqEOqAdaAaQo_eNsYKMLx49E', emoji: '✏️', title: 'Exercises' },
  { slug: 'songs', id: '1vy-QtSzFFKZmgPD7MHLL6L_33s7T6PWd', emoji: '🎵', title: 'Songs' },
]

export const driveFolderUrl = (id: string) => `https://drive.google.com/drive/folders/${id}`
export const driveEmbedUrl = (id: string) => `https://drive.google.com/embeddedfolderview?id=${id}#grid`

/** Accepts a Drive folder link (or just the id) and returns the folder id. */
export function parseDriveFolder(input: string): string | null {
  const v = input.trim()
  const m = v.match(/\/folders\/([A-Za-z0-9_-]{10,})/) ?? v.match(/[?&]id=([A-Za-z0-9_-]{10,})/) ?? v.match(/^([A-Za-z0-9_-]{20,})$/)
  return m ? m[1] : null
}
