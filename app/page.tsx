'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LandingPage() {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  function goHome() {
    setLeaving(true);
    setTimeout(() => router.replace('/home'), 500);
  }

  useEffect(() => {
    if (localStorage.getItem('osb_visited')) {
      router.replace('/home');
      return;
    }
    localStorage.setItem('osb_visited', 'true');

    const timer = setTimeout(goHome, 2800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <style>{`
        @keyframes logoIn {
          from { opacity: 0; transform: scale(0.75); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes nameUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(0.95); opacity: 0.6; }
          50%  { transform: scale(1.05); opacity: 0.2; }
          100% { transform: scale(0.95); opacity: 0.6; }
        }
        .logo-anim   { animation: logoIn  0.75s cubic-bezier(0.22,1,0.36,1) 0.15s both; }
        .name-anim   { animation: nameUp  0.55s ease-out 0.65s both; }
        .tag-anim    { animation: fadeIn  0.5s  ease-out 1.05s both; }
        .skip-anim   { animation: fadeIn  0.4s  ease-out 1.4s  both; }
        .ring-anim   { animation: pulse-ring 2s ease-in-out 0.15s infinite; }
        .page-leave  { animation: fadeIn  0.5s  ease-in  reverse both; }
      `}</style>

      <div className={`fixed inset-0 z-50 bg-white flex flex-col items-center justify-center select-none ${leaving ? 'page-leave' : ''}`}>

        {/* Pulsing ring behind logo */}
        <div className="relative flex items-center justify-center">
          <div className="ring-anim absolute w-52 h-52 rounded-full border-2 border-[#4db899]/30" />

          <div className="logo-anim relative w-40 h-40 rounded-full overflow-hidden bg-white shadow-lg shadow-[#4db899]/15 border border-[#e0f2ea]">
            <Image
              src="/logo.jpg"
              alt="OneStopBook logo"
              fill
              className="object-contain p-3"
              priority
            />
          </div>
        </div>

        {/* Brand name */}
        <div className="name-anim mt-7 text-[1.75rem] font-semibold tracking-tight text-gray-900">
          onestop<span className="text-[#4db899]">book</span>
        </div>

        {/* Tagline */}
        <p className="tag-anim mt-2 text-sm text-gray-400 tracking-wide">
          Book your space, play your game.
        </p>

        {/* Skip */}
        <button
          onClick={goHome}
          className="skip-anim absolute bottom-10 right-10 text-xs text-gray-400 hover:text-[#4db899] transition-colors"
        >
          Skip →
        </button>
      </div>
    </>
  );
}
