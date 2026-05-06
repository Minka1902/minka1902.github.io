import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDog } from '@/contexts/DogContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PawPrint, ExternalLink, LogOut } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { dogs } = useDog();
  const [signingOut, setSigningOut] = useState(false);

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
          <Link
            to="/dogs/new"
            className="text-sm text-primary hover:underline"
          >
            + Add another dog
          </Link>
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
