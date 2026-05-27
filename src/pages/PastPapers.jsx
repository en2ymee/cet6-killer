import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText, Headphones, BookOpen, PenLine,
  Clock, ChevronRight, GraduationCap, Loader2, AlertTriangle, RotateCcw,
} from "lucide-react";

export default function PastPapers() {
  const navigate = useNavigate();
  const [papers, setPapers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    setLoadError(null);
    fetch("/data/past_papers.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setPapers(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setLoadError(err.message);
        setIsLoading(false);
      });
  }, []);

  // ---- Loading ----
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-slate-700">正在加载真题...</h2>
          <p className="text-sm text-slate-400">正在准备历年六级真题试卷，请稍候</p>
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
          <h2 className="text-xl font-bold text-slate-800">真题加载失败</h2>
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 mb-4 shadow-lg">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 mb-2">历年真题模考</h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            精选历年 CET-6 真题，全真模拟考场环境。每套试卷包含听力、阅读、写作、翻译四大板块。
          </p>
        </div>

        {/* Paper cards */}
        <div className="space-y-4">
          {papers.map((paper, idx) => (
            <div
              key={paper.id}
              className="group bg-white rounded-2xl border border-slate-200 hover:border-amber-300 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex flex-col md:flex-row md:items-center">
                {/* Left accent bar */}
                <div className="flex items-center gap-5 p-5 md:p-6 flex-1">
                  {/* Number badge */}
                  <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 text-amber-700 font-extrabold text-lg shrink-0 group-hover:bg-amber-200 transition-colors">
                    {idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-amber-700 transition-colors">
                      {paper.title}
                    </h2>
                    <p className="text-sm text-slate-500 mb-3">{paper.year}</p>

                    {/* Meta tags */}
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full">
                        <Clock className="w-3 h-3" />
                        {paper.duration} 分钟
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                        <Headphones className="w-3 h-3" />
                        听力 {paper.listening.questions.length}题
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                        <BookOpen className="w-3 h-3" />
                        阅读 {paper.reading.questions.length}题
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                        <PenLine className="w-3 h-3" />
                        写作 1题
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <div className="md:border-l border-t md:border-t-0 border-slate-100 p-5 md:p-6 flex md:flex-col items-center justify-center gap-2 md:w-40 shrink-0">
                  <FileText className="hidden md:block w-8 h-8 text-slate-300 group-hover:text-amber-500 transition-colors" />
                  <button
                    onClick={() => navigate(`/exam/${paper.id}`)}
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-amber-700 active:scale-95 transition-all shadow-md"
                  >
                    开始作答
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 mt-10">
          点击"开始作答"进入全真模拟考场 · 提交后可查看参考答案
        </p>
      </div>
    </div>
  );
}
