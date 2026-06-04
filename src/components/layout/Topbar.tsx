import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDog } from '@/contexts/DogContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import AlertBell from '@/components/alerts/AlertBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Menu, Moon, PlusCircle, Sun, ChevronDown, Crown, Heart } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';

interface Props {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: Props) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { dogs, activeDog, setActiveDog } = useDog();
  const { theme, toggle } = useTheme();
  const [showAddDogDialog, setShowAddDogDialog] = useState(false);

  const initials = user?.displayName
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?';

  return (
    <header className="h-14 border-b flex items-center justify-between px-3 sm:px-5 bg-background/80 backdrop-blur-sm shrink-0 sticky top-0 z-40">
      {/* Left: hamburger + dog switcher */}
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="flex lg:hidden items-center justify-center h-8 w-8 -ml-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Open menu"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        {dogs.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors outline-none group min-w-0">
              <span className="capitalize max-w-[130px] sm:max-w-none truncate">{activeDog?.name ?? 'Select dog'}</span>
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[160px]">
              {dogs.map(d => (
                <DropdownMenuItem
                  key={d.id}
                  onClick={() => { setActiveDog(d); navigate('/'); }}
                  className={d.id === activeDog?.id ? 'font-semibold text-primary' : ''}
                >
                  <span className="capitalize">{d.name}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowAddDogDialog(true)}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <PlusCircle className="h-3.5 w-3.5" /> Add another dog
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label="Toggle theme"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          {theme === 'dark'
            ? <Sun className="h-4 w-4" />
            : <Moon className="h-4 w-4" />
          }
        </Button>

        <AlertBell />

        <DropdownMenu>
          <DropdownMenuTrigger className="ml-1 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Avatar className="h-8 w-8 cursor-pointer transition-opacity hover:opacity-80">
              <AvatarFallback
                className="text-[11px] font-bold"
                style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[180px]">
            <DropdownMenuItem disabled className="text-xs font-semibold capitalize">{user?.displayName}</DropdownMenuItem>
            <DropdownMenuItem disabled className="text-xs text-muted-foreground">{user?.email}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Add dog role dialog */}
      <Dialog open={showAddDogDialog} onOpenChange={setShowAddDogDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>How would you like to add a dog?</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 pt-1">
            <button
              type="button"
              onClick={() => { setShowAddDogDialog(false); navigate('/dogs/new'); }}
              className="flex items-start gap-4 rounded-xl border border-border p-4 text-left hover:bg-muted/60 transition-colors"
            >
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Crown className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Main Human</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Create a new dog profile. You'll be the primary owner.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => { setShowAddDogDialog(false); navigate('/dogs/join'); }}
              className="flex items-start gap-4 rounded-xl border border-border p-4 text-left hover:bg-muted/60 transition-colors"
            >
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
                <Heart className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Caregiver</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Join an existing dog's team as a caregiver.
                </p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
