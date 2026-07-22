import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import jobsRouter from "./jobs";
import resourcesRouter from "./resources";
import dashboardRouter from "./dashboard";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(adminRouter);
router.use(jobsRouter);
router.use(resourcesRouter);
router.use(dashboardRouter);
router.use(usersRouter);

export default router;
