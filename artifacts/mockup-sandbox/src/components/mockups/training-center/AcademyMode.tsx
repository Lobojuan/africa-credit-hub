import React from 'react';
import { Flame, Trophy, Award, Zap, ChevronRight, CheckCircle2, PlayCircle, Star, Target, TrendingUp } from 'lucide-react';

export function AcademyMode() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans p-6 md:p-10 selection:bg-orange-100">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
          {/* Decorative confetti dots */}
          <div className="absolute top-4 left-10 w-2 h-2 rounded-full bg-orange-400 opacity-50" />
          <div className="absolute bottom-10 left-1/4 w-3 h-3 rounded-full bg-teal-400 opacity-50" />
          <div className="absolute top-8 right-1/3 w-2 h-2 rounded-full bg-yellow-400 opacity-50" />
          
          <div className="space-y-2 relative z-10">
            <h1 className="text-4xl font-bold tracking-tight text-slate-800 flex items-center gap-3">
              Good morning, Alex! <span className="text-yellow-400 text-3xl">🌟</span>
            </h1>
            <p className="text-slate-600 text-lg">
              You're on a <span className="font-semibold text-orange-600">14-day streak</span> — don't break it!
            </p>
          </div>

          <div className="flex items-center gap-8 relative z-10">
            {/* Streak Counter */}
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-2 shadow-inner">
                <span className="text-4xl animate-bounce">🔥</span>
              </div>
              <span className="text-2xl font-black text-orange-500">14</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-orange-600">Days</span>
            </div>

            {/* Progress Ring */}
            <div className="flex flex-col items-center">
              <div className="relative w-20 h-20 mb-2">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-200" />
                  <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * 7) / 12} className="text-teal-500" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-xl font-bold text-slate-700">7</span>
                  <span className="text-[10px] text-slate-500 font-medium">/ 12</span>
                </div>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-600">Modules</span>
            </div>
          </div>
        </header>

        {/* Banner */}
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 rounded-2xl p-4 flex items-center justify-center gap-3 text-teal-800 shadow-sm">
          <span className="text-2xl">🎉</span>
          <p className="font-medium text-lg">You're in the <span className="font-bold">top 15%</span> of all trainees this month! Keep up the great work.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="md:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">Your Learning Path</h2>
              <button className="text-teal-600 font-semibold hover:text-teal-700 transition-colors">View All</button>
            </div>

            <div className="space-y-6">
              {/* Completed Course */}
              <div className="group bg-white border-2 border-slate-100 rounded-[2rem] p-6 hover:border-teal-200 hover:shadow-md transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-100 to-transparent opacity-20 rounded-bl-[100px]" />
                <div className="flex gap-6 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center flex-shrink-0 text-white shadow-sm">
                    <CheckCircle2 size={32} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-800 group-hover:text-teal-700 transition-colors">Data Privacy Fundamentals</h3>
                        <p className="text-slate-500 font-medium">Platform Compliance</p>
                      </div>
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        Certified ✓
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-4">
                      <div className="bg-emerald-500 h-full w-full rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* In Progress Course */}
              <div className="group bg-white border-2 border-orange-100 rounded-[2rem] p-6 shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-orange-100 to-transparent opacity-30 rounded-bl-[100px]" />
                <div className="flex gap-6 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center flex-shrink-0 text-white shadow-sm">
                    <Target size={32} />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">Advanced Dispute Resolution</h3>
                        <p className="text-slate-500 font-medium flex items-center gap-2">
                          <span>Module 3 of 5</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <span className="text-orange-600 font-semibold flex items-center gap-1">
                            <Zap size={14} /> 15 mins left
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-orange-500 h-full w-[60%] rounded-full relative">
                          <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-slate-600">60%</span>
                    </div>
                    <div className="pt-3">
                      <button className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-full font-semibold flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-sm">
                        Continue Learning <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Up Course */}
              <div className="group bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-6 hover:border-slate-300 transition-colors">
                <div className="flex gap-6 opacity-75 group-hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center flex-shrink-0 text-slate-500">
                    <PlayCircle size={32} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-bold text-slate-700">Cross-Border Reporting</h3>
                    <p className="text-slate-500 font-medium">Required for Level 2 Certification</p>
                    <div className="pt-2">
                      <button className="text-slate-600 font-semibold flex items-center gap-1 hover:text-slate-900 transition-colors">
                        Start Next <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Leaderboard */}
            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-yellow-100 text-yellow-600 rounded-xl">
                  <Trophy size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Top Performers</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-yellow-50/50">
                  <span className="text-xl font-black text-yellow-500 w-6 text-center">1</span>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center text-white font-bold shadow-sm">
                    SO
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">Sarah O.</p>
                    <p className="text-sm text-yellow-600 font-medium">98% average</p>
                  </div>
                  <span className="text-xl">🏆</span>
                </div>
                
                <div className="flex items-center gap-4 p-3 rounded-2xl">
                  <span className="text-xl font-black text-slate-400 w-6 text-center">2</span>
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                    KA
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-700">Kwame A.</p>
                    <p className="text-sm text-slate-500 font-medium">94% average</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 rounded-2xl bg-teal-50 border border-teal-100 relative">
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-teal-500 rounded-r-full" />
                  <span className="text-xl font-black text-orange-400 w-6 text-center">3</span>
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold border-2 border-white shadow-sm">
                    AM
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-teal-900">Alex M. <span className="text-xs font-black uppercase text-teal-600 ml-1 bg-white px-2 py-0.5 rounded-full shadow-sm">You</span></p>
                    <p className="text-sm text-teal-600 font-medium">87% average</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
                  <Award size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Recent Badges</h3>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center gap-2 group cursor-pointer">
                  <div className="w-16 h-16 rounded-full bg-orange-50 border-2 border-orange-200 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:bg-orange-100 transition-all shadow-sm">
                    🏅
                  </div>
                  <span className="text-xs font-bold text-slate-600 text-center leading-tight">First<br/>Pass</span>
                </div>
                <div className="flex flex-col items-center gap-2 group cursor-pointer">
                  <div className="w-16 h-16 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:bg-blue-100 transition-all shadow-sm">
                    ⚡
                  </div>
                  <span className="text-xs font-bold text-slate-600 text-center leading-tight">Speed<br/>Learner</span>
                </div>
                <div className="flex flex-col items-center gap-2 group cursor-pointer">
                  <div className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:bg-red-100 transition-all shadow-sm">
                    🔥
                  </div>
                  <span className="text-xs font-bold text-slate-600 text-center leading-tight">7-Day<br/>Streak</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
