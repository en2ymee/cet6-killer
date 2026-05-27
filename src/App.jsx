import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
} from "react-router-dom";
import {
  GraduationCap,
  BookOpen,
  FileText,
  Lightbulb,
  Heart,
  Clock,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import Vocabulary from "./pages/Vocabulary";
import Exam from "./pages/Exam";
import PastPapers from "./pages/PastPapers";
import ExamRoom from "./pages/ExamRoom";
import Grammar from "./pages/Grammar";
import Profile from "./pages/Profile";

const CET6_EXAM_DATE = new Date("2026-06-14T09:00:00");

function countdownTo(target) {
  const now = new Date();
  const diff = target - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
  };
}

const navItems = [
  { to: "/vocabulary", label: "背单词", icon: BookOpen },
  { to: "/papers", label: "真题模考", icon: FileText },
  { to: "/grammar", label: "考点归纳", icon: Lightbulb },
  { to: "/profile", label: "我的错题", icon: Heart },
];

const featureCards = [
  {
    to: "/vocabulary",
    icon: BookOpen,
    title: "背单词",
    desc: "科学记忆，按考频分级掌握六级核心词汇",
    color: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50",
  },
  {
    to: "/papers",
    icon: FileText,
    title: "真题模考",
    desc: "历年真题实战演练，精准自测查漏补缺",
    color: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
  },
  {
    to: "/grammar",
    icon: Lightbulb,
    title: "考点归纳",
    desc: "高频语法与题型技巧系统梳理",
    color: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50",
  },
  {
    to: "/profile",
    icon: Heart,
    title: "我的错题",
    desc: "自动收录错题，针对性强化薄弱环节",
    color: "from-rose-500 to-pink-500",
    bg: "bg-rose-50",
  },
];

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2 group">
          <GraduationCap className="w-7 h-7 text-indigo-600 group-hover:scale-110 transition-transform" />
          <span className="text-xl font-bold text-slate-800 tracking-tight">
            CET-6 <span className="text-indigo-600">备考</span>
          </span>
        </NavLink>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}

function HomePage() {
  const [timeLeft, setTimeLeft] = useState(() => countdownTo(CET6_EXAM_DATE));

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(countdownTo(CET6_EXAM_DATE)), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-4">
              高效备考，稳过
              <span className="text-yellow-300">六级</span>
            </h1>
            <p className="text-lg md:text-xl text-indigo-100 mb-8 max-w-xl">
              科学的词汇记忆 · 历年真题模考 · 智能错题收录 — 一站式搞定 CET-6
            </p>
            <div className="flex flex-wrap gap-3">
              <NavLink
                to="/vocabulary"
                className="inline-flex items-center gap-2 bg-white text-indigo-600 font-semibold px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg"
              >
                开始背单词
                <ArrowRight className="w-5 h-5" />
              </NavLink>
              <NavLink
                to="/papers"
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/30 font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors"
              >
                真题模考
                <ChevronRight className="w-5 h-5" />
              </NavLink>
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div className="relative max-w-6xl mx-auto px-4 pb-12">
          <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-6 py-4">
            <Clock className="w-6 h-6 text-yellow-300" />
            <span className="text-sm font-medium text-indigo-100">
              距离 2026年6月 CET-6 考试还有
            </span>
            <div className="flex items-center gap-2">
              {[
                { val: timeLeft.days, label: "天" },
                { val: timeLeft.hours, label: "时" },
                { val: timeLeft.minutes, label: "分" },
              ].map(({ val, label }) => (
                <span key={label} className="text-2xl font-bold text-yellow-300 tabular-nums">
                  {val}
                  <span className="text-sm font-normal text-indigo-200 ml-0.5">{label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 text-center mb-10">
          选择你的备考路径
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featureCards.map(({ to, icon: Icon, title, desc, color, bg }) => (
            <NavLink
              key={to}
              to={to}
              className="group block bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-transparent hover:-translate-y-1 transition-all duration-200"
            >
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${color} text-white mb-4 shadow-md group-hover:scale-110 transition-transform`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1.5">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </NavLink>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-slate-400">
          CET-6 备考助手 — 愿你一次通过
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/vocabulary" element={<Vocabulary />} />
        <Route path="/papers" element={<PastPapers />} />
        <Route path="/exam/:id" element={<ExamRoom />} />
        <Route path="/exam" element={<Exam />} />
        <Route path="/grammar" element={<Grammar />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}
