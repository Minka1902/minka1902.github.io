import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useDog } from '@/contexts/DogContext';
import { useNavConfig } from '@/hooks/useNavConfig';
import { useTheme, COLOR_THEMES, type ColorTheme } from '@/hooks/useTheme';
import { NAV_ITEMS } from '@/lib/nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PawPrint, ExternalLink, LogOut, Check } from 'lucide-react';

const COLOR_THEME_META: Record<ColorTheme, { label: string; bg: string; primary: string }> = {
  'warm-cream':     { label: 'Warm Cream',     bg: '#f5e8d0', primary: '#c17d3c' },
  'white-sage':     { label: 'White & Sage',   bg: '#f0f7f0', primary: '#3d8a5a' },
  'neutral-slate':  { label: 'Neutral & Slate', bg: '#f0f2f7', primary: '#4a6fa5' },
  'royal-purple':   { label: 'Royal Purple',   bg: '#f2ecfb', primary: '#7c3aed' },
  'ruby-red':       { label: 'Ruby Red',       bg: '#fbecec', primary: '#d61f3a' },
};

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/50">
        <h2 className="font-semibold text-sm" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}>
          {title}
        </h2>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { dogs } = useDog();
  const { selected, toggle, max } = useNavConfig();
  const { theme, toggle: toggleTheme, colorTheme, setColorTheme } = useTheme();
  const [signingOut, setSigningOut] = useState(false);
  const [phone, setPhone] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const savedApiKey = typeof window !== 'undefined' ? localStorage.getItem('packops_gemini_api_key') : null;

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
    await updateDoc(doc(db, 'users', user.uid), { phoneNumber: normalized, updatedAt: Date.now() });
    setSavingPhone(false);
    setPhoneSaved(true);
    setTimeout(() => setPhoneSaved(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-5 lg:flex-1 lg:overflow-y-auto lg:p-4">
      {/* Header */}
      <div className="px-1 pt-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
          Settings
        </h1>
      </div>

      {/* Account */}
      <Section title="Account" description="Your profile information">
        <div className="flex items-center gap-4 mb-5">
          <Avatar className="h-14 w-14 shrink-0">
            <AvatarFallback
              className="text-base font-bold"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold capitalize">{user?.displayName}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <Separator className="mb-4" />

        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone number</Label>
          <p className="text-xs text-muted-foreground">
            Lets other handlers find your dogs by your phone number.
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Input
              id="phone"
              type="tel"
              placeholder="+1 555 123 4567"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleSavePhone}
              disabled={savingPhone || phone.trim() === (user?.phoneNumber ?? '')}
              className="shrink-0"
            >
              {savingPhone ? 'Saving…' : phoneSaved ? <Check className="h-4 w-4" /> : 'Save'}
            </Button>
          </div>
        </div>
      </Section>

      {/* Appearance */}
      <Section title="Appearance" description="Choose your color palette and display mode">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3">Color palette</p>
            <div className="flex flex-wrap gap-3">
              {COLOR_THEMES.map((ct) => {
                const meta = COLOR_THEME_META[ct];
                const isActive = colorTheme === ct;
                return (
                  <button
                    key={ct}
                    type="button"
                    onClick={() => setColorTheme(ct)}
                    className={`flex flex-col items-center gap-2 p-2.5 rounded-xl border-2 transition-all hover:opacity-90 ${
                      isActive
                        ? 'border-primary shadow-sm'
                        : 'border-border hover:border-border/80'
                    }`}
                    aria-label={meta.label}
                    aria-pressed={isActive}
                  >
                    <div
                      className="h-10 w-10 rounded-lg shadow-sm flex items-center justify-center"
                      style={{ backgroundColor: meta.bg }}
                    >
                      <div
                        className="h-5 w-5 rounded-full"
                        style={{ backgroundColor: meta.primary }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground leading-tight text-center max-w-[56px]">
                      {meta.label}
                    </span>
                    {isActive && (
                      <Check className="h-3 w-3 text-primary -mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Dark mode</p>
              <p className="text-xs text-muted-foreground">Switch between light and dark display</p>
            </div>
            <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
          </div>
        </div>
      </Section>

      {/* Dogs */}
      <Section title="Your Dogs" description="Manage dog profiles you own">
        <div className="space-y-1">
          {dogs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No dogs yet.</p>
          ) : (
            dogs.map((dog, i) => (
              <div key={dog.id}>
                {i > 0 && <Separator className="my-2" />}
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                      <PawPrint className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold capitalize">{dog.name}</p>
                      {dog.breed && <p className="text-xs text-muted-foreground">{dog.breed}{dog.isMix ? ' mix' : ''}</p>}
                    </div>
                  </div>
                  <Link
                    to={`/dogs/${dog.id}/edit`}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Edit <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))
          )}
          <Separator className="my-3" />
          <Link to="/dogs/new" className="text-sm text-primary hover:underline underline-offset-2 font-medium">
            + Add another dog
          </Link>
        </div>
      </Section>

      {/* AI Integration */}
      <Section title="AI Integration" description="Analyze training sessions with Gemini AI">
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Enter your own{' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Google Gemini API key</a>
            {' '}to use AI scoring. Stored locally on this device only.
          </p>
          {savedApiKey && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
              Key saved: <span className="font-mono">{savedApiKey.slice(0, 8)}••••</span>
              <button
                onClick={() => { localStorage.removeItem('packops_gemini_api_key'); window.location.reload(); }}
                className="ml-auto text-destructive hover:text-destructive/80 transition-colors"
              >
                Clear
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="AIzaSy…"
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              className="flex-1 font-mono text-xs"
              autoComplete="off"
            />
            <Button
              onClick={() => {
                if (!apiKeyInput.trim()) return;
                localStorage.setItem('packops_gemini_api_key', apiKeyInput.trim());
                setApiKeyInput('');
                setApiKeySaved(true);
                setTimeout(() => setApiKeySaved(false), 2000);
                window.location.reload();
              }}
              disabled={!apiKeyInput.trim()}
              className="shrink-0"
            >
              {apiKeySaved ? <Check className="h-4 w-4" /> : 'Save'}
            </Button>
          </div>
        </div>
      </Section>

      {/* Mobile Navigation */}
      <Section
        title="Mobile Navigation"
        description={`Choose up to ${max} pages for your bottom nav. ${selected.length}/${max} selected`}
      >
        <div className="space-y-0.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const isOn = selected.includes(to);
            const atMax = selected.length >= max && !isOn;
            return (
              <div key={to} className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0">
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isOn ? 'text-primary' : 'text-muted-foreground'} transition-colors`} strokeWidth={isOn ? 2.2 : 1.8} />
                  <span className={`text-sm ${atMax ? 'text-muted-foreground' : ''}`}>{label}</span>
                </div>
                <Switch checked={isOn} onCheckedChange={() => toggle(to)} disabled={atMax} />
              </div>
            );
          })}
        </div>
      </Section>

      {/* Session */}
      <Section title="Session">
        <Button
          variant="destructive"
          onClick={handleLogout}
          disabled={signingOut}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </Button>
      </Section>

      <p className="text-center text-xs text-muted-foreground pb-4">
        PackOps · rescue dog care, coordinated.
      </p>
    </div>
  );
}
