import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { GetCurrentUserResponse } from "@workspace/api-zod";

const router: IRouter = Router();
const CURRENT_USER_ID = 1;

// GET /users/me
router.get("/users/me", async (_req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, CURRENT_USER_ID));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(
    GetCurrentUserResponse.parse({
      ...user,
      createdAt: user.createdAt.toISOString(),
    })
  );
});

export default router;
