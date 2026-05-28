import { useEffect, useState } from "react";
import {
  useGetBotStats,
  useGetBotCommands,
  useGetLeaderboard,
  getGetBotStatsQueryKey,
  getGetBotCommandsQueryKey,
  getGetLeaderboardQueryKey,
} from "@workspace/api-client-react";

const CATEGORY_ICONS: Record<string, string> = {
  "Music": "🎵",
  "GIFs & Video": "🖼️",
  "AI & Info": "🤖",
  "Games": "🎮",
  "XP System": "⭐",
  "Admin": "🔧",
  "General": "📋",
};

const MEDALS = ["🥇", "🥈", "🥉"];
const START_HOUR_UTC = 3; // 1 PM AEST = 03:00 UTC

function getNextRestartDate(): Date {
  const now = new Date();
  const candidate = new Date(now);
  candidate.setUTCMinutes(0, 0, 0);
  candidate.setUTCHours(candidate.getUTCHours() + 1);
  if (candidate.getUTCHours() < START_HOUR_UTC) {
    candidate.setUTCHours(START_HOUR_UTC, 0, 0, 0);
  }
  if (candidate <= now) {
    candidate.setUTCHours(candidate.getUTCHours() + 1, 0, 0, 0);
  }
  return candidate;
}

function formatCountdown(ms: number): string {
  const totalSecs = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function useRestartCountdown() {
  const [next, setNext] = useState<Date>(getNextRestartDate);
  const [msLeft, setMsLeft] = useState(() => next.getTime() - Date.now());

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const diff = next.getTime() - now;
      if (diff <= 0) {
        const newNext = getNextRestartDate();
        setNext(newNext);
        setMsLeft(newNext.getTime() - now);
      } else {
        setMsLeft(diff);
      }
    };
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [next]);

  return { countdown: formatCountdown(msLeft), nextDate: next, msLeft };
}

function usePulse() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setOn((v) => !v), 1200);
    return () => clearInterval(t);
  }, []);
  return on;
}

