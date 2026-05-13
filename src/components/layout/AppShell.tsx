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
        <main className="flex flex-col flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 lg:p-6 bg-muted/20 pb-20 md:pb-4 lg:pb-6">
          <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col min-h-0">
            <Outlet />
          </div>
        </main>
      </div>
      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
