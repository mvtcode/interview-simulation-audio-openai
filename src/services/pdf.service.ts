import PDFDocument from 'pdfkit';
import { Interview } from '../models/interview.model';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { marked } from 'marked';

export class PDFService {
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

  public async generateInterviewPDF(interview: Interview): Promise<Buffer> {
    if (!interview.cv) {
      throw new Error('CV content is empty');
    }

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));

    // Header
    doc.font('Helvetica-Bold').fontSize(20).text('CV ỨNG VIÊN', { align: 'center' });
    doc.moveDown();

    // Thông tin cá nhân
    doc.font('Helvetica-Bold').fontSize(14).text('THÔNG TIN CÁ NHÂN', { underline: true });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(12);
    doc.text(`Họ tên: ${interview.candidate.name}`);
    doc.text(`Email: ${interview.candidate.email}`);
    doc.text(`Số điện thoại: ${interview.candidate.phone}`);
    doc.text(`Level: ${interview.candidate.level}`);
    doc.text(`Số năm kinh nghiệm: ${interview.candidate.experienceYears}`);
    doc.text(`Giới tính: ${interview.candidate.gender === 'male' ? 'Nam' : 'Nữ'}`);
    doc.moveDown();

    // Nội dung CV
    doc.font('Helvetica-Bold').fontSize(14).text('NỘI DUNG CV', { underline: true });
    doc.moveDown(0.5);
    const parsedCV = await this.parseMarkdown(interview.cv);
    doc.font('Helvetica').fontSize(12).text(parsedCV);

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

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));

    // Header
    doc.font('Helvetica-Bold').fontSize(20).text('MÔ TẢ CÔNG VIỆC', { align: 'center' });
    doc.moveDown();

    // Thông tin vị trí
    doc.font('Helvetica-Bold').fontSize(14).text('THÔNG TIN VỊ TRÍ', { underline: true });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(12);
    doc.text(`Vị trí: ${interview.position.title}`);
    doc.text(`Level: ${interview.position.requiredLevel}`);
    doc.text(`Số năm kinh nghiệm: ${interview.position.requiredExperienceYears}`);
    doc.moveDown();

    // Nội dung JD
    doc.font('Helvetica-Bold').fontSize(14).text('CHI TIẾT CÔNG VIỆC', { underline: true });
    doc.moveDown(0.5);
    const parsedJD = await this.parseMarkdown(interview.jd);
    doc.font('Helvetica').fontSize(12).text(parsedJD);

    doc.end();

    return new Promise(resolve => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });
  }
}
