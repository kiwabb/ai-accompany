import type { UserProfile } from '../storage/userProfile';

function getPhaseDescription(phase: string): string {
  const descriptions: Record<string, string> = {
    focus: 'working hard in a FOCUS session',
    shortBreak: 'taking a SHORT BREAK',
    longBreak: 'taking a LONG BREAK',
  };
  return descriptions[phase] || 'studying';
}

function getPersonaInstructions(persona: string): string {
  const instructions: Record<string, string> = {
    gentle_encourager: 'Be warm, empathetic, validating, and supportive. Use gentle, caring language to encourage the user.',
    strict_coach: 'Be firm, direct, highly structured, and motivating. Focus on discipline and keeping the user on track.',
    logical_analyst: 'Be objective, analytical, clear, and structured. Focus on logic, facts, and breaking down complex topics.',
    humorous_buddy: 'Be playful, witty, cheerful, and light-hearted. Use humor to make studying fun and stress-free.',
  };
  return instructions[persona] || instructions.gentle_encourager;
}

function getProactiveContext(userMessage: string): string {
  if (!userMessage.startsWith('[SYSTEM_TRIGGER:')) {
    return '';
  }
  const parts = userMessage.split(':', 2);
  if (parts.length > 1) {
    const triggerType = parts[1].replace(']', '');
    return `Proactive trigger: ${triggerType}. `;
  }
  return '';
}

export function constructSystemPrompt(
  context: any,
  dailyFocus: number, // in minutes
  dailySessions: number,
  language: string,
  userMessage: string,
  userProfile: UserProfile
): string {
  const aiPersona = context?.aiPersona || 'gentle_encourager';
  const themeName = context?.themeName || 'Focus';
  const phase = context?.phase || 'focus';
  const timeLeft = context?.timeLeft || 0;

  const phaseDesc = getPhaseDescription(phase);
  const personaInst = getPersonaInstructions(aiPersona);
  const proactiveContext = getProactiveContext(userMessage);

  // User Profile facts and preferences context injection
  let profileText = '';
  if (userProfile) {
    const profileParts: string[] = [];
    if (userProfile.name) {
      profileParts.push(`User Name: ${userProfile.name}`);
    }
    if (userProfile.learningGoals) {
      profileParts.push(`Learning Goals: ${userProfile.learningGoals}`);
    }
    if (userProfile.facts && userProfile.facts.length > 0) {
      profileParts.push(`Facts about User:\n- ${userProfile.facts.join('\n- ')}`);
    }
    if (userProfile.preferences && userProfile.preferences.length > 0) {
      profileParts.push(`User Preferences:\n- ${userProfile.preferences.join('\n- ')}`);
    }
    if (profileParts.length > 0) {
      profileText = `\n\n[User Context]\n${profileParts.join('\n')}\n[End of User Context]`;
    }
  }

  return (
    `You are CozyPal. Respond in ${language}. Persona: ${aiPersona} (${personaInst}). ` +
    `User is ${phaseDesc} for '${themeName}' with ${Math.round(timeLeft / 60)} mins left. ` +
    `Progress: ${dailyFocus} mins, ${dailySessions} sessions. ${proactiveContext}` +
    `Task: Give a brief, encouraging response (1-2 sentences). Be extremely warm, concise, and helpful.` +
    profileText
  );
}
