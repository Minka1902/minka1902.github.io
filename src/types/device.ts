export type DeviceProvider = 'airtag' | 'fi' | 'whistle' | 'tractive' | 'link_ak' | 'other';

export interface DeviceLocation {
  lat: number;
  lng: number;
  address?: string;
  updatedAt: number;
  updatedByName?: string;
}

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
  /** Last-known location of the dog reported through this device. */
  lastLocation?: DeviceLocation;
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
