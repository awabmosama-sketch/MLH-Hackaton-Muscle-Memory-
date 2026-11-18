import React from 'react';

/**
 * LiveStream displays the real-time chronological feed of classified tickets.
 * Contrasts System-1 RULE hits (~1.1ms) with System-2 GEMINI inference (~380ms).
 */
export default function LiveStream({ tickets = [] }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
            Live Classification Stream
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Chronological log of classified requests & latency benchmarks
          </p>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'} processed
        </span>
      </div>

      <div className="mt-4 space-y-3 max-h-[520px] overflow-y-auto pr-1">
        {tickets.length === 0 ? (
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <p className="text-sm font-medium text-slate-300">
              No tickets classified yet
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Type a customer ticket above or click "Run 10-Message Demo Batch" to observe how System-1 learns from Gemini.
            </p>
          </div>
        ) : (
          tickets.map((ticket, idx) => {
            const isRule = ticket.source === 'RULE';
            return (
              <div
                key={ticket.id || idx}
                className="bg-slate-950 border border-slate-800 rounded-md p-3.5 transition-all hover:border-slate-700"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {/* Source Badge */}
                    {isRule ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium bg-emerald-950/90 text-emerald-400 border border-emerald-800/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        RULE (SYSTEM-1)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium bg-indigo-950/90 text-indigo-400 border border-indigo-800/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                        GEMINI (SYSTEM-2)
                      </span>
                    )}

                    {/* Category Label */}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {ticket.label}
                    </span>

                    {/* Matched / Extracted keyword info */}
                    {isRule && ticket.matchedKeyword && (
                      <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/40">
                        via "{ticket.matchedKeyword}"
                      </span>
                    )}
                    {!isRule && ticket.keywords && ticket.keywords.length > 0 && (
                      <span className="text-[11px] font-mono text-indigo-400 bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-900/40">
                        trained "{ticket.keywords.join(', ')}"
                      </span>
                    )}
                  </div>

                  {/* Monospace Latency */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono font-medium ${
                        isRule ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {ticket.latency_ms}ms
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      #{tickets.length - idx}
                    </span>
                  </div>
                </div>

                {/* Ticket Text */}
                <p className="text-sm text-slate-200 leading-relaxed font-sans">
                  {ticket.text}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
