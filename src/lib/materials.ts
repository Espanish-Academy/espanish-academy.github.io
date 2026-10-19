import type { MaterialCategory } from './types'

/** The sections of a student's folder. The teacher files things under one of these. */
export const CATEGORIES: { id: MaterialCategory; emoji: string; title: string }[] = [
  { id: 'exercises', emoji: '✏️', title: 'Exercises' },
  { id: 'exams', emoji: '🏆', title: 'Exams' },
  { id: 'homework', emoji: '📝', title: 'Homework' },
  { id: 'presentations', emoji: '🖥️', title: 'Presentations' },
  { id: 'theory', emoji: '📘', title: 'Theory' },
  { id: 'videos', emoji: '🎬', title: 'Videos' },
  { id: 'songs', emoji: '🎵', title: 'Songs' },
]

export const isFolder = (mime?: string | null) => mime === 'application/vnd.google-apps.folder'

export function kindEmoji(mime?: string | null) {
  if (isFolder(mime)) return '📁'
  if (!mime) return '📄'
  if (mime.startsWith('video/')) return '🎬'
  if (mime.startsWith('audio/')) return '🎵'
  if (mime.startsWith('image/')) return '🖼️'
  if (mime === 'application/pdf') return '📕'
  if (mime.includes('presentation')) return '🖥️'
  if (mime.includes('spreadsheet')) return '📊'
  return '📄'
}

/** The link to open a Drive file or folder, built from its id. */
export const driveOpenUrl = (id: string, mime?: string | null) =>
  isFolder(mime) ? `https://drive.google.com/drive/folders/${id}` : `https://drive.google.com/file/d/${id}/view`
