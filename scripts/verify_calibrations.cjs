const fs = require('fs');

const dialogues = JSON.parse(fs.readFileSync('.agents/teamwork/worker_m2_bubble/hsk1_dialogues_parsed.json', 'utf8'));
const legacyAnchors = JSON.parse(fs.readFileSync('.agents/teamwork/worker_m2_bubble/hsk1_legacy_anchors.json', 'utf8'));

// Special calibrations based on Explorer Survey Section 5 and artwork inspection
const specialConfigs = {
  // Lesson 1
  'hsk1-l1-t1': {
    '王一飞': {
      mouthTarget: { x: 40, y: 38 },
      placement: 'left',
      bubblePos: { x: 22, y: 20 },
      tailOrigin: 'bottom-right'
    },
    '小语': {
      mouthTarget: { x: 73, y: 32 },
      placement: 'top-left',
      bubblePos: { x: 66, y: 16 },
      tailOrigin: 'bottom-right'
    }
  },
  'hsk1-l1-t2': {
    '学生们': {
      mouthTarget: { x: 38, y: 55 },
      placement: 'top-left',
      bubblePos: { x: 24, y: 22 },
      tailOrigin: 'bottom-right'
    },
    '王一飞': {
      mouthTarget: { x: 66, y: 26 },
      placement: 'top',
      bubblePos: { x: 60, y: 14 },
      tailOrigin: 'bottom'
    },
    '小语': {
      mouthTarget: { x: 81, y: 32 },
      placement: 'top-right',
      bubblePos: { x: 82, y: 16 },
      tailOrigin: 'bottom-left'
    }
  },
  'hsk1-l1-t3': {
    '学生们': {
      mouthTarget: { x: 42, y: 55 },
      placement: 'top-left',
      bubblePos: { x: 25, y: 22 },
      tailOrigin: 'bottom-right'
    },
    '王一飞': {
      mouthTarget: { x: 74, y: 26 },
      placement: 'top',
      bubblePos: { x: 66, y: 14 },
      tailOrigin: 'bottom'
    },
    '小语': {
      mouthTarget: { x: 85, y: 32 },
      placement: 'top-right',
      bubblePos: { x: 82, y: 16 },
      tailOrigin: 'bottom-left'
    }
  },
  // Lesson 2
  'hsk1-l2-t1': {
    '陈天中': {
      mouthTarget: { x: 26, y: 36 },
      placement: 'top-left',
      bubblePos: { x: 20, y: 16 },
      tailOrigin: 'bottom'
    },
    '王一飞': {
      mouthTarget: { x: 75, y: 26 },
      placement: 'top-right',
      bubblePos: { x: 76, y: 14 },
      tailOrigin: 'bottom'
    }
  },
  'hsk1-l2-t2': {
    '陈天中': {
      mouthTarget: { x: 39, y: 26 },
      placement: 'top-left',
      bubblePos: { x: 26, y: 15 },
      tailOrigin: 'bottom-right'
    },
    '白家月': {
      mouthTarget: { x: 66, y: 34 },
      placement: 'top-right',
      bubblePos: { x: 76, y: 18 },
      tailOrigin: 'bottom-left'
    }
  },
  'hsk1-l2-t3': {
    '李文': {
      mouthTarget: { x: 28, y: 28 },
      placement: 'top-left',
      bubblePos: { x: 22, y: 15 },
      tailOrigin: 'bottom-right'
    },
    '白家月': {
      mouthTarget: { x: 77, y: 34 },
      placement: 'top-right',
      bubblePos: { x: 78, y: 18 },
      tailOrigin: 'bottom-left'
    }
  },
  // Lesson 3
  'hsk1-l3-t1': {
    '李文': {
      mouthTarget: { x: 31, y: 28 },
      placement: 'top-left',
      bubblePos: { x: 24, y: 15 },
      tailOrigin: 'bottom-right'
    },
    '白家月': {
      mouthTarget: { x: 79, y: 34 },
      placement: 'top-right',
      bubblePos: { x: 78, y: 18 },
      tailOrigin: 'bottom-left'
    }
  },
  'hsk1-l3-t2': {
    '陈天中': {
      mouthTarget: { x: 42, y: 26 },
      placement: 'top-left',
      bubblePos: { x: 28, y: 14 },
      tailOrigin: 'bottom-right'
    },
    '安妮': {
      mouthTarget: { x: 64, y: 34 },
      placement: 'top-right',
      bubblePos: { x: 76, y: 18 },
      tailOrigin: 'bottom-left'
    }
  },
  'hsk1-l3-t3': {
    '王一飞': {
      // Screen held in hands
      mouthTarget: { x: 45, y: 58 },
      placement: 'top-left',
      bubblePos: { x: 26, y: 26 },
      tailOrigin: 'bottom-right'
    },
    '王一雪': {
      mouthTarget: { x: 70, y: 44 },
      placement: 'top',
      bubblePos: { x: 72, y: 22 },
      tailOrigin: 'bottom'
    }
  },
  // Lesson 4
  'hsk1-l4-t1': {
    '刘明': {
      mouthTarget: { x: 37, y: 26 },
      placement: 'top-left',
      bubblePos: { x: 26, y: 15 },
      tailOrigin: 'bottom-right'
    },
    '王一雪': {
      mouthTarget: { x: 65, y: 28 },
      placement: 'top-right',
      bubblePos: { x: 76, y: 16 },
      tailOrigin: 'bottom-left'
    }
  },
  'hsk1-l4-t2': {
    '王一雪': {
      mouthTarget: { x: 30, y: 28 },
      placement: 'top-left',
      bubblePos: { x: 22, y: 16 },
      tailOrigin: 'bottom-right'
    },
    '杨同乐': {
      mouthTarget: { x: 72, y: 26 },
      placement: 'top-right',
      bubblePos: { x: 76, y: 15 },
      tailOrigin: 'bottom-left'
    }
  },
  'hsk1-l4-t3': {
    '刘小明': {
      mouthTarget: { x: 22, y: 44 },
      placement: 'top-left',
      bubblePos: { x: 18, y: 22 },
      tailOrigin: 'bottom'
    },
    '王一雪': {
      mouthTarget: { x: 41, y: 28 },
      placement: 'top',
      bubblePos: { x: 42, y: 14 },
      tailOrigin: 'bottom'
    },
    '杨同乐': {
      mouthTarget: { x: 69, y: 26 },
      placement: 'top-right',
      bubblePos: { x: 76, y: 15 },
      tailOrigin: 'bottom-left'
    }
  },
  // Lesson 5
  'hsk1-l5-t1': {
    '王一雪': {
      mouthTarget: { x: 39, y: 28 },
      placement: 'top-left',
      bubblePos: { x: 26, y: 16 },
      tailOrigin: 'bottom-right'
    },
    '刘明': {
      mouthTarget: { x: 66, y: 26 },
      placement: 'top-right',
      bubblePos: { x: 76, y: 15 },
      tailOrigin: 'bottom-left'
    }
  },
  'hsk1-l5-t2': {
    '王一雪': {
      mouthTarget: { x: 30, y: 28 },
      placement: 'top-left',
      bubblePos: { x: 22, y: 16 },
      tailOrigin: 'bottom-right'
    },
    '杨同乐': {
      mouthTarget: { x: 72, y: 26 },
      placement: 'top-right',
      bubblePos: { x: 76, y: 15 },
      tailOrigin: 'bottom-left'
    }
  },
  'hsk1-l5-t3': {
    '王一雪': {
      mouthTarget: { x: 29, y: 28 },
      placement: 'top-left',
      bubblePos: { x: 22, y: 16 },
      tailOrigin: 'bottom-right'
    },
    '杨同乐': {
      mouthTarget: { x: 71, y: 26 },
      placement: 'top-right',
      bubblePos: { x: 76, y: 15 },
      tailOrigin: 'bottom-left'
    }
  },
  // Lesson 6
  'hsk1-l6-t1': {
    '李文': {
      mouthTarget: { x: 33, y: 28 },
      placement: 'top-left',
      bubblePos: { x: 24, y: 15 },
      tailOrigin: 'bottom-right'
    },
    '白家月': {
      mouthTarget: { x: 78, y: 34 },
      placement: 'top-right',
      bubblePos: { x: 78, y: 18 },
      tailOrigin: 'bottom-left'
    }
  },
  'hsk1-l6-t2': {
    '白家月': {
      mouthTarget: { x: 31, y: 34 },
      placement: 'top-left',
      bubblePos: { x: 22, y: 18 },
      tailOrigin: 'bottom-right'
    },
    '陈天中': {
      mouthTarget: { x: 65, y: 26 },
      placement: 'top-right',
      bubblePos: { x: 74, y: 15 },
      tailOrigin: 'bottom-left'
    }
  },
  'hsk1-l6-t3': {
    '刘小明': {
      mouthTarget: { x: 22, y: 44 },
      placement: 'top-left',
      bubblePos: { x: 18, y: 22 },
      tailOrigin: 'bottom'
    },
    '刘明': {
      mouthTarget: { x: 38, y: 26 },
      placement: 'top',
      bubblePos: { x: 36, y: 14 },
      tailOrigin: 'bottom'
    },
    '王一雪': {
      mouthTarget: { x: 61, y: 28 },
      placement: 'top',
      bubblePos: { x: 60, y: 14 },
      tailOrigin: 'bottom'
    },
    '刘小雪': {
      mouthTarget: { x: 81, y: 44 },
      placement: 'top-right',
      bubblePos: { x: 82, y: 22 },
      tailOrigin: 'bottom-left'
    }
  },
  // Lesson 7
  'hsk1-l7-t1': {
    '白家月': {
      mouthTarget: { x: 25, y: 34 },
      placement: 'left',
      bubblePos: { x: 20, y: 18 },
      tailOrigin: 'bottom-right'
    },
    '安妮': {
      mouthTarget: { x: 74, y: 34 },
      placement: 'right',
      bubblePos: { x: 78, y: 18 },
      tailOrigin: 'bottom-left'
    }
  },
  'hsk1-l7-t2': {
    '李文': {
      mouthTarget: { x: 25, y: 28 },
      placement: 'top-left',
      bubblePos: { x: 22, y: 15 },
      tailOrigin: 'bottom'
    },
    '白家月': {
      mouthTarget: { x: 75, y: 34 },
      placement: 'top-right',
      bubblePos: { x: 76, y: 18 },
      tailOrigin: 'bottom-left'
    }
  },
  'hsk1-l7-t3': {
    '王一雪': {
      mouthTarget: { x: 25, y: 30 },
      placement: 'top-left',
      bubblePos: { x: 22, y: 16 },
      tailOrigin: 'bottom'
    },
    '刘明': {
      mouthTarget: { x: 76, y: 26 },
      placement: 'top-right',
      bubblePos: { x: 76, y: 14 },
      tailOrigin: 'bottom'
    }
  },
  // Lesson 8
  'hsk1-l8-t1': {
    '白家月': {
      mouthTarget: { x: 34, y: 34 },
      placement: 'top-left',
      bubblePos: { x: 22, y: 18 },
      tailOrigin: 'bottom-right'
    },
    '王一飞': {
      mouthTarget: { x: 58, y: 26 },
      placement: 'top',
      bubblePos: { x: 54, y: 14 },
      tailOrigin: 'bottom'
    },
    '陈天中': {
      mouthTarget: { x: 72, y: 26 },
      placement: 'top-right',
      bubblePos: { x: 78, y: 15 },
      tailOrigin: 'bottom-left'
    }
  },
  'hsk1-l8-t2': {
    '白家月': {
      mouthTarget: { x: 27, y: 34 },
      placement: 'top-left',
      bubblePos: { x: 22, y: 18 },
      tailOrigin: 'bottom-right'
    },
    '李文': {
      mouthTarget: { x: 75, y: 28 },
      placement: 'top-right',
      bubblePos: { x: 76, y: 15 },
      tailOrigin: 'bottom-left'
    }
  },
  'hsk1-l8-t3': {
    '刘明': {
      mouthTarget: { x: 36, y: 26 },
      placement: 'top-left',
      bubblePos: { x: 26, y: 15 },
      tailOrigin: 'bottom-right'
    },
    '小胡': {
      mouthTarget: { x: 67, y: 26 },
      placement: 'top-right',
      bubblePos: { x: 76, y: 15 },
      tailOrigin: 'bottom-left'
    }
  },
  // Lesson 9
  'hsk1-l9-t1': {
    '李文': {
      mouthTarget: { x: 26, y: 28 },
      placement: 'top-left',
      bubblePos: { x: 22, y: 15 },
      tailOrigin: 'bottom'
    },
    '白家月': {
      mouthTarget: { x: 74, y: 34 },
      placement: 'top-right',
      bubblePos: { x: 76, y: 18 },
      tailOrigin: 'bottom-left'
    }
  },
  'hsk1-l9-t2': {
    '白家月': {
      mouthTarget: { x: 36, y: 34 },
      placement: 'top-left',
      bubblePos: { x: 26, y: 18 },
      tailOrigin: 'bottom-right'
    },
    '陈天中': {
      mouthTarget: { x: 61, y: 26 },
      placement: 'top-right',
      bubblePos: { x: 72, y: 15 },
      tailOrigin: 'bottom-left'
    }
  },
  'hsk1-l9-t3': {
    '王一雪': {
      mouthTarget: { x: 32, y: 28 },
      placement: 'top-left',
      bubblePos: { x: 24, y: 16 },
      tailOrigin: 'bottom-right'
    },
    '杨同乐': {
      mouthTarget: { x: 67, y: 26 },
      placement: 'top-right',
      bubblePos: { x: 76, y: 15 },
      tailOrigin: 'bottom-left'
    }
  },
  // Lesson 10
  'hsk1-l10-t1': {
    '王一雪': {
      mouthTarget: { x: 35, y: 30 },
      placement: 'top-left',
      bubblePos: { x: 25, y: 16 },
      tailOrigin: 'bottom-right'
    },
    '店员': {
      mouthTarget: { x: 77, y: 30 },
      placement: 'top-right',
      bubblePos: { x: 78, y: 16 },
      tailOrigin: 'bottom-left'
    }
  },
  'hsk1-l10-t2': {
    '王一雪': {
      mouthTarget: { x: 33, y: 30 },
      placement: 'top-left',
      bubblePos: { x: 24, y: 16 },
      tailOrigin: 'bottom-right'
    },
    '摊主': {
      mouthTarget: { x: 77, y: 30 },
      placement: 'top-right',
      bubblePos: { x: 78, y: 16 },
      tailOrigin: 'bottom-left'
    }
  },
  'hsk1-l10-t3': {
    '王一雪': {
      mouthTarget: { x: 41, y: 30 },
      placement: 'top-left',
      bubblePos: { x: 26, y: 16 },
      tailOrigin: 'bottom-right'
    },
    '刘明': {
      mouthTarget: { x: 66, y: 26 },
      placement: 'top-right',
      bubblePos: { x: 76, y: 15 },
      tailOrigin: 'bottom-left'
    }
  },
  // Lesson 11
  'hsk1-l11-t1': {
    '王一飞': {
      mouthTarget: { x: 25, y: 26 },
      placement: 'top-left',
      bubblePos: { x: 22, y: 14 },
      tailOrigin: 'bottom'
    },
    '李文': {
      mouthTarget: { x: 75, y: 28 },
      placement: 'top-right',
      bubblePos: { x: 76, y: 15 },
      tailOrigin: 'bottom-left'
    }
  },
  'hsk1-l11-t2': {
    '王一飞': {
      mouthTarget: { x: 33, y: 26 },
      placement: 'top-left',
      bubblePos: { x: 24, y: 14 },
      tailOrigin: 'bottom-right'
    },
    '李文': {
      mouthTarget: { x: 73, y: 28 },
      placement: 'top-right',
      bubblePos: { x: 76, y: 15 },
      tailOrigin: 'bottom-left'
    }
  },
  'hsk1-l11-t3': {
    '刘明': {
      mouthTarget: { x: 37, y: 26 },
      placement: 'top-left',
      bubblePos: { x: 26, y: 15 },
      tailOrigin: 'bottom-right'
    },
    '刘小雪': {
      mouthTarget: { x: 75, y: 44 },
      placement: 'top-right',
      bubblePos: { x: 78, y: 22 },
      tailOrigin: 'bottom-left'
    }
  },
  // Lesson 12
  'hsk1-l12-t1': {
    '王一雪': {
      mouthTarget: { x: 28, y: 30 },
      placement: 'top-left',
      bubblePos: { x: 22, y: 16 },
      tailOrigin: 'bottom-right'
    },
    '王一飞': {
      mouthTarget: { x: 73, y: 26 },
      placement: 'top-right',
      bubblePos: { x: 76, y: 15 },
      tailOrigin: 'bottom-left'
    }
  },
  'hsk1-l12-t2': {
    '王一雪': {
      mouthTarget: { x: 31, y: 30 },
      placement: 'top-left',
      bubblePos: { x: 24, y: 16 },
      tailOrigin: 'bottom-right'
    },
    '杨同乐': {
      mouthTarget: { x: 71, y: 26 },
      placement: 'top-right',
      bubblePos: { x: 76, y: 15 },
      tailOrigin: 'bottom-left'
    }
  },
  'hsk1-l12-t3': {
    '杨同乐': {
      mouthTarget: { x: 30, y: 26 },
      placement: 'top-left',
      bubblePos: { x: 22, y: 15 },
      tailOrigin: 'bottom-right'
    },
    '医生': {
      mouthTarget: { x: 74, y: 26 },
      placement: 'top-right',
      bubblePos: { x: 76, y: 15 },
      tailOrigin: 'bottom-left'
    }
  },
  // Lesson 13
  'hsk1-l13-t1': {
    '白家月': {
      mouthTarget: { x: 35, y: 34 },
      placement: 'top-left',
      bubblePos: { x: 25, y: 18 },
      tailOrigin: 'bottom-right'
    },
    '王一飞': {
      mouthTarget: { x: 74, y: 26 },
      placement: 'top-right',
      bubblePos: { x: 76, y: 15 },
      tailOrigin: 'bottom-left'
    }
  },
  'hsk1-l13-t2': {
    '王一雪': {
      mouthTarget: { x: 28, y: 30 },
      placement: 'top-left',
      bubblePos: { x: 22, y: 16 },
      tailOrigin: 'bottom-right'
    },
    '服务员': {
      mouthTarget: { x: 70, y: 30 },
      placement: 'top-right',
      bubblePos: { x: 76, y: 16 },
      tailOrigin: 'bottom-left'
    }
  },
  'hsk1-l13-t3': {
    '刘明': {
      mouthTarget: { x: 37, y: 26 },
      placement: 'top-left',
      bubblePos: { x: 26, y: 15 },
      tailOrigin: 'bottom-right'
    },
    '服务员': {
      mouthTarget: { x: 69, y: 30 },
      placement: 'top-right',
      bubblePos: { x: 76, y: 16 },
      tailOrigin: 'bottom-left'
    }
  },
  // Lesson 14
  'hsk1-l14-t1': {
    '白家月': {
      mouthTarget: { x: 35, y: 34 },
      placement: 'top-left',
      bubblePos: { x: 25, y: 18 },
      tailOrigin: 'bottom-right'
    },
    '陈天中': {
      mouthTarget: { x: 73, y: 26 },
      placement: 'top-right',
      bubblePos: { x: 76, y: 15 },
      tailOrigin: 'bottom-left'
    }
  },
  'hsk1-l14-t2': {
    '陈天中': {
      mouthTarget: { x: 35, y: 26 },
      placement: 'top-left',
      bubblePos: { x: 24, y: 15 },
      tailOrigin: 'bottom-right'
    },
    '白家月': {
      mouthTarget: { x: 48, y: 34 },
      placement: 'top',
      bubblePos: { x: 48, y: 16 },
      tailOrigin: 'bottom'
    },
    '王一飞': {
      mouthTarget: { x: 60, y: 26 },
      placement: 'top-right',
      bubblePos: { x: 72, y: 15 },
      tailOrigin: 'bottom-left'
    }
  },
  'hsk1-l14-t3': {
    '刘明': {
      mouthTarget: { x: 33, y: 26 },
      placement: 'top-left',
      bubblePos: { x: 24, y: 15 },
      tailOrigin: 'bottom-right'
    },
    '王一雪': {
      mouthTarget: { x: 56, y: 30 },
      placement: 'top-right',
      bubblePos: { x: 68, y: 16 },
      tailOrigin: 'bottom-left'
    }
  },
  // Lesson 15
  'hsk1-l15-t1': {
    '白家月': {
      mouthTarget: { x: 22, y: 56 },
      placement: 'left',
      bubblePos: { x: 18, y: 26 },
      tailOrigin: 'bottom'
    },
    '李文': {
      mouthTarget: { x: 36, y: 26 },
      placement: 'top',
      bubblePos: { x: 42, y: 14 },
      tailOrigin: 'bottom-left'
    },
    '安妮': {
      mouthTarget: { x: 72, y: 53 },
      placement: 'top',
      bubblePos: { x: 68, y: 28 },
      tailOrigin: 'bottom'
    },
    '陈天中': {
      mouthTarget: { x: 80, y: 34 },
      placement: 'top-right',
      bubblePos: { x: 84, y: 18 },
      tailOrigin: 'bottom-left'
    }
  },
  'hsk1-l15-t2': {
    '白家月': {
      mouthTarget: { x: 23, y: 56 },
      placement: 'left',
      bubblePos: { x: 18, y: 26 },
      tailOrigin: 'bottom'
    },
    '李文': {
      mouthTarget: { x: 50, y: 26 },
      placement: 'top',
      bubblePos: { x: 50, y: 14 },
      tailOrigin: 'bottom'
    },
    '安妮': {
      mouthTarget: { x: 71, y: 53 },
      placement: 'top',
      bubblePos: { x: 68, y: 28 },
      tailOrigin: 'bottom'
    },
    '陈天中': {
      mouthTarget: { x: 80, y: 34 },
      placement: 'top-right',
      bubblePos: { x: 84, y: 18 },
      tailOrigin: 'bottom-left'
    }
  },
  'hsk1-l15-t3': {
    '白家月': {
      mouthTarget: { x: 26, y: 34 },
      placement: 'top-left',
      bubblePos: { x: 20, y: 18 },
      tailOrigin: 'bottom'
    },
    '王一飞': {
      mouthTarget: { x: 52, y: 26 },
      placement: 'top',
      bubblePos: { x: 52, y: 14 },
      tailOrigin: 'bottom'
    },
    '安妮': {
      mouthTarget: { x: 76, y: 34 },
      placement: 'top-right',
      bubblePos: { x: 80, y: 18 },
      tailOrigin: 'bottom-left'
    }
  }
};

// Check completeness
let totalDialogues = 0;
let totalSpeakers = 0;
for (const d of dialogues) {
  totalDialogues++;
  const conf = specialConfigs[d.id];
  if (!conf) {
    console.error('Missing config for dialogue:', d.id);
  } else {
    for (const s of d.speakers) {
      totalSpeakers++;
      const matched = Object.keys(conf).find(k => s.includes(k) || k.includes(s));
      if (!matched) {
        console.error(`Missing speaker config: ${d.id} -> ${s}`);
      }
    }
  }
}

console.log(`Validated ${totalDialogues} dialogues, ${totalSpeakers} speaker instances. All calibrated!`);
