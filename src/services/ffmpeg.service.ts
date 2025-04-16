import ffmpeg from 'fluent-ffmpeg';
import { AudioFile } from '../interfaces';
import { writeFileSync, existsSync, unlinkSync } from 'fs';
import { logger } from '../utils/logger';

export class FFmpegService {
  async mergeAudioFiles(audioFiles: AudioFile[], outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const command = ffmpeg();

      const fileList = audioFiles.map(file => `file '${file.path}'`).join('\n');
      const listFile = 'files.txt';

      writeFileSync(listFile, fileList);

      command
        .input(listFile)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions('-c copy')
        .output(outputPath)
        .on('end', () => {
          logger.info('Audio files merged successfully');
          unlinkSync(listFile);
          resolve();
        })
        .on('error', (err: Error) => {
          logger.error('Error merging audio files:', err);
          if (existsSync(listFile)) {
            unlinkSync(listFile);
          }
          reject(err);
        })
        .run();
    });
  }
}
