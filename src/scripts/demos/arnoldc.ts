// A toy ArnoldC → x86 compiler and interpreter, for the page only.
// It mimics the *shape* of ArnoldC-Native's AsmGenerator output (cdecl frames,
// ebp-relative locals, labelled loops) for a small subset of the language.

type Op =
  | { k: 'main' } | { k: 'end' }
  | { k: 'decl'; v: string } | { k: 'init'; n: number }
  | { k: 'print'; s?: string; v?: string }
  | { k: 'assign'; v: string } | { k: 'load'; a: string } | { k: 'arith'; op: 'add' | 'sub' | 'mul' | 'div'; a: string } | { k: 'store' }
  | { k: 'while'; v: string } | { k: 'wend' }
  | { k: 'if'; v: string } | { k: 'else' } | { k: 'endif' }
  | { k: 'cli' } | { k: 'sti' } | { k: 'hlt' };

const RULES: [RegExp, (m: RegExpMatchArray) => Op][] = [
  [/^IT'S SHOWTIME$/, () => ({ k: 'main' })],
  [/^YOU HAVE BEEN TERMINATED$/, () => ({ k: 'end' })],
  [/^HEY CHRISTMAS TREE (\w+)$/, m => ({ k: 'decl', v: m[1] })],
  [/^YOU SET US UP (-?\d+)$/, m => ({ k: 'init', n: +m[1] })],
  [/^TALK TO THE HAND "(.*)"$/, m => ({ k: 'print', s: m[1] })],
  [/^TALK TO THE HAND (\w+)$/, m => ({ k: 'print', v: m[1] })],
  [/^GET TO THE CHOPPER (\w+)$/, m => ({ k: 'assign', v: m[1] })],
  [/^HERE IS MY INVITATION (\w+)$/, m => ({ k: 'load', a: m[1] })],
  [/^GET UP (\w+)$/, m => ({ k: 'arith', op: 'add', a: m[1] })],
  [/^GET DOWN (\w+)$/, m => ({ k: 'arith', op: 'sub', a: m[1] })],
  [/^YOU'RE FIRED (\w+)$/, m => ({ k: 'arith', op: 'mul', a: m[1] })],
  [/^HE HAD TO SPLIT (\w+)$/, m => ({ k: 'arith', op: 'div', a: m[1] })],
  [/^ENOUGH TALK$/, () => ({ k: 'store' })],
  [/^STICK AROUND (\w+)$/, m => ({ k: 'while', v: m[1] })],
  [/^CHILL$/, () => ({ k: 'wend' })],
  [/^BECAUSE I'M GOING TO SAY PLEASE (\w+)$/, m => ({ k: 'if', v: m[1] })],
  [/^BULLSHIT$/, () => ({ k: 'else' })],
  [/^YOU HAVE NO RESPECT FOR LOGIC$/, () => ({ k: 'endif' })],
  [/^EVERYBODY CHILL$/, () => ({ k: 'cli' })],
  [/^LET'S PARTY$/, () => ({ k: 'sti' })],
  [/^SLEEP NOW$/, () => ({ k: 'hlt' })],
];

function parse(src: string): { ops: Op[]; error?: string } {
  const ops: Op[] = [];
  const lines = src.split('\n').map(l => l.trim().toUpperCase().replace(/[‘’]/g, "'"));
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const hit = RULES.find(([re]) => re.test(line));
    if (!hit) return { ops, error: `line ${i + 1}: WHAT THE FUCK DID I DO WRONG? unknown statement "${line}"` };
    ops.push(hit[1](line.match(hit[0])!));
  }
  return { ops };
}

const esc = (s: string) => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));

function compile(ops: Op[]): string {
  const slots = new Map<string, number>();
  const strings: string[] = [];
  const out: string[] = [];
  const c = (s: string) => `<span class="c">${esc(s)}</span>`;
  const L = (s: string) => `<span class="l">${s}:</span>`;
  const operand = (a: string) => /^-?\d+$/.test(a) ? a : `dword [ebp-${slot(a)}]`;
  function slot(v: string) { if (!slots.has(v)) slots.set(v, (slots.size + 1) * 4); return slots.get(v)!; }
  const loops: number[] = [], ifs: number[] = [];
  const hasElse = new Set<number>();
  let label = 0;

  ops.forEach(op => { if (op.k === 'decl') slot(op.v); });
  for (const op of ops) {
    switch (op.k) {
      case 'main': out.push(`${L('main')}`, `    push ebp`, `    mov  ebp, esp`, `    sub  esp, ${slots.size * 4}          ${c(`; ${slots.size} local(s)`)}`); break;
      case 'decl': out.push(`    ${c(`; HEY CHRISTMAS TREE ${op.v}  → [ebp-${slot(op.v)}]`)}`); break;
      case 'init': {
        const last = [...slots.keys()].at(-1)!;
        out.push(`    mov  dword [ebp-${slot(last)}], ${op.n}`); break;
      }
      case 'print':
        if (op.s !== undefined) { strings.push(op.s); out.push(`    push str_${strings.length - 1}`, `    call print_str`, `    add  esp, 4`); }
        else out.push(`    push ${operand(op.v!)}`, `    call print_int`, `    add  esp, 4`);
        break;
      case 'assign': out.push(`    ${c(`; GET TO THE CHOPPER ${op.v}`)}`); break;
      case 'load': out.push(`    mov  eax, ${operand(op.a)}`); break;
      case 'arith':
        if (op.op === 'add') out.push(`    add  eax, ${operand(op.a)}`);
        else if (op.op === 'sub') out.push(`    sub  eax, ${operand(op.a)}`);
        else if (op.op === 'mul') out.push(`    imul eax, ${operand(op.a)}`);
        else out.push(`    mov  ecx, ${operand(op.a)}`, `    cdq`, `    idiv ecx`);
        break;
      case 'store': {
        const target = [...ops].slice(0, ops.indexOf(op)).reverse().find(o => o.k === 'assign') as { v: string } | undefined;
        if (target) out.push(`    mov  dword [ebp-${slot(target.v)}], eax`);
        break;
      }
      case 'while': { const n = label++; loops.push(n); out.push(`${L(`.stick_${n}`)}`, `    cmp  ${operand(op.v)}, 0`, `    je   .chill_${n}`); break; }
      case 'wend': { const n = loops.pop()!; out.push(`    jmp  .stick_${n}`, `${L(`.chill_${n}`)}`); break; }
      case 'if': { const n = label++; ifs.push(n); out.push(`    cmp  ${operand(op.v)}, 0`, `    je   .bs_${n}`); break; }
      case 'else': { const n = ifs.at(-1)!; hasElse.add(n); out.push(`    jmp  .logic_${n}`, `${L(`.bs_${n}`)}`); break; }
      case 'endif': { const n = ifs.pop()!; out.push(hasElse.has(n) ? L(`.logic_${n}`) : L(`.bs_${n}`)); break; }
      case 'cli': out.push(`    cli                  ${c('; EVERYBODY CHILL')}`); break;
      case 'sti': out.push(`    sti                  ${c("; LET'S PARTY")}`); break;
      case 'hlt': out.push(`    hlt                  ${c('; SLEEP NOW')}`); break;
      case 'end': out.push(`    xor  eax, eax`, `    mov  esp, ebp`, `    pop  ebp`, `    ret`); break;
    }
  }
  const data = strings.map((s, i) => `str_${i}: db "${esc(s)}", 0`);
  return [c('; generated by a toy, shaped like ArnoldC-Native'), 'section .text', 'global main', '', ...out, ...(data.length ? ['', 'section .data', ...data] : [])].join('\n');
}

function run(ops: Op[]): string {
  const vars = new Map<string, number>();
  const out: string[] = [];
  let acc = 0, target = '';
  const val = (a: string) => /^-?\d+$/.test(a) ? +a : (vars.get(a) ?? 0);
  // Pre-compute block jumps
  const jump = new Map<number, number>();
  const stack: number[] = [];
  ops.forEach((op, i) => {
    if (op.k === 'while' || op.k === 'if') stack.push(i);
    else if (op.k === 'else') { jump.set(stack.at(-1)!, i); }
    else if (op.k === 'wend' || op.k === 'endif') { const s = stack.pop()!; if (!jump.has(s)) jump.set(s, i); jump.set(i, s); }
  });
  let lastDecl = '';
  let steps = 0;
  for (let pc = 0; pc < ops.length; pc++) {
    if (++steps > 5000) { out.push('I\'LL BE BACK... (stopped after 5,000 steps)'); break; }
    const op = ops[pc];
    switch (op.k) {
      case 'decl': vars.set(op.v, 0); lastDecl = op.v; break;
      case 'init': vars.set(lastDecl, op.n); break;
      case 'print': out.push(op.s ?? String(val(op.v!))); break;
      case 'assign': target = op.v; break;
      case 'load': acc = val(op.a); break;
      case 'arith': acc = op.op === 'add' ? acc + val(op.a) : op.op === 'sub' ? acc - val(op.a) : op.op === 'mul' ? acc * val(op.a) : Math.trunc(acc / (val(op.a) || 1)); break;
      case 'store': vars.set(target, acc | 0); break;
      case 'while': if (!val(op.v)) pc = jump.get(pc)!; break;
      case 'wend': pc = jump.get(pc)! - 1; break;
      case 'if': if (!val(op.v)) pc = jump.get(pc)!; break;
      case 'else': { let d = 0, j = pc + 1; for (; j < ops.length; j++) { const k = ops[j].k; if (k === 'if') d++; else if (k === 'endif') { if (!d) break; d--; } } pc = j; break; }
      case 'end': return out.join('\n');
    }
  }
  return out.join('\n');
}

export function mount(root: HTMLElement) {
  const src = root.querySelector<HTMLTextAreaElement>('[data-src]')!;
  const asm = root.querySelector<HTMLElement>('[data-asm]')!;
  const out = root.querySelector<HTMLElement>('[data-out]')!;
  const update = () => {
    const { ops, error } = parse(src.value);
    if (error) { asm.innerHTML = `<span class="e">${esc(error)}</span>`; out.textContent = ''; return; }
    asm.innerHTML = compile(ops);
    out.textContent = run(ops) || '(no output)';
  };
  let t = 0;
  src.addEventListener('input', () => { clearTimeout(t); t = window.setTimeout(update, 120); });
  update();
}
