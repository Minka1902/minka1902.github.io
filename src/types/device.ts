export type DeviceProvider = 'fi' | 'whistle' | 'tractive' | 'link_ak' | 'other';

export interface Device {
  id: string;
  dogId: string;
  provider: DeviceProvider;
  deviceName: string;
  serialNumber?: string;
  linkedBy: string;
  linkedByName: string;
  linkedAt: number;
  lastSyncAt?: number;
  batteryPercent?: number;
  isActive: boolean;
}

export interface DeviceActivity {
  deviceId: string;
  timestamp: number;
  stepCount?: number;
  sleepMin?: number;
  distanceKm?: number;
  latitude?: number;
  longitude?: number;
}
