export interface Candidate {
  name: string;
  phone: string;
  email: string;
  level: string;
  experienceYears: number;
  gender: string;
}

export interface Position {
  title: string;
  requiredLevel: string;
  requiredExperienceYears: number;
  requiredExperience: string;
}

export interface Interviewer {
  name: string;
  position: string;
  gender: string;
}

export interface DialogueLine {
  timeFrom: number;
  timeTo: number;
  speaker: 'interviewer' | 'candidate';
  text: string;
}

export interface Interview {
  id?: number;
  candidate: Candidate;
  position: Position;
  interviewer: Interviewer;
  jd?: string;
  cv?: string;
  jdPath?: string;
  cvPath?: string;
  conversation?: DialogueLine[];
  audioPath?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
