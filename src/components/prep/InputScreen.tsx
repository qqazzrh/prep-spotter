import { useState } from "react";
import type { Mode } from "@/lib/prep/types";

export function InputScreen({
  founder,
  company,
  setFounder,
  setCompany,
  onStart,
}: {
  founder: string;
  company: string;
  setFounder: (v: string) => void;
  setCompany: (v: string) => void;
  onStart: (mode: Mode) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const handle = (mode: Mode) => {
    if (!founder.trim() && !company.trim()) {
      setError("Enter a founder name or company name to start.");
      return;
    }
    setError(null);
    onStart(mode);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <header className="text-center mb-10">
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-foreground">
            FounderLens<span className="text-[oklch(0.85_0.14_220)]">.</span>
          </h1>
          <p className="mt-4 text-muted-foreground text-base md:text-lg">
            Know if a founder is worth your time before the meeting.
          </p>
        </header>

        <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-2xl shadow-black/40">
          <div className="space-y-4">
            <Field
              label="Founder name"
              placeholder="e.g. Sarah Chen"
              value={founder}
              onChange={setFounder}
            />
            <Field
              label="Company name"
              placeholder="e.g. Acme AI"
              value={company}
              onChange={setCompany}
            />
            <p className="text-xs text-muted-foreground">
              Enter a founder name, company name, or both.
            </p>
            {error && (
              <p className="text-sm text-[oklch(0.7_0.2_22)]">{error}</p>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={() => handle("quick")}
              className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-95 transition-opacity"
            >
              Generate Quick VC Screen
            </button>
            <button
              onClick={() => handle("deep")}
              className="w-full h-12 rounded-lg bg-transparent border border-border text-foreground font-medium hover:bg-secondary transition-colors"
            >
              Run Deep Diligence
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full h-11 px-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
      />
    </label>
  );
}
