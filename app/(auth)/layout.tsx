import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Welcome to ISA Link',
  description: 'Sign in or create your account — ISA Link, Empowered To Succeed',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-stretch">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-isa-gradient items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/3 right-8 w-40 h-40 rounded-full bg-white/5" />

        <div className="relative z-10 text-center text-white max-w-md">
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/30">
              <Image
                src="/logo.png"
                alt="ISA Link Logo"
                width={64}
                height={64}
                className="object-contain"
                onError={() => undefined}
              />
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-3 tracking-tight">ISA Link</h1>
          <p className="text-isa-200 text-lg font-medium mb-8">International Student Association</p>
          <p className="text-2xl font-light text-white/90 italic">&ldquo;Empowered To Succeed&rdquo;</p>

          <div className="mt-12 grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Connect', desc: 'with peers' },
              { label: 'Share', desc: 'your journey' },
              { label: 'Grow', desc: 'together' },
            ].map(({ label, desc }) => (
              <div key={label} className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
                <div className="font-bold text-lg">{label}</div>
                <div className="text-xs text-isa-200 mt-1">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3">
              <div className="w-10 h-10 bg-isa-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">ISA</span>
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">ISA Link</span>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
