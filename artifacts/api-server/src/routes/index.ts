import { Router, type IRouter } from "express";
import healthRouter from "./health";
import botStatsRouter from "./bot-stats";
import botCommandsRouter from "./bot-commands";

const router: IRouter = Router();

router.use(healthRouter);
router.use(botStatsRouter);
router.use(botCommandsRouter);

export default router;
