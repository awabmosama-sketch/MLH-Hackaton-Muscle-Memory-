import React from 'react';

/**
 * Top KPI bar showing system efficiency:
 * - Gemini API Calls (System-2)
 * - System-1 Rule Hits
 * - API Calls Saved
 */
export default function MetricsOverview({ geminiCalls = 0, ruleHits = 0 }) {
  const totalTickets = geminiCalls + ruleHits;
  const callsSaved = ruleHits;
  const offloadRate = totalTickets > 0 ? Math.round((callsSaved / totalTickets) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Metric 1: Gemini API Calls */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Gemini API Calls
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-indigo-950/80 text-indigo-400 border border-indigo-900/60">
            System-2
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-mono font-semibold text-slate-100">
            {geminiCalls}
          </span>
          <span className="text-xs text-slate-400 font-mono">
            ~380ms avg
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Heavy inference model calls
        </p>
      </div>

      {/* Metric 2: System-1 Rule Hits */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            System-1 Rule Hits
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-900/60">
            Muscle Memory
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-mono font-semibold text-emerald-400">
            {ruleHits}
          </span>
          <span className="text-xs text-slate-400 font-mono">
            ~1.1ms avg
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Instant deterministic execution
        </p>
      </div>

      {/* Metric 3: API Calls Saved */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            API Calls Saved
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-cyan-950/80 text-cyan-400 border border-cyan-900/60">
            {offloadRate}% Offloaded
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-mono font-semibold text-cyan-400">
            {callsSaved}
          </span>
          <span className="text-xs text-slate-400 font-mono">
            of {totalTickets} total
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Zero token cost & zero quota consumed
        </p>
      </div>
    </div>
  );
}
