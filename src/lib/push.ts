import { store } from '.'

const KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

export type PushState = 'unavailable' | 'needs-install' | 'blocked' | 'off' | 'on'

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true

function keyBytes(b64: string) {
  const raw = atob((b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}

/** Where this device stands with notifications. iPhones only support them once the app is on the Home Screen. */
export async function pushState(): Promise<PushState> {
  if (store.mode !== 'supabase' || !KEY || import.meta.env.DEV) return 'unavailable'
  if (isIOS && !isStandalone()) return 'needs-install'
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'unavailable'
  if (Notification.permission === 'denied') return 'blocked'
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  return sub && Notification.permission === 'granted' ? 'on' : 'off'
}

/** Must be called from a tap: browsers only show the permission prompt after a user gesture. */
export async function enablePush() {
  if ((await Notification.requestPermission()) !== 'granted') throw new Error('permission')
  const reg = await navigator.serviceWorker.ready
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(KEY!) as BufferSource }))
  const j = sub.toJSON()
  await store.savePushSubscription({ endpoint: j.endpoint!, p256dh: j.keys!.p256dh, auth: j.keys!.auth })
}

export async function disablePush() {
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (!sub) return
  await store.deletePushSubscription(sub.endpoint).catch(() => {})
  await sub.unsubscribe()
}
