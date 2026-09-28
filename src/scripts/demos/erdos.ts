// Replays one Erdos solve, stage by stage, in the order src/solver.py runs them:
// A generate → B integrity (SHA-256 lock + banned patterns) → C lake build → D critic.
// Candidates come from tests/test_real_data_validation.py; hashes are computed live.
import { wm } from '../wm';

const WIN = 'p-erdos';
const ORIGINAL = 'theorem one_plus_one : 1 + 1 = 2 := by\n  sorry';
const BANNED = ['sorry', 'admit', 'axiom', 'native_decide'];
const SANITIZED = 'Your proof was rejected. Try a different approach using standard Lean 4 tactics.';

interface Attempt {
  code: string;
  /** Which stage fails, or null if it solves */
  fails: 'build' | 'lock' | 'banned' | 'critic' | null;
  compilerMsg?: string;
  criticMsg?: string;
}

const ATTEMPTS: Attempt[] = [
  {
    code: 'theorem one_plus_one : 1 + 1 = 2 := by\n  exact Nat.succ_le_succ',
    fails: 'build',
    compilerMsg: "COMPILER: type mismatch\n  Nat.succ_le_succ\nhas type ?n ≤ ?m → Nat.succ ?n ≤ Nat.succ ?m\nbut is expected to have type 1 + 1 = 2",
  },
  { code: 'theorem one_plus_one : True := by\n  trivial', fails: 'lock' },
  { code: 'axiom my_cheat : 1 + 1 = 2\ntheorem one_plus_one : 1 + 1 = 2 := my_cheat', fails: 'banned' },
  { code: 'theorem one_plus_one : 1 + 1 = 2 := by\n  rfl', fails: null, criticMsg: '{"status":"PASS","is_elegant":true,"security_concerns":[]}' },
];

