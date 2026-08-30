function Star({ className }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path
        d="M50 0 C54 30 70 46 100 50 C70 54 54 70 50 100 C46 70 30 54 0 50 C30 46 46 30 50 0 Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function LoadingScreen() {
  return (
    <div className="flex min-h-[calc(100dvh-9.5rem)] flex-1 flex-col items-center justify-center rounded-3xl bg-card px-6 py-20 shadow-sm">
      {/* Sparkle cluster — matches Figma exactly:
          large star (top-right), medium star (bottom-left),
          small star (bottom-right), tiny dot (top-left) */}
      <div className="relative h-32 w-32">
        {/* Large star — top-right, brand orange */}
        <Star className="animate-sparkle absolute right-0 top-0 h-20 w-20 text-brand" />
        {/* Medium star — bottom-left, brand orange */}
        <Star className="animate-sparkle absolute bottom-0 left-0 h-14 w-14 text-brand [animation-delay:200ms]" />
        {/* Small star — bottom-right, light orange */}
        <Star className="animate-sparkle absolute bottom-4 right-3 h-6 w-6 text-brand/50 [animation-delay:500ms]" />
        {/* Tiny dot — top-left, brand orange */}
        <span className="animate-sparkle absolute left-6 top-8 h-3 w-3 rounded-full bg-brand/60 [animation-delay:100ms]" />
      </div>

      <h1 className="mt-8 text-[28px] font-extrabold tracking-tight sm:text-3xl">Extracting...</h1>
      <p className="mt-2 text-[15px] text-muted-foreground sm:text-[17px]">This may take a while</p>
    </div>
  );
}
