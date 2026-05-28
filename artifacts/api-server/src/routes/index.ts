import { Router, type IRouter } from "express";
import healthRouter from "./health";
import botStatsRouter from "./bot-stats";
import botCommandsRouter from "./bot-commands";
import leaderboardRouter from "./leaderboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(botStatsRouter);
router.use(botCommandsRouter);
router.use(leaderboardRouter);

export default router;
