import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development due to hot-reloads
const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

// Interfaces compatible with previous mock structure
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

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleEmail?: string;
  gmailSyncActive?: boolean;
  lastSyncedTime?: string;
}

// Hash password using PBKDF2
export function hashPassword(password: string): string {
  const salt = 'jobtracker-salt-secret-9821';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

// --- USER OPERATIONS ---
export async function getUserByEmail(email: string): Promise<User | undefined> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });
  if (!user) return undefined;
  
  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    googleAccessToken: user.googleAccessToken || undefined,
    googleRefreshToken: user.googleRefreshToken || undefined,
    googleEmail: user.googleEmail || undefined,
    lastSyncedTime: user.lastSyncedTime?.toISOString() || undefined
  };
}

export async function getUserById(id: string): Promise<User | undefined> {
  const user = await prisma.user.findUnique({
    where: { id }
  });
  if (!user) return undefined;

  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    googleAccessToken: user.googleAccessToken || undefined,
    googleRefreshToken: user.googleRefreshToken || undefined,
    googleEmail: user.googleEmail || undefined,
    lastSyncedTime: user.lastSyncedTime?.toISOString() || undefined
  };
}

export async function createUser(email: string, passwordPlain: string, name: string): Promise<User> {
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });
  
  if (existing) {
    throw new Error('User already exists');
  }

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash: hashPassword(passwordPlain),
      name,
      gmailSyncActive: false
    }
  });

  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    googleAccessToken: user.googleAccessToken || undefined,
    googleRefreshToken: user.googleRefreshToken || undefined,
    googleEmail: user.googleEmail || undefined,
    lastSyncedTime: user.lastSyncedTime?.toISOString() || undefined
  };
}

export async function findOrCreateUser(email: string, name: string): Promise<User> {
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (existing) {
    return {
      ...existing,
      createdAt: existing.createdAt.toISOString(),
      googleAccessToken: existing.googleAccessToken || undefined,
      googleRefreshToken: existing.googleRefreshToken || undefined,
      googleEmail: existing.googleEmail || undefined,
      lastSyncedTime: existing.lastSyncedTime?.toISOString() || undefined
    };
  }

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name,
      passwordHash: 'oauth-external-account',
      gmailSyncActive: false
    }
  });

  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    googleAccessToken: user.googleAccessToken || undefined,
    googleRefreshToken: user.googleRefreshToken || undefined,
    googleEmail: user.googleEmail || undefined,
    lastSyncedTime: user.lastSyncedTime?.toISOString() || undefined
  };
}

export async function updateUser(id: string, updates: Partial<Omit<User, 'id' | 'email'>>): Promise<User> {
  const data: any = { ...updates };
  
  if (updates.lastSyncedTime) {
    data.lastSyncedTime = new Date(updates.lastSyncedTime);
  }

  const user = await prisma.user.update({
    where: { id },
    data
  });

  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    googleAccessToken: user.googleAccessToken || undefined,
    googleRefreshToken: user.googleRefreshToken || undefined,
    googleEmail: user.googleEmail || undefined,
    lastSyncedTime: user.lastSyncedTime?.toISOString() || undefined
  };
}

// --- JOB OPERATIONS ---
export async function getUserJobs(userId: string): Promise<JobApplication[]> {
  const jobs = await prisma.job.findMany({
    where: { userId },
    include: {
      checklist: true,
      history: true
    },
    orderBy: {
      dateApplied: 'desc'
    }
  });

  return jobs.map(j => ({
    ...j,
    status: j.status as JobApplication['status'],
    source: j.source as JobApplication['source'],
    gmailMessageId: j.gmailMessageId || undefined,
    emailSender: j.emailSender || undefined,
    checklist: j.checklist.map(c => ({ id: c.id, text: c.text, completed: c.completed })),
    history: j.history.map(h => ({ id: h.id, date: h.date.toISOString(), status: h.status, description: h.description }))
  }));
}

