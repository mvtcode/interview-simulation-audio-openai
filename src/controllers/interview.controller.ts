import { Request, Response } from 'express';
import { InterviewService, interviewEventEmitter } from '../services/interview.service';

export class InterviewController {
  private interviewService: InterviewService;
  private clients: Set<Response>;

  constructor() {
    this.interviewService = new InterviewService();
    this.clients = new Set();

    // Xử lý sự kiện progress và gửi về tất cả clients
    interviewEventEmitter.on('progress', data => {
      this.clients.forEach(client => {
        client.write(`data: ${JSON.stringify(data)}\n\n`);
      });
    });
  }

  public createInterview = async (req: Request, res: Response): Promise<void> => {
    try {
      const interviewData = req.body;
      console.log('Received interview data:', JSON.stringify(interviewData, null, 2));

      if (!interviewData.candidate || !interviewData.position || !interviewData.interviewer) {
        res
          .status(400)
          .json({ error: 'Missing required fields: candidate, position, or interviewer' });
        return;
      }

      const result = await this.interviewService.createInterview(interviewData);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating interview:', error);
      res
        .status(500)
        .json({ error: error instanceof Error ? error.message : 'Failed to create interview' });
    }
  };

  public subscribeToProgress = (_req: Request, res: Response): void => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    // Gửi heartbeat để giữ kết nối
    const heartbeat = setInterval(() => {
      res.write(':\n\n');
    }, 30000);

    // Thêm client vào danh sách
    this.clients.add(res);

    // Xử lý khi client ngắt kết nối
    _req.on('close', () => {
      clearInterval(heartbeat);
      this.clients.delete(res);
    });
  };

  public getInterviews = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters = {
        candidateName: req.query.candidateName as string,
        candidatePhone: req.query.candidatePhone as string,
        interviewerName: req.query.interviewerName as string,
      };
      const interviews = await this.interviewService.getInterviewsWithFilters(filters);
      res.json(interviews);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get interviews' });
    }
  };

  public getInterviewById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const interview = await this.interviewService.getInterviewById(id);
      if (interview) {
        res.json(interview);
      } else {
        res.status(404).json({ error: 'Interview not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to get interview' });
    }
  };

  public generatePDF = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const interview = await this.interviewService.getInterviewById(id);
      if (!interview || !interview.cv) {
        res.status(404).json({ error: 'CV not found' });
        return;
      }
      const pdfBuffer = await this.interviewService.generatePDF(id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=interview_${id}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  };

  public deleteInterview = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      await this.interviewService.deleteInterview(id);
      res.status(200).json({ message: 'Interview deleted successfully' });
    } catch (error) {
      console.error('Error deleting interview:', error);
      res
        .status(500)
        .json({ error: error instanceof Error ? error.message : 'Failed to delete interview' });
    }
  };

  public generateJDPDF = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const interview = await this.interviewService.getInterviewById(id);
      if (!interview || !interview.jd) {
        res.status(404).json({ error: 'JD not found' });
        return;
      }

      const pdfBuffer = await this.interviewService.generateJDPDF(id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=jd_${id}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating JD PDF:', error);
      res.status(500).json({ error: 'Failed to generate JD PDF' });
    }
  };

  public generateRequiredExperience = async (req: Request, res: Response): Promise<void> => {
    try {
      const { positionTitle, positionLevel, positionExperience } = req.body;

      if (!positionTitle || !positionLevel || !positionExperience) {
        res.status(400).json({ error: 'Missing required fields: positionTitle, positionLevel, or positionExperience' });
        return;
      }

      const result = await this.interviewService.generateRequiredExperience({
        title: positionTitle,
        requiredLevel: positionLevel,
        requiredExperienceYears: positionExperience
      });

      res.json({ requiredExperience: result });
    } catch (error) {
      console.error('Error generating required experience:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate required experience' });
    }
  };
}
