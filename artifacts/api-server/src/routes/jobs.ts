import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, jobsTable, activityTable } from "@workspace/db";
import {
  ListJobsQueryParams,
  ListJobsResponse,
  CreateJobBody,
  CreateJobResponse,
  GetJobParams,
  GetJobResponse,
  CancelJobParams,
  CancelJobResponse,
  ScheduleJobParams,
  ScheduleJobBody,
  ScheduleJobResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const CURRENT_USER_ID = 1;
const CURRENT_USER_NAME = "Dr. Filippo Galletta";

function formatJob(j: typeof jobsTable.$inferSelect) {
  return {
    ...j,
    submittedAt: j.submittedAt.toISOString(),
    scheduledFor: j.scheduledFor?.toISOString() ?? null,
    estimatedStartAt: j.estimatedStartAt?.toISOString() ?? null,
    estimatedCompletedAt: j.estimatedCompletedAt?.toISOString() ?? null,
    startedAt: j.startedAt?.toISOString() ?? null,
    completedAt: j.completedAt?.toISOString() ?? null,
  };
}

// GET /jobs
router.get("/jobs", async (req, res): Promise<void> => {
  const qp = ListJobsQueryParams.safeParse(req.query);
  const filters = qp.success ? qp.data : {};

  let jobs = await db
    .select()
    .from(jobsTable)
    .where(eq(jobsTable.userId, CURRENT_USER_ID))
    .orderBy(jobsTable.submittedAt);

  if (jobs.length === 0) {
    jobs = await db
      .select()
      .from(jobsTable)
      .orderBy(jobsTable.submittedAt);
  }

  if (filters.status) jobs = jobs.filter((j) => j.status === filters.status);

  res.json(ListJobsResponse.parse(jobs.map(formatJob)));
});

// POST /jobs
router.post("/jobs", async (req, res): Promise<void> => {
  const body = CreateJobBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const { jobName, cpuRequired, gpuRequired, memoryGB, wallHours, partition, priority, note } =
    body.data;

  const queuedJobs = await db.select().from(jobsTable).where(eq(jobsTable.status, "queued"));
  const queuePosition = queuedJobs.length + 1;

  const avgWaitPerJob = 45; // minutes
  const estimatedWaitMin = queuePosition * avgWaitPerJob;
  const estimatedStartAt = new Date(Date.now() + estimatedWaitMin * 60000);
  const estimatedCompletedAt = new Date(
    estimatedStartAt.getTime() + (wallHours || 1) * 3600 * 1000
  );

  const [job] = await db
    .insert(jobsTable)
    .values({
      userId: CURRENT_USER_ID,
      userName: CURRENT_USER_NAME,
      jobName,
      status: "queued",
      cpuRequired,
      gpuRequired: gpuRequired ?? 0,
      memoryGB,
      wallHours,
      partition,
      priority: priority ?? 1,
      note: note ?? null,
      queuePosition,
      estimatedStartAt,
      estimatedCompletedAt,
    })
    .returning();

  await db.insert(activityTable).values({
    type: "job_submitted",
    message: `Job "${jobName}" submitted by ${CURRENT_USER_NAME}`,
    severity: "info",
    jobId: job.id,
    userId: CURRENT_USER_ID,
  });

  res.status(201).json(CreateJobResponse.parse(formatJob(job)));
});

// GET /jobs/:id
router.get("/jobs/:id", async (req, res): Promise<void> => {
  const params = GetJobParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [job] = await db
    .select()
    .from(jobsTable)
    .where(and(eq(jobsTable.id, params.data.id), eq(jobsTable.userId, CURRENT_USER_ID)));

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  res.json(GetJobResponse.parse(formatJob(job)));
});

// DELETE /jobs/:id  (cancel)
router.delete("/jobs/:id", async (req, res): Promise<void> => {
  const params = CancelJobParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [job] = await db
    .update(jobsTable)
    .set({ status: "cancelled", queuePosition: null })
    .where(and(eq(jobsTable.id, params.data.id), eq(jobsTable.userId, CURRENT_USER_ID)))
    .returning();

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  await db.insert(activityTable).values({
    type: "job_cancelled",
    message: `Job "${job.jobName}" cancelled by ${CURRENT_USER_NAME}`,
    severity: "info",
    jobId: job.id,
    userId: CURRENT_USER_ID,
  });

  res.json(CancelJobResponse.parse(formatJob(job)));
});

// POST /jobs/:id/schedule
router.post("/jobs/:id/schedule", async (req, res): Promise<void> => {
  const params = ScheduleJobParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = ScheduleJobBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const scheduledFor = new Date(body.data.scheduledFor);
  if (isNaN(scheduledFor.getTime()) || scheduledFor <= new Date()) {
    res.status(400).json({ error: "scheduledFor must be a valid future datetime" });
    return;
  }

  const [existing] = await db
    .select()
    .from(jobsTable)
    .where(and(eq(jobsTable.id, params.data.id), eq(jobsTable.userId, CURRENT_USER_ID)));

  if (!existing) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const estimatedCompletedAt = new Date(
    scheduledFor.getTime() + existing.wallHours * 3600 * 1000
  );

  const [job] = await db
    .update(jobsTable)
    .set({
      status: "scheduled",
      scheduledFor,
      estimatedStartAt: scheduledFor,
      estimatedCompletedAt,
      queuePosition: null,
    })
    .where(eq(jobsTable.id, params.data.id))
    .returning();

  res.json(ScheduleJobResponse.parse(formatJob(job)));
});

export default router;
