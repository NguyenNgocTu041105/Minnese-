import { UserStats, UserProfile, LearnerPersona, StreakMode } from '../types';

export interface PersonaConfig {
  id: LearnerPersona;
  title: string;
  icon: string;
  badgeLabel: string;
  subtitle: string;
  description: string;
  defaultWordsPerDay: number;
  defaultMinutesPerDay: number;
  defaultStreakMode: StreakMode;
  defaultFreezes: number;
  focusDomains: string[];
  tips: string;
}

export const LEARNER_PERSONAS: Record<LearnerPersona, PersonaConfig> = {
  working_professional: {
    id: 'working_professional',
    title: 'Người đi làm bận rộn',
    icon: '💼',
    badgeLabel: 'Dân văn phòng',
    subtitle: 'Học 10-15 phút sau giờ làm, trau dồi phản xạ công sở',
    description: 'Tối ưu cho người có quỹ thời gian hạn hẹp, cần tiếng Trung thực chiến để giao tiếp văn phòng, đàm phán thương mại và gửi email.',
    defaultWordsPerDay: 10,
    defaultMinutesPerDay: 15,
    defaultStreakMode: 'daily_7',
    defaultFreezes: 2,
    focusDomains: [
      'Giao tiếp công sở & viết email',
      'Đàm phán thương mại & hợp đồng',
      'Xuất nhập khẩu & thanh toán ngân hàng',
    ],
    tips: 'Mỗi ngày chỉ cần 10-15 phút ôn tập để tích lũy vốn từ vững vàng trong công việc.',
  },
  exam_sprinter: {
    id: 'exam_sprinter',
    title: 'Luyện thi HSK cấp tốc',
    icon: '🚀',
    badgeLabel: 'Luyện thi HSK',
    subtitle: 'Kỷ luật cao, bám sát cấu trúc đề và từ vựng phân cấp',
    description: 'Dành cho học viên chuẩn bị thi chứng chỉ HSK 1 - 6 hoặc HSKK trong vòng 1-3 tháng tới, cần mục tiêu từ vựng cao và rèn luyện đề.',
    defaultWordsPerDay: 25,
    defaultMinutesPerDay: 45,
    defaultStreakMode: 'daily_7',
    defaultFreezes: 1,
    focusDomains: [
      'Từ vựng phân cấp HSK chuẩn ngữ pháp',
      'Giải đề đọc hiểu & nghe hiểu',
      'Viết đoạn văn & phản xạ khẩu ngữ HSKK',
    ],
    tips: 'Học đều đặn mỗi ngày để duy trì phong độ trí nhớ tối đa cho kỳ thi.',
  },
  beginner_zero: {
    id: 'beginner_zero',
    title: 'Người mới bắt đầu (Số 0)',
    icon: '🌱',
    badgeLabel: 'Nhập môn số 0',
    subtitle: 'Khởi đầu vững chắc, phát âm Pinyin chuẩn, không sợ nản chí',
    description: 'Dành cho người chưa từng học tiếng Trung. Tập trung vào phát âm chuẩn, nét bút căn bản và những từ vựng sinh hoạt dễ thuộc nhất.',
    defaultWordsPerDay: 5,
    defaultMinutesPerDay: 15,
    defaultStreakMode: 'daily_7',
    defaultFreezes: 2,
    focusDomains: [
      'Ngữ âm Pinyin & 4 thanh điệu chuẩn',
      'Quy tắc thuận bút & 214 bộ thủ',
      'Hội thoại chào hỏi sinh hoạt hàng ngày',
    ],
    tips: 'Mục tiêu nhỏ 5 từ/ngày giúp bạn xây dựng thói quen kiên trì mà không bị áp lực.',
  },
  casual_cultural: {
    id: 'casual_cultural',
    title: 'Sở thích & Du lịch',
    icon: '🎭',
    badgeLabel: 'Du lịch & Sở thích',
    subtitle: 'Thư thả học qua phim ảnh, bài hát, ẩm thực và văn hóa',
    description: 'Học không vì áp lực điểm số mà để du lịch tự túc, xem phim không cần phụ đề, thưởng thức âm nhạc và hiểu thêm về văn hóa Trung Hoa.',
    defaultWordsPerDay: 10,
    defaultMinutesPerDay: 20,
    defaultStreakMode: 'daily_7',
    defaultFreezes: 2,
    focusDomains: [
      'Tiếng Trung du lịch & gọi món ăn',
      'Khẩu ngữ đời sống & tiếng lóng giới trẻ',
      'Văn hóa cổ phong, âm nhạc & phim ảnh',
    ],
    tips: 'Duy trì học tập nhẹ nhàng theo sở thích qua phim ảnh và âm nhạc mỗi ngày.',
  },
  classroom_student: {
    id: 'classroom_student',
    title: 'Học viên theo lớp chính quy',
    icon: '🎓',
    badgeLabel: 'Theo giáo trình lớp',
    subtitle: 'Đồng bộ bài giảng《新HSK教程》và bài tập về nhà của giáo viên',
    description: 'Dành cho học viên đang theo học lớp của giáo viên Minnie Chinese, cần hoàn thành bài tập giao và học từ vựng bài khóa trước giờ lên lớp.',
    defaultWordsPerDay: 15,
    defaultMinutesPerDay: 30,
    defaultStreakMode: 'daily_7',
    defaultFreezes: 2,
    focusDomains: [
      'Bài khóa giáo trình《新HSK教程》',
      'Bài tập về nhà & trắc nghiệm lớp',
      'Luyện phản xạ cùng Gia sư AI',
    ],
    tips: 'Ưu tiên giải quyết các bài tập đến hạn được thầy cô giao trong ngày.',
  },
};

