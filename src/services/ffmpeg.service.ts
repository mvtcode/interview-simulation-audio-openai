import ffmpeg from 'fluent-ffmpeg';
import { join } from 'path';
import { unlinkSync, writeFileSync } from 'fs';

export class FFmpegService {
  public async mergeAudioFiles(
    audioFiles: Array<{ path: string; content: string }>,
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (audioFiles.length === 0) {
        reject(new Error('No audio files to merge'));
        return;
      }

      // Tạo file danh sách
      const listFilePath = join(process.cwd(), 'temp', 'list.txt');
      const fileContent = audioFiles.map(file => `file '${file.path}'`).join('\n');
      writeFileSync(listFilePath, fileContent);

      const command = ffmpeg();

      // Sử dụng concat demuxer
      command
        .input(listFilePath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions('-c copy')
        .on('end', () => {
          // Xóa các file tạm
          try {
            unlinkSync(listFilePath);
            audioFiles.forEach(file => {
              try {
                unlinkSync(file.path);
              } catch (error) {
                console.error(`Error deleting temporary file ${file.path}:`, error);
              }
            });
          } catch (error) {
            console.error(`Error deleting list file:`, error);
          }
          resolve();
        })
        .on('error', err => {
          console.error('Error merging audio files:', err);
          reject(err);
        })
        .save(outputPath);
    });
  }
}
