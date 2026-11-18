import React, { useState } from 'react';
import MetricsOverview from './components/MetricsOverview';
import TriageConsole from './components/TriageConsole';
import LiveStream from './components/LiveStream';
import LearnedRulesPanel from './components/LearnedRulesPanel';
import {
  classifyTicket,
  getActiveRules,
  resetEngine,
  DEMO_BATCH
} from './api';

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [geminiCalls, setGeminiCalls] = useState(0);
  const [ruleHits, setRuleHits] = useState(0);
  const [activeRules, setActiveRules] = useState(getActiveRules());
  const [batchProgress, setBatchProgress] = useState({
    isRunning: false,
    current: 0,
    total: 10
  });

  // Handle single ticket classification
  const handleClassify = async (text) => {
    try {
      const result = await classifyTicket(text);
      
      const newTicket = {
        ...result,
        id: Date.now() + Math.random()
      };

      setTickets(prev => [newTicket, ...prev]);

      if (result.source === 'RULE') {
        setRuleHits(prev => prev + 1);
      } else {
        setGeminiCalls(prev => prev + 1);
      }

      setActiveRules(result.learnedRules || getActiveRules());
    } catch (err) {
      console.error('Error classifying ticket:', err);
    }
  };

  // Handle running the 10-message demo batch sequentially with 300ms pacing
  const handleRunDemoBatch = async () => {
    if (batchProgress.isRunning) return;

    setBatchProgress({
      isRunning: true,
      current: 0,
      total: DEMO_BATCH.length
    });

    for (let i = 0; i < DEMO_BATCH.length; i++) {
      const message = DEMO_BATCH[i];
      setBatchProgress(prev => ({ ...prev, current: i + 1 }));

      const result = await classifyTicket(message);
      
      const newTicket = {
        ...result,
        id: Date.now() + Math.random()
      };

      setTickets(prev => [newTicket, ...prev]);

      if (result.source === 'RULE') {
        setRuleHits(prev => prev + 1);
      } else {
        setGeminiCalls(prev => prev + 1);
      }

      setActiveRules(result.learnedRules || getActiveRules());

      // Pacing delay between batch messages
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setBatchProgress({
      isRunning: false,
      current: DEMO_BATCH.length,
      total: DEMO_BATCH.length
    });
  };

  // Handle resetting the entire demo state (Nielsen's Heuristic #3)
  const handleReset = async () => {
    await resetEngine();
    setTickets([]);
    setGeminiCalls(0);
    setRuleHits(0);
    setActiveRules(getActiveRules());
    setBatchProgress({
      isRunning: false,
      current: 0,
      total: 10
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-900 selection:text-indigo-200">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold tracking-tight text-slate-100">
                  Ticket Triage Muscle Memory
                </h1>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  v1.0-preview
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Self-learning System-1 keyword heuristics from Gemini System-2 triage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              disabled={batchProgress.isRunning}
              className="py-1.5 px-3 rounded text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Reset all learned rules, metrics, and streams"
            >
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Reset Demo State</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Top full-width row: 3 KPI Cards */}
        <MetricsOverview
          geminiCalls={geminiCalls}
          ruleHits={ruleHits}
        />

        {/* 12-Column Desktop Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 columns: Input Console on top, Live Classification Stream below */}
          <div className="lg:col-span-8 space-y-6">
            <TriageConsole
              onSubmitTicket={handleClassify}
              onRunDemoBatch={handleRunDemoBatch}
              batchProgress={batchProgress}
            />

            <LiveStream tickets={tickets} />
          </div>

          {/* Right 4 columns: Learned Rules Panel */}
          <div className="lg:col-span-4 sticky top-20">
            <LearnedRulesPanel rules={activeRules} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 text-center text-xs text-slate-400 font-mono">
        Standalone Decoupled Frontend &bull; In-Memory Muscle Memory Engine &bull; Zero External Network Calls
      </footer>
    </div>
  );
}
