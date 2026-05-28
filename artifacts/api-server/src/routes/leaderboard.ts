import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { xpTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/leaderboard", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(xpTable)
      .orderBy(desc(xpTable.xp))
      .limit(10);

    const entries = rows.map((row, i) => ({
      rank: i + 1,
      userId: row.userId,
      guildId: row.guildId,
      level: row.level,
      xp: row.xp,
    }));

    res.json(entries);
  } catch (err) {
    req.log.warn({ err }, "Failed to fetch leaderboard");
    res.json([]);
  }
});

export default router;
