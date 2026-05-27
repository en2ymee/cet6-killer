import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Clock, Headphones, BookOpen, PenLine, Send, Languages,
  CheckCircle, XCircle, AlertTriangle, Trophy, ArrowLeft,
  Sparkles, Copy, Loader2, TrendingUp, Zap, RotateCcw,
} from "lucide-react";
const DEEPSEEK_API_KEY =
  import.meta.env.VITE_DEEPSEEK_API_KEY || "sk-15f5c364124e4a02af3b50daa049f892";

// ========================
//    HELPERS
// ========================

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function wordCount(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ========================
//    DEEPSEEK API
// ========================

function buildWritingPrompt(essay, topic, requirement) {
  return `You are an expert CET-6 (College English Test Band 6) essay examiner with 20 years of grading experience. Grade the following student essay.

ESSAY TOPIC: ${topic}
REQUIREMENT: ${requirement}

STUDENT ESSAY:
${essay || "(empty - no submission)"}

Evaluate this essay and provide detailed, constructive feedback. The maximum score is 15 points. Consider: task response, coherence & cohesion, lexical resource, and grammatical range & accuracy.

CRITICAL INSTRUCTION: Your entire response must be a single, valid JSON object. Do NOT wrap it in \`\`\`json\`\`\` code fences or any other markdown formatting. Output pure, raw JSON only. The JSON must have exactly these fields:
- score (integer, 0-15)
- generalComment (string, a thoughtful bilingual Chinese+English comment noting both strengths and weaknesses)
- errors (array of objects, each with: original, corrected, reason — all strings)
- highlights (array of strings, each suggesting a more advanced word/phrase/sentence pattern that would boost the score)
- modelEssay (string, a polished high-score model essay on the same topic, 150-200 words)`;
}

function buildTranslationPrompt(userTranslation, sourceText, reference) {
  return `You are an expert CET-6 translation examiner. Grade the following student's Chinese-to-English translation.

SOURCE TEXT (Chinese):
${sourceText}

REFERENCE TRANSLATION:
${reference}

STUDENT TRANSLATION:
${userTranslation || "(empty - no submission)"}

Evaluate this translation and provide detailed feedback. The maximum score is 15 points. Consider: accuracy (faithfulness to the source), completeness, language quality, and naturalness of expression.

CRITICAL INSTRUCTION: Your entire response must be a single, valid JSON object. Do NOT wrap it in \`\`\`json\`\`\` code fences or any other markdown formatting. Output pure, raw JSON only. The JSON must have exactly these fields:
- score (integer, 0-15)
- generalComment (string, a thoughtful bilingual Chinese+English comment on translation quality)
- errors (array of objects, each with: original, corrected, reason — all strings. Focus on mistranslations, grammar errors, and awkward phrasing)
- highlights (array of strings, each suggesting better word choices or sentence structures for the translation)
- modelEssay (string, a polished reference translation that reads naturally in English)`;
}

async function callDeepSeekAPI(promptText) {
  const url = "https://api.deepseek.com/v1/chat/completions";

  const payload = {
    model: "deepseek-chat",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You are a professional CET-6 examiner. You always respond with valid, parseable JSON only — never with markdown formatting or extra text outside the JSON object.",
      },
      {
        role: "user",
        content: promptText,
      },
    ],
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`DeepSeek API error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Empty response from DeepSeek API");

    // Clean potential markdown wrappers just in case
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") throw new Error("请求超时，请检查网络后重试");
    throw err;
  }
}

// ========================
//    MOCK FALLBACK
// ========================

function mockGrade(essay, topic) {
  const wc = wordCount(essay);
  const isTooShort = wc < 80;
  const topicLower = (topic || "").toLowerCase();

  const mockDB = {
    remote: {
      errors: [
        { original: "Many people works from home", corrected: "Many people work from home", reason: "主谓一致错误：people 为复数主语，动词需用原形 work" },
        { original: "It bring many benefits", corrected: "It brings many benefits", reason: "主谓一致：第三人称单数主语需搭配动词 -s 形式" },
        { original: "Employees can more flexible", corrected: "Employees can be more flexible", reason: "缺少系动词 be；flexible 为形容词，需与 be 动词连用构成系表结构" },
      ],
      highlights: [
        "💡 将 'work from home' 替换为更正式的表达 'telecommute' 或 'work remotely'",
        "💡 使用 'blur the boundary between professional and personal life' 来描述工作与生活界限的模糊",
        "💡 尝试在论证中插入过渡副词 'nevertheless', 'conversely', 'moreover' 以增强逻辑连贯性",
      ],
      modelEssay: `The debate over remote work versus traditional office environments has intensified in recent years. While both modes offer distinct advantages, I believe a hybrid approach represents the optimal solution for most organizations.

Proponents of remote work highlight its unparalleled flexibility. Employees can design their schedules around personal peak productivity hours, eliminating grueling commutes and reclaiming valuable time for family and self-care. Companies benefit from reduced real estate costs and access to a global talent pool. Studies consistently show that remote workers report higher job satisfaction and, in many cases, demonstrate increased productivity.

However, the traditional office environment retains irreplaceable merits. Face-to-face interaction fosters spontaneous collaboration and creativity that video calls struggle to replicate. Informal mentorship — the kind that occurs in corridors and during coffee breaks — plays a crucial role in junior employees' career development. Moreover, a clear physical separation between workspace and living space helps maintain psychological boundaries and prevent burnout.

In my view, the most effective model combines the best of both worlds. A hybrid arrangement with designated office days for team collaboration and remote days for focused independent work maximizes both productivity and well-being. The key lies in intentionality — organizations must design policies thoughtfully rather than defaulting to either extreme.`,
    },
    space: {
      errors: [
        { original: "China have made great progress", corrected: "China has made great progress", reason: "主谓一致：China 作为国家名称视作单数，助动词用 has" },
        { original: "The scientists works very hard", corrected: "The scientists work very hard", reason: "主谓一致：复数主语 scientists 动词用原形 work" },
        { original: "It worth the investment", corrected: "It is worth the investment", reason: "worth 是形容词，需与系动词 be 搭配使用" },
      ],
      highlights: [
        "💡 将 'make progress' 升级为 'achieve breakthroughs' 或 'reach significant milestones'",
        "💡 用 'embody the wisdom and dedication of...' 替代 'show the hard work of...'，学术感更强",
        "💡 尝试使用倒装结构 'Not only does space exploration advance science, but it also...' 提升句型多样性",
      ],
      modelEssay: `Space exploration represents one of humanity's most ambitious undertakings. While critics question the enormous financial costs involved, I firmly believe that the benefits far outweigh the expenditures, making it a worthy investment for our collective future.

The financial argument against space programs is not without merit. A single Mars mission costs billions — resources that could theoretically fund healthcare, education, or poverty alleviation. In developing nations where basic infrastructure remains inadequate, such spending priorities deserve serious scrutiny. These concerns highlight the importance of balanced resource allocation rather than blanket dismissal of space exploration.

On the other hand, the returns from space programs extend far beyond scientific discovery. Satellite technology — a direct product of space research — now underpins weather forecasting, global communications, and navigation systems that billions depend upon daily. Medical research in microgravity has yielded breakthroughs in drug development and materials science. Furthermore, space exploration inspires young people to pursue STEM careers, driving broader innovation that benefits the entire economy.

In conclusion, space exploration is not an extravagance but a long-term investment in human progress. The challenge lies in striking a wise balance — advancing our reach into the cosmos while addressing pressing needs here on Earth.`,
    },
    lifelong: {
      errors: [
        { original: "Everyone need to learn new skills", corrected: "Everyone needs to learn new skills", reason: "主谓一致：everyone 视为单数不定代词，动词需加 -s" },
        { original: "People must to adapt changes", corrected: "People must adapt to changes", reason: "情态动词 must 后接动词原形；adapt 表示'适应'时需搭配介词 to" },
        { original: "Learning make us more competitive", corrected: "Learning makes us more competitive", reason: "动名词短语作主语视为单数，动词加 -s" },
      ],
      highlights: [
        "💡 将 'important' 升级为 'indispensable', 'paramount', 或 'pivotal'，词汇更具学术分量",
        "💡 使用 'keep pace with the ever-evolving landscape of...' 表达'与时俱进'，地道且高级",
        "💡 尝试使用分词结构作状语，如 'Faced with fierce competition, individuals must...'",
      ],
      modelEssay: `In today's rapidly evolving digital landscape, lifelong learning has transformed from a personal virtue into an economic imperative. I am convinced that the ability to continuously acquire new knowledge and skills will define successful individuals in the twenty-first century.

The accelerating pace of technological change means that professional skills now have a half-life of merely five years. Jobs that existed a decade ago have disappeared, while entirely new professions — from AI ethics officers to drone traffic controllers — emerge constantly. Those who rest on their initial educational credentials risk obsolescence. Lifelong learning therefore serves not only as career insurance but as the engine of sustained growth and adaptability.

The digital age presents a paradox for learners. While online platforms have democratized access to world-class education, the sheer volume of available information can overwhelm even the most dedicated students. The challenge has shifted from accessing knowledge to curating it effectively. Self-discipline and critical thinking — the ability to distinguish signal from noise — have become more valuable than rote memorization.

My personal learning strategy combines structured and informal approaches. I dedicate daily time to reading industry publications, enroll in structured online courses quarterly, and actively participate in professional communities where peer learning flourishes. Cultivating curiosity and embracing the identity of a perpetual student are, I believe, the surest paths to staying relevant and fulfilled.`,
    },
  };

  let theme = mockDB.remote;
  if (topicLower.includes("space") || topicLower.includes("太空")) theme = mockDB.space;
  else if (topicLower.includes("lifelong") || topicLower.includes("learning") || topicLower.includes("终身")) theme = mockDB.lifelong;

  let errors;
  if (isTooShort) {
    errors = [
      { original: `(字数严重不足: 仅 ${wc} 词)`, corrected: `建议扩充至至少 120–150 词`, reason: `CET-6 作文要求不少于 150 词，当前仅 ${wc} 词，字数不足会大幅扣分。建议从多个角度展开论述，补充具体例证和深入分析。` },
    ];
  } else {
    errors = theme.errors.slice(0, wc < 120 ? 2 : 3);
  }

  const score = isTooShort
    ? Math.min(6, Math.max(3, Math.floor(wc / 20)))
    : Math.min(14, Math.max(8, 8 + Math.floor(Math.random() * 5)));

  const generalComment = isTooShort
    ? `⚠️ 字数严重不足（仅 ${wc} 词），CET-6 要求至少 150 词。建议大幅扩充内容，从多个角度展开论证，并补充具体例证。\n\nYour essay is significantly below the required word count. Substantial expansion with concrete examples and deeper analysis is needed to meet CET-6 standards.`
    : `整体结构清晰，观点表达较为完整。在语法准确性（如主谓一致、时态统一）和词汇丰富度方面仍有提升空间。建议多使用学术词汇和多样化句式来增强文章表现力。继续加油！\n\nThe essay has a clear structure with reasonably developed arguments. Focus on strengthening grammatical accuracy (subject-verb agreement, tense consistency) and incorporating more sophisticated vocabulary and varied sentence patterns for a higher score.`;

  return {
    isMock: true,
    score,
    generalComment,
    errors,
    highlights: theme.highlights,
    modelEssay: theme.modelEssay,
  };
}

function mockGradeTranslation(userText, source) {
  const wc = wordCount(userText);
  const isTooShort = wc < 40;
  const srcLower = (source || "").toLowerCase();

  const errors = isTooShort
    ? [{ original: "(译文过短)", corrected: "建议扩充译文至 60 词以上", reason: `当前仅 ${wc} 词，无法完整覆盖原文含义，会因信息遗漏而扣分` }]
    : [
        { original: userText.slice(0, 60) + (userText.length > 60 ? "..." : ""), corrected: "(建议使用更地道的表达)", reason: "部分表达偏向中式英语，可尝试意译而非逐字直译，使译文更符合英文表达习惯" },
      ];

  if (wc >= 70) {
    errors.push({ original: "(时态/语态可优化)", corrected: "(注意英汉时态差异，适当使用被动语态)", reason: "英语中被动语态使用频率远高于汉语，在科技/正式文体翻译中尤为重要" });
  }

  const highlights = [
    "💡 尝试将长句拆分为 2-3 个短句，使英文表达更清晰流畅",
    "💡 注意英汉主语差异：英语多用物称主语（impersonal subject），汉语多人称主语",
    "💡 适当使用定语从句和分词结构替代独立的简单句，提升译文紧凑度",
  ];

  return {
    isMock: true,
    score: isTooShort ? 5 : Math.min(14, Math.max(7, 8 + Math.floor(Math.random() * 5))),
    generalComment: isTooShort
      ? `⚠️ 译文过短（${wc} 词），无法完整传达原文信息。建议逐句对应翻译，确保信息完整后再润色表达。\n\nThe translation is too short to fully convey the original meaning. Expand it sentence by sentence to ensure completeness.`
      : `翻译基本传达了原文的主要信息，但在语言地道性和表达自然度上仍有提升空间。注意避免逐字直译导致的"中式英语"，多使用符合英文习惯的句式结构。\n\nThe translation captures the main ideas, but work on naturalness. Avoid word-for-word translation and adopt more idiomatic English expressions.`,
    errors,
    highlights,
    modelEssay: "",
  };
}

// ========================
//    SCORE RING
// ========================

function ScoreRing({ score, max = 15, size = 120 }) {
  const pct = Math.round((score / max) * 100);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 80 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-slate-800 tabular-nums">{score}</span>
        <span className="text-xs text-slate-400">/ {max} 分</span>
      </div>
    </div>
  );
}

// ========================
//    AI REPORT CARD
// ========================

function AIReportCard({ label, icon: Icon, result, onRegrade }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = result.modelEssay || "";
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasErrors = result.errors && result.errors.length > 0;
  const hasHighlights = result.highlights && result.highlights.length > 0;
  const hasModelEssay = result.modelEssay && result.modelEssay.trim().length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 px-6 py-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">DeepSeek 批改报告</h3>
              <p className="text-xs text-white/70">{label}</p>
            </div>
          </div>
          {result.isMock && (
            <span className="text-[10px] bg-amber-400/30 text-amber-100 px-2.5 py-1 rounded-full font-medium border border-amber-400/20">
              🧪 Mock 模式
            </span>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Score + Comment */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <ScoreRing score={result.score} />
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-bold text-slate-700 mb-2">📝 名师总评</p>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {result.generalComment}
            </p>
          </div>
        </div>

        {/* Error table */}
        {hasErrors && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-5 bg-red-500 rounded-full" />
              <h4 className="text-sm font-bold text-slate-700">红线纠错</h4>
            </div>
            <div className="overflow-hidden rounded-xl border border-red-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-red-50">
                    <th className="text-left px-4 py-2.5 text-xs font-bold text-red-600 uppercase tracking-wider w-[30%]">
                      <XCircle className="w-3 h-3 inline mr-1" /> 原文错误
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-bold text-emerald-600 uppercase tracking-wider w-[30%]">
                      <CheckCircle className="w-3 h-3 inline mr-1" /> 修正建议
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-[40%]">
                      📖 原因解析
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((err, i) => (
                    <tr key={i} className={`border-t border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                      <td className="px-4 py-3 text-red-700 font-medium text-xs font-mono">{err.original}</td>
                      <td className="px-4 py-3 text-emerald-700 font-medium text-xs font-mono">{err.corrected}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs leading-relaxed">{err.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Highlights */}
        {hasHighlights && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-5 bg-purple-500 rounded-full" />
              <h4 className="text-sm font-bold text-slate-700">亮点推荐</h4>
              <TrendingUp className="w-4 h-4 text-purple-500" />
            </div>
            <div className="bg-purple-50 rounded-xl p-4 space-y-2">
              {result.highlights.map((h, i) => (
                <p key={i} className="text-sm text-purple-800 leading-relaxed">{h}</p>
              ))}
            </div>
          </div>
        )}

        {/* Model essay */}
        {hasModelEssay && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 bg-emerald-500 rounded-full" />
                <h4 className="text-sm font-bold text-slate-700">高分范文</h4>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600">已复制</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-500">一键复制范文</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-emerald-50/50 rounded-xl border border-emerald-100 p-5 max-h-[400px] overflow-y-auto">
              <p className="text-sm text-slate-700 leading-7 whitespace-pre-line font-serif">
                {result.modelEssay}
              </p>
            </div>
          </div>
        )}

        {/* Regrade */}
        <div className="text-center pt-2 border-t border-slate-100">
          <button
            onClick={onRegrade}
            className="text-xs text-slate-400 hover:text-indigo-500 transition-colors underline"
          >
            重新批改
          </button>
        </div>
      </div>
    </div>
  );
}

