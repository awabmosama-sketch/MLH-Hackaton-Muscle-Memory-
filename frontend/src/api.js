/**
 * API Service for "Ticket Triage Muscle Memory"
 * Supports live FastAPI backend at /api (or VITE_API_URL) with fallback
 * to the self-contained in-memory simulation engine.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

let learnedKeywordCounts = {
  Billing: {},
  Technical: {},
  Account: {},
  Other: {}
};

export const RULE_THRESHOLD = 2;

export const DEMO_BATCH = [
  "I was charged twice on my credit card for the annual subscription.",
  "I cannot login to my account using Google SSO on mobile.",
  "The app continues to crash every time I export a CSV file.",
  "Why was my card charged again without any invoice notification?",
  "Persistent login failure after clearing my browser cache and cookies.",
  "Fatal app crash on launch after installing the latest update v2.4.",
  "Dispute request: customer charged incorrect amount on invoice #1042.",
  "User reported another login timeout on the dashboard portal.",
  "Sudden crash when opening the settings drawer on Android 14.",
  "Why am I being charged extra fees for international wire transfer?"
];

function extractTokens(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(token => token.length > 2);
}

function geminiLocalClassify(text) {
  const lower = text.toLowerCase();
  if (lower.includes("charged") || lower.includes("credit card") || lower.includes("invoice") || lower.includes("fee") || lower.includes("billing")) {
    return { label: "Billing", keywords: ["charged"] };
  }
  if (lower.includes("login") || lower.includes("password") || lower.includes("sso") || lower.includes("account")) {
    return { label: "Account", keywords: ["login"] };
  }
  if (lower.includes("crash") || lower.includes("error") || lower.includes("bug") || lower.includes("export")) {
    return { label: "Technical", keywords: ["crash"] };
  }
  return { label: "Other", keywords: ["general"] };
}

export function checkLearnedRule(text) {
  const tokens = extractTokens(text);
  for (const [category, keywords] of Object.entries(learnedKeywordCounts)) {
    for (const [kw, count] of Object.entries(keywords)) {
      if (count >= RULE_THRESHOLD && tokens.includes(kw)) {
        return { matched: true, label: category, matchedKeyword: kw, count };
      }
    }
  }
  return { matched: false };
}

export function getActiveRules() {
  const result = { Billing: [], Technical: [], Account: [], Other: [] };
  for (const [category, keywords] of Object.entries(learnedKeywordCounts)) {
    for (const [kw, count] of Object.entries(keywords)) {
      if (count >= RULE_THRESHOLD) {
        if (!result[category]) result[category] = [];
        result[category].push({ keyword: kw, count });
      }
    }
  }
  return result;
}

export function updateLocalKeywordsFromBackend(rulesDict) {
  if (rulesDict && typeof rulesDict === 'object') {
    learnedKeywordCounts = {
      Billing: { ...(rulesDict.Billing || {}) },
      Technical: { ...(rulesDict.Technical || {}) },
      Account: { ...(rulesDict.Account || {}) },
      Other: { ...(rulesDict.Other || {}) }
    };
  }
}

/**
 * Classify a ticket: attempts FastAPI backend first (/api/classify).
 * If offline or fails, falls back gracefully to in-memory engine.
 */
export async function classifyTicket(text) {
  try {
    const res = await fetch(`${API_BASE}/api/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (res.ok) {
      const data = await res.json();
      
      // Update local rules cache from backend analytics
      try {
        const analyticsRes = await fetch(`${API_BASE}/api/analytics`);
        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          updateLocalKeywordsFromBackend(analyticsData.learned_rules);
        }
      } catch (e) {
        // Ignore analytics fetch error
      }

      return {
        text: data.text || text,
        label: data.label,
        source: data.source,
        latency_ms: data.latency_ms,
        matchedKeyword: data.source === 'RULE' ? checkLearnedRule(text).matchedKeyword : null,
        keywords: data.source === 'GEMINI' ? extractTokens(text).slice(0, 2) : [],
        learnedRules: getActiveRules()
      };
    }
  } catch (backendError) {
    // Backend offline / network unreachable -> Use in-memory engine
  }

  // --- Local Fallback Engine (Zero Quota / Offline mode) ---
  const ruleCheck = checkLearnedRule(text);
  if (ruleCheck.matched) {
    return {
      text,
      label: ruleCheck.label,
      source: "RULE",
      latency_ms: 1.1,
      matchedKeyword: ruleCheck.matchedKeyword,
      learnedRules: getActiveRules()
    };
  }

  await new Promise(resolve => setTimeout(resolve, 350));
  const { label, keywords } = geminiLocalClassify(text);

  if (!learnedKeywordCounts[label]) learnedKeywordCounts[label] = {};
  keywords.forEach(kw => {
    learnedKeywordCounts[label][kw] = (learnedKeywordCounts[label][kw] || 0) + 1;
  });

  return {
    text,
    label,
    source: "GEMINI",
    latency_ms: 380,
    keywords,
    learnedRules: getActiveRules()
  };
}

/**
 * Fetch stats & rules from backend (if online).
 */
export async function fetchAnalytics() {
  try {
    const res = await fetch(`${API_BASE}/api/analytics`);
    if (res.ok) {
      const data = await res.json();
      updateLocalKeywordsFromBackend(data.learned_rules);
      return {
        online: true,
        stats: data.stats,
        recentTickets: data.recent_tickets || [],
        learnedRules: getActiveRules()
      };
    }
  } catch (e) {
    // Backend not reached
  }
  return { online: false, learnedRules: getActiveRules() };
}

/**
 * Reset system state (calls backend reset if online, and resets local state).
 */
export async function resetEngine() {
  try {
    await fetch(`${API_BASE}/api/reset`, { method: 'POST' });
  } catch (e) {
    // Ignore backend unreachable
  }
  learnedKeywordCounts = { Billing: {}, Technical: {}, Account: {}, Other: {} };
  return { status: "cleared" };
}
