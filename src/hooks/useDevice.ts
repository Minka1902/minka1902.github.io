import { useEffect, useState } from 'react';
import { addDoc, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { devicesCol } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import { stripUndefined } from '@/lib/utils';
import type { Device, DeviceActivity, DeviceLocation } from '@/types';

export function useDevices(dogId: string) {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    if (!dogId) return;
    return onSnapshot(devicesCol(dogId), snap => {
      setDevices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Device)));
    });
  }, [dogId]);

  const linkDevice = async (data: Omit<Device, 'id' | 'dogId' | 'linkedBy' | 'linkedByName' | 'linkedAt'>) => {
    await addDoc(devicesCol(dogId), {
      ...data,
      dogId,
      linkedBy: user!.uid,
      linkedByName: user!.displayName,
      linkedAt: Date.now(),
    });
  };

  const unlinkDevice = async (deviceId: string) => {
    await deleteDoc(doc(db, 'dogs', dogId, 'devices', deviceId));
  };

  // Record the dog's last-known location for a device. AirTags have no public
  // API, so this is updated manually (map pin or the phone's current GPS).
  const updateDeviceLocation = async (
    deviceId: string,
    loc: Pick<DeviceLocation, 'lat' | 'lng' | 'address'>,
  ) => {
    const lastLocation: DeviceLocation = stripUndefined({
      lat: loc.lat,
      lng: loc.lng,
      address: loc.address,
      updatedAt: Date.now(),
      updatedByName: user?.displayName,
    }) as DeviceLocation;
    await updateDoc(doc(db, 'dogs', dogId, 'devices', deviceId), {
      lastLocation,
      lastSyncAt: Date.now(),
    });
  };

  const getStubActivity = (deviceId: string): DeviceActivity[] => [
    {
      deviceId,
      timestamp: Date.now() - 3600000,
      stepCount: 4200,
      sleepMin: 480,
      distanceKm: 3.2,
    },
  ];

  return { devices, linkDevice, unlinkDevice, updateDeviceLocation, getStubActivity };
}
