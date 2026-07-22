import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, jobsTable } from "@workspace/db";
import { GetUserSummaryResponse } from "@workspace/api-zod";

const router: IRouter = Router();
const CURRENT_USER_ID = 1;

// GET /dashboard/summary
router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const jobs = await db.select().from(jobsTable).where(eq(jobsTable.userId, CURRENT_USER_ID));

  const totalJobs = jobs.length;
  const completedJobs = jobs.filter((j) => j.status === "completed").length;
  const runningJobs = jobs.filter((j) => j.status === "running").length;
  const queuedJobs = jobs.filter((j) => j.status === "queued").length;
  const scheduledJobs = jobs.filter((j) => j.status === "scheduled").length;

  const completedWithTime = jobs.filter(
    (j) => j.status === "completed" && j.startedAt && j.completedAt
  );
  const totalCpuHours =
    completedWithTime.reduce((s, j) => {
      const hours =
        (new Date(j.completedAt!).getTime() - new Date(j.startedAt!).getTime()) / 3600000;
      return s + j.cpuRequired * hours;
    }, 0);

  const startedJobs = jobs.filter((j) => j.startedAt && j.submittedAt);
  const avgWaitMinutes =
    startedJobs.length > 0
      ? Math.round(
          startedJobs.reduce((s, j) => {
            return (
              s +
              (new Date(j.startedAt!).getTime() - new Date(j.submittedAt).getTime()) / 60000
            );
          }, 0) / startedJobs.length
        )
      : 45;

  res.json(
    GetUserSummaryResponse.parse({
      totalJobs,
      completedJobs,
      runningJobs,
      queuedJobs,
      scheduledJobs,
      totalCpuHours: Math.round(totalCpuHours * 10) / 10,
      avgWaitMinutes,
    })
  );
});

export default router;
