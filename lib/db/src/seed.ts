import { db } from "./index";
import {
  usersTable,
  partitionsTable,
  nodesTable,
  jobsTable,
  activityTable,
} from "./schema";
import { count } from "drizzle-orm";

async function seed() {
  console.log("Checking existing data...");

  const [{ value: userCount }] = await db.select({ value: count() }).from(usersTable);
  if (userCount > 0) {
    console.log("Database already contains data. Skipping seed.");
    process.exit(0);
  }

  console.log("Seeding database with initial sample data...");

  // Seed Users
  const insertedUsers = await db
    .insert(usersTable)
    .values([
      {
        id: 1,
        name: "Dr. Ayşe Kaya",
        email: "ayse.kaya@university.edu",
        role: "user",
        department: "Computer Science",
        institution: "Metu",
      },
      {
        id: 2,
        name: "Prof. Mehmet Yılmaz",
        email: "mehmet.yilmaz@university.edu",
        role: "admin",
        department: "Physics",
        institution: "Metu",
      },
    ])
    .returning();

  console.log(`Seeded ${insertedUsers.length} users.`);

  // Seed Partitions
  const insertedPartitions = await db
    .insert(partitionsTable)
    .values([
      {
        name: "standard",
        maxWallHours: 48,
        maxCpus: 64,
        maxMemoryGB: 256,
        maxGpus: 0,
        description: "Standard compute nodes for general HPC workloads",
        priority: 1,
      },
      {
        name: "gpu",
        maxWallHours: 24,
        maxCpus: 32,
        maxMemoryGB: 128,
        maxGpus: 4,
        description: "NVIDIA A100 GPU accelerated nodes for AI/ML training",
        priority: 2,
      },
      {
        name: "highmem",
        maxWallHours: 72,
        maxCpus: 128,
        maxMemoryGB: 1024,
        maxGpus: 0,
        description: "High memory nodes for large data processing & genomics",
        priority: 1,
      },
      {
        name: "long",
        maxWallHours: 168,
        maxCpus: 32,
        maxMemoryGB: 128,
        maxGpus: 0,
        description: "Long-running simulation tasks",
        priority: 1,
      },
    ])
    .returning();

  console.log(`Seeded ${insertedPartitions.length} partitions.`);

  // Seed Nodes
  const insertedNodes = await db
    .insert(nodesTable)
    .values([
      {
        name: "cn-01",
        cpuCores: 64,
        gpuCount: 0,
        memoryGB: 256,
        status: "active",
        cpuLoad: 42.5,
        gpuLoad: 0,
        memoryLoad: 55.0,
        partition: "standard",
      },
      {
        name: "cn-02",
        cpuCores: 64,
        gpuCount: 0,
        memoryGB: 256,
        status: "active",
        cpuLoad: 78.1,
        gpuLoad: 0,
        memoryLoad: 80.2,
        partition: "standard",
      },
      {
        name: "gpu-01",
        cpuCores: 32,
        gpuCount: 4,
        memoryGB: 128,
        status: "active",
        cpuLoad: 65.0,
        gpuLoad: 88.4,
        memoryLoad: 72.3,
        partition: "gpu",
      },
      {
        name: "gpu-02",
        cpuCores: 32,
        gpuCount: 4,
        memoryGB: 128,
        status: "active",
        cpuLoad: 12.0,
        gpuLoad: 15.0,
        memoryLoad: 25.0,
        partition: "gpu",
      },
      {
        name: "hm-01",
        cpuCores: 128,
        gpuCount: 0,
        memoryGB: 1024,
        status: "active",
        cpuLoad: 30.5,
        gpuLoad: 0,
        memoryLoad: 45.1,
        partition: "highmem",
      },
      {
        name: "cn-03",
        cpuCores: 64,
        gpuCount: 0,
        memoryGB: 256,
        status: "maintenance",
        cpuLoad: 0,
        gpuLoad: 0,
        memoryLoad: 0,
        partition: "standard",
      },
    ])
    .returning();

  console.log(`Seeded ${insertedNodes.length} nodes.`);

  // Seed Jobs
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 3600000);
  const twoHoursAgo = new Date(now.getTime() - 7200000);
  const threeHoursAgo = new Date(now.getTime() - 10800000);

  const insertedJobs = await db
    .insert(jobsTable)
    .values([
      {
        userId: 1,
        userName: "Dr. Ayşe Kaya",
        jobName: "LLM-FineTuning-Job",
        status: "running",
        cpuRequired: 16,
        gpuRequired: 2,
        memoryGB: 64,
        wallHours: 12,
        partition: "gpu",
        priority: 2,
        note: "Fine-tuning llama model on domain dataset",
        queuePosition: null,
        submittedAt: threeHoursAgo,
        startedAt: twoHoursAgo,
        progress: 35.5,
      },
      {
        userId: 1,
        userName: "Dr. Ayşe Kaya",
        jobName: "Genome-Assembly-01",
        status: "queued",
        cpuRequired: 32,
        gpuRequired: 0,
        memoryGB: 256,
        wallHours: 24,
        partition: "highmem",
        priority: 1,
        note: "High memory assembly job",
        queuePosition: 1,
        submittedAt: oneHourAgo,
      },
      {
        userId: 1,
        userName: "Dr. Ayşe Kaya",
        jobName: "Molecular-Dynamics-Sim",
        status: "completed",
        cpuRequired: 64,
        gpuRequired: 0,
        memoryGB: 128,
        wallHours: 6,
        partition: "standard",
        priority: 1,
        note: "GROMACS simulation completed successfully",
        queuePosition: null,
        submittedAt: new Date(now.getTime() - 86400000),
        startedAt: new Date(now.getTime() - 82800000),
        completedAt: new Date(now.getTime() - 61200000),
        progress: 100.0,
      },
      {
        userId: 2,
        userName: "Prof. Mehmet Yılmaz",
        jobName: "Quantum-Chem-Calc",
        status: "running",
        cpuRequired: 32,
        gpuRequired: 0,
        memoryGB: 128,
        wallHours: 48,
        partition: "standard",
        priority: 1,
        note: "Density functional theory calculation",
        queuePosition: null,
        submittedAt: twoHoursAgo,
        startedAt: oneHourAgo,
        progress: 15.0,
      },
    ])
    .returning();

  console.log(`Seeded ${insertedJobs.length} jobs.`);

  // Seed Activity
  const insertedActivity = await db
    .insert(activityTable)
    .values([
      {
        type: "job_started",
        message: "Job 'LLM-FineTuning-Job' started on node gpu-01",
        timestamp: twoHoursAgo,
        severity: "info",
        jobId: insertedJobs[0].id,
        userId: 1,
      },
      {
        type: "job_submitted",
        message: "Job 'Genome-Assembly-01' submitted to queue 'highmem'",
        timestamp: oneHourAgo,
        severity: "info",
        jobId: insertedJobs[1].id,
        userId: 1,
      },
      {
        type: "job_completed",
        message: "Job 'Molecular-Dynamics-Sim' finished with exit code 0",
        timestamp: new Date(now.getTime() - 61200000),
        severity: "info",
        jobId: insertedJobs[2].id,
        userId: 1,
      },
    ])
    .returning();

  console.log(`Seeded ${insertedActivity.length} activity events.`);
  console.log("Database seeding completed successfully!");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Failed to seed database:", err);
  process.exit(1);
});
