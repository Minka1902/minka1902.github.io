import { useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBusiness } from '@/contexts/BusinessContext';
import { useTheme } from '@/hooks/useTheme';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function BusinessTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { businesses, activeBusiness, setActiveBusiness } = useBusiness();
  const { theme, toggle } = useTheme();

  const initials = user?.displayName?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '?';

  return (
    <header className="h-14 border-b flex items-center justify-between px-3 sm:px-5 bg-background/80 backdrop-blur-sm shrink-0 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="hidden md:flex lg:hidden items-center justify-center h-8 w-8 -ml-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Open menu"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        {businesses.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors outline-none group min-w-0">
              <span className="max-w-[150px] truncate">{activeBusiness?.name ?? 'Select business'}</span>
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[180px]">
              {businesses.map(b => (
                <DropdownMenuItem
                  key={b.id}
                  onClick={() => setActiveBusiness(b)}
                  className={b.id === activeBusiness?.id ? 'font-semibold text-primary' : ''}
                >
                  {b.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="ml-1 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Avatar className="h-8 w-8 cursor-pointer transition-opacity hover:opacity-80">
              <AvatarFallback className="text-[11px] font-bold" style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[200px]">
            <DropdownMenuItem disabled className="text-xs font-semibold capitalize">{user?.displayName}</DropdownMenuItem>
            <DropdownMenuItem disabled className="text-xs text-muted-foreground">{user?.email}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/business/settings')}>Business settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* Switching to the personal (dog-owner) identity is a full sign-out. */}
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="h-3.5 w-3.5 mr-2" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
