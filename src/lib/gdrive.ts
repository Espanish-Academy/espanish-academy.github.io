/**
 * Google Drive for the teacher: browse her own Drive in Google's file picker, choose files or folders,
 * and make them viewable by link so the student can open them. Uses only the narrow `drive.file` scope:
 * the app can touch just the items she picks.
 * Needs a Google Cloud project: VITE_GOOGLE_CLIENT_ID, VITE_GOOGLE_API_KEY, VITE_GOOGLE_APP_ID (the project number).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined
const APP_ID = import.meta.env.VITE_GOOGLE_APP_ID as string | undefined

export const driveConfigured = !!(CLIENT_ID && API_KEY && APP_ID)

export interface DrivePick { id: string; name: string; mimeType: string; url: string }

const loaded = new Map<string, Promise<void>>()
function loadScript(src: string) {
  if (!loaded.has(src)) {
    loaded.set(src, new Promise<void>((res, rej) => {
      const s = document.createElement('script')
      s.src = src; s.async = true; s.onload = () => res(); s.onerror = () => rej(new Error('Could not load Google'))
      document.head.appendChild(s)
    }))
  }
  return loaded.get(src)!
}

let token: { value: string; expires: number } | null = null

async function accessToken(): Promise<string> {
  if (token && token.expires > Date.now() + 60_000) return token.value
  await loadScript('https://accounts.google.com/gsi/client')
  const g = (window as any).google
  return new Promise<string>((resolve, reject) => {
    const client = g.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (r: any) => {
        if (r.error) return reject(new Error(r.error))
        token = { value: r.access_token, expires: Date.now() + Number(r.expires_in ?? 3600) * 1000 }
        resolve(r.access_token)
      },
      error_callback: (e: any) => reject(new Error(e?.type || 'popup_closed')),
    })
    client.requestAccessToken({ prompt: token ? '' : 'select_account' })
  })
}

/** Opens the picker on her My Drive. Resolves with what she chose ([] if she closed it). */
export async function pickFromDrive(): Promise<DrivePick[]> {
  const t = await accessToken()
  await loadScript('https://apis.google.com/js/api.js')
  const w = window as any
  await new Promise<void>(res => w.gapi.load('picker', () => res()))
  const p = w.google.picker
  return new Promise<DrivePick[]>(resolve => {
    const mine = new p.DocsView().setIncludeFolders(true).setSelectFolderEnabled(true).setParent('root')
    const shared = new p.DocsView().setIncludeFolders(true).setSelectFolderEnabled(true).setOwnedByMe(false)
    new p.PickerBuilder()
      .setAppId(APP_ID)
      .setDeveloperKey(API_KEY)
      .setOAuthToken(t)
      .addView(mine)
      .addView(shared)
      .enableFeature(p.Feature.MULTISELECT_ENABLED)
      .setCallback((d: any) => {
        if (d.action === p.Action.PICKED) resolve((d.docs as any[]).map(x => ({ id: x.id, name: x.name, mimeType: x.mimeType, url: x.url })))
        else if (d.action === p.Action.CANCEL) resolve([])
      })
      .build()
      .setVisible(true)
  })
}

/** Anyone with the link can view — so the student can open it without a Google account. */
export async function shareByLink(id: string) {
  const t = await accessToken()
  const r = await fetch(`https://www.googleapis.com/drive/v3/files/${id}/permissions?supportsAllDrives=true`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  })
  if (!r.ok) throw new Error(`Could not share (${r.status})`)
}
