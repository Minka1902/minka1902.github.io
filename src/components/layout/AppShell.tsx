import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar, { SidebarContent } from './Sidebar';
import Topbar from './Topbar';
import { Sheet, SheetContent } from '@/components/ui/sheet';

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-60 p-0 flex flex-col gap-0" showCloseButton={false}>
          <SidebarContent onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 bg-muted/20">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
