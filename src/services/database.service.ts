import sqlite3 from 'sqlite3';
import { Interview, DialogueLine } from '../models/interview.model';
import { promises as fs } from 'fs';
import { join } from 'path';
import PDFDocument from 'pdfkit';
import { existsSync, mkdirSync } from 'fs';
import { PDFService } from '../services/pdf.service';

interface DatabaseRow {
  id: number;
  candidate: string;
  position: string;
  interviewer: string;
  jd: string;
  cv: string;
  jd_path: string;
  cv_path: string;
  conversation: string;
  audio_path: string;
  created_at: string;
  updated_at: string;
}

export class DatabaseService {
  private db: sqlite3.Database;
  private readonly filesDir: string;

  constructor() {
    const dbDir = join(process.cwd(), 'db');
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }

    this.db = new sqlite3.Database(join(dbDir, 'interviews.db'));
    this.filesDir = join(process.cwd(), 'public', 'files');

    // Tạo các thư mục lưu trữ file nếu chưa có
    ['jd', 'cv'].forEach(type => {
      const dir = join(this.filesDir, type);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });

    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    // Chỉ tạo bảng nếu chưa tồn tại
    this.db.run(`CREATE TABLE IF NOT EXISTS interviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate TEXT NOT NULL,
      position TEXT NOT NULL,
      interviewer TEXT NOT NULL,
      jd TEXT,
      cv TEXT,
      jd_path TEXT,
      cv_path TEXT,
      conversation TEXT,
      audio_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }

  private async generatePDF(content: string, title: string): Promise<Buffer> {
    const pdfService = new PDFService();
    const interview = {
      jd: content,
      cv: content,
      position: {
        title: title,
        requiredLevel: '',
        requiredExperienceYears: 0,
        requiredExperience: '',
      },
      candidate: {
        name: '',
        email: '',
        phone: '',
        level: '',
        experienceYears: 0,
        gender: 'male',
      },
      interviewer: {
        name: '',
        gender: 'male',
        position: '',
      },
    };

    if (title.includes('công việc')) {
      return pdfService.generateJDPDF(interview);
    } else {
      return pdfService.generateInterviewPDF(interview);
    }
  }

  private async savePDFFile(buffer: Buffer, type: 'jd' | 'cv'): Promise<string> {
    const timestamp = Date.now();
    const dir = join(this.filesDir, type);
    const filename = `${type}_${timestamp}.pdf`;
    const filePath = join(dir, filename);

    await fs.writeFile(filePath, buffer);
    return `/files/${type}/${filename}`;
  }

  async createInterview(interview: Interview): Promise<Interview> {
    return new Promise((resolve, reject) => {
      try {
        // Generate and save PDF files
        Promise.all([
          this.generatePDF(interview.jd || '', 'Mô tả công việc'),
          this.generatePDF(interview.cv || '', 'Hồ sơ ứng viên'),
        ])
          .then(async ([jdBuffer, cvBuffer]) => {
            const jdPath = await this.savePDFFile(jdBuffer, 'jd');
            const cvPath = await this.savePDFFile(cvBuffer, 'cv');

            this.db.run(
              `INSERT INTO interviews (
              candidate, position, interviewer,
              jd, cv, jd_path, cv_path,
              conversation, audio_path
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                JSON.stringify(interview.candidate),
                JSON.stringify(interview.position),
                JSON.stringify(interview.interviewer),
                interview.jd,
                interview.cv,
                jdPath,
                cvPath,
                JSON.stringify(interview.conversation),
                interview.audioPath,
              ],
              function (err) {
                if (err) {
                  reject(err);
                  return;
                }

                resolve({
                  ...interview,
                  id: this.lastID,
                  jdPath,
                  cvPath,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                });
              }
            );
          })
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  async getInterviews(): Promise<Interview[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM interviews ORDER BY created_at DESC',
        (err, rows: DatabaseRow[]) => {
          if (err) {
            reject(err);
            return;
          }

          try {
            const interviews = rows.map(row => ({
              id: row.id,
              candidate: JSON.parse(row.candidate),
              position: JSON.parse(row.position),
              interviewer: JSON.parse(row.interviewer),
              jd: row.jd,
              cv: row.cv,
              jdPath: row.jd_path,
              cvPath: row.cv_path,
              conversation: JSON.parse(row.conversation) as DialogueLine[],
              audioPath: row.audio_path,
              createdAt: new Date(row.created_at),
              updatedAt: new Date(row.updated_at),
            }));
            resolve(interviews);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  async getInterviewById(id: number): Promise<Interview | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM interviews WHERE id = ?',
        [id],
        (err, row: DatabaseRow | undefined) => {
          if (err) {
            reject(err);
            return;
          }
          if (!row) {
            resolve(null);
            return;
          }

          try {
            resolve({
              id: row.id,
              candidate: JSON.parse(row.candidate),
              position: JSON.parse(row.position),
              interviewer: JSON.parse(row.interviewer),
              jd: row.jd,
              cv: row.cv,
              jdPath: row.jd_path,
              cvPath: row.cv_path,
              conversation: JSON.parse(row.conversation) as DialogueLine[],
              audioPath: row.audio_path,
              createdAt: new Date(row.created_at),
              updatedAt: new Date(row.updated_at),
            });
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  async deleteInterview(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.getInterviewById(id)
        .then(async interview => {
          if (!interview) {
            reject(new Error('Interview not found'));
            return;
          }

          try {
            // Delete PDF files if they exist
            if (interview.jdPath) {
              const jdPath = join(process.cwd(), 'public', interview.jdPath);
              await fs.unlink(jdPath).catch(() => {});
            }
            if (interview.cvPath) {
              const cvPath = join(process.cwd(), 'public', interview.cvPath);
              await fs.unlink(cvPath).catch(() => {});
            }
            if (interview.audioPath) {
              const audioPath = join(process.cwd(), 'public', interview.audioPath);
              try {
                if (existsSync(audioPath)) {
                  await fs.unlink(audioPath);
                  console.log(`Deleted audio file: ${audioPath}`);
                }
              } catch (error) {
                console.error(`Error deleting audio file: ${audioPath}`, error);
              }
            }

            this.db.run('DELETE FROM interviews WHERE id = ?', [id], err => {
              if (err) {
                reject(err);
                return;
              }
              resolve();
            });
          } catch (error) {
            reject(error);
          }
        })
        .catch(reject);
    });
  }
}
