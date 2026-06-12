import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import RequireMode from '@/components/layout/RequireMode';
import AppShell from '@/components/layout/AppShell';
import BusinessAppShell from '@/components/layout/BusinessAppShell';

// Auth + public pages — kept eager (needed before any JS chunk arrives)
import LoginPage    from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import PublicQRPage from '@/pages/qr/PublicQRPage';

// All other pages lazy-loaded: downloaded only when first visited
const ActiveWalkPage            = lazy(() => import('@/pages/walk/ActiveWalkPage'));
const WalkSummaryPage           = lazy(() => import('@/pages/walk/WalkSummaryPage'));
const ActiveTrainingPage        = lazy(() => import('@/pages/training/ActiveTrainingPage'));
const DashboardPage             = lazy(() => import('@/pages/dashboard/DashboardPage'));
const CreateDogPage             = lazy(() => import('@/pages/dog/CreateDogPage'));
const EditDogPage               = lazy(() => import('@/pages/dog/EditDogPage'));
const JoinDogPage               = lazy(() => import('@/pages/dog/JoinDogPage'));
const RoutinePage               = lazy(() => import('@/pages/routine/RoutinePage'));
const TrainingPage              = lazy(() => import('@/pages/training/TrainingPage'));
const NewTrainingSessionPage    = lazy(() => import('@/pages/training/NewTrainingSessionPage'));
const TrainingSessionDetailPage = lazy(() => import('@/pages/training/TrainingSessionDetailPage'));
const MedicalPage               = lazy(() => import('@/pages/medical/MedicalPage'));
const HumansPage                = lazy(() => import('@/pages/humans/HumansPage'));
const DiscoverPage              = lazy(() => import('@/pages/discover/DiscoverPage'));
const BusinessBookingPage       = lazy(() => import('@/pages/discover/BusinessBookingPage'));
const DevicesPage               = lazy(() => import('@/pages/devices/DevicesPage'));
const QRPage                    = lazy(() => import('@/pages/qr/QRPage'));
const SettingsPage              = lazy(() => import('@/pages/settings/SettingsPage'));

// Business CRM pages
const BusinessRegisterPage  = lazy(() => import('@/pages/business/BusinessRegisterPage'));
const BusinessDashboardPage = lazy(() => import('@/pages/business/BusinessDashboardPage'));
const CustomersPage         = lazy(() => import('@/pages/business/CustomersPage'));
const AppointmentsPage      = lazy(() => import('@/pages/business/AppointmentsPage'));
const InvoicesPage          = lazy(() => import('@/pages/business/InvoicesPage'));
const InventoryPage         = lazy(() => import('@/pages/business/InventoryPage'));
const OrdersPage            = lazy(() => import('@/pages/business/OrdersPage'));
const ShipmentsPage         = lazy(() => import('@/pages/business/ShipmentsPage'));
const StaffPage             = lazy(() => import('@/pages/business/StaffPage'));
const RolesPage             = lazy(() => import('@/pages/business/RolesPage'));
const SecurityPage          = lazy(() => import('@/pages/business/SecurityPage'));
const BusinessSettingsPage  = lazy(() => import('@/pages/business/BusinessSettingsPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
      Loading…
    </div>
  );
}

export const router = createBrowserRouter([
  { path: '/login',             element: <LoginPage /> },
  { path: '/register',          element: <RegisterPage /> },
  { path: '/dog/:dogId/public', element: <PublicQRPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      // Full-screen walk/training UI — no AppShell (personal mode)
      {
        element: <RequireMode mode="personal" />,
        children: [
          { path: '/walk/active',     element: <Suspense fallback={null}><ActiveWalkPage /></Suspense> },
          { path: '/walk/summary',    element: <Suspense fallback={null}><WalkSummaryPage /></Suspense> },
          { path: '/training/active', element: <Suspense fallback={null}><ActiveTrainingPage /></Suspense> },
        ],
      },
      // Personal (dog-owner) app
      {
        element: <RequireMode mode="personal" />,
        children: [
          {
            element: (
              <Suspense fallback={<PageLoader />}>
                <AppShell />
              </Suspense>
            ),
            children: [
              { path: '/',                     element: <DashboardPage /> },
              { path: '/dogs/new',             element: <CreateDogPage /> },
              { path: '/dogs/:dogId/edit',     element: <EditDogPage /> },
              { path: '/dogs/join',            element: <JoinDogPage /> },
              { path: '/routine',              element: <RoutinePage /> },
              { path: '/training',             element: <TrainingPage /> },
              { path: '/training/new',         element: <NewTrainingSessionPage /> },
              { path: '/training/:sessionId',  element: <TrainingSessionDetailPage /> },
              { path: '/medical',              element: <MedicalPage /> },
              { path: '/humans',               element: <HumansPage /> },
              { path: '/discover',             element: <DiscoverPage /> },
              { path: '/discover/:bid',        element: <BusinessBookingPage /> },
              { path: '/devices',              element: <DevicesPage /> },
              { path: '/qr',                   element: <QRPage /> },
              { path: '/settings',             element: <SettingsPage /> },
            ],
          },
        ],
      },
      // Business CRM app
      {
        element: <RequireMode mode="business" />,
        children: [
          {
            element: (
              <Suspense fallback={<PageLoader />}>
                <BusinessAppShell />
              </Suspense>
            ),
            children: [
              { path: '/business',              element: <BusinessDashboardPage /> },
              { path: '/business/new',          element: <BusinessRegisterPage /> },
              { path: '/business/customers',    element: <CustomersPage /> },
              { path: '/business/appointments', element: <AppointmentsPage /> },
              { path: '/business/invoices',     element: <InvoicesPage /> },
              { path: '/business/inventory',    element: <InventoryPage /> },
              { path: '/business/orders',      element: <OrdersPage /> },
              { path: '/business/shipments',    element: <ShipmentsPage /> },
              { path: '/business/staff',        element: <StaffPage /> },
              { path: '/business/roles',        element: <RolesPage /> },
              { path: '/business/security',     element: <SecurityPage /> },
              { path: '/business/settings',     element: <BusinessSettingsPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
