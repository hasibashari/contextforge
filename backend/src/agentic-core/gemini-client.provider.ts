import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { GoogleGenAI } from '@google/genai';

export const GEMINI_CLIENT = 'GEMINI_CLIENT';

export const GeminiClientProvider: Provider = {
  provide: GEMINI_CLIENT,
  useFactory: async (configService: ConfigService): Promise<GoogleGenAI> => {
    const { GoogleGenAI: GoogleGenAIClass } = await import('@google/genai');
    const apiKey =
      configService.get<string>('gemini.apiKey') ||
      process.env.GEMINI_API ||
      process.env.GEMINI_API_KEY ||
      '';
    return new GoogleGenAIClass({ apiKey });
  },
  inject: [ConfigService],
};
