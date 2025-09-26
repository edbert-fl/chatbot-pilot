'use client';

export default function BookDemo() {
  return (
    <div className="space-y-2">
      <div className="inline-block text-xs px-2 py-1 border border-border rounded-full text-muted">
        Book a Demo
      </div>
      <a
        href="https://cal.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-3 py-2 bg-accent text-bg font-semibold rounded hover:bg-accent-600 transition-colors"
      >
        Book a Demo
      </a>
    </div>
  );
}
