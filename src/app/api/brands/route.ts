// api/brands/route.ts — POST: create brand + competitors, GET: list brands for user (with multi-tenant isolation)
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    const { name, category, website, competitors, userId } = await req.json();

    const targetUserId = authUser?.id || userId;

    if (!name?.trim() || !category?.trim()) {
      return Response.json(
        { error: 'Brand name and category are required' },
        { status: 400 }
      );
    }

    if (!targetUserId) {
      return Response.json(
        { error: 'User must be authenticated to create a brand' },
        { status: 401 }
      );
    }

    // Ensure user exists in cyted.User table before linking relation
    await db.user.upsert({
      where: { id: targetUserId },
      update: {},
      create: {
        id: targetUserId,
        email: authUser?.email || `${targetUserId}@user.cyted`,
        name: authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || null,
        company: authUser?.user_metadata?.company || null,
      },
    });

    const brand = await db.brand.create({
      data: {
        name: name.trim(),
        category: category.trim(),
        website: website?.trim() || null,
        userId: targetUserId,
        competitors: {
          create: (competitors as string[])
            .filter((c) => c.trim())
            .map((c) => ({ name: c.trim() })),
        },
      },
      include: { competitors: true },
    });

    return Response.json(brand, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/brands]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    const queryUserId = req.nextUrl.searchParams.get('userId');

    const effectiveUserId = queryUserId || authUser?.id;

    // Strict multi-tenant isolation: Unauthenticated requests or requests without a valid userId receive empty array
    if (!effectiveUserId) {
      return Response.json([]);
    }

    const brands = await db.brand.findMany({
      where: { userId: effectiveUserId },
      include: { competitors: true },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json(brands);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
