// api/prompts/route.ts — POST: generate prompts via AI, GET: list prompts for a brand
import { promptService } from '@/services/promptService';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { brandId } = await req.json();

    if (!brandId) {
      return Response.json({ error: 'brandId is required' }, { status: 400 });
    }

    const result = await promptService.generateAndSave(brandId);

    return Response.json(
      { message: `${result.count} prompts generated and saved`, count: result.count },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[POST /api/prompts]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const brandId = req.nextUrl.searchParams.get('brandId');

    if (!brandId) {
      return Response.json({ error: 'brandId query param is required' }, { status: 400 });
    }

    const prompts = await promptService.listByBrand(brandId);
    return Response.json(prompts);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
