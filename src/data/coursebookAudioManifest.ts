// Auto-generated unified Audio Manifest for New HSK 1 & New HSK 2 Coursebooks
import manifestJson from './coursebookAudioManifest.json';

export interface DialogueLineTiming {
  lineIndex: number;
  start: number;
  end: number;
  duration: number;
}

export interface CoursebookLineAudio {
  lineIndex: number;
  speaker: string;
  speakerName?: string;
  gender?: 'male' | 'female';
  avatar?: string;
  persona?: string;
  voice?: string;
  audioUrl: string;
  duration: number;
  hanzi: string;
  pinyin?: string;
  vietnamese?: string;
}

export interface CoursebookTextAudioManifest {
  id: string;
  lesson: number;
  textIndex: number;
  title: string;
  context: string;
  fullAudioUrl: string;
  totalDuration: number;
  lineTimings: DialogueLineTiming[];
  lines: CoursebookLineAudio[];
}

export const COURSEBOOK_AUDIO_MANIFEST: Record<string, CoursebookTextAudioManifest> = manifestJson as unknown as Record<string, CoursebookTextAudioManifest>;
