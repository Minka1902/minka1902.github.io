import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import AppShell from '@/components/layout/AppShell';
import ActiveWalkPage from '@/pages/walk/ActiveWalkPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import CreateDogPage from '@/pages/dog/CreateDogPage';
import EditDogPage from '@/pages/dog/EditDogPage';
import JoinDogPage from '@/pages/dog/JoinDogPage';
import RoutinePage from '@/pages/routine/RoutinePage';
import TrainingPage from '@/pages/training/TrainingPage';
import NewTrainingSessionPage from '@/pages/training/NewTrainingSessionPage';
import TrainingSessionDetailPage from '@/pages/training/TrainingSessionDetailPage';
import MedicalPage from '@/pages/medical/MedicalPage';
import HumansPage from '@/pages/humans/HumansPage';
import DevicesPage from '@/pages/devices/DevicesPage';
import QRPage from '@/pages/qr/QRPage';
import PublicQRPage from '@/pages/qr/PublicQRPage';
import SettingsPage from '@/pages/settings/SettingsPage';

export const router = createBrowserRouter([
  { path: '/login',             element: <LoginPage /> },
  { path: '/register',          element: <RegisterPage /> },
  { path: '/dog/:dogId/public', element: <PublicQRPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      // Full-screen walk UI — no AppShell
      { path: '/walk/active', element: <ActiveWalkPage /> },
      // Main app with sidebar/topbar/bottom-nav
      {
        element: <AppShell />,
        children: [
          { path: '/',                    element: <DashboardPage /> },
          { path: '/dogs/new',            element: <CreateDogPage /> },
          { path: '/dogs/:dogId/edit',    element: <EditDogPage /> },
          { path: '/dogs/join',           element: <JoinDogPage /> },
          { path: '/routine',             element: <RoutinePage /> },
          { path: '/training',            element: <TrainingPage /> },
          { path: '/training/new',        element: <NewTrainingSessionPage /> },
          { path: '/training/:sessionId', element: <TrainingSessionDetailPage /> },
          { path: '/medical',             element: <MedicalPage /> },
          { path: '/humans',              element: <HumansPage /> },
          { path: '/devices',             element: <DevicesPage /> },
          { path: '/qr',                  element: <QRPage /> },
          { path: '/settings',            element: <SettingsPage /> },
        ],
      },
    ],
  },
]);
