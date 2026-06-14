import { NextRequest, NextResponse } from 'next/server';
import { getActiveGmailSyncUsers } from '@/app/utils/db-server';
import { syncUserGmail } from '@/app/utils/sync-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Verify Vercel Cron authorization header if CRON_SECRET is set
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const activeUsers = await getActiveGmailSyncUsers();
    console.log(`Cron sync started. Found ${activeUsers.length} users with active Gmail Sync.`);
    
    const results = [];

    for (const user of activeUsers) {
      try {
        const jobsFound = await syncUserGmail(user.id);
        results.push({
          userId: user.id,
          email: user.email,
          success: true,
          jobsFound
        });
        console.log(`Cron sync success for user ${user.email}: Added ${jobsFound} new jobs.`);
      } catch (err: any) {
        results.push({
          userId: user.id,
          email: user.email,
          success: false,
          error: err.message || 'Unknown error during sync'
        });
        console.error(`Cron sync failed for user ${user.email}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      processedUsersCount: activeUsers.length,
      results
    });
  } catch (error: any) {
    console.error('Global Cron Sync Error:', error);
    return NextResponse.json({ error: 'Failed to run background synchronization' }, { status: 500 });
  }
}
