import { Router, type IRouter } from "express";
import { readFileSync } from "fs";

const router: IRouter = Router();

const MANIFEST_PATH = "/tmp/bot-commands.json";

router.get("/bot-commands", (req, res) => {
  try {
    const raw = readFileSync(MANIFEST_PATH, "utf-8");
    const commands = JSON.parse(raw) as { name: string; description: string; category: string }[];
    res.json(commands);
  } catch {
    req.log.warn("Command manifest not found — bot may not have started yet");
    res.json([]);
  }
});

export default router;
