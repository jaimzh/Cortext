// Adapted from React Bits: https://reactbits.dev/backgrounds/letter-glitch

import { useRef, useEffect } from 'react';

const FALLBACK_RGB = { r: 255, g: 255, b: 255 };
const DEFAULT_COLORS = ['#2b4539', '#61dca3', '#61b3dc'];

const LetterGlitch = ({
  glitchColors = DEFAULT_COLORS,
  className = '',
  glitchSpeed = 50,
  centerVignette = false,
  outerVignette = true,
  smooth = true,
  lightMode = false,
  backgroundColor,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789',
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const letters = useRef([]);
  const grid = useRef({ columns: 0, rows: 0 });
  const context = useRef(null);
  const lastGlitchTime = useRef(Date.now());
  const active = useRef(false);

  const lettersAndSymbols = Array.from(characters);

  const fontSize = 16;
  const charWidth = 10;
  const charHeight = 20;

  const getRandomChar = () => {
    return lettersAndSymbols[Math.floor(Math.random() * lettersAndSymbols.length)];
  };

  const getRandomColor = () => {
    return glitchColors[Math.floor(Math.random() * glitchColors.length)];
  };

  const hexToRgb = (hex) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => {
      return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  // Interpolate RGB values before converting them to CSS at paint time.
  const mixRgb = (start, end, factor) => ({
    r: Math.round(start.r + (end.r - start.r) * factor),
    g: Math.round(start.g + (end.g - start.g) * factor),
    b: Math.round(start.b + (end.b - start.b) * factor),
  });

  const rgbToCss = ({ r, g, b }) => `rgb(${r}, ${g}, ${b})`;

  // An unparseable entry in glitchColors must not stall the animation.
  const getRandomRgb = () => hexToRgb(getRandomColor()) || FALLBACK_RGB;

  const calculateGrid = (width, height) => {
    const columns = Math.ceil(width / charWidth);
    const rows = Math.ceil(height / charHeight);
    return { columns, rows };
  };

  const initializeLetters = (columns, rows) => {
    grid.current = { columns, rows };
    const totalLetters = columns * rows;
    letters.current = Array.from({ length: totalLetters }, () => {
      const rgb = getRandomRgb();
      return {
        char: getRandomChar(),
        rgb,
        fromRgb: rgb,
        targetRgb: getRandomRgb(),
        colorProgress: 1,
      };
    });
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    if (context.current) {
      context.current.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const { columns, rows } = calculateGrid(rect.width, rect.height);
    initializeLetters(columns, rows);

    drawLetters();
  };

  const drawLetters = () => {
    if (!context.current || letters.current.length === 0) return;
    const ctx = context.current;
    const { width, height } = canvasRef.current.getBoundingClientRect();
    ctx.clearRect(0, 0, width, height);
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = 'top';

    letters.current.forEach((letter, index) => {
      const x = (index % grid.current.columns) * charWidth;
      const y = Math.floor(index / grid.current.columns) * charHeight;
      ctx.fillStyle = rgbToCss(letter.rgb);
      ctx.fillText(letter.char, x, y);
    });
  };

  const updateLetters = () => {
    if (!letters.current || letters.current.length === 0) return;

    const updateCount = Math.max(1, Math.floor(letters.current.length * 0.05));

    for (let i = 0; i < updateCount; i++) {
      const index = Math.floor(Math.random() * letters.current.length);
      if (!letters.current[index]) continue;

      letters.current[index].char = getRandomChar();
      // A new transition starts from the colour currently on screen, so a
      // letter picked again mid-fade continues instead of jumping.
      letters.current[index].fromRgb = letters.current[index].rgb;
      letters.current[index].targetRgb = getRandomRgb();

      if (!smooth) {
        letters.current[index].rgb = letters.current[index].targetRgb;
        letters.current[index].colorProgress = 1;
      } else {
        letters.current[index].colorProgress = 0;
      }
    }
  };

  const handleSmoothTransitions = () => {
    let needsRedraw = false;
    letters.current.forEach((letter) => {
      if (letter.colorProgress < 1) {
        letter.colorProgress += 0.05;
        if (letter.colorProgress > 1) letter.colorProgress = 1;

        letter.rgb = mixRgb(letter.fromRgb, letter.targetRgb, letter.colorProgress);
        needsRedraw = true;
      }
    });

    if (needsRedraw) {
      drawLetters();
    }
  };

  const animate = () => {
    if (!active.current) return;
    const now = Date.now();
    if (now - lastGlitchTime.current >= glitchSpeed) {
      updateLetters();
      drawLetters();
      lastGlitchTime.current = now;
    }

    if (smooth) {
      handleSmoothTransitions();
    }

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    context.current = canvas.getContext('2d');
    if (!context.current) return;
    resizeCanvas();
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    const updateAnimation = () => {
      cancelAnimationFrame(animationRef.current);
      active.current = visible && !motion.matches && !document.hidden;
      lastGlitchTime.current = Date.now();
      if (active.current) animate();
    };
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updateAnimation();
    });
    visibility.observe(canvas);
    const resize = new ResizeObserver(resizeCanvas);
    resize.observe(canvas.parentElement);
    motion.addEventListener('change', updateAnimation);
    document.addEventListener('visibilitychange', updateAnimation);

    return () => {
      active.current = false;
      cancelAnimationFrame(animationRef.current);
      visibility.disconnect();
      resize.disconnect();
      motion.removeEventListener('change', updateAnimation);
      document.removeEventListener('visibilitychange', updateAnimation);
    };
  }, [glitchSpeed, smooth, glitchColors, characters]);

  const background = backgroundColor || (lightMode ? '#ffffff' : '#000000');
  const vignetteRgb = hexToRgb(background) || (lightMode ? FALLBACK_RGB : { r: 0, g: 0, b: 0 });
  const vignetteColor = `${vignetteRgb.r},${vignetteRgb.g},${vignetteRgb.b}`;

  const containerStyle = {
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: background,
    overflow: 'hidden',
  };

  const canvasStyle = {
    display: 'block',
    width: '100%',
    height: '100%',
  };

  const outerVignetteStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    background: `radial-gradient(circle, rgba(${vignetteColor},0) ${lightMode ? 58 : 60}%, rgba(${vignetteColor},${lightMode ? 0.96 : 1}) 100%)`,
  };

  const centerVignetteStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    background: `radial-gradient(circle, rgba(${vignetteColor},${lightMode ? 0.9 : 0.8}) 0%, rgba(${vignetteColor},0) 60%)`,
  };

  return (
    <div style={containerStyle} className={className} aria-hidden="true">
      <canvas ref={canvasRef} style={canvasStyle} />
      {outerVignette && <div style={outerVignetteStyle}></div>}
      {centerVignette && <div style={centerVignetteStyle}></div>}
    </div>
  );
};

export default LetterGlitch;
