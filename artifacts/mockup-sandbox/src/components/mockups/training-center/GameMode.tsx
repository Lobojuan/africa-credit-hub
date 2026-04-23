import React from 'react';
import { 
  Flame, 
  Trophy, 
  Star, 
  Lock, 
  Play, 
  CheckCircle2, 
  Award, 
  Zap,
  ChevronRight,
  Target
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function GameMode() {
  return (
    <div className="min-h-screen bg-[#0f0f1a] text-slate-200 font-sans p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Top Nav / Player Profile */}
        <header className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-16 h-16 border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                <AvatarImage src="https://i.pravatar.cc/150?u=alex" alt="Alex Mensah" />
                <AvatarFallback className="bg-slate-800 text-blue-400">AM</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full border border-[#0f0f1a]">
                LVL 7
              </div>
            </div>
            
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Alex Mensah</h1>
              <p className="text-blue-400 font-medium text-sm">Credit Analyst</p>
            </div>
          </div>

          <div className="flex items-center gap-6 w-full md:w-auto">
            <div className="flex-1 md:w-48 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>XP</span>
                <span className="text-purple-400">2340 / 3000</span>
              </div>
              <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 relative"
                  style={{ width: '78%' }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center bg-slate-800/50 border border-orange-500/30 rounded-xl px-4 py-2 shadow-[0_0_10px_rgba(249,115,22,0.1)]">
              <Flame className="w-6 h-6 text-orange-500 drop-shadow-[0_0_5px_rgba(249,115,22,0.8)]" fill="currentColor" />
              <span className="text-sm font-bold text-orange-400 mt-1">14 Days</span>
            </div>
          </div>
        </header>

        {/* Daily Challenge Strip */}
        <div className="bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-blue-900/40 border border-blue-500/30 rounded-2xl p-4 flex items-center justify-between shadow-[0_0_20px_rgba(59,130,246,0.15)] relative overflow-hidden group cursor-pointer hover:border-blue-400/50 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-100%] group-hover:translate-x-[100%] duration-1000 ease-in-out" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-blue-500/20 p-2.5 rounded-lg border border-blue-400/30">
              <Target className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-bold flex items-center gap-2">
                DAILY CHALLENGE
                <Badge variant="outline" className="border-purple-500/50 text-purple-400 bg-purple-500/10 text-[10px] py-0">2x XP BONUS</Badge>
              </h3>
              <p className="text-sm text-blue-200/70 mt-0.5">Score 90%+ on Decision Engine</p>
            </div>
          </div>
          <button className="hidden sm:flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] relative z-10">
            ACCEPT
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'COMPLETED', value: '7/12', icon: CheckCircle2, color: 'text-emerald-400' },
            { label: 'AVG SCORE', value: '84', icon: Target, color: 'text-blue-400' },
            { label: 'CERTIFICATES', value: '3', icon: Award, color: 'text-purple-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2">
              <stat.icon className={`w-6 h-6 ${stat.color} mb-1`} />
              <div className="text-2xl font-black text-white">{stat.value}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Modules Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" fill="currentColor" />
              TRAINING MODULES
            </h2>
            <div className="text-sm font-bold text-slate-500">PHASE 1</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Completed Card */}
            <Card className="bg-slate-900/80 border-slate-700/50 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent z-0 pointer-events-none" />
              <CardContent className="p-6 relative z-10 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">COMPLETED</Badge>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">Borrower Management</h3>
                  <div className="flex items-center gap-1 mt-2 text-slate-500">
                    <Star className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" />
                    <Star className="w-3.5 h-3.5 text-slate-700" fill="currentColor" />
                    <Star className="w-3.5 h-3.5 text-slate-700" fill="currentColor" />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  <div className="text-xs font-bold text-slate-400">SCORE: <span className="text-white">92%</span></div>
                  <div className="text-xs font-bold text-purple-400">+100 XP Earned</div>
                </div>
              </CardContent>
            </Card>

            {/* Active Card */}
            <Card className="bg-[#1a1a2e] border-blue-500/50 overflow-hidden relative shadow-[0_0_25px_rgba(59,130,246,0.15)] group cursor-pointer hover:border-blue-400 transition-colors">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
              <CardContent className="p-6 relative z-10 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-blue-900/30 rounded-xl border border-blue-500/50 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-blue-400" />
                  </div>
                  <Badge variant="outline" className="border-blue-500 text-blue-400 bg-blue-500/10 animate-pulse">IN PROGRESS</Badge>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">Decision Engine</h3>
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" />
                    <Star className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" />
                    <Star className="w-3.5 h-3.5 text-slate-700" fill="currentColor" />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-800/50">
                  <button className="flex items-center gap-1.5 text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors">
                    PLAY NOW <Play className="w-4 h-4" fill="currentColor" />
                  </button>
                  <div className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">+150 XP</div>
                </div>
              </CardContent>
            </Card>

            {/* Locked Card */}
            <Card className="bg-slate-900/40 border-slate-800/50 overflow-hidden relative opacity-70 grayscale-[50%] hover:grayscale-0 transition-all">
              <CardContent className="p-6 relative z-10 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-slate-800/50 rounded-xl border border-slate-700 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-slate-500" />
                  </div>
                  <Badge variant="outline" className="border-slate-700 text-slate-500 bg-slate-800">LOCKED</Badge>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-400">PAPSS Settlements</h3>
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="w-3.5 h-3.5 text-slate-600" fill="currentColor" />
                    <Star className="w-3.5 h-3.5 text-slate-600" fill="currentColor" />
                    <Star className="w-3.5 h-3.5 text-slate-600" fill="currentColor" />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-800/50">
                  <div className="text-xs font-bold text-slate-500">Requires Lvl 8</div>
                  <div className="text-xs font-bold text-slate-500">+200 XP</div>
                </div>
              </CardContent>
            </Card>

          </div>
        </section>

      </div>
    </div>
  );
}
