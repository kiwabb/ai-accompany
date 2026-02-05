export interface Topic {
  id: number;
  name: string;
  description?: string;
}

export interface Message {
  sender: 'user' | 'ai';
  text: string;
}

export interface DiagnosticData {
  system_prompt: string;
  memory_fragments: { id: number; content: string; score: number }[];
  user_profile: { facts?: string[]; preferences?: string[] };
  full_prompt: string;
  timestamp: string | null;
}

export interface EditingProfileItem {
  category: 'facts' | 'preferences';
  value: string;
}

export interface EditingFragment {
  id: number;
  content: string;
}

export interface CozyPalHandle {
  triggerProactiveMessage: (type: 'focus_start' | 'focus_end' | 'break_start' | 'break_end' | 'focus_near_end' | 'break_near_end' | 'focus_completed', durationOverride?: number) => void;
}
