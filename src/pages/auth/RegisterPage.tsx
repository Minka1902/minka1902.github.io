import RegisterForm from '@/components/auth/RegisterForm';
import { PawPrint } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-muted/50 to-background px-4">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <PawPrint className="h-7 w-7" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">PackOps</h1>
          <p className="text-sm text-muted-foreground mt-1">Rescue dog care, coordinated.</p>
        </div>
      </div>
      <RegisterForm />
    </div>
  );
}
