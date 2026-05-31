export const KNOWN_MODELS: Record<string, string[]> = {
  gemini: [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ],
  gpt: [
    'gpt-4o-mini',
    'gpt-4o',
    'o1-mini',
    'o3-mini'
  ],
  deepseek: [
    'deepseek-chat',
    'deepseek-reasoner'
  ],
  zhipu: [
    'glm-4-flash',
    'glm-4-plus',
    'glm-4-air'
  ],
  ollama: [
    'llama3',
    'mistral',
    'gemma2',
    'qwen2.5'
  ]
};

export function listModels(provider: string): string[] {
  return KNOWN_MODELS[provider] || [];
}
