// api/runs/route.ts — POST: start a new run, GET: get run status/progress
import { runService } from '@/services/runService';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { brandId } = await req.json();

    if (!brandId) {
      return Response.json({ error: 'brandId is required' }, { status: 400 });
    }

    const result = await runService.startRun(brandId);

    return Response.json(
      {
        message: `Run started. ${result.totalJobs} jobs queued across 3 AI providers.`,
        runId: result.runId,
        totalJobs: result.totalJobs,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[POST /api/runs]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const runId = req.nextUrl.searchParams.get('runId');
    const brandId = req.nextUrl.searchParams.get('brandId');

    if (runId) {
      // Specific run status (used for progress polling)
      const run = await runService.getRunStatus(runId);
      if (!run) {
        return Response.json({ error: 'Run not found' }, { status: 404 });
      }
      return Response.json(run);
    }

    if (brandId) {
      // List last 10 runs for a brand
      const runs = await runService.listRunsByBrand(brandId);
      return Response.json(runs);
    }

    return Response.json(
      { error: 'Provide either runId or brandId query param' },
      { status: 400 }
    );
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
