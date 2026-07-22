import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, nodesTable, jobsTable, partitionsTable } from "@workspace/db";
import {
  GetResourceAvailabilityResponse,
  ListScheduleSlotsQueryParams,
  ListScheduleSlotsResponse,
  GetQueueEstimateQueryParams,
  GetQueueEstimateResponse,
  ListPartitionsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /resources/availability
router.get("/resources/availability", async (_req, res): Promise<void> => {
  const nodes = await db.select().from(nodesTable).where(eq(nodesTable.status, "active"));
  const runningJobs = await db
    .select()
    .from(jobsTable)
    .where(eq(jobsTable.status, "running"));

  const totalCpus = nodes.reduce((s, n) => s + n.cpuCores, 0);
  const totalGpus = nodes.reduce((s, n) => s + n.gpuCount, 0);
  const totalMem = nodes.reduce((s, n) => s + n.memoryGB, 0);

  const usedCpus = runningJobs.reduce((s, j) => s + j.cpuRequired, 0);
  const usedGpus = runningJobs.reduce((s, j) => s + j.gpuRequired, 0);
  const usedMem = runningJobs.reduce((s, j) => s + j.memoryGB, 0);

  res.json(
    GetResourceAvailabilityResponse.parse({
      availableCpus: Math.max(0, totalCpus - usedCpus),
      availableGpus: Math.max(0, totalGpus - usedGpus),
      availableMemoryGB: Math.max(0, totalMem - usedMem),
      cpuUtilPercent: totalCpus > 0 ? Math.round((usedCpus / totalCpus) * 1000) / 10 : 0,
      gpuUtilPercent: totalGpus > 0 ? Math.round((usedGpus / totalGpus) * 1000) / 10 : 0,
      memoryUtilPercent: totalMem > 0 ? Math.round((usedMem / totalMem) * 1000) / 10 : 0,
    })
  );
});

// GET /resources/slots
router.get("/resources/slots", async (req, res): Promise<void> => {
  const qp = ListScheduleSlotsQueryParams.safeParse(req.query);
  const params = qp.success ? qp.data : {};
  const reqCpu = Number(params.cpuRequired ?? 0);
  const reqGpu = Number(params.gpuRequired ?? 0);
  const reqMem = Number(params.memoryGB ?? 0);

  const nodes = await db.select().from(nodesTable).where(eq(nodesTable.status, "active"));
  const totalCpus = nodes.reduce((s, n) => s + n.cpuCores, 0);
  const totalGpus = nodes.reduce((s, n) => s + n.gpuCount, 0);
  const totalMem = nodes.reduce((s, n) => s + n.memoryGB, 0);

  // Generate slots for next 48h in 2h windows
  const slots = [];
  const now = Date.now();
  // Round up to next 2h boundary
  const start = Math.ceil(now / (2 * 3600000)) * (2 * 3600000);

  for (let i = 0; i < 24; i++) {
    const slotStart = new Date(start + i * 2 * 3600000);
    const slotEnd = new Date(start + (i + 1) * 2 * 3600000);
    const hour = slotStart.getHours();
    const busyFactor = hour >= 8 && hour <= 20 ? 0.6 + Math.random() * 0.2 : 0.2 + Math.random() * 0.2;

    const avCpu = Math.round(totalCpus * (1 - busyFactor));
    const avGpu = Math.round(totalGpus * (1 - busyFactor * 0.8));
    const avMem = Math.round(totalMem * (1 - busyFactor * 0.7));

    // Only include slots that can satisfy the request
    if (reqCpu > avCpu || reqGpu > avGpu || reqMem > avMem) continue;

    slots.push({
      startAt: slotStart.toISOString(),
      endAt: slotEnd.toISOString(),
      availableCpus: avCpu,
      availableGpus: avGpu,
      availableMemoryGB: avMem,
    });
  }

  res.json(ListScheduleSlotsResponse.parse(slots));
});

// GET /queue/estimate
router.get("/queue/estimate", async (req, res): Promise<void> => {
  const qp = GetQueueEstimateQueryParams.safeParse(req.query);
  const params = qp.success ? qp.data : {};

  const reqCpu = Number(params.cpuRequired ?? 4);
  const reqGpu = Number(params.gpuRequired ?? 0);
  const reqMem = Number(params.memoryGB ?? 8);

  const queuedJobs = await db.select().from(jobsTable).where(eq(jobsTable.status, "queued"));
  const nodes = await db.select().from(nodesTable).where(eq(nodesTable.status, "active"));
  const runningJobs = await db.select().from(jobsTable).where(eq(jobsTable.status, "running"));

  const totalCpus = nodes.reduce((s, n) => s + n.cpuCores, 0);
  const usedCpus = runningJobs.reduce((s, j) => s + j.cpuRequired, 0);
  const freeCpus = Math.max(0, totalCpus - usedCpus);

  let estimatedWaitMinutes: number;
  let confidence: "low" | "medium" | "high";

  if (freeCpus >= reqCpu) {
    // Resources available now
    estimatedWaitMinutes = Math.max(1, queuedJobs.length * 2);
    confidence = queuedJobs.length < 3 ? "high" : "medium";
  } else {
    // Need to wait
    const avgJobDurationMin = 120;
    const slotsNeeded = Math.ceil(reqCpu / Math.max(1, totalCpus / Math.max(1, runningJobs.length)));
    estimatedWaitMinutes = queuedJobs.length * 30 + slotsNeeded * avgJobDurationMin;
    confidence = queuedJobs.length > 10 ? "low" : "medium";
  }

  const estimatedStartAt = new Date(Date.now() + estimatedWaitMinutes * 60000);

  res.json(
    GetQueueEstimateResponse.parse({
      estimatedWaitMinutes,
      estimatedStartAt: estimatedStartAt.toISOString(),
      confidence,
    })
  );
});

// GET /partitions
router.get("/partitions", async (_req, res): Promise<void> => {
  const partitions = await db.select().from(partitionsTable).orderBy(partitionsTable.priority);
  res.json(ListPartitionsResponse.parse(partitions));
});

export default router;
