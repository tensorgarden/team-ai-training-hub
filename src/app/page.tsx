import { demoTeamMembers, demoPromptTemplates, demoTrainingModules, demoUsageLogs, demoAdoptionMetrics } from "@/lib/demo-data";
import type { TeamMember, PromptTemplate, TrainingModule, UsageLog } from "@/lib/types";

// --- Reusable components ---

function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "green" | "red" | "amber" | "blue" | "purple" | "indigo" }) {
  const tones: Record<string, string> = {
    slate: "border-slate-200 bg-white text-slate-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-red-200 bg-red-50 text-red-700",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    purple: "border-purple-200 bg-purple-50 text-purple-700",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
  };
  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone] || tones.slate}`}>{children}</span>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur ${className}`}>{children}</section>;
}

function ProgressBar({ value, color = "indigo" }: { value: number; color?: string }) {
  const colors: Record<string, string> = { indigo: "bg-indigo-600", emerald: "bg-emerald-600", amber: "bg-amber-500", red: "bg-red-500", blue: "bg-blue-600" };
  return <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className={`h-full rounded-full ${colors[color] || colors.indigo}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>;
}

function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = { completed: "bg-emerald-400", in_progress: "bg-amber-400", not_started: "bg-slate-300", positive: "bg-emerald-400", neutral: "bg-slate-400", negative: "bg-red-400" };
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${map[status] || "bg-slate-400"}`} />;
}

function StatCard({ label, value, tone = "slate" }: { label: string; value: string; tone?: string }) {
  const borders: Record<string, string> = { slate: "border-l-slate-300", green: "border-l-emerald-300", amber: "border-l-amber-300", red: "border-l-red-300", blue: "border-l-blue-300", indigo: "border-l-indigo-300", purple: "border-l-purple-300" };
  return (
    <div className={`rounded-2xl bg-white/90 p-5 shadow-sm border-l-4 ${borders[tone] || borders.slate}`}>
      <div className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function findMember(id: string): TeamMember | undefined { return demoTeamMembers.find(m => m.id === id); }

// --- Hero stat row ---

function HeroStats() {
  const m = demoAdoptionMetrics;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <StatCard label="Team Size" value={String(m.totalTeamMembers)} tone="indigo" />
      <StatCard label="Prompts Used" value={String(m.totalPromptsUsed)} tone="blue" />
      <StatCard label="Adoption Rate" value={`${m.averageAdoptionScore}%`} tone="green" />
      <StatCard label="Training Done" value={`${m.overallTrainingCompletion}%`} tone="amber" />
    </div>
  );
}

// --- Prompt template library ---

function PromptCard({ template }: { template: PromptTemplate }) {
  const categoryTones = {
    sales: "green", marketing: "purple", support: "blue", engineering: "indigo",
    hr: "amber", productivity: "slate", data_analysis: "red", creative: "purple"
  } as const;
  const creator = findMember(template.createdBy);
  return (
    <div className="rounded-2xl bg-white/90 p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge tone={categoryTones[template.category] || "slate"}>{template.category}</Badge>
          <span className="text-xs text-slate-400">{template.usageCount} uses</span>
        </div>
        <span className="text-amber-500 text-sm font-semibold">{"★".repeat(Math.round(template.averageRating))}{"☆".repeat(5 - Math.round(template.averageRating))}</span>
      </div>
      <h3 className="font-bold text-slate-900 mb-1">{template.title}</h3>
      <p className="text-sm text-slate-500 mb-3 line-clamp-2">{template.description}</p>
      <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2 mb-3 line-clamp-2 font-mono">{template.promptText}</p>
      <div className="flex items-center justify-between">
        <div className="flex gap-1 flex-wrap">
          {template.tags.map(t => <span key={t} className="text-xs text-slate-400 bg-slate-100 rounded-md px-2 py-0.5">{t}</span>)}
        </div>
        <span className="text-xs text-slate-400">by {creator?.fullName || template.createdBy}</span>
      </div>
    </div>
  );
}

function PromptLibrary() {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900">Prompt Template Library</h2>
        <Badge tone="indigo">{demoPromptTemplates.length} templates</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {demoPromptTemplates.map(pt => <PromptCard key={pt.id} template={pt} />)}
      </div>
    </Card>
  );
}

// --- Team adoption progress ---

function AdoptionRow({ member }: { member: TeamMember }) {
  const color = member.adoptionScore >= 85 ? "emerald" : member.adoptionScore >= 65 ? "blue" : member.adoptionScore >= 40 ? "amber" : "red";
  const benchmarkGap = member.adoptionScore - member.roleBenchmark;
  const benchmarkLabel = benchmarkGap >= 0 ? `+${benchmarkGap} above role target` : `${Math.abs(benchmarkGap)} below role target`;
  const benchmarkTone = benchmarkGap >= 0 ? "text-emerald-600" : "text-amber-600";
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-b-0">
      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex-shrink-0">
        {member.avatarInitials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-1">
          <span className="font-semibold text-sm text-slate-900 truncate">{member.fullName}</span>
          <span className="text-xs text-slate-500">{member.department}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1"><ProgressBar value={member.adoptionScore} color={color} /></div>
          <span className="text-xs font-semibold text-slate-700 w-8 text-right">{member.adoptionScore}%</span>
        </div>
        <div className="flex justify-between mt-1 text-xs text-slate-400">
          <span>{member.promptsUsed} prompts</span>
          <span>{member.trainingCompleted}/{member.totalModules} modules</span>
        </div>
        <div className="mt-1 text-xs text-slate-500">
          Role target {member.roleBenchmark}% · <span className={`font-semibold ${benchmarkTone}`}>{benchmarkLabel}</span>
        </div>
      </div>
    </div>
  );
}

function TeamAdoption() {
  return (
    <Card>
      <h2 className="text-lg font-bold text-slate-900 mb-4">Team Adoption</h2>
      <div>
        {[...demoTeamMembers].sort((a, b) => b.adoptionScore - a.adoptionScore).map(m => <AdoptionRow key={m.id} member={m} />)}
      </div>
    </Card>
  );
}

// --- Training modules ---

function TrainingModuleCard({ module }: { module: TrainingModule }) {
  const statusColor = module.completionRate >= 80 ? "emerald" : module.completionRate >= 50 ? "amber" : "red";
  const diffTones = { beginner: "green", intermediate: "blue", advanced: "purple" } as const;
  return (
    <div className="rounded-2xl bg-white/90 p-5 shadow-sm border border-slate-100">
      <div className="flex items-start justify-between mb-2">
        <Badge tone={diffTones[module.difficulty] || "slate"}>{module.difficulty}</Badge>
        <span className="text-xs text-slate-400">{module.durationMinutes} min</span>
      </div>
      <h3 className="font-bold text-slate-900 mb-1">{module.title}</h3>
      <p className="text-sm text-slate-500 mb-3">{module.description}</p>
      <div className="mb-3 space-y-2 rounded-xl bg-indigo-50/70 p-3 text-xs text-slate-600">
        <p><span className="font-semibold text-indigo-700">Practice lab:</span> {module.practiceScenario}</p>
        <p><span className="font-semibold text-indigo-700">Capability check:</span> {module.capabilityOutcome}</p>
      </div>
      <ProgressBar value={module.completionRate} color={statusColor} />
      <div className="flex justify-between mt-2 text-xs text-slate-400">
        <span>{module.completedCount}/{module.enrolledCount} completed</span>
        <span>{module.lessons} lessons</span>
      </div>
    </div>
  );
}

function TrainingModules() {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900">Training Modules</h2>
        <Badge tone="amber">{demoTrainingModules.length} modules</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {demoTrainingModules.map(tm => <TrainingModuleCard key={tm.id} module={tm} />)}
      </div>
    </Card>
  );
}

// --- Usage log ---

function UsageLogRow({ log }: { log: UsageLog }) {
  const member = findMember(log.memberId);
  const template = log.promptTemplateId ? demoPromptTemplates.find(pt => pt.id === log.promptTemplateId) : null;
  const channelIcon: Record<string, string> = { chatgpt: "🤖", claude: "🧠", api: "⚡", copilot: "💻" };
  return (
    <div className="flex gap-3 items-start py-3 border-b border-slate-100 last:border-b-0">
      <span className="mt-1.5"><StatusDot status={log.feedback} /></span>
      <div className="flex-1">
        <div className="flex justify-between">
          <span className="font-semibold text-sm text-slate-900">{member?.fullName || log.memberId}</span>
          <span className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <p className="text-sm text-slate-600 mt-0.5">{log.promptSummary}</p>
        <div className="flex gap-2 mt-1">
          <span className="text-xs text-slate-400">{channelIcon[log.channel] || "?"} {log.channel}</span>
          {template && <Badge tone="slate">{template.title}</Badge>}
          <span className="text-xs text-slate-400">{log.tokensUsed.toLocaleString()} tokens</span>
        </div>
      </div>
    </div>
  );
}

function UsageFeed() {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900">Recent Prompt Usage</h2>
        <Badge tone="blue">{demoUsageLogs.length} entries</Badge>
      </div>
      <div>{demoUsageLogs.map(ul => <UsageLogRow key={ul.id} log={ul} />)}</div>
    </Card>
  );
}

// --- Leaderboard ---

function LeaderboardCard({ member, rank }: { member: TeamMember; rank: number }) {
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-b-0">
      <div className="w-8 text-center text-lg font-bold text-slate-400">{rank <= 3 ? medals[rank - 1] : `#${rank}`}</div>
      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex-shrink-0">
        {member.avatarInitials}
      </div>
      <div className="flex-1">
        <div className="font-semibold text-sm text-slate-900">{member.fullName}</div>
        <div className="text-xs text-slate-500">{member.department}</div>
      </div>
      <div className="text-right">
        <div className="font-bold text-slate-800">{member.promptsUsed.toLocaleString()}</div>
        <div className="text-xs text-slate-400">prompts</div>
      </div>
      <div className="text-right">
        <div className="font-bold text-slate-800">{member.adoptionScore}%</div>
        <div className="text-xs text-slate-400">adoption</div>
      </div>
    </div>
  );
}

function TeamLeaderboard() {
  const ranked = [...demoTeamMembers].sort((a, b) => b.promptsUsed - a.promptsUsed);
  return (
    <Card>
      <h2 className="text-lg font-bold text-slate-900 mb-4">Team Leaderboard</h2>
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex">
        <div className="w-8 text-center">#</div>
        <div className="w-10" />
        <div className="flex-1">Member</div>
        <div className="w-20 text-right">Prompts</div>
        <div className="w-20 text-right">Score</div>
      </div>
      <div>{ranked.map((m, i) => <LeaderboardCard key={m.id} member={m} rank={i + 1} />)}</div>
    </Card>
  );
}

// --- Main page ---

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 px-6 py-8 font-sans text-slate-900 antialiased">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Team AI Training Hub</h1>
        <p className="mt-1 text-sm text-slate-500">Prompt library · adoption tracking · training modules · usage analytics</p>
      </header>

      {/* Stat row */}
      <HeroStats />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PromptLibrary />
          <TrainingModules />
          <UsageFeed />
        </div>
        <div className="space-y-6">
          <TeamAdoption />
          <TeamLeaderboard />
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-slate-400">
        Team AI Training Hub · Portfolio demonstration · All data is fictional · No production keys or network calls
      </footer>
    </div>
  );
}
