import { Printer } from 'lucide-react';
import { useDog } from '@/contexts/DogContext';
import { useQR } from '@/hooks/useQR';
import QRCodeDisplay from '@/components/qr/QRCodeDisplay';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function QRPage() {
  const { activeDog, isMainHuman } = useDog();
  const { dog, updateQRVisibility, toggleQRPublic } = useQR(activeDog?.id ?? '');

  if (!activeDog || !dog) return <div className="text-muted-foreground">No active dog selected.</div>;

  const isMain = isMainHuman(activeDog.id);
  const vis = dog.qrVisibility;

  return (
    <div className="max-w-md mx-auto px-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">QR Code</h1>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
          <Printer className="h-4 w-4" /> Print
        </Button>
      </div>

      <Card className="overflow-hidden qr-print-card">
        <style>{`@media print { .qr-print-card { border: none !important; box-shadow: none !important; } .qr-print-wrapper { transform: scale(1.6); transform-origin: center top; margin-bottom: 2rem; } }`}</style>
        <div className="flex flex-col items-center py-8 px-6 bg-gradient-to-b from-muted/30 to-background">
          <div className="qr-print-wrapper rounded-2xl bg-white p-4 shadow-sm border">
            <QRCodeDisplay dogId={activeDog.id} size={220} />
          </div>
          <p className="mt-4 text-sm font-medium capitalize">{dog.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Scan to see <span className="capitalize">{dog.name}</span>'s public card
          </p>
        </div>
        <Separator />
        <CardContent className="pt-3 pb-3">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${dog.qrPublic ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
              {dog.qrPublic ? 'Active — publicly scannable' : 'Inactive — card not public'}
            </span>
          </div>
        </CardContent>
      </Card>

      {isMain && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visibility Settings</CardTitle>
            <CardDescription>Control what people see when they scan the QR code.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">QR Code Active</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Allow anyone to scan and view the public card</p>
              </div>
              <Switch checked={dog.qrPublic} onCheckedChange={toggleQRPublic} />
            </div>
            <Separator />
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Show on public card</p>
              <div className="flex items-center justify-between">
                <Label className="font-normal">Home address</Label>
                <Switch checked={vis.showAddress} onCheckedChange={v => updateQRVisibility({ ...vis, showAddress: v })} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">Phone number</Label>
                <Switch checked={vis.showPhone} onCheckedChange={v => updateQRVisibility({ ...vis, showPhone: v })} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">Rescue organization</Label>
                <Switch checked={vis.showRescueOrg} onCheckedChange={v => updateQRVisibility({ ...vis, showRescueOrg: v })} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
