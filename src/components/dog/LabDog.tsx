import { useEffect, useRef } from 'react';

interface Props {
  className?: string;
  size?: number;
}

export default function LabDog({ className = '', size = 110 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Inject keyframes once
  useEffect(() => {
    if (document.getElementById('lab-dog-keyframes')) return;
    const style = document.createElement('style');
    style.id = 'lab-dog-keyframes';
    style.textContent = `
      @keyframes labTailWag {
        0%,100% { transform: rotate(-18deg) translateX(0); }
        50%      { transform: rotate(22deg) translateX(2px); }
      }
      @keyframes labEarL {
        0%,100% { transform: rotate(-4deg); }
        50%      { transform: rotate(6deg); }
      }
      @keyframes labEarR {
        0%,100% { transform: rotate(4deg); }
        50%      { transform: rotate(-6deg); }
      }
      @keyframes labBreathe {
        0%,100% { transform: scaleY(1) translateY(0); }
        50%      { transform: scaleY(1.022) translateY(-1px); }
      }
      @keyframes labHeadNod {
        0%,100% { transform: translateY(0) rotate(0deg); }
        50%      { transform: translateY(-1.5px) rotate(1.5deg); }
      }
      @keyframes labBounce {
        0%,100% { transform: translateY(0); }
        30%      { transform: translateY(-10px); }
        55%      { transform: translateY(-4px); }
        75%      { transform: translateY(-8px); }
        90%      { transform: translateY(-2px); }
      }
      @keyframes labShadowPulse {
        0%,100% { transform: scaleX(1);   opacity: 0.18; }
        50%      { transform: scaleX(0.85); opacity: 0.10; }
      }
      .lab-tail { transform-origin: 14px 8px; animation: labTailWag 0.9s ease-in-out infinite; }
      .lab-ear-l { transform-origin: 50% 0%;  animation: labEarL 2.2s ease-in-out infinite; }
      .lab-ear-r { transform-origin: 50% 0%;  animation: labEarR 2.2s ease-in-out infinite 0.3s; }
      .lab-body  { transform-origin: 50% 80%; animation: labBreathe 3.2s ease-in-out infinite; }
      .lab-head  { transform-origin: 50% 100%; animation: labHeadNod 3.2s ease-in-out infinite; }
      .lab-shadow { transform-origin: 50% 50%; animation: labShadowPulse 3.2s ease-in-out infinite; }
      .lab-root:hover .lab-tail { animation-duration: 0.38s !important; }
      .lab-root:hover { animation: labBounce 0.7s ease forwards; }
    `;
    document.head.appendChild(style);
  }, []);

  const w = 120;
  const h = 148;
  const scale = size / 120;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${w} ${h}`}
      width={w * scale}
      height={h * scale}
      className={`lab-root select-none ${className}`}
      style={{ overflow: 'visible', filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.25))' }}
      aria-hidden="true"
    >
      <defs>
        {/* Gradient: base golden fur */}
        <radialGradient id="labBodyGrad" cx="48%" cy="38%" r="58%" fx="40%" fy="30%">
          <stop offset="0%"   stopColor="#F0B450" />
          <stop offset="40%"  stopColor="#D4903A" />
          <stop offset="100%" stopColor="#A86020" />
        </radialGradient>
        {/* Lighter belly */}
        <radialGradient id="labBellyGrad" cx="50%" cy="40%" r="55%">
          <stop offset="0%"   stopColor="#F8D898" />
          <stop offset="100%" stopColor="#E8B860" />
        </radialGradient>
        {/* Head gradient */}
        <radialGradient id="labHeadGrad" cx="42%" cy="36%" r="56%" fx="38%" fy="28%">
          <stop offset="0%"   stopColor="#F2B84C" />
          <stop offset="55%"  stopColor="#CC8830" />
          <stop offset="100%" stopColor="#9A5C18" />
        </radialGradient>
        {/* Ear gradient */}
        <radialGradient id="labEarGrad" cx="50%" cy="20%" r="70%">
          <stop offset="0%"   stopColor="#C07828" />
          <stop offset="100%" stopColor="#844010" />
        </radialGradient>
        {/* Snout */}
        <radialGradient id="labSnoutGrad" cx="50%" cy="35%" r="60%">
          <stop offset="0%"   stopColor="#ECC070" />
          <stop offset="100%" stopColor="#C08030" />
        </radialGradient>
        {/* Nose */}
        <radialGradient id="labNoseGrad" cx="38%" cy="32%" r="60%">
          <stop offset="0%"   stopColor="#4A3028" />
          <stop offset="100%" stopColor="#1A0C08" />
        </radialGradient>
        {/* Eye */}
        <radialGradient id="labEyeGrad" cx="38%" cy="32%" r="65%">
          <stop offset="0%"   stopColor="#5A3820" />
          <stop offset="60%"  stopColor="#2A1808" />
          <stop offset="100%" stopColor="#100804" />
        </radialGradient>
        {/* Paw */}
        <radialGradient id="labPawGrad" cx="50%" cy="30%" r="60%">
          <stop offset="0%"   stopColor="#E0A050" />
          <stop offset="100%" stopColor="#B07030" />
        </radialGradient>
        {/* Ground shadow */}
        <radialGradient id="labShadGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#000" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ── Ground shadow ── */}
      <ellipse className="lab-shadow" cx="58" cy="143" rx="36" ry="5" fill="url(#labShadGrad)" />

      {/* ── Tail (behind body) ── */}
      <g className="lab-tail" style={{ transformOrigin: '80px 100px' }}>
        <path
          d="M82 100 Q102 85 108 72 Q112 62 105 58 Q99 56 96 65 Q90 78 78 96 Z"
          fill="url(#labBodyGrad)"
          stroke="#A86020"
          strokeWidth="0.5"
        />
        {/* Tail highlight */}
        <path
          d="M85 98 Q103 84 107 73 Q109 67 106 63"
          fill="none"
          stroke="#F0C060"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.45"
        />
      </g>

      {/* ── Body ── */}
      <g className="lab-body">
        {/* Haunches / sitting thighs */}
        <ellipse cx="36" cy="116" rx="18" ry="20" fill="url(#labBodyGrad)" />
        <ellipse cx="80" cy="116" rx="18" ry="20" fill="url(#labBodyGrad)" />

        {/* Main body torso */}
        <ellipse cx="58" cy="105" rx="36" ry="30" fill="url(#labBodyGrad)" />

        {/* Belly light patch */}
        <ellipse cx="57" cy="112" rx="20" ry="16" fill="url(#labBellyGrad)" opacity="0.7" />

        {/* Front legs */}
        <rect x="40" y="115" width="14" height="22" rx="7" fill="url(#labBodyGrad)" />
        <rect x="64" y="115" width="14" height="22" rx="7" fill="url(#labBodyGrad)" />

        {/* Front paws */}
        <ellipse cx="47" cy="137" rx="9" ry="6" fill="url(#labPawGrad)" />
        <ellipse cx="71" cy="137" rx="9" ry="6" fill="url(#labPawGrad)" />
        {/* Toe lines */}
        <line x1="44" y1="137" x2="44" y2="142" stroke="#A86030" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
        <line x1="47" y1="136" x2="47" y2="142" stroke="#A86030" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
        <line x1="50" y1="137" x2="50" y2="142" stroke="#A86030" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
        <line x1="68" y1="137" x2="68" y2="142" stroke="#A86030" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
        <line x1="71" y1="136" x2="71" y2="142" stroke="#A86030" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
        <line x1="74" y1="137" x2="74" y2="142" stroke="#A86030" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />

        {/* Collar */}
        <path
          d="M36 90 Q58 96 80 90"
          fill="none"
          stroke="#E84040"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.85"
        />
        {/* Collar tag */}
        <circle cx="58" cy="94" r="4" fill="#F0D030" stroke="#C0A020" strokeWidth="0.5" />
      </g>

      {/* ── Head ── */}
      <g className="lab-head" style={{ transformOrigin: '58px 90px' }}>
        {/* Left ear (far side, slightly darker) */}
        <g className="lab-ear-l" style={{ transformOrigin: '38px 72px' }}>
          <path
            d="M38 72 Q24 68 20 80 Q16 94 26 102 Q34 106 40 98 Q46 88 38 72 Z"
            fill="url(#labEarGrad)"
            opacity="0.85"
          />
        </g>

        {/* Head main */}
        <circle cx="58" cy="72" r="26" fill="url(#labHeadGrad)" />

        {/* Right ear (near side) */}
        <g className="lab-ear-r" style={{ transformOrigin: '78px 72px' }}>
          <path
            d="M78 72 Q92 68 96 80 Q100 94 90 102 Q82 106 76 98 Q70 88 78 72 Z"
            fill="url(#labEarGrad)"
          />
        </g>

        {/* Forehead highlight (3D dome) */}
        <ellipse cx="52" cy="62" rx="11" ry="8" fill="#F8CC70" opacity="0.28" transform="rotate(-12 52 62)" />

        {/* Snout protrusion */}
        <ellipse cx="58" cy="82" rx="14" ry="10" fill="url(#labSnoutGrad)" />
        {/* Snout highlight */}
        <ellipse cx="54" cy="79" rx="6" ry="3.5" fill="#F8D890" opacity="0.3" transform="rotate(-10 54 79)" />

        {/* Nose */}
        <ellipse cx="58" cy="77" rx="7.5" ry="5" fill="url(#labNoseGrad)" />
        {/* Nose highlight */}
        <ellipse cx="55" cy="75" rx="2.5" ry="1.5" fill="white" opacity="0.35" />
        {/* Nostrils */}
        <ellipse cx="55" cy="78" rx="1.8" ry="1.2" fill="#0A0400" opacity="0.6" />
        <ellipse cx="61" cy="78" rx="1.8" ry="1.2" fill="#0A0400" opacity="0.6" />

        {/* Mouth smile */}
        <path d="M52 84 Q58 88 64 84" fill="none" stroke="#8A4C18" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M58 88 Q58 91 58 90" fill="none" stroke="#8A4C18" strokeWidth="1" strokeLinecap="round" />

        {/* Left eye */}
        <circle cx="46" cy="68" r="6.5" fill="url(#labEyeGrad)" />
        <circle cx="47.5" cy="65.5" r="2" fill="white" opacity="0.75" />
        <circle cx="48.5" cy="66" r="0.8" fill="white" opacity="0.9" />

        {/* Right eye */}
        <circle cx="70" cy="68" r="6.5" fill="url(#labEyeGrad)" />
        <circle cx="71.5" cy="65.5" r="2" fill="white" opacity="0.75" />
        <circle cx="72.5" cy="66" r="0.8" fill="white" opacity="0.9" />

        {/* Eyebrow markings */}
        <ellipse cx="46" cy="62" rx="4" ry="1.5" fill="#B07028" opacity="0.5" transform="rotate(-8 46 62)" />
        <ellipse cx="70" cy="62" rx="4" ry="1.5" fill="#B07028" opacity="0.5" transform="rotate(8 70 62)" />
      </g>
    </svg>
  );
}
