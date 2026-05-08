import RegisterForm from '@/components/auth/RegisterForm';
import { PawPrint } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left — brand panel (desktop only) */}
      <div
        className="hidden lg:flex flex-col w-[420px] shrink-0 relative overflow-hidden"
        style={{ backgroundColor: 'var(--sidebar)' }}
      >
        {/* Dot-grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, oklch(1 0 0 / 0.055) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />

        {/* Large decorative paw print */}
        <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 opacity-5">
          <PawPrint style={{ width: 320, height: 320, color: 'oklch(0.73 0.155 52)' }} />
        </div>

        <div className="relative flex flex-col flex-1 p-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: 'oklch(0.73 0.155 52)' }}
            >
              <PawPrint className="h-5 w-5" style={{ color: 'oklch(0.14 0.014 55)' }} />
            </div>
            <span
              className="text-2xl"
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'oklch(0.95 0.008 78)',
                letterSpacing: '-0.01em',
              }}
            >
              PackOps
            </span>
          </div>

          {/* Main copy */}
          <div className="mt-auto mb-12">
            <p
              className="text-5xl leading-tight mb-6"
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'oklch(0.95 0.008 78)',
                fontVariationSettings: "'SOFT' 20, 'WONK' 0",
                letterSpacing: '-0.02em',
              }}
            >
              Join your dog's{' '}
              <span style={{ color: 'oklch(0.73 0.155 52)' }}>team.</span>
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'oklch(0.62 0.018 55)' }}>
              Create your account and start coordinating care, training, and health for the dogs who need it most.
            </p>
          </div>

          {/* Bottom badge */}
          <div className="flex items-center gap-2">
            <div className="h-px flex-1" style={{ backgroundColor: 'oklch(1 0 0 / 8%)' }} />
            <span className="text-xs tracking-widest uppercase" style={{ color: 'oklch(0.45 0.01 55)' }}>
              Rescue · Care · Ops
            </span>
            <div className="h-px flex-1" style={{ backgroundColor: 'oklch(1 0 0 / 8%)' }} />
          </div>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Mobile-only logo */}
        <div className="lg:hidden mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <PawPrint className="h-6 w-6" />
          </div>
          <span
            className="text-2xl"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}
          >
            PackOps
          </span>
        </div>

        <RegisterForm />
      </div>
    </div>
  );
}
