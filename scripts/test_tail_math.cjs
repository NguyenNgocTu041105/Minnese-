function computeTailGeometry(bubbleBox, mouthPx, tailOriginPref) {
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
  }

  const baseWidth = 16;
  const halfBase = baseWidth / 2;
  const overlap = 2.5; // Extension into the card to seamlessly cover border

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

  // Calculate tip point stopping slightly before mouth to avoid piercing mouth/chin
  const vx = mouthPx.x - baseMidX;
  const vy = mouthPx.y - baseMidY;
  const dist = Math.hypot(vx, vy);

  let tip = { x: mouthPx.x, y: mouthPx.y };
  if (dist > 16) {
    const margin = Math.min(10, dist * 0.1);
    tip = {
      x: mouthPx.x - (vx / dist) * margin,
      y: mouthPx.y - (vy / dist) * margin,
    };
  }

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

// Test cases
const testCard = { left: 100, top: 50, right: 260, bottom: 100, width: 160, height: 50 };
console.log('Test 1 (bottom-right pointing to speaker at 300, 200):');
console.log(computeTailGeometry(testCard, { x: 300, y: 200 }, 'bottom-right'));

console.log('Test 2 (right pointing to speaker at 350, 80):');
console.log(computeTailGeometry(testCard, { x: 350, y: 80 }, 'right'));

console.log('Test 3 (auto origin to speaker at 50, 150):');
console.log(computeTailGeometry(testCard, { x: 50, y: 150 }));
