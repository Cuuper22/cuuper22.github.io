// Upstream/downstream highlighting along a real gpu_stack dependency path.
export function mount(root: HTMLElement) {
  const nodes = [...root.querySelectorAll<HTMLButtonElement>('.gp-node')];
  const idEl = root.querySelector<HTMLElement>('[data-info-id]')!;
  const descEl = root.querySelector<HTMLElement>('[data-info-desc]')!;
  const upEl = root.querySelector<HTMLElement>('[data-info-up]')!;
  const traceBtn = root.querySelector<HTMLButtonElement>('[data-trace]')!;
  let tracing = 0;

  function select(i: number) {
    nodes.forEach((n, j) => {
      n.classList.toggle('sel', j === i);
      n.classList.toggle('up', j < i);
      n.classList.toggle('down', j > i);
      n.classList.remove('lit');
      n.setAttribute('aria-pressed', String(j === i));
    });
    const n = nodes[i];
    idEl.textContent = n.dataset.node!;
    descEl.textContent = n.dataset.desc!;
    const up = i, down = nodes.length - 1 - i;
    upEl.textContent = up === 0
      ? `None. It's a constant. ${down} variables downstream depend on it.`
      : `${up} variable${up > 1 ? 's' : ''} upstream, ${down} downstream.`;
  }

  nodes.forEach((n, i) => n.addEventListener('click', () => { tracing++; select(i); }));

  traceBtn.addEventListener('click', async () => {
    const token = ++tracing;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    nodes.forEach(n => n.classList.remove('sel', 'up', 'down', 'lit'));
    for (let i = 0; i < nodes.length; i++) {
      if (token !== tracing) return;
      nodes[i].classList.add('lit');
      nodes[i].scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
      idEl.textContent = nodes[i].dataset.node!;
      descEl.textContent = nodes[i].dataset.desc!;
      await new Promise(r => setTimeout(r, reduce ? 0 : 170));
    }
    if (token === tracing) select(nodes.length - 1);
  });

  select(nodes.length - 1);
}
