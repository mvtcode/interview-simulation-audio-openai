import OpenAI from 'openai';
import { Interview } from '../models/interview.model';
import { logger } from '../utils/logger';

export interface ConversationLine {
  timeFrom: number;
  timeTo: number;
  speaker: 'interviewer' | 'candidate';
  text: string;
}

export class OpenAIService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.openai = new OpenAI({
      apiKey: apiKey,
      organization: process.env.OPENAI_ORG_ID, // optional
    });
  }

  public async generateJD(position: Interview['position']): Promise<string> {
    const prompt = `Hãy tạo một mô tả công việc chi tiết cho vị trí ${position.title} với các yêu cầu sau:
- Yêu cầu kinh nghiệm: ${position.requiredExperienceYears} năm
- Cấp độ: ${position.requiredLevel}
- Kỹ năng yêu cầu: ${position.requiredExperience}

Mô tả công việc cần bao gồm:
1. Tổng quan về vị trí
2. Trách nhiệm chính
3. Yêu cầu kỹ năng chi tiết
4. Quyền lợi và phúc lợi
5. Môi trường làm việc
6. Cơ hội phát triển

Hãy viết một cách chuyên nghiệp, rõ ràng và hấp dẫn.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Bạn là một chuyên gia nhân sự với nhiều năm kinh nghiệm trong việc viết mô tả công việc.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return response.choices[0].message.content || '';
  }

  public async generateCV(candidate: Interview['candidate']): Promise<string> {
    const prompt = `Hãy tạo một CV chuyên nghiệp cho ứng viên ${candidate.name} với thông tin sau:
- Cấp độ: ${candidate.level}
- Số năm kinh nghiệm: ${candidate.experienceYears}
- Giới tính: ${candidate.gender}

CV cần bao gồm các phần:
1. Thông tin cá nhân
2. Mục tiêu nghề nghiệp
3. Kinh nghiệm làm việc (liệt kê ít nhất 3 công ty)
4. Kỹ năng chuyên môn
5. Dự án tiêu biểu
6. Trình độ học vấn
7. Chứng chỉ (nếu có)
8. Điểm mạnh

Hãy viết một cách chuyên nghiệp, tập trung vào các thành tích và kỹ năng phù hợp với cấp độ ${candidate.level}.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Bạn là một chuyên gia tư vấn nghề nghiệp với nhiều năm kinh nghiệm trong việc viết CV.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return response.choices[0].message.content || '';
  }

  public async generateConversation(data: {
    candidate: Interview['candidate'];
    position: Interview['position'];
    interviewer: Interview['interviewer'];
  }): Promise<{ text: string }[]> {
    const prompt = `Tạo một cuộc phỏng vấn chi tiết và tự nhiên giữa người phỏng vấn và ứng viên với thông tin sau:

Thông tin ứng viên:
- Họ tên: ${data.candidate.name}
- Level: ${data.candidate.level}
- Số năm kinh nghiệm: ${data.candidate.experienceYears}

Thông tin vị trí:
- Vị trí: ${data.position.title}
- Yêu cầu level: ${data.position.requiredLevel}
- Yêu cầu số năm kinh nghiệm: ${data.position.requiredExperienceYears}
- Yêu cầu kinh nghiệm: ${data.position.requiredExperience}

Thông tin người phỏng vấn:
- Họ tên: ${data.interviewer.name}
- Chức vụ: ${data.interviewer.position}

Hãy tạo một cuộc phỏng vấn theo 6 giai đoạn sau, mỗi giai đoạn CẦN ÍT NHẤT 2-3 câu hỏi và trả lời:

1. Giới thiệu bản thân & kinh nghiệm (3 câu hỏi)
2. Kỹ năng & chuyên môn (3 câu hỏi)
3. Tư duy giải quyết vấn đề (3 câu hỏi)
4. Kỹ năng làm việc nhóm & giao tiếp (2 câu hỏi)
5. Mục tiêu & định hướng (2 câu hỏi)
6. Câu hỏi đảo chiều (2 câu hỏi)

Yêu cầu:
- Tổng cộng PHẢI CÓ ÍT NHẤT 15 lượt đối thoại
- Mỗi câu trả lời phải chi tiết, thể hiện kinh nghiệm thực tế và phù hợp với level ${data.candidate.level}
- Câu hỏi phải sâu sát, có tính thẩm định cao
- Đối thoại phải tự nhiên, chuyên nghiệp
- Thể hiện được tính cách và chuyên môn của cả người phỏng vấn và ứng viên

Trả về kết quả dưới dạng JSON với định dạng:
{
  "conversation": [
    {
      "text": string // Nội dung câu nói (bao gồm cả người nói, ví dụ: "Nguyễn Văn A: Xin chào")
    }
  ]
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Bạn là một chuyên gia phỏng vấn với nhiều năm kinh nghiệm trong lĩnh vực IT. Bạn có khả năng tạo ra các cuộc phỏng vấn chuyên nghiệp, sâu sát và thực tế. Hãy trả về kết quả dưới dạng JSON theo format được yêu cầu.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content || '';
    let conversation: { text: string }[];

    try {
      const parsedContent = JSON.parse(content);
      if (!parsedContent.conversation || !Array.isArray(parsedContent.conversation)) {
        console.error('Invalid response format:', content);
        throw new Error('Invalid response format');
      }
      conversation = parsedContent.conversation;
    } catch (error) {
      console.error('Failed to parse conversation JSON:', error);
      throw new Error('Invalid conversation format');
    }

    if (!conversation || conversation.length === 0) {
      console.error('Generated conversation is empty. Content:', content);
      throw new Error('Failed to generate conversation content');
    }

    if (conversation.length < 15) {
      console.error('Generated conversation is too short. Length:', conversation.length);
      throw new Error('Generated conversation is too short');
    }

    return conversation;
  }

  public async getAudioDuration(audioPath: string): Promise<number> {
    const ffmpeg = require('fluent-ffmpeg');
    return new Promise((resolve, reject) => {
      ffmpeg(audioPath).ffprobe((err: Error | null, metadata: { format: { duration: number } }) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(metadata.format.duration || 0);
      });
    });
  }

  public async generateConversationWithTiming(
    conversation: { text: string }[],
    audioFiles: Array<{ path: string; content: string }>
  ): Promise<ConversationLine[]> {
    const result: ConversationLine[] = [];
    let currentTime = 0;

    for (let i = 0; i < conversation.length; i++) {
      const line = conversation[i];
      const audioFile = audioFiles[i];

      if (!audioFile) {
        throw new Error(`Missing audio file for conversation line ${i}`);
      }

      // Lấy duration của audio file (tính bằng giây)
      const duration = await this.getAudioDuration(audioFile.path);
      // Chuyển đổi duration từ giây sang mili giây
      const durationMs = Math.round(duration * 1000);

      // Tách speaker và content
      const [speaker, ...contentParts] = line.text.split(':');
      const content = contentParts.join(':').trim();
      const speakerType = speaker.trim().toLowerCase().includes('ứng viên')
        ? 'candidate'
        : 'interviewer';

      result.push({
        timeFrom: currentTime,
        timeTo: currentTime + durationMs,
        speaker: speakerType,
        text: content,
      });

      currentTime += durationMs;
    }

    return result;
  }

  public async generateAudioFiles(
    conversation: Array<{ speaker: 'interviewer' | 'candidate'; content: string }>,
    options: { interviewerGender: 'male' | 'female'; candidateGender: 'male' | 'female' }
  ): Promise<Array<{ path: string; content: string }>> {
    const audioFiles: Array<{ path: string; content: string }> = [];
    const fs = require('fs');
    const path = require('path');

    if (!conversation || conversation.length === 0) {
      throw new Error('Conversation is empty');
    }

    // Tạo thư mục temp nếu chưa tồn tại
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Định nghĩa giọng đọc cho từng giới tính
    const voices = {
      interviewer: {
        male: 'onyx', // Giọng nam trầm, chuyên nghiệp
        female: 'nova', // Giọng nữ chuyên nghiệp
      },
      candidate: {
        male: 'echo', // Giọng nam trẻ
        female: 'shimmer', // Giọng nữ trẻ
      },
    };

    try {
      for (const item of conversation) {
        console.log(`Generating audio for: ${item.speaker} - ${item.content.substring(0, 50)}...`);

        // Chọn giọng đọc dựa vào speaker và giới tính
        const voice =
          item.speaker === 'interviewer'
            ? voices.interviewer[options.interviewerGender]
            : voices.candidate[options.candidateGender];

        try {
          const response = await this.openai.audio.speech.create({
            model: 'tts-1',
            voice: voice,
            input: item.content,
          });

          const buffer = Buffer.from(await response.arrayBuffer());
          const filePath = path.join(
            tempDir,
            `temp_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`
          );

          fs.writeFileSync(filePath, buffer);
          console.log(`Generated audio file: ${filePath} with voice: ${voice}`);

          audioFiles.push({
            path: filePath,
            content: item.content,
          });
        } catch (error) {
          console.error(`Error generating audio for item ${conversation.indexOf(item)}:`, error);
          throw new Error(
            `Failed to generate audio: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      if (audioFiles.length === 0) {
        throw new Error('No audio files were generated');
      }

      console.log(`Successfully generated ${audioFiles.length} audio files`);
      return audioFiles;
    } catch (error) {
      // Xóa các file tạm nếu có lỗi
      console.error('Error in generateAudioFiles:', error);
      audioFiles.forEach(file => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            console.log(`Deleted temporary file: ${file.path}`);
          }
        } catch (e) {
          console.error(`Error deleting temporary file ${file.path}:`, e);
        }
      });
      throw error;
    }
  }
}
