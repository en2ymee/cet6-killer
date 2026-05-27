import { Lightbulb } from "lucide-react";

export default function Grammar() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex items-center justify-center">
      <div className="text-center">
        <Lightbulb className="w-16 h-16 mx-auto text-emerald-400 mb-4" />
        <h1 className="text-2xl font-bold text-slate-700">考点归纳</h1>
        <p className="text-slate-500 mt-2">语法考点模块建设中，敬请期待...</p>
      </div>
    </div>
  );
}
