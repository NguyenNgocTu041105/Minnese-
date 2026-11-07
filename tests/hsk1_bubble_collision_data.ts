// Ground Truth Character Visual Bounding Boxes and Mouth Registry for HSK 1 Coursebook
// Derived authoritatively from explorer_bubble_survey_2/handoff.md visual measurement of all 45 textbook illustrations

export type BoundingBox = [minX: number, minY: number, maxX: number, maxY: number];

export interface Point {
  x: number;
  y: number;
}

export interface CharacterVisualRecord {
  character: string;
  portrait: BoundingBox;  // visible character body, hair, torso [minX, minY, maxX, maxY] in %
  face: BoundingBox;      // eyes, nose, mouth region [minX, minY, maxX, maxY] in %
  mouth: Point;           // visual mouth aperture coordinates (x, y) in %
  description?: string;
}

export type SceneVisualRegistry = Record<string, Record<string, CharacterVisualRecord>>;

export interface SceneMetadata {
  dialogueId: string;
  lesson: number;
  textIndex: number;
  imagePath: string;
  imageDimensions: { width: number; height: number };
  aspectRatioClass: '4:3' | '16:9';
  category: 'standard' | 'split-screen' | 'embedded-thought-bubbles' | 'video-call';
  splitScreenDividerX?: number;
  dangerObstacles?: Array<{ name: string; box: BoundingBox }>;
}

export const WIDESCREEN_DIALOGUE_IDS = [
  'hsk1-l14-t2',
  'hsk1-l14-t3',
  'hsk1-l15-t1',
  'hsk1-l15-t2',
  'hsk1-l15-t3',
] as const;

export const SPLIT_SCREEN_DIALOGUE_IDS = [
  'hsk1-l7-t1',
  'hsk1-l7-t3',
  'hsk1-l8-t2',
  'hsk1-l11-t1',
  'hsk1-l12-t1',
] as const;

export const HSK1_SCENE_METADATA: Record<string, SceneMetadata> = {};

HSK1_SCENE_METADATA['hsk1-l1-t1'] = {
  dialogueId: 'hsk1-l1-t1',
  lesson: 1,
  textIndex: 1,
  imagePath: 'public/textbook_art/hsk1_30_l1_t1.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l1-t2'] = {
  dialogueId: 'hsk1-l1-t2',
  lesson: 1,
  textIndex: 2,
  imagePath: 'public/textbook_art/hsk1_30_l1_t2.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l1-t3'] = {
  dialogueId: 'hsk1-l1-t3',
  lesson: 1,
  textIndex: 3,
  imagePath: 'public/textbook_art/hsk1_30_l1_t3.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l10-t1'] = {
  dialogueId: 'hsk1-l10-t1',
  lesson: 10,
  textIndex: 1,
  imagePath: 'public/textbook_art/hsk1_30_l10_t1.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l10-t2'] = {
  dialogueId: 'hsk1-l10-t2',
  lesson: 10,
  textIndex: 2,
  imagePath: 'public/textbook_art/hsk1_30_l10_t2.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l10-t3'] = {
  dialogueId: 'hsk1-l10-t3',
  lesson: 10,
  textIndex: 3,
  imagePath: 'public/textbook_art/hsk1_30_l10_t3.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l11-t1'] = {
  dialogueId: 'hsk1-l11-t1',
  lesson: 11,
  textIndex: 1,
  imagePath: 'public/textbook_art/hsk1_30_l11_t1.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'split-screen',
  splitScreenDividerX: 50,
};

HSK1_SCENE_METADATA['hsk1-l11-t2'] = {
  dialogueId: 'hsk1-l11-t2',
  lesson: 11,
  textIndex: 2,
  imagePath: 'public/textbook_art/hsk1_30_l11_t2.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l11-t3'] = {
  dialogueId: 'hsk1-l11-t3',
  lesson: 11,
  textIndex: 3,
  imagePath: 'public/textbook_art/hsk1_30_l11_t3.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l12-t1'] = {
  dialogueId: 'hsk1-l12-t1',
  lesson: 12,
  textIndex: 1,
  imagePath: 'public/textbook_art/hsk1_30_l12_t1.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'split-screen',
  splitScreenDividerX: 50,
};

HSK1_SCENE_METADATA['hsk1-l12-t2'] = {
  dialogueId: 'hsk1-l12-t2',
  lesson: 12,
  textIndex: 2,
  imagePath: 'public/textbook_art/hsk1_30_l12_t2.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l12-t3'] = {
  dialogueId: 'hsk1-l12-t3',
  lesson: 12,
  textIndex: 3,
  imagePath: 'public/textbook_art/hsk1_30_l12_t3.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l13-t1'] = {
  dialogueId: 'hsk1-l13-t1',
  lesson: 13,
  textIndex: 1,
  imagePath: 'public/textbook_art/hsk1_30_l13_t1.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l13-t2'] = {
  dialogueId: 'hsk1-l13-t2',
  lesson: 13,
  textIndex: 2,
  imagePath: 'public/textbook_art/hsk1_30_l13_t2.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l13-t3'] = {
  dialogueId: 'hsk1-l13-t3',
  lesson: 13,
  textIndex: 3,
  imagePath: 'public/textbook_art/hsk1_30_l13_t3.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l14-t1'] = {
  dialogueId: 'hsk1-l14-t1',
  lesson: 14,
  textIndex: 1,
  imagePath: 'public/textbook_art/hsk1_30_l14_t1.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'embedded-thought-bubbles',
  dangerObstacles: [
    {
        "name": "train-compartment-cloud",
        "box": [
            39,
            1,
            65,
            27
        ]
    },
    {
        "name": "train-travel-cloud",
        "box": [
            48,
            29,
            67,
            49
        ]
    },
    {
        "name": "video-call-cloud",
        "box": [
            82,
            2,
            99,
            24
        ]
    }
],
};

