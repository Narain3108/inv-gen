'use client';

import { useEffect } from 'react';

type SplashProps = {
  durationMs?: number;
  logoSrc?: string;
  onFinish?: () => void;
};

export default function Splash({
  durationMs = 4000,
  logoSrc = '/loo.jpg',
  onFinish,
}: SplashProps) {
  useEffect(() => {
    // Timer to show splash for specified duration
    const timer = setTimeout(() => {
      onFinish?.();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [durationMs, onFinish]);

  return (
    <>
      <style>{`
        @keyframes splash-zoom {
          0% { 
            opacity: 0; 
            transform: scale(0.9) rotate(-5deg); 
          }
          15% { 
            opacity: 1; 
            transform: scale(1.05) rotate(2deg); 
          }
          50% { 
            opacity: 1; 
            transform: scale(1.02) rotate(0deg); 
          }
          85% { 
            opacity: 1; 
            transform: scale(1.02) rotate(0deg); 
          }
          100% { 
            opacity: 0; 
            transform: scale(1.1) rotate(3deg); 
          }
        }

        @keyframes splash-fade-in {
          0% { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          100% { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }

        @keyframes splash-pulse {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
          }
          50% { 
            box-shadow: 0 0 40px rgba(168, 85, 247, 0.4);
          }
        }
      `}</style>

      {/* Full screen overlay */}
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f0f1e 100%)',
        }}
      >
        {/* Content container */}
        <div
          className="flex flex-col items-center justify-center gap-6"
          style={{
            animation: `splash-fade-in 600ms ease-out forwards`,
          }}
        >
          {/* Logo container with animation */}
          <div
            className="flex items-center justify-center rounded-2xl shadow-2xl"
            style={{
              width: 140,
              height: 140,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              animation: `splash-zoom ${durationMs}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
          >
            <img
              src={logoSrc}
              alt="InvoiceHub Logo"
              style={{
                width: '80%',
                height: '80%',
                objectFit: 'contain',
              }}
              onError={(e) => {
                console.warn(`Failed to load logo from ${logoSrc}`);
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>

          {/* Text content */}
          <div
            className="text-center"
            style={{
              animation: `splash-fade-in 800ms ease-out 200ms both`,
            }}
          >
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              InvoiceHub
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              Preparing your workspace…
            </p>
          </div>

          {/* Loading indicator */}
          <div
            className="flex gap-1"
            style={{
              animation: `splash-fade-in 1000ms ease-out 400ms both`,
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
                  animation: `splash-pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
