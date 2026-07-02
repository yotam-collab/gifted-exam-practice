import type { ReactNode } from 'react';

/** Shared typography for guide bodies — keeps all guides visually consistent. */
export function P({ children }: { children: ReactNode }) {
  return <p className="text-text-secondary leading-relaxed mb-4">{children}</p>;
}

export function H({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-bold text-text mt-6 mb-2">{children}</h2>;
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="list-disc pr-5 mb-4 text-text-secondary leading-relaxed space-y-1">{children}</ul>;
}

export function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="game-card p-4 mb-4 border-r-4 border-r-primary">
      <div className="text-sm text-text leading-relaxed">{children}</div>
    </div>
  );
}

export function QA({ q, children }: { q: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <div className="font-bold text-text mb-1">{q}</div>
      <div className="text-text-secondary leading-relaxed text-sm">{children}</div>
    </div>
  );
}
