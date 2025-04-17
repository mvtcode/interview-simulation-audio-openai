import PDFDocument from 'pdfkit';
import { Interview } from '../models/interview.model';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { marked } from 'marked';

export class PDFService {
  private readonly defaultFont = 'Helvetica';
  private readonly defaultBoldFont = 'Helvetica-Bold';
  private readonly defaultFontSize = 12;
  private readonly titleFontSize = 20;
  private readonly subtitleFontSize = 14;

  constructor() {
    // Tạo thư mục fonts nếu chưa tồn tại
    const fontsDir = join(process.cwd(), 'public', 'fonts');
    if (!existsSync(fontsDir)) {
      mkdirSync(fontsDir, { recursive: true });
    }
  }

  private async parseMarkdown(content: string): Promise<string> {
    const html = await marked(content);
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  private setupDocument(): PDFKit.PDFDocument {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      bufferPages: true
    });

    // Thêm header và footer
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);

      // Header
      doc.font(this.defaultBoldFont)
         .fontSize(this.defaultFontSize)
         .text('Interview Simulation', 50, 30, { align: 'center' });

      // Footer
      doc.font(this.defaultFont)
         .fontSize(10)
         .text(
           `Trang ${i + 1} / ${pageCount}`,
           50,
           doc.page.height - 30,
           { align: 'center' }
         );
    }

    return doc;
  }

  public async generateInterviewPDF(interview: Interview): Promise<Buffer> {
    if (!interview.cv) {
      throw new Error('CV content is empty');
    }

    const doc = this.setupDocument();
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));

    // Header
    doc.font(this.defaultBoldFont)
       .fontSize(this.titleFontSize)
       .text('CV ỨNG VIÊN', { align: 'center' });
    doc.moveDown();

    // Thông tin cá nhân
    doc.font(this.defaultBoldFont)
       .fontSize(this.subtitleFontSize)
       .text('THÔNG TIN CÁ NHÂN', { underline: true });
    doc.moveDown(0.5);

    doc.font(this.defaultFont)
       .fontSize(this.defaultFontSize);

    const personalInfo = [
      `Họ tên: ${interview.candidate.name}`,
      `Email: ${interview.candidate.email}`,
      `Số điện thoại: ${interview.candidate.phone}`,
      `Level: ${interview.candidate.level}`,
      `Số năm kinh nghiệm: ${interview.candidate.experienceYears}`,
      `Giới tính: ${interview.candidate.gender === 'male' ? 'Nam' : 'Nữ'}`,
    ];

    personalInfo.forEach(info => {
      doc.text(info);
    });
    doc.moveDown();

    // Nội dung CV
    doc.font(this.defaultBoldFont)
       .fontSize(this.subtitleFontSize)
       .text('NỘI DUNG CV', { underline: true });
    doc.moveDown(0.5);

    const parsedCV = await this.parseMarkdown(interview.cv);
    doc.font(this.defaultFont)
       .fontSize(this.defaultFontSize)
       .text(parsedCV, {
         align: 'justify',
         lineGap: 5,
       });

    doc.end();

    return new Promise(resolve => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });
  }

  public async generateJDPDF(interview: Interview): Promise<Buffer> {
    if (!interview.jd) {
      throw new Error('JD content is empty');
    }

    const doc = this.setupDocument();
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));

    // Header
    doc.font(this.defaultBoldFont)
       .fontSize(this.titleFontSize)
       .text('MÔ TẢ CÔNG VIỆC', { align: 'center' });
    doc.moveDown();

    // Thông tin vị trí
    doc.font(this.defaultBoldFont)
       .fontSize(this.subtitleFontSize)
       .text('THÔNG TIN VỊ TRÍ', { underline: true });
    doc.moveDown(0.5);

    doc.font(this.defaultFont)
       .fontSize(this.defaultFontSize);

    const positionInfo = [
      `Vị trí: ${interview.position.title}`,
      `Level: ${interview.position.requiredLevel}`,
      `Số năm kinh nghiệm: ${interview.position.requiredExperienceYears}`,
    ];

    positionInfo.forEach(info => {
      doc.text(info);
    });
    doc.moveDown();

    // Nội dung JD
    doc.font(this.defaultBoldFont)
       .fontSize(this.subtitleFontSize)
       .text('CHI TIẾT CÔNG VIỆC', { underline: true });
    doc.moveDown(0.5);

    const parsedJD = await this.parseMarkdown(interview.jd);
    doc.font(this.defaultFont)
       .fontSize(this.defaultFontSize)
       .text(parsedJD, {
         align: 'justify',
         lineGap: 5,
       });

    doc.end();

    return new Promise(resolve => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });
  }
}