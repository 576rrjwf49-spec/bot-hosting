import { useEffect, useState } from "react";

const COMMANDS = [
  { category: "🎵 Music", commands: ["/play", "/skip", "/stop", "/pause", "/resume", "/queue", "/nowplaying"] },
  { category: "🖼️ GIFs & Video", commands: ["/gif", "/giphy", "/video", "/watch"] },
  { category: "🤖 AI & Info", commands: ["/ask", "/lyrics", "/boost", "/status"] },
  { category: "🎮 Games", commands: ["/poll", "/truthordare"] },
  { category: "⭐ XP System", commands: ["/level", "/leaderboard", "/roles"] },
  { category: "🔧 Admin", commands: ["/givexp", "/setwelcome", "/setcommands", "/setannounce"] },
  { category: "📋 General", commands: ["/help"] },
];

const TOTAL_COMMANDS = COMMANDS.reduce((sum, c) => sum + c.commands.length, 0);

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

  return (
    <div className="min-h-screen bg-[#23272a] text-white font-sans">
      {/* Header */}
      <header className="bg-[#2c2f33] border-b border-[#1e2124] py-6 px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#5865f2] flex items-center justify-center text-2xl font-bold select-none">
            SJ
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Scary Juan</h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="w-2.5 h-2.5 rounded-full bg-green-400 transition-opacity duration-700"
                style={{ opacity: pulse ? 1 : 0.4 }}
              />
              <span className="text-green-400 text-sm font-medium">Online</span>
            </div>
          </div>
          <div className="ml-auto text-right hidden sm:block">
            <p className="text-[#b9bbbe] text-sm">Total Commands</p>
            <p className="text-3xl font-bold text-[#5865f2]">{TOTAL_COMMANDS}</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        {/* Quick stats */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Music", value: "7 cmds", icon: "🎵" },
            { label: "XP System", value: "Active", icon: "⭐" },
            { label: "Games", value: "2 cmds", icon: "🎮" },
            { label: "Help", value: "Auto-updating", icon: "📋" },
          ].map((s) => (
            <div key={s.label} className="bg-[#2c2f33] rounded-xl p-4 border border-[#1e2124]">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-white font-semibold">{s.value}</div>
              <div className="text-[#b9bbbe] text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </section>

        {/* Commands */}
        <section>
          <h2 className="text-xl font-bold mb-4 text-[#dcddde]">All Commands</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {COMMANDS.map((cat) => (
              <div key={cat.category} className="bg-[#2c2f33] rounded-xl p-5 border border-[#1e2124]">
                <h3 className="font-bold text-white mb-3">{cat.category}</h3>
                <div className="flex flex-wrap gap-2">
                  {cat.commands.map((cmd) => (
                    <span
                      key={cmd}
                      className="bg-[#40444b] text-[#dcddde] text-xs font-mono px-2 py-1 rounded"
                    >
                      {cmd}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
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

      <footer className="text-center text-[#72767d] text-xs py-6">
        Scary Juan Bot • Running 24/7
      </footer>
    </div>
  );
}
