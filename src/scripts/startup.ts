// What should be on screen the moment the desktop appears?
// Everything the decision needs is gathered into a StartupContext, so the
// policy itself is one small, pure function that's easy to reason about.

export interface StartupContext {
  /** Window id requested by the URL (?open=erdos or #erdos), if it exists */
  deepLink: string | null;
  /** A saved window layout from a previous visit exists and is less than a week old */
  hasSession: boolean;
  /** Where the visitor came from */
  referrer: 'linkedin' | 'github' | 'search' | 'other' | 'none';
  /** Phone-sized screen: every window opens maximized, so fewer is better */
  compact: boolean;
  /** Visitor unticked "Show this Welcome Screen next time" */
  welcomeOptOut: boolean;
  /** Has visited before (any earlier session) */
  returning: boolean;
}

export interface StartupPlan {
  /** Re-open the saved layout before anything in `open` */
  restoreSession: boolean;
  /** Window ids to open in order; the last one ends up focused */
  open: string[];
}

/**
 * Window ids you can use: 'welcome', 'projects', 'about', 'arc', 'contact', 'dos',
 * and project windows as 'p-<slug>' (e.g. 'p-erdos', 'p-toaruos-arnold').
 */
export function chooseStartupWindows(ctx: StartupContext): StartupPlan {
  // TODO(human): decide the opening layout from ctx. See the Learn by Doing note in chat.
  return { restoreSession: false, open: ctx.deepLink ? [ctx.deepLink] : ['welcome'] };
}

// ─── Context gathering (browser-only) ───────────────────────────────

const VISITED_KEY = 'cuperos.visited';
const WELCOME_KEY = 'cuperos.welcome';

export function readContext(opts: { hasWindow: (id: string) => boolean; sessionAgeMs: number | null; compact: boolean }): StartupContext {
  const q = new URLSearchParams(location.search);
  const raw = (q.get('open') ?? location.hash.slice(1)).toLowerCase().trim();
  const candidates = raw ? [raw, `p-${raw}`] : [];
  const deepLink = candidates.find(opts.hasWindow) ?? null;

  let referrer: StartupContext['referrer'] = 'none';
  try {
    const host = document.referrer ? new URL(document.referrer).hostname : '';
    if (host && host !== location.hostname) {
      referrer = /linkedin\./.test(host) ? 'linkedin'
        : /github\.(com|io)$/.test(host) ? 'github'
        : /(google|bing|duckduckgo|kagi|search\.yahoo)\./.test(host) ? 'search'
        : 'other';
    }
  } catch { /* malformed referrer */ }

  let returning = false, welcomeOptOut = false;
  try {
    returning = localStorage.getItem(VISITED_KEY) === '1';
    welcomeOptOut = localStorage.getItem(WELCOME_KEY) === 'off';
    localStorage.setItem(VISITED_KEY, '1');
  } catch { /* storage blocked */ }

  const WEEK = 7 * 24 * 3600 * 1000;
  return {
    deepLink,
    hasSession: opts.sessionAgeMs !== null && opts.sessionAgeMs < WEEK,
    referrer,
    compact: opts.compact,
    welcomeOptOut,
    returning,
  };
}

export function setWelcomeOptOut(off: boolean) {
  try { localStorage.setItem(WELCOME_KEY, off ? 'off' : 'on'); } catch { /* ignore */ }
}
