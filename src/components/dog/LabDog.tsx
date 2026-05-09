import { useEffect } from 'react';

export type DogPose = 'sit' | 'walk' | 'run' | 'lay';

interface Props {
  className?: string;
  size?: number;
  pose?: DogPose;
  facingRight?: boolean;
}

const KF = 'lab-v2-kf';

export default function LabDog({ className = '', size = 110, pose = 'sit', facingRight = false }: Props) {
  useEffect(() => {
    if (document.getElementById(KF)) return;
    const el = document.createElement('style');
    el.id = KF;
    el.textContent = `
      @keyframes ldTailSit  { 0%,100%{transform:rotate(-16deg)} 50%{transform:rotate(22deg)} }
      @keyframes ldTailWalk { 0%,100%{transform:rotate(-18deg)} 50%{transform:rotate(28deg)} }
      @keyframes ldTailRun  { 0%,100%{transform:rotate(6deg)}  50%{transform:rotate(-10deg)} }
      @keyframes ldTailLay  { 0%,100%{transform:rotate(-4deg)} 50%{transform:rotate(12deg)} }
      @keyframes ldEarA     { 0%,100%{transform:rotate(-4deg)} 50%{transform:rotate(7deg)} }
      @keyframes ldEarB     { 0%,100%{transform:rotate(4deg)}  50%{transform:rotate(-7deg)} }
      @keyframes ldSitBody  { 0%,100%{transform:scaleY(1) translateY(0)} 50%{transform:scaleY(1.025) translateY(-1.5px)} }
      @keyframes ldSitHead  { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-1.5px) rotate(1.2deg)} }
      @keyframes ldWalkBody { 0%,100%{transform:translateY(0) rotate(0.5deg)} 50%{transform:translateY(-3px) rotate(-0.5deg)} }
      @keyframes ldWalkF    { 0%,100%{transform:rotate(-22deg)} 50%{transform:rotate(22deg)} }
      @keyframes ldWalkB    { 0%,100%{transform:rotate(22deg)}  50%{transform:rotate(-22deg)} }
      @keyframes ldRunBody  { 0%,100%{transform:translateY(0) rotate(-1.5deg)} 50%{transform:translateY(-7px) rotate(2deg)} }
      @keyframes ldRunF     { 0%,100%{transform:rotate(-44deg)} 50%{transform:rotate(44deg)} }
      @keyframes ldRunB     { 0%,100%{transform:rotate(44deg)}  50%{transform:rotate(-44deg)} }
      @keyframes ldLayBody  { 0%,100%{transform:scaleX(1) scaleY(1)} 50%{transform:scaleX(1.012) scaleY(1.04)} }
      @keyframes ldLayHead  { 0%,35%,75%,100%{transform:translateY(0) rotate(0deg)} 55%{transform:translateY(-5px) rotate(-5deg)} }
      @keyframes ldShad     { 0%,100%{transform:scaleX(1);   opacity:0.22} 50%{transform:scaleX(0.84); opacity:0.12} }
      @keyframes ldShadRun  { 0%,100%{transform:scaleX(1);   opacity:0.14} 50%{transform:scaleX(0.88); opacity:0.07} }
      @keyframes ldShadLay  { 0%,100%{transform:scaleX(1);   opacity:0.24} 50%{transform:scaleX(0.97); opacity:0.18} }
      @keyframes ldTongue   { 0%,100%{transform:rotate(0) translateY(0)} 50%{transform:rotate(8deg) translateY(3px)} }
    `;
    document.head.appendChild(el);
  }, []);

  const sc = size / 120;
  const vw = 180, vh = 130;

  const po = (name: DogPose): React.CSSProperties => ({
    opacity: name === pose ? 1 : 0,
    transition: 'opacity 0.45s ease',
  });

  return (
    <svg
      viewBox={`0 0 ${vw} ${vh}`}
      width={vw * sc}
      height={vh * sc}
      className={`select-none ${className}`}
      style={{
        overflow: 'visible',
        filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.32))',
        transform: facingRight ? 'none' : 'scaleX(-1)',
      }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="ldBd" cx="44%" cy="33%" r="60%" fx="36%" fy="24%">
          <stop offset="0%"   stopColor="#F4BC4A" />
          <stop offset="44%" stopColor="#D08C28" />
          <stop offset="100%" stopColor="#925010" />
        </radialGradient>
        <radialGradient id="ldBl" cx="50%" cy="38%" r="58%">
          <stop offset="0%"   stopColor="#FCE0A0" />
          <stop offset="100%" stopColor="#ECC068" />
        </radialGradient>
        <radialGradient id="ldHd" cx="40%" cy="32%" r="58%" fx="34%" fy="26%">
          <stop offset="0%"   stopColor="#F6BC4C" />
          <stop offset="50%" stopColor="#CA8828" />
          <stop offset="100%" stopColor="#8A4C10" />
        </radialGradient>
        <radialGradient id="ldEr" cx="50%" cy="20%" r="72%">
          <stop offset="0%"   stopColor="#BA7020" />
          <stop offset="100%" stopColor="#7A3808" />
        </radialGradient>
        <radialGradient id="ldSn" cx="50%" cy="35%" r="62%">
          <stop offset="0%"   stopColor="#EEBC68" />
          <stop offset="100%" stopColor="#BC7A28" />
        </radialGradient>
        <radialGradient id="ldNs" cx="36%" cy="30%" r="62%">
          <stop offset="0%"   stopColor="#482E20" />
          <stop offset="100%" stopColor="#180C08" />
        </radialGradient>
        <radialGradient id="ldEy" cx="36%" cy="30%" r="66%">
          <stop offset="0%"   stopColor="#583820" />
          <stop offset="65%" stopColor="#281808" />
          <stop offset="100%" stopColor="#100804" />
        </radialGradient>
        <radialGradient id="ldPw" cx="50%" cy="28%" r="62%">
          <stop offset="0%"   stopColor="#E4A450" />
          <stop offset="100%" stopColor="#B07030" />
        </radialGradient>
        <radialGradient id="ldSh" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#000" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ══════ SIT — frontal 3/4 view ══════ */}
      <g style={po('sit')}>
        <ellipse style={{ transformOrigin: '90px 128px', animation: 'ldShad 3.2s ease-in-out infinite' }}
          cx="90" cy="128" rx="48" ry="4.5" fill="url(#ldSh)" />

        {/* Tail peeks to the left */}
        <g style={{ transformOrigin: '68px 93px', animation: 'ldTailSit 0.9s ease-in-out infinite' }}>
          <path d="M70 94 Q55 79 50 65 Q46 54 54 51 Q61 50 64 60 Q69 75 80 94 Z"
            fill="url(#ldBd)" stroke="#9C5C18" strokeWidth="0.5" />
          <path d="M73 93 Q59 79 55 66 Q52 59 54 55"
            fill="none" stroke="#F2C060" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        </g>

        {/* Body */}
        <g style={{ transformOrigin: '90px 110px', animation: 'ldSitBody 3.2s ease-in-out infinite' }}>
          <ellipse cx="66"  cy="114" rx="25" ry="24" fill="url(#ldBd)" />
          <ellipse cx="114" cy="114" rx="25" ry="24" fill="url(#ldBd)" />
          <ellipse cx="90"  cy="97"  rx="48" ry="30" fill="url(#ldBd)" />
          <ellipse cx="90"  cy="110" rx="32" ry="20" fill="url(#ldBl)" opacity="0.75" />
          <rect x="76" y="107" width="15" height="22" rx="7.5" fill="url(#ldBd)" />
          <rect x="99" y="107" width="15" height="22" rx="7.5" fill="url(#ldBd)" />
          <ellipse cx="83.5"  cy="128" rx="10.5" ry="5.5" fill="url(#ldPw)" />
          <ellipse cx="106.5" cy="128" rx="10.5" ry="5.5" fill="url(#ldPw)" />
          <line x1="80"    y1="128" x2="80"    y2="133" stroke="#A86030" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
          <line x1="83.5"  y1="127" x2="83.5"  y2="133" stroke="#A86030" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
          <line x1="87"    y1="128" x2="87"    y2="133" stroke="#A86030" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
          <line x1="103"   y1="128" x2="103"   y2="133" stroke="#A86030" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
          <line x1="106.5" y1="127" x2="106.5" y2="133" stroke="#A86030" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
          <line x1="110"   y1="128" x2="110"   y2="133" stroke="#A86030" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
          <path d="M68 85 Q90 91 112 85" fill="none" stroke="#E84040" strokeWidth="5" strokeLinecap="round" opacity="0.88" />
          <circle cx="90" cy="90" r="4.2" fill="#F0D030" stroke="#C0A020" strokeWidth="0.5" />
        </g>

        {/* Head */}
        <g style={{ transformOrigin: '90px 86px', animation: 'ldSitHead 3.2s ease-in-out infinite' }}>
          <g style={{ transformOrigin: '75px 51px', animation: 'ldEarA 2.2s ease-in-out infinite' }}>
            <path d="M75 51 Q60 47 55 59 Q51 73 61 81 Q69 85 75 77 Q81 67 75 51 Z"
              fill="url(#ldEr)" opacity="0.85" />
          </g>
          <circle cx="90" cy="51" r="33" fill="url(#ldHd)" />
          <g style={{ transformOrigin: '105px 51px', animation: 'ldEarB 2.2s ease-in-out infinite 0.3s' }}>
            <path d="M105 51 Q120 47 125 59 Q129 73 119 81 Q111 85 105 77 Q99 67 105 51 Z"
              fill="url(#ldEr)" />
          </g>
          <ellipse cx="81" cy="39" rx="14" ry="10" fill="#F8CC70" opacity="0.27" transform="rotate(-12 81 39)" />
          <ellipse cx="90" cy="68" rx="18" ry="13" fill="url(#ldSn)" />
          <ellipse cx="85" cy="65" rx="8.5" ry="5" fill="#FAD890" opacity="0.28" transform="rotate(-10 85 65)" />
          <ellipse cx="90" cy="60" rx="10" ry="7" fill="url(#ldNs)" />
          <ellipse cx="87" cy="58" rx="3.2" ry="2" fill="white" opacity="0.35" />
          <ellipse cx="87" cy="62" rx="2.2" ry="1.4" fill="#0A0400" opacity="0.6" />
          <ellipse cx="93" cy="62" rx="2.2" ry="1.4" fill="#0A0400" opacity="0.6" />
          <path d="M82 72 Q90 77 98 72" fill="none" stroke="#8A4C18" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M90 77 Q90 80 90 79" fill="none" stroke="#8A4C18" strokeWidth="1" strokeLinecap="round" />
          <circle cx="74"  cy="44" r="8" fill="url(#ldEy)" />
          <circle cx="75.5" cy="41.5" r="2.4" fill="white" opacity="0.75" />
          <circle cx="76.5" cy="42"   r="1"   fill="white" opacity="0.9" />
          <circle cx="106"  cy="44"   r="8" fill="url(#ldEy)" />
          <circle cx="107.5" cy="41.5" r="2.4" fill="white" opacity="0.75" />
          <circle cx="108.5" cy="42"   r="1"   fill="white" opacity="0.9" />
          <ellipse cx="74"  cy="36" rx="5.5" ry="1.8" fill="#B07028" opacity="0.5" transform="rotate(-8 74 36)" />
          <ellipse cx="106" cy="36" rx="5.5" ry="1.8" fill="#B07028" opacity="0.5" transform="rotate(8 106 36)" />
        </g>
      </g>

      {/* ══════ WALK — side view, head on right ══════ */}
      <g style={po('walk')}>
        <ellipse style={{ transformOrigin: '84px 125px', animation: 'ldShad 1.1s ease-in-out infinite' }}
          cx="84" cy="125" rx="54" ry="4" fill="url(#ldSh)" />

        <g style={{ transformOrigin: '24px 73px', animation: 'ldTailWalk 0.7s ease-in-out infinite' }}>
          <path d="M26 74 Q14 60 9 48 Q5 38 12 35 Q19 34 21 45 Q25 60 33 75 Z"
            fill="url(#ldBd)" stroke="#9C5C18" strokeWidth="0.4" />
        </g>

        {/* Far legs (behind body) */}
        <g style={{ transformOrigin: '52px 97px', animation: 'ldWalkB 0.55s ease-in-out infinite 0.275s' }}>
          <rect x="47" y="97" width="11" height="27" rx="5.5" fill="url(#ldBd)" opacity="0.68" />
          <ellipse cx="52.5" cy="123" rx="7.5" ry="4.5" fill="url(#ldPw)" opacity="0.68" />
        </g>
        <g style={{ transformOrigin: '113px 97px', animation: 'ldWalkF 0.55s ease-in-out infinite 0.275s' }}>
          <rect x="108" y="97" width="11" height="27" rx="5.5" fill="url(#ldBd)" opacity="0.68" />
          <ellipse cx="113.5" cy="123" rx="7.5" ry="4.5" fill="url(#ldPw)" opacity="0.68" />
        </g>

        {/* Body + collar */}
        <g style={{ transformOrigin: '84px 79px', animation: 'ldWalkBody 0.55s ease-in-out infinite' }}>
          <ellipse cx="84" cy="77" rx="60" ry="23" fill="url(#ldBd)" />
          <ellipse cx="84" cy="87" rx="42" ry="14" fill="url(#ldBl)" opacity="0.72" />
          <path d="M114 68 Q128 72 142 68" fill="none" stroke="#E84040" strokeWidth="4.5" strokeLinecap="round" opacity="0.88" />
          <circle cx="128" cy="72" r="3.4" fill="#F0D030" stroke="#C0A020" strokeWidth="0.4" />
        </g>

        {/* Near legs (in front of body) */}
        <g style={{ transformOrigin: '66px 97px', animation: 'ldWalkF 0.55s ease-in-out infinite' }}>
          <rect x="61" y="97" width="11" height="27" rx="5.5" fill="url(#ldBd)" />
          <ellipse cx="66.5" cy="123" rx="7.5" ry="4.5" fill="url(#ldPw)" />
        </g>
        <g style={{ transformOrigin: '129px 97px', animation: 'ldWalkB 0.55s ease-in-out infinite' }}>
          <rect x="124" y="97" width="11" height="27" rx="5.5" fill="url(#ldBd)" />
          <ellipse cx="129.5" cy="123" rx="7.5" ry="4.5" fill="url(#ldPw)" />
        </g>

        {/* Head */}
        <g style={{ transformOrigin: '150px 62px', animation: 'ldSitHead 1.1s ease-in-out infinite' }}>
          <g style={{ transformOrigin: '139px 55px', animation: 'ldEarA 1.5s ease-in-out infinite' }}>
            <path d="M139 55 Q128 51 124 61 Q120 72 128 77 Q136 80 141 73 Q145 64 139 55 Z"
              fill="url(#ldEr)" opacity="0.82" />
          </g>
          <circle cx="150" cy="61" r="23" fill="url(#ldHd)" />
          <g style={{ transformOrigin: '161px 55px', animation: 'ldEarB 1.5s ease-in-out infinite 0.25s' }}>
            <path d="M161 55 Q172 51 176 61 Q180 72 172 77 Q164 80 159 73 Q155 64 161 55 Z"
              fill="url(#ldEr)" />
          </g>
          <ellipse cx="142" cy="52" rx="10" ry="7" fill="#F8CC70" opacity="0.26" transform="rotate(-10 142 52)" />
          <ellipse cx="168" cy="68" rx="15" ry="10" fill="url(#ldSn)" />
          <ellipse cx="164" cy="65" rx="6"   ry="3.8" fill="#FAD890" opacity="0.28" transform="rotate(-8 164 65)" />
          <ellipse cx="179" cy="65" rx="7.5" ry="5"   fill="url(#ldNs)" />
          <ellipse cx="176" cy="63" rx="2.3" ry="1.5" fill="white" opacity="0.35" />
          <ellipse cx="176" cy="66"   rx="1.8" ry="1.2" fill="#0A0400" opacity="0.6" />
          <ellipse cx="181.5" cy="66" rx="1.8" ry="1.2" fill="#0A0400" opacity="0.6" />
          <circle cx="158"  cy="56" r="6.5" fill="url(#ldEy)" />
          <circle cx="159.5" cy="53.5" r="2" fill="white" opacity="0.75" />
          <circle cx="160.5" cy="54"   r="0.9" fill="white" opacity="0.9" />
          <path d="M163 73 Q168 76 174 73" fill="none" stroke="#8A4C18" strokeWidth="1" strokeLinecap="round" />
          <ellipse cx="158" cy="49" rx="4.5" ry="1.5" fill="#B07028" opacity="0.5" transform="rotate(5 158 49)" />
        </g>
      </g>

      {/* ══════ RUN — gallop, tongue out ══════ */}
      <g style={po('run')}>
        <ellipse style={{ transformOrigin: '87px 126px', animation: 'ldShadRun 0.42s ease-in-out infinite' }}
          cx="87" cy="126" rx="56" ry="3.5" fill="url(#ldSh)" />

        {/* Tail streams back */}
        <g style={{ transformOrigin: '21px 71px', animation: 'ldTailRun 0.42s ease-in-out infinite' }}>
          <path d="M22 72 Q8 66 4 58 Q1 50 8 49 Q14 49 16 56 Q20 65 27 73 Z"
            fill="url(#ldBd)" stroke="#9C5C18" strokeWidth="0.4" />
        </g>

        {/* Back legs — gallop offset */}
        <g style={{ transformOrigin: '54px 90px', animation: 'ldRunB 0.42s ease-in-out infinite 0.21s' }}>
          <rect x="49" y="90" width="11" height="28" rx="5.5" fill="url(#ldBd)" opacity="0.72" />
          <ellipse cx="54.5" cy="118" rx="7" ry="4" fill="url(#ldPw)" opacity="0.72" />
        </g>
        <g style={{ transformOrigin: '68px 90px', animation: 'ldRunB 0.42s ease-in-out infinite' }}>
          <rect x="63" y="90" width="11" height="28" rx="5.5" fill="url(#ldBd)" />
          <ellipse cx="68.5" cy="118" rx="7" ry="4" fill="url(#ldPw)" />
        </g>

        {/* Body — stretched */}
        <g style={{ transformOrigin: '88px 72px', animation: 'ldRunBody 0.42s ease-in-out infinite' }}>
          <ellipse cx="88" cy="70" rx="68" ry="19" fill="url(#ldBd)" />
          <ellipse cx="88" cy="78" rx="50" ry="11" fill="url(#ldBl)" opacity="0.7" />
          <path d="M122 62 Q137 66 152 62" fill="none" stroke="#E84040" strokeWidth="4" strokeLinecap="round" opacity="0.88" />
          <circle cx="137" cy="66" r="3.2" fill="#F0D030" stroke="#C0A020" strokeWidth="0.4" />
        </g>

        {/* Front legs */}
        <g style={{ transformOrigin: '119px 90px', animation: 'ldRunF 0.42s ease-in-out infinite 0.21s' }}>
          <rect x="114" y="90" width="11" height="28" rx="5.5" fill="url(#ldBd)" opacity="0.72" />
          <ellipse cx="119.5" cy="118" rx="7" ry="4" fill="url(#ldPw)" opacity="0.72" />
        </g>
        <g style={{ transformOrigin: '134px 90px', animation: 'ldRunF 0.42s ease-in-out infinite' }}>
          <rect x="129" y="90" width="11" height="28" rx="5.5" fill="url(#ldBd)" />
          <ellipse cx="134.5" cy="118" rx="7" ry="4" fill="url(#ldPw)" />
        </g>

        {/* Head — low, forward, tongue out */}
        <g style={{ transformOrigin: '154px 65px', animation: 'ldRunBody 0.42s ease-in-out infinite' }}>
          <path d="M143 57 Q131 53 128 61 Q126 68 133 73 Q140 76 144 69 Q147 62 143 57 Z"
            fill="url(#ldEr)" opacity="0.82" />
          <circle cx="154" cy="65" r="21" fill="url(#ldHd)" />
          <path d="M165 57 Q177 53 180 61 Q182 68 175 73 Q168 76 164 69 Q161 62 165 57 Z"
            fill="url(#ldEr)" />
          <ellipse cx="146" cy="56" rx="9" ry="6" fill="#F8CC70" opacity="0.24" transform="rotate(-8 146 56)" />
          <ellipse cx="171" cy="71" rx="14" ry="8.5" fill="url(#ldSn)" />
          <ellipse cx="182" cy="69" rx="6.5" ry="4.5" fill="url(#ldNs)" />
          <ellipse cx="179" cy="67" rx="2" ry="1.3" fill="white" opacity="0.35" />
          <ellipse cx="179" cy="70" rx="1.5" ry="1" fill="#0A0400" opacity="0.6" />
          <ellipse cx="184" cy="70" rx="1.5" ry="1" fill="#0A0400" opacity="0.6" />
          <circle cx="162"  cy="60" r="6" fill="url(#ldEy)" />
          <circle cx="163.5" cy="57.5" r="1.8" fill="white" opacity="0.75" />
          <circle cx="164.5" cy="58"   r="0.8" fill="white" opacity="0.9" />
          {/* Tongue */}
          <g style={{ transformOrigin: '168px 75px', animation: 'ldTongue 0.42s ease-in-out infinite' }}>
            <path d="M165 75 Q172 77 172 83 Q172 88 169 89 Q166 90 164 87 Q162 84 164 80 Z"
              fill="#E85878" />
            <path d="M164 81 Q168 82 171 81" fill="none" stroke="#C03850" strokeWidth="0.8" />
          </g>
        </g>
      </g>

      {/* ══════ LAY — side view, resting ══════ */}
      <g style={po('lay')}>
        <ellipse style={{ transformOrigin: '87px 124px', animation: 'ldShadLay 4s ease-in-out infinite' }}
          cx="87" cy="124" rx="72" ry="5" fill="url(#ldSh)" />

        <g style={{ transformOrigin: '20px 108px', animation: 'ldTailLay 2.5s ease-in-out infinite' }}>
          <path d="M22 109 Q10 106 6 112 Q3 117 10 120 Q17 122 22 116 Q25 112 22 109 Z"
            fill="url(#ldBd)" stroke="#9C5C18" strokeWidth="0.4" />
        </g>

        {/* Body */}
        <g style={{ transformOrigin: '87px 109px', animation: 'ldLayBody 4s ease-in-out infinite' }}>
          <ellipse cx="87" cy="109" rx="71" ry="14" fill="url(#ldBd)" />
          <ellipse cx="87" cy="114" rx="51" ry="9"  fill="url(#ldBl)" opacity="0.7" />
          {/* Hind haunch */}
          <ellipse cx="27" cy="115" rx="17" ry="10" fill="url(#ldBd)" opacity="0.84" transform="rotate(-14 27 115)" />
          <ellipse cx="20" cy="122" rx="11" ry="5.5" fill="url(#ldPw)" opacity="0.8" />
          {/* Front paws extended forward */}
          <rect x="130" y="103" width="13" height="21" rx="6.5" fill="url(#ldBd)" />
          <rect x="150" y="103" width="13" height="21" rx="6.5" fill="url(#ldBd)" />
          <ellipse cx="136.5" cy="124" rx="9"   ry="5.5" fill="url(#ldPw)" />
          <ellipse cx="156.5" cy="124" rx="9"   ry="5.5" fill="url(#ldPw)" />
          <line x1="133"   y1="124" x2="133"   y2="129" stroke="#A86030" strokeWidth="0.7" strokeLinecap="round" opacity="0.5" />
          <line x1="136.5" y1="123" x2="136.5" y2="129" stroke="#A86030" strokeWidth="0.7" strokeLinecap="round" opacity="0.5" />
          <line x1="140"   y1="124" x2="140"   y2="129" stroke="#A86030" strokeWidth="0.7" strokeLinecap="round" opacity="0.5" />
          <line x1="153"   y1="124" x2="153"   y2="129" stroke="#A86030" strokeWidth="0.7" strokeLinecap="round" opacity="0.5" />
          <line x1="156.5" y1="123" x2="156.5" y2="129" stroke="#A86030" strokeWidth="0.7" strokeLinecap="round" opacity="0.5" />
          <line x1="160"   y1="124" x2="160"   y2="129" stroke="#A86030" strokeWidth="0.7" strokeLinecap="round" opacity="0.5" />
          <path d="M122 104 Q138 108 154 104" fill="none" stroke="#E84040" strokeWidth="4" strokeLinecap="round" opacity="0.88" />
          <circle cx="138" cy="108" r="3.2" fill="#F0D030" stroke="#C0A020" strokeWidth="0.4" />
        </g>

        {/* Head — resting, occasionally lifts */}
        <g style={{ transformOrigin: '147px 102px', animation: 'ldLayHead 6s ease-in-out infinite' }}>
          <path d="M135 102 Q125 99 122 107 Q120 114 128 117 Q135 119 139 112 Q142 105 135 102 Z"
            fill="url(#ldEr)" opacity="0.82" />
          <circle cx="148" cy="102" r="22" fill="url(#ldHd)" />
          <path d="M161 102 Q171 99 173 107 Q175 114 167 117 Q160 119 156 112 Q153 105 161 102 Z"
            fill="url(#ldEr)" />
          <ellipse cx="140" cy="94"  rx="10" ry="6.5" fill="#F8CC70" opacity="0.24" transform="rotate(-8 140 94)" />
          <ellipse cx="165" cy="109" rx="14" ry="8.5" fill="url(#ldSn)" />
          <ellipse cx="176" cy="107" rx="7"  ry="4.5" fill="url(#ldNs)" />
          <ellipse cx="173" cy="105" rx="2.2" ry="1.4" fill="white" opacity="0.35" />
          <ellipse cx="173" cy="108" rx="1.7" ry="1.1" fill="#0A0400" opacity="0.6" />
          <ellipse cx="178" cy="108" rx="1.7" ry="1.1" fill="#0A0400" opacity="0.6" />
          <circle cx="156"  cy="97" r="6.5" fill="url(#ldEy)" />
          <circle cx="157.5" cy="94.5" r="1.8" fill="white" opacity="0.75" />
          <circle cx="158.5" cy="95"   r="0.8" fill="white" opacity="0.9" />
          {/* Drowsy half-closed lid */}
          <path d="M149.5 97 Q156 93 162.5 97" fill="none" stroke="#7A3808" strokeWidth="3.2" strokeLinecap="round" opacity="0.5" />
          <ellipse cx="156" cy="91" rx="4.5" ry="1.5" fill="#B07028" opacity="0.5" transform="rotate(5 156 91)" />
          <path d="M162 113 Q167 115 173 113" fill="none" stroke="#8A4C18" strokeWidth="1" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}
