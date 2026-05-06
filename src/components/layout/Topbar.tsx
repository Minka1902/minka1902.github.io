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
import { Menu, Moon, PlusCircle, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';

interface Props {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: Props) {
  const { user, logout } = useAuth();
  const { dogs, activeDog, setActiveDog } = useDog();
  const { theme, toggle } = useTheme();

  const initials = user?.displayName
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?';

  return (
    <header className="h-14 border-b flex items-center justify-between px-3 sm:px-5 bg-background shrink-0">
      {/* Hamburger (mobile only) + Dog switcher */}
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-1 rounded-md hover:bg-muted transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        {dogs.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors outline-none">
              Switch dog ▾
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {dogs.map(d => (
                <DropdownMenuItem
                  key={d.id}
                  onClick={() => setActiveDog(d)}
                  className={d.id === activeDog?.id ? 'font-semibold' : ''}
                >
                  {d.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.location.href = '/dogs/new'} className="flex items-center gap-2">
                <PlusCircle className="h-3.5 w-3.5" /> Add another dog
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <AlertBell />
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none">
            <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled className="text-xs capitalize">{user?.displayName}</DropdownMenuItem>
            <DropdownMenuItem disabled className="text-xs text-muted-foreground">{user?.email}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => window.location.href = '/settings'}>Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={logout} className="text-destructive">Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
