import LoginForm from '@/components/auth/LoginForm';
import { PawPrint } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">

      {/* ── Left — brand panel ── */}
      <div
        className="hidden lg:flex flex-col w-1/2 xl:w-[52%] shrink-0 relative overflow-hidden"
        style={{ backgroundColor: 'var(--sidebar)' }}
      >
        {/* Dot-grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, oklch(1 0 0 / 0.05) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Decorative large paw — bottom right */}
        <div
          className="absolute -bottom-16 -right-16 opacity-[0.04]"
          style={{ color: 'oklch(0.72 0.158 50)' }}
        >
          <PawPrint style={{ width: 380, height: 380 }} />
        </div>

        {/* Warm amber glow blob */}
        <div
          className="absolute top-1/3 -left-24 w-96 h-96 rounded-full opacity-[0.06] blur-3xl"
          style={{ backgroundColor: 'oklch(0.72 0.158 50)' }}
        />

        <div className="relative flex flex-col flex-1 p-12 xl:p-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
              style={{ backgroundColor: 'oklch(0.72 0.158 50)' }}
            >
              <PawPrint className="h-5 w-5" style={{ color: 'oklch(0.13 0.016 50)' }} />
            </div>
            <span
              className="text-2xl"
              style={{
                fontFamily: 'var(--font-heading)',
                fontVariationSettings: "'SOFT' 0, 'WONK' 0",
                color: 'oklch(0.92 0.010 72)',
                letterSpacing: '-0.025em',
              }}
            >
              PackOps
            </span>
          </div>

          {/* Main copy — pushed to bottom */}
          <div className="mt-auto">
            <p
              className="text-[3.5rem] xl:text-[4.25rem] leading-[1.05] mb-6"
              style={{
                fontFamily: 'var(--font-heading)',
                fontVariationSettings: "'SOFT' 20, 'WONK' 0",
                color: 'oklch(0.92 0.010 72)',
                letterSpacing: '-0.03em',
              }}
            >
              Rescue dog care,{' '}
              <em
                className="not-italic"
                style={{ color: 'oklch(0.72 0.158 50)' }}
              >
                coordinated.
              </em>
            </p>
            <p
              className="text-base leading-relaxed max-w-md"
              style={{ color: 'oklch(1 0 0 / 35%)' }}
            >
              Every walk logged. Every meal noted. Every milestone celebrated.
            </p>

            {/* Stat strip */}
            <div
              className="mt-10 grid grid-cols-3 gap-6 pt-8"
              style={{ borderTop: '1px solid oklch(1 0 0 / 8%)' }}
            >
              {[
                { value: '100%', label: 'Coordination' },
                { value: '24/7', label: 'Team access' },
                { value: '∞', label: 'Dog records' },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p
                    className="text-2xl font-bold tabular-nums"
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontVariationSettings: "'SOFT' 0",
                      color: 'oklch(0.72 0.158 50)',
                    }}
                  >
                    {value}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'oklch(1 0 0 / 30%)' }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom wordmark */}
          <div className="mt-12 flex items-center gap-3">
            <div className="h-px flex-1" style={{ backgroundColor: 'oklch(1 0 0 / 7%)' }} />
            <span className="text-[9px] uppercase tracking-[0.16em]" style={{ color: 'oklch(1 0 0 / 20%)' }}>
              Rescue · Care · Ops
            </span>
            <div className="h-px flex-1" style={{ backgroundColor: 'oklch(1 0 0 / 7%)' }} />
          </div>
        </div>
      </div>

      {/* ── Right — form panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 bg-background">
        {/* Mobile-only logo */}
        <div className="lg:hidden mb-10 flex flex-col items-center gap-3">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            <PawPrint className="h-7 w-7" style={{ color: 'var(--primary-foreground)' }} />
          </div>
          <span
            className="text-2xl"
            style={{ fontFamily: 'var(--font-heading)', fontVariationSettings: "'SOFT' 0", letterSpacing: '-0.025em' }}
          >
            PackOps
          </span>
        </div>

        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
