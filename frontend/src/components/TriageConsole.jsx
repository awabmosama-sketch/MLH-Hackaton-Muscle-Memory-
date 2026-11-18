import React, { useState } from 'react';

/**
 * TriageConsole handles single ticket submission with Cmd/Ctrl+Enter affordance
 * and provides the 10-ticket demo batch runner button with visible progress.
 */
export default function TriageConsole({
  onSubmitTicket,
  onRunDemoBatch,
  batchProgress, // { isRunning, current, total }
  disabled = false
}) {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || disabled || batchProgress.isRunning) return;
    onSubmitTicket(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
            Triage Input Console
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Test single ticket classification or launch automated demo stream
          </p>
        </div>
        <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-1 rounded border border-slate-700/50">
          Press Ctrl + Enter to submit
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || batchProgress.isRunning}
            rows={3}
            placeholder="Type or paste a customer support ticket (e.g. 'I was charged twice on my invoice', 'Login keeps timing out')..."
            className="w-full bg-slate-950 border border-slate-800 rounded-md p-3 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-50 resize-none font-sans"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            {/* Primary Filled Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || disabled || batchProgress.isRunning}
              className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>Classify Ticket</span>
            </button>

            {/* Secondary Outlined / Slate Button */}
            <button
              type="button"
              onClick={onRunDemoBatch}
              disabled={disabled || batchProgress.isRunning}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-800/90 border border-slate-700 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 text-sm font-medium rounded-md transition-colors flex items-center gap-2"
            >
              {batchProgress.isRunning ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin text-indigo-400"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                  <span className="font-mono text-indigo-400">
                    Processing {batchProgress.current}/{batchProgress.total}...
                  </span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Run 10-Message Demo Batch</span>
                </>
              )}
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            System Ready
          </div>
        </div>
      </form>
    </div>
  );
}
