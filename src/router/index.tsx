import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import AppShell from '@/components/layout/AppShell';

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
const DevicesPage               = lazy(() => import('@/pages/devices/DevicesPage'));
const QRPage                    = lazy(() => import('@/pages/qr/QRPage'));
const SettingsPage              = lazy(() => import('@/pages/settings/SettingsPage'));
const OrgListPage               = lazy(() => import('@/pages/org/OrgListPage'));
const CreateOrgPage             = lazy(() => import('@/pages/org/CreateOrgPage'));
const OrgDetailPage             = lazy(() => import('@/pages/org/OrgDetailPage'));
const OrgSettingsPage           = lazy(() => import('@/pages/org/OrgSettingsPage'));
const JoinOrgPage               = lazy(() => import('@/pages/org/JoinOrgPage'));

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
      // Full-screen walk/training UI — no AppShell
      { path: '/walk/active',     element: <Suspense fallback={null}><ActiveWalkPage /></Suspense> },
      { path: '/walk/summary',    element: <Suspense fallback={null}><WalkSummaryPage /></Suspense> },
      { path: '/training/active', element: <Suspense fallback={null}><ActiveTrainingPage /></Suspense> },
      // Main app with sidebar/topbar/bottom-nav
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
          { path: '/devices',              element: <DevicesPage /> },
          { path: '/qr',                   element: <QRPage /> },
          { path: '/settings',             element: <SettingsPage /> },
          { path: '/orgs',                 element: <OrgListPage /> },
          { path: '/orgs/new',             element: <CreateOrgPage /> },
          { path: '/orgs/join',            element: <JoinOrgPage /> },
          { path: '/orgs/:orgId',          element: <OrgDetailPage /> },
          { path: '/orgs/:orgId/settings', element: <OrgSettingsPage /> },
        ],
      },
    ],
  },
]);
