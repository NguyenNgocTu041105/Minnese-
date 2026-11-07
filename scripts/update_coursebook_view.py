with open('src/components/Coursebook/CoursebookView.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

old_import = """import {
  getHsk1BubbleConfig,
  calculateFallbackBubblePos,
  CharacterBubbleConfig,
} from '../../data/hsk1BubbleLayouts';"""

new_import = """import {
  getHsk1BubbleConfig,
  calculateFallbackBubblePos,
  resolveSmartBubbleBox,
  CharacterBubbleConfig,
} from '../../data/hsk1BubbleLayouts';"""

assert old_import in code.replace('\r\n', '\n'), "old_import not found"

old_section = """// Compute dynamic directional tail geometry connecting bubble perimeter to speaker mouth
function computeTailGeometry(
  bubbleBox: { left: number; top: number; right: number; bottom: number; width: number; height: number },
  mouthPx: { x: number; y: number },
  tailOriginPref?: 'bottom' | 'bottom-left' | 'bottom-right' | 'left' | 'right' | 'top'
) {
  const { left, top, right, bottom, width, height } = bubbleBox;
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;

  // Determine origin edge if not explicitly provided
  let origin = tailOriginPref;
  if (!origin) {
    if (mouthPx.y > bottom) {
      if (mouthPx.x < left + width * 0.35) origin = 'bottom-left';
      else if (mouthPx.x > right - width * 0.35) origin = 'bottom-right';
      else origin = 'bottom';
    } else if (mouthPx.y < top) {
      origin = 'top';
    } else if (mouthPx.x < left) {
      origin = 'left';
    } else {
      origin = 'right';
    }
  } else {
    // Safety check: if origin is inverted relative to mouthTarget, adapt to avoid backwards tail
    if ((origin === 'bottom' || origin === 'bottom-left' || origin === 'bottom-right') && mouthPx.y < bottom) {
      if (mouthPx.y < top) origin = 'top';
      else if (mouthPx.x < left) origin = 'left';
      else if (mouthPx.x > right) origin = 'right';
    } else if (origin === 'top' && mouthPx.y > top) {
      if (mouthPx.y > bottom) origin = 'bottom';
      else if (mouthPx.x < left) origin = 'left';
      else if (mouthPx.x > right) origin = 'right';
    }
  }

  const baseWidth = Math.min(16, width * 0.35);
  const halfBase = baseWidth / 2;
  const overlap = 2.5; // Extension into the card to seamlessly mask the 1.5px card border

  let baseMidX = centerX;
  let baseMidY = bottom;
  let base1 = { x: 0, y: 0 };
  let base2 = { x: 0, y: 0 };
  let baseEdge1 = { x: 0, y: 0 };
  let baseEdge2 = { x: 0, y: 0 };

  switch (origin) {
    case 'bottom-left': {
      baseMidX = left + Math.max(16, Math.min(28, width * 0.25));
      baseMidY = bottom;
      base1 = { x: baseMidX - halfBase, y: bottom - overlap };
      base2 = { x: baseMidX + halfBase, y: bottom - overlap };
      baseEdge1 = { x: baseMidX - halfBase, y: bottom };
      baseEdge2 = { x: baseMidX + halfBase, y: bottom };
      break;
    }
    case 'bottom-right': {
      baseMidX = right - Math.max(16, Math.min(28, width * 0.25));
      baseMidY = bottom;
      base1 = { x: baseMidX - halfBase, y: bottom - overlap };
      base2 = { x: baseMidX + halfBase, y: bottom - overlap };
      baseEdge1 = { x: baseMidX - halfBase, y: bottom };
      baseEdge2 = { x: baseMidX + halfBase, y: bottom };
      break;
    }
    case 'bottom': {
      baseMidX = Math.max(left + 16, Math.min(right - 16, centerX));
      baseMidY = bottom;
      base1 = { x: baseMidX - halfBase, y: bottom - overlap };
      base2 = { x: baseMidX + halfBase, y: bottom - overlap };
      baseEdge1 = { x: baseMidX - halfBase, y: bottom };
      baseEdge2 = { x: baseMidX + halfBase, y: bottom };
      break;
    }
    case 'left': {
      baseMidX = left;
      baseMidY = Math.max(top + 14, Math.min(bottom - 14, centerY));
      base1 = { x: left + overlap, y: baseMidY - halfBase };
      base2 = { x: left + overlap, y: baseMidY + halfBase };
      baseEdge1 = { x: left, y: baseMidY - halfBase };
      baseEdge2 = { x: left, y: baseMidY + halfBase };
      break;
    }
    case 'right': {
      baseMidX = right;
      baseMidY = Math.max(top + 14, Math.min(bottom - 14, centerY));
      base1 = { x: right - overlap, y: baseMidY - halfBase };
      base2 = { x: right - overlap, y: baseMidY + halfBase };
      baseEdge1 = { x: right, y: baseMidY - halfBase };
      baseEdge2 = { x: right, y: baseMidY + halfBase };
      break;
    }
    case 'top': {
      baseMidX = Math.max(left + 16, Math.min(right - 16, centerX));
      baseMidY = top;
      base1 = { x: baseMidX + halfBase, y: top + overlap };
      base2 = { x: baseMidX - halfBase, y: top + overlap };
      baseEdge1 = { x: baseMidX + halfBase, y: top };
      baseEdge2 = { x: baseMidX - halfBase, y: top };
      break;
    }
    default: {
      baseMidX = centerX;
      baseMidY = bottom;
      base1 = { x: baseMidX - halfBase, y: bottom - overlap };
      base2 = { x: baseMidX + halfBase, y: bottom - overlap };
      baseEdge1 = { x: baseMidX - halfBase, y: bottom };
      baseEdge2 = { x: baseMidX + halfBase, y: bottom };
      break;
    }
  }

  // Flexible natural comic tail length: compact pointer, never a long spindly antenna
  // Tail length scales flexibly with distance (12px - 22px), pointing towards speaker without covering face
  const vx = mouthPx.x - baseMidX;
  const vy = mouthPx.y - baseMidY;
  const dist = Math.hypot(vx, vy);

  const maxTailLen = 22;
  const minTailLen = 12;
  const tailLen = Math.min(maxTailLen, Math.max(minTailLen, dist * 0.2));

  const unitX = dist > 0 ? vx / dist : 0;
  const unitY = dist > 0 ? vy / dist : 1;

  const tip = {
    x: baseMidX + unitX * tailLen,
    y: baseMidY + unitY * tailLen,
  };

  return {
    origin,
    base1,
    base2,
    baseEdge1,
    baseEdge2,
    tip,
    dist,
  };
}

interface Hsk1SpeechBubbleProps {
  textItem: LessonText;
  activeLine: { speaker: string; hanzi: string; vietnamese?: string };
  activeLineIdx: number;
  onPlayLine: () => void;
}

const Hsk1SpeechBubble: React.FC<Hsk1SpeechBubbleProps> = ({
  textItem,
  activeLine,
  activeLineIdx,
  onPlayLine,
}) => {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [bubbleMetrics, setBubbleMetrics] = useState<{
    bubbleBox: { left: number; top: number; right: number; bottom: number; width: number; height: number };
    containerWidth: number;
    containerHeight: number;
  } | null>(null);

  const config = getHsk1BubbleConfig(textItem.id, activeLine.speaker) || {
    mouthTarget: { x: 50, y: 35 },
    placement: 'top' as const,
  };

  const bubblePos = config.bubblePos || calculateFallbackBubblePos(config.mouthTarget, config.placement);

  useLayoutEffect(() => {
    const updateMetrics = () => {
      const bubbleEl = bubbleRef.current;
      const containerEl = bubbleEl?.parentElement;
      if (!bubbleEl || !containerEl) return;

      const cRect = containerEl.getBoundingClientRect();
      if (cRect.width === 0 || cRect.height === 0) return;

      // On mobile screens (< 640px), ensure maxWidth adapts responsively so cards do not exceed 72% of container width
      const baseMaxWidth = config.maxWidth || 230;
      const isMobile = cRect.width < 640;
      const responsiveMaxWidth = isMobile
        ? Math.min(baseMaxWidth, Math.round(cRect.width * 0.72))
        : baseMaxWidth;

      bubbleEl.style.maxWidth = `${responsiveMaxWidth}px`;

      const bRect = bubbleEl.getBoundingClientRect();
      const cardW = bRect.width;
      const cardH = bRect.height;

      const rawCenterXPx = (bubblePos.x / 100) * cRect.width;
      const rawCenterYPx = (bubblePos.y / 100) * cRect.height;

      const rawLeft = rawCenterXPx - cardW / 2;
      const rawTop = rawCenterYPx - cardH / 2;

      // Card placement clamped within container pixel bounds:
      // cardLeftPx >= 8 and cardRightPx <= containerWidth - 8,
      // top/bottom margins >= 8px and <= containerHeight - 8px
      const clampedLeft = Math.max(8, Math.min(cRect.width - cardW - 8, rawLeft));
      const clampedTop = Math.max(8, Math.min(cRect.height - cardH - 8, rawTop));
      const clampedRight = clampedLeft + cardW;
      const clampedBottom = clampedTop + cardH;

      setBubbleMetrics({
        bubbleBox: {
          left: clampedLeft,
          top: clampedTop,
          right: clampedRight,
          bottom: clampedBottom,
          width: cardW,
          height: cardH,
        },
        containerWidth: cRect.width,
        containerHeight: cRect.height,
      });
    };

    updateMetrics();

    const containerEl = bubbleRef.current?.parentElement;
    if (!containerEl) return;

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => updateMetrics());
      ro.observe(containerEl);
      if (bubbleRef.current) ro.observe(bubbleRef.current);
    }

    window.addEventListener('resize', updateMetrics);

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateMetrics);
    };
  }, [textItem.id, activeLineIdx, activeLine.speaker, bubblePos.x, bubblePos.y, config.maxWidth]);

  let tailGeom: ReturnType<typeof computeTailGeometry> | null = null;
  if (bubbleMetrics) {
    const mouthPx = {
      x: (config.mouthTarget.x / 100) * bubbleMetrics.containerWidth,
      y: (config.mouthTarget.y / 100) * bubbleMetrics.containerHeight,
    };
    tailGeom = computeTailGeometry(bubbleMetrics.bubbleBox, mouthPx, config.tailOrigin);
  }

  const baseMaxWidth = config.maxWidth || 230;
  const currentMaxWidth = bubbleMetrics
    ? (bubbleMetrics.containerWidth < 640
        ? Math.min(baseMaxWidth, Math.round(bubbleMetrics.containerWidth * 0.72))
        : baseMaxWidth)
    : baseMaxWidth;

  return (
    <>
      {/* Speech Bubble Card */}
      <div
        ref={bubbleRef}
        key={`bubble-${textItem.id}-${activeLineIdx}`}
        className="absolute z-20 pointer-events-auto select-none"
        style={{
          top: bubbleMetrics ? `${bubbleMetrics.bubbleBox.top}px` : `${bubblePos.y}%`,
          left: bubbleMetrics ? `${bubbleMetrics.bubbleBox.left}px` : `${bubblePos.x}%`,
          transform: bubbleMetrics ? 'none' : 'translate(-50%, -50%)',
          maxWidth: `${currentMaxWidth}px`,
        }}
      >
        <div
          onClick={onPlayLine}
          className="relative bg-white/95 text-slate-900 rounded-[18px] sm:rounded-[20px] px-3 py-1.5 sm:px-3.5 sm:py-2 shadow-[0_3px_10px_rgba(0,0,0,0.18)] border-[1.5px] border-slate-800/85 whitespace-normal text-center min-w-[90px] max-w-full cursor-pointer hover:scale-[1.02] transition-transform"
          title="Bấm để nghe đọc lại câu thoại này"
        >
          <div key={activeLineIdx} className="animate-in fade-in duration-200">
            <div className="text-xs sm:text-sm font-bold font-chinese text-slate-900 tracking-normal leading-snug">
              {activeLine.hanzi}
            </div>
            {activeLine.vietnamese && (
              <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                {activeLine.vietnamese}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Directional Tail connecting bubble edge to mouthTarget */}
      {bubbleMetrics && tailGeom && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
          viewBox={`0 0 ${bubbleMetrics.containerWidth} ${bubbleMetrics.containerHeight}`}
        >
          {/* Seamless white wedge with drop shadow */}
          <polygon
            points={`${tailGeom.base1.x},${tailGeom.base1.y} ${tailGeom.tip.x},${tailGeom.tip.y} ${tailGeom.base2.x},${tailGeom.base2.y}`}
            fill="#ffffff"
            className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.12)]"
          />
          {/* Overlap white fill to seamlessly mask card border at base */}
          <polygon
            points={`${tailGeom.base1.x},${tailGeom.base1.y} ${tailGeom.tip.x},${tailGeom.tip.y} ${tailGeom.base2.x},${tailGeom.base2.y}`}
            fill="#ffffff"
          />
          {/* Ink border strokes on left and right sides of tail */}
          <path
            d={`M ${tailGeom.baseEdge1.x} ${tailGeom.baseEdge1.y} L ${tailGeom.tip.x} ${tailGeom.tip.y} L ${tailGeom.baseEdge2.x} ${tailGeom.baseEdge2.y}`}
            stroke="rgba(30,41,59,0.85)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      )}
    </>
  );
};"""

new_section = """// Compute dynamic directional tail geometry connecting bubble perimeter to speaker mouth
function computeTailGeometry(
  bubbleBox: { left: number; top: number; right: number; bottom: number; width: number; height: number },
  mouthPx: { x: number; y: number },
  tailOriginPref?: 'bottom' | 'bottom-left' | 'bottom-right' | 'left' | 'right' | 'top',
  containerWidth: number = 896
) {
  const { left, top, right, bottom, width, height } = bubbleBox;
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;
  const scale = Math.max(0.45, Math.min(1.15, containerWidth / 896));

  // Determine origin edge if not explicitly provided
  let origin = tailOriginPref;
  if (!origin) {
    if (mouthPx.y > bottom) {
      if (mouthPx.x < left + width * 0.35) origin = 'bottom-left';
      else if (mouthPx.x > right - width * 0.35) origin = 'bottom-right';
      else origin = 'bottom';
    } else if (mouthPx.y < top) {
      origin = 'top';
    } else if (mouthPx.x < left) {
      origin = 'left';
    } else {
      origin = 'right';
    }
  } else {
    // Safety check: if origin is inverted relative to mouthTarget, adapt to avoid backwards tail
    if ((origin === 'bottom' || origin === 'bottom-left' || origin === 'bottom-right') && mouthPx.y < bottom) {
      if (mouthPx.y < top) origin = 'top';
      else if (mouthPx.x < left) origin = 'left';
      else if (mouthPx.x > right) origin = 'right';
    } else if (origin === 'top' && mouthPx.y > top) {
      if (mouthPx.y > bottom) origin = 'bottom';
      else if (mouthPx.x < left) origin = 'left';
      else if (mouthPx.x > right) origin = 'right';
    }
  }

  const baseWidth = Math.min(15 * scale, width * 0.32);
  const halfBase = baseWidth / 2;
  const overlap = 2.2; // Extension into the card to seamlessly mask the 1.5px card border
  const cornerPadX = Math.max(12 * scale, Math.min(24 * scale, width * 0.22));
  const cornerPadY = Math.max(10 * scale, Math.min(18 * scale, height * 0.25));

  let baseMidX = centerX;
  let baseMidY = bottom;
  let base1 = { x: 0, y: 0 };
  let base2 = { x: 0, y: 0 };
  let baseEdge1 = { x: 0, y: 0 };
  let baseEdge2 = { x: 0, y: 0 };

  switch (origin) {
    case 'bottom-left': {
      baseMidX = left + cornerPadX;
      baseMidY = bottom;
      base1 = { x: baseMidX - halfBase, y: bottom - overlap };
      base2 = { x: baseMidX + halfBase, y: bottom - overlap };
      baseEdge1 = { x: baseMidX - halfBase, y: bottom };
      baseEdge2 = { x: baseMidX + halfBase, y: bottom };
      break;
    }
    case 'bottom-right': {
      baseMidX = right - cornerPadX;
      baseMidY = bottom;
      base1 = { x: baseMidX - halfBase, y: bottom - overlap };
      base2 = { x: baseMidX + halfBase, y: bottom - overlap };
      baseEdge1 = { x: baseMidX - halfBase, y: bottom };
      baseEdge2 = { x: baseMidX + halfBase, y: bottom };
      break;
    }
    case 'bottom': {
      baseMidX = Math.max(left + cornerPadX, Math.min(right - cornerPadX, centerX * 0.4 + mouthPx.x * 0.6));
      baseMidY = bottom;
      base1 = { x: baseMidX - halfBase, y: bottom - overlap };
      base2 = { x: baseMidX + halfBase, y: bottom - overlap };
      baseEdge1 = { x: baseMidX - halfBase, y: bottom };
      baseEdge2 = { x: baseMidX + halfBase, y: bottom };
      break;
    }
    case 'left': {
      baseMidX = left;
      baseMidY = Math.max(top + cornerPadY, Math.min(bottom - cornerPadY, centerY * 0.45 + mouthPx.y * 0.55));
      base1 = { x: left + overlap, y: baseMidY - halfBase };
      base2 = { x: left + overlap, y: baseMidY + halfBase };
      baseEdge1 = { x: left, y: baseMidY - halfBase };
      baseEdge2 = { x: left, y: baseMidY + halfBase };
      break;
    }
    case 'right': {
      baseMidX = right;
      baseMidY = Math.max(top + cornerPadY, Math.min(bottom - cornerPadY, centerY * 0.45 + mouthPx.y * 0.55));
      base1 = { x: right - overlap, y: baseMidY - halfBase };
      base2 = { x: right - overlap, y: baseMidY + halfBase };
      baseEdge1 = { x: right, y: baseMidY - halfBase };
      baseEdge2 = { x: right, y: baseMidY + halfBase };
      break;
    }
    case 'top': {
      baseMidX = Math.max(left + cornerPadX, Math.min(right - cornerPadX, centerX * 0.4 + mouthPx.x * 0.6));
      baseMidY = top;
      base1 = { x: baseMidX + halfBase, y: top + overlap };
      base2 = { x: baseMidX - halfBase, y: top + overlap };
      baseEdge1 = { x: baseMidX + halfBase, y: top };
      baseEdge2 = { x: baseMidX - halfBase, y: top };
      break;
    }
    default: {
      baseMidX = centerX;
      baseMidY = bottom;
      base1 = { x: baseMidX - halfBase, y: bottom - overlap };
      base2 = { x: baseMidX + halfBase, y: bottom - overlap };
      baseEdge1 = { x: baseMidX - halfBase, y: bottom };
      baseEdge2 = { x: baseMidX + halfBase, y: bottom };
      break;
    }
  }

  // Flexible natural comic tail length: compact pointer, never a long spindly antenna
  const vx = mouthPx.x - baseMidX;
  const vy = mouthPx.y - baseMidY;
  const dist = Math.hypot(vx, vy);

  const maxTailLen = 19 * scale;
  const minTailLen = 10 * scale;
  const tailLen = Math.min(maxTailLen, Math.max(minTailLen, dist * 0.22));

  const unitX = dist > 0 ? vx / dist : 0;
  const unitY = dist > 0 ? vy / dist : 1;

  const tip = {
    x: baseMidX + unitX * tailLen,
    y: baseMidY + unitY * tailLen,
  };

  return {
    origin,
    base1,
    base2,
    baseEdge1,
    baseEdge2,
    tip,
    dist,
  };
}

interface Hsk1SpeechBubbleProps {
  textItem: LessonText;
  activeLine: { speaker: string; hanzi: string; vietnamese?: string };
  activeLineIdx: number;
  onPlayLine: () => void;
}

const Hsk1SpeechBubble: React.FC<Hsk1SpeechBubbleProps> = ({
  textItem,
  activeLine,
  activeLineIdx,
  onPlayLine,
}) => {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [bubbleMetrics, setBubbleMetrics] = useState<{
    bubbleBox: { left: number; top: number; right: number; bottom: number; width: number; height: number };
    containerWidth: number;
    containerHeight: number;
    scale: number;
  } | null>(null);

  const config = getHsk1BubbleConfig(textItem.id, activeLine.speaker) || {
    mouthTarget: { x: 50, y: 35 },
    placement: 'top' as const,
  };

  const bubblePos = config.bubblePos || calculateFallbackBubblePos(config.mouthTarget, config.placement);

  useLayoutEffect(() => {
    const updateMetrics = () => {
      const bubbleEl = bubbleRef.current;
      const containerEl = bubbleEl?.parentElement;
      if (!bubbleEl || !containerEl) return;

      const cRect = containerEl.getBoundingClientRect();
      if (cRect.width === 0 || cRect.height === 0) return;

      // Canvas-proportional scale factor (reference 896px desktop illustration container)
      // Guarantees identical percentage footprint on Desktop, PC, Laptop, Tablet, and Smartphone
      const scale = Math.max(0.42, Math.min(1.15, cRect.width / 896));
      const baseMaxWidth = config.maxWidth || 230;
      const responsiveMaxWidth = Math.max(
        92,
        Math.min(Math.round(baseMaxWidth * scale), Math.round(cRect.width * 0.46))
      );

      bubbleEl.style.setProperty('--bscale', String(scale));
      bubbleEl.style.maxWidth = `${responsiveMaxWidth}px`;

      const bRect = bubbleEl.getBoundingClientRect();
      const cardW = bRect.width;
      const cardH = bRect.height;

      const smartBox = resolveSmartBubbleBox({
        textId: textItem.id,
        bubblePos,
        mouthTarget: config.mouthTarget,
        cardWidth: cardW,
        cardHeight: cardH,
        containerWidth: cRect.width,
        containerHeight: cRect.height,
      });

      setBubbleMetrics({
        bubbleBox: smartBox,
        containerWidth: cRect.width,
        containerHeight: cRect.height,
        scale,
      });
    };

    updateMetrics();

    const containerEl = bubbleRef.current?.parentElement;
    if (!containerEl) return;

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => updateMetrics());
      ro.observe(containerEl);
      if (bubbleRef.current) ro.observe(bubbleRef.current);
    }

    window.addEventListener('resize', updateMetrics);

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateMetrics);
    };
  }, [textItem.id, activeLineIdx, activeLine.speaker, bubblePos.x, bubblePos.y, config.maxWidth, config.mouthTarget]);

  let tailGeom: ReturnType<typeof computeTailGeometry> | null = null;
  if (bubbleMetrics) {
    const mouthPx = {
      x: (config.mouthTarget.x / 100) * bubbleMetrics.containerWidth,
      y: (config.mouthTarget.y / 100) * bubbleMetrics.containerHeight,
    };
    tailGeom = computeTailGeometry(
      bubbleMetrics.bubbleBox,
      mouthPx,
      config.tailOrigin,
      bubbleMetrics.containerWidth
    );
  }

  const baseMaxWidth = config.maxWidth || 230;
  const currentScale = bubbleMetrics ? bubbleMetrics.scale : 1;
  const currentMaxWidth = bubbleMetrics
    ? Math.max(
        92,
        Math.min(
          Math.round(baseMaxWidth * currentScale),
          Math.round(bubbleMetrics.containerWidth * 0.46)
        )
      )
    : baseMaxWidth;

  return (
    <>
      {/* Speech Bubble Card */}
      <div
        ref={bubbleRef}
        key={`bubble-${textItem.id}-${activeLineIdx}`}
        className="absolute z-20 pointer-events-auto select-none"
        style={{
          top: bubbleMetrics ? `${bubbleMetrics.bubbleBox.top}px` : `${bubblePos.y}%`,
          left: bubbleMetrics ? `${bubbleMetrics.bubbleBox.left}px` : `${bubblePos.x}%`,
          transform: bubbleMetrics ? 'none' : 'translate(-50%, -50%)',
          maxWidth: `${currentMaxWidth}px`,
          ['--bscale' as any]: currentScale,
        }}
      >
        <div
          onClick={onPlayLine}
          style={{
            padding: 'calc(6px * var(--bscale, 1)) calc(11px * var(--bscale, 1))',
            borderRadius: 'calc(16px * var(--bscale, 1))',
            minWidth: 'calc(80px * var(--bscale, 1))',
          }}
          className="relative bg-white/95 text-slate-900 shadow-[0_3px_10px_rgba(0,0,0,0.18)] border-[1.5px] border-slate-800/85 whitespace-normal text-center max-w-full cursor-pointer hover:scale-[1.02] transition-transform"
          title="Bấm để nghe đọc lại câu thoại này"
        >
          <div key={activeLineIdx} className="animate-in fade-in duration-200">
            <div
              style={{
                fontSize: 'clamp(9.5px, calc(13.5px * var(--bscale, 1)), 15px)',
                lineHeight: 1.28,
              }}
              className="font-bold font-chinese text-slate-900 tracking-normal"
            >
              {activeLine.hanzi}
            </div>
            {activeLine.vietnamese && (
              <div
                style={{
                  fontSize: 'clamp(8px, calc(10.5px * var(--bscale, 1)), 12px)',
                  lineHeight: 1.22,
                }}
                className="text-slate-500 font-medium mt-0.5"
              >
                {activeLine.vietnamese}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Directional Tail connecting bubble edge to mouthTarget */}
      {bubbleMetrics && tailGeom && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
          viewBox={`0 0 ${bubbleMetrics.containerWidth} ${bubbleMetrics.containerHeight}`}
        >
          {/* Seamless white wedge with drop shadow */}
          <polygon
            points={`${tailGeom.base1.x},${tailGeom.base1.y} ${tailGeom.tip.x},${tailGeom.tip.y} ${tailGeom.base2.x},${tailGeom.base2.y}`}
            fill="#ffffff"
            className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.12)]"
          />
          {/* Overlap white fill to seamlessly mask card border at base */}
          <polygon
            points={`${tailGeom.base1.x},${tailGeom.base1.y} ${tailGeom.tip.x},${tailGeom.tip.y} ${tailGeom.base2.x},${tailGeom.base2.y}`}
            fill="#ffffff"
          />
          {/* Ink border strokes on left and right sides of tail */}
          <path
            d={`M ${tailGeom.baseEdge1.x} ${tailGeom.baseEdge1.y} L ${tailGeom.tip.x} ${tailGeom.tip.y} L ${tailGeom.baseEdge2.x} ${tailGeom.baseEdge2.y}`}
            stroke="rgba(30,41,59,0.85)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      )}
    </>
  );
};"""

norm_code = code.replace('\r\n', '\n')
assert old_section in norm_code, "old_section not found"
norm_code = norm_code.replace(old_import, new_import, 1)
norm_code = norm_code.replace(old_section, new_section, 1)

with open('src/components/Coursebook/CoursebookView.tsx', 'w', encoding='utf-8') as f:
    f.write(norm_code)

print("Successfully updated CoursebookView.tsx")
