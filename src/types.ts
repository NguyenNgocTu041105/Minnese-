export type HSKLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface ExampleSentence {
  chinese: string;
  hanzi?: string;
  pinyin: string;
  english: string;
  vietnamese?: string;
  audioText?: string;
}

export interface WordItem {
  id: string;
  hanzi: string;
  traditional?: string;
  pinyin: string;
  pinyinNumbered?: string;
  hanViet?: string;
  english?: string;
  vietnamese?: string;
  hskLevel: HSKLevel;
  partOfSpeech?: string;
  radical?: string;
  strokeCount?: number;
  components?: string[];
  mnemonic?: string;
  example?: string;
  exampleTranslation?: string;
  examples?: ExampleSentence[];
  audioUrl?: string;
  tags?: string[];
  frequencyRank?: number;
  isCustom?: boolean;
}

export interface SRSData {
  ease_factor: number;
  interval_days: number;
  due_date: string; // ISO string
  last_reviewed: string;
  review_count: number;
}

export interface SRSCardState {
  wordId: string;
  repetition: number;
  interval: number;
  easinessFactor: number;
  lastReviewDate: string;
  nextReviewDate: string;
  history: {
    date: string;
    quality: number;
    interval: number;
  }[];
  state: 'new' | 'learning' | 'review' | 'mastered';
}

export type LearnerPersona =
  | 'working_professional' // Người đi làm bận rộn
  | 'exam_sprinter'        // Luyện thi HSK cấp tốc
  | 'beginner_zero'        // Người mới bắt đầu từ số 0
  | 'casual_cultural'      // Sở thích & Du lịch, giải trí
  | 'classroom_student';   // Học viên theo lớp học chính quy

export type StreakMode =
  | 'daily_7'     // Học hàng ngày 7/7 ngày
  | 'weekdays_5'  // Thứ 2 - Thứ 6 (nghỉ cuối tuần không đứt chuỗi)
  | 'flexible_4'; // Linh hoạt 4-5 ngày/tuần

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'teacher' | 'admin';
  current_level: number;
  current_level_updated_at?: string;
  current_level_updated_by?: string;
  class_id?: string;
  class_code?: string;
  class_joined_at?: string;
  words_per_day: number;
  streak_count: number;
  last_study_date: string;
  exp_points: number;
  badges: string[];
  learner_persona?: LearnerPersona;
  streak_mode?: StreakMode;
  target_minutes_per_day?: number;
  streak_freezes_available?: number;
  streak_freeze_used_dates?: string[];
  focus_domain?: string;
  target_exam_date?: string;
  rest_days?: number[]; // [0, 6] = Sunday, Saturday
  createdAt?: string;
  updatedAt?: string;
}

export interface ClassDoc {
  id: string;
  class_name: string;
  class_code: string;
  hsk_level: number;
  teacher_id: string;
  teacher_name?: string;
  created_by: string;
  created_at: string;
  student_count: number;
  is_active: boolean;
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  iconName: string;
  color: string;
  hskLevel?: HSKLevel;
  wordIds: string[];
  createdAt: string;
  isCustom?: boolean;
}

