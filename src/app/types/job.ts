export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface HistoryEvent {
  id: string;
  date: string;
  status: string;
  description: string;
}

export interface JobApplication {
  id: string;
  userId: string;
  company: string;
  position: string;
  salary: string;
  status: 'Bookmarked' | 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';
  url: string;
  notes: string;
  dateApplied: string;
  source: 'manual' | 'gmail';
  gmailMessageId?: string;
  emailSender?: string;
  checklist: ChecklistItem[];
  history: HistoryEvent[];
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
  googleEmail?: string;
  gmailSyncActive?: boolean;
  lastSyncedTime?: string;
}
