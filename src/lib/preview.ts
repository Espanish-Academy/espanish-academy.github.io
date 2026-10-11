import type { Lang } from './types'

/**
 * "View as student": the teacher opens the app inside an iframe named `espanish-preview:<studentId>:<lang>`.
 * Inside it the app behaves like that student's app, but nothing can be saved.
 */
const m = typeof window !== 'undefined' ? window.name.match(/^espanish-preview:([^:]+):(en|es)$/) : null
export const preview: { studentId: string; lang: Lang } | null = m ? { studentId: m[1], lang: m[2] as Lang } : null
export const previewName = (studentId: string, lang: Lang) => `espanish-preview:${studentId}:${lang}`