export default function App() {
  const pulse = usePulse();
  const { countdown, nextDate, msLeft } = useRestartCountdown();
  const { data: stats, isLoading: statsLoading } = useGetBotStats(
    { query: { queryKey: getGetBotStatsQueryKey(), refetchInterval: 30_000, staleTime: 0 } }
  );
  const { data: rawCommands, isLoading: cmdsLoading, dataUpdatedAt } = useGetBotCommands(
    { query: { queryKey: getGetBotCommandsQueryKey(), refetchInterval: 30_000, staleTime: 0 } }
  );
  const { data: leaderboard, isLoading: lbLoading } = useGetLeaderboard(
    { query: { queryKey: getGetLeaderboardQueryKey(), refetchInterval: 60_000, staleTime: 0 } }
  );

  const online = stats?.online ?? false;
  const serverCount = stats?.serverCount ?? 0;
  const botName = stats?.botName ?? "Scary Juan";

  const categories = rawCommands
    ? Object.entries(
        rawCommands.reduce<Record<string, string[]>>((acc, cmd) => {
          if (!acc[cmd.category]) acc[cmd.category] = [];
          acc[cmd.category].push(`/${cmd.name}`);
          return acc;
        }, {})
      )
    : [];

  const commandCount = rawCommands?.length ?? 0;

  return (
    <div className="min-h-screen bg-[#23272a] text-white font-sans">
      {/* Header */}
      <header className="bg-[#2c2f33] border-b border-[#1e2124] py-6 px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#5865f2] flex items-center justify-center text-2xl font-bold select-none">
            SJ
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{botName}</h1>
            <div className="flex items-center gap-2 mt-1">
              {statsLoading ? (
                <span className="text-[#b9bbbe] text-sm">Connecting…</span>
              ) : (
                <>
                  <span
                    className={`w-2.5 h-2.5 rounded-full transition-opacity duration-700 ${online ? "bg-green-400" : "bg-red-400"}`}
                    style={{ opacity: online ? (pulse ? 1 : 0.4) : 1 }}
                  />
                  <span className={`text-sm font-medium ${online ? "text-green-400" : "text-red-400"}`}>
                    {online ? "Online" : "Offline"}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="ml-auto text-right hidden sm:block">
            <p className="text-[#b9bbbe] text-sm">Servers</p>
            <p className="text-3xl font-bold text-[#5865f2]">
              {statsLoading ? "—" : serverCount}
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        {/* Quick stats */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Servers", value: statsLoading ? "—" : String(serverCount), icon: "🌐" },
            { label: "Commands", value: cmdsLoading ? "—" : String(commandCount), icon: "⚡" },
            { label: "XP System", value: "Active", icon: "⭐" },
            { label: "Help", value: "Auto-updating", icon: "📋" },
          ].map((s) => (
            <div key={s.label} className="bg-[#2c2f33] rounded-xl p-4 border border-[#1e2124]">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-white font-semibold">{s.value}</div>
              <div className="text-[#b9bbbe] text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </section>

        {/* Next Restart countdown */}
        <section className="bg-[#2c2f33] rounded-xl border border-[#1e2124] p-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔄</span>
              <div>
                <p className="text-[#b9bbbe] text-xs uppercase tracking-wide font-semibold mb-0.5">
                  Next Scheduled Restart
                </p>
                <p className="text-white font-mono text-sm">
                  {nextDate.toLocaleTimeString("en-AU", {
                    timeZone: "Australia/Sydney",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}{" "}
                  AEST &nbsp;·&nbsp;{" "}
                  {nextDate.toLocaleTimeString("en-GB", {
                    timeZone: "UTC",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}{" "}
                  UTC
                </p>
              </div>
            </div>
            <div className="text-right">
              <p
                className={`font-mono font-bold text-2xl tabular-nums transition-colors ${
                  msLeft < 5 * 60_000
                    ? "text-red-400"
                    : msLeft < 15 * 60_000
                    ? "text-yellow-400"
                    : "text-[#5865f2]"
                }`}
              >
                {countdown}
              </p>
              <p className="text-[#72767d] text-xs">until restart</p>
            </div>
          </div>
          {/* Progress bar — fills as we approach the restart */}
          <div className="mt-4 h-1.5 bg-[#1e2124] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                msLeft < 5 * 60_000
                  ? "bg-red-400"
                  : msLeft < 15 * 60_000
                  ? "bg-yellow-400"
                  : "bg-[#5865f2]"
              }`}
              style={{ width: `${Math.min(100, 100 - (msLeft / 3_600_000) * 100)}%` }}
            />
          </div>
        </section>

        {/* Leaderboard */}
        <section>
          <h2 className="text-xl font-bold mb-4 text-[#dcddde]">🏆 XP Leaderboard</h2>
          <div className="bg-[#2c2f33] rounded-xl border border-[#1e2124] overflow-hidden">
            {lbLoading ? (
              <div className="divide-y divide-[#1e2124]">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3 animate-pulse">
                    <div className="w-8 h-4 bg-[#40444b] rounded" />
                    <div className="flex-1 h-4 bg-[#40444b] rounded" />
                    <div className="w-16 h-4 bg-[#40444b] rounded" />
                  </div>
                ))}
              </div>
            ) : !leaderboard?.length ? (
              <div className="text-center text-[#b9bbbe] py-10 text-sm">
                No XP data yet — start chatting in your server to earn XP!
              </div>
            ) : (
              <div className="divide-y divide-[#1e2124]">
                {leaderboard.map((entry) => (
                  <div key={`${entry.userId}-${entry.guildId}`} className="flex items-center gap-4 px-5 py-3">
                    <span className="text-xl w-8 text-center flex-shrink-0">
                      {MEDALS[entry.rank - 1] ?? `#${entry.rank}`}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-mono text-sm truncate">
                        {entry.userId}
                      </p>
                      <p className="text-[#72767d] text-xs">Level {entry.level}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[#5865f2] font-bold text-sm">{entry.xp.toLocaleString()} XP</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Commands */}
        <section>
          <h2 className="text-xl font-bold mb-4 text-[#dcddde]">All Commands</h2>
          {cmdsLoading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-[#2c2f33] rounded-xl p-5 border border-[#1e2124] animate-pulse">
                  <div className="h-4 w-24 bg-[#40444b] rounded mb-3" />
                  <div className="flex gap-2 flex-wrap">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="h-5 w-16 bg-[#40444b] rounded" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {categories.map(([category, commands]) => (
                <div key={category} className="bg-[#2c2f33] rounded-xl p-5 border border-[#1e2124]">
                  <h3 className="font-bold text-white mb-3">
                    {CATEGORY_ICONS[category] ?? "💬"} {category}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {commands.map((cmd) => (
                      <span key={cmd} className="bg-[#40444b] text-[#dcddde] text-xs font-mono px-2 py-1 rounded">
                        {cmd}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* How to use */}
        <section className="bg-[#2c2f33] rounded-xl p-6 border border-[#5865f2]/30">
          <h2 className="text-xl font-bold mb-3 text-[#dcddde]">How to use</h2>
          <ol className="space-y-2 text-[#b9bbbe] text-sm list-decimal list-inside">
            <li>Invite the bot to your Discord server</li>
            <li>Type <code className="bg-[#40444b] px-1 rounded font-mono">/help</code> to see all commands in Discord</li>
            <li>Use <code className="bg-[#40444b] px-1 rounded font-mono">/setannounce</code> to pick an announcements channel</li>
            <li>Use <code className="bg-[#40444b] px-1 rounded font-mono">/setwelcome</code> to set up welcome messages</li>
            <li>Chat in your server to earn XP and level up!</li>
          </ol>
        </section>
      </main>

      <footer className="text-center text-[#72767d] text-xs py-6 space-y-1">
        <p>Scary Juan Bot • Running 24/7</p>
        {dataUpdatedAt > 0 && (
          <p>Commands last synced: {new Date(dataUpdatedAt).toLocaleTimeString()}</p>
        )}
      </footer>
    </div>
  );
}