HSK1_SCENE_METADATA['hsk1-l14-t2'] = {
  dialogueId: 'hsk1-l14-t2',
  lesson: 14,
  textIndex: 2,
  imagePath: 'public/textbook_art/hsk1_30_l14_t2.png',
  imageDimensions: { width: 1024, height: 572 },
  aspectRatioClass: '16:9',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l14-t3'] = {
  dialogueId: 'hsk1-l14-t3',
  lesson: 14,
  textIndex: 3,
  imagePath: 'public/textbook_art/hsk1_30_l14_t3.png',
  imageDimensions: { width: 1024, height: 572 },
  aspectRatioClass: '16:9',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l15-t1'] = {
  dialogueId: 'hsk1-l15-t1',
  lesson: 15,
  textIndex: 1,
  imagePath: 'public/textbook_art/hsk1_30_l15_t1.png',
  imageDimensions: { width: 1024, height: 572 },
  aspectRatioClass: '16:9',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l15-t2'] = {
  dialogueId: 'hsk1-l15-t2',
  lesson: 15,
  textIndex: 2,
  imagePath: 'public/textbook_art/hsk1_30_l15_t2.png',
  imageDimensions: { width: 1024, height: 572 },
  aspectRatioClass: '16:9',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l15-t3'] = {
  dialogueId: 'hsk1-l15-t3',
  lesson: 15,
  textIndex: 3,
  imagePath: 'public/textbook_art/hsk1_30_l15_t3.png',
  imageDimensions: { width: 1024, height: 572 },
  aspectRatioClass: '16:9',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l2-t1'] = {
  dialogueId: 'hsk1-l2-t1',
  lesson: 2,
  textIndex: 1,
  imagePath: 'public/textbook_art/hsk1_30_l2_t1.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l2-t2'] = {
  dialogueId: 'hsk1-l2-t2',
  lesson: 2,
  textIndex: 2,
  imagePath: 'public/textbook_art/hsk1_30_l2_t2.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l2-t3'] = {
  dialogueId: 'hsk1-l2-t3',
  lesson: 2,
  textIndex: 3,
  imagePath: 'public/textbook_art/hsk1_30_l2_t3.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l3-t1'] = {
  dialogueId: 'hsk1-l3-t1',
  lesson: 3,
  textIndex: 1,
  imagePath: 'public/textbook_art/hsk1_30_l3_t1.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l3-t2'] = {
  dialogueId: 'hsk1-l3-t2',
  lesson: 3,
  textIndex: 2,
  imagePath: 'public/textbook_art/hsk1_30_l3_t2.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l3-t3'] = {
  dialogueId: 'hsk1-l3-t3',
  lesson: 3,
  textIndex: 3,
  imagePath: 'public/textbook_art/hsk1_30_l3_t3.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'video-call',
  dangerObstacles: [
    {
        "name": "phone-screen",
        "box": [
            37,
            45,
            51,
            72
        ]
    }
],
};

HSK1_SCENE_METADATA['hsk1-l4-t1'] = {
  dialogueId: 'hsk1-l4-t1',
  lesson: 4,
  textIndex: 1,
  imagePath: 'public/textbook_art/hsk1_30_l4_t1.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l4-t2'] = {
  dialogueId: 'hsk1-l4-t2',
  lesson: 4,
  textIndex: 2,
  imagePath: 'public/textbook_art/hsk1_30_l4_t2.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l4-t3'] = {
  dialogueId: 'hsk1-l4-t3',
  lesson: 4,
  textIndex: 3,
  imagePath: 'public/textbook_art/hsk1_30_l4_t3.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l5-t1'] = {
  dialogueId: 'hsk1-l5-t1',
  lesson: 5,
  textIndex: 1,
  imagePath: 'public/textbook_art/hsk1_30_l5_t1.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l5-t2'] = {
  dialogueId: 'hsk1-l5-t2',
  lesson: 5,
  textIndex: 2,
  imagePath: 'public/textbook_art/hsk1_30_l5_t2.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'embedded-thought-bubbles',
  dangerObstacles: [
    {
        "name": "noodles-bubble",
        "box": [
            46,
            2,
            65,
            26
        ]
    },
    {
        "name": "dumplings-bubble",
        "box": [
            48,
            30,
            62,
            48
        ]
    },
    {
        "name": "pan-bubble",
        "box": [
            84,
            24,
            98,
            42
        ]
    }
],
};

HSK1_SCENE_METADATA['hsk1-l5-t3'] = {
  dialogueId: 'hsk1-l5-t3',
  lesson: 5,
  textIndex: 3,
  imagePath: 'public/textbook_art/hsk1_30_l5_t3.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l6-t1'] = {
  dialogueId: 'hsk1-l6-t1',
  lesson: 6,
  textIndex: 1,
  imagePath: 'public/textbook_art/hsk1_30_l6_t1.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l6-t2'] = {
  dialogueId: 'hsk1-l6-t2',
  lesson: 6,
  textIndex: 2,
  imagePath: 'public/textbook_art/hsk1_30_l6_t2.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l6-t3'] = {
  dialogueId: 'hsk1-l6-t3',
  lesson: 6,
  textIndex: 3,
  imagePath: 'public/textbook_art/hsk1_30_l6_t3.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l7-t1'] = {
  dialogueId: 'hsk1-l7-t1',
  lesson: 7,
  textIndex: 1,
  imagePath: 'public/textbook_art/hsk1_30_l7_t1.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'split-screen',
  splitScreenDividerX: 50,
};

HSK1_SCENE_METADATA['hsk1-l7-t2'] = {
  dialogueId: 'hsk1-l7-t2',
  lesson: 7,
  textIndex: 2,
  imagePath: 'public/textbook_art/hsk1_30_l7_t2.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l7-t3'] = {
  dialogueId: 'hsk1-l7-t3',
  lesson: 7,
  textIndex: 3,
  imagePath: 'public/textbook_art/hsk1_30_l7_t3.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'split-screen',
  splitScreenDividerX: 50,
};

HSK1_SCENE_METADATA['hsk1-l8-t1'] = {
  dialogueId: 'hsk1-l8-t1',
  lesson: 8,
  textIndex: 1,
  imagePath: 'public/textbook_art/hsk1_30_l8_t1.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l8-t2'] = {
  dialogueId: 'hsk1-l8-t2',
  lesson: 8,
  textIndex: 2,
  imagePath: 'public/textbook_art/hsk1_30_l8_t2.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'split-screen',
  splitScreenDividerX: 50,
};

