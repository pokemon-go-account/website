interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-[calc(100vh-80px)] flex-col items-center justify-center bg-zinc-50/50 dark:bg-zinc-950 px-4 py-8 sm:py-12 md:py-16 sm:px-6">
      <div className="w-full max-w-[400px] sm:max-w-[480px] md:max-w-[520px] space-y-6 sm:space-y-7 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 sm:p-9 md:p-10 shadow-md sm:shadow-lg transition-colors">
        {children}
      </div>
    </div>
  );
}
