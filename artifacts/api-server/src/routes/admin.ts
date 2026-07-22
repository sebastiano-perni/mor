import { Router, type IRouter } from "express";
import { eq, sql, and } from "drizzle-orm";
import { db, nodesTable, jobsTable, usersTable, activityTable } from "@workspace/db";
import {
  GetClusterStatsResponse,
  ListNodesResponse,
  UpdateNodeParams,
  UpdateNodeBody,
  UpdateNodeResponse,
  ListAllJobsQueryParams,
  ListAllJobsResponse,
  UpdateJobAdminParams,
  UpdateJobAdminBody,
  UpdateJobAdminResponse,
  ListUsersResponse,
  GetUtilizationHistoryResponse,
  GetActivityFeedQueryParams,
  GetActivityFeedResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /admin/stats
router.get("/admin/stats", async (req, res): Promise<void> => {
  const nodes = await db.select().from(nodesTable);
  const allJobs = await db.select().from(jobsTable);

  const totalNodes = nodes.length;
  const activeNodes = nodes.filter((n) => n.status === "active").length;
  const offlineNodes = nodes.filter((n) => n.status === "offline").length;
  const maintenanceNodes = nodes.filter((n) => n.status === "maintenance").length;

  const totalCpus = nodes.reduce((s, n) => s + n.cpuCores, 0);
  const totalGpus = nodes.reduce((s, n) => s + n.gpuCount, 0);
  const totalMemoryGB = nodes.reduce((s, n) => s + n.memoryGB, 0);

  const runningJobs = allJobs.filter((j) => j.status === "running");
  const usedCpus = runningJobs.reduce((s, j) => s + j.cpuRequired, 0);
  const usedGpus = runningJobs.reduce((s, j) => s + j.gpuRequired, 0);
  const usedMemoryGB = runningJobs.reduce((s, j) => s + j.memoryGB, 0);

  const queuedJobs = allJobs.filter((j) => j.status === "queued").length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const completedToday = allJobs.filter(
    (j) => j.status === "completed" && j.completedAt && new Date(j.completedAt) >= today
  ).length;

  const completedJobsWithWait = allJobs.filter(
    (j) => j.startedAt && j.submittedAt && j.status !== "queued"
  );
  const avgWaitMinutes =
    completedJobsWithWait.length > 0
      ? Math.round(
          completedJobsWithWait.reduce((s, j) => {
            const wait =
              (new Date(j.startedAt!).getTime() - new Date(j.submittedAt).getTime()) / 60000;
            return s + wait;
          }, 0) / completedJobsWithWait.length
        )
      : 45;

  const stats = GetClusterStatsResponse.parse({
    totalNodes,
    activeNodes,
    offlineNodes,
    maintenanceNodes,
    totalCpus,
    usedCpus,
    totalGpus,
    usedGpus,
    totalMemoryGB,
    usedMemoryGB,
    queuedJobs,
    runningJobs: runningJobs.length,
    completedToday,
    avgWaitMinutes,
  });
  res.json(stats);
});

// GET /admin/nodes
router.get("/admin/nodes", async (_req, res): Promise<void> => {
  const nodes = await db.select().from(nodesTable).orderBy(nodesTable.name);
  res.json(
    ListNodesResponse.parse(
      nodes.map((n) => ({
        ...n,
        updatedAt: n.updatedAt.toISOString(),
      }))
    )
  );
});

// PATCH /admin/nodes/:id
router.patch("/admin/nodes/:id", async (req, res): Promise<void> => {
  const params = UpdateNodeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateNodeBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updates: Partial<typeof nodesTable.$inferInsert> = {};
  if (body.data.status !== undefined) updates.status = body.data.status;
  if (body.data.partition !== undefined) updates.partition = body.data.partition;

  const [node] = await db
    .update(nodesTable)
    .set(updates)
    .where(eq(nodesTable.id, params.data.id))
    .returning();

  if (!node) {
    res.status(404).json({ error: "Node not found" });
    return;
  }
  res.json(UpdateNodeResponse.parse({ ...node, updatedAt: node.updatedAt.toISOString() }));
});

// GET /admin/jobs
router.get("/admin/jobs", async (req, res): Promise<void> => {
  const queryParams = ListAllJobsQueryParams.safeParse(req.query);
  const filters = queryParams.success ? queryParams.data : {};

  let jobs = await db.select().from(jobsTable).orderBy(jobsTable.submittedAt);

  if (filters.status) jobs = jobs.filter((j) => j.status === filters.status);
  if (filters.userId) jobs = jobs.filter((j) => j.userId === Number(filters.userId));
  if (filters.partition) jobs = jobs.filter((j) => j.partition === filters.partition);

  res.json(
    ListAllJobsResponse.parse(
      jobs.map((j) => ({
        ...j,
        submittedAt: j.submittedAt.toISOString(),
        scheduledFor: j.scheduledFor?.toISOString() ?? null,
        estimatedStartAt: j.estimatedStartAt?.toISOString() ?? null,
        estimatedCompletedAt: j.estimatedCompletedAt?.toISOString() ?? null,
        startedAt: j.startedAt?.toISOString() ?? null,
        completedAt: j.completedAt?.toISOString() ?? null,
      }))
    )
  );
});

// PATCH /admin/jobs/:id
router.patch("/admin/jobs/:id", async (req, res): Promise<void> => {
  const params = UpdateJobAdminParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateJobAdminBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updates: Partial<typeof jobsTable.$inferInsert> = {};
  if (body.data.status !== undefined) updates.status = body.data.status;
  if (body.data.priority !== undefined) updates.priority = body.data.priority;

  const [job] = await db
    .update(jobsTable)
    .set(updates)
    .where(eq(jobsTable.id, params.data.id))
    .returning();

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.json(
    UpdateJobAdminResponse.parse({
      ...job,
      submittedAt: job.submittedAt.toISOString(),
      scheduledFor: job.scheduledFor?.toISOString() ?? null,
      estimatedStartAt: job.estimatedStartAt?.toISOString() ?? null,
      estimatedCompletedAt: job.estimatedCompletedAt?.toISOString() ?? null,
      startedAt: job.startedAt?.toISOString() ?? null,
      completedAt: job.completedAt?.toISOString() ?? null,
    })
  );
});

// GET /admin/users
router.get("/admin/users", async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.name);
  res.json(
    ListUsersResponse.parse(
      users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      }))
    )
  );
});

