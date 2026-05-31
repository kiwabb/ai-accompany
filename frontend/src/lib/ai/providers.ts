import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

interface StreamChatOptions {
  message: string;
  systemPrompt: string;
  history: Array<{ sender: string; text: string }>;
  apiKey: string;
  provider: string;
  model?: string;
}

export async function* streamChatDirect(options: StreamChatOptions): AsyncIterable<string> {
  const { message, systemPrompt, history, apiKey, provider, model } = options;

  if (provider === 'gemini') {
    const currentKey = apiKey || '';
    if (!currentKey) {
      yield 'Error: No Google API Key provided. Please set it in Settings.';
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(currentKey);
      const targetModel = model || 'gemini-2.0-flash';
      const modelInstance = genAI.getGenerativeModel({
        model: targetModel,
        systemInstruction: systemPrompt,
        generationConfig: {
          temperature: 0.7,
        }
      });

      const geminiHistory = history.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const chatSession = modelInstance.startChat({
        history: geminiHistory,
      });

      const result = await chatSession.sendMessageStream(message);
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          yield chunkText;
        }
      }
    } catch (e: any) {
      console.error('Gemini API error:', e);
      yield `Error generating response from Gemini: ${e.message || e}`;
    }
  } else {
    // OpenAI-compatible providers
    let baseURL: string | undefined = undefined;
    let defaultModel = 'gpt-4o-mini';
    let targetKey = apiKey || '';

    if (provider === 'deepseek') {
      baseURL = 'https://api.deepseek.com/v1';
      defaultModel = 'deepseek-chat';
    } else if (provider === 'zhipu') {
      baseURL = 'https://open.bigmodel.cn/api/paas/v4/';
      defaultModel = 'glm-4-flash';
    } else if (provider === 'ollama') {
      baseURL = 'http://localhost:11434/v1';
      defaultModel = 'llama3';
      targetKey = targetKey || 'ollama'; // dummy key for local ollama
    } else {
      // standard openai
      defaultModel = 'gpt-4o-mini';
    }

    if (!targetKey && provider !== 'ollama') {
      yield `Error: No API Key provided for ${provider.toUpperCase()}. Please set it in Settings.`;
      return;
    }

    try {
      const client = new OpenAI({
        apiKey: targetKey,
        baseURL,
        dangerouslyAllowBrowser: true, // Crucial for client-side API requests
      });

      const isZhipu = provider === 'zhipu';
      const targetModel = model || defaultModel;
      const messages: any[] = [];

      if (isZhipu) {
        messages.push({
          role: 'user',
          content: `[SYSTEM INSTRUCTIONS - Please follow these guidelines in all responses]\n${systemPrompt}\n\n[END OF SYSTEM INSTRUCTIONS]`,
        });
        messages.push({
          role: 'assistant',
          content: systemPrompt.toLowerCase().includes('zh')
            ? '我明白了，我会遵循这些指导原则。'
            : 'Understood. I will follow these guidelines.',
        });
      } else {
        messages.push({ role: 'system', content: systemPrompt });
      }

      // Add conversation history
      history.forEach(m => {
        messages.push({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        });
      });

      // Add the final user message
      messages.push({ role: 'user', content: message });

      const stream = await client.chat.completions.create({
        model: targetModel,
        messages,
        stream: true,
      });

      for await (const chunk of stream) {
        const chunkText = chunk.choices[0]?.delta?.content || '';
        if (chunkText) {
          yield chunkText;
        }
      }
    } catch (e: any) {
      console.error(`${provider} API error:`, e);
      yield `Error generating response: ${e.message || e}`;
    }
  }
}
