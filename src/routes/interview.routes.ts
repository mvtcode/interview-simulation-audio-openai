import express from 'express';
import { InterviewController } from '../controllers/interview.controller';

const router = express.Router();
const interviewController = new InterviewController();

// Get progress updates (phải đặt trước các route có param)
router.get('/progress', interviewController.subscribeToProgress);

// Create new interview
router.post('/', interviewController.createInterview);

// Get all interviews with filters
router.get('/', interviewController.getInterviews);

// Get interview by ID
router.get('/:id', interviewController.getInterviewById);

// Generate PDF for interview
router.get('/:id/pdf', interviewController.generatePDF);

// Generate PDF for JD
router.get('/:id/jd-pdf', interviewController.generateJDPDF);

// Delete interview
router.delete('/:id', interviewController.deleteInterview);

export const interviewRoutes = router;
