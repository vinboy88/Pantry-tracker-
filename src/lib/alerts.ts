import { NOTIFY_DAY_KEY } from '../constants.ts'
import type { PantryItem } from '../types.ts'
import { todayIso } from './dates.ts'
import { formatLowNames, lowStockItems } from './stock.ts'

type BadgeNavigator = Navigator & {
  setAppBadge?: (contents?: number) => Promise<void>
  clearAppBadge?: () => Promise<void>
}

export async function syncAppBadge(count: number): Promise<void> {
  const nav = navigator as BadgeNavigator
  try {
    if (count > 0 && nav.setAppBadge) {
      await nav.setAppBadge(count)
      return
    }
    if (nav.clearAppBadge) await nav.clearAppBadge()
  } catch {
    /* unsupported / blocked */
  }
}

export function notificationsSupported(): boolean {
  return typeof Notification !== 'undefined'
}

export async function requestNotifyPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

export async function maybeLocalNotify(items: PantryItem[], enabled: boolean): Promise<void> {
  if (!enabled || !notificationsSupported()) return
  if (Notification.permission !== 'granted') return

  const low = lowStockItems(items)
  if (low.length === 0) return

  const today = todayIso()
  try {
    if (localStorage.getItem(NOTIFY_DAY_KEY) === today) return
    localStorage.setItem(NOTIFY_DAY_KEY, today)
  } catch {
    return
  }

  const title = low.length === 1 ? 'Running low' : `${low.length} items running low`
  const body = formatLowNames(low)
  const icon = `${import.meta.env.BASE_URL}icons/icon-192.png`

  try {
    const reg = await navigator.serviceWorker?.ready.catch(() => undefined)
    if (reg?.showNotification) {
      await reg.showNotification(title, { body, tag: 'pantry-low', icon })
      return
    }
  } catch {
    /* fall through */
  }

  try {
    new Notification(title, { body, tag: 'pantry-low', icon })
  } catch {
    /* ignore */
  }
}