// ========================
//    AI GRADING BUTTON
// ========================

function AIGradeButton({ onClick, status }) {
  if (status === "loading") {
    return (
      <button
        disabled
        className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold shadow-lg cursor-wait opacity-90"
      >
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">DeepSeek 老师正在逐字批改中，请稍候...</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold shadow-lg hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all active:scale-[0.98]"
    >
      <Sparkles className="w-5 h-5" />
      ✨ 申请 DeepSeek 智能批改
    </button>
  );
}

// ========================
//    SUB-COMPONENTS
// ========================

function SectionHeader({ icon: Icon, title, color }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-5 h-5 ${color}`} />
      <h2 className="text-base font-bold text-slate-700">{title}</h2>
    </div>
  );
}

function QuestionCard({ q, selected, onSelect }) {
  return (
    <div className="mb-5 last:mb-0">
      <p className="text-sm font-semibold text-slate-800 mb-3">{q.id}. {q.question}</p>
      <div className="space-y-2">
        {q.options.map((option) => {
          const key = option.charAt(0);
          const isSelected = selected === key;
          return (
            <button
              key={key}
              onClick={() => onSelect(q.id, key)}
              className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all ${
                isSelected
                  ? "border-indigo-400 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-300"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {key}
              </span>
              <span className="flex-1">{option.slice(3)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QuestionReview({ q, selected }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
      <p className="text-sm font-semibold text-slate-800 mb-3">{q.id}. {q.question}</p>
      <div className="space-y-2">
        {q.options.map((option) => {
          const key = option.charAt(0);
          const isCorrect = key === q.answer;
          const isWrongSelected = key === selected && key !== q.answer;
          return (
            <div
              key={key}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm ${
                isCorrect
                  ? "border-green-500 bg-green-50 text-green-800 ring-1 ring-green-400"
                  : isWrongSelected
                    ? "border-red-400 bg-red-50 text-red-800 ring-1 ring-red-400"
                    : "opacity-50 border-slate-200"
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isCorrect ? "bg-green-500 text-white" : isWrongSelected ? "bg-red-500 text-white" : "bg-slate-100 text-slate-400"
                }`}
              >
                {key}
              </span>
              <span className="flex-1">{option.slice(3)}</span>
              {isCorrect && <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />}
              {isWrongSelected && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
            </div>
          );
        })}
      </div>
      {!selected && (
        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
          <XCircle className="w-3 h-3" /> 未作答 — 正确答案: {q.answer}
        </p>
      )}
    </div>
  );
}

