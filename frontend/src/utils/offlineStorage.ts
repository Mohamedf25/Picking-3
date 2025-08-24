import Dexie, { Table } from 'dexie'

export interface OfflineOrder {
  id: number
  woocommerce_id: number
  status: string
  customer_name: string
  items: any[]
  total: string
  date_created: string
  synced: number
  last_updated: Date
}

export interface OfflineSession {
  id: string
  order_id: number
  user_id: string
  status: string
  started_at: string
  lines: any[]
  photos: string[]
  synced: number
  last_updated: Date
}

export interface OfflineScan {
  id: string
  session_id: string
  sku: string
  quantity: number
  timestamp: string
  synced: number
}

export interface PendingApiCall {
  id: string
  method: string
  url: string
  data: any
  headers: any
  timestamp: string
  retries: number
}

export class OfflineDatabase extends Dexie {
  orders!: Table<OfflineOrder>
  sessions!: Table<OfflineSession>
  scans!: Table<OfflineScan>
  pendingCalls!: Table<PendingApiCall>

  constructor() {
    super('PickingSystemOfflineDB')
    this.version(1).stores({
      orders: '++id, woocommerce_id, status, synced, last_updated',
      sessions: '++id, order_id, user_id, status, synced, last_updated',
      scans: '++id, session_id, sku, synced, timestamp',
      pendingCalls: '++id, method, url, timestamp, retries'
    })
  }
}

export const offlineDB = new OfflineDatabase()

export class OfflineStorageManager {
  private static instance: OfflineStorageManager
  private isOnline: boolean = navigator.onLine
  private syncInProgress: boolean = false

  private constructor() {
    this.setupOnlineListeners()
  }

  static getInstance(): OfflineStorageManager {
    if (!OfflineStorageManager.instance) {
      OfflineStorageManager.instance = new OfflineStorageManager()
    }
    return OfflineStorageManager.instance
  }

  private setupOnlineListeners() {
    window.addEventListener('online', () => {
      console.log('Connection restored - starting sync')
      this.isOnline = true
      this.syncPendingData()
    })

    window.addEventListener('offline', () => {
      console.log('Connection lost - switching to offline mode')
      this.isOnline = false
    })
  }

  async storeOrder(order: any): Promise<void> {
    const offlineOrder: OfflineOrder = {
      id: order.id,
      woocommerce_id: order.id,
      status: order.status,
      customer_name: order.billing?.first_name + ' ' + order.billing?.last_name || 'Unknown',
      items: order.line_items || [],
      total: order.total,
      date_created: order.date_created,
      synced: this.isOnline ? 1 : 0,
      last_updated: new Date()
    }

    await offlineDB.orders.put(offlineOrder)
  }

  async storeSession(session: any): Promise<void> {
    const offlineSession: OfflineSession = {
      id: session.id,
      order_id: session.order_id,
      user_id: session.user_id,
      status: session.status,
      started_at: session.started_at,
      lines: session.lines || [],
      photos: session.photos || [],
      synced: this.isOnline ? 1 : 0,
      last_updated: new Date()
    }

    await offlineDB.sessions.put(offlineSession)
  }

  async storeScan(sessionId: string, sku: string, quantity: number): Promise<void> {
    const scan: OfflineScan = {
      id: `${sessionId}-${sku}-${Date.now()}`,
      session_id: sessionId,
      sku,
      quantity,
      timestamp: new Date().toISOString(),
      synced: this.isOnline ? 1 : 0
    }

    await offlineDB.scans.add(scan)
  }

  async queueApiCall(method: string, url: string, data: any, headers: any): Promise<void> {
    const pendingCall: PendingApiCall = {
      id: `${method}-${url}-${Date.now()}`,
      method,
      url,
      data,
      headers,
      timestamp: new Date().toISOString(),
      retries: 0
    }

    await offlineDB.pendingCalls.add(pendingCall)
  }

  async getOfflineOrders(): Promise<OfflineOrder[]> {
    return await offlineDB.orders.toArray()
  }

  async getOfflineSessions(): Promise<OfflineSession[]> {
    return await offlineDB.sessions.toArray()
  }

  async syncPendingData(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) {
      return
    }

    this.syncInProgress = true
    console.log('Starting offline data sync...')

    try {
      const pendingCalls = await offlineDB.pendingCalls.toArray()
      
      for (const call of pendingCalls) {
        try {
          const response = await fetch(call.url, {
            method: call.method,
            headers: call.headers,
            body: call.data ? JSON.stringify(call.data) : undefined
          })

          if (response.ok) {
            await offlineDB.pendingCalls.delete(call.id)
            console.log(`Synced API call: ${call.method} ${call.url}`)
          } else {
            call.retries++
            if (call.retries >= 3) {
              console.error(`Failed to sync after 3 retries: ${call.method} ${call.url}`)
              await offlineDB.pendingCalls.delete(call.id)
            } else {
              await offlineDB.pendingCalls.put(call)
            }
          }
        } catch (error) {
          call.retries++
          if (call.retries >= 3) {
            console.error(`Failed to sync after 3 retries: ${call.method} ${call.url}`, error)
            await offlineDB.pendingCalls.delete(call.id)
          } else {
            await offlineDB.pendingCalls.put(call)
          }
        }
      }

      await this.markDataAsSynced()
      console.log('Offline data sync completed')
    } catch (error) {
      console.error('Error during sync:', error)
    } finally {
      this.syncInProgress = false
    }
  }

  private async markDataAsSynced(): Promise<void> {
    await offlineDB.orders.where('synced').equals(0).modify({ synced: 1 })
    await offlineDB.sessions.where('synced').equals(0).modify({ synced: 1 })
    await offlineDB.scans.where('synced').equals(0).modify({ synced: 1 })
  }

  isOffline(): boolean {
    return !this.isOnline
  }

  async clearOfflineData(): Promise<void> {
    await offlineDB.orders.clear()
    await offlineDB.sessions.clear()
    await offlineDB.scans.clear()
    await offlineDB.pendingCalls.clear()
  }
}

export const offlineManager = OfflineStorageManager.getInstance()
