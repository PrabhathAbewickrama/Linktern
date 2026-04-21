import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Brain, MessageCircle } from 'lucide-react';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background glowing effects */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-accent/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary/20 blur-[120px] rounded-full pointer-events-none"></div>

      <main className="z-10 flex flex-col items-center text-center max-w-3xl glass-card rounded-3xl p-10 md:p-16 border border-white/10 shadow-2xl">
        <div className="w-20 h-20 mb-8 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.5)]">
          <Brain className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
          Unlock Your Career Potential
        </h1>
        
        <p className="text-lg md:text-xl text-gray-400 mb-10 leading-relaxed max-w-2xl">
          Discover exactly what skills you're missing for your dream job. Upload your CV, select your target role, and let our AI analyze your skill gap instantly.
        </p>
        
        {/* Buttons container */}
        <div className="flex flex-col md:flex-row gap-4">

          {/* Analyze Button (existing) */}
          <button
            onClick={() => navigate('/analyze')}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 font-bold text-white transition-all duration-300 bg-secondary rounded-full hover:bg-secondary/90 hover:shadow-[0_0_40px_rgba(79,70,229,0.4)] hover:-translate-y-1 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Analyze My Skills
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </span>
            <div className="absolute inset-0 z-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[-45deg] transition-all duration-700 group-hover:translate-x-[150%]"></div>
          </button>

          {/* NEW Chatbot Button */}
          <button
            onClick={() => navigate('/chat')}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 font-bold text-white transition-all duration-300 bg-accent rounded-full hover:bg-accent/90 hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:-translate-y-1 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Chatbot
            </span>
            <div className="absolute inset-0 z-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[-45deg] transition-all duration-700 group-hover:translate-x-[150%]"></div>
          </button>

        </div>
      </main>
      
      {/* Decorative floating elements */}
      <div className="absolute top-20 left-20 w-8 h-8 rounded-full bg-white/5 border border-white/10 animate-bounce" style={{ animationDuration: '3s' }}></div>
      <div className="absolute bottom-20 right-20 w-12 h-12 rounded-full bg-white/5 border border-white/10 animate-pulse" style={{ animationDuration: '4s' }}></div>
    </div>
  );
}

export default Home;