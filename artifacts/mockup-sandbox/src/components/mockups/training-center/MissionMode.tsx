import React from "react";
import { AlertTriangle, ShieldCheck, Crosshair, Award, Terminal, Activity, ChevronRight, FileWarning, Fingerprint, Lock } from "lucide-react";

export function MissionMode() {
  return (
    <div className="min-h-screen bg-[#0a1a0f] text-slate-300 font-mono relative overflow-hidden flex flex-col selection:bg-amber-500/30">
      {/* Background Textures */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10 bg-[radial-gradient(circle_at_center,_transparent_0%,_#000_100%)]"></div>
      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      <div className="absolute -inset-[100%] pointer-events-none z-0 opacity-[0.02] flex items-center justify-center rotate-[-30deg]">
        <span className="text-[20rem] font-bold text-slate-500 tracking-tighter">CLASSIFIED</span>
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-10 border-b-2 border-slate-800 bg-[#0a1a0f]/90 backdrop-blur p-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-900 border border-slate-700 flex items-center justify-center text-amber-500 shadow-[inset_0_0_10px_rgba(245,158,11,0.2)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-amber-500/50 animate-pulse"></div>
              <Terminal size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-widest text-slate-100 uppercase flex items-center gap-2">
                Pan-African Registry
                <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 border border-red-900">SECURE NET</span>
              </h1>
              <p className="text-xs text-slate-500 tracking-widest">TRAINING & CERTIFICATION MAINFRAME</p>
            </div>
          </div>

          {/* AGENT PROFILE */}
          <div className="flex flex-wrap items-center gap-4 text-xs border border-slate-800 bg-slate-900/50 p-3 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden">
            {/* Scanline effect */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-green-500/20 animate-[scan_3s_ease-in-out_infinite]"></div>
            
            <div className="flex items-center gap-2 border-r border-slate-800 pr-4">
              <Fingerprint className="text-slate-500" size={16} />
              <div>
                <div className="text-slate-500">AGENT</div>
                <div className="text-slate-200 font-bold tracking-wider">A. MENSAH</div>
              </div>
            </div>
            <div className="border-r border-slate-800 pr-4">
              <div className="text-slate-500">CLEARANCE</div>
              <div className="text-slate-200 font-bold">LEVEL 7 <span className="text-amber-500/80">— SENIOR ANALYST</span></div>
            </div>
            <div className="border-r border-slate-800 pr-4">
              <div className="text-slate-500">MISSIONS</div>
              <div className="text-slate-200"><span className="text-green-400 font-bold">7</span> / 12 COMPLETE</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-none bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></div>
              <span className="text-green-500 font-bold tracking-widest">ACTIVE</span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 w-full">
        
        {/* Left Column: Missions */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Priority Mission Alert */}
          <div className="border border-amber-500/50 bg-amber-950/20 p-4 relative overflow-hidden flex items-start gap-4">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
            <div className="absolute -right-4 -top-4 text-amber-500/10 rotate-12">
              <AlertTriangle size={120} />
            </div>
            <div className="bg-amber-500/10 p-2 border border-amber-500/30 text-amber-500 shrink-0">
              <FileWarning size={24} />
            </div>
            <div className="relative z-10">
              <div className="text-amber-500 font-bold tracking-widest text-sm flex items-center gap-2 mb-1">
                <span className="animate-pulse">▶</span> PRIORITY OVERRIDE
              </div>
              <h2 className="text-xl text-amber-100 font-bold uppercase mb-2">Decision Engine & Credit Rules</h2>
              <p className="text-amber-500/80 text-sm">Critical update to platform rulesets. Report for debrief in 48h. Failure to comply will result in system lockout.</p>
              <button className="mt-4 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold px-6 py-2 text-sm transition-colors uppercase tracking-widest border border-amber-400 flex items-center gap-2">
                Initiate Mission <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Mission Grid */}
          <div>
            <h3 className="text-slate-500 tracking-[0.2em] text-sm font-bold uppercase border-b border-slate-800 pb-2 mb-4 flex items-center gap-2">
              <Activity size={16} /> Active Mission Log
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Mission 1 - In Progress */}
              <div className="border border-slate-700 bg-slate-900/40 relative group hover:border-amber-500/50 transition-colors p-5 flex flex-col">
                <div className="absolute top-0 right-0 p-2 text-4xl font-black text-slate-800/50 pointer-events-none group-hover:text-amber-500/10 transition-colors">01</div>
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="bg-slate-800 text-slate-300 border border-slate-700 text-xs px-2 py-1 font-bold tracking-widest flex items-center gap-2">
                    <Crosshair size={12} className="text-amber-500" />
                    FILE: OB-442
                  </div>
                  <div className="text-orange-500 border border-orange-500/30 px-2 py-0.5 text-xs font-bold tracking-widest bg-orange-500/10 animate-pulse">
                    IN PROGRESS
                  </div>
                </div>
                
                <h4 className="text-lg font-bold text-slate-200 uppercase mb-2 relative z-10">Open Banking Integrations</h4>
                <p className="text-sm text-slate-400 mb-6 flex-1 relative z-10">Master the API gateways for real-time transactional data ingestion.</p>
                
                <div className="mt-auto border-t border-slate-800 pt-4 flex items-center justify-between relative z-10">
                  <div className="text-xs text-slate-500 font-mono">DURATION: 45 MIN</div>
                  <button className="text-amber-500 hover:text-amber-400 text-sm font-bold tracking-widest flex items-center gap-1 uppercase">
                    Resume <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Mission 2 - Pending */}
              <div className="border border-slate-700 bg-slate-900/40 relative group hover:border-slate-500 transition-colors p-5 flex flex-col opacity-80 hover:opacity-100">
                <div className="absolute top-0 right-0 p-2 text-4xl font-black text-slate-800/50 pointer-events-none group-hover:text-slate-500/10 transition-colors">02</div>
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="bg-slate-800 text-slate-300 border border-slate-700 text-xs px-2 py-1 font-bold tracking-widest">
                    FILE: DR-109
                  </div>
                  <div className="text-red-500 border border-red-500/30 px-2 py-0.5 text-xs font-bold tracking-widest bg-red-500/10">
                    PENDING
                  </div>
                </div>
                
                <h4 className="text-lg font-bold text-slate-200 uppercase mb-2 relative z-10">Dispute Resolution Ops</h4>
                <p className="text-sm text-slate-400 mb-6 flex-1 relative z-10">Handle consumer data challenges within regulatory SLAs.</p>
                
                <div className="mt-auto border-t border-slate-800 pt-4 flex items-center justify-between relative z-10">
                  <div className="text-xs text-slate-500 font-mono">DURATION: 30 MIN</div>
                  <button className="text-slate-400 hover:text-slate-300 text-sm font-bold tracking-widest flex items-center gap-1 uppercase">
                    Begin <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Mission 3 - Complete */}
              <div className="border border-green-900/50 bg-green-950/10 relative p-5 flex flex-col overflow-hidden">
                {/* Stamp */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-15deg] pointer-events-none z-20">
                  <div className="border-4 border-green-500/30 text-green-500/30 text-4xl font-black tracking-widest px-4 py-2 uppercase">
                    DEBRIEFED
                  </div>
                </div>

                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="bg-slate-800 text-slate-400 border border-slate-700 text-xs px-2 py-1 font-bold tracking-widest">
                    FILE: CS-772
                  </div>
                  <div className="flex items-center gap-2 text-green-500">
                    <Award size={16} />
                    <span className="text-xs font-bold tracking-widest uppercase">Certified</span>
                  </div>
                </div>
                
                <h4 className="text-lg font-bold text-slate-400 uppercase mb-2 relative z-10">Credit Score Methodology</h4>
                <p className="text-sm text-slate-500 mb-6 flex-1 relative z-10">Understanding the 5-factor alternative scoring model.</p>
                
                <div className="mt-auto border-t border-slate-800/50 pt-4 flex items-center justify-between relative z-10">
                  <div className="text-xs text-slate-600 font-mono">SCORE: 98% (CLASS A)</div>
                  <button className="text-slate-500 hover:text-slate-400 text-sm font-bold tracking-widest flex items-center gap-1 uppercase">
                    Review Logs
                  </button>
                </div>
              </div>

              {/* Mission 4 - Complete */}
              <div className="border border-green-900/50 bg-green-950/10 relative p-5 flex flex-col overflow-hidden">
                {/* Stamp */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-15deg] pointer-events-none z-20">
                  <div className="border-4 border-green-500/30 text-green-500/30 text-4xl font-black tracking-widest px-4 py-2 uppercase">
                    DEBRIEFED
                  </div>
                </div>

                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="bg-slate-800 text-slate-400 border border-slate-700 text-xs px-2 py-1 font-bold tracking-widest">
                    FILE: KYC-001
                  </div>
                  <div className="flex items-center gap-2 text-green-500">
                    <Award size={16} />
                    <span className="text-xs font-bold tracking-widest uppercase">Certified</span>
                  </div>
                </div>
                
                <h4 className="text-lg font-bold text-slate-400 uppercase mb-2 relative z-10">Advanced KYC & AML</h4>
                <p className="text-sm text-slate-500 mb-6 flex-1 relative z-10">Cross-border entity verification protocols.</p>
                
                <div className="mt-auto border-t border-slate-800/50 pt-4 flex items-center justify-between relative z-10">
                  <div className="text-xs text-slate-600 font-mono">SCORE: 100% (CLASS S)</div>
                  <button className="text-slate-500 hover:text-slate-400 text-sm font-bold tracking-widest flex items-center gap-1 uppercase">
                    Review Logs
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-6">
          <div className="border border-slate-700 bg-slate-900/60 p-5">
            <h3 className="text-slate-400 tracking-[0.2em] text-xs font-bold uppercase border-b border-slate-700 pb-3 mb-4 flex items-center gap-2">
              <Lock size={14} /> Mission Dossier
            </h3>
            
            <div className="space-y-6">
              {/* Stat 1 */}
              <div>
                <div className="text-xs text-slate-500 tracking-widest mb-1">OPERATIVE RATING</div>
                <div className="text-3xl font-black text-slate-200">
                  A- <span className="text-sm font-normal text-amber-500 ml-2 animate-pulse">▲ TARGET: S</span>
                </div>
              </div>

              {/* Stat 2 */}
              <div>
                <div className="text-xs text-slate-500 tracking-widest mb-1">CERTIFICATIONS ACQUIRED</div>
                <div className="text-2xl font-black text-slate-200 flex items-center gap-2">
                  <Award className="text-green-500" size={24} /> 7
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex justify-between text-xs text-slate-500 tracking-widest mb-2">
                  <span>CLEARANCE PROGRESS</span>
                  <span>58%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 overflow-hidden flex">
                  <div className="h-full bg-green-500 w-[58%] relative">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.2)_25%,rgba(0,0,0,0.2)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.2)_75%,rgba(0,0,0,0.2)_100%)] bg-[length:10px_10px]"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800">
              <button className="w-full border border-slate-600 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 font-bold py-2 text-xs uppercase tracking-widest transition-colors flex justify-center items-center gap-2">
                <ShieldCheck size={14} /> Access Cert Records
              </button>
            </div>
          </div>

          {/* Secure Comms Terminal */}
          <div className="border border-slate-800 bg-[#050a07] p-4 h-48 flex flex-col font-mono text-xs text-slate-500 relative">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-slate-800"></div>
            <div className="mb-2 text-slate-600 border-b border-slate-800 pb-2">SECURE COMMS LINK ESTABLISHED</div>
            <div className="flex-1 overflow-hidden opacity-70">
              <p className="mb-1">&gt; INCOMING TRANSMISSION...</p>
              <p className="mb-1 text-slate-400">&gt; COMMAND: Module DR-109 updated.</p>
              <p className="mb-1">&gt; DECRYPTING PAYLOAD...</p>
              <p className="mb-1 text-green-700">&gt; SUCCESS.</p>
              <p className="animate-pulse">&gt; _</p>
            </div>
          </div>
        </div>

      </main>

      <footer className="relative z-10 border-t border-slate-800 bg-slate-950 p-4 text-center mt-auto">
        <p className="text-[10px] text-slate-600 tracking-[0.3em] font-bold">
          REGISTRY INTELLIGENCE DIVISION — CLASSIFIED TRAINING SYSTEM — DO NOT DISTRIBUTE
        </p>
      </footer>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100px); opacity: 0; }
        }
      `}} />
    </div>
  );
}
