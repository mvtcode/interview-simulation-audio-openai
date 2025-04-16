import { SpeakerType } from '../enums';

export interface Conversation {
  speaker: SpeakerType;
  content: string;
}

export interface AudioFile {
  path: string;
  index: number;
}
