import { useDog } from '@/contexts/DogContext';
import { useQR } from '@/hooks/useQR';
import QRCodeDisplay from '@/components/qr/QRCodeDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function QRPage() {
  const { activeDog, isMainHuman } = useDog();
  const { dog, updateQRVisibility, toggleQRPublic } = useQR(activeDog?.id ?? '');

  if (!activeDog || !dog) return <div className="text-muted-foreground">No active dog selected.</div>;

  const isMain = isMainHuman(activeDog.id);
  const vis = dog.qrVisibility;

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold">QR Code</h1>

      <Card className="flex flex-col items-center py-6">
        <QRCodeDisplay dogId={activeDog.id} size={220} />
        <p className="mt-4 text-sm text-muted-foreground text-center">
          Scan to see {dog.name}'s public card
        </p>
      </Card>

      {isMain && (
        <Card>
          <CardHeader><CardTitle className="text-base">Visibility Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>QR Code Active</Label>
              <Switch checked={dog.qrPublic} onCheckedChange={toggleQRPublic} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Address</Label>
              <Switch
                checked={vis.showAddress}
                onCheckedChange={v => updateQRVisibility({ ...vis, showAddress: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Phone Number</Label>
              <Switch
                checked={vis.showPhone}
                onCheckedChange={v => updateQRVisibility({ ...vis, showPhone: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Rescue Org</Label>
              <Switch
                checked={vis.showRescueOrg}
                onCheckedChange={v => updateQRVisibility({ ...vis, showRescueOrg: v })}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
