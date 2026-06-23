import { openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'

interface DCIPOfflineSchema extends DBSchema {
  pendingRequests: {
    key: number
    value: { id?: number; url: string; method: string; body: unknown; timestamp: number }
  }
  cachedProgress: {
    key: string
    value: { discipline: string; data: unknown; cachedAt: number }
  }
  cachedPortfolio: {
    key: number
    value: {
      id?: number
      discipline: string
      title: string
      fileType: string
      fileData: string
      durationMinutes: number
      cachedAt: number
    }
  }
  cachedEngagement: {
    key: number
    value: { id?: number; discipline: string; stage: string; score: number; cachedAt: number }
  }
}

export type PendingRequest = DCIPOfflineSchema['pendingRequests']['value']

let dbInstance: IDBPDatabase<DCIPOfflineSchema> | null = null

async function getDB(): Promise<IDBPDatabase<DCIPOfflineSchema>> {
  if (!dbInstance) {
    dbInstance = await openDB<DCIPOfflineSchema>('dcip-pwa', 1, {
      upgrade(database) {
        database.createObjectStore('pendingRequests', { keyPath: 'id', autoIncrement: true })
        database.createObjectStore('cachedProgress', { keyPath: 'discipline' })
        database.createObjectStore('cachedPortfolio', { keyPath: 'id', autoIncrement: true })
        database.createObjectStore('cachedEngagement', { keyPath: 'id', autoIncrement: true })
      },
    })
  }
  return dbInstance
}

export async function addPendingRequest(req: Omit<PendingRequest, 'id'>): Promise<void> {
  const d = await getDB()
  await d.add('pendingRequests', req as PendingRequest)
}

export async function getAllPendingRequests(): Promise<PendingRequest[]> {
  const d = await getDB()
  return d.getAll('pendingRequests')
}

export async function removePendingRequest(id: number): Promise<void> {
  const d = await getDB()
  await d.delete('pendingRequests', id)
}

export async function cacheProgress(discipline: string, data: unknown): Promise<void> {
  const d = await getDB()
  await d.put('cachedProgress', { discipline, data, cachedAt: Date.now() })
}

export async function getCachedProgress(discipline: string): Promise<unknown | null> {
  const d = await getDB()
  const item = await d.get('cachedProgress', discipline)
  return item?.data ?? null
}
