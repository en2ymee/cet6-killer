import { useState, useEffect, useRef } from "react";
import {
  Clock,
  Headphones,
  BookOpen,
  PenLine,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trophy,
} from "lucide-react";
import { examData } from "../mockData";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const TOTAL_TIME = 130 * 60; // 130 minutes in seconds

export default function Exam() {
  const exam = examData[0];
  const allQuestions = [
    ...exam.listening.questions.map((q) => ({ ...q, section: "listening" })),
    ...exam.reading.questions.map((q) => ({ ...q, section: "reading" })),
  ];

  const [answers, setAnswers] = useState({});
  const [essay, setEssay] = useState("");
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const timerRef = useRef(null);

  // ---- Timer ----
  useEffect(() => {
    if (isStarted && !isSubmitted && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            handleSubmit();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isStarted, isSubmitted]);

  // ---- Handlers ----
  function handleStart() {
    setIsStarted(true);
  }

  function selectAnswer(questionId, option) {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  }

  function handleSubmit() {
    clearInterval(timerRef.current);
    setIsSubmitted(true);
    setShowSubmitConfirm(false);
  }

  function getScore() {
    let correct = 0;
    allQuestions.forEach((q) => {
      if (answers[q.id] === q.answer) correct++;
    });
    return { correct, total: allQuestions.length };
  }

  function getOptionStyle(q, option) {
    if (!isSubmitted) return "";

    const selected = answers[q.id];
    const key = option.charAt(0); // "A", "B", "C", "D"

    if (key === q.answer) {
      return "border-green-500 bg-green-50 text-green-800 ring-1 ring-green-400";
    }
    if (key === selected && key !== q.answer) {
      return "border-red-400 bg-red-50 text-red-800 ring-1 ring-red-400";
    }
    return "opacity-50";
  }

  function getOptionIcon(q, option) {
    if (!isSubmitted) return null;

    const selected = answers[q.id];
    const key = option.charAt(0);

    if (key === q.answer) {
      return <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />;
    }
    if (key === selected && key !== q.answer) {
      return <XCircle className="w-4 h-4 text-red-500 ml-auto" />;
    }
    return null;
  }

  const unansweredCount =
    allQuestions.length - Object.keys(answers).length;

  // ---- Start screen ----
  if (!isStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 mb-6 shadow-lg">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">{exam.title}</h1>
          <p className="text-slate-500 mb-2">{exam.year} · 130 分钟</p>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 text-left">
            <h3 className="font-bold text-slate-700 mb-3">试卷结构</h3>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-amber-500" />
                听力理解 — {exam.listening.questions.length} 题
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                阅读理解 — {exam.reading.questions.length} 题
              </div>
              <div className="flex items-center gap-2">
                <PenLine className="w-4 h-4 text-emerald-500" />
                写作 — 1 题
              </div>
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-full bg-amber-600 text-white font-bold py-3.5 rounded-xl hover:bg-amber-700 transition-colors shadow-lg text-lg"
          >
            开始考试
          </button>
        </div>
      </div>
    );
  }

  // ---- Submitted: result screen ----
  if (isSubmitted) {
    const { correct, total } = getScore();

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          {/* Score banner */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 mb-8 text-center">
            <Trophy className="w-14 h-14 mx-auto text-yellow-500 mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">考试结束</h1>
            <p className="text-slate-500 mb-6">你的答案已提交</p>

            <div className="flex items-center justify-center gap-8 mb-6">
              <div>
                <div className="text-4xl font-extrabold text-indigo-600">
                  {correct}/{total}
                </div>
                <div className="text-sm text-slate-400 mt-1">选择题正确</div>
              </div>
              <div className="w-px h-12 bg-slate-200" />
              <div>
                <div className="text-4xl font-extrabold text-amber-600">
                  {total > 0 ? Math.round((correct / total) * 100) : 0}%
                </div>
                <div className="text-sm text-slate-400 mt-1">正确率</div>
              </div>
              <div className="w-px h-12 bg-slate-200" />
              <div>
                <div className="text-4xl font-extrabold text-slate-600">
                  {formatTime(TOTAL_TIME - timeLeft)}
                </div>
                <div className="text-sm text-slate-400 mt-1">用时</div>
              </div>
            </div>

            <p className="text-sm text-slate-400">
              写作部分需人工批改，暂不计入总分
            </p>
          </div>

          {/* Question review */}
          <h2 className="text-lg font-bold text-slate-700 mb-4">答题回顾</h2>

          {/* Listening review */}
          <SectionHeader icon={Headphones} title="听力理解" color="text-amber-500" />
          {exam.listening.questions.map((q) => (
            <QuestionReview
              key={q.id}
              q={q}
              selected={answers[q.id]}
              getOptionStyle={getOptionStyle}
              getOptionIcon={getOptionIcon}
            />
          ))}

          {/* Reading review */}
          <SectionHeader icon={BookOpen} title="阅读理解" color="text-blue-500" />
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
            <p className="text-sm text-slate-500 font-medium mb-2">阅读文章：</p>
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {exam.reading.passage}
            </p>
          </div>
          {exam.reading.questions.map((q) => (
            <QuestionReview
              key={q.id}
              q={q}
              selected={answers[q.id]}
              getOptionStyle={getOptionStyle}
              getOptionIcon={getOptionIcon}
            />
          ))}

          {/* Writing review */}
          <SectionHeader icon={PenLine} title="写作" color="text-emerald-500" />
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-8">
            <p className="font-medium text-slate-800 mb-1">{exam.writing.topic}</p>
            <p className="text-sm text-slate-500 mb-3">{exam.writing.requirement}</p>
            <div className="bg-slate-50 rounded-lg p-4 min-h-[100px] text-sm text-slate-700 whitespace-pre-wrap">
              {essay || "(未作答)"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- Main exam UI ----
  return (
    <div className="h-screen flex flex-col bg-slate-100">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 z-30 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-slate-800">{exam.title}</h1>
          <p className="text-xs text-slate-400">{exam.year}</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-lg font-bold ${
              timeLeft < 300
                ? "bg-red-50 text-red-600 animate-pulse"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>

          {/* Submit button */}
          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white font-medium px-5 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
          >
            <Send className="w-4 h-4" />
            提交试卷
          </button>
        </div>
      </div>

      {/* Submit confirmation modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">确认提交？</h3>
            <p className="text-sm text-slate-500 mb-1">
              提交后将无法修改答案，倒计时将停止。
            </p>
            {unansweredCount > 0 && (
              <p className="text-sm text-red-500 font-medium mb-4">
                还有 {unansweredCount} 道选择题未作答！
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                继续答题
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
              >
                确认提交
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content: left (passage) + right (questions) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel — Reading passage */}
        <div className="hidden lg:flex flex-col w-[40%] border-r border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
            <h2 className="text-sm font-bold text-slate-600 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              阅读材料
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="prose prose-sm max-w-none">
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                {exam.reading.section}
              </h3>
              <p className="text-slate-600 leading-7 whitespace-pre-line text-base">
                {exam.reading.passage}
              </p>
            </div>
          </div>
        </div>

        {/* Right panel — Questions */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-8">
            {/* ---- Listening Section ---- */}
            <SectionHeader
              icon={Headphones}
              title={`听力理解 · ${exam.listening.section}`}
              color="text-amber-500"
            />

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500 mb-3">
                请播放音频后作答（可上传听力文件替代此占位音频）：
              </p>
              <audio controls className="w-full mb-4" src={exam.listening.audioSrc || undefined}>
                Your browser does not support the audio element.
              </audio>

              {exam.listening.questions.map((q) => (
                <QuestionCard
                  key={q.id}
                  q={q}
                  selected={answers[q.id]}
                  onSelect={selectAnswer}
                  isSubmitted={false}
                />
              ))}
            </div>

            {/* ---- Reading Section ---- */}
            <SectionHeader
              icon={BookOpen}
              title="阅读理解"
              color="text-blue-500"
            />

            {/* Mobile: inline passage */}
            <div className="lg:hidden bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500 font-medium mb-2">阅读文章：</p>
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                {exam.reading.passage}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              {exam.reading.questions.map((q) => (
                <QuestionCard
                  key={q.id}
                  q={q}
                  selected={answers[q.id]}
                  onSelect={selectAnswer}
                  isSubmitted={false}
                />
              ))}
            </div>

            {/* ---- Writing Section ---- */}
            <SectionHeader
              icon={PenLine}
              title="写作"
              color="text-emerald-500"
            />

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-800 mb-1">{exam.writing.topic}</h3>
              <p className="text-sm text-slate-500 mb-4">{exam.writing.requirement}</p>
              <textarea
                className="w-full min-h-[200px] border border-slate-200 rounded-xl p-4 text-sm text-slate-700 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow"
                placeholder="在此输入你的作文..."
                value={essay}
                onChange={(e) => setEssay(e.target.value)}
                disabled={isSubmitted}
              />
              <p className="text-xs text-slate-400 mt-2 text-right">
                {essay.length} 字符
              </p>
            </div>

            {/* Bottom spacer for comfortable scrolling */}
            <div className="h-16" />
          </div>
        </div>
      </div>

      {/* Floating submit on mobile */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowSubmitConfirm(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white font-bold px-6 py-3.5 rounded-full shadow-xl hover:bg-indigo-700 transition-all active:scale-95"
        >
          <Send className="w-5 h-5" />
          提交
          {unansweredCount > 0 && (
            <span className="bg-white text-indigo-600 text-xs px-2 py-0.5 rounded-full">
              {unansweredCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

// ---- Sub-components ----

function SectionHeader({ icon: Icon, title, color }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-5 h-5 ${color}`} />
      <h2 className="text-base font-bold text-slate-700">{title}</h2>
    </div>
  );
}

function QuestionCard({ q, selected, onSelect, isSubmitted }) {
  return (
    <div className="mb-5 last:mb-0">
      <p className="text-sm font-semibold text-slate-800 mb-3">
        {q.id}. {q.question}
      </p>
      <div className="space-y-2">
        {q.options.map((option) => {
          const key = option.charAt(0);
          const isSelected = selected === key;
          const baseStyle = isSubmitted
            ? ""
            : isSelected
              ? "border-indigo-400 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-300"
              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50";
          const resultStyle = isSubmitted ? getResultStyle(q, key, selected) : "";

          return (
            <button
              key={key}
              onClick={() => onSelect(q.id, key)}
              disabled={isSubmitted}
              className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all ${baseStyle} ${resultStyle} ${
                isSubmitted ? "cursor-default" : "cursor-pointer"
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isSelected && !isSubmitted
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {key}
              </span>
              <span className="flex-1">{option.slice(3)}</span>
              {isSubmitted && getResultIcon(q, key, selected)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QuestionReview({ q, selected, getOptionStyle, getOptionIcon }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
      <p className="text-sm font-semibold text-slate-800 mb-3">
        {q.id}. {q.question}
      </p>
      <div className="space-y-2">
        {q.options.map((option) => {
          const key = option.charAt(0);
          const style = getOptionStyle(q, option);
          const icon = getOptionIcon(q, option);

          return (
            <div
              key={key}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm ${style}`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  key === q.answer
                    ? "bg-green-500 text-white"
                    : key === selected && key !== q.answer
                      ? "bg-red-500 text-white"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {key}
              </span>
              <span className="flex-1">{option.slice(3)}</span>
              {icon}
            </div>
          );
        })}
      </div>
      {!selected && (
        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          未作答
        </p>
      )}
    </div>
  );
}

// Helper functions for post-submit styling
function getResultStyle(q, key, selected) {
  if (key === q.answer) {
    return "border-green-500 bg-green-50 text-green-800 ring-1 ring-green-400";
  }
  if (key === selected && key !== q.answer) {
    return "border-red-400 bg-red-50 text-red-800 ring-1 ring-red-400";
  }
  return "opacity-50";
}

function getResultIcon(q, key, selected) {
  if (key === q.answer) {
    return <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />;
  }
  if (key === selected && key !== q.answer) {
    return <XCircle className="w-4 h-4 text-red-500 ml-auto" />;
  }
  return null;
}