/**
 * Calculates calendar day difference between two Date objects or ISO strings.
 * Disregards hours/minutes/seconds.
 */
export function getCalendarDayDiff(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);

  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((utc2 - utc1) / msPerDay);
}

/**
 * Returns whether a given date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date = new Date()): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Checks and updates the user's daily streak on app initialization or active study.
 * Standard daily consecutive learning streak:
 * - Active today (diff = 0): streak remains intact
 * - Active yesterday (diff = 1): streak maintained, resets today counter for new day
 * - Missed days (diff > 1): streak resets to 0
 */
export function evaluateRealtimeStreak(
  stats: UserStats,
  _profile?: UserProfile
): { stats: UserStats; profileUpdate?: Partial<UserProfile>; freezeUsed?: boolean } {
  const now = new Date();
  const nowStr = now.toISOString();

  if (!stats.lastActiveDate) {
    return {
      stats: {
        ...stats,
        dailyStreak: 0,
        lastActiveDate: nowStr,
        cardsReviewedToday: 0,
        streakProtectedToday: false,
      },
    };
  }

  const diffDays = getCalendarDayDiff(stats.lastActiveDate, nowStr);

  if (diffDays === 0) {
    // Active today, streak remains as is.
    let sanitizedCardsToday = stats.cardsReviewedToday ?? 0;
    if (sanitizedCardsToday > 150 && stats.totalReviews && sanitizedCardsToday > stats.totalReviews) {
      sanitizedCardsToday = Math.min(stats.totalReviews, 20);
    }
    return {
      stats: {
        ...stats,
        cardsReviewedToday: sanitizedCardsToday,
      },
    };
  }

  if (diffDays === 1) {
    // Active yesterday, streak is maintained, reset daily cards count for new day
    return {
      stats: {
        ...stats,
        cardsReviewedToday: 0,
        streakProtectedToday: false,
      },
    };
  }

  // User missed days -> Streak reset to 0
  return {
    stats: {
      ...stats,
      dailyStreak: 0,
      cardsReviewedToday: 0,
      streakProtectedToday: false,
    },
    profileUpdate: {
      streak_count: 0,
    },
  };
}

/**
 * Call when the user completes an active learning event today (reviews cards, quiz, voice call, etc.)
 */
export function registerStudyActivityToday(
  stats: UserStats,
  cardsCount = 1,
  xpGained = 10,
  profile?: UserProfile
): { stats: UserStats; profileUpdate?: Partial<UserProfile> } {
  const nowStr = new Date().toISOString();
  const diffDays = stats.lastActiveDate ? getCalendarDayDiff(stats.lastActiveDate, nowStr) : 2;

  let newStreak = stats.dailyStreak;

  if (diffDays === 0) {
    // Already studied today, ensure streak is at least 1
    newStreak = Math.max(1, stats.dailyStreak);
  } else if (diffDays === 1) {
    // Studied yesterday, increment streak by 1
    newStreak = stats.dailyStreak + 1;
  } else {
    // Missed days, restart streak at 1
    newStreak = 1;
  }

  const updatedStats: UserStats = {
    ...stats,
    dailyStreak: newStreak,
    lastActiveDate: nowStr,
    cardsReviewedToday: (stats.cardsReviewedToday || 0) + cardsCount,
    totalReviews: (stats.totalReviews || 0) + cardsCount,
    xp: (stats.xp || 0) + xpGained,
    streakProtectedToday: false,
  };

  const profileUpdate: Partial<UserProfile> = {
    streak_count: newStreak,
    last_study_date: nowStr,
    exp_points: (profile?.exp_points || 0) + xpGained,
  };

  return { stats: updatedStats, profileUpdate };
}

/**
 * Allows a user to repair or recover a broken streak with a makeup study session
 */
export function repairStreak(
  stats: UserStats,
  profile?: UserProfile
): { stats: UserStats; profileUpdate?: Partial<UserProfile> } {
  const nowStr = new Date().toISOString();
  const recoveredStreak = Math.max(2, (profile?.streak_count || 1) + 1);

  const updatedStats: UserStats = {
    ...stats,
    dailyStreak: recoveredStreak,
    lastActiveDate: nowStr,
    streakProtectedToday: false,
  };

  const profileUpdate: Partial<UserProfile> = {
    streak_count: recoveredStreak,
    last_study_date: nowStr,
  };

  return { stats: updatedStats, profileUpdate };
}
