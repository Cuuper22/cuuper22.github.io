// The desktop wallpaper as a single fragment shader: star field, aurora, horizon,
// and an endless phosphor grid. Falls back to the CSS grid when WebGL2 is missing.

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
out vec4 o;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  float horizon = 0.40 + uMouse.y * 0.012;
  vec3 col;

  // Sky: void at the top, deep teal toward the horizon
  float sky = smoothstep(horizon, 1.0, uv.y);
  col = mix(vec3(0.020, 0.055, 0.095), vec3(0.008, 0.014, 0.032), sky);

  // Aurora: a slow, breathing band of phosphor
  float wave = horizon + 0.2 + 0.035 * sin(uv.x * 3.1 + uTime * 0.06) + 0.02 * sin(uv.x * 7.3 - uTime * 0.09);
  float band = exp(-pow((uv.y - wave) * 8.0, 2.0));
  col += vec3(0.05, 0.42, 0.48) * band * 0.11;
  col += vec3(0.20, 0.25, 0.60) * exp(-pow((uv.y - wave - 0.09) * 6.0, 2.0)) * 0.05;

  // Stars: pixel-snapped so they read as a dot matrix, twinkling on their own clocks
  if (uv.y > horizon) {
    vec2 cell = floor((gl_FragCoord.xy + uMouse * 6.0) / 3.0);
    float h = hash(cell);
    float star = step(0.9968, h);
    float tw = 0.55 + 0.45 * sin(uTime * (0.7 + h * 2.6) + h * 50.0);
    col += star * tw * mix(vec3(0.6, 0.85, 1.0), vec3(1.0, 0.85, 0.6), step(0.9993, h)) * smoothstep(horizon + 0.02, horizon + 0.3, uv.y);
  }

  // Floor: an endless grid in perspective, drifting toward the viewer
  if (uv.y < horizon) {
    float d = horizon - uv.y;
    float z = 0.32 / (d + 0.0008);
    float x = (uv.x - 0.5 - uMouse.x * 0.04) * aspect * z;
    vec2 gp = vec2(x * 1.2, z + uTime * 0.55);
    vec2 w = fwidth(gp);
    vec2 g = abs(fract(gp - 0.5) - 0.5) / max(w, vec2(1e-4));
    float line = 1.0 - min(min(g.x, g.y), 1.0);
    float near = smoothstep(0.0, 0.18, d);
    col = mix(vec3(0.006, 0.02, 0.035), vec3(0.0, 0.05, 0.065), clamp(d * 2.2, 0.0, 1.0));
    col += vec3(0.37, 0.95, 1.0) * line * (0.10 + 0.55 * near);
  }

  // Horizon: a hot line and a wide glow
  float dh = abs(uv.y - horizon);
  col += vec3(0.37, 0.95, 1.0) * exp(-dh * 140.0) * 0.55;
  col += vec3(0.0, 0.45, 0.45) * exp(-dh * 6.0) * 0.16;

  // Vignette, then dither away the banding
  vec2 q = uv - 0.5;
  col *= 1.0 - dot(q * vec2(0.9, 1.2), q * vec2(0.9, 1.2)) * 0.8;
  col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) * (2.0 / 255.0);
  o = vec4(col, 1.0);
}`;

const VERT = `#version 300 es
in vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

export function startWallpaper(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
  if (!gl) return;

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
    return s;
  };
  let prog: WebGLProgram;
  try {
    prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link');
  } catch (err) {
    console.warn('wallpaper: falling back to CSS', err);
    return;
  }
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uMouse = gl.getUniformLocation(prog, 'uMouse');

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

  function resize() {
    // Cap the pixel budget: the shader is cheap, but 4K at full DPR is not free
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    let w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    const scale = Math.min(1, Math.sqrt(2_400_000 / Math.max(1, w * h)));
    w = Math.max(1, Math.round(w * scale)); h = Math.max(1, Math.round(h * scale));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl!.viewport(0, 0, w, h); }
  }

  let raf = 0, last = 0;
  const t0 = performance.now();
  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    if (now - last < 33) return; // ~30fps is plenty for a wallpaper
    last = now;
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;
    draw((now - t0) / 1000);
  }
  function draw(t: number) {
    resize();
    gl!.uniform2f(uRes, canvas.width, canvas.height);
    gl!.uniform1f(uTime, t);
    gl!.uniform2f(uMouse, mouse.x, mouse.y);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
  }

  addEventListener('pointermove', e => {
    mouse.tx = (e.clientX / innerWidth) * 2 - 1;
    mouse.ty = -((e.clientY / innerHeight) * 2 - 1);
  }, { passive: true });
  addEventListener('resize', () => { if (reduce) draw(40); });
  document.addEventListener('visibilitychange', () => {
    if (reduce) return;
    cancelAnimationFrame(raf);
    if (!document.hidden) raf = requestAnimationFrame(frame);
  });
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); cancelAnimationFrame(raf); canvas.classList.remove('is-live'); });

  if (reduce) draw(40);
  else raf = requestAnimationFrame(frame);
  canvas.classList.add('is-live');
}
