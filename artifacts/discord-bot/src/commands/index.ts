import type { ChatInputCommandInteraction, Client } from "discord.js";
import type { SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from "discord.js";

export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  category: string;
  execute(interaction: ChatInputCommandInteraction, client: Client): Promise<void>;
}

// ─── Import every command here — /help picks them up automatically ───────────
import { helpCommand } from "./help.js";
import { playCommand } from "./music/play.js";
import { skipCommand } from "./music/skip.js";
import { stopCommand } from "./music/stop.js";
import { pauseCommand } from "./music/pause.js";
import { resumeCommand } from "./music/resume.js";
import { queueCommand } from "./music/queue.js";
import { nowplayingCommand } from "./music/nowplaying.js";
import { gifCommand } from "./gif/gif.js";
import { giphyCommand } from "./gif/giphy.js";
import { videoCommand } from "./gif/video.js";
import { watchCommand } from "./gif/watch.js";
import { askCommand } from "./ai/ask.js";
import { lyricsCommand } from "./ai/lyrics.js";
import { boostCommand } from "./ai/boost.js";
import { statusCommand } from "./ai/status.js";
import { pollCommand } from "./games/poll.js";
import { truthordareCommand } from "./games/truthordare.js";
import { levelCommand } from "./xp/level.js";
import { leaderboardCommand } from "./xp/leaderboard.js";
import { rolesCommand } from "./xp/roles.js";
import { givexpCommand } from "./admin/givexp.js";
import { setwelcomeCommand } from "./admin/setwelcome.js";
import { setcommandsCommand } from "./admin/setcommands.js";
import { setannounceCommand } from "./admin/setannounce.js";
import { dashboardCommand } from "./admin/dashboard.js";
// Security
import { warnCommand } from "./security/warn.js";
import { warningsCommand } from "./security/warnings.js";
import { clearwarningsCommand } from "./security/clearwarnings.js";
import { kickCommand } from "./security/kick.js";
import { banCommand } from "./security/ban.js";
import { unbanCommand } from "./security/unban.js";
import { timeoutCommand } from "./security/timeout.js";
import { purgeCommand } from "./security/purge.js";
import { lockCommand } from "./security/lock.js";
import { unlockCommand } from "./security/unlock.js";
import { slowmodeCommand } from "./security/slowmode.js";
import { userinfoCommand } from "./security/userinfo.js";

// ─── Registry — add new commands to this array and they appear in /help ──────
export const allCommands: Command[] = [
  helpCommand,
  // Music
  playCommand,
  skipCommand,
  stopCommand,
  pauseCommand,
  resumeCommand,
  queueCommand,
  nowplayingCommand,
  // GIFs & Video
  gifCommand,
  giphyCommand,
  videoCommand,
  watchCommand,
  // AI & Info
  askCommand,
  lyricsCommand,
  boostCommand,
  statusCommand,
  // Games
  pollCommand,
  truthordareCommand,
  // XP System
  levelCommand,
  leaderboardCommand,
  rolesCommand,
  // Admin
  givexpCommand,
  setwelcomeCommand,
  setcommandsCommand,
  setannounceCommand,
  dashboardCommand,
  // Security
  warnCommand,
  warningsCommand,
  clearwarningsCommand,
  kickCommand,
  banCommand,
  unbanCommand,
  timeoutCommand,
  purgeCommand,
  lockCommand,
  unlockCommand,
  slowmodeCommand,
  userinfoCommand,
];

export const commandMap = new Map<string, Command>(
  allCommands.map((cmd) => [cmd.data.name, cmd])
);
