import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import BusinessSidebar, { BusinessSidebarContent } from './BusinessSidebar';
import BusinessTopbar from './BusinessTopbar';
import { Sheet, SheetContent } from '@/components/ui/sheet';

export default function BusinessAppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <BusinessSidebar />
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-60 p-0 flex flex-col gap-0" showCloseButton={false}>
          <BusinessSidebarContent onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <BusinessTopbar onMenuClick={() => setMobileOpen(true)} />
        <main
          className="flex flex-col flex-1 min-h-0 overflow-y-auto p-3 pb-20 md:p-4 lg:p-6"
          style={{ backgroundColor: 'var(--color-muted, oklch(0.97 0.005 72 / 0.25))' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
