import { OpenAI } from 'openai';
import { VoiceType } from '../enums';
import { logger } from '../utils/logger';

export class OpenAIService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  async generateAudio(text: string, voice: VoiceType): Promise<Buffer> {
    try {
      const response = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice: voice,
        input: text,
      });

      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      logger.error('Error generating audio:', error);
      throw error;
    }
  }
}
