import { analyticsService } from '@/services/analyticsService';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const brandId = req.nextUrl.searchParams.get('brandId');

    if (!brandId) {
      return Response.json({ error: 'brandId query param is required' }, { status: 400 });
    }

    const metrics = await analyticsService.getMetrics(brandId);
    return Response.json(metrics);
  } catch (err: any) {
    console.error('[GET /api/analytics]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
