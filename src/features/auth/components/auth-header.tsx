import Link from "next/link";
import Image from "next/image";

interface AuthHeaderProps {
  title: string;
  description: string;
}

export function AuthHeader({ title, description }: AuthHeaderProps) {
  return (
    <div className="space-y-3 text-center">
      <Link
        href="/"
        className="inline-flex items-center justify-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300 rounded-lg p-1"
        aria-label="Back to home"
      >
        <Image
          src="/logo.png"
          alt="Pokémon GO Services Logo"
          width={36}
          height={36}
          className="h-9 w-9 object-contain transition-transform group-hover:scale-105"
          priority
        />
        <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Pokémon GO Services
        </span>
      </Link>

      <div className="space-y-1 pt-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
