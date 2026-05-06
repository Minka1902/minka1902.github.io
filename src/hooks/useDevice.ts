import { useEffect, useState } from 'react';
import { addDoc, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { devicesCol } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import type { Device, DeviceActivity } from '@/types';

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

  const getStubActivity = (deviceId: string): DeviceActivity[] => [
    {
      deviceId,
      timestamp: Date.now() - 3600000,
      stepCount: 4200,
      sleepMin: 480,
      distanceKm: 3.2,
    },
  ];

  return { devices, linkDevice, unlinkDevice, getStubActivity };
}
