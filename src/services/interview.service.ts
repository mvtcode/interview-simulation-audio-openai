import { Interview } from '../models/interview.model';
import { OpenAIService } from './openai.service';
import { FFmpegService } from './ffmpeg.service';
import { DatabaseService } from './database.service';
import { PDFService } from './pdf.service';
import { EventEmitter } from 'events';
import { join } from 'path';

export const interviewEventEmitter = new EventEmitter();

interface InterviewFilters {
  candidateName?: string;
  candidatePhone?: string;
  interviewerName?: string;
}

export class InterviewService {
  private openaiService: OpenAIService;
  private ffmpegService: FFmpegService;
  private databaseService: DatabaseService;
  private pdfService: PDFService;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    this.openaiService = new OpenAIService(apiKey);
    this.ffmpegService = new FFmpegService();
    this.databaseService = new DatabaseService();
    this.pdfService = new PDFService();
  }

  public async createInterview(data: Partial<Interview>): Promise<Interview> {
    if (!data.position || !data.candidate || !data.interviewer) {
      throw new Error('Missing required fields: position, candidate, or interviewer');
    }

    // Validate gender values
    if (data.candidate.gender !== 'male' && data.candidate.gender !== 'female') {
      throw new Error('Invalid candidate gender');
    }

    if (data.interviewer.gender !== 'male' && data.interviewer.gender !== 'female') {
      throw new Error('Invalid interviewer gender');
    }

    try {
      // Generate JD
      interviewEventEmitter.emit('progress', {
        step: 'jd',
        status: 'start',
        message: 'Đang tạo JD...',
      });
      const jd = await this.openaiService.generateJD(data.position);
      interviewEventEmitter.emit('progress', {
        step: 'jd',
        status: 'done',
        message: 'Đã tạo xong JD',
      });

      // Generate CV
      interviewEventEmitter.emit('progress', {
        step: 'cv',
        status: 'start',
        message: 'Đang tạo CV...',
      });
      const cv = await this.openaiService.generateCV(data.candidate);
      interviewEventEmitter.emit('progress', {
        step: 'cv',
        status: 'done',
        message: 'Đã tạo xong CV',
      });

      // Generate conversation
      interviewEventEmitter.emit('progress', {
        step: 'conversation',
        status: 'start',
        message: 'Đang tạo nội dung cuộc phỏng vấn...',
      });
      const conversationTexts = await this.openaiService.generateConversation({
        candidate: data.candidate,
        position: data.position,
        interviewer: data.interviewer,
      });

      if (!conversationTexts || conversationTexts.length === 0) {
        throw new Error('Failed to generate conversation content');
      }

      interviewEventEmitter.emit('progress', {
        step: 'conversation',
        status: 'done',
        message: 'Đã tạo xong nội dung cuộc phỏng vấn',
      });

      // Create audio directory if not exists
      const fs = require('fs');
      const audioDir = join(process.cwd(), 'public', 'files', 'audio');
      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
      }

      // Generate audio files
      interviewEventEmitter.emit('progress', {
        step: 'audio',
        status: 'start',
        message: 'Đang tạo file âm thanh...',
      });

      // Chuyển đổi conversationTexts sang format phù hợp cho generateAudioFiles
      const dialogueLines = conversationTexts.map(text => {
        const [speaker, ...contentParts] = text.text.split(':');
        const content = contentParts.join(':').trim();

        // Xác định speaker dựa vào tên của interviewer hoặc candidate
        const speakerName = speaker.trim().toLowerCase();
        const interviewerName = data.interviewer?.name?.toLowerCase() || '';
        const candidateName = data.candidate?.name?.toLowerCase() || '';

        // Kiểm tra xem speaker có phải là interviewer không
        const isInterviewer = speakerName.includes(interviewerName);
        const isCandidate = speakerName.includes(candidateName);

        // Nếu không xác định được rõ ràng, mặc định là interviewer
        const speakerType = isInterviewer ? 'interviewer' : 'candidate';

        return {
          speaker: speakerType as 'interviewer' | 'candidate',
          content: content,
        };
      });

      const audioFiles = await this.openaiService.generateAudioFiles(dialogueLines, {
        interviewerGender: data.interviewer.gender as 'male' | 'female',
        candidateGender: data.candidate.gender as 'male' | 'female',
      });
      interviewEventEmitter.emit('progress', {
        step: 'audio',
        status: 'done',
        message: 'Đã tạo xong file âm thanh',
      });

      // Generate conversation with timing
      const conversation = await this.openaiService.generateConversationWithTiming(
        conversationTexts,
        audioFiles
      );

      // Merge audio files
      interviewEventEmitter.emit('progress', {
        step: 'merge',
        status: 'start',
        message: 'Đang ghép nối các file âm thanh...',
      });
      const audioFileName = `interview_${Date.now()}.mp3`;
      const audioPath = join(audioDir, audioFileName);
      await this.ffmpegService.mergeAudioFiles(audioFiles, audioPath);
      interviewEventEmitter.emit('progress', {
        step: 'merge',
        status: 'done',
        message: 'Đã ghép nối xong file âm thanh',
      });

      // Create interview record
      interviewEventEmitter.emit('progress', {
        step: 'save',
        status: 'start',
        message: 'Đang lưu thông tin cuộc phỏng vấn...',
      });
      const interview: Interview = {
        id: data.id,
        position: data.position,
        candidate: data.candidate,
        interviewer: data.interviewer,
        jd,
        cv,
        conversation,
        audioPath: `/files/audio/${audioFileName}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await this.databaseService.createInterview(interview);
      interviewEventEmitter.emit('progress', {
        step: 'save',
        status: 'done',
        message: 'Đã lưu xong thông tin cuộc phỏng vấn',
      });

      return result;
    } catch (error) {
      console.error('Error creating interview:', error);
      throw error;
    }
  }

  public async getInterviews(): Promise<Interview[]> {
    return this.databaseService.getInterviews();
  }

  public async getInterviewById(id: number): Promise<Interview | null> {
    return this.databaseService.getInterviewById(id);
  }

  public async generatePDF(id: number): Promise<Buffer> {
    const interview = await this.getInterviewById(id);
    if (!interview) {
      throw new Error('Interview not found');
    }
    return this.pdfService.generateInterviewPDF(interview);
  }

  public async deleteInterview(id: number): Promise<void> {
    try {
      // Lấy thông tin interview trước khi xóa
      const interview = await this.databaseService.getInterviewById(id);
      if (!interview) {
        throw new Error('Interview not found');
      }

      // Xóa file audio nếu tồn tại
      if (interview.audioPath) {
        const fs = require('fs');
        try {
          if (fs.existsSync(interview.audioPath)) {
            fs.unlinkSync(interview.audioPath);
            console.log(`Deleted audio file: ${interview.audioPath}`);
          }
        } catch (error) {
          console.error(`Error deleting audio file: ${interview.audioPath}`, error);
        }
      }

      // Xóa bản ghi trong database
      await this.databaseService.deleteInterview(id);
      console.log(`Deleted interview with ID: ${id}`);
    } catch (error) {
      console.error('Error in deleteInterview:', error);
      throw error;
    }
  }

  public async generateJDPDF(id: number): Promise<Buffer> {
    const interview = await this.getInterviewById(id);
    if (!interview) {
      throw new Error('Interview not found');
    }
    return this.pdfService.generateJDPDF(interview);
  }

  public async getInterviewsWithFilters(filters: InterviewFilters): Promise<Interview[]> {
    try {
      const interviews = await this.databaseService.getInterviews();

      return interviews.filter(interview => {
        if (
          filters.candidateName &&
          !interview.candidate.name.toLowerCase().includes(filters.candidateName.toLowerCase())
        ) {
          return false;
        }

        if (filters.candidatePhone && !interview.candidate.phone.includes(filters.candidatePhone)) {
          return false;
        }

        if (
          filters.interviewerName &&
          !interview.interviewer.name.toLowerCase().includes(filters.interviewerName.toLowerCase())
        ) {
          return false;
        }

        return true;
      });
    } catch (error) {
      console.error('Error getting interviews with filters:', error);
      throw new Error('Failed to get interviews with filters');
    }
  }

  public async generateRequiredExperience(position: {
    title: string;
    requiredLevel: string;
    requiredExperienceYears: number;
  }): Promise<string> {
    try {
      const prompt = `Tạo yêu cầu kinh nghiệm cho vị trí ${position.title} với level ${position.requiredLevel} và yêu cầu ${position.requiredExperienceYears} năm kinh nghiệm.
      Mỗi yêu cầu phải ngắn gọn, rõ ràng và bắt đầu bằng dấu gạch đầu dòng.
      Các yêu cầu phải bao gồm:
      - Kỹ năng chuyên môn cần thiết
      - Kiến thức về công nghệ/tools
      - Kinh nghiệm thực tế
      - Khả năng làm việc nhóm và giao tiếp
      - Khả năng giải quyết vấn đề`;

      const result = await this.openaiService.generateText(prompt);
      return result;
    } catch (error) {
      console.error('Error generating required experience:', error);
      throw error;
    }
  }
}
