const fs = require('fs');

const fileContent = fs.readFileSync('scripts/verify_calibrations.cjs', 'utf8');
const match = fileContent.match(/const specialConfigs = (\{[\s\S]*?\n\};)/);
const specialConfigs = eval('(' + match[1].replace(/;\s*$/, '') + ')');

let tsContent = `// Calibrated Speech Bubble Layout Configurations for HSK 1 Coursebook (15 lessons, 45 dialogues)
// Provides clear-space bubble coordinates, mouth target anchors, and dynamic tail origins
// Complies with PROJECT.md § Interface Contracts

export type BubblePlacement =
  | 'top'
  | 'top-left'
  | 'top-right'
  | 'left'
  | 'right'
  | 'bottom-left'
  | 'bottom-right'
  | 'custom';

export interface CharacterBubbleConfig {
  mouthTarget: { x: number; y: number }; // Speaker mouth/chin anchor percentage (0-100)
  placement: BubblePlacement;
  bubblePos?: { x: number; y: number };   // Custom bubble center (0-100)
  tailOrigin?: 'bottom' | 'bottom-left' | 'bottom-right' | 'left' | 'right' | 'top';
  maxWidth?: number;                     // Max bubble width in px
}

export type HSK1SceneBubbleMap = Record<string, Record<string, CharacterBubbleConfig>>;

export const HSK1_BUBBLE_LAYOUTS: HSK1SceneBubbleMap = ${JSON.stringify(specialConfigs, null, 2)};

/**
 * Calculates a sensible clear-space bubble center position based on mouth coordinates and placement strategy.
 */
export function calculateFallbackBubblePos(
  mouthTarget: { x: number; y: number },
  placement: BubblePlacement
): { x: number; y: number } {
  switch (placement) {
    case 'top':
      return {
        x: Math.max(16, Math.min(84, mouthTarget.x)),
        y: Math.max(14, mouthTarget.y - 18),
      };
    case 'top-left':
      return {
        x: Math.max(16, mouthTarget.x - 18),
        y: Math.max(14, mouthTarget.y - 16),
      };
    case 'top-right':
      return {
        x: Math.min(84, mouthTarget.x + 18),
        y: Math.max(14, mouthTarget.y - 16),
      };
    case 'left':
      return {
        x: Math.max(16, mouthTarget.x - 22),
        y: Math.max(16, mouthTarget.y - 4),
      };
    case 'right':
      return {
        x: Math.min(84, mouthTarget.x + 22),
        y: Math.max(16, mouthTarget.y - 4),
      };
    case 'bottom-left':
      return {
        x: Math.max(16, mouthTarget.x - 18),
        y: Math.min(85, mouthTarget.y + 18),
      };
    case 'bottom-right':
      return {
        x: Math.min(84, mouthTarget.x + 18),
        y: Math.min(85, mouthTarget.y + 18),
      };
    case 'custom':
    default:
      return { x: mouthTarget.x, y: Math.max(14, mouthTarget.y - 18) };
  }
}

/**
 * Retrieves the calibrated bubble layout for a given dialogue and speaker in HSK 1.
 * Supports fuzzy name matching (stripping Vietnamese titles/honorifics in parentheses).
 */
export function getHsk1BubbleConfig(
  textId: string,
  speakerName: string
): CharacterBubbleConfig | null {
  const scene = HSK1_BUBBLE_LAYOUTS[textId];
  if (!scene) return null;

  const cleanName = speakerName.replace(/\\s*\\(.*?\\)/, '').trim();

  // 1. Direct key lookup
  if (scene[cleanName]) {
    return scene[cleanName];
  }

  // 2. Substring/fuzzy lookup
  const matchedKey = Object.keys(scene).find(
    (key) => cleanName.includes(key) || key.includes(cleanName)
  );

  if (matchedKey && scene[matchedKey]) {
    return scene[matchedKey];
  }

  return null;
}
`;

fs.writeFileSync('src/data/hsk1BubbleLayouts.ts', tsContent);
console.log('Successfully wrote src/data/hsk1BubbleLayouts.ts');