export async function createJob(userId: string, job: Omit<JobApplication, 'id' | 'userId' | 'checklist' | 'history'>): Promise<JobApplication> {
  // Create default checklist items based on status
  const defaultChecklist = [];
  if (job.status === 'Bookmarked' || job.status === 'Applied') {
    defaultChecklist.push(
      { text: 'Review job requirements & tailor resume', completed: true },
      { text: 'Follow up with recruiter/hiring manager', completed: false },
      { text: 'Research company culture & products', completed: false }
    );
  } else if (job.status === 'Interviewing') {
    defaultChecklist.push(
      { text: 'Prepare interview talking points', completed: true },
      { text: 'Conduct mock coding/technical screens', completed: false },
      { text: 'Draft post-interview thank you email', completed: false }
    );
  }

  const defaultHistory = [
    {
      status: job.status,
      description: `Job application created via ${job.source === 'gmail' ? 'Gmail Auto-detect' : 'Manual Entry'}.`
    }
  ];

  const createdJob = await prisma.job.create({
    data: {
      userId,
      company: job.company,
      position: job.position,
      salary: job.salary,
      status: job.status,
      url: job.url,
      notes: job.notes,
      dateApplied: job.dateApplied,
      source: job.source,
      gmailMessageId: job.gmailMessageId || null,
      emailSender: job.emailSender || null,
      checklist: {
        create: defaultChecklist
      },
      history: {
        create: defaultHistory
      }
    },
    include: {
      checklist: true,
      history: true
    }
  });

  return {
    ...createdJob,
    status: createdJob.status as JobApplication['status'],
    source: createdJob.source as JobApplication['source'],
    gmailMessageId: createdJob.gmailMessageId || undefined,
    emailSender: createdJob.emailSender || undefined,
    checklist: createdJob.checklist.map(c => ({ id: c.id, text: c.text, completed: c.completed })),
    history: createdJob.history.map(h => ({ id: h.id, date: h.date.toISOString(), status: h.status, description: h.description }))
  };
}

export async function updateJob(userId: string, jobId: string, updates: Partial<Omit<JobApplication, 'id' | 'userId'>>): Promise<JobApplication> {
  // Fetch current status
  const currentJob = await prisma.job.findFirst({
    where: { id: jobId, userId },
    include: { checklist: true }
  });

  if (!currentJob) {
    throw new Error('Job application not found');
  }

  const data: any = {};
  if (updates.company !== undefined) data.company = updates.company;
  if (updates.position !== undefined) data.position = updates.position;
  if (updates.salary !== undefined) data.salary = updates.salary;
  if (updates.status !== undefined) data.status = updates.status;
  if (updates.url !== undefined) data.url = updates.url;
  if (updates.notes !== undefined) data.notes = updates.notes;
  if (updates.dateApplied !== undefined) data.dateApplied = updates.dateApplied;

  // Track status changes and log history
  const historyData = [];
  let appendTasks: { text: string; completed: boolean }[] = [];

  if (updates.status && updates.status !== currentJob.status) {
    historyData.push({
      status: updates.status,
      description: `Status changed from ${currentJob.status} to ${updates.status}.`
    });

    if (updates.status === 'Interviewing') {
      appendTasks.push({ text: `Prepare for ${currentJob.company} interviews`, completed: false });
    } else if (updates.status === 'Offer') {
      appendTasks.push({ text: `Review offer package & salary details`, completed: false });
      appendTasks.push({ text: `Draft negotiation response`, completed: false });
    }
  }

  // Handle checklist updates: if checklist is provided, we update it
  if (updates.checklist !== undefined) {
    // Delete existing checklist items first to prevent duplicate key conflicts and keep list clean
    await prisma.checklistItem.deleteMany({
      where: { jobId }
    });
    
    // Map current updates checklist
    const newItems = updates.checklist.map(c => ({
      text: c.text,
      completed: c.completed
    }));

    // Append any status change auto tasks
    data.checklist = {
      create: [...newItems, ...appendTasks]
    };
  } else if (appendTasks.length > 0) {
    // If checklist was not provided but status changed, just create the appends
    data.checklist = {
      create: appendTasks
    };
  }

  if (historyData.length > 0) {
    data.history = {
      create: historyData
    };
  }

  const updatedJob = await prisma.job.update({
    where: { id: jobId },
    data,
    include: {
      checklist: true,
      history: true
    }
  });

  return {
    ...updatedJob,
    status: updatedJob.status as JobApplication['status'],
    source: updatedJob.source as JobApplication['source'],
    gmailMessageId: updatedJob.gmailMessageId || undefined,
    emailSender: updatedJob.emailSender || undefined,
    checklist: updatedJob.checklist.map(c => ({ id: c.id, text: c.text, completed: c.completed })),
    history: updatedJob.history.map(h => ({ id: h.id, date: h.date.toISOString(), status: h.status, description: h.description }))
  };
}

export async function deleteJob(userId: string, jobId: string): Promise<void> {
  const current = await prisma.job.findFirst({
    where: { id: jobId, userId }
  });
  
  if (!current) {
    throw new Error('Job application not found');
  }

  await prisma.job.delete({
    where: { id: jobId }
  });
}
