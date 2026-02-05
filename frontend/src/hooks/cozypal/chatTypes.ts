export interface ChatContext {
  themeName: string;
  phase: string;
  timeLeft: number;
  currentLanguage: string;
  aiPersona: string;
  dailyCompletedPomodoros: number;
  totalFocusMinutes: number;
}

export interface ChatRequestOptions {
  message: string;
  topicId: number | null;
  apiKey?: string;
  provider?: string;
  model?: string;
  context: ChatContext;
  documentId?: number;
  documentTitle?: string;
  documentContent?: string;
  proactiveTrigger?: string;
  durationOverride?: number;
}

export interface StreamCallbacks {
  onChunk: (accumulated: string) => void;
  onComplete: (fullResponse: string) => void;
  onError: (errorMessage: string) => void;
}

export type AvatarState = 'idle' | 'thinking' | 'speaking' | 'focused';
