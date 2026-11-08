
import React, { useEffect, useState } from 'react';

// Pemutar suara berdasarkan karakter
export const playSoundForCharacter = (charName) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) return;

    if (!window.globalAudioCtx) {
      window.globalAudioCtx = new AudioContext();
    }

    const ctx = window.globalAudioCtx;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const activeChar = charName || window.currentChar || 'Brown';
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (activeChar === 'Brown') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (activeChar === 'Cony') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(850, now);
      osc.frequency.exponentialRampToValueAtTime(1700, now + 0.09);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.09);
      osc.start(now);
      osc.stop(now + 0.09);
    } else if (activeChar === 'Sally') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1500, now);
      osc.frequency.setValueAtTime(1900, now + 0.04);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (activeChar === 'Choco') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(1300, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch (err) {
    console.error('Audio Playback Error:', err);
  }
};

export default function FallingLeaves({ character = 'Brown' }) {
  const fallingItems = [
    '❄️', '🍁', '🍃', '🍂',
    '🌸', '🍀', '✨', '🌿'
  ];

  const clickIcons = [
    '🍃', '🌸', '✨', '🍀',
    '🍁', '💖', '⭐', '❄️'
  ];

  const [clickParticles, setClickParticles] = useState([]);

  // Sinkronisasi karakter untuk cursor dan suara
    useEffect(() => {
    document.body.className = `cursor-${character.toLowerCase()}`;
    window.currentChar = character;

    console.log('Karakter aktif:', character);
    console.log('Class body:', document.body.className);
  }, [character]);

  // Efek partikel dan suara saat mouse diklik
  useEffect(() => {
    const handleGlobalInteraction = (e) => {
      playSoundForCharacter(character);

      const x = e.clientX;
      const y = e.clientY;

      if (x === 0 && y === 0) return;

      const randomIcon =
        clickIcons[Math.floor(Math.random() * clickIcons.length)];

      const id = Date.now() + Math.random();

      setClickParticles((prev) => [
        ...prev,
        { id, x, y, icon: randomIcon }
      ]);

      setTimeout(() => {
        setClickParticles((prev) =>
          prev.filter((p) => p.id !== id)
        );
      }, 500);
    };

    window.addEventListener('mousedown', handleGlobalInteraction);

    return () => {
      window.removeEventListener(
        'mousedown',
        handleGlobalInteraction
      );
    };
  }, [character]);

  return (
    <>
      {/* Efek salju dan daun jatuh */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => {
          const item = fallingItems[i % fallingItems.length];
          const leftPosition = (i * 3.3) % 100;
          const fallDuration = 4 + (i % 5);
          const fallDelay = (i % 6) * 0.4;

          return (
            <span
              key={i}
              className="animate-falling-item select-none"
              style={{
                left: `${leftPosition}%`,
                animationDuration: `${fallDuration}s`,
                animationDelay: `${fallDelay}s`,
                fontSize: `${22 + (i % 10)}px`
              }}
            >
              {item}
            </span>
          );
        })}
      </div>

      {/* Partikel ketika mouse diklik */}
      {clickParticles.map((p) => (
        <span
          key={p.id}
          className="click-particle-effect select-none"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`
          }}
        >
          {p.icon}
        </span>
      ))}
    </>
  );
}