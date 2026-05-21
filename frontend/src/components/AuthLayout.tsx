interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 py-12 px-4 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_60%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.06),transparent_60%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_60%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.1),transparent_60%)] pointer-events-none"
      />

      <img
        aria-hidden
        src="/logo.png"
        alt=""
        className="absolute -left-32 -bottom-32 w-90 h-90 sm:w-140 sm:h-140 md:w-180 md:h-180 object-contain opacity-[0.06] dark:opacity-[0.08] dark:invert dark:hue-rotate-180 pointer-events-none select-none -rotate-15"
      />
      <img
        aria-hidden
        src="/logo.png"
        alt=""
        className="absolute -right-32 -top-32 w-70 h-70 sm:w-110 sm:h-110 md:w-140 md:h-140 object-contain opacity-[0.05] dark:opacity-[0.06] dark:invert dark:hue-rotate-180 pointer-events-none select-none rotate-20"
      />

      <div className="relative max-w-sm w-full">
        {children}
        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          Issue Tracker · Manage your team's work
        </p>
      </div>
    </div>
  );
}
