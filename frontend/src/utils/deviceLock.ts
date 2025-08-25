export interface DeviceFingerprint {
  userAgent: string
  screen: string
  timezone: string
  language: string
  platform: string
  cookieEnabled: boolean
  doNotTrack: string | null
  canvas: string
}

export class DeviceLockManager {
  private static instance: DeviceLockManager
  private deviceId: string | null = null

  private constructor() {}

  static getInstance(): DeviceLockManager {
    if (!DeviceLockManager.instance) {
      DeviceLockManager.instance = new DeviceLockManager()
    }
    return DeviceLockManager.instance
  }

  async generateDeviceFingerprint(): Promise<DeviceFingerprint> {
    const canvas = this.generateCanvasFingerprint()
    
    return {
      userAgent: navigator.userAgent,
      screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      canvas
    }
  }

  private generateCanvasFingerprint(): string {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return 'no-canvas'

      canvas.width = 200
      canvas.height = 50

      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillStyle = '#f60'
      ctx.fillRect(125, 1, 62, 20)
      ctx.fillStyle = '#069'
      ctx.fillText('Device fingerprint', 2, 15)
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
      ctx.fillText('Device fingerprint', 4, 17)

      return canvas.toDataURL()
    } catch (error) {
      return 'canvas-error'
    }
  }

  async getDeviceId(): Promise<string> {
    if (this.deviceId) {
      return this.deviceId
    }

    let storedDeviceId = localStorage.getItem('device_id')
    
    if (!storedDeviceId) {
      const fingerprint = await this.generateDeviceFingerprint()
      const fingerprintString = JSON.stringify(fingerprint)
      
      storedDeviceId = await this.hashString(fingerprintString)
      localStorage.setItem('device_id', storedDeviceId)
      localStorage.setItem('device_fingerprint', fingerprintString)
    }

    this.deviceId = storedDeviceId
    return this.deviceId
  }

  private async hashString(str: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(str)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  async isDeviceAuthorized(userId: string): Promise<boolean> {
    const deviceId = await this.getDeviceId()
    const authorizedDevices = JSON.parse(localStorage.getItem(`authorized_devices_${userId}`) || '[]')
    
    return authorizedDevices.includes(deviceId)
  }

  async authorizeDevice(userId: string): Promise<void> {
    const deviceId = await this.getDeviceId()
    const authorizedDevices = JSON.parse(localStorage.getItem(`authorized_devices_${userId}`) || '[]')
    
    if (!authorizedDevices.includes(deviceId)) {
      authorizedDevices.push(deviceId)
      localStorage.setItem(`authorized_devices_${userId}`, JSON.stringify(authorizedDevices))
    }
  }

  async revokeDeviceAuthorization(userId: string): Promise<void> {
    const deviceId = await this.getDeviceId()
    const authorizedDevices = JSON.parse(localStorage.getItem(`authorized_devices_${userId}`) || '[]')
    
    const filteredDevices = authorizedDevices.filter((id: string) => id !== deviceId)
    localStorage.setItem(`authorized_devices_${userId}`, JSON.stringify(filteredDevices))
  }

  async validateDeviceIntegrity(): Promise<boolean> {
    try {
      const storedFingerprint = localStorage.getItem('device_fingerprint')
      if (!storedFingerprint) return false

      const currentFingerprint = await this.generateDeviceFingerprint()
      const storedFingerprintObj = JSON.parse(storedFingerprint)
      
      const criticalFields: (keyof DeviceFingerprint)[] = ['userAgent', 'screen', 'platform']
      for (const field of criticalFields) {
        if (storedFingerprintObj[field] !== currentFingerprint[field]) {
          console.warn(`Device fingerprint mismatch in field: ${field}`)
          return false
        }
      }

      return true
    } catch (error) {
      console.error('Error validating device integrity:', error)
      return false
    }
  }

  getDeviceInfo(): any {
    const fingerprint = localStorage.getItem('device_fingerprint')
    return fingerprint ? JSON.parse(fingerprint) : null
  }

  clearDeviceData(): void {
    localStorage.removeItem('device_id')
    localStorage.removeItem('device_fingerprint')
    this.deviceId = null
  }
}

export const deviceLockManager = DeviceLockManager.getInstance()