// ========================
//    MAIN COMPONENT
// ========================

export default function ExamRoom() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [papers, setPapers] = useState([]);
  const [isLoadingPapers, setIsLoadingPapers] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    setIsLoadingPapers(true);
    setLoadError(null);
    fetch("/data/past_papers.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setPapers(data);
        setIsLoadingPapers(false);
      })
      .catch((err) => {
        setLoadError(err.message);
        setIsLoadingPapers(false);
      });
  }, []);

  const paper = papers.find((p) => p.id === parseInt(id));

  const allQuestions = paper
    ? [
        ...paper.listening.questions.map((q) => ({ ...q, section: "listening" })),
        ...paper.reading.questions.map((q) => ({ ...q, section: "reading" })),
      ]
    : [];

  const [answers, setAnswers] = useState({});
  const [essay, setEssay] = useState("");
  const [translation, setTranslation] = useState("");
  const [timeLeft, setTimeLeft] = useState(paper ? paper.duration * 60 : 0);
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const timerRef = useRef(null);

  // AI grading states
  const [writingGradeStatus, setWritingGradeStatus] = useState("idle");
  const [writingGradeResult, setWritingGradeResult] = useState(null);
  const [translationGradeStatus, setTranslationGradeStatus] = useState("idle");
  const [translationGradeResult, setTranslationGradeResult] = useState(null);

  const handleGradeWriting = useCallback(async () => {
    setWritingGradeStatus("loading");
    setWritingGradeResult(null);
    try {
      const prompt = buildWritingPrompt(essay, paper.writing.topic, paper.writing.requirement);
      const result = await callDeepSeekAPI(prompt);
      setWritingGradeResult(result);
    } catch {
      await new Promise((r) => setTimeout(r, 1500));
      setWritingGradeResult(mockGrade(essay, paper.writing.topic));
    }
    setWritingGradeStatus("done");
  }, [essay, paper]);

  const handleGradeTranslation = useCallback(async () => {
    setTranslationGradeStatus("loading");
    setTranslationGradeResult(null);
    try {
      const prompt = buildTranslationPrompt(translation, paper.translation.source, paper.translation.reference);
      const result = await callDeepSeekAPI(prompt);
      setTranslationGradeResult(result);
    } catch {
      await new Promise((r) => setTimeout(r, 1500));
      setTranslationGradeResult(mockGradeTranslation(translation, paper.translation.source));
    }
    setTranslationGradeStatus("done");
  }, [translation, paper]);

  // ---- Loading ----
  if (isLoadingPapers) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-slate-700">正在加载试卷...</h2>
          <p className="text-sm text-slate-400">正在准备全真模拟考场，请稍候</p>
        </div>
      </div>
    );
  }

  // ---- Error ----
  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center px-4">
        <div className="text-center max-w-md space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-red-400 to-red-600 shadow-lg">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">试卷加载失败</h2>
          <p className="text-sm text-slate-500">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-md active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            重新加载
          </button>
        </div>
      </div>
    );
  }

  // ---- Not found ----
  if (!paper) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">试卷未找到</h2>
          <button onClick={() => navigate("/papers")} className="text-indigo-600 hover:underline font-medium">
            返回真题列表
          </button>
        </div>
      </div>
    );
  }

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

  const unansweredCount = allQuestions.length - Object.keys(answers).length;
  const hasTranslation = !!paper.translation;

  // ====================
  //    START SCREEN
  // ====================
  if (!isStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center px-4">
        <div className="max-w-lg w-full">
          <button
            onClick={() => navigate("/papers")}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> 返回真题列表
          </button>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 mb-6 shadow-lg">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 mb-1">{paper.title}</h1>
            <p className="text-slate-500 mb-8">{paper.year} · {paper.duration} 分钟 · 全真模拟</p>

            <div className="grid grid-cols-4 gap-3 mb-8">
              {[
                { icon: Headphones, color: "text-amber-600", bg: "bg-amber-50", label: "听力", count: paper.listening.questions.length },
                { icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50", label: "阅读", count: paper.reading.questions.length },
                { icon: PenLine, color: "text-emerald-600", bg: "bg-emerald-50", label: "写作", count: "1" },
                { icon: Languages, color: "text-purple-600", bg: "bg-purple-50", label: "翻译", count: "1" },
              ].map(({ icon: Icon, color, bg, label, count }) => (
                <div key={label} className={`${bg} rounded-xl p-4`}>
                  <Icon className={`w-6 h-6 ${color} mx-auto mb-2`} />
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-lg font-bold text-slate-800">{count} 题</p>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 rounded-xl p-5 text-left text-sm text-slate-600 mb-8 space-y-2">
              <p className="font-semibold text-slate-700 mb-2">考试须知</p>
              <p>1. 考试总时长 {paper.duration} 分钟，倒计时结束将自动交卷。</p>
              <p>2. 听力部分需手动播放音频，建议一次性听完再作答。</p>
              <p>3. 阅读部分左侧显示文章，右侧答题。</p>
              <p>4. 提交试卷后可使用 DeepSeek AI 智能批改写作与翻译。</p>
            </div>

            <button
              onClick={() => setIsStarted(true)}
              className="w-full bg-amber-600 text-white font-bold py-3.5 rounded-xl hover:bg-amber-700 transition-colors shadow-lg text-lg active:scale-95"
            >
              开始考试
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ====================
  //    RESULT SCREEN
  // ====================
  if (isSubmitted) {
    const { correct, total } = getScore();
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          {/* Score banner */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 mb-8 text-center">
            <Trophy className="w-14 h-14 mx-auto text-yellow-500 mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">考试结束 · 参考答案已公布</h1>
            <p className="text-slate-500 mb-6">{paper.title} — {paper.year}</p>

            <div className="flex items-center justify-center gap-8 mb-6">
              <div>
                <div className="text-4xl font-extrabold text-indigo-600">{correct}/{total}</div>
                <div className="text-sm text-slate-400 mt-1">选择题正确</div>
              </div>
              <div className="w-px h-12 bg-slate-200" />
              <div>
                <div className="text-4xl font-extrabold text-amber-600">{pct}%</div>
                <div className="text-sm text-slate-400 mt-1">正确率</div>
              </div>
              <div className="w-px h-12 bg-slate-200" />
              <div>
                <div className="text-4xl font-extrabold text-slate-600">{formatTime(paper.duration * 60 - timeLeft)}</div>
                <div className="text-sm text-slate-400 mt-1">用时</div>
              </div>
            </div>

            <button
              onClick={() => navigate("/papers")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
            >
              <ArrowLeft className="w-4 h-4" /> 返回真题列表
            </button>
          </div>

          {/* Answer review */}
          <h2 className="text-lg font-bold text-slate-700 mb-4">答题回顾 · 参考答案</h2>

          {/* Listening review */}
          <SectionHeader icon={Headphones} title={`听力理解 · ${paper.listening.section}`} color="text-amber-500" />
          {paper.listening.questions.map((q) => (
            <QuestionReview key={q.id} q={q} selected={answers[q.id]} />
          ))}

          {/* Reading review */}
          <SectionHeader icon={BookOpen} title={`阅读理解 · ${paper.reading.section}`} color="text-blue-500" />
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">阅读文章</p>
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{paper.reading.passage}</p>
          </div>
          {paper.reading.questions.map((q) => (
            <QuestionReview key={q.id} q={q} selected={answers[q.id]} />
          ))}

          {/* ---- Writing Review + AI Grading ---- */}
          <SectionHeader icon={PenLine} title="写作" color="text-emerald-500" />
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
            <p className="font-semibold text-slate-800 mb-1">{paper.writing.topic}</p>
            <p className="text-sm text-slate-500 mb-3">{paper.writing.requirement}</p>
            <div className="bg-slate-50 rounded-lg p-4 min-h-[80px] text-sm text-slate-700 whitespace-pre-wrap mb-4">
              {essay || <span className="text-slate-400 italic">(未作答)</span>}
            </div>

            {writingGradeStatus === "done" && writingGradeResult ? (
              <AIReportCard
                label="写作 · DeepSeek 批改"
                icon={PenLine}
                result={writingGradeResult}
                onRegrade={handleGradeWriting}
              />
            ) : (
              <AIGradeButton onClick={handleGradeWriting} status={writingGradeStatus} />
            )}
          </div>

          {/* ---- Translation Review + AI Grading ---- */}
          <SectionHeader icon={Languages} title="翻译 · 汉译英" color="text-purple-500" />
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-8">
            <div className="mb-4 bg-purple-50 rounded-xl p-4">
              <p className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-1">原文</p>
              <p className="text-sm text-slate-700 leading-relaxed">{paper.translation.source}</p>
            </div>
            <div className="mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">参考译文</p>
              <p className="text-sm text-slate-500 leading-relaxed italic">{paper.translation.reference}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 min-h-[80px] text-sm text-slate-700 whitespace-pre-wrap mb-4">
              {translation || <span className="text-slate-400 italic">(未作答)</span>}
            </div>

            {translationGradeStatus === "done" && translationGradeResult ? (
              <AIReportCard
                label="翻译 · DeepSeek 批改"
                icon={Languages}
                result={translationGradeResult}
                onRegrade={handleGradeTranslation}
              />
            ) : (
              <AIGradeButton onClick={handleGradeTranslation} status={translationGradeStatus} />
            )}
          </div>
        </div>
      </div>
    );
  }

  // ====================
  //    MAIN EXAM UI
  // ====================
  return (
    <div className="h-screen flex flex-col bg-slate-100">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/papers")} className="text-slate-400 hover:text-slate-600 transition-colors" title="退出考试">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">{paper.title}</h1>
            <p className="text-xs text-slate-400">{paper.year}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            已答 {Object.keys(answers).length}/{allQuestions.length}
          </div>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-lg font-bold ${
            timeLeft < 300 ? "bg-red-50 text-red-600 animate-pulse" : "bg-slate-100 text-slate-700"
          }`}>
            <Clock className="w-5 h-5" /> {formatTime(timeLeft)}
          </div>

          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white font-medium px-5 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
          >
            <Send className="w-4 h-4" /> 提交试卷
          </button>
        </div>
      </div>

      {/* Submit confirmation modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">确认提交试卷？</h3>
            <p className="text-sm text-slate-500 mb-1">提交后将无法修改答案，倒计时将停止。</p>
            {unansweredCount > 0 && (
              <p className="text-sm text-red-500 font-medium mb-4">还有 {unansweredCount} 道选择题未作答！</p>
            )}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowSubmitConfirm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors">
                继续答题
              </button>
              <button onClick={handleSubmit} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
                确认提交
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel — Reading passage */}
        <div className="hidden lg:flex flex-col w-[40%] border-r border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
            <h2 className="text-sm font-bold text-slate-600 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" /> 阅读材料
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <h3 className="text-base font-bold text-slate-800 mb-3">{paper.reading.section}</h3>
            <p className="text-slate-600 leading-7 whitespace-pre-line text-base">{paper.reading.passage}</p>
          </div>
        </div>

        {/* Right panel — Questions */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-8">
            {/* Listening */}
            <SectionHeader icon={Headphones} title={`听力理解 · ${paper.listening.section}`} color="text-amber-500" />
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Headphones className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">听力音频</p>
                  <p className="text-xs text-slate-400">请播放音频后作答</p>
                </div>
              </div>
              <audio controls className="w-full mb-5" src={paper.listening.audioSrc}>
                Your browser does not support the audio element.
              </audio>
              {paper.listening.questions.map((q) => (
                <QuestionCard key={q.id} q={q} selected={answers[q.id]} onSelect={selectAnswer} />
              ))}
            </div>

            {/* Reading */}
            <SectionHeader icon={BookOpen} title="阅读理解" color="text-blue-500" />
            <div className="lg:hidden bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">阅读文章</p>
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{paper.reading.passage}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              {paper.reading.questions.map((q) => (
                <QuestionCard key={q.id} q={q} selected={answers[q.id]} onSelect={selectAnswer} />
              ))}
            </div>

            {/* Writing */}
            <SectionHeader icon={PenLine} title="写作" color="text-emerald-500" />
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-800 mb-1">{paper.writing.topic}</h3>
              <p className="text-sm text-slate-500 mb-4">{paper.writing.requirement}</p>
              <textarea
                className="w-full min-h-[200px] border border-slate-200 rounded-xl p-4 text-sm text-slate-700 resize-y focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-shadow"
                placeholder="在此输入你的作文..."
                value={essay}
                onChange={(e) => setEssay(e.target.value)}
                disabled={isSubmitted}
              />
              <p className="text-xs text-slate-400 mt-2 text-right">{essay.length} 字符 · ~{wordCount(essay)} 词</p>
            </div>

            {/* Translation */}
            {hasTranslation && (
              <>
                <SectionHeader icon={Languages} title="翻译 · 汉译英" color="text-purple-500" />
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="bg-purple-50 rounded-xl p-4 mb-4">
                    <p className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-2">原文</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{paper.translation.source}</p>
                  </div>
                  <textarea
                    className="w-full min-h-[160px] border border-slate-200 rounded-xl p-4 text-sm text-slate-700 resize-y focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-shadow"
                    placeholder="在此输入你的译文..."
                    value={translation}
                    onChange={(e) => setTranslation(e.target.value)}
                    disabled={isSubmitted}
                  />
                  <p className="text-xs text-slate-400 mt-2 text-right">{translation.length} 字符 · ~{wordCount(translation)} 词</p>
                </div>
              </>
            )}

            <div className="h-16" />
          </div>
        </div>
      </div>

      {/* Floating submit (mobile) */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowSubmitConfirm(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white font-bold px-6 py-3.5 rounded-full shadow-xl hover:bg-indigo-700 transition-all active:scale-95"
        >
          <Send className="w-5 h-5" /> 提交
          {unansweredCount > 0 && (
            <span className="bg-white text-indigo-600 text-xs px-2 py-0.5 rounded-full">{unansweredCount}</span>
          )}
        </button>
      </div>
    </div>
  );
}
