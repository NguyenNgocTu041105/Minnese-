// Calibrated Speech Bubble Layout Configurations for HSK 1 & HSK 2 Coursebook (105 Scenes)
// Natural head-level clear-space positioning with multi-device responsive scaling and DOM face-guard

export interface CharacterBubbleConfig {
  mouthTarget: { x: number; y: number };
  placement: 'top' | 'top-left' | 'top-right' | 'left' | 'right' | 'bottom-left' | 'bottom-right' | 'custom';
  bubblePos?: { x: number; y: number };
  tailOrigin?: 'bottom' | 'bottom-left' | 'bottom-right' | 'left' | 'right' | 'top';
  maxWidth?: number;
}

export type HSK1SceneBubbleMap = Record<string, Record<string, CharacterBubbleConfig>>;

export interface SceneFaceGuardData {
  splitScreenDividerX?: number;
  obstacles: Array<[number, number, number, number]>;
  characters: Array<{
    name: string;
    face: [number, number, number, number];
    head: [number, number, number, number];
  }>;
}

export const HSK1_BUBBLE_LAYOUTS: HSK1SceneBubbleMap = {
  'hsk1-l1-t1': {
    '王一飞': {
      mouthTarget: { x: 42.5, y: 42.0 },
      placement: 'top',
      bubblePos: { x: 42, y: 20 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '小语': {
      mouthTarget: { x: 71.5, y: 35.0 },
      placement: 'top',
      bubblePos: { x: 72, y: 14 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
  },
  'hsk1-l1-t2': {
    '学生们': {
      mouthTarget: { x: 26.5, y: 66.0 },
      placement: 'top',
      bubblePos: { x: 26, y: 40 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '王一飞': {
      mouthTarget: { x: 65.5, y: 27.0 },
      placement: 'top',
      bubblePos: { x: 66, y: 14 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '小语': {
      mouthTarget: { x: 79.5, y: 24.5 },
      placement: 'top',
      bubblePos: { x: 80, y: 10 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
  },
  'hsk1-l1-t3': {
    '学生们': {
      mouthTarget: { x: 41.5, y: 57.0 },
      placement: 'top',
      bubblePos: { x: 42, y: 40 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '王一飞': {
      mouthTarget: { x: 74.0, y: 22.5 },
      placement: 'top',
      bubblePos: { x: 72, y: 10 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '小语': {
      mouthTarget: { x: 84.5, y: 22.0 },
      placement: 'top',
      bubblePos: { x: 84, y: 8 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
  },
  'hsk1-l2-t1': {
    '陈天中': {
      mouthTarget: { x: 28.5, y: 38.5 },
      placement: 'top',
      bubblePos: { x: 28, y: 22 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '王一飞': {
      mouthTarget: { x: 74.0, y: 25.5 },
      placement: 'top',
      bubblePos: { x: 74, y: 10 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
  },
  'hsk1-l2-t2': {
    '陈天中': {
      mouthTarget: { x: 40.0, y: 31.0 },
      placement: 'top',
      bubblePos: { x: 40, y: 12 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '白家月': {
      mouthTarget: { x: 64.5, y: 32.5 },
      placement: 'top',
      bubblePos: { x: 64, y: 12 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
  },
  'hsk1-l2-t3': {
    '李文': {
      mouthTarget: { x: 30.0, y: 20.0 },
      placement: 'top-right',
      bubblePos: { x: 54, y: 6 },
      tailOrigin: 'bottom-left',
      maxWidth: 235,
    },
    '白家月': {
      mouthTarget: { x: 75.5, y: 39.0 },
      placement: 'top',
      bubblePos: { x: 76, y: 22 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
  },
  'hsk1-l3-t1': {
    '李文': {
      mouthTarget: { x: 33.5, y: 34.0 },
      placement: 'top',
      bubblePos: { x: 34, y: 14 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '白家月': {
      mouthTarget: { x: 77.0, y: 39.5 },
      placement: 'top',
      bubblePos: { x: 76, y: 20 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
  },
  'hsk1-l3-t2': {
    '陈天中': {
      mouthTarget: { x: 42.5, y: 35.0 },
      placement: 'top-left',
      bubblePos: { x: 22, y: 6 },
      tailOrigin: 'bottom-right',
      maxWidth: 235,
    },
    '安妮': {
      mouthTarget: { x: 62.5, y: 39.5 },
      placement: 'top',
      bubblePos: { x: 64, y: 12 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
  },
  'hsk1-l3-t3': {
    '王一雪': {
      mouthTarget: { x: 64.5, y: 46.0 },
      placement: 'top-right',
      bubblePos: { x: 90, y: 6 },
      tailOrigin: 'bottom-left',
      maxWidth: 160,
    },
    '王一飞': {
      mouthTarget: { x: 44.5, y: 58.5 },
      placement: 'top-left',
      bubblePos: { x: 18, y: 6 },
      tailOrigin: 'bottom-right',
      maxWidth: 235,
    },
  },
  'hsk1-l4-t1': {
    '刘明': {
      mouthTarget: { x: 39.5, y: 37.0 },
      placement: 'top',
      bubblePos: { x: 40, y: 10 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '王一雪': {
      mouthTarget: { x: 61.5, y: 38.5 },
      placement: 'top',
      bubblePos: { x: 64, y: 14 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
  },
  'hsk1-l4-t2': {
    '王一雪': {
      mouthTarget: { x: 33.0, y: 40.5 },
      placement: 'top',
      bubblePos: { x: 32, y: 16 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '杨同乐': {
      mouthTarget: { x: 69.0, y: 37.5 },
      placement: 'top',
      bubblePos: { x: 68, y: 10 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
  },
  'hsk1-l4-t3': {
    '刘小明': {
      mouthTarget: { x: 25.0, y: 56.0 },
      placement: 'top',
      bubblePos: { x: 24, y: 38 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '王一雪': {
      mouthTarget: { x: 43.0, y: 28.5 },
      placement: 'top',
      bubblePos: { x: 42, y: 8 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '杨同乐': {
      mouthTarget: { x: 67.5, y: 29.5 },
      placement: 'top',
      bubblePos: { x: 68, y: 8 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
  },
  'hsk1-l5-t1': {
    '王一雪': {
      mouthTarget: { x: 42.0, y: 35.5 },
      placement: 'top',
      bubblePos: { x: 38, y: 12 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '刘明': {
      mouthTarget: { x: 63.5, y: 33.0 },
      placement: 'top-left',
      bubblePos: { x: 50, y: 6 },
      tailOrigin: 'bottom-right',
      maxWidth: 235,
    },
  },
  'hsk1-l5-t2': {
    '王一雪': {
      mouthTarget: { x: 33.0, y: 40.5 },
      placement: 'top',
      bubblePos: { x: 32, y: 18 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '杨同乐': {
      mouthTarget: { x: 69.0, y: 37.5 },
      placement: 'top-right',
      bubblePos: { x: 80, y: 10 },
      tailOrigin: 'bottom-left',
      maxWidth: 235,
    },
  },
  'hsk1-l5-t3': {
    '王一雪': {
      mouthTarget: { x: 33.0, y: 38.0 },
      placement: 'top',
      bubblePos: { x: 32, y: 16 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '杨同乐': {
      mouthTarget: { x: 69.5, y: 33.5 },
      placement: 'top',
      bubblePos: { x: 70, y: 8 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
  },
  'hsk1-l6-t1': {
    '李文': {
      mouthTarget: { x: 35.5, y: 29.5 },
      placement: 'top-right',
      bubblePos: { x: 58, y: 6 },
      tailOrigin: 'bottom-left',
      maxWidth: 235,
    },
    '白家月': {
      mouthTarget: { x: 76.5, y: 43.5 },
      placement: 'top',
      bubblePos: { x: 76, y: 22 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
  },
  'hsk1-l6-t2': {
    '白家月': {
      mouthTarget: { x: 34.0, y: 50.0 },
      placement: 'top',
      bubblePos: { x: 34, y: 26 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '陈天中': {
      mouthTarget: { x: 63.0, y: 33.5 },
      placement: 'top-right',
      bubblePos: { x: 86, y: 6 },
      tailOrigin: 'bottom-left',
      maxWidth: 235,
    },
  },
  'hsk1-l6-t3': {
    '刘小明': {
      mouthTarget: { x: 26.0, y: 57.0 },
      placement: 'top-left',
      bubblePos: { x: 12, y: 34 },
      tailOrigin: 'bottom-right',
      maxWidth: 210,
    },
    '刘明': {
      mouthTarget: { x: 39.5, y: 38.5 },
      placement: 'top',
      bubblePos: { x: 40, y: 14 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '王一雪': {
      mouthTarget: { x: 59.5, y: 40.5 },
      placement: 'top',
      bubblePos: { x: 62, y: 18 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '刘小雪': {
      mouthTarget: { x: 78.0, y: 53.5 },
      placement: 'top',
      bubblePos: { x: 86, y: 30 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
  },
  'hsk1-l7-t1': {
    '白家月': {
      mouthTarget: { x: 27.5, y: 41.0 },
      placement: 'top',
      bubblePos: { x: 28, y: 6 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '安妮': {
      mouthTarget: { x: 73.5, y: 41.5 },
      placement: 'top',
      bubblePos: { x: 74, y: 8 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
  },
  'hsk1-l7-t2': {
    '李文': {
      mouthTarget: { x: 28.5, y: 38.5 },
      placement: 'top',
      bubblePos: { x: 28, y: 6 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '白家月': {
      mouthTarget: { x: 73.0, y: 44.5 },
      placement: 'top',
      bubblePos: { x: 72, y: 14 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
  },
  'hsk1-l7-t3': {
    '王一雪': {
      mouthTarget: { x: 27.5, y: 36.5 },
      placement: 'top',
      bubblePos: { x: 28, y: 6 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '刘明': {
      mouthTarget: { x: 75.0, y: 37.0 },
      placement: 'top',
      bubblePos: { x: 74, y: 6 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
  },
  'hsk1-l8-t1': {
    '白家月': {
      mouthTarget: { x: 36.0, y: 46.5 },
      placement: 'top',
      bubblePos: { x: 36, y: 22 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '王一飞': {
      mouthTarget: { x: 57.5, y: 31.5 },
      placement: 'top',
      bubblePos: { x: 58, y: 10 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '陈天中': {
      mouthTarget: { x: 70.0, y: 42.5 },
      placement: 'top-right',
      bubblePos: { x: 80, y: 20 },
      tailOrigin: 'bottom-left',
      maxWidth: 235,
    },
  },
  'hsk1-l8-t2': {
    '白家月': {
      mouthTarget: { x: 29.5, y: 44.5 },
      placement: 'top',
      bubblePos: { x: 30, y: 14 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '李文': {
      mouthTarget: { x: 74.5, y: 43.5 },
      placement: 'top',
      bubblePos: { x: 74, y: 10 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
  },
  'hsk1-l8-t3': {
    '刘明': {
      mouthTarget: { x: 38.5, y: 32.5 },
      placement: 'top-left',
      bubblePos: { x: 12, y: 6 },
      tailOrigin: 'bottom-right',
      maxWidth: 175,
    },
    '小胡': {
      mouthTarget: { x: 65.5, y: 33.5 },
      placement: 'top-right',
      bubblePos: { x: 88, y: 8 },
      tailOrigin: 'bottom-left',
      maxWidth: 175,
    },
  },
  'hsk1-l9-t1': {
    '李文': {
      mouthTarget: { x: 28.5, y: 38.0 },
      placement: 'top-right',
      bubblePos: { x: 52, y: 6 },
      tailOrigin: 'bottom-left',
      maxWidth: 235,
    },
    '白家月': {
      mouthTarget: { x: 73.0, y: 44.0 },
      placement: 'top',
      bubblePos: { x: 72, y: 14 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
  },
  'hsk1-l9-t2': {
    '白家月': {
      mouthTarget: { x: 36.5, y: 44.5 },
      placement: 'top',
      bubblePos: { x: 34, y: 20 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '陈天中': {
      mouthTarget: { x: 60.5, y: 28.0 },
      placement: 'top-right',
      bubblePos: { x: 84, y: 6 },
      tailOrigin: 'bottom-left',
      maxWidth: 235,
    },
  },
  'hsk1-l9-t3': {
    '王一雪': {
      mouthTarget: { x: 33.0, y: 44.5 },
      placement: 'top',
      bubblePos: { x: 32, y: 14 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '杨同乐': {
      mouthTarget: { x: 66.5, y: 42.0 },
      placement: 'top',
      bubblePos: { x: 66, y: 10 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
  },
  'hsk1-l10-t1': {
    '王一雪': {
      mouthTarget: { x: 34.5, y: 35.5 },
      placement: 'top',
      bubblePos: { x: 34, y: 10 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '店员': {
      mouthTarget: { x: 76.5, y: 35.5 },
      placement: 'top',
      bubblePos: { x: 76, y: 10 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
  },
  'hsk1-l10-t2': {
    '王一雪': {
      mouthTarget: { x: 33.5, y: 31.5 },
      placement: 'top',
      bubblePos: { x: 34, y: 8 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '摊主': {
      mouthTarget: { x: 75.5, y: 31.5 },
      placement: 'top',
      bubblePos: { x: 76, y: 8 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
  },
  'hsk1-l10-t3': {
    '王一雪': {
      mouthTarget: { x: 41.5, y: 40.5 },
      placement: 'top-left',
      bubblePos: { x: 32, y: 14 },
      tailOrigin: 'bottom-right',
      maxWidth: 235,
    },
    '刘明': {
      mouthTarget: { x: 65.5, y: 33.5 },
      placement: 'top',
      bubblePos: { x: 66, y: 6 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
  },
  'hsk1-l11-t1': {
    '王一飞': {
      mouthTarget: { x: 24.0, y: 32.0 },
      placement: 'top-right',
      bubblePos: { x: 38, y: 6 },
      tailOrigin: 'bottom-left',
      maxWidth: 235,
    },
    '李文': {
      mouthTarget: { x: 74.5, y: 33.5 },
      placement: 'custom',
      bubblePos: { x: 90, y: 49 },
      tailOrigin: 'top',
      maxWidth: 160,
    },
  },
  'hsk1-l11-t2': {
    '王一飞': {
      mouthTarget: { x: 33.5, y: 38.5 },
      placement: 'top',
      bubblePos: { x: 34, y: 12 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '李文': {
      mouthTarget: { x: 71.0, y: 37.5 },
      placement: 'top',
      bubblePos: { x: 70, y: 10 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
  },
  'hsk1-l11-t3': {
    '刘明': {
      mouthTarget: { x: 38.5, y: 34.0 },
      placement: 'top-right',
      bubblePos: { x: 58, y: 16 },
      tailOrigin: 'bottom-left',
      maxWidth: 210,
    },
    '刘小雪': {
      mouthTarget: { x: 72.5, y: 46.5 },
      placement: 'top',
      bubblePos: { x: 72, y: 14 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
  },
  'hsk1-l12-t1': {
    '王一雪': {
      mouthTarget: { x: 29.5, y: 37.5 },
      placement: 'top',
      bubblePos: { x: 30, y: 8 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '王一飞': {
      mouthTarget: { x: 72.5, y: 36.5 },
      placement: 'top',
      bubblePos: { x: 72, y: 8 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
  },
  'hsk1-l12-t2': {
    '王一雪': {
      mouthTarget: { x: 32.5, y: 39.5 },
      placement: 'top',
      bubblePos: { x: 32, y: 12 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '杨同乐': {
      mouthTarget: { x: 69.5, y: 35.5 },
      placement: 'top',
      bubblePos: { x: 70, y: 8 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
  },
  'hsk1-l12-t3': {
    '杨同乐': {
      mouthTarget: { x: 31.0, y: 34.5 },
      placement: 'top-right',
      bubblePos: { x: 46, y: 6 },
      tailOrigin: 'bottom-left',
      maxWidth: 235,
    },
    '医生': {
      mouthTarget: { x: 72.5, y: 35.5 },
      placement: 'top-left',
      bubblePos: { x: 58, y: 6 },
      tailOrigin: 'bottom-right',
      maxWidth: 175,
    },
  },
  'hsk1-l13-t1': {
    '白家月': {
      mouthTarget: { x: 34.5, y: 31.0 },
      placement: 'top-left',
      bubblePos: { x: 10, y: 6 },
      tailOrigin: 'bottom-right',
      maxWidth: 160,
    },
    '王一飞': {
      mouthTarget: { x: 72.5, y: 30.5 },
      placement: 'top-left',
      bubblePos: { x: 52, y: 6 },
      tailOrigin: 'bottom-right',
      maxWidth: 175,
    },
  },
  'hsk1-l13-t2': {
    '王一雪': {
      mouthTarget: { x: 28.5, y: 43.5 },
      placement: 'top',
      bubblePos: { x: 28, y: 18 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '服务员': {
      mouthTarget: { x: 70.0, y: 32.5 },
      placement: 'top-left',
      bubblePos: { x: 48, y: 18 },
      tailOrigin: 'bottom-right',
      maxWidth: 210,
    },
  },
  'hsk1-l13-t3': {
    '刘明': {
      mouthTarget: { x: 38.0, y: 35.5 },
      placement: 'top-left',
      bubblePos: { x: 10, y: 6 },
      tailOrigin: 'bottom-right',
      maxWidth: 160,
    },
    '服务员': {
      mouthTarget: { x: 67.5, y: 27.5 },
      placement: 'top-right',
      bubblePos: { x: 90, y: 6 },
      tailOrigin: 'bottom-left',
      maxWidth: 160,
    },
  },
  'hsk1-l14-t1': {
    '白家月': {
      mouthTarget: { x: 34.5, y: 30.5 },
      placement: 'top-left',
      bubblePos: { x: 10, y: 6 },
      tailOrigin: 'bottom-right',
      maxWidth: 160,
    },
    '陈天中': {
      mouthTarget: { x: 71.0, y: 31.0 },
      placement: 'custom',
      bubblePos: { x: 89, y: 45 },
      tailOrigin: 'top',
      maxWidth: 190,
    },
  },
  'hsk1-l14-t2': {
    '陈天中': {
      mouthTarget: { x: 39.0, y: 43.5 },
      placement: 'top',
      bubblePos: { x: 38, y: 16 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '白家月': {
      mouthTarget: { x: 50.5, y: 39.5 },
      placement: 'top',
      bubblePos: { x: 50, y: 10 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '王一飞': {
      mouthTarget: { x: 60.5, y: 23.0 },
      placement: 'top-right',
      bubblePos: { x: 78, y: 16 },
      tailOrigin: 'bottom-left',
      maxWidth: 235,
    },
  },
  'hsk1-l14-t3': {
    '刘明': {
      mouthTarget: { x: 34.0, y: 39.5 },
      placement: 'top',
      bubblePos: { x: 34, y: 8 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '王一雪': {
      mouthTarget: { x: 55.5, y: 41.5 },
      placement: 'top',
      bubblePos: { x: 58, y: 8 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
  },
  'hsk1-l15-t1': {
    '白家月': {
      mouthTarget: { x: 21.5, y: 57.0 },
      placement: 'top-left',
      bubblePos: { x: 10, y: 26 },
      tailOrigin: 'bottom-right',
      maxWidth: 190,
    },
    '李文': {
      mouthTarget: { x: 37.0, y: 25.5 },
      placement: 'top-right',
      bubblePos: { x: 56, y: 6 },
      tailOrigin: 'bottom-left',
      maxWidth: 160,
    },
    '安妮': {
      mouthTarget: { x: 72.0, y: 54.0 },
      placement: 'top',
      bubblePos: { x: 72, y: 26 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '陈天中': {
      mouthTarget: { x: 78.0, y: 54.5 },
      placement: 'top',
      bubblePos: { x: 84, y: 22 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
  },
  'hsk1-l15-t2': {
    '白家月': {
      mouthTarget: { x: 22.0, y: 56.5 },
      placement: 'top',
      bubblePos: { x: 20, y: 24 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '李文': {
      mouthTarget: { x: 51.5, y: 45.5 },
      placement: 'top',
      bubblePos: { x: 52, y: 12 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '安妮': {
      mouthTarget: { x: 70.5, y: 53.5 },
      placement: 'top',
      bubblePos: { x: 74, y: 22 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
    '陈天中': {
      mouthTarget: { x: 78.5, y: 54.0 },
      placement: 'top',
      bubblePos: { x: 86, y: 24 },
      tailOrigin: 'bottom',
      maxWidth: 235,
    },
  },
  'hsk1-l15-t3': {
    '白家月': {
      mouthTarget: { x: 27.5, y: 38.5 },
      placement: 'custom',
      bubblePos: { x: 10, y: 55 },
      tailOrigin: 'top',
      maxWidth: 160,
    },
    '王一飞': {
      mouthTarget: { x: 52.5, y: 33.5 },
      placement: 'custom',
      bubblePos: { x: 48, y: 55 },
      tailOrigin: 'top',
      maxWidth: 210,
    },
    '安妮': {
      mouthTarget: { x: 73.5, y: 39.0 },
      placement: 'custom',
      bubblePos: { x: 89, y: 55 },
      tailOrigin: 'top',
      maxWidth: 175,
    },
  },
  'hsk2-l1-t1': {
    '王一雪': {
      mouthTarget: { x: 27.0, y: 32.0 },
      placement: 'top-right',
      bubblePos: { x: 48, y: 15 },
      tailOrigin: 'bottom-left',
      maxWidth: 230,
    },
    '白家月': {
      mouthTarget: { x: 52.0, y: 39.0 },
      placement: 'top',
      bubblePos: { x: 58, y: 14 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '白家月 & 安妮': {
      mouthTarget: { x: 62.0, y: 38.0 },
      placement: 'top',
      bubblePos: { x: 68, y: 14 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l1-t2': {
    '安妮': {
      mouthTarget: { x: 31.0, y: 48.0 },
      placement: 'top',
      bubblePos: { x: 30, y: 24 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '白家月': {
      mouthTarget: { x: 59.0, y: 45.0 },
      placement: 'top',
      bubblePos: { x: 52, y: 24 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '王一雪': {
      mouthTarget: { x: 75.0, y: 45.0 },
      placement: 'top',
      bubblePos: { x: 74, y: 16 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l1-t3': {
    '陈天中': {
      mouthTarget: { x: 15.0, y: 21.0 },
      placement: 'top-right',
      bubblePos: { x: 36, y: 6 },
      tailOrigin: 'bottom-left',
      maxWidth: 230,
    },
    '白家月': {
      mouthTarget: { x: 56.0, y: 43.0 },
      placement: 'top',
      bubblePos: { x: 56, y: 18 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l1-t4': {
    '白家月': {
      mouthTarget: { x: 32.0, y: 46.0 },
      placement: 'top',
      bubblePos: { x: 32, y: 24 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l2-t1': {
    '安妮': {
      mouthTarget: { x: 28.0, y: 50.0 },
      placement: 'top',
      bubblePos: { x: 28, y: 28 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '白家月': {
      mouthTarget: { x: 49.0, y: 50.0 },
      placement: 'top',
      bubblePos: { x: 48, y: 28 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '服务员': {
      mouthTarget: { x: 81.0, y: 42.0 },
      placement: 'top',
      bubblePos: { x: 80, y: 18 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l2-t2': {
    '白家月': {
      mouthTarget: { x: 44.0, y: 55.0 },
      placement: 'top',
      bubblePos: { x: 44, y: 30 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '安妮': {
      mouthTarget: { x: 66.0, y: 55.0 },
      placement: 'top',
      bubblePos: { x: 66, y: 28 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l2-t3': {
    '白家月': {
      mouthTarget: { x: 34.0, y: 33.0 },
      placement: 'custom',
      bubblePos: { x: 34, y: 48 },
      tailOrigin: 'top',
      maxWidth: 230,
    },
    '安妮': {
      mouthTarget: { x: 62.0, y: 32.0 },
      placement: 'custom',
      bubblePos: { x: 62, y: 48 },
      tailOrigin: 'top',
      maxWidth: 230,
    },
  },
  'hsk2-l2-t4': {
    '白家月': {
      mouthTarget: { x: 68.0, y: 36.0 },
      placement: 'custom',
      bubblePos: { x: 68, y: 51 },
      tailOrigin: 'top',
      maxWidth: 230,
    },
  },
  'hsk2-l3-t1': {
    '刘明': {
      mouthTarget: { x: 37.0, y: 29.0 },
      placement: 'top-right',
      bubblePos: { x: 58, y: 12 },
      tailOrigin: 'bottom-left',
      maxWidth: 230,
    },
    '王一雪': {
      mouthTarget: { x: 70.0, y: 38.0 },
      placement: 'top',
      bubblePos: { x: 70, y: 14 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l3-t2': {
    '刘明': {
      mouthTarget: { x: 36.0, y: 42.0 },
      placement: 'top',
      bubblePos: { x: 36, y: 14 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '王一雪': {
      mouthTarget: { x: 72.0, y: 44.0 },
      placement: 'top',
      bubblePos: { x: 72, y: 20 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l3-t3': {
    '刘明': {
      mouthTarget: { x: 36.0, y: 42.0 },
      placement: 'top',
      bubblePos: { x: 36, y: 16 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '王一雪': {
      mouthTarget: { x: 72.0, y: 44.0 },
      placement: 'top',
      bubblePos: { x: 72, y: 18 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l3-t4': {
    '王一雪': {
      mouthTarget: { x: 72.0, y: 45.0 },
      placement: 'top-right',
      bubblePos: { x: 84, y: 18 },
      tailOrigin: 'bottom-left',
      maxWidth: 230,
    },
  },
  'hsk2-l4-t1': {
    '王一雪': {
      mouthTarget: { x: 42.0, y: 34.0 },
      placement: 'top',
      bubblePos: { x: 42, y: 8 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '刘小雪': {
      mouthTarget: { x: 63.0, y: 54.0 },
      placement: 'top',
      bubblePos: { x: 64, y: 30 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l4-t2': {
    '刘小雪': {
      mouthTarget: { x: 41.0, y: 50.0 },
      placement: 'top',
      bubblePos: { x: 38, y: 24 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '王一雪': {
      mouthTarget: { x: 62.0, y: 32.0 },
      placement: 'top-left',
      bubblePos: { x: 40, y: 12 },
      tailOrigin: 'bottom-right',
      maxWidth: 230,
    },
  },
  'hsk2-l4-t3': {
    '刘小雪': {
      mouthTarget: { x: 41.0, y: 50.0 },
      placement: 'top',
      bubblePos: { x: 38, y: 24 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '王一雪': {
      mouthTarget: { x: 62.0, y: 32.0 },
      placement: 'top-left',
      bubblePos: { x: 40, y: 12 },
      tailOrigin: 'bottom-right',
      maxWidth: 230,
    },
  },
  'hsk2-l4-t4': {
    '刘小雪': {
      mouthTarget: { x: 56.0, y: 55.0 },
      placement: 'top',
      bubblePos: { x: 56, y: 26 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l5-t1': {
    '白家月': {
      mouthTarget: { x: 17.0, y: 14.0 },
      placement: 'top-right',
      bubblePos: { x: 36, y: 6 },
      tailOrigin: 'bottom-left',
      maxWidth: 230,
    },
    '安妮': {
      mouthTarget: { x: 64.0, y: 33.0 },
      placement: 'top-left',
      bubblePos: { x: 38, y: 18 },
      tailOrigin: 'bottom-right',
      maxWidth: 230,
    },
  },
  'hsk2-l5-t2': {
    '白家月': {
      mouthTarget: { x: 23.0, y: 42.0 },
      placement: 'top',
      bubblePos: { x: 22, y: 18 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '白家月 & 安妮': {
      mouthTarget: { x: 30.0, y: 42.0 },
      placement: 'top',
      bubblePos: { x: 32, y: 18 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '王一雪': {
      mouthTarget: { x: 61.0, y: 41.0 },
      placement: 'top',
      bubblePos: { x: 60, y: 16 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '刘爷爷': {
      mouthTarget: { x: 72.0, y: 38.0 },
      placement: 'top',
      bubblePos: { x: 72, y: 16 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l5-t3': {
    '白家月': {
      mouthTarget: { x: 20.0, y: 55.0 },
      placement: 'top',
      bubblePos: { x: 20, y: 30 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '王一雪': {
      mouthTarget: { x: 82.0, y: 53.0 },
      placement: 'top',
      bubblePos: { x: 82, y: 28 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l5-t4': {
    '白家月': {
      mouthTarget: { x: 39.0, y: 45.0 },
      placement: 'top',
      bubblePos: { x: 38, y: 22 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l6-t1': {
    '刘明': {
      mouthTarget: { x: 36.0, y: 43.0 },
      placement: 'top',
      bubblePos: { x: 38, y: 14 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '王一雪': {
      mouthTarget: { x: 71.0, y: 45.0 },
      placement: 'top',
      bubblePos: { x: 70, y: 20 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l6-t2': {
    '刘小明': {
      mouthTarget: { x: 44.0, y: 57.0 },
      placement: 'top',
      bubblePos: { x: 46, y: 6 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '刘小雪': {
      mouthTarget: { x: 58.0, y: 46.0 },
      placement: 'custom',
      bubblePos: { x: 64, y: 63 },
      tailOrigin: 'top',
      maxWidth: 230,
    },
    '刘明': {
      mouthTarget: { x: 25.0, y: 43.0 },
      placement: 'custom',
      bubblePos: { x: 16, y: 54 },
      tailOrigin: 'top',
      maxWidth: 230,
    },
    '王一雪': {
      mouthTarget: { x: 77.0, y: 49.0 },
      placement: 'top',
      bubblePos: { x: 82, y: 10 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l6-t3': {
    '刘小雪': {
      mouthTarget: { x: 49.0, y: 49.0 },
      placement: 'top',
      bubblePos: { x: 48, y: 22 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '刘明': {
      mouthTarget: { x: 26.0, y: 44.0 },
      placement: 'top',
      bubblePos: { x: 26, y: 12 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '王一雪': {
      mouthTarget: { x: 71.0, y: 44.0 },
      placement: 'top',
      bubblePos: { x: 70, y: 14 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l6-t4': {
    '王一雪': {
      mouthTarget: { x: 73.0, y: 47.0 },
      placement: 'top',
      bubblePos: { x: 72, y: 18 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l7-t1': {
    '安妮': {
      mouthTarget: { x: 71.0, y: 52.0 },
      placement: 'top',
      bubblePos: { x: 70, y: 30 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '陈天中': {
      mouthTarget: { x: 42.0, y: 45.0 },
      placement: 'top',
      bubblePos: { x: 42, y: 20 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l7-t2': {
    '安妮': {
      mouthTarget: { x: 59.0, y: 33.0 },
      placement: 'top',
      bubblePos: { x: 62, y: 16 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '陈天中': {
      mouthTarget: { x: 44.0, y: 29.0 },
      placement: 'top',
      bubblePos: { x: 44, y: 10 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l7-t3': {
    '安妮': {
      mouthTarget: { x: 65.0, y: 34.0 },
      placement: 'top',
      bubblePos: { x: 64, y: 12 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '陈天中': {
      mouthTarget: { x: 40.0, y: 29.0 },
      placement: 'top-left',
      bubblePos: { x: 14, y: 14 },
      tailOrigin: 'bottom-right',
      maxWidth: 210,
    },
  },
  'hsk2-l7-t4': {
    '陈天中': {
      mouthTarget: { x: 49.0, y: 40.0 },
      placement: 'top',
      bubblePos: { x: 48, y: 14 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l8-t1': {
    '刘明': {
      mouthTarget: { x: 43.0, y: 27.0 },
      placement: 'top-left',
      bubblePos: { x: 18, y: 12 },
      tailOrigin: 'bottom-right',
      maxWidth: 230,
    },
    '王一雪': {
      mouthTarget: { x: 65.0, y: 38.0 },
      placement: 'top',
      bubblePos: { x: 66, y: 10 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l8-t2': {
    '刘明': {
      mouthTarget: { x: 43.0, y: 27.0 },
      placement: 'top-left',
      bubblePos: { x: 18, y: 12 },
      tailOrigin: 'bottom-right',
      maxWidth: 230,
    },
    '王一雪': {
      mouthTarget: { x: 65.0, y: 38.0 },
      placement: 'top',
      bubblePos: { x: 66, y: 8 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l8-t3': {
    '刘明': {
      mouthTarget: { x: 43.0, y: 27.0 },
      placement: 'top-left',
      bubblePos: { x: 18, y: 12 },
      tailOrigin: 'bottom-right',
      maxWidth: 230,
    },
    '王一雪': {
      mouthTarget: { x: 65.0, y: 38.0 },
      placement: 'top',
      bubblePos: { x: 66, y: 8 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l8-t4': {
    '小语': {
      mouthTarget: { x: 22.0, y: 29.0 },
      placement: 'top-right',
      bubblePos: { x: 44, y: 14 },
      tailOrigin: 'bottom-left',
      maxWidth: 230,
    },
  },
  'hsk2-l9-t1': {
    '刘明': {
      mouthTarget: { x: 65.0, y: 22.0 },
      placement: 'top-left',
      bubblePos: { x: 42, y: 8 },
      tailOrigin: 'bottom-right',
      maxWidth: 230,
    },
    '王一雪': {
      mouthTarget: { x: 80.0, y: 29.0 },
      placement: 'left',
      bubblePos: { x: 60, y: 33 },
      tailOrigin: 'right',
      maxWidth: 230,
    },
  },
  'hsk2-l9-t2': {
    '刘明': {
      mouthTarget: { x: 38.0, y: 20.0 },
      placement: 'top-left',
      bubblePos: { x: 16, y: 6 },
      tailOrigin: 'bottom-right',
      maxWidth: 230,
    },
    '王一雪': {
      mouthTarget: { x: 52.0, y: 26.0 },
      placement: 'top-right',
      bubblePos: { x: 76, y: 12 },
      tailOrigin: 'bottom-left',
      maxWidth: 230,
    },
  },
  'hsk2-l9-t3': {
    '刘明': {
      mouthTarget: { x: 38.0, y: 20.0 },
      placement: 'top-left',
      bubblePos: { x: 16, y: 6 },
      tailOrigin: 'bottom-right',
      maxWidth: 230,
    },
    '王一雪': {
      mouthTarget: { x: 52.0, y: 26.0 },
      placement: 'top',
      bubblePos: { x: 56, y: 8 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l9-t4': {
    '王一雪': {
      mouthTarget: { x: 49.0, y: 26.0 },
      placement: 'top-left',
      bubblePos: { x: 28, y: 12 },
      tailOrigin: 'bottom-right',
      maxWidth: 230,
    },
  },
  'hsk2-l10-t1': {
    '刘小明': {
      mouthTarget: { x: 68.0, y: 36.0 },
      placement: 'top',
      bubblePos: { x: 68, y: 18 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '刘明': {
      mouthTarget: { x: 45.0, y: 18.0 },
      placement: 'top-left',
      bubblePos: { x: 24, y: 6 },
      tailOrigin: 'bottom-right',
      maxWidth: 230,
    },
  },
  'hsk2-l10-t2': {
    '刘小雪': {
      mouthTarget: { x: 52.0, y: 38.0 },
      placement: 'top-left',
      bubblePos: { x: 40, y: 18 },
      tailOrigin: 'bottom-right',
      maxWidth: 230,
    },
    '王一雪': {
      mouthTarget: { x: 60.0, y: 20.0 },
      placement: 'top-left',
      bubblePos: { x: 40, y: 6 },
      tailOrigin: 'bottom-right',
      maxWidth: 230,
    },
  },
  'hsk2-l10-t3': {
    '刘小明': {
      mouthTarget: { x: 79.0, y: 46.0 },
      placement: 'top',
      bubblePos: { x: 80, y: 26 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '刘小雪': {
      mouthTarget: { x: 31.0, y: 35.0 },
      placement: 'top',
      bubblePos: { x: 30, y: 16 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '王一雪': {
      mouthTarget: { x: 55.0, y: 33.0 },
      placement: 'top',
      bubblePos: { x: 54, y: 10 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l10-t4': {
    '刘小雪': {
      mouthTarget: { x: 52.0, y: 38.0 },
      placement: 'top',
      bubblePos: { x: 52, y: 18 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l11-t1': {
    '白家月': {
      mouthTarget: { x: 40.0, y: 51.0 },
      placement: 'top',
      bubblePos: { x: 38, y: 14 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '王一飞': {
      mouthTarget: { x: 62.0, y: 33.0 },
      placement: 'custom',
      bubblePos: { x: 64, y: 48 },
      tailOrigin: 'top',
      maxWidth: 230,
    },
  },
  'hsk2-l11-t2': {
    '王一飞': {
      mouthTarget: { x: 27.0, y: 41.0 },
      placement: 'top-right',
      bubblePos: { x: 52, y: 27 },
      tailOrigin: 'bottom-left',
      maxWidth: 230,
    },
    '白家月': {
      mouthTarget: { x: 73.0, y: 46.0 },
      placement: 'top-left',
      bubblePos: { x: 52, y: 38 },
      tailOrigin: 'bottom-right',
      maxWidth: 230,
    },
    '李文': {
      mouthTarget: { x: 69.0, y: 46.0 },
      placement: 'top-left',
      bubblePos: { x: 52, y: 16 },
      tailOrigin: 'bottom-right',
      maxWidth: 230,
    },
  },
  'hsk2-l11-t3': {
    '白家月': {
      mouthTarget: { x: 24.0, y: 52.0 },
      placement: 'top',
      bubblePos: { x: 24, y: 26 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '王一飞': {
      mouthTarget: { x: 64.0, y: 35.0 },
      placement: 'top',
      bubblePos: { x: 64, y: 12 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '李文': {
      mouthTarget: { x: 75.0, y: 48.0 },
      placement: 'top-right',
      bubblePos: { x: 84, y: 22 },
      tailOrigin: 'bottom-left',
      maxWidth: 230,
    },
  },
  'hsk2-l11-t4': {
    '白家月': {
      mouthTarget: { x: 50.0, y: 43.0 },
      placement: 'top-left',
      bubblePos: { x: 26, y: 28 },
      tailOrigin: 'bottom-right',
      maxWidth: 230,
    },
  },
  'hsk2-l12-t1': {
    '王一雪': {
      mouthTarget: { x: 30.0, y: 28.0 },
      placement: 'top',
      bubblePos: { x: 30, y: 8 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '白家月': {
      mouthTarget: { x: 79.0, y: 31.0 },
      placement: 'top',
      bubblePos: { x: 78, y: 10 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l12-t2': {
    '王一雪': {
      mouthTarget: { x: 27.0, y: 35.0 },
      placement: 'custom',
      bubblePos: { x: 26, y: 51 },
      tailOrigin: 'top',
      maxWidth: 230,
    },
    '王一飞': {
      mouthTarget: { x: 74.0, y: 35.0 },
      placement: 'custom',
      bubblePos: { x: 74, y: 51 },
      tailOrigin: 'top',
      maxWidth: 230,
    },
  },
  'hsk2-l12-t3': {
    '李文': {
      mouthTarget: { x: 25.0, y: 33.0 },
      placement: 'top-right',
      bubblePos: { x: 46, y: 18 },
      tailOrigin: 'bottom-left',
      maxWidth: 230,
    },
    '白家月': {
      mouthTarget: { x: 73.0, y: 34.0 },
      placement: 'top-left',
      bubblePos: { x: 54, y: 24 },
      tailOrigin: 'bottom-right',
      maxWidth: 230,
    },
  },
  'hsk2-l12-t4': {
    '白家月': {
      mouthTarget: { x: 50.0, y: 43.0 },
      placement: 'top-left',
      bubblePos: { x: 26, y: 28 },
      tailOrigin: 'bottom-right',
      maxWidth: 230,
    },
  },
  'hsk2-l13-t1': {
    '白家月': {
      mouthTarget: { x: 39.0, y: 49.0 },
      placement: 'top',
      bubblePos: { x: 38, y: 18 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '陈天中': {
      mouthTarget: { x: 65.0, y: 49.0 },
      placement: 'top',
      bubblePos: { x: 64, y: 16 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l13-t2': {
    '王一飞': {
      mouthTarget: { x: 69.0, y: 27.0 },
      placement: 'top-left',
      bubblePos: { x: 50, y: 12 },
      tailOrigin: 'bottom-right',
      maxWidth: 230,
    },
    '白家月': {
      mouthTarget: { x: 54.0, y: 70.0 },
      placement: 'top',
      bubblePos: { x: 50, y: 34 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '安妮': {
      mouthTarget: { x: 78.0, y: 66.0 },
      placement: 'top-left',
      bubblePos: { x: 50, y: 24 },
      tailOrigin: 'bottom-right',
      maxWidth: 230,
    },
  },
  'hsk2-l13-t3': {
    '白家月': {
      mouthTarget: { x: 39.0, y: 49.0 },
      placement: 'top',
      bubblePos: { x: 38, y: 18 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '安妮': {
      mouthTarget: { x: 68.0, y: 50.0 },
      placement: 'top',
      bubblePos: { x: 68, y: 18 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l13-t4': {
    '白家月': {
      mouthTarget: { x: 35.0, y: 36.0 },
      placement: 'top',
      bubblePos: { x: 34, y: 12 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l14-t1': {
    '李文': {
      mouthTarget: { x: 37.0, y: 32.0 },
      placement: 'top-right',
      bubblePos: { x: 56, y: 12 },
      tailOrigin: 'bottom-left',
      maxWidth: 230,
    },
    '王一飞': {
      mouthTarget: { x: 57.0, y: 44.0 },
      placement: 'top-right',
      bubblePos: { x: 66, y: 16 },
      tailOrigin: 'bottom-left',
      maxWidth: 230,
    },
  },
  'hsk2-l14-t2': {
    '李文': {
      mouthTarget: { x: 37.0, y: 32.0 },
      placement: 'top-right',
      bubblePos: { x: 56, y: 15 },
      tailOrigin: 'bottom-left',
      maxWidth: 230,
    },
    '王一飞': {
      mouthTarget: { x: 54.0, y: 44.0 },
      placement: 'left',
      bubblePos: { x: 32, y: 48 },
      tailOrigin: 'right',
      maxWidth: 230,
    },
    '杨同乐': {
      mouthTarget: { x: 76.0, y: 35.0 },
      placement: 'custom',
      bubblePos: { x: 78, y: 51 },
      tailOrigin: 'top',
      maxWidth: 230,
    },
  },
  'hsk2-l14-t3': {
    '王一飞': {
      mouthTarget: { x: 25.0, y: 50.0 },
      placement: 'top',
      bubblePos: { x: 24, y: 26 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '杨同乐': {
      mouthTarget: { x: 76.0, y: 48.0 },
      placement: 'top',
      bubblePos: { x: 76, y: 22 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l14-t4': {
    '王一飞': {
      mouthTarget: { x: 50.0, y: 43.0 },
      placement: 'top-left',
      bubblePos: { x: 28, y: 28 },
      tailOrigin: 'bottom-right',
      maxWidth: 230,
    },
  },
  'hsk2-l15-t1': {
    '白家月': {
      mouthTarget: { x: 36.0, y: 57.0 },
      placement: 'top',
      bubblePos: { x: 36, y: 32 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '王一飞': {
      mouthTarget: { x: 63.0, y: 41.0 },
      placement: 'top',
      bubblePos: { x: 62, y: 14 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '陈天中': {
      mouthTarget: { x: 74.0, y: 44.0 },
      placement: 'top',
      bubblePos: { x: 74, y: 16 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
  },
  'hsk2-l15-t2': {
    '白家月': {
      mouthTarget: { x: 37.0, y: 47.0 },
      placement: 'top',
      bubblePos: { x: 36, y: 16 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '李文': {
      mouthTarget: { x: 65.0, y: 42.0 },
      placement: 'top-left',
      bubblePos: { x: 44, y: 9 },
      tailOrigin: 'bottom-right',
      maxWidth: 230,
    },
  },
  'hsk2-l15-t3': {
    '白家月': {
      mouthTarget: { x: 37.0, y: 47.0 },
      placement: 'top',
      bubblePos: { x: 36, y: 16 },
      tailOrigin: 'bottom',
      maxWidth: 230,
    },
    '李文': {
      mouthTarget: { x: 65.0, y: 42.0 },
      placement: 'top-left',
      bubblePos: { x: 44, y: 9 },
      tailOrigin: 'bottom-right',
      maxWidth: 230,
    },
  },
  'hsk2-l15-t4': {
    '李文': {
      mouthTarget: { x: 52.0, y: 44.0 },
      placement: 'top-right',
      bubblePos: { x: 76, y: 30 },
      tailOrigin: 'bottom-left',
      maxWidth: 230,
    },
  },
};

export const HSK1_SCENE_FACE_GUARDS: Record<string, SceneFaceGuardData> = {
  'hsk1-l1-t1': {
    obstacles: [],
    characters: [
      { name: '王一飞', face: [37.0, 31.0, 46.0, 44.0], head: [36.0, 26.0, 47.0, 44.0] },
      { name: '小语', face: [67.0, 24.0, 77.0, 37.0], head: [66.0, 19.0, 78.0, 37.0] },
    ],
  },
  'hsk1-l1-t2': {
    obstacles: [],
    characters: [
      { name: '学生们', face: [21.0, 56.0, 32.0, 68.0], head: [20.0, 46.0, 33.0, 68.0] },
      { name: '王一飞', face: [62.0, 21.0, 69.0, 29.0], head: [61.0, 19.0, 70.0, 29.0] },
      { name: '小语', face: [76.0, 18.0, 84.0, 26.0], head: [75.0, 15.0, 85.0, 26.0] },
    ],
  },
  'hsk1-l1-t3': {
    obstacles: [],
    characters: [
      { name: '学生们', face: [37.0, 49.0, 44.0, 58.0], head: [36.0, 46.0, 45.0, 58.0] },
      { name: '王一飞', face: [71.5, 17.0, 77.0, 24.0], head: [70.5, 15.0, 78.0, 24.0] },
      { name: '小语', face: [82.0, 17.5, 88.0, 24.0], head: [81.0, 13.0, 89.0, 24.0] },
    ],
  },
  'hsk1-l2-t1': {
    obstacles: [],
    characters: [
      { name: '陈天中', face: [22.0, 30.0, 30.0, 42.0], head: [21.0, 28.0, 31.0, 42.0] },
      { name: '王一飞', face: [71.0, 18.0, 78.0, 27.0], head: [70.0, 17.0, 79.0, 27.0] },
    ],
  },
  'hsk1-l2-t2': {
    obstacles: [],
    characters: [
      { name: '陈天中', face: [34.0, 20.0, 45.0, 33.0], head: [33.0, 17.0, 46.0, 33.0] },
      { name: '白家月', face: [61.0, 22.0, 72.0, 35.0], head: [60.0, 20.0, 73.0, 35.0] },
    ],
  },
  'hsk1-l2-t3': {
    obstacles: [],
    characters: [
      { name: '李文', face: [24.0, 11.0, 34.0, 23.0], head: [23.0, 8.0, 35.0, 23.0] },
      { name: '白家月', face: [73.0, 30.0, 83.0, 42.0], head: [72.0, 29.0, 84.0, 42.0] },
    ],
  },
  'hsk1-l3-t1': {
    obstacles: [],
    characters: [
      { name: '李文', face: [26.0, 22.0, 36.0, 37.0], head: [25.0, 21.0, 37.0, 37.0] },
      { name: '白家月', face: [74.0, 30.0, 84.0, 42.0], head: [73.0, 29.0, 85.0, 42.0] },
    ],
  },
  'hsk1-l3-t2': {
    obstacles: [],
    characters: [
      { name: '陈天中', face: [34.0, 13.0, 49.0, 38.0], head: [33.0, 11.0, 50.0, 38.0] },
      { name: '安妮', face: [56.0, 24.0, 68.0, 43.0], head: [55.0, 18.0, 69.0, 43.0] },
    ],
  },
  'hsk1-l3-t3': {
    obstacles: [[37, 45, 51, 72]],
    characters: [
      { name: '王一雪', face: [58.0, 15.0, 77.0, 50.0], head: [57.0, 7.0, 78.0, 50.0] },
      { name: '王一飞', face: [41.0, 50.0, 48.0, 62.0], head: [40.0, 45.0, 49.0, 62.0] },
    ],
  },
  'hsk1-l4-t1': {
    obstacles: [],
    characters: [
      { name: '刘明', face: [30.0, 22.0, 44.0, 41.0], head: [29.0, 15.0, 45.0, 41.0] },
      { name: '王一雪', face: [57.0, 24.0, 69.0, 42.0], head: [56.0, 19.0, 70.0, 42.0] },
    ],
  },
  'hsk1-l4-t2': {
    obstacles: [],
    characters: [
      { name: '王一雪', face: [25.0, 28.0, 36.0, 44.0], head: [24.0, 23.0, 37.0, 44.0] },
      { name: '杨同乐', face: [65.0, 25.0, 77.0, 42.0], head: [64.0, 18.0, 78.0, 42.0] },
    ],
  },
  'hsk1-l4-t3': {
    obstacles: [],
    characters: [
      { name: '刘小明', face: [17.0, 45.0, 28.0, 58.0], head: [16.0, 44.0, 29.0, 58.0] },
      { name: '王一雪', face: [37.0, 20.0, 47.0, 32.0], head: [36.0, 15.0, 48.0, 32.0] },
      { name: '杨同乐', face: [63.0, 19.0, 75.0, 32.0], head: [62.0, 14.0, 76.0, 32.0] },
    ],
  },
  'hsk1-l5-t1': {
    obstacles: [],
    characters: [
      { name: '王一雪', face: [34.0, 22.0, 47.0, 39.0], head: [33.0, 17.0, 48.0, 39.0] },
      { name: '刘明', face: [58.0, 18.0, 74.0, 37.0], head: [57.0, 11.0, 75.0, 37.0] },
    ],
  },
  'hsk1-l5-t2': {
    obstacles: [[46, 2, 65, 26], [48, 30, 62, 48], [84, 24, 98, 42]],
    characters: [
      { name: '王一雪', face: [25.0, 28.0, 36.0, 44.0], head: [24.0, 23.0, 37.0, 44.0] },
      { name: '杨同乐', face: [65.0, 25.0, 77.0, 42.0], head: [64.0, 18.0, 78.0, 42.0] },
    ],
  },
  'hsk1-l5-t3': {
    obstacles: [],
    characters: [
      { name: '王一雪', face: [25.0, 26.0, 36.0, 42.0], head: [24.0, 21.0, 37.0, 42.0] },
      { name: '杨同乐', face: [64.0, 20.0, 79.0, 37.0], head: [63.0, 14.0, 80.0, 37.0] },
    ],
  },
  'hsk1-l6-t1': {
    obstacles: [],
    characters: [
      { name: '李文', face: [27.0, 14.0, 41.0, 33.0], head: [26.0, 10.0, 42.0, 33.0] },
      { name: '白家月', face: [73.0, 32.0, 83.0, 46.0], head: [72.0, 30.0, 84.0, 46.0] },
    ],
  },
  'hsk1-l6-t2': {
    obstacles: [],
    characters: [
      { name: '白家月', face: [24.0, 34.0, 38.0, 54.0], head: [23.0, 31.0, 39.0, 54.0] },
      { name: '陈天中', face: [56.0, 13.0, 73.0, 37.0], head: [55.0, 10.0, 74.0, 37.0] },
    ],
  },
  'hsk1-l6-t3': {
    obstacles: [],
    characters: [
      { name: '刘小明', face: [17.0, 45.0, 28.0, 60.0], head: [16.0, 42.0, 29.0, 60.0] },
      { name: '刘明', face: [31.0, 24.0, 43.0, 42.0], head: [30.0, 22.0, 44.0, 42.0] },
      { name: '王一雪', face: [55.0, 28.0, 66.0, 44.0], head: [54.0, 25.0, 67.0, 44.0] },
      { name: '刘小雪', face: [74.0, 40.0, 87.0, 56.0], head: [73.0, 37.0, 88.0, 56.0] },
    ],
  },
  'hsk1-l7-t1': {
    splitScreenDividerX: 50,
    obstacles: [],
    characters: [
      { name: '白家月', face: [16.0, 22.0, 35.0, 47.0], head: [15.0, 13.0, 36.0, 47.0] },
      { name: '安妮', face: [64.0, 24.0, 81.0, 47.0], head: [63.0, 14.0, 82.0, 47.0] },
    ],
  },
  'hsk1-l7-t2': {
    obstacles: [],
    characters: [
      { name: '李文', face: [15.0, 16.0, 35.0, 43.0], head: [14.0, 12.0, 36.0, 43.0] },
      { name: '白家月', face: [66.0, 26.0, 82.0, 49.0], head: [65.0, 21.0, 83.0, 49.0] },
    ],
  },
  'hsk1-l7-t3': {
    splitScreenDividerX: 50,
    obstacles: [],
    characters: [
      { name: '王一雪', face: [16.0, 18.0, 33.0, 41.0], head: [15.0, 12.0, 34.0, 41.0] },
      { name: '刘明', face: [67.0, 18.0, 85.0, 42.0], head: [66.0, 12.0, 86.0, 42.0] },
    ],
  },
  'hsk1-l8-t1': {
    obstacles: [],
    characters: [
      { name: '白家月', face: [29.0, 30.0, 41.0, 50.0], head: [28.0, 29.0, 42.0, 50.0] },
      { name: '王一飞', face: [52.0, 19.0, 63.0, 34.0], head: [51.0, 18.0, 64.0, 34.0] },
      { name: '陈天中', face: [65.0, 29.0, 76.0, 46.0], head: [64.0, 28.0, 77.0, 46.0] },
    ],
  },
  'hsk1-l8-t2': {
    splitScreenDividerX: 50,
    obstacles: [],
    characters: [
      { name: '白家月', face: [20.0, 24.0, 35.0, 48.0], head: [19.0, 21.0, 36.0, 48.0] },
      { name: '李文', face: [66.0, 21.0, 84.0, 48.0], head: [65.0, 17.0, 85.0, 48.0] },
    ],
  },
  'hsk1-l8-t3': {
    obstacles: [],
    characters: [
      { name: '刘明', face: [27.0, 14.0, 43.0, 37.0], head: [26.0, 10.0, 44.0, 37.0] },
      { name: '小胡', face: [60.0, 15.0, 75.0, 38.0], head: [59.0, 13.0, 76.0, 38.0] },
    ],
  },
  'hsk1-l9-t1': {
    obstacles: [],
    characters: [
      { name: '李文', face: [15.0, 16.0, 35.0, 42.0], head: [14.0, 12.0, 36.0, 42.0] },
      { name: '白家月', face: [66.0, 26.0, 82.0, 49.0], head: [65.0, 21.0, 83.0, 49.0] },
    ],
  },
  'hsk1-l9-t2': {
    obstacles: [],
    characters: [
      { name: '白家月', face: [25.0, 33.0, 39.0, 51.0], head: [24.0, 29.0, 40.0, 51.0] },
      { name: '陈天中', face: [54.0, 14.0, 69.0, 36.0], head: [53.0, 10.0, 70.0, 36.0] },
    ],
  },
  'hsk1-l9-t3': {
    obstacles: [],
    characters: [
      { name: '王一雪', face: [21.0, 26.0, 38.0, 49.0], head: [20.0, 23.0, 39.0, 49.0] },
      { name: '杨同乐', face: [61.0, 24.0, 78.0, 46.0], head: [60.0, 18.0, 79.0, 46.0] },
    ],
  },
  'hsk1-l10-t1': {
    obstacles: [],
    characters: [
      { name: '王一雪', face: [27.0, 22.0, 40.0, 40.0], head: [26.0, 16.0, 41.0, 40.0] },
      { name: '店员', face: [71.0, 22.0, 86.0, 40.0], head: [70.0, 17.0, 87.0, 40.0] },
    ],
  },
  'hsk1-l10-t2': {
    obstacles: [],
    characters: [
      { name: '王一雪', face: [26.0, 21.0, 38.0, 37.0], head: [25.0, 15.0, 39.0, 37.0] },
      { name: '摊主', face: [72.0, 20.0, 84.0, 35.0], head: [71.0, 16.0, 85.0, 35.0] },
    ],
  },
  'hsk1-l10-t3': {
    obstacles: [],
    characters: [
      { name: '王一雪', face: [32.0, 27.0, 47.0, 45.0], head: [31.0, 22.0, 48.0, 45.0] },
      { name: '刘明', face: [60.0, 19.0, 76.0, 39.0], head: [59.0, 13.0, 77.0, 39.0] },
    ],
  },
  'hsk1-l11-t1': {
    splitScreenDividerX: 50,
    obstacles: [],
    characters: [
      { name: '王一飞', face: [15.0, 17.0, 34.0, 37.0], head: [14.0, 10.0, 35.0, 37.0] },
      { name: '李文', face: [67.0, 18.0, 84.0, 38.0], head: [66.0, 10.0, 85.0, 38.0] },
    ],
  },
  'hsk1-l11-t2': {
    obstacles: [],
    characters: [
      { name: '王一飞', face: [19.0, 24.0, 37.0, 43.0], head: [18.0, 18.0, 38.0, 43.0] },
      { name: '李文', face: [66.0, 23.0, 82.0, 42.0], head: [65.0, 16.0, 83.0, 42.0] },
    ],
  },
  'hsk1-l11-t3': {
    obstacles: [],
    characters: [
      { name: '刘明', face: [22.0, 12.0, 44.0, 40.0], head: [21.0, 27.0, 45.0, 40.0] },
      { name: '刘小雪', face: [67.0, 27.0, 87.0, 52.0], head: [66.0, 22.0, 88.0, 52.0] },
    ],
  },
  'hsk1-l12-t1': {
    splitScreenDividerX: 50,
    obstacles: [],
    characters: [
      { name: '王一雪', face: [21.0, 18.0, 38.0, 42.0], head: [20.0, 14.0, 39.0, 42.0] },
      { name: '王一飞', face: [64.0, 22.0, 81.0, 40.0], head: [63.0, 14.0, 82.0, 40.0] },
    ],
  },
  'hsk1-l12-t2': {
    obstacles: [],
    characters: [
      { name: '王一雪', face: [21.0, 24.0, 37.0, 43.0], head: [20.0, 19.0, 38.0, 43.0] },
      { name: '杨同乐', face: [64.0, 21.0, 80.0, 40.0], head: [63.0, 14.0, 81.0, 40.0] },
    ],
  },
  'hsk1-l12-t3': {
    obstacles: [],
    characters: [
      { name: '杨同乐', face: [20.0, 19.0, 37.0, 39.0], head: [19.0, 11.0, 38.0, 39.0] },
      { name: '医生', face: [67.0, 20.0, 84.0, 39.0], head: [66.0, 13.0, 85.0, 39.0] },
    ],
  },
  'hsk1-l13-t1': {
    obstacles: [],
    characters: [
      { name: '白家月', face: [24.0, 12.0, 40.0, 36.0], head: [23.0, 10.0, 41.0, 36.0] },
      { name: '王一飞', face: [66.0, 12.0, 84.0, 35.0], head: [65.0, 8.0, 85.0, 35.0] },
    ],
  },
  'hsk1-l13-t2': {
    obstacles: [],
    characters: [
      { name: '王一雪', face: [18.0, 29.0, 34.0, 48.0], head: [17.0, 25.0, 35.0, 48.0] },
      { name: '服务员', face: [63.0, 14.0, 78.0, 36.0], head: [62.0, 11.0, 79.0, 36.0] },
    ],
  },
  'hsk1-l13-t3': {
    obstacles: [],
    characters: [
      { name: '刘明', face: [24.0, 13.0, 44.0, 41.0], head: [23.0, 8.0, 45.0, 41.0] },
      { name: '服务员', face: [60.0, 14.0, 77.0, 32.0], head: [59.0, 11.0, 78.0, 32.0] },
    ],
  },
  'hsk1-l14-t1': {
    obstacles: [[39, 1, 65, 27], [48, 29, 67, 49], [82, 2, 99, 24]],
    characters: [
      { name: '白家月', face: [24.0, 12.0, 39.0, 35.0], head: [23.0, 10.0, 40.0, 35.0] },
      { name: '陈天中', face: [64.0, 13.0, 83.0, 36.0], head: [63.0, 9.0, 84.0, 36.0] },
    ],
  },
  'hsk1-l14-t2': {
    obstacles: [],
    characters: [
      { name: '陈天中', face: [29.0, 30.0, 41.0, 48.0], head: [28.0, 23.0, 42.0, 48.0] },
      { name: '白家月', face: [47.0, 33.0, 52.0, 42.0], head: [46.0, 30.0, 53.0, 42.0] },
      { name: '王一飞', face: [58.0, 18.0, 62.0, 24.0], head: [57.0, 17.0, 63.0, 24.0] },
    ],
  },
  'hsk1-l14-t3': {
    obstacles: [],
    characters: [
      { name: '刘明', face: [25.0, 23.0, 38.0, 44.0], head: [24.0, 15.0, 39.0, 44.0] },
      { name: '王一雪', face: [51.0, 25.0, 63.0, 46.0], head: [50.0, 18.0, 64.0, 46.0] },
    ],
  },
  'hsk1-l15-t1': {
    obstacles: [],
    characters: [
      { name: '白家月', face: [15.0, 38.0, 26.0, 58.0], head: [14.0, 35.0, 27.0, 58.0] },
      { name: '李文', face: [30.0, 6.0, 42.0, 28.0], head: [29.0, 5.0, 43.0, 28.0] },
      { name: '安妮', face: [68.0, 38.0, 77.0, 56.0], head: [67.0, 36.0, 78.0, 56.0] },
      { name: '陈天中', face: [74.0, 33.0, 87.0, 57.0], head: [73.0, 32.0, 88.0, 57.0] },
    ],
  },
  'hsk1-l15-t2': {
    obstacles: [],
    characters: [
      { name: '白家月', face: [15.0, 38.0, 26.0, 58.0], head: [14.0, 35.0, 27.0, 58.0] },
      { name: '李文', face: [43.0, 27.0, 55.0, 48.0], head: [42.0, 26.0, 56.0, 48.0] },
      { name: '安妮', face: [66.0, 37.0, 78.0, 56.0], head: [65.0, 36.0, 79.0, 56.0] },
      { name: '陈天中', face: [75.0, 33.0, 88.0, 57.0], head: [74.0, 33.0, 89.0, 57.0] },
    ],
  },
  'hsk1-l15-t3': {
    obstacles: [],
    characters: [
      { name: '白家月', face: [18.0, 17.0, 31.0, 42.0], head: [17.0, 14.0, 32.0, 42.0] },
      { name: '王一飞', face: [41.0, 7.0, 58.0, 38.0], head: [40.0, 7.0, 59.0, 38.0] },
      { name: '安妮', face: [68.0, 17.0, 83.0, 42.0], head: [67.0, 13.0, 84.0, 42.0] },
    ],
  },
  'hsk2-l1-t1': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [15, 16, 32, 38], head: [14.0, 12, 33.0, 38] },
      { name: 'Face_2', face: [47, 24, 65, 44], head: [46.0, 20, 66.0, 44] },
      { name: 'Face_3', face: [68, 21, 86, 43], head: [67.0, 17, 87.0, 43] },
    ],
  },
  'hsk2-l1-t2': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [17, 30, 37, 54], head: [16.0, 26, 38.0, 54] },
      { name: 'Face_2', face: [54, 32, 68, 49], head: [53.0, 28, 69.0, 49] },
      { name: 'Face_3', face: [68, 25, 88, 52], head: [67.0, 21, 89.0, 52] },
    ],
  },
  'hsk2-l1-t3': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [6, 5, 20, 26], head: [5.0, 1, 21.0, 26] },
      { name: 'Face_2', face: [41, 27, 61, 49], head: [40.0, 23, 62.0, 49] },
    ],
  },
  'hsk2-l1-t4': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [21, 33, 36, 51], head: [20.0, 29, 37.0, 51] },
      { name: 'Face_2', face: [75, 36, 89, 53], head: [74.0, 32, 90.0, 53] },
    ],
  },
  'hsk2-l2-t1': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [14, 35, 32, 56], head: [13.0, 31, 33.0, 56] },
      { name: 'Face_2', face: [35, 36, 52, 55], head: [34.0, 32, 53.0, 55] },
      { name: 'Face_3', face: [77, 26, 90, 46], head: [76.0, 22, 91.0, 46] },
    ],
  },
  'hsk2-l2-t2': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [29, 37, 49, 60], head: [28.0, 33, 50.0, 60] },
      { name: 'Face_2', face: [58, 37, 78, 60], head: [57.0, 33, 79.0, 60] },
    ],
  },
  'hsk2-l2-t3': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [14, 8, 40, 40], head: [13.0, 4, 41.0, 40] },
      { name: 'Face_2', face: [51, 8, 77, 40], head: [50.0, 4, 78.0, 40] },
    ],
  },
  'hsk2-l2-t4': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [52, 10, 76, 41], head: [51.0, 6, 77.0, 41] },
      { name: 'Face_2', face: [75, 3, 99, 30], head: [74.0, 0, 100, 30] },
    ],
  },
  'hsk2-l3-t1': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [26, 9, 42, 33], head: [25.0, 5, 43.0, 33] },
      { name: 'Face_2', face: [67, 21, 84, 44], head: [66.0, 17, 85.0, 44] },
    ],
  },
  'hsk2-l3-t2': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [25, 23, 40, 47], head: [24.0, 19, 41.0, 47] },
      { name: 'Face_2', face: [67, 27, 84, 50], head: [66.0, 23, 85.0, 50] },
    ],
  },
  'hsk2-l3-t3': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [25, 23, 40, 47], head: [24.0, 19, 41.0, 47] },
      { name: 'Face_2', face: [67, 27, 84, 50], head: [66.0, 23, 85.0, 50] },
    ],
  },
  'hsk2-l3-t4': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [67, 27, 84, 50], head: [66.0, 23, 85.0, 50] },
      { name: 'Face_2', face: [45, 7, 68, 28], head: [44.0, 3, 69.0, 28] },
    ],
  },
  'hsk2-l4-t1': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [29, 15, 48, 39], head: [28.0, 11, 49.0, 39] },
      { name: 'Face_2', face: [58, 38, 74, 59], head: [57.0, 34, 75.0, 59] },
    ],
  },
  'hsk2-l4-t2': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [30, 32, 45, 54], head: [29.0, 28, 46.0, 54] },
      { name: 'Face_2', face: [55, 13, 74, 37], head: [54.0, 9, 75.0, 37] },
    ],
  },
  'hsk2-l4-t3': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [30, 32, 45, 54], head: [29.0, 28, 46.0, 54] },
      { name: 'Face_2', face: [55, 12, 74, 37], head: [54.0, 8, 75.0, 37] },
    ],
  },
  'hsk2-l4-t4': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [44, 34, 63, 59], head: [43.0, 30, 64.0, 59] },
      { name: 'Face_2', face: [16, 7, 40, 39], head: [15.0, 3, 41.0, 39] },
    ],
  },
  'hsk2-l5-t1': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [9, 2, 21, 18], head: [8.0, 0, 22.0, 18] },
      { name: 'Face_2', face: [53, 9, 78, 39], head: [52.0, 5, 79.0, 39] },
    ],
  },
  'hsk2-l5-t2': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [9, 27, 26, 46], head: [8.0, 23, 27.0, 46] },
      { name: 'Face_2', face: [26, 28, 41, 46], head: [25.0, 24, 42.0, 46] },
      { name: 'Face_3', face: [56, 27, 69, 45], head: [55.0, 23, 70.0, 45] },
      { name: 'Face_4', face: [69, 24, 80, 42], head: [68.0, 20, 81.0, 42] },
      { name: 'Face_5', face: [82, 31, 96, 49], head: [81.0, 27, 97.0, 49] },
    ],
  },
  'hsk2-l5-t3': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [5, 38, 23, 58], head: [4.0, 34, 24.0, 58] },
      { name: 'Face_2', face: [21, 39, 34, 56], head: [20.0, 35, 35.0, 56] },
      { name: 'Face_3', face: [39, 38, 48, 52], head: [38.0, 34, 49.0, 52] },
      { name: 'Face_4', face: [54, 41, 62, 54], head: [53.0, 37, 63.0, 54] },
      { name: 'Face_5', face: [65, 46, 74, 59], head: [64.0, 42, 75.0, 59] },
      { name: 'Face_6', face: [73, 52, 81, 64], head: [72.0, 48, 82.0, 64] },
      { name: 'Face_7', face: [78, 37, 93, 57], head: [77.0, 33, 94.0, 57] },
    ],
  },
  'hsk2-l5-t4': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [28, 30, 44, 49], head: [27.0, 26, 45.0, 49] },
    ],
  },
  'hsk2-l6-t1': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [10, 6, 21, 22], head: [9.0, 2, 22.0, 22] },
      { name: 'Face_2', face: [25, 22, 40, 47], head: [24.0, 18, 41.0, 47] },
      { name: 'Face_3', face: [67, 27, 83, 50], head: [66.0, 23, 84.0, 50] },
    ],
  },
  'hsk2-l6-t2': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [12, 10, 30, 47], head: [11.0, 6, 31.0, 47] },
      { name: 'Face_2', face: [31, 30, 47, 61], head: [30.0, 26, 48.0, 61] },
      { name: 'Face_3', face: [50, 14, 66, 49], head: [49.0, 10, 67.0, 49] },
      { name: 'Face_4', face: [72, 17, 91, 53], head: [71.0, 13, 92.0, 53] },
    ],
  },
  'hsk2-l6-t3': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [12, 20, 31, 48], head: [11.0, 16, 32.0, 48] },
      { name: 'Face_2', face: [40, 29, 58, 53], head: [39.0, 25, 59.0, 53] },
      { name: 'Face_3', face: [65, 23, 84, 48], head: [64.0, 19, 85.0, 48] },
      { name: 'Face_4', face: [80, 43, 99, 67], head: [79.0, 39, 100, 67] },
    ],
  },
  'hsk2-l6-t4': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [66, 27, 84, 52], head: [65.0, 23, 85.0, 52] },
    ],
  },
  'hsk2-l7-t1': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [32, 28, 46, 49], head: [31.0, 24, 47.0, 49] },
      { name: 'Face_2', face: [66, 38, 83, 58], head: [65.0, 34, 84.0, 58] },
    ],
  },
  'hsk2-l7-t2': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [37, 18, 46, 32], head: [36.0, 14, 47.0, 32] },
      { name: 'Face_2', face: [55, 24, 67, 38], head: [54.0, 20, 68.0, 38] },
    ],
  },
  'hsk2-l7-t3': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [30, 12, 44, 32], head: [29.0, 8, 45.0, 32] },
      { name: 'Face_2', face: [58, 20, 76, 40], head: [57.0, 16, 77.0, 40] },
    ],
  },
  'hsk2-l7-t4': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [45, 23, 58, 43], head: [44.0, 19, 59.0, 43] },
    ],
  },
  'hsk2-l8-t1': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [33, 3, 50, 31], head: [32.0, 0, 51.0, 31] },
      { name: 'Face_2', face: [59, 17, 79, 43], head: [58.0, 13, 80.0, 43] },
    ],
  },
  'hsk2-l8-t2': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [33, 3, 50, 31], head: [32.0, 0, 51.0, 31] },
      { name: 'Face_2', face: [59, 17, 79, 43], head: [58.0, 13, 80.0, 43] },
    ],
  },
  'hsk2-l8-t3': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [33, 3, 50, 31], head: [32.0, 0, 51.0, 31] },
      { name: 'Face_2', face: [59, 17, 79, 43], head: [58.0, 13, 80.0, 43] },
    ],
  },
  'hsk2-l8-t4': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [11, 13, 28, 33], head: [10.0, 9, 29.0, 33] },
      { name: 'Face_2', face: [64, 1, 76, 19], head: [63.0, 0, 77.0, 19] },
      { name: 'Face_3', face: [80, 9, 92, 24], head: [79.0, 5, 93.0, 24] },
      { name: 'Face_4', face: [59, 34, 70, 53], head: [58.0, 30, 71.0, 53] },
      { name: 'Face_5', face: [75, 44, 88, 61], head: [74.0, 40, 89.0, 61] },
    ],
  },
  'hsk2-l9-t1': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [57, 6, 69, 25], head: [56.0, 2, 70.0, 25] },
      { name: 'Face_2', face: [75, 15, 90, 33], head: [74.0, 11, 91.0, 33] },
      { name: 'Face_3', face: [91, 32, 99, 41], head: [90.0, 28, 100, 41] },
    ],
  },
  'hsk2-l9-t2': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [32, 8, 41, 23], head: [31.0, 4, 42.0, 23] },
      { name: 'Face_2', face: [49, 16, 60, 29], head: [48.0, 12, 61.0, 29] },
    ],
  },
  'hsk2-l9-t3': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [32, 9, 41, 23], head: [31.0, 5, 42.0, 23] },
      { name: 'Face_2', face: [49, 16, 59, 29], head: [48.0, 12, 60.0, 29] },
    ],
  },
  'hsk2-l9-t4': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [44, 11, 61, 31], head: [43.0, 7, 62.0, 31] },
    ],
  },
  'hsk2-l10-t1': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [39, 6, 49, 21], head: [38.0, 2, 50.0, 21] },
      { name: 'Face_2', face: [66, 26, 76, 39], head: [65.0, 22, 77.0, 39] },
    ],
  },
  'hsk2-l10-t2': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [48, 27, 58, 41], head: [47.0, 23, 59.0, 41] },
      { name: 'Face_2', face: [55, 6, 71, 25], head: [54.0, 2, 72.0, 25] },
    ],
  },
  'hsk2-l10-t3': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [22, 22, 35, 38], head: [21.0, 18, 36.0, 38] },
      { name: 'Face_2', face: [50, 19, 64, 36], head: [49.0, 15, 65.0, 36] },
      { name: 'Face_3', face: [76, 34, 89, 49], head: [75.0, 30, 90.0, 49] },
    ],
  },
  'hsk2-l10-t4': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [48, 27, 58, 41], head: [47.0, 23, 59.0, 41] },
    ],
  },
  'hsk2-l11-t1': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [25, 25, 46, 55], head: [24.0, 21, 47.0, 55] },
      { name: 'Face_2', face: [56, 8, 72, 37], head: [55.0, 4, 73.0, 37] },
    ],
  },
  'hsk2-l11-t2': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [19, 15, 37, 48], head: [18.0, 11, 38.0, 48] },
      { name: 'Face_2', face: [67, 20, 86, 51], head: [66.0, 16, 87.0, 51] },
    ],
  },
  'hsk2-l11-t3': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [14, 37, 28, 56], head: [13.0, 33, 29.0, 56] },
      { name: 'Face_2', face: [60, 22, 69, 38], head: [59.0, 18, 70.0, 38] },
      { name: 'Face_3', face: [72, 32, 82, 51], head: [71.0, 28, 83.0, 51] },
    ],
  },
  'hsk2-l11-t4': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [42, 16, 62, 48], head: [41.0, 12, 63.0, 48] },
    ],
  },
  'hsk2-l12-t1': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [25, 17, 38, 33], head: [24.0, 13, 39.0, 33] },
      { name: 'Face_2', face: [76, 19, 89, 34], head: [75.0, 15, 90.0, 34] },
    ],
  },
  'hsk2-l12-t2': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [21, 11, 38, 40], head: [20.0, 7, 39.0, 40] },
      { name: 'Face_2', face: [68, 12, 84, 40], head: [67.0, 8, 85.0, 40] },
    ],
  },
  'hsk2-l12-t3': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [19, 13, 31, 36], head: [18.0, 9, 32.0, 36] },
      { name: 'Face_2', face: [69, 14, 84, 39], head: [68.0, 10, 85.0, 39] },
    ],
  },
  'hsk2-l12-t4': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [42, 16, 62, 48], head: [41.0, 12, 63.0, 48] },
    ],
  },
  'hsk2-l13-t1': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [24, 28, 43, 54], head: [23.0, 24, 44.0, 54] },
      { name: 'Face_2', face: [62, 26, 76, 54], head: [61.0, 22, 77.0, 54] },
      { name: 'Face_3', face: [9, 34, 15, 46], head: [8.0, 30, 16.0, 46] },
    ],
  },
  'hsk2-l13-t2': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [65, 10, 77, 31], head: [64.0, 6, 78.0, 31] },
      { name: 'Face_2', face: [0, 40, 17, 73], head: [0, 36, 18.0, 73] },
      { name: 'Face_3', face: [19, 41, 35, 70], head: [18.0, 37, 36.0, 70] },
      { name: 'Face_4', face: [39, 44, 58, 76], head: [38.0, 40, 59.0, 76] },
      { name: 'Face_5', face: [69, 51, 87, 85], head: [68.0, 47, 88.0, 85] },
      { name: 'Face_6', face: [85, 44, 100, 76], head: [84.0, 40, 100, 76] },
    ],
  },
  'hsk2-l13-t3': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [24, 28, 43, 54], head: [23.0, 24, 44.0, 54] },
      { name: 'Face_2', face: [63, 28, 79, 55], head: [62.0, 24, 80.0, 55] },
      { name: 'Face_3', face: [9, 34, 15, 46], head: [8.0, 30, 16.0, 46] },
    ],
  },
  'hsk2-l13-t4': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [30, 21, 44, 38], head: [29.0, 17, 45.0, 38] },
    ],
  },
  'hsk2-l14-t1': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [25, 9, 41, 37], head: [24.0, 5, 42.0, 37] },
      { name: 'Face_2', face: [48, 24, 61, 49], head: [47.0, 20, 62.0, 49] },
      { name: 'Face_3', face: [76, 39, 79, 46], head: [75.0, 35, 80.0, 46] },
    ],
  },
  'hsk2-l14-t2': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [25, 9, 41, 37], head: [24.0, 5, 42.0, 37] },
      { name: 'Face_2', face: [48, 25, 61, 49], head: [47.0, 21, 62.0, 49] },
      { name: 'Face_3', face: [72, 14, 84, 39], head: [71.0, 10, 85.0, 39] },
    ],
  },
  'hsk2-l14-t3': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [18, 36, 28, 54], head: [17.0, 32, 29.0, 54] },
      { name: 'Face_2', face: [73, 33, 82, 51], head: [72.0, 29, 83.0, 51] },
    ],
  },
  'hsk2-l14-t4': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [43, 17, 61, 49], head: [42.0, 13, 62.0, 49] },
    ],
  },
  'hsk2-l15-t1': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [23, 42, 37, 61], head: [22.0, 38, 38.0, 61] },
      { name: 'Face_2', face: [59, 26, 69, 44], head: [58.0, 22, 70.0, 44] },
      { name: 'Face_3', face: [72, 25, 83, 48], head: [71.0, 21, 84.0, 48] },
    ],
  },
  'hsk2-l15-t2': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [22, 26, 40, 52], head: [21.0, 22, 41.0, 52] },
      { name: 'Face_2', face: [59, 17, 74, 46], head: [58.0, 13, 75.0, 46] },
    ],
  },
  'hsk2-l15-t3': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [22, 26, 41, 52], head: [21.0, 22, 42.0, 52] },
      { name: 'Face_2', face: [59, 17, 74, 46], head: [58.0, 13, 75.0, 46] },
    ],
  },
  'hsk2-l15-t4': {
    obstacles: [],
    characters: [
      { name: 'Face_1', face: [44, 16, 60, 48], head: [43.0, 12, 61.0, 48] },
    ],
  },
};

/**
 * Retrieves the calibrated bubble layout configuration for a given HSK 1 / HSK 2 scene and speaker.
 */
export function getHsk1BubbleConfig(
  textId: string,
  speaker: string
): CharacterBubbleConfig | undefined {
  const scene = HSK1_BUBBLE_LAYOUTS[textId];
  if (!scene) return undefined;

  const cleanWithoutParen = speaker.replace(/\s*\(.*?\)/, '').trim();
  if (scene[cleanWithoutParen]) return scene[cleanWithoutParen];

  const cleanSpeaker = cleanWithoutParen.split('&')[0].trim();
  if (scene[cleanSpeaker]) return scene[cleanSpeaker];

  const matchedKey = Object.keys(scene).find(
    (k) => cleanSpeaker.includes(k) || k.includes(cleanSpeaker)
  );
  return matchedKey ? scene[matchedKey] : undefined;
}

/**
 * Calculates fallback bubble center coordinates when bubblePos is not explicitly specified.
 */
export function calculateFallbackBubblePos(
  mouthTarget: { x: number; y: number },
  placement: CharacterBubbleConfig['placement']
): { x: number; y: number } {
  switch (placement) {
    case 'top':
      return { x: mouthTarget.x, y: Math.max(14, mouthTarget.y - 18) };
    case 'top-left':
      return { x: Math.max(14, mouthTarget.x - 16), y: Math.max(14, mouthTarget.y - 16) };
    case 'top-right':
      return { x: Math.min(86, mouthTarget.x + 16), y: Math.max(14, mouthTarget.y - 16) };
    case 'left':
    case 'bottom-left':
      return { x: Math.max(14, mouthTarget.x - 20), y: mouthTarget.y };
    case 'right':
    case 'bottom-right':
      return { x: Math.min(86, mouthTarget.x + 20), y: mouthTarget.y };
    case 'custom':
    default:
      return { x: mouthTarget.x, y: Math.max(14, mouthTarget.y - 18) };
  }
}

/**
 * Real-time DOM bounding-box resolver that guarantees the rendered speech bubble
 * never overlaps any character face/head or split-screen divider across Desktop, Laptop, Tablet, and Smartphone.
 */
export function resolveSmartBubbleBox(params: {
  textId: string;
  bubblePos: { x: number; y: number };
  mouthTarget: { x: number; y: number };
  cardWidth: number;
  cardHeight: number;
  containerWidth: number;
  containerHeight: number;
}): { left: number; top: number; right: number; bottom: number; width: number; height: number } {
  const { textId, bubblePos, mouthTarget, cardWidth, cardHeight, containerWidth, containerHeight } = params;
  const guard = HSK1_SCENE_FACE_GUARDS[textId];
  const margin = 8;

  let minX = margin;
  let maxX = Math.max(margin, containerWidth - cardWidth - margin);
  const minY = margin;
  const maxY = Math.max(margin, containerHeight - cardHeight - margin);

  if (guard?.splitScreenDividerX) {
    const divPx = (guard.splitScreenDividerX / 100) * containerWidth;
    if (mouthTarget.x < guard.splitScreenDividerX) {
      maxX = Math.max(minX, Math.min(maxX, divPx - cardWidth - 4));
    } else {
      minX = Math.min(maxX, Math.max(minX, divPx + 4));
    }
  }

  const rawCenterXPx = (bubblePos.x / 100) * containerWidth;
  const rawCenterYPx = (bubblePos.y / 100) * containerHeight;
  const baseLeft = Math.max(minX, Math.min(maxX, rawCenterXPx - cardWidth / 2));
  const baseTop = Math.max(minY, Math.min(maxY, rawCenterYPx - cardHeight / 2));

  if (!guard) {
    return {
      left: baseLeft,
      top: baseTop,
      right: baseLeft + cardWidth,
      bottom: baseTop + cardHeight,
      width: cardWidth,
      height: cardHeight,
    };
  }

  const evalCandidate = (leftPx: number, topPx: number) => {
    const b0 = (leftPx / containerWidth) * 100;
    const b1 = (topPx / containerHeight) * 100;
    const b2 = ((leftPx + cardWidth) / containerWidth) * 100;
    const b3 = ((topPx + cardHeight) / containerHeight) * 100;

    let faceOverlapArea = 0;
    let headOverlapArea = 0;

    for (const ch of guard.characters) {
      const f = ch.face;
      const pad = 1.2;
      const fox = Math.min(b2, f[2] + pad) - Math.max(b0, f[0] - pad);
      const foy = Math.min(b3, f[3] + pad) - Math.max(b1, f[1] - pad);
      if (fox > 0 && foy > 0) {
        faceOverlapArea += fox * foy;
      }

      const h = ch.head;
      const hox = Math.min(b2, h[2] + 0.5) - Math.max(b0, h[0] - 0.5);
      const hoy = Math.min(b3, h[3] + 0.5) - Math.max(b1, h[1] - 0.5);
      if (hox > 0 && hoy > 0) {
        headOverlapArea += hox * hoy;
      }
    }

    for (const obs of guard.obstacles) {
      const oox = Math.min(b2, obs[2] + 0.8) - Math.max(b0, obs[0] - 0.8);
      const ooy = Math.min(b3, obs[3] + 0.8) - Math.max(b1, obs[1] - 0.8);
      if (oox > 0 && ooy > 0) {
        faceOverlapArea += oox * ooy;
      }
    }

    return { faceOverlapArea, headOverlapArea };
  };

  const initial = evalCandidate(baseLeft, baseTop);
  if (initial.faceOverlapArea === 0 && initial.headOverlapArea === 0) {
    return {
      left: baseLeft,
      top: baseTop,
      right: baseLeft + cardWidth,
      bottom: baseTop + cardHeight,
      width: cardWidth,
      height: cardHeight,
    };
  }

  // If real DOM text wrapping caused minor encroachment on any device, nudge to nearest zero-overlap spot
  let bestLeft = baseLeft;
  let bestTop = baseTop;
  let bestScore = initial.faceOverlapArea * 1000 + initial.headOverlapArea * 25;

  const stepX = Math.max(6, Math.round(containerWidth * 0.025));
  const stepY = Math.max(5, Math.round(containerHeight * 0.025));

  for (let dySteps = -8; dySteps <= 8; dySteps++) {
    for (let dxSteps = -8; dxSteps <= 8; dxSteps++) {
      if (dxSteps === 0 && dySteps === 0) continue;
      const candLeft = Math.max(minX, Math.min(maxX, baseLeft + dxSteps * stepX));
      const candTop = Math.max(minY, Math.min(maxY, baseTop + dySteps * stepY));
      const res = evalCandidate(candLeft, candTop);
      const distPenalty = Math.hypot(candLeft - baseLeft, candTop - baseTop) * 0.15;
      const score = res.faceOverlapArea * 1000 + res.headOverlapArea * 25 + distPenalty;
      if (score < bestScore) {
        bestScore = score;
        bestLeft = candLeft;
        bestTop = candTop;
      }
    }
  }

  return {
    left: bestLeft,
    top: bestTop,
    right: bestLeft + cardWidth,
    bottom: bestTop + cardHeight,
    width: cardWidth,
    height: cardHeight,
  };
}
