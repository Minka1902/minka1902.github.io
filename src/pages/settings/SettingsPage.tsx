import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useDog } from '@/contexts/DogContext';
import { useNavConfig } from '@/hooks/useNavConfig';
import { NAV_ITEMS } from '@/lib/nav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PawPrint, ExternalLink, LogOut, Check } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { dogs } = useDog();
  const { selected, toggle, max } = useNavConfig();
  const [signingOut, setSigningOut] = useState(false);
  const [phone, setPhone] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneSaved, setPhoneSaved] = useState(false);

  useEffect(() => {
    setPhone(user?.phoneNumber ?? '');
  }, [user?.phoneNumber]);

  const initials = user?.displayName
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?';

  const handleLogout = async () => {
    setSigningOut(true);
    await logout();
  };

  const handleSavePhone = async () => {
    if (!user) return;
    setSavingPhone(true);
    setPhoneSaved(false);
    const normalized = phone.trim().replace(/[\s\-()]/g, '');
    await updateDoc(doc(db, 'users', user.uid), {
      phoneNumber: normalized,
      updatedAt: Date.now(),
    });
    setSavingPhone(false);
    setPhoneSaved(true);
    setTimeout(() => setPhoneSaved(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>Your profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-base bg-primary text-primary-foreground font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold capitalize">{user?.displayName}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <p className="text-xs text-muted-foreground">
              Lets other handlers find your dogs by your phone number.
            </p>
            <div className="flex gap-2">
              <Input
                id="phone"
                type="tel"
                placeholder="+1 555 123 4567"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
              <Button
                type="button"
                onClick={handleSavePhone}
                disabled={savingPhone || phone.trim() === (user?.phoneNumber ?? '')}
              >
                {savingPhone ? 'Saving…' : phoneSaved ? <Check className="h-4 w-4" /> : 'Save'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dogs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Dogs</CardTitle>
          <CardDescription>Manage dog profiles you own</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {dogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No dogs yet.</p>
          ) : (
            dogs.map(dog => (
              <div key={dog.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <PawPrint className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">{dog.name}</p>
                    {dog.breed && <p className="text-xs text-muted-foreground">{dog.breed}</p>}
                  </div>
                </div>
                <Link
                  to={`/dogs/${dog.id}/edit`}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  Edit <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            ))
          )}
          <Separator />
          <Link to="/dogs/new" className="text-sm text-primary hover:underline">
            + Add another dog
          </Link>
        </CardContent>
      </Card>

      {/* Mobile Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mobile Navigation</CardTitle>
          <CardDescription>
            Choose up to {max} pages for your bottom nav bar.{' '}
            <span className="font-medium text-foreground">{selected.length}/{max} selected</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const isOn = selected.includes(to);
            const atMax = selected.length >= max && !isOn;
            return (
              <div key={to} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className={`text-sm ${atMax ? 'text-muted-foreground' : ''}`}>{label}</span>
                </div>
                <Switch
                  checked={isOn}
                  onCheckedChange={() => toggle(to)}
                  disabled={atMax}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Sign out */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleLogout}
            disabled={signingOut}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            {signingOut ? 'Signing out…' : 'Sign out'}
          </Button>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground pb-4">
        PackOps — rescue dog care, coordinated.
      </p>
    </div>
  );
}
