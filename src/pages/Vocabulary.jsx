import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Volume2, Star, Trash2, CheckCircle, RotateCcw,
  ChevronRight, BookOpen, Target, Shuffle, Zap, Loader2, AlertTriangle,
} from 'lucide-react';
const STORAGE_PLAN = 'cet6_daily_plan';
const STORAGE_INDEX = 'cet6_words_index';
const STORAGE_NOTEBOOK = 'cet6_notebook';

const PRESET_COUNTS = [10, 20, 50];

function getToday() {
  return new Date().toISOString().slice(0, 10); // "2026-05-26"
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Vocabulary() {
  // ---- phase: 'setup' | 'study' | 'completed' ----
  const [phase, setPhase] = useState('setup');
  const [dailyWords, setDailyWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);
  const [notebook, setNotebook] = useState([]);
  const [accent, setAccent] = useState('2');
  const [customCount, setCustomCount] = useState('30');
  const [wordBank, setWordBank] = useState([]);
  const [isLoadingWords, setIsLoadingWords] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // ---- Adapter: normalize external dict format to our schema ----
  function adaptWordBank(raw) {
    return raw.map((item, i) => ({
      id: i + 1,
      word: item.name || item.word || "",
      phonetic: item.usphone || item.ukphone || item.phonetic || "",
      definition: Array.isArray(item.trans)
        ? item.trans.join("；")
        : (item.trans || item.definition || ""),
      partOfSpeech: item.partOfSpeech || "",
      frequency: item.frequency || "medium",
      sentence: item.sentence || "",
      translation: item.translation || "",
    }));
  }

  // ---- Fetch word bank: CDN first, local fallback ----
  const CDN_URL =
    "https://raw.githubusercontent.com/Polyphony-Design/qwerty-learner/main/renderer/public/dicts/CET6_T.json";
  const LOCAL_URL = "/data/cet6_words.json";

  useEffect(() => {
    let cancelled = false;
    setIsLoadingWords(true);
    setLoadError(null);

    (async () => {
      try {
        // Try CDN first
        const res = await fetch(CDN_URL);
        if (!res.ok) throw new Error(`CDN HTTP ${res.status}`);
        const raw = await res.json();
        if (!cancelled) {
          setWordBank(adaptWordBank(raw));
          setIsLoadingWords(false);
        }
      } catch {
        // CDN failed — fall back to local
        try {
          const res = await fetch(LOCAL_URL);
          if (!res.ok) throw new Error(`Local HTTP ${res.status}`);
          const data = await res.json();
          if (!cancelled) {
            setWordBank(data);
            setIsLoadingWords(false);
          }
        } catch (err) {
          if (!cancelled) {
            setLoadError(err.message);
            setIsLoadingWords(false);
          }
        }
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // ---- Init: restore saved session after words loaded ----
  useEffect(() => {
    if (isLoadingWords || loadError) return;

    // Restore notebook (always)
    const savedNotebook = localStorage.getItem(STORAGE_NOTEBOOK);
    if (savedNotebook) setNotebook(JSON.parse(savedNotebook));

    // Restore daily plan if it's from today
    const savedPlan = localStorage.getItem(STORAGE_PLAN);
    if (savedPlan) {
      try {
        const plan = JSON.parse(savedPlan);
        if (plan.date === getToday() && plan.words && plan.words.length > 0) {
          setDailyWords(plan.words);
          const savedIndex = parseInt(localStorage.getItem(STORAGE_INDEX) || '0', 10);
          if (savedIndex >= plan.words.length) {
            setPhase('completed');
            setCurrentIndex(0);
          } else {
            setPhase('study');
            setCurrentIndex(savedIndex);
          }
          return;
        }
      } catch { /* corrupted data, fall through to setup */ }
    }
    // No valid plan → show setup
    setPhase('setup');
  }, [isLoadingWords, loadError]);

  // ---- Pronunciation ----
  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  const playAudio = useCallback((text) => {
    if (!text) return;
    const type = accent;
    const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=${type}`;
    const audio = new Audio(audioUrl);
    audio.play().catch(() => {
      if (isMountedRef.current && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = type === '1' ? 'en-GB' : 'en-US';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }
    });
  }, [accent]);

  // ---- Plan: start a new daily session ----
  function startPlan(count) {
    const n = Math.min(count, wordBank.length);
    const selected = shuffle(wordBank).slice(0, n);
    const plan = { words: selected, date: getToday() };

    setDailyWords(selected);
    setCurrentIndex(0);
    setShowDefinition(false);
    setPhase('study');

    localStorage.setItem(STORAGE_PLAN, JSON.stringify(plan));
    localStorage.setItem(STORAGE_INDEX, '0');
  }

  // ---- Study: core interactions ----
  function goToNextWord() {
    setShowDefinition(false);
    if (currentIndex + 1 < dailyWords.length) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      localStorage.setItem(STORAGE_INDEX, String(next));
    } else {
      setPhase('completed');
    }
  }

  const handleRecognized = () => goToNextWord();

  const handleNotRecognized = () => {
    const word = dailyWords[currentIndex];
    if (word && !notebook.some((w) => w.word === word.word)) {
      const updated = [...notebook, word];
      setNotebook(updated);
      localStorage.setItem(STORAGE_NOTEBOOK, JSON.stringify(updated));
    }
    goToNextWord();
  };

  // ---- Notebook operations ----
  const removeFromNotebook = (wordToRemove) => {
    const updated = notebook.filter((w) => w.word !== wordToRemove);
    setNotebook(updated);
    localStorage.setItem(STORAGE_NOTEBOOK, JSON.stringify(updated));
  };

  const clearNotebook = () => {
    if (window.confirm('确定要清空生词本中所有的生词吗？')) {
      setNotebook([]);
      localStorage.removeItem(STORAGE_NOTEBOOK);
    }
  };

  // ---- Reset / New plan ----
  const resetProgress = () => {
    setCurrentIndex(0);
    setShowDefinition(false);
    setPhase('study');
    localStorage.setItem(STORAGE_INDEX, '0');
  };

  const startNewPlan = () => {
    setDailyWords([]);
    setCurrentIndex(0);
    setShowDefinition(false);
    setPhase('setup');
    localStorage.removeItem(STORAGE_PLAN);
    localStorage.removeItem(STORAGE_INDEX);
  };

  // ---- Loading state ----
  if (isLoadingWords) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-slate-700">正在加载词库...</h2>
          <p className="text-sm text-slate-400">正在准备 {">"}5,000 六级核心词汇，请稍候</p>
        </div>
      </div>
    );
  }

  // ---- Error state ----
  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center px-4">
        <div className="text-center max-w-md space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-red-400 to-red-600 shadow-lg">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">词库加载失败</h2>
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

  // ========================
  //    RENDER: SETUP PHASE
  // ========================
  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <div className="max-w-lg w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 mb-4 shadow-lg">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 mb-1">今日背诵计划</h1>
            <p className="text-slate-500 text-sm">
              词库共 {wordBank.length} 个六级核心词汇，选择你今天想挑战的数量
            </p>
          </div>

          {/* Preset buttons */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {PRESET_COUNTS.map((n) => (
              <button
                key={n}
                onClick={() => startPlan(n)}
                className="group bg-white border-2 border-slate-200 rounded-2xl py-5 hover:border-indigo-400 hover:shadow-lg transition-all active:scale-95"
              >
                <div className="text-3xl font-extrabold text-indigo-600 group-hover:scale-110 transition-transform">
                  {n}
                </div>
                <div className="text-xs text-slate-400 mt-1 font-medium">个单词</div>
                <div className="text-[10px] text-slate-300 mt-0.5">
                  约 {n < 20 ? '5' : n < 50 ? '15' : '30'} 分钟
                </div>
              </button>
            ))}
          </div>

          {/* Custom input */}
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-5 mb-6 hover:border-indigo-300 transition-colors">
            <label className="text-sm font-semibold text-slate-600 mb-3 block">
              自定义数量
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={wordBank.length}
                value={customCount}
                onChange={(e) => setCustomCount(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') startPlan(parseInt(customCount, 10) || 10); }}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-center text-lg font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                placeholder="30"
              />
              <button
                onClick={() => startPlan(parseInt(customCount, 10) || 10)}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md active:scale-95"
              >
                <Zap className="w-4 h-4" />
                开始背诵
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              可输入 1–{wordBank.length} 之间的任意数字
            </p>
          </div>

          {/* Info card */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Shuffle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">随机乱序抽词</p>
              <p className="text-xs text-amber-600 mt-0.5">
                系统将从 {wordBank.length} 个词库中随机抽取并打乱顺序，确保每次都不同。
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========================
  //    RENDER: STUDY PHASE
  // ========================
  const total = dailyWords.length;
  const currentWord = dailyWords[currentIndex];
  const progressPct = total > 0 ? (currentIndex / total) * 100 : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-5 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-indigo-600" />
            核心单词背诵
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            今日计划 {total} 词 · 词库 {wordBank.length} 词 · 随机乱序
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center gap-3">
          {/* Accent switch */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg text-sm">
            <button
              onClick={() => setAccent('2')}
              className={`px-3 py-1 rounded-md transition-all ${accent === '2' ? 'bg-white text-indigo-600 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-800'}`}
            >
              美音
            </button>
            <button
              onClick={() => setAccent('1')}
              className={`px-3 py-1 rounded-md transition-all ${accent === '1' ? 'bg-white text-indigo-600 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-800'}`}
            >
              英音
            </button>
          </div>

          {/* New plan button */}
          <button
            onClick={startNewPlan}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors underline"
          >
            放弃本次计划
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left / Center: word card */}
        <div className="lg:col-span-2 space-y-6">
          {phase === 'study' ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300">
              {/* Progress bar */}
              <div className="bg-gray-100 h-2 w-full">
                <div
                  className="bg-indigo-600 h-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="p-8 md:p-12 min-h-[380px] flex flex-col justify-between">
                {/* Meta */}
                <div className="flex justify-between items-center text-sm text-gray-400">
                  <span>进度: <strong className="text-gray-700">{currentIndex + 1}</strong> / {total}</span>
                  <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    CET-6 高频
                  </span>
                </div>

                {/* Word display */}
                <div className="my-8 text-center space-y-4">
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-wide">
                      {currentWord?.word}
                    </h2>
                    <button
                      onClick={() => playAudio(currentWord?.word)}
                      className="p-2 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 active:scale-95 transition-all"
                      title="点击发音"
                    >
                      <Volume2 className="h-6 w-6" />
                    </button>
                  </div>

                  <p className="text-lg text-gray-400 font-serif">{currentWord?.phonetic}</p>

                  {!showDefinition ? (
                    <div className="pt-6">
                      <button
                        onClick={() => {
                          setShowDefinition(true);
                          playAudio(currentWord?.word);
                        }}
                        className="px-8 py-3.5 bg-gray-900 text-white rounded-xl shadow-lg hover:bg-gray-800 transition-all font-semibold text-sm active:scale-98"
                      >
                        点击查看中文释义
                      </button>
                    </div>
                  ) : (
                    <div className="pt-6 text-left space-y-4 max-w-xl mx-auto border-t border-gray-100 mt-6">
                      <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">中文释义</span>
                        <p className="text-lg font-semibold text-gray-800 leading-relaxed bg-gray-50 p-3 rounded-lg border-l-4 border-indigo-500">
                          {currentWord?.definition}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">经典例句</span>
                        <p className="text-gray-700 font-medium italic text-base leading-relaxed">
                          {currentWord?.sentence}
                        </p>
                        <p className="text-gray-500 text-sm">{currentWord?.translation}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-6">
                  <button
                    onClick={handleNotRecognized}
                    className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border-2 border-red-100 text-red-600 font-semibold hover:bg-red-50 hover:border-red-200 active:scale-98 transition-all"
                  >
                    <Star className="h-5 w-5 fill-current" />
                    太难了，加生词本
                  </button>
                  <button
                    onClick={handleRecognized}
                    className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-md shadow-emerald-100 active:scale-98 transition-all"
                  >
                    认识，下一个
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : phase === 'completed' ? (
            /* Completion screen */
            <div className="bg-white rounded-2xl shadow-xl p-10 text-center border border-gray-100 space-y-6">
              <div className="inline-flex items-center justify-center p-4 bg-emerald-100 rounded-full text-emerald-600">
                <CheckCircle className="h-16 w-16" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-900">恭喜你！今日任务圆满完成</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  今天成功背诵了 {total} 个单词。记忆的秘诀在于重复，明天记得准时来复习哦！
                </p>
              </div>
              <div className="flex justify-center gap-4 pt-4 flex-wrap">
                <button
                  onClick={resetProgress}
                  className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all active:scale-95"
                >
                  <RotateCcw className="h-5 w-5" />
                  重新巩固本组
                </button>
                <button
                  onClick={startNewPlan}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 shadow-md transition-all active:scale-95"
                >
                  <Zap className="h-5 w-5" />
                  开启新计划
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right: notebook sidebar */}
        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200/60 h-[fit-content]">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500 fill-current" />
              我的生词本 ({notebook.length})
            </h3>
            {notebook.length > 0 && (
              <button
                onClick={clearNotebook}
                className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 transition-colors"
                title="清空生词本"
              >
                <Trash2 className="h-3.5 w-3.5" />
                清空
              </button>
            )}
          </div>

          {notebook.length === 0 ? (
            <div className="text-center py-12 text-gray-400 space-y-2">
              <div className="text-4xl">🎉</div>
              <p className="text-sm">生词本空空如也！</p>
              <p className="text-xs">记不住的词点击"加生词本"就会出现在这里</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {notebook.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between gap-2 hover:shadow-md transition-shadow group"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900 truncate">{item.word}</h4>
                      <button
                        onClick={() => playAudio(item.word)}
                        className="text-gray-400 hover:text-indigo-600 transition-colors"
                        title="朗读"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 truncate" title={item.definition}>
                      {item.definition}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromNotebook(item.word)}
                    className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="移出生词本"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
