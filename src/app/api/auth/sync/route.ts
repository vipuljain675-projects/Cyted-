import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    const body = await req.json().catch(() => ({}));

    // Use verified JWT user or provided fallback
    const userId = authUser?.id || body.id;
    const email = authUser?.email || body.email;
    const name = body.name || authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || null;
    const company = body.company || authUser?.user_metadata?.company || null;

    if (!userId || !email) {
      return Response.json({ error: 'Missing userId or email' }, { status: 400 });
    }

    // Upsert into cyted.User table
    const syncedUser = await db.user.upsert({
      where: { id: userId },
      update: {
        email,
        name: name || undefined,
        company: company || undefined,
      },
      create: {
        id: userId,
        email,
        name: name || null,
        company: company || null,
      },
    });

    return Response.json({ success: true, user: syncedUser }, { status: 200 });
  } catch (err: any) {
    console.error('[POST /api/auth/sync error]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
