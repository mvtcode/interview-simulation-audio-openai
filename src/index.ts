import { config } from 'dotenv';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { OpenAIService } from './services/openai.service';
import { FFmpegService } from './services/ffmpeg.service';
import { Conversation, AudioFile } from './interfaces';
import { SpeakerType, VoiceType } from './enums';
import { OUTPUT_DIR, FINAL_AUDIO_FILE, SPEAKER_LABELS } from './constants';
import { logger } from './utils/logger';

config();

const outputDir = join(__dirname, '..', OUTPUT_DIR);
if (!existsSync(outputDir)) {
  mkdirSync(outputDir);
}

function parseConversation(markdown: string): Conversation[] {
  const conversations: Conversation[] = [];
  const lines = markdown.split('\n');
  let currentSpeaker: SpeakerType | null = null;
  let currentContent = '';

  for (const line of lines) {
    if (line.includes(`**${SPEAKER_LABELS[SpeakerType.INTERVIEWER]}:**`)) {
      if (currentSpeaker && currentContent) {
        conversations.push({
          speaker: currentSpeaker,
          content: currentContent.trim(),
        });
      }
      currentSpeaker = SpeakerType.INTERVIEWER;
      currentContent = line.replace(`**${SPEAKER_LABELS[SpeakerType.INTERVIEWER]}:**`, '').trim();
    } else if (line.includes(`**${SPEAKER_LABELS[SpeakerType.CANDIDATE]}:**`)) {
      if (currentSpeaker && currentContent) {
        conversations.push({
          speaker: currentSpeaker,
          content: currentContent.trim(),
        });
      }
      currentSpeaker = SpeakerType.CANDIDATE;
      currentContent = line.replace(`**${SPEAKER_LABELS[SpeakerType.CANDIDATE]}:**`, '').trim();
    } else if (currentSpeaker && line.trim()) {
      currentContent += ' ' + line.trim();
    }
  }

  if (currentSpeaker && currentContent) {
    conversations.push({
      speaker: currentSpeaker,
      content: currentContent.trim(),
    });
  }

  return conversations;
}

async function main(): Promise<void> {
  try {
    const openaiService = new OpenAIService(process.env.OPENAI_API_KEY || '');
    const ffmpegService = new FFmpegService();

    const markdownContent = readFileSync('conversation.md', 'utf8');
    const conversations = parseConversation(markdownContent);
    logger.info(`Found ${conversations.length} conversations`);

    const audioFiles: AudioFile[] = [];

    for (let i = 0; i < conversations.length; i++) {
      const { speaker, content } = conversations[i];
      logger.info(`\nGenerating audio for ${speaker} (${i + 1}/${conversations.length})`);
      logger.info(`Content: "${content.substring(0, 50)}..."`);

      const audioBuffer = await openaiService.generateAudio(
        content,
        speaker === SpeakerType.INTERVIEWER ? VoiceType.INTERVIEWER : VoiceType.CANDIDATE
      );

      const audioPath = join(outputDir, `audio_${i}.mp3`);
      writeFileSync(audioPath, audioBuffer);
      logger.info(`Audio saved to: ${audioPath}`);
      audioFiles.push({ path: audioPath, index: i });
    }

    logger.info('\nAll audio files generated. Starting merge process...');
    const finalOutputPath = join(outputDir, FINAL_AUDIO_FILE);
    await ffmpegService.mergeAudioFiles(audioFiles, finalOutputPath);

    logger.info('Process completed successfully!');
    logger.info(`Final audio file saved at: ${finalOutputPath}`);

    audioFiles.forEach(file => {
      unlinkSync(file.path);
    });
  } catch (error) {
    logger.error('Error in main process:', error);
  }
}

main();