// GET /admin/utilization
router.get("/admin/utilization", async (_req, res): Promise<void> => {
  const nodes = await db.select().from(nodesTable);
  const totalCpus = nodes.reduce((s, n) => s + n.cpuCores, 0) || 1;
  const totalGpus = nodes.reduce((s, n) => s + n.gpuCount, 0) || 1;
  const totalMem = nodes.reduce((s, n) => s + n.memoryGB, 0) || 1;

  const now = Date.now();
  const points = [];
  for (let i = 23; i >= 0; i--) {
    const ts = new Date(now - i * 3600 * 1000);
    const hour = ts.getHours();
    // Simulate realistic HPC utilization patterns
    const base = hour >= 8 && hour <= 20 ? 0.65 : 0.35;
    const jitter = () => (Math.random() - 0.5) * 0.15;
    const cpuPercent = Math.min(99, Math.max(10, (base + jitter()) * 100));
    const gpuPercent = Math.min(99, Math.max(5, (base * 0.8 + jitter()) * 100));
    const memPercent = Math.min(99, Math.max(15, (base * 0.7 + 0.2 + jitter()) * 100));
    const queueDepth = Math.round(Math.max(0, (base + jitter()) * 20));
    points.push({
      timestamp: ts.toISOString(),
      cpuPercent: Math.round(cpuPercent * 10) / 10,
      gpuPercent: Math.round(gpuPercent * 10) / 10,
      memoryPercent: Math.round(memPercent * 10) / 10,
      queueDepth,
    });
  }
  res.json(GetUtilizationHistoryResponse.parse(points));
});

// GET /admin/activity
router.get("/admin/activity", async (req, res): Promise<void> => {
  const qp = GetActivityFeedQueryParams.safeParse(req.query);
  const limit = qp.success && qp.data.limit ? Number(qp.data.limit) : 20;

  const events = await db
    .select()
    .from(activityTable)
    .orderBy(sql`${activityTable.timestamp} DESC`)
    .limit(limit);

  res.json(
    GetActivityFeedResponse.parse(
      events.map((e) => ({ ...e, timestamp: e.timestamp.toISOString() }))
    )
  );
});

export default router;
