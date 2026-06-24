import type { AxiosInstance, AxiosError } from 'axios'
import { addPendingRequest, getAllPendingRequests, removePendingRequest } from './offlineDB'

let replayInProgress = false

export function setupOfflineInterceptor(instance: AxiosInstance): void {
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config
      if (!config) return Promise.reject(error)

      const method = (config.method ?? '').toUpperCase()
      const isNetworkError = !error.response

      // Auth endpoints cannot be queued — they require live server authentication
      const url = config.url ?? ''
      const isAuthEndpoint = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'].some(
        (p) => url.includes(p)
      )

      if (isNetworkError && (method === 'POST' || method === 'PATCH') && !isAuthEndpoint) {
        let body: unknown = null
        try {
          body = config.data ? JSON.parse(config.data as string) : null
        } catch {
          body = config.data
        }

        await addPendingRequest({
          url: config.url ?? '',
          method,
          body,
          timestamp: Date.now(),
        })

        return {
          data: { queued: true },
          status: 202,
          statusText: 'Queued',
          headers: {},
          config,
        }
      }

      return Promise.reject(error)
    }
  )
}

export async function replayPendingRequests(instance: AxiosInstance): Promise<void> {
  if (replayInProgress || !navigator.onLine) return

  const pending = await getAllPendingRequests()
  if (pending.length === 0) return

  replayInProgress = true
  let anySucceeded = false

  for (const req of pending) {
    try {
      await instance.request({
        url: req.url,
        method: req.method as 'post' | 'patch',
        data: req.body,
      })
      if (req.id !== undefined) {
        await removePendingRequest(req.id)
      }
      anySucceeded = true
    } catch {
      // will retry on next reconnect
    }
  }

  replayInProgress = false

  if (anySucceeded) {
    document.dispatchEvent(new CustomEvent('dcip:synced'))
  }
}