export interface DeckDoc {
  id: string;
  owner_id: string; // "system" or user uid
  name: string;
  description: string;
  card_count: number;
  is_official_content: boolean;
  hsk_level: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FlashcardDoc {
  id: string;
  deck_id: string;
  user_id: string;
  hanzi: string;
  pinyin: string;
  han_viet: string;
  meaning_vi: string;
  example_sentence: string;
  example_translation: string;
  source_citation?: string;
  audio_url?: string;
  audio_example_url?: string;
  stroke_order_ref: string;
  srs_data: SRSData;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssignmentDoc {
  id: string;
  title: string;
  description: string;
  target_type: 'class' | 'level' | 'all';
  target_class_id?: string;
  hsk_level: number;
  content_type: 'quiz' | 'deck' | 'reading' | 'writing';
  content_ref_id: string;
  content_title?: string;
  exam_code?: string;
  question_count?: number;
  duration_minutes?: number;
  questions?: QuizQuestion[];
  reading_topic?: string;
  writing_prompt?: string;
  vocab_words?: string[];
  due_date: string;
  created_by: string;
  created_at: string;
  is_active: boolean;
}

export interface AssignmentSubmissionDoc {
  id: string;
  assignment_id: string;
  assignment_title?: string;
  user_id: string;
  student_id?: string;
  student_name?: string;
  student_email?: string;
  user_name?: string;
  user_email?: string;
  class_id?: string;
  status?: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  score?: number;
  answers?: Record<number, string>;
  completed_at?: string;
  submitted_at?: string;
  feedback?: string;
  teacher_voice_url?: string;
  teacher_voice_duration?: number;
  teacher_voice_created_at?: string;
  pronunciation_notes?: string[];
  teacher_name?: string;
}

export interface QuizQuestion {
  id: string;
  type: 'pinyin' | 'meaning' | 'listening' | 'word_order' | 'radical' | 'fill_blank' | 'grammar' | 'writing';
  prompt: string;
  questionChinese?: string;
  audioText?: string;
  options?: string[];
  options_images?: string[];
  illustration_theme?: string;
  correctAnswer: string | string[];
  explanation: string;
  usageNotes?: string;
  exampleSentence?: {
    chinese: string;
    pinyin: string;
    vietnamese: string;
  };
  source_citation?: string;
  hskLevel?: HSKLevel;
  hints?: string[];
}

export interface QuizDoc {
  id: string;
  user_id: string;
  hsk_level: number;
  type: 'reading' | 'grammar' | 'vocab';
  questions: QuizQuestion[];
  score: number;
  created_at: string;
}

export interface PromptTemplateDoc {
  id: string;
  name: string;
  system_prompt: string;
  variables: string[];
  target_store_names: string[];
  version: number;
  is_active: boolean;
}

export interface FileSearchStoreDoc {
  id: string;
  store_name: string;
  display_name: string;
  category: 'vocab' | 'grammar';
  hsk_level: number;
  files_uploaded: { file_name: string; uploaded_at: string; status: string }[];
  createdAt: string;
}

export interface WorkbookDoc {
  id: string;
  title: string;
  description: string;
  hsk_level: HSKLevel;
  raw_text?: string;
  total_questions: number;
  parsed_questions: QuizQuestion[];
  created_by: string;
  created_at: string;
  updated_at?: string;
  tags?: string[];
}

export interface OnlineExamDoc {
  id: string;
  exam_code: string;
  title: string;
  description: string;
  hsk_level: HSKLevel;
  duration_minutes: number;
  target_class_id?: string;
  target_type: 'all' | 'class' | 'level';
  questions: QuizQuestion[];
  total_points: number;
  remix_mode: 'shuffle' | 'grammar_variants' | 'transformed' | 'comprehensive' | 'original' | 'writing_focus';
  source_workbook_id?: string;
  source_workbook_title?: string;
  created_by: string;
  created_at: string;
  is_active: boolean;
}

export interface RAGDocument {
  id: string;
  title: string;
  category: 'grammar' | 'tones' | 'vocabulary' | 'culture' | 'chengyu' | 'confusion_pairs';
  hskLevel?: HSKLevel;
  tags: string[];
  content: string;
  examples: { chinese: string; pinyin: string; english: string }[];
  rulesSummary: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  ragSources?: {
    id: string;
    title: string;
    category: string;
    snippet: string;
  }[];
  pinyinAnnotated?: string;
  audioPronunciation?: string;
  suggestedFollowUps?: string[];
}

export interface UserStats {
  xp: number;
  dailyStreak: number;
  lastActiveDate: string;
  cardsReviewedToday: number;
  totalReviews: number;
  quizzesCompleted: number;
  quizAccuracy: number;
  masteredWordsCount: number;
  studyTimeMinutes: number;
  streakFreezes?: number;
  streakProtectedToday?: boolean;
  weeklyDaysStudied?: number;
  weeklyGoalDays?: number;
}

export interface HSKStorySentence {
  hanzi: string;
  pinyin: string;
  vietnamese: string;
}

export interface HSKStoryVocabulary {
  hanzi: string;
  pinyin: string;
  hanViet?: string;
  vietnamese: string;
  partOfSpeech?: string;
  hskLevel: number;
}

export interface HSKStoryGrammar {
  structure: string;
  explanation: string;
  example: string;
  examplePinyin?: string;
  exampleVietnamese?: string;
}

export interface HSKStoryQuestion {
  id: string;
  type?: 'detail' | 'true_false' | 'cloze_grammar' | 'vocabulary' | 'inference' | string;
  typeLabel?: string;
  question: string;
  pinyin?: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  targetKnowledge?: string;
}

export interface HSKStoryLesson {
  id?: string;
  title: string;
  titlePinyin: string;
  titleVietnamese: string;
  hskLevel: number;
  genre?: string;
  storyChinese: string;
  pinyin: string;
  vietnameseTranslation: string;
  sentences: HSKStorySentence[];
  keyVocabulary: HSKStoryVocabulary[];
  grammarHighlights: HSKStoryGrammar[];
  questions: HSKStoryQuestion[];
  createdAt?: string;
}
