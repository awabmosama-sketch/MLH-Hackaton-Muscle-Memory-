import React from 'react';

/**
 * LearnedRulesPanel provides an index of active System-1 rules.
 * Grouped cleanly by category: Billing, Technical, Account, Other.
 * Shows keyword badges and their hit frequencies (e.g., 2x).
 */
export default function LearnedRulesPanel({ rules = {} }) {
  const categories = ['Billing', 'Technical', 'Account', 'Other'];
  
  // Calculate total active rules across all categories
  const totalActiveRules = Object.values(rules).reduce(
    (acc, list) => acc + (Array.isArray(list) ? list.length : 0),
    0
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
            Learned Rules Index
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Active System-1 keyword filters (Threshold &ge; 2)
          </p>
        </div>
        <span className="text-xs font-mono font-medium text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-900/60">
          {totalActiveRules} active
        </span>
      </div>

      <div className="mt-4 space-y-4 flex-1 overflow-y-auto pr-1">
        {totalActiveRules === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <svg
              className="w-10 h-10 mx-auto mb-3 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <p className="text-sm font-medium text-slate-300">
              No rules learned yet
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              When Gemini observes the same classification pattern twice, a local rule graduates here automatically.
            </p>
          </div>
        ) : (
          categories.map(category => {
            const categoryRules = rules[category] || [];
            return (
              <div
                key={category}
                className="bg-slate-950/70 border border-slate-800/80 rounded-md p-3.5"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-slate-300">
                    {category}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {categoryRules.length} {categoryRules.length === 1 ? 'rule' : 'rules'}
                  </span>
                </div>

                {categoryRules.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No active rules
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {categoryRules.map(({ keyword, count }) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-950/60 border border-emerald-800/70 text-emerald-400 text-xs font-mono"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span className="font-semibold">{keyword}</span>
                        <span className="text-[10px] text-emerald-400/80 bg-emerald-900/50 px-1 py-0.2 rounded font-mono">
                          {count}x
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* System Note Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 leading-normal">
        <span className="text-emerald-400 font-medium">Muscle Memory Principle:</span>
        <br />
        Frequent Gemini classifications crystallize into instant zero-latency System-1 heuristics.
      </div>
    </div>
  );
}
