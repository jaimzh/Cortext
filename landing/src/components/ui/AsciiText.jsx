// Adapted from Nyx UI: https://nyxui.com/r/ascii-text.json
import { useEffect, useMemo, useRef, useState } from 'react';
import './AsciiText.css';
const GLYPH_HEIGHT = 6;
const FONT = {
  A: ['  ████  ', ' ██  ██ ', '████████', '██    ██', '██    ██', '██    ██'],
  B: ['███████ ', '██    ██', '███████ ', '██    ██', '██    ██', '███████ '],
  C: [' ███████', '██      ', '██      ', '██      ', '██      ', ' ███████'],
  D: ['███████ ', '██    ██', '██    ██', '██    ██', '██    ██', '███████ '],
  E: ['████████', '██      ', '██████  ', '██      ', '██      ', '████████'],
  F: ['████████', '██      ', '██████  ', '██      ', '██      ', '██      '],
  G: [' ███████', '██      ', '██  ████', '██    ██', '██    ██', ' ███████'],
  H: ['██    ██', '██    ██', '████████', '██    ██', '██    ██', '██    ██'],
  I: ['████████', '   ██   ', '   ██   ', '   ██   ', '   ██   ', '████████'],
  J: ['████████', '      ██', '      ██', '      ██', '██    ██', ' ███████'],
  K: ['██    ██', '██  ██  ', '████    ', '██  ██  ', '██    ██', '██    ██'],
  L: ['██      ', '██      ', '██      ', '██      ', '██      ', '████████'],
  M: ['██    ██', '████████', '██ ██ ██', '██    ██', '██    ██', '██    ██'],
  N: ['██    ██', '███   ██', '██ ██ ██', '██   ███', '██    ██', '██    ██'],
  O: [' ███████', '██    ██', '██    ██', '██    ██', '██    ██', ' ███████'],
  P: ['███████ ', '██    ██', '███████ ', '██      ', '██      ', '██      '],
  Q: [' ██████ ', '██    ██', '██    ██', '██ ██ ██', '██   ███', ' ███████'],
  R: ['███████ ', '██    ██', '███████ ', '██   ██ ', '██    ██', '██    ██'],
  S: [' ███████', '██      ', ' ██████ ', '      ██', '      ██', '███████ '],
  T: ['████████', '   ██   ', '   ██   ', '   ██   ', '   ██   ', '   ██   '],
  U: ['██    ██', '██    ██', '██    ██', '██    ██', '██    ██', ' ███████'],
  V: ['██    ██', '██    ██', '██    ██', ' ██  ██ ', '  ████  ', '   ██   '],
  W: ['██    ██', '██    ██', '██    ██', '██ ██ ██', '████████', '██    ██'],
  X: ['██    ██', ' ██  ██ ', '  ████  ', '  ████  ', ' ██  ██ ', '██    ██'],
  Y: ['██    ██', ' ██  ██ ', '  ████  ', '   ██   ', '   ██   ', '   ██   '],
  Z: ['████████', '      ██', '    ██  ', '  ██    ', '██      ', '████████'],
  0: [' ██████ ', '██    ██', '██    ██', '██    ██', '██    ██', ' ██████ '],
  1: ['   ██   ', '  ███   ', '   ██   ', '   ██   ', '   ██   ', ' ██████ '],
  2: [' ██████ ', '██    ██', '     ██ ', '   ██   ', ' ██     ', '████████'],
  3: [' ██████ ', '██    ██', '    ███ ', '      ██', '██    ██', ' ██████ '],
  4: ['██    ██', '██    ██', '████████', '      ██', '      ██', '      ██'],
  5: ['████████', '██      ', '███████ ', '      ██', '██    ██', ' ██████ '],
  6: [' ██████ ', '██      ', '███████ ', '██    ██', '██    ██', ' ██████ '],
  7: ['████████', '      ██', '     ██ ', '    ██  ', '   ██   ', '   ██   '],
  8: [' ██████ ', '██    ██', ' ██████ ', '██    ██', '██    ██', ' ██████ '],
  9: [' ██████ ', '██    ██', ' ███████', '      ██', '      ██', ' ██████ '],
  '.': ['        ', '        ', '        ', '        ', '   ██   ', '   ██   '],
  ',': ['        ', '        ', '        ', '   ██   ', '   ██   ', '  ██    '],
  '!': ['   ██   ', '   ██   ', '   ██   ', '   ██   ', '        ', '   ██   '],
  '?': [' ██████ ', '██    ██', '     ██ ', '   ██   ', '        ', '   ██   '],
  '-': ['        ', '        ', '████████', '        ', '        ', '        '],
  '+': ['        ', '   ██   ', '████████', '   ██   ', '        ', '        '],
  '=': ['        ', '████████', '        ', '████████', '        ', '        '],
  ':': ['        ', '   ██   ', '        ', '        ', '   ██   ', '        '],
  "'": ['   ██   ', '   ██   ', '        ', '        ', '        ', '        '],
  '/': ['      ██', '     ██ ', '    ██  ', '   ██   ', '  ██    ', ' ██     '],
  '\\': [' ██     ', '  ██    ', '   ██   ', '    ██  ', '     ██ ', '      ██'],
  '*': ['        ', '██ ██ ██', ' ██████ ', '██ ██ ██', '        ', '        '],
  '<': ['     ██ ', '   ██   ', ' ██     ', '   ██   ', '     ██ ', '        '],
  '>': [' ██     ', '   ██   ', '     ██ ', '   ██   ', ' ██     ', '        '],
  '(': ['    ██  ', '  ██    ', '  ██    ', '  ██    ', '  ██    ', '    ██  '],
  ')': ['  ██    ', '    ██  ', '    ██  ', '    ██  ', '    ██  ', '  ██    '],
  '[': ['  ████  ', '  ██    ', '  ██    ', '  ██    ', '  ██    ', '  ████  '],
  ']': ['  ████  ', '    ██  ', '    ██  ', '    ██  ', '    ██  ', '  ████  '],
  '#': [' ██  ██ ', '████████', ' ██  ██ ', '████████', ' ██  ██ ', '        '],
  '@': [' ██████ ', '██    ██', '██ ██ ██', '██ ████ ', '██      ', ' ██████ '],
  _: ['        ', '        ', '        ', '        ', '        ', '████████'],
  ' ': ['        ', '        ', '        ', '        ', '        ', '        '],
};
const DEFAULT_RAMP = '░▒▓█';
function buildGrid(text, letterSpacing) {
  const glyphs = text
    .toUpperCase()
    .split('')
    .map((ch) => FONT[ch])
    .filter((g) => Boolean(g));
  if (glyphs.length === 0) return [];
  const gap = ' '.repeat(Math.max(0, letterSpacing));
  const rows = [];
  for (let row = 0; row < GLYPH_HEIGHT; row++) {
    const line = glyphs.map((g) => g[row]).join(gap);
    rows.push(line.split('').map((ch) => ch !== ' '));
  }
  return rows;
}
export function AsciiText({
  text = 'NYX UI',
  animation = 'wave',
  speed = 1,
  fontSize = 14,
  autoFit = true,
  letterSpacing = 2,
  color,
  glow = false,
  ramp = DEFAULT_RAMP,
  className,
  style,
  ...rest
}) {
  const containerRef = useRef(null);
  const [frame, setFrame] = useState('');
  const [fitSize, setFitSize] = useState(null);
  const [reduceMotion, setReduceMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(preference.matches);
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  const grid = useMemo(() => buildGrid(text, letterSpacing), [text, letterSpacing]);
  const cols = grid[0]?.length ?? 0;
  const liveRef = useRef({ animation, speed, ramp, grid });
  liveRef.current = { animation, speed, ramp, grid };
  useEffect(() => {
    if (grid.length === 0) {
      setFrame('');
      return;
    }
    let raf = 0;
    const start = performance.now();
    const render = (now) => {
      const { animation: requestedMode, speed: rate, ramp: chars, grid: g } = liveRef.current;
      const mode = reduceMotion ? 'none' : requestedMode;
      const t = reduceMotion ? 0 : ((now - start) / 1000) * rate;
      const last = chars.length - 1;
      const lit = chars[last] ?? '█';
      const rows = g.length;
      const width = g[0]?.length ?? 0;
      const out = [];
      for (let y = 0; y < rows; y++) {
        let line = '';
        for (let x = 0; x < width; x++) {
          if (!g[y][x]) {
            line += ' ';
            continue;
          }
          switch (mode) {
            case 'wave': {
              const v = (Math.sin(x * 0.18 - t * 3 + y * 0.25) + 1) / 2;
              line += chars[Math.round(v * last)] ?? lit;
              break;
            }
            case 'pulse': {
              const v = (Math.sin(t * 2.2) + 1) / 2;
              line += chars[Math.round(v * last)] ?? lit;
              break;
            }
            case 'scan': {
              const band = ((t * 0.6) % 1) * rows;
              const d = Math.abs(y - band);
              const v = Math.max(0, 1 - d / 2);
              line += chars[Math.round(v * last)] ?? lit;
              break;
            }
            case 'glitch': {
              const seed = Math.sin(x * 12.9898 + y * 78.233 + Math.floor(t * 8)) * 43758.5453;
              const n = seed - Math.floor(seed);
              if (n > 0.96) {
                line += ' ';
              } else if (n > 0.82) {
                const dim = Math.floor(((n - 0.82) / 0.14) * last);
                line += chars[Math.min(Math.max(last - 1, 0), Math.max(0, dim))] ?? lit;
              } else {
                line += lit;
              }
              break;
            }
            case 'typewriter': {
              const revealed = ((t * 12) % (width + 12)) | 0;
              line += x <= revealed ? lit : ' ';
              break;
            }
            default:
              line += lit;
          }
        }
        out.push(line);
      }
      setFrame(out.join('\n'));
      if (mode !== 'none' && !reduceMotion) {
        raf = requestAnimationFrame(render);
      }
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [grid, animation, reduceMotion]);
  useEffect(() => {
    if (!autoFit || cols === 0) return;
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const width = el.clientWidth;
      if (width > 0) setFitSize(Math.max(4, width / (cols * 0.62)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [autoFit, cols]);
  const size = autoFit ? (fitSize ?? fontSize) : fontSize;
  return (
    <div
      ref={containerRef}
      className={['ascii-text', className].filter(Boolean).join(' ')}
      style={style}
      role="img"
      aria-label={text}
      {...rest}
    >
      <pre
        aria-hidden
        className="ascii-text-frame"
        style={{
          fontSize: `${size}px`,
          color,
          textShadow: glow ? '0 0 0.5em currentColor' : undefined,
        }}
      >
        {frame}
      </pre>
    </div>
  );
}
