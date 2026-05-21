interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950 text-gray-900 dark:text-gray-50">
      <header className="px-6 sm:px-10 py-5">
        <div className="inline-flex items-center gap-2">
          <img
            src="/logo.png"
            alt="Issue Tracker"
            className="w-7 h-7 object-contain brightness-0 dark:invert"
          />
          <span className="text-base font-semibold tracking-tight">Issue Tracker</span>
        </div>
      </header>

      <main className="flex-1 flex items-start sm:items-center justify-center px-4 pt-8 sm:pt-0 pb-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>

      <footer className="py-6 flex flex-col items-center gap-2">
        <img
          src="/logo.png"
          alt=""
          aria-hidden
          className="w-7 h-7 object-contain opacity-80 brightness-0 dark:invert"
        />
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Issue Tracker · Manage your team's work
        </p>
      </footer>
    </div>
  );
}
