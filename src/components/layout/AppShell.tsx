import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar, { SidebarContent } from './Sidebar';
import Topbar from './Topbar';
import BottomNav from './BottomNav';
import { Sheet, SheetContent } from '@/components/ui/sheet';

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      {/* Tablet slide-in drawer (md → lg only) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-60 p-0 flex flex-col gap-0" showCloseButton={false}>
          <SidebarContent onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main
          className="flex flex-col flex-1 min-h-0 overflow-y-auto lg:overflow-hidden p-2 pb-20 md:p-3 md:pb-4 lg:p-0"
          style={{
            backgroundColor: 'var(--color-muted, oklch(0.97 0.005 72 / 0.25))',
            boxShadow: 'inset 0 1px 0 0 oklch(0.5 0 0 / 0.05), inset 2px 0 8px -4px oklch(0 0 0 / 0.04)',
          }}
        >
          <Outlet />
        </main>
      </div>
      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
