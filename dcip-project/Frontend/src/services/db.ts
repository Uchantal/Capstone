const DB_NAME = 'dcip-offline'
const DB_VERSION = 1
const STORE_NAME = 'pending-items'

let db: IDBDatabase | null = null

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db)
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const database = (e.target as IDBOpenDBRequest).result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'localId', autoIncrement: true })
      }
    }
    req.onsuccess = (e) => {
      db = (e.target as IDBOpenDBRequest).result
      resolve(db)
    }
    req.onerror = () => reject(req.error)
  })
}

export interface PendingItem {
  localId?: number
  discipline: string
  title: string
  fileType: string
  fileData: string
  durationMinutes: number
  createdAt: string
}

export const savePendingItem = async (item: PendingItem): Promise<number> => {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.add({ ...item, createdAt: new Date().toISOString() })
    req.onsuccess = () => resolve(req.result as number)
    req.onerror = () => reject(req.error)
  })
}

export const getPendingItems = async (): Promise<PendingItem[]> => {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result as PendingItem[])
    req.onerror = () => reject(req.error)
  })
}

export const removePendingItem = async (localId: number): Promise<void> => {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.delete(localId)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}
