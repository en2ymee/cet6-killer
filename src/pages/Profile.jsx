import { Heart } from "lucide-react";

export default function Profile() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50 flex items-center justify-center">
      <div className="text-center">
        <Heart className="w-16 h-16 mx-auto text-rose-400 mb-4" />
        <h1 className="text-2xl font-bold text-slate-700">我的错题</h1>
        <p className="text-slate-500 mt-2">错题本模块建设中，敬请期待...</p>
      </div>
    </div>
  );
}