/** validator.extract_theorem_statement + compute_theorem_hash, in miniature */
function statementOf(src: string) {
  const code = src.split('\n').map(l => (l.trim().startsWith('--') ? '' : l)).join('\n');
  const m = code.match(/(?:theorem|lemma)\s+one_plus_one[\s\S]*?(?=:=)/);
  return m ? m[0].split(/\s+/).join(' ').trim() : '';
}
async function sha256(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

const esc = (s: string) => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export function mount(root: HTMLElement) {
  const $ = (s: string) => root.querySelector<HTMLElement>(s)!;
  const stages = [...root.querySelectorAll<HTMLElement>('[data-stage]')];
  const code = $('[data-code]'), log = $('[data-log]'), fb = $('[data-feedback]');
  const verdict = $('[data-verdict]'), attemptEl = $('[data-attempt]'), cand = $('[data-cand-hash]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let lockHash = '';
  let run = 0;          // incremented to cancel an in-flight replay
  let stepMode = false;
  let stepResolve: (() => void) | null = null;

  const pause = (ms: number, token: number) => {
    if (token !== run) return Promise.reject('cancelled');
    if (stepMode) return new Promise<void>(r => (stepResolve = r));
    return sleep(reduce ? 0 : ms).then(() => { if (token !== run) throw 'cancelled'; });
  };
  const setStage = (key: string, s: 'run' | 'pass' | 'fail' | 'skip' | '') => {
    const el = stages.find(x => x.dataset.stage === key);
    if (el) el.dataset.s = s;
  };
  const emit = (event: string, extra: Record<string, unknown>, cls = '') => {
    const line = JSON.stringify({ event, problem_id: 'one_plus_one', ...extra });
    log.insertAdjacentHTML('beforeend', `<span class="${cls || 'ev'}">${esc(line)}</span>\n`);
    log.scrollTop = log.scrollHeight;
  };

  async function replay() {
    const token = ++run;
    log.textContent = '';
    fb.textContent = 'Nothing yet.';
    lockHash = await sha256(statementOf(ORIGINAL));
    $('[data-lock-hash]').textContent = `${lockHash.slice(0, 16)}…`;
    emit('problem_started', { theorem_hash: lockHash.slice(0, 16) });

    try {
      for (let i = 0; i < ATTEMPTS.length; i++) {
        const a = ATTEMPTS[i];
        stages.forEach(s => (s.dataset.s = ''));
        verdict.className = 'er-verdict';
        verdict.textContent = '';
        cand.textContent = '';
        attemptEl.textContent = String(i + 1);

        setStage('gen', 'run');
        code.textContent = '';
        await pause(350, token);
        code.innerHTML = esc(a.code);
        setStage('gen', 'pass');
        emit('cost_update', { attempt: i + 1, usd: +(0.0021 * (i + 1)).toFixed(4) });
        await pause(650, token);

        // B: integrity: hash first, then banned patterns
        setStage('lock', 'run');
        const h = await sha256(statementOf(a.code));
        const same = h === lockHash;
        cand.innerHTML = `candidate sha256 ${h.slice(0, 16)}… <span class="${same ? 'good' : 'bad'}">${same ? 'matches lock' : 'MISMATCH'}</span>`;
        const banned = BANNED.find(b => new RegExp(`\\b${b}\\b`).test(a.code));
        await pause(700, token);
        if (!same || banned) {
          setStage('lock', 'fail'); setStage('build', 'skip'); setStage('critic', 'skip');
          if (!same) code.innerHTML = esc(a.code).replace(/: True/, ': <mark>True</mark>');
          else code.innerHTML = esc(a.code).replace(/\baxiom\b/, '<mark>axiom</mark>');
          const why = !same ? `Theorem statement was modified! Original hash: ${lockHash.slice(0, 16)}... Candidate hash: ${h.slice(0, 16)}...` : `Banned pattern: ${banned}`;
          verdict.className = 'er-verdict fail'; verdict.textContent = 'integrity_fail';
          emit('attempt_result', { attempt: i + 1, status: 'integrity_fail', error: `SYSTEM: ${why}` }, 'bad');
          fb.innerHTML = `<b>${esc(SANITIZED)}</b><br><span style="color:#666">The real reason starts with <code>SYSTEM:</code>, so the sanitizer swaps it for this. The Prover never learns the lock exists.</span>`;
          await pause(1500, token);
          continue;
        }
        setStage('lock', 'pass');

        // C: compile
        setStage('build', 'run');
        await pause(800, token);
        if (a.fails === 'build') {
          setStage('build', 'fail'); setStage('critic', 'skip');
          verdict.className = 'er-verdict fail'; verdict.textContent = 'build_fail';
          emit('attempt_result', { attempt: i + 1, status: 'build_fail' }, 'bad');
          fb.innerHTML = `<code style="white-space:pre-wrap">${esc(a.compilerMsg!)}</code><br><span style="color:#666">Compiler errors are passed through, minus sandbox paths.</span>`;
          await pause(1500, token);
          continue;
        }
        setStage('build', 'pass');

        // D: critic
        setStage('critic', 'run');
        await pause(700, token);
        setStage('critic', 'pass');
        verdict.className = 'er-verdict ok'; verdict.textContent = 'solution_found';
        emit('solution_found', { attempts: i + 1, critic: JSON.parse(a.criticMsg!) }, 'good');
        fb.innerHTML = 'Nothing. It solved it honestly, on the fourth try, with <code>rfl</code>.';
      }
    } catch { /* cancelled by a newer replay */ }
  }

  $('[data-replay]').addEventListener('click', () => { stepMode = false; stepResolve?.(); void replay(); });
  $('[data-step]').addEventListener('click', () => {
    if (!stepMode) { stepMode = true; if (!stepResolve) void replay(); return; }
    const r = stepResolve; stepResolve = null; r?.();
  });

  // Play when opened; stop when closed
  wm.addEventListener('close', e => { if ((e as CustomEvent).detail.id === WIN) run++; });
  wm.addEventListener('open', e => { const d = (e as CustomEvent).detail; if (d.id === WIN && d.first) { stepMode = false; void replay(); } });
  void replay();
}
