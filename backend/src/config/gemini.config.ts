import { registerAs } from '@nestjs/config';

export const geminiConfig = registerAs('gemini', () => ({
  apiKey: process.env.GEMINI_API || process.env.GEMINI_API_KEY || '',
  defaultModel: process.env.GEMINI_DEFAULT_MODEL || 'gemini-3.6-flash',
  embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-2',
  embeddingDimension: parseInt(
    process.env.GEMINI_EMBEDDING_DIMENSION || '1536',
    10,
  ),
  temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.2'),
  maxOutputTokens: parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS || '8192', 10),
}));
