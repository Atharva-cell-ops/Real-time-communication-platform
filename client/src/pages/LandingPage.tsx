import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import {
  Video,
  Shield,
  Zap,
  PenTool,
  Lock,
  ArrowRight,
  Layers,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [meetingCodeInput, setMeetingCodeInput] = useState('');

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (meetingCodeInput.trim()) {
      const code = meetingCodeInput.trim().toLowerCase();
      navigate(`/room/${code}`);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col selection:bg-brand-500/30 selection:text-brand-200">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-brand-600/15 rounded-full blur-[120px]" />
        <div className="absolute top-20 right-1/4 w-[450px] h-[450px] bg-indigo-600/15 rounded-full blur-[140px]" />
      </div>

      {/* Hero Section */}
      <section className="pt-20 pb-16 sm:pt-28 sm:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Next-Generation Real-Time Collaboration</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
          Seamless Real-Time{' '}
          <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            Video & Team Collaboration
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          CONNECTX brings crystal-clear WebRTC video calling, interactive collaborative whiteboards, instant messaging, and secure file sharing together into a single ultra-responsive platform.
        </p>

        {/* Call to Actions & Join by Code */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          {isAuthenticated ? (
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <Link to="/register" className="w-full">
                <Button variant="primary" size="lg" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Start Free Meeting
                </Button>
              </Link>
              <Link to="/login" className="w-full">
                <Button variant="secondary" size="lg" className="w-full">
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Quick Join Bar */}
        <div className="pt-6 max-w-md mx-auto">
          <form onSubmit={handleJoinByCode} className="flex items-center gap-2 bg-dark-900/90 border border-dark-700 p-2 rounded-2xl shadow-xl">
            <input
              type="text"
              placeholder="Enter meeting code (e.g. team-sync-now)"
              value={meetingCodeInput}
              onChange={(e) => setMeetingCodeInput(e.target.value)}
              className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
            <Button variant="secondary" size="sm" type="submit" disabled={!meetingCodeInput.trim()}>
              Join
            </Button>
          </form>
        </div>

        {/* Feature Highlights Grid */}
        <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-6xl mx-auto">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-dark-900/60 border border-dark-800 backdrop-blur-md space-y-4 hover:border-brand-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">WebRTC Mesh Video & Audio</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              True peer-to-peer WebRTC connections for minimum latency, dynamic resolution scaling, and speaking activity detection.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-dark-900/60 border border-dark-800 backdrop-blur-md space-y-4 hover:border-brand-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <PenTool className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Collaborative Whiteboard</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Real-time vector synchronization with pens, shapes, highlighters, erasers, undo support, and PNG export.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-dark-900/60 border border-dark-800 backdrop-blur-md space-y-4 hover:border-brand-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Enterprise-Grade Security</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              JWT authentication, bcrypt hashed credentials, passcode protection, rate limiting, and room lock mechanisms.
            </p>
          </div>
        </div>

        {/* Tech Stack Bar */}
        <div className="pt-16 border-t border-dark-800/80 max-w-4xl mx-auto space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Powered by modern engineering standards
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1.5"><Layers className="w-4 h-4 text-brand-400" /> React 18 & TypeScript</span>
            <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-400" /> WebRTC P2P Mesh</span>
            <span className="flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-cyan-400" /> Socket.io Signaling</span>
            <span className="flex items-center gap-1.5"><Lock className="w-4 h-4 text-emerald-400" /> PostgreSQL & Prisma</span>
          </div>
        </div>
      </section>
    </div>
  );
};