HSK1_SCENE_METADATA['hsk1-l8-t3'] = {
  dialogueId: 'hsk1-l8-t3',
  lesson: 8,
  textIndex: 3,
  imagePath: 'public/textbook_art/hsk1_30_l8_t3.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l9-t1'] = {
  dialogueId: 'hsk1-l9-t1',
  lesson: 9,
  textIndex: 1,
  imagePath: 'public/textbook_art/hsk1_30_l9_t1.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l9-t2'] = {
  dialogueId: 'hsk1-l9-t2',
  lesson: 9,
  textIndex: 2,
  imagePath: 'public/textbook_art/hsk1_30_l9_t2.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

HSK1_SCENE_METADATA['hsk1-l9-t3'] = {
  dialogueId: 'hsk1-l9-t3',
  lesson: 9,
  textIndex: 3,
  imagePath: 'public/textbook_art/hsk1_30_l9_t3.png',
  imageDimensions: { width: 1024, height: 765 },
  aspectRatioClass: '4:3',
  category: 'standard',
};

export const HSK1_CHARACTER_BOUNDING_BOXES: SceneVisualRegistry = {
  "hsk1-l1-t1": {
    "王一飞": {
      "character": "王一飞",
      "portrait": [
        30.0,
        26.0,
        57.0,
        71.0
      ],
      "face": [
        37.0,
        31.0,
        46.0,
        44.0
      ],
      "mouth": {
        "x": 42.5,
        "y": 42.0
      },
      "description": "Teacher at desk"
    },
    "小语": {
      "character": "小语",
      "portrait": [
        57.0,
        19.0,
        88.0,
        83.0
      ],
      "face": [
        67.0,
        24.0,
        77.0,
        37.0
      ],
      "mouth": {
        "x": 71.5,
        "y": 35.0
      },
      "description": "Floating AI assistant"
    }
  },
  "hsk1-l1-t2": {
    "学生们": {
      "character": "学生们",
      "portrait": [
        16.0,
        46.0,
        52.0,
        98.0
      ],
      "face": [
        21.0,
        56.0,
        32.0,
        68.0
      ],
      "mouth": {
        "x": 26.5,
        "y": 66.0
      },
      "description": "Students in front desk"
    },
    "王一飞": {
      "character": "王一飞",
      "portrait": [
        56.0,
        19.0,
        71.0,
        57.0
      ],
      "face": [
        62.0,
        21.0,
        69.0,
        29.0
      ],
      "mouth": {
        "x": 65.5,
        "y": 27.0
      },
      "description": "Teacher at board"
    },
    "小语": {
      "character": "小语",
      "portrait": [
        72.0,
        15.0,
        89.0,
        44.0
      ],
      "face": [
        76.0,
        18.0,
        84.0,
        26.0
      ],
      "mouth": {
        "x": 79.5,
        "y": 24.5
      },
      "description": "Floating AI"
    }
  },
  "hsk1-l1-t3": {
    "学生们": {
      "character": "学生们",
      "portrait": [
        28.0,
        46.0,
        49.0,
        90.0
      ],
      "face": [
        37.0,
        49.0,
        44.0,
        58.0
      ],
      "mouth": {
        "x": 41.5,
        "y": 57.0
      },
      "description": "Student in teal sweater with glasses"
    },
    "王一飞": {
      "character": "王一飞",
      "portrait": [
        67.0,
        15.0,
        80.0,
        40.0
      ],
      "face": [
        71.5,
        17.0,
        77.0,
        24.0
      ],
      "mouth": {
        "x": 74.0,
        "y": 22.5
      },
      "description": "Teacher at podium"
    },
    "小语": {
      "character": "小语",
      "portrait": [
        79.0,
        13.0,
        91.0,
        35.0
      ],
      "face": [
        82.0,
        17.5,
        88.0,
        24.0
      ],
      "mouth": {
        "x": 84.5,
        "y": 22.0
      },
      "description": "Floating AI"
    }
  },
  "hsk1-l2-t1": {
    "陈天中": {
      "character": "陈天中",
      "portrait": [
        15.0,
        28.0,
        37.0,
        94.0
      ],
      "face": [
        22.0,
        30.0,
        30.0,
        42.0
      ],
      "mouth": {
        "x": 28.5,
        "y": 38.5
      },
      "description": "Standing student in orange/black jacket"
    },
    "王一飞": {
      "character": "王一飞",
      "portrait": [
        62.0,
        17.0,
        82.0,
        64.0
      ],
      "face": [
        71.0,
        18.0,
        78.0,
        27.0
      ],
      "mouth": {
        "x": 74.0,
        "y": 25.5
      },
      "description": "Teacher at podium"
    }
  },
  "hsk1-l2-t2": {
    "陈天中": {
      "character": "陈天中",
      "portrait": [
        20.0,
        17.0,
        45.0,
        98.0
      ],
      "face": [
        34.0,
        20.0,
        45.0,
        33.0
      ],
      "mouth": {
        "x": 40.0,
        "y": 31.0
      },
      "description": "Bowing student in varsity jacket"
    },
    "白家月": {
      "character": "白家月",
      "portrait": [
        52.0,
        20.0,
        79.0,
        98.0
      ],
      "face": [
        61.0,
        22.0,
        72.0,
        35.0
      ],
      "mouth": {
        "x": 64.5,
        "y": 32.5
      },
      "description": "Girl in denim jacket & glasses"
    }
  },
  "hsk1-l2-t3": {
    "李文": {
      "character": "李文",
      "portrait": [
        14.0,
        8.0,
        44.0,
        98.0
      ],
      "face": [
        24.0,
        11.0,
        34.0,
        23.0
      ],
      "mouth": {
        "x": 30.0,
        "y": 20.0
      },
      "description": "Walking student in brown jacket"
    },
    "白家月": {
      "character": "白家月",
      "portrait": [
        55.0,
        29.0,
        88.0,
        98.0
      ],
      "face": [
        73.0,
        30.0,
        83.0,
        42.0
      ],
      "mouth": {
        "x": 75.5,
        "y": 39.0
      },
      "description": "Sitting on stone bench"
    }
  },
  "hsk1-l3-t1": {
    "李文": {
      "character": "李文",
      "portrait": [
        17.0,
        21.0,
        45.0,
        96.0
      ],
      "face": [
        26.0,
        22.0,
        36.0,
        37.0
      ],
      "mouth": {
        "x": 33.5,
        "y": 34.0
      },
      "description": "Seated left, pen in hand"
    },
    "白家月": {
      "character": "白家月",
      "portrait": [
        57.0,
        29.0,
        89.0,
        98.0
      ],
      "face": [
        74.0,
        30.0,
        84.0,
        42.0
      ],
      "mouth": {
        "x": 77.0,
        "y": 39.5
      },
      "description": "Seated right, gesturing"
    }
  },
  "hsk1-l3-t2": {
    "陈天中": {
      "character": "陈天中",
      "portrait": [
        21.0,
        11.0,
        51.0,
        75.0
      ],
      "face": [
        34.0,
        13.0,
        49.0,
        38.0
      ],
      "mouth": {
        "x": 42.5,
        "y": 35.0
      },
      "description": "Pointing at phone screen"
    },
    "安妮": {
      "character": "安妮",
      "portrait": [
        54.0,
        18.0,
        80.0,
        75.0
      ],
      "face": [
        56.0,
        24.0,
        68.0,
        43.0
      ],
      "mouth": {
        "x": 62.5,
        "y": 39.5
      },
      "description": "Blonde student leaning on hand"
    }
  },
  "hsk1-l3-t3": {
    "王一雪": {
      "character": "王一雪",
      "portrait": [
        9.0,
        7.0,
        98.0,
        98.0
      ],
      "face": [
        58.0,
        15.0,
        77.0,
        50.0
      ],
      "mouth": {
        "x": 64.5,
        "y": 46.0
      },
      "description": "Foreground on sofa"
    },
    "王一飞": {
      "character": "王一飞",
      "portrait": [
        37.0,
        45.0,
        51.0,
        72.0
      ],
      "face": [
        41.0,
        50.0,
        48.0,
        62.0
      ],
      "mouth": {
        "x": 44.5,
        "y": 58.5
      },
      "description": "On smartphone screen"
    }
  },
  "hsk1-l4-t1": {
    "刘明": {
      "character": "刘明",
      "portrait": [
        20.0,
        15.0,
        51.0,
        95.0
      ],
      "face": [
        30.0,
        22.0,
        44.0,
        41.0
      ],
      "mouth": {
        "x": 39.5,
        "y": 37.0
      },
      "description": "Holding HSK book, glasses"
    },
    "王一雪": {
      "character": "王一雪",
      "portrait": [
        49.0,
        19.0,
        79.0,
        95.0
      ],
      "face": [
        57.0,
        24.0,
        69.0,
        42.0
      ],
      "mouth": {
        "x": 61.5,
        "y": 38.5
      },
      "description": "Pink dress, smiling"
    }
  },
  "hsk1-l4-t2": {
    "王一雪": {
      "character": "王一雪",
      "portrait": [
        16.0,
        23.0,
        46.0,
        98.0
      ],
      "face": [
        25.0,
        28.0,
        36.0,
        44.0
      ],
      "mouth": {
        "x": 33.0,
        "y": 40.5
      },
      "description": "Pink cardigan, blue mug"
    },
    "杨同乐": {
      "character": "杨同乐",
      "portrait": [
        52.0,
        18.0,
        90.0,
        98.0
      ],
      "face": [
        65.0,
        25.0,
        77.0,
        42.0
      ],
      "mouth": {
        "x": 69.0,
        "y": 37.5
      },
      "description": "Light blue shirt, grey mug"
    }
  },
  "hsk1-l4-t3": {
    "刘小明": {
      "character": "刘小明",
      "portrait": [
        15.0,
        44.0,
        32.0,
        98.0
      ],
      "face": [
        17.0,
        45.0,
        28.0,
        58.0
      ],
      "mouth": {
        "x": 25.0,
        "y": 56.0
      },
      "description": "Little boy holding mom's hand"
    },
    "王一雪": {
      "character": "王一雪",
      "portrait": [
        31.0,
        15.0,
        50.0,
        98.0
      ],
      "face": [
        37.0,
        20.0,
        47.0,
        32.0
      ],
      "mouth": {
        "x": 43.0,
        "y": 28.5
      },
      "description": "Mother in beige cardigan"
    },
    "杨同乐": {
      "character": "杨同乐",
      "portrait": [
        56.0,
        14.0,
        94.0,
        98.0
      ],
      "face": [
        63.0,
        19.0,
        75.0,
        32.0
      ],
      "mouth": {
        "x": 67.5,
        "y": 29.5
      },
      "description": "Bent forward pointing at boy"
    }
  },
  "hsk1-l5-t1": {
    "王一雪": {
      "character": "王一雪",
      "portrait": [
        22.0,
        17.0,
        52.0,
        88.0
      ],
      "face": [
        34.0,
        22.0,
        47.0,
        39.0
      ],
      "mouth": {
        "x": 42.0,
        "y": 35.5
      },
      "description": "Pointing at calendar"
    },
    "刘明": {
      "character": "刘明",
      "portrait": [
        48.0,
        11.0,
        87.0,
        94.0
      ],
      "face": [
        58.0,
        18.0,
        74.0,
        37.0
      ],
      "mouth": {
        "x": 63.5,
        "y": 33.0
      },
      "description": "Beige sweater, glasses"
    }
  },
  "hsk1-l5-t2": {
    "王一雪": {
      "character": "王一雪",
      "portrait": [
        16.0,
        23.0,
        46.0,
        98.0
      ],
      "face": [
        25.0,
        28.0,
        36.0,
        44.0
      ],
      "mouth": {
        "x": 33.0,
        "y": 40.5
      },
      "description": "Sitting left"
    },
    "杨同乐": {
      "character": "杨同乐",
      "portrait": [
        52.0,
        18.0,
        90.0,
        98.0
      ],
      "face": [
        65.0,
        25.0,
        77.0,
        42.0
      ],
      "mouth": {
        "x": 69.0,
        "y": 37.5
      },
      "description": "Sitting right"
    }
  },
  "hsk1-l5-t3": {
    "王一雪": {
      "character": "王一雪",
      "portrait": [
        12.0,
        21.0,
        42.0,
        98.0
      ],
      "face": [
        25.0,
        26.0,
        36.0,
        42.0
      ],
      "mouth": {
        "x": 33.0,
        "y": 38.0
      },
      "description": "Pink cardigan, pointing at laptop"
    },
    "杨同乐": {
      "character": "杨同乐",
      "portrait": [
        54.0,
        14.0,
        94.0,
        98.0
      ],
      "face": [
        64.0,
        20.0,
        79.0,
        37.0
      ],
      "mouth": {
        "x": 69.5,
        "y": 33.5
      },
      "description": "Leaving with briefcase & backpack"
    }
  },
  "hsk1-l6-t1": {
    "李文": {
      "character": "李文",
      "portrait": [
        9.0,
        10.0,
        48.0,
        98.0
      ],
      "face": [
        27.0,
        14.0,
        41.0,
        33.0
      ],
      "mouth": {
        "x": 35.5,
        "y": 29.5
      },
      "description": "Holding phone showing QR code"
    },
    "白家月": {
      "character": "白家月",
      "portrait": [
        57.0,
        30.0,
        90.0,
        98.0
      ],
      "face": [
        73.0,
        32.0,
        83.0,
        46.0
      ],
      "mouth": {
        "x": 76.5,
        "y": 43.5
      },
      "description": "Sitting on stone bench with phone"
    }
  },
  "hsk1-l6-t2": {
    "白家月": {
      "character": "白家月",
      "portrait": [
        11.0,
        31.0,
        48.0,
        98.0
      ],
      "face": [
        24.0,
        34.0,
        38.0,
        54.0
      ],
      "mouth": {
        "x": 34.0,
        "y": 50.0
      },
      "description": "Burgundy sweater, writing at desk"
    },
    "陈天中": {
      "character": "陈天中",
      "portrait": [
        49.0,
        10.0,
        93.0,
        98.0
      ],
      "face": [
        56.0,
        13.0,
        73.0,
        37.0
      ],
      "mouth": {
        "x": 63.0,
        "y": 33.5
      },
      "description": "Standing leaning on desk"
    }
  },
  "hsk1-l6-t3": {
    "刘小明": {
      "character": "刘小明",
      "portrait": [
        12.0,
        42.0,
        34.0,
        98.0
      ],
      "face": [
        17.0,
        45.0,
        28.0,
        60.0
      ],
      "mouth": {
        "x": 26.0,
        "y": 57.0
      },
      "description": "Little boy on stool"
    },
    "刘明": {
      "character": "刘明",
      "portrait": [
        25.0,
        22.0,
        51.0,
        92.0
      ],
      "face": [
        31.0,
        24.0,
        43.0,
        42.0
      ],
      "mouth": {
        "x": 39.5,
        "y": 38.5
      },
      "description": "Father on sofa"
    },
    "王一雪": {
      "character": "王一雪",
      "portrait": [
        51.0,
        25.0,
        72.0,
        92.0
      ],
      "face": [
        55.0,
        28.0,
        66.0,
        44.0
      ],
      "mouth": {
        "x": 59.5,
        "y": 40.5
      },
      "description": "Mother on sofa"
    },
    "刘小雪": {
      "character": "刘小雪",
      "portrait": [
        67.0,
        37.0,
        96.0,
        98.0
      ],
      "face": [
        74.0,
        40.0,
        87.0,
        56.0
      ],
      "mouth": {
        "x": 78.0,
        "y": 53.5
      },
      "description": "Daughter on floor cushion"
    }
  },
  "hsk1-l7-t1": {
    "白家月": {
      "character": "白家月",
      "portrait": [
        26.0,
        13.0,
        44.0,
        86.0
      ],
      "face": [
        16.0,
        22.0,
        35.0,
        47.0
      ],
      "mouth": {
        "x": 27.5,
        "y": 41.0
      },
      "description": "Left pane, on phone at desk"
    },
    "安妮": {
      "character": "安妮",
      "portrait": [
        57.0,
        14.0,
        96.0,
        86.0
      ],
      "face": [
        64.0,
        24.0,
        81.0,
        47.0
      ],
      "mouth": {
        "x": 73.5,
        "y": 41.5
      },
      "description": "Right pane, on phone by clock"
    }
  },
  "hsk1-l7-t2": {
    "李文": {
      "character": "李文",
      "portrait": [
        6.0,
        12.0,
        50.0,
        98.0
      ],
      "face": [
        15.0,
        16.0,
        35.0,
        43.0
      ],
      "mouth": {
        "x": 28.5,
        "y": 38.5
      },
      "description": "Holding movie tickets"
    },
    "白家月": {
      "character": "白家月",
      "portrait": [
        53.0,
        21.0,
        94.0,
        98.0
      ],
      "face": [
        66.0,
        26.0,
        82.0,
        49.0
      ],
      "mouth": {
        "x": 73.0,
        "y": 44.5
      },
      "description": "Gesturing with open palms"
    }
  },
  "hsk1-l7-t3": {
    "王一雪": {
      "character": "王一雪",
      "portrait": [
        6.0,
        12.0,
        49.0,
        98.0
      ],
      "face": [
        16.0,
        18.0,
        33.0,
        41.0
      ],
      "mouth": {
        "x": 27.5,
        "y": 36.5
      },
      "description": "Left pane, office sunset"
    },
    "刘明": {
      "character": "刘明",
      "portrait": [
        52.0,
        12.0,
        97.0,
        98.0
      ],
      "face": [
        67.0,
        18.0,
        85.0,
        42.0
      ],
      "mouth": {
        "x": 75.0,
        "y": 37.0
      },
      "description": "Right pane, home sofa"
    }
  },
  "hsk1-l8-t1": {
    "白家月": {
      "character": "白家月",
      "portrait": [
        15.0,
        29.0,
        45.0,
        92.0
      ],
      "face": [
        29.0,
        30.0,
        41.0,
        50.0
      ],
      "mouth": {
        "x": 36.0,
        "y": 46.5
      },
      "description": "Kneeling pointing at cat"
    },
    "王一飞": {
      "character": "王一飞",
      "portrait": [
        50.0,
        18.0,
        67.0,
        60.0
      ],
      "face": [
        52.0,
        19.0,
        63.0,
        34.0
      ],
      "mouth": {
        "x": 57.5,
        "y": 31.5
      },
      "description": "Teacher sitting center with teacup"
    },
    "陈天中": {
      "character": "陈天中",
      "portrait": [
        64.0,
        28.0,
        86.0,
        88.0
      ],
      "face": [
        65.0,
        29.0,
        76.0,
        46.0
      ],
      "mouth": {
        "x": 70.0,
        "y": 42.5
      },
      "description": "Kneeling right, black polo"
    }
  },
  "hsk1-l8-t2": {
    "白家月": {
      "character": "白家月",
      "portrait": [
        10.0,
        21.0,
        41.0,
        83.0
      ],
      "face": [
        20.0,
        24.0,
        35.0,
        48.0
      ],
      "mouth": {
        "x": 29.5,
        "y": 44.5
      },
      "description": "Left pane, studying at desk"
    },
    "李文": {
      "character": "李文",
      "portrait": [
        54.0,
        17.0,
        96.0,
        82.0
      ],
      "face": [
        66.0,
        21.0,
        84.0,
        48.0
      ],
      "mouth": {
        "x": 74.5,
        "y": 43.5
      },
      "description": "Right pane, cafeteria lunch tray"
    }
  },
  "hsk1-l8-t3": {
    "刘明": {
      "character": "刘明",
      "portrait": [
        14.0,
        10.0,
        51.0,
        98.0
      ],
      "face": [
        27.0,
        14.0,
        43.0,
        37.0
      ],
      "mouth": {
        "x": 38.5,
        "y": 32.5
      },
      "description": "Dr. Liu with chart"
    },
    "小胡": {
      "character": "小胡",
      "portrait": [
        52.0,
        13.0,
        89.0,
        98.0
      ],
      "face": [
        60.0,
        15.0,
        75.0,
        38.0
      ],
      "mouth": {
        "x": 65.5,
        "y": 33.5
      },
      "description": "Dr. Xiao Hu with sandwich"
    }
  },
  "hsk1-l9-t1": {
    "李文": {
      "character": "李文",
      "portrait": [
        6.0,
        12.0,
        49.0,
        98.0
      ],
      "face": [
        15.0,
        16.0,
        35.0,
        42.0
      ],
      "mouth": {
        "x": 28.5,
        "y": 38.0
      },
      "description": "Pointing with left hand"
    },
    "白家月": {
      "character": "白家月",
      "portrait": [
        61.0,
        21.0,
        94.0,
        98.0
      ],
      "face": [
        66.0,
        26.0,
        82.0,
        49.0
      ],
      "mouth": {
        "x": 73.0,
        "y": 44.0
      },
      "description": "Holding book"
    }
  },
  "hsk1-l9-t2": {
    "白家月": {
      "character": "白家月",
      "portrait": [
        16.0,
        29.0,
        52.0,
        98.0
      ],
      "face": [
        25.0,
        33.0,
        39.0,
        51.0
      ],
      "mouth": {
        "x": 36.5,
        "y": 44.5
      },
      "description": "Sitting holding green book"
    },
    "陈天中": {
      "character": "陈天中",
      "portrait": [
        48.0,
        10.0,
        88.0,
        98.0
      ],
      "face": [
        54.0,
        14.0,
        69.0,
        36.0
      ],
      "mouth": {
        "x": 60.5,
        "y": 28.0
      },
      "description": "Standing pointing at book"
    }
  },
  "hsk1-l9-t3": {
    "王一雪": {
      "character": "王一雪",
      "portrait": [
        11.0,
        23.0,
        46.0,
        98.0
      ],
      "face": [
        21.0,
        26.0,
        38.0,
        49.0
      ],
      "mouth": {
        "x": 33.0,
        "y": 44.5
      },
      "description": "Holding teacup, beige suit"
    },
    "杨同乐": {
      "character": "杨同乐",
      "portrait": [
        54.0,
        18.0,
        96.0,
        98.0
      ],
      "face": [
        61.0,
        24.0,
        78.0,
        46.0
      ],
      "mouth": {
        "x": 66.5,
        "y": 42.0
      },
      "description": "Holding glass of water, blue shirt"
    }
  },
  "hsk1-l10-t1": {
    "王一雪": {
      "character": "王一雪",
      "portrait": [
        17.0,
        16.0,
        49.0,
        98.0
      ],
      "face": [
        27.0,
        22.0,
        40.0,
        40.0
      ],
      "mouth": {
        "x": 34.5,
        "y": 35.5
      },
      "description": "Customer holding grey mug"
    },
    "店员": {
      "character": "店员",
      "portrait": [
        58.0,
        17.0,
        92.0,
        98.0
      ],
      "face": [
        71.0,
        22.0,
        86.0,
        40.0
      ],
      "mouth": {
        "x": 76.5,
        "y": 35.5
      },
      "description": "Shop clerk in apron"
    }
  },
  "hsk1-l10-t2": {
    "王一雪": {
      "character": "王一雪",
      "portrait": [
        16.0,
        15.0,
        51.0,
        98.0
      ],
      "face": [
        26.0,
        21.0,
        38.0,
        37.0
      ],
      "mouth": {
        "x": 33.5,
        "y": 31.5
      },
      "description": "Customer reaching for fruit"
    },
    "摊主": {
      "character": "摊主",
      "portrait": [
        58.0,
        16.0,
        95.0,
        98.0
      ],
      "face": [
        72.0,
        20.0,
        84.0,
        35.0
      ],
      "mouth": {
        "x": 75.5,
        "y": 31.5
      },
      "description": "Fruit vendor with scale"
    }
  },
  "hsk1-l10-t3": {
    "王一雪": {
      "character": "王一雪",
      "portrait": [
        15.0,
        22.0,
        52.0,
        98.0
      ],
      "face": [
        32.0,
        27.0,
        47.0,
        45.0
      ],
      "mouth": {
        "x": 41.5,
        "y": 40.5
      },
      "description": "Looking at dress hanger"
    },
    "刘明": {
      "character": "刘明",
      "portrait": [
        46.0,
        13.0,
        89.0,
        98.0
      ],
      "face": [
        60.0,
        19.0,
        76.0,
        39.0
      ],
      "mouth": {
        "x": 65.5,
        "y": 33.5
      },
      "description": "Pointing at clothes"
    }
  },
  "hsk1-l11-t1": {
    "王一飞": {
      "character": "王一飞",
      "portrait": [
        7.0,
        10.0,
        44.0,
        98.0
      ],
      "face": [
        15.0,
        17.0,
        34.0,
        37.0
      ],
      "mouth": {
        "x": 24.0,
        "y": 32.0
      },
      "description": "Left pane, street in winter coat"
    },
    "李文": {
      "character": "李文",
      "portrait": [
        51.0,
        10.0,
        96.0,
        98.0
      ],
      "face": [
        67.0,
        18.0,
        84.0,
        38.0
      ],
      "mouth": {
        "x": 74.5,
        "y": 33.5
      },
      "description": "Right pane, on bus with phone"
    }
  },
  "hsk1-l11-t2": {
    "王一飞": {
      "character": "王一飞",
      "portrait": [
        9.0,
        18.0,
        47.0,
        98.0
      ],
      "face": [
        19.0,
        24.0,
        37.0,
        43.0
      ],
      "mouth": {
        "x": 33.5,
        "y": 38.5
      },
      "description": "Coat and scarf, holding water"
    },
    "李文": {
      "character": "李文",
      "portrait": [
        55.0,
        16.0,
        94.0,
        98.0
      ],
      "face": [
        66.0,
        23.0,
        82.0,
        42.0
      ],
      "mouth": {
        "x": 71.0,
        "y": 37.5
      },
      "description": "Jacket and headphones, gesturing"
    }
  },
  "hsk1-l11-t3": {
    "刘明": {
      "character": "刘明",
      "portrait": [
        9.0,
        27.0,
        57.0,
        98.0
      ],
      "face": [
        22.0,
        12.0,
        44.0,
        40.0
      ],
      "mouth": {
        "x": 38.5,
        "y": 34.0
      },
      "description": "Father seated with briefcase"
    },
    "刘小雪": {
      "character": "刘小雪",
      "portrait": [
        57.0,
        22.0,
        96.0,
        98.0
      ],
      "face": [
        67.0,
        27.0,
        87.0,
        52.0
      ],
      "mouth": {
        "x": 72.5,
        "y": 46.5
      },
      "description": "Daughter offering water cup"
    }
  },
  "hsk1-l12-t1": {
    "王一雪": {
      "character": "王一雪",
      "portrait": [
        4.0,
        14.0,
        49.0,
        98.0
      ],
      "face": [
        21.0,
        18.0,
        38.0,
        42.0
      ],
      "mouth": {
        "x": 29.5,
        "y": 37.5
      },
      "description": "Left pane, couch at home"
    },
    "王一飞": {
      "character": "王一飞",
      "portrait": [
        55.0,
        14.0,
        96.0,
        98.0
      ],
      "face": [
        64.0,
        22.0,
        81.0,
        40.0
      ],
      "mouth": {
        "x": 72.5,
        "y": 36.5
      },
      "description": "Right pane, in rain under umbrella"
    }
  },
  "hsk1-l12-t2": {
    "王一雪": {
      "character": "王一雪",
      "portrait": [
        9.0,
        19.0,
        44.0,
        98.0
      ],
      "face": [
        21.0,
        24.0,
        37.0,
        43.0
      ],
      "mouth": {
        "x": 32.5,
        "y": 39.5
      },
      "description": "Tan coat, wool scarf"
    },
    "杨同乐": {
      "character": "杨同乐",
      "portrait": [
        56.0,
        14.0,
        94.0,
        98.0
      ],
      "face": [
        64.0,
        21.0,
        80.0,
        40.0
      ],
      "mouth": {
        "x": 69.5,
        "y": 35.5
      },
      "description": "Down parka, fur hood"
    }
  },
  "hsk1-l12-t3": {
    "杨同乐": {
      "character": "杨同乐",
      "portrait": [
        6.0,
        11.0,
        50.0,
        98.0
      ],
      "face": [
        20.0,
        19.0,
        37.0,
        39.0
      ],
      "mouth": {
        "x": 31.0,
        "y": 34.5
      },
      "description": "Patient shivering in parka"
    },
    "医生": {
      "character": "医生",
      "portrait": [
        57.0,
        13.0,
        96.0,
        98.0
      ],
      "face": [
        67.0,
        20.0,
        84.0,
        39.0
      ],
      "mouth": {
        "x": 72.5,
        "y": 35.5
      },
      "description": "Doctor writing prescription"
    }
  },
  "hsk1-l13-t1": {
    "白家月": {
      "character": "白家月",
      "portrait": [
        11.0,
        10.0,
        47.0,
        98.0
      ],
      "face": [
        24.0,
        12.0,
        40.0,
        36.0
      ],
      "mouth": {
        "x": 34.5,
        "y": 31.0
      },
      "description": "Standing with notepad"
    },
    "王一飞": {
      "character": "王一飞",
      "portrait": [
        56.0,
        8.0,
        92.0,
        98.0
      ],
      "face": [
        66.0,
        12.0,
        84.0,
        35.0
      ],
      "mouth": {
        "x": 72.5,
        "y": 30.5
      },
      "description": "Teacher at desk writing"
    }
  },
  "hsk1-l13-t2": {
    "王一雪": {
      "character": "王一雪",
      "portrait": [
        8.0,
        25.0,
        48.0,
        98.0
      ],
      "face": [
        18.0,
        29.0,
        34.0,
        48.0
      ],
      "mouth": {
        "x": 28.5,
        "y": 43.5
      },
      "description": "Seated left with menu"
    },
    "服务员": {
      "character": "服务员",
      "portrait": [
        61.0,
        11.0,
        92.0,
        98.0
      ],
      "face": [
        63.0,
        14.0,
        78.0,
        36.0
      ],
      "mouth": {
        "x": 70.0,
        "y": 32.5
      },
      "description": "Waiter writing order"
    }
  },
  "hsk1-l13-t3": {
    "刘明": {
      "character": "刘明",
      "portrait": [
        9.0,
        8.0,
        58.0,
        92.0
      ],
      "face": [
        24.0,
        13.0,
        44.0,
        41.0
      ],
      "mouth": {
        "x": 38.0,
        "y": 35.5
      },
      "description": "Pointing at menu"
    },
    "服务员": {
      "character": "服务员",
      "portrait": [
        58.0,
        11.0,
        94.0,
        84.0
      ],
      "face": [
        60.0,
        14.0,
        77.0,
        32.0
      ],
      "mouth": {
        "x": 67.5,
        "y": 27.5
      },
      "description": "Waiter taking order, pencil behind ear"
    }
  },
  "hsk1-l14-t1": {
    "白家月": {
      "character": "白家月",
      "portrait": [
        9.0,
        10.0,
        44.0,
        98.0
      ],
      "face": [
        24.0,
        12.0,
        39.0,
        35.0
      ],
      "mouth": {
        "x": 34.5,
        "y": 30.5
      },
      "description": "Standing left with notebook"
    },
    "陈天中": {
      "character": "陈天中",
      "portrait": [
        53.0,
        9.0,
        98.0,
        98.0
      ],
      "face": [
        64.0,
        13.0,
        83.0,
        36.0
      ],
      "mouth": {
        "x": 71.0,
        "y": 31.0
      },
      "description": "Seated right, varsity jacket"
    }
  },
  "hsk1-l14-t2": {
    "陈天中": {
      "character": "陈天中",
      "portrait": [
        19.0,
        23.0,
        52.0,
        98.0
      ],
      "face": [
        29.0,
        30.0,
        41.0,
        48.0
      ],
      "mouth": {
        "x": 39.0,
        "y": 43.5
      },
      "description": "Foreground left, hand to ear"
    },
    "白家月": {
      "character": "白家月",
      "portrait": [
        42.0,
        30.0,
        55.0,
        62.0
      ],
      "face": [
        47.0,
        33.0,
        52.0,
        42.0
      ],
      "mouth": {
        "x": 50.5,
        "y": 39.5
      },
      "description": "Seated behind him in hoodie"
    },
    "王一飞": {
      "character": "王一飞",
      "portrait": [
        55.0,
        17.0,
        65.0,
        34.0
      ],
      "face": [
        58.0,
        18.0,
        62.0,
        24.0
      ],
      "mouth": {
        "x": 60.5,
        "y": 23.0
      },
      "description": "Teacher at board in distance"
    }
  },
  "hsk1-l14-t3": {
    "刘明": {
      "character": "刘明",
      "portrait": [
        18.0,
        15.0,
        51.0,
        98.0
      ],
      "face": [
        25.0,
        23.0,
        38.0,
        44.0
      ],
      "mouth": {
        "x": 34.0,
        "y": 39.5
      },
      "description": "Seated left on couch, gesturing"
    },
    "王一雪": {
      "character": "王一雪",
      "portrait": [
        47.0,
        18.0,
        70.0,
        88.0
      ],
      "face": [
        51.0,
        25.0,
        63.0,
        46.0
      ],
      "mouth": {
        "x": 55.5,
        "y": 41.5
      },
      "description": "Seated right on couch, concerned"
    }
  },
  "hsk1-l15-t1": {
    "白家月": {
      "character": "白家月",
      "portrait": [
        5.0,
        35.0,
        32.0,
        98.0
      ],
      "face": [
        15.0,
        38.0,
        26.0,
        58.0
      ],
      "mouth": {
        "x": 21.5,
        "y": 57.0
      },
      "description": "Seated left with bowl"
    },
    "李文": {
      "character": "李文",
      "portrait": [
        22.0,
        5.0,
        49.0,
        78.0
      ],
      "face": [
        30.0,
        6.0,
        42.0,
        28.0
      ],
      "mouth": {
        "x": 37.0,
        "y": 25.5
      },
      "description": "Standing serving dumplings"
    },
    "安妮": {
      "character": "安妮",
      "portrait": [
        67.0,
        36.0,
        79.0,
        74.0
      ],
      "face": [
        68.0,
        38.0,
        77.0,
        56.0
      ],
      "mouth": {
        "x": 72.0,
        "y": 54.0
      },
      "description": "Seated right leaning on hand"
    },
    "陈天中": {
      "character": "陈天中",
      "portrait": [
        67.0,
        32.0,
        96.0,
        98.0
      ],
      "face": [
        74.0,
        33.0,
        87.0,
        57.0
      ],
      "mouth": {
        "x": 78.0,
        "y": 54.5
      },
      "description": "Seated far-right with bowl"
    }
  },
  "hsk1-l15-t2": {
    "白家月": {
      "character": "白家月",
      "portrait": [
        5.0,
        35.0,
        32.0,
        98.0
      ],
      "face": [
        15.0,
        38.0,
        26.0,
        58.0
      ],
      "mouth": {
        "x": 22.0,
        "y": 56.5
      },
      "description": "Seated left with tea cup"
    },
    "李文": {
      "character": "李文",
      "portrait": [
        34.0,
        26.0,
        61.0,
        76.0
      ],
      "face": [
        43.0,
        27.0,
        55.0,
        48.0
      ],
      "mouth": {
        "x": 51.5,
        "y": 45.5
      },
      "description": "Seated center, green shirt, gesturing"
    },
    "安妮": {
      "character": "安妮",
      "portrait": [
        60.0,
        36.0,
        80.0,
        82.0
      ],
      "face": [
        66.0,
        37.0,
        78.0,
        56.0
      ],
      "mouth": {
        "x": 70.5,
        "y": 53.5
      },
      "description": "Seated right in pink hoodie"
    },
    "陈天中": {
      "character": "陈天中",
      "portrait": [
        68.0,
        33.0,
        96.0,
        98.0
      ],
      "face": [
        75.0,
        33.0,
        88.0,
        57.0
      ],
      "mouth": {
        "x": 78.5,
        "y": 54.0
      },
      "description": "Seated far-right with teacup"
    }
  },
  "hsk1-l15-t3": {
    "白家月": {
      "character": "白家月",
      "portrait": [
        8.0,
        14.0,
        35.0,
        98.0
      ],
      "face": [
        18.0,
        17.0,
        31.0,
        42.0
      ],
      "mouth": {
        "x": 27.5,
        "y": 38.5
      },
      "description": "Seated left with tablet"
    },
    "王一飞": {
      "character": "王一飞",
      "portrait": [
        30.0,
        7.0,
        69.0,
        78.0
      ],
      "face": [
        41.0,
        7.0,
        58.0,
        38.0
      ],
      "mouth": {
        "x": 52.5,
        "y": 33.5
      },
      "description": "Teacher center, olive sweater"
    },
    "安妮": {
      "character": "安妮",
      "portrait": [
        60.0,
        13.0,
        93.0,
        98.0
      ],
      "face": [
        68.0,
        17.0,
        83.0,
        42.0
      ],
      "mouth": {
        "x": 73.5,
        "y": 39.0
      },
      "description": "Seated right with flight tickets"
    }
  }
};
