import React, { useState, useEffect, useRef } from "react";

const DB_KEY = "inventory_app_data_v3";

const safeStorage = {
  get: async (key, shared = true) => {
    try {
      if (typeof window !== "undefined" && window.storage && typeof window.storage.get === "function") {
        return await window.storage.get(key, shared);
      }
    } catch (e) {}
    try { const v = localStorage.getItem(key); return v ? { value: v } : null; } catch (e) { return null; }
  },
  set: async (key, val, shared = true) => {
    try {
      if (typeof window !== "undefined" && window.storage && typeof window.storage.set === "function") {
        return await window.storage.set(key, val, shared);
      }
    } catch (e) {}
    try { localStorage.setItem(key, val); } catch (e) {}
  }
};

const SECTIONS = [
  { id: "freezer", name: "Deep Freezer", theme: "ice" },
  { id: "under",   name: "Under House",  theme: "spooky" },
  { id: "pantry",  name: "Pantry",  theme: "pantry" },
  { id: "nursery", name: "Nursery",  theme: "nursery" },
];

const FREEZER = [
  ["Chicken Boob",8,"Boobies"],["Ground Chicken",4.5,"Pounds"],["Chicken Legs",6,"Legs"],
  ["Ground Beef",1,"Pounds"],["Ground Pork",2.7,"Pounds"],["Bone Broth",15,"Cups"],
  ["Chicken Scraps for Grind",1,"Bag"],["Shrimp",2,"Pounds"],["Ravioli Filling",1,"Small Deli Container"],
  ["Char Siu BBQ Pork",1,"Pounds"],["Cod Pieces",2,"Bags"],["Bacon",1,"Bags"],
  ["Chicken Stock",14,"Cups"],["Frozen Jalapenos",2,"Peppers"],["Puff Pastry",1,"Box"],
  ["Butter",1,"Pound"],["Sourdough",1,"Loaf"],["Dave's 21 Whole Grain Bread",1,"Loaf"],
  ["Drugs",1,"Bar"],["Pork Jowl",1,"Pack"],["Chicken Livers",1,"Tub"],
  ["Sous Vide Salmon Pouch",1,"Pouch"],["Ox Tail",1,"Pack"],["Chicken Wings",20,"Wings"],
  ["Chicken Thigh + Leg",4,"Legs"],["Whole Chicken",1,"Chicken"],["Chicken Thigh",2,"Thighs"],
  ["Stock Bag (Chicken)",1,"Bags"],["Chili",3,"Bags"],["Seafood Stock",4,"Pints"],
  ["Pork Belly",1.5,"Pounds"],["Frozen Mixed Berries",4,"Pounds"],["Blueberries",1,"Large Container"],
  ["Arancini",3,"Balls"],["Dumplings",2,"Partial Bags"],["Lacto Fermented Plums",1,"Bag"],
  ["Cauliflower Rice",1,"Bags"],["Wonton Wrappers",1,"Pack"],["Edamame",1,"Bags"],
  ["Wubba Treats",5,"Balls"],["Mini Wubba Treats",14,"Balls"],["Protein Ice Cream",1,"Container"],
  ["Ground Coffee",2,"Bags"],["Black Cod",2,"Bags"],["Salmon",1,"Bags"],
  ["Flank Steaks",1,"Bags"],["Otter Pops",20,"Pops"],["Meat Balls",1,"Bag"],
];

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const DEFAULT_SPECIALTY = [
  { id: "asian_store", name: "Asian Store", items: [] },
  { id: "costco",      name: "Costco",      items: [] },
  { id: "amazon",      name: "Amazon",      items: [] },
];

function freshData() {
  const sections = {};
  SECTIONS.forEach(s => { sections[s.id] = []; });
  sections.freezer = FREEZER.map(([name, qty, unit]) => ({ id: uid(), name, qty, unit }));
  return { sections, shopping: [], specialty: JSON.parse(JSON.stringify(DEFAULT_SPECIALTY)), names: {} };
}

function emptyData() {
  const sections = {};
  SECTIONS.forEach(s => { sections[s.id] = []; });
  return { sections, shopping: [], specialty: JSON.parse(JSON.stringify(DEFAULT_SPECIALTY)), names: {} };
}

function autocorrect(s) {
  return s
    .replace(/\bbreasts?\b/gi, m => /^[A-Z]/.test(m) ? (m.toLowerCase().endsWith("s") ? "Boobs" : "Boob") : (m.toLowerCase().endsWith("s") ? "boobs" : "boob"))
    .replace(/\bthighs?\b/gi, m => /^[A-Z]/.test(m) ? "Ass" : "ass");
}
function fmtQ(n){ n=parseFloat(n); if(isNaN(n))return"0"; return n===Math.floor(n)?String(n):parseFloat(n.toFixed(2)).toString(); }

const TH = {
  ice:     { accent:"#38bdf8", bg:"linear-gradient(180deg, #020c1b 0%, #081c3a 100%)", surf:"rgba(14, 33, 61, 0.5)",  surfBdr:"rgba(56, 189, 248, 0.3)",  hdr:"rgba(8, 28, 58, 0.88)",  text:"#f0f9ff", icon:"snow" },
  spooky:  { accent:"#a78bfa", bg:"linear-gradient(180deg, #090514 0%, #1c0e2d 100%)", surf:"rgba(38, 20, 61, 0.5)",  surfBdr:"rgba(167, 139, 250, 0.25)", hdr:"rgba(28, 14, 45, 0.88)",  text:"#faf5ff", icon:"ghost" },
  pantry:  { accent:"#f59e0b", bg:"linear-gradient(180deg, #110a02 0%, #1e1005 100%)", surf:"rgba(58, 32, 8, 0.52)",   surfBdr:"rgba(245, 158, 11, 0.28)",  hdr:"rgba(17, 10, 2, 0.90)",   text:"#fef3c7", icon:"herb"  },
  nursery: { accent:"#10b981", bg:"linear-gradient(180deg, #04100b 0%, #11281e 100%)", surf:"rgba(16, 44, 31, 0.5)",   surfBdr:"rgba(16, 185, 129, 0.3)",  hdr:"rgba(17, 40, 30, 0.88)",  text:"#ecfdf5", icon:"forest" },
};
const CART = "#4ade80";

const DARK_THEME  = { BG:"#050508", SURF:"#12121a", SURF2:"#1b1b26", BDR:"#282836", TXT:"#f4f4f7", TXT2:"#a1a1b5", TXT3:"#62627a" };
const LIGHT_THEME = { BG:"#f5f5f0", SURF:"#ffffff",  SURF2:"#ebebeb", BDR:"#d4d4cc", TXT:"#111118",  TXT2:"#55556a",  TXT3:"#8888a0" };

const makeCSS = (T) => `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html,body{overscroll-behavior:none;background:${T.BG};font-family:'Inter',system-ui,sans-serif;color:${T.TXT}}
input,button{font-family:'Inter',system-ui,sans-serif}
::-webkit-scrollbar{width:0}
.press{transition:transform .12s cubic-bezier(0.4, 0, 0.2, 1),opacity .12s ease}.press:active{transform:scale(.96);opacity:.85}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes sheet{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes floatGhost{0%,100%{transform:translateY(0px) translateX(0px)}50%{transform:translateY(-8px) translateX(4px)}}
@keyframes fireFlicker{0%, 100%{transform: scaleY(1) scaleX(1); opacity: 0.95;} 50%{transform: scaleY(1.15) scaleX(0.95); opacity: 1;}}
.nm{background:transparent;border:none;outline:none;color:inherit;font-size:16px;font-weight:700;width:100%;padding:0}
.nm::placeholder{color:rgba(255,255,255,.25)}
.field{width:100%;background:${T.BG};border:2px solid ${T.BDR};border-radius:14px;padding:15px 16px;font-size:16px;font-weight:500;color:${T.TXT};outline:none;transition:all 0.2s}
.field:focus{border-color:${CART};box-shadow:0 0 0 3px rgba(74,222,128,0.1)}
`;

const bs={position:"fixed",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0,overflow:"visible"};

function IceBorder() {
  /* Realistic icicles: each icicle has a body path + highlight shimmer + drip tip.
     Modelled after dense seamless-border style — varied heights, rounded bases,
     sharp tapering points, layered depth (back row dimmer, front row brighter). */
  const icicle = (x, w, h, key, opacity=1) => {
    const half = w/2;
    const tip  = x + half;
    const base = 80;
    // main body: flat top, curved sides narrowing to rounded point
    const body = `M${x},${base} L${x+w},${base} Q${x+w+2},${base+h*0.4} ${tip+2},${base+h*0.85} Q${tip+1},${base+h} ${tip},${base+h} Q${tip-1},${base+h} ${tip-2},${base+h*0.85} Q${x-2},${base+h*0.4} ${x},${base} Z`;
    // highlight: thin bright streak on left-center
    const hl   = `M${x+w*0.28},${base+2} Q${x+w*0.32},${base+h*0.35} ${x+w*0.30},${base+h*0.55}`;
    // secondary shimmer
    const sh   = `M${x+w*0.55},${base+4} Q${x+w*0.58},${base+h*0.25} ${x+w*0.56},${base+h*0.38}`;
    return (
      <g key={key} opacity={opacity}>
        <path d={body} fill="url(#icMain)"/>
        <path d={body} fill="url(#icSheen)" opacity="0.5"/>
        <path d={hl} stroke="rgba(255,255,255,0.7)" strokeWidth={w*0.12} fill="none" strokeLinecap="round"/>
        <path d={sh} stroke="rgba(255,255,255,0.4)" strokeWidth={w*0.08} fill="none" strokeLinecap="round"/>
        {/* drip tip bubble */}
        <ellipse cx={tip} cy={base+h+2} rx={w*0.12} ry={w*0.14} fill="rgba(186,230,253,0.7)"/>
      </g>
    );
  };

  // [x, width, height] — back row (dimmer, taller), front row (bright, varied)
  const back  = [[0,32,185],[28,28,145],[52,36,210],[84,30,170],[110,42,230],[148,26,155],[170,38,195],[204,32,160],[232,44,245],[272,28,150],[296,40,205],[332,30,165],[358,34,190]];
  const front = [[4,24,130],[30,20,95],[55,28,155],[88,22,110],[114,32,175],[152,18,80],[174,26,140],[210,22,100],[240,34,185],[276,20,90],[302,30,150],[338,22,105],[362,26,135]];

  /* Side frost columns — vertical gradient bars + scattered ice crystal dots */
  const sideIce = (flip) => {
    const sx = flip ? 373 : 0;
    const w  = 17;
    return (
      <g>
        <rect x={flip?sx:0} y="80" width={w} height="764" fill={flip?"url(#sideR)":"url(#sideL)"} opacity="0.22"/>
        {/* small hanging side icicles at intervals */}
        {[140,220,310,400,490,580,670,760].map((y,i)=>{
          const iw = 8+(i%3)*4;
          const ih = 20+(i%4)*12;
          const ix = flip ? sx+2 : w-iw-2;
          return <path key={i} d={`M${ix},${y} L${ix+iw},${y} Q${ix+iw+1},${y+ih*0.5} ${ix+iw/2},${y+ih} Q${ix-1},${y+ih*0.5} ${ix},${y} Z`} fill="url(#icMain)" opacity={0.35+(i%3)*0.1}/>;
        })}
        {/* frost crystals */}
        {[180,320,470,620,740].map((y,i)=>{
          const cx2 = flip ? sx+9 : 9;
          const r   = 2+(i%2);
          return <circle key={i} cx={cx2} cy={y} r={r} fill="rgba(186,230,253,0.5)"/>;
        })}
      </g>
    );
  };

  return (
    <svg style={bs} viewBox="0 0 390 844" preserveAspectRatio="none">
      <defs>
        <linearGradient id="icMain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#e0f7ff" stopOpacity="0.98"/>
          <stop offset="18%"  stopColor="#bae6fd" stopOpacity="0.92"/>
          <stop offset="55%"  stopColor="#7dd3fc" stopOpacity="0.80"/>
          <stop offset="85%"  stopColor="#38bdf8" stopOpacity="0.55"/>
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0"/>
        </linearGradient>
        <linearGradient id="icSheen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.6"/>
          <stop offset="40%"  stopColor="#ffffff" stopOpacity="0"/>
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="sideL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#7dd3fc" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="sideR" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%"   stopColor="#7dd3fc" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0"/>
        </linearGradient>
      </defs>

      {/* Frost shelf at top */}
      <path d="M0,80 Q18,76 36,80 Q54,74 72,80 Q90,76 108,80 Q126,73 144,80 Q162,75 180,80 Q198,73 216,80 Q234,75 252,80 Q270,73 288,80 Q306,75 324,80 Q342,74 360,80 Q375,77 390,80 L390,88 Q195,84 0,88 Z" fill="rgba(186,230,253,0.35)"/>

      {/* Back row icicles (dimmer, taller) */}
      <g opacity="0.45">
        {back.map(([x,w,h],i) => icicle(x,w,h,`b${i}`))}
      </g>
      {/* Front row icicles (bright) */}
      <g opacity="0.88">
        {front.map(([x,w,h],i) => icicle(x,w,h,`f${i}`))}
      </g>

      {/* Icy side columns */}
      {sideIce(false)}
      {sideIce(true)}

      {/* Scattered frost sparkles */}
      {[[20,300,2.5],[368,260,2],[15,500,3],[374,450,2.5],[22,680,2],[370,700,3]].map(([cx2,cy,r],i)=>(
        <g key={i} opacity="0.5">
          <circle cx={cx2} cy={cy} r={r} fill="#e0f7ff"/>
          <line x1={cx2-r*2} y1={cy} x2={cx2+r*2} y2={cy} stroke="rgba(186,230,253,0.6)" strokeWidth="0.8"/>
          <line x1={cx2} y1={cy-r*2} x2={cx2} y2={cy+r*2} stroke="rgba(186,230,253,0.6)" strokeWidth="0.8"/>
        </g>
      ))}
    </svg>
  );
}

function SpookyBorder() {
  return (
    <svg style={bs} viewBox="0 0 390 844" preserveAspectRatio="none">
      <defs>
        <radialGradient id="pumpGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#ea580c" />
        </radialGradient>
      </defs>
      <g stroke="#c084fc" strokeWidth="0.8" fill="none" opacity="0.45">
        <line x1="0" y1="80" x2="120" y2="200" />
        <line x1="0" y1="80" x2="60" y2="230" />
        <line x1="0" y1="80" x2="150" y2="130" />
        <path d="M 40,80 Q 35,115 0,120 M 80,80 Q 70,150 0,160 M 120,80 Q 100,190 0,200" />
        <line x1="390" y1="80" x2="270" y2="200" />
        <line x1="390" y1="80" x2="330" y2="230" />
        <line x1="390" y1="80" x2="240" y2="130" />
        <path d="M 350,80 Q 355,115 390,120 M 310,80 Q 320,150 390,160 M 270,80 Q 290,190 390,200" />
      </g>
      <g opacity="0.5">
        <line x1="55" y1="135" x2="55" y2="250" stroke="#c084fc" strokeWidth="0.6" />
        <ellipse cx="55" cy="254" rx="4" ry="5" fill="#a78bfa" />
        <circle cx="55" cy="249" r="2.5" fill="#a78bfa" />
        <path d="M 51,252 Q 45,248 42,254 M 51,255 Q 43,253 40,260" stroke="#a78bfa" strokeWidth="0.8" fill="none" />
        <path d="M 59,252 Q 65,248 68,254 M 59,255 Q 67,253 70,260" stroke="#a78bfa" strokeWidth="0.8" fill="none" />
      </g>
      <g fill="#faf5ff" opacity="0.25">
        <g style={{animation: "floatGhost 5s infinite ease-in-out"}}>
          <path d="M 32,340 C 20,340 16,350 16,365 C 16,385 24,395 32,395 C 40,395 48,385 48,365 C 48,350 44,340 32,340 Z M 26,358 A 2,2 0 1,1 26,354 A 2,2 0 1,1 26,358 Z M 38,358 A 2,2 0 1,1 38,354 A 2,2 0 1,1 38,358 Z M 32,374 Q 28,374 32,368 Q 36,374 32,374 Z" />
          <path d="M 16,385 L 12,395 L 20,390 L 28,395 L 36,390 L 44,395 L 48,385" />
        </g>
        <g style={{animation: "floatGhost 6s infinite ease-in-out 1.5s"}}>
          <path d="M 358,600 C 346,600 342,610 342,625 C 342,645 350,655 358,655 C 366,655 374,645 374,625 C 374,610 370,600 358,600 Z M 352,618 A 2,2 0 1,1 352,614 A 2,2 0 1,1 352,618 Z M 364,618 A 2,2 0 1,1 364,614 A 2,2 0 1,1 364,618 Z M 358,634 Q 354,634 358,628 Q 362,634 358,634 Z" />
          <path d="M 342,645 L 338,655 L 346,650 L 354,655 L 362,650 L 370,655 L 374,645" />
        </g>
      </g>
      <g opacity="0.6">
        <ellipse cx="30" cy="815" rx="22" ry="18" fill="url(#pumpGrad)" />
        <ellipse cx="20" cy="815" rx="14" ry="18" fill="none" stroke="#7c2d12" strokeWidth="1" />
        <ellipse cx="40" cy="815" rx="14" ry="18" fill="none" stroke="#7c2d12" strokeWidth="1" />
        <path d="M 30,798 Q 28,790 22,792" stroke="#15803d" strokeWidth="3" fill="none" />
        <polygon points="18,808 24,808 21,803" fill="#450a0a" />
        <polygon points="36,808 42,808 39,803" fill="#450a0a" />
        <path d="M 16,818 Q 30,828 44,818 Q 30,822 16,818 Z" fill="#450a0a" />
        <ellipse cx="360" cy="815" rx="22" ry="18" fill="url(#pumpGrad)" />
        <ellipse cx="350" cy="815" rx="14" ry="18" fill="none" stroke="#7c2d12" strokeWidth="1" />
        <ellipse cx="370" cy="815" rx="14" ry="18" fill="none" stroke="#7c2d12" strokeWidth="1" />
        <path d="M 360,798 Q 358,790 352,792" stroke="#15803d" strokeWidth="3" fill="none" />
        <polygon points="348,808 354,808 351,803" fill="#450a0a" />
        <polygon points="366,808 372,808 369,803" fill="#450a0a" />
        <path d="M 346,818 Q 360,828 374,818 Q 360,822 346,818 Z" fill="#450a0a" />
      </g>
    </svg>
  );
}

function CuringBorder() {
  /* Inspired by the black-and-white illustration of garlic, sausages, onions, chili peppers
     and corn all hanging from a rope. Sketchy line-art style with subtle warm colour tints. */

  // Wooden beam across the top
  const Beam = () => (
    <g>
      <rect x="0" y="80" width="390" height="10" fill="#5c3a1e" opacity="0.7" rx="2"/>
      <rect x="0" y="82" width="390" height="2" fill="rgba(255,220,150,0.25)"/>
      {/* Wood grain lines */}
      {[40,90,150,210,280,340].map((x,i)=>(
        <path key={i} d={`M${x},80 Q${x+8},85 ${x+4},90`} stroke="rgba(80,40,10,0.3)" strokeWidth="0.8" fill="none"/>
      ))}
    </g>
  );

  // Hanging rope from a nail on the beam
  const RopeNail = ({x}) => (
    <g>
      <circle cx={x} cy="83" r="3" fill="#8B6914" stroke="#5c3a1e" strokeWidth="0.8"/>
      <line x1={x} y1="86" x2={x} y2="103" stroke="#8B6914" strokeWidth="1.2"/>
    </g>
  );

  // Garlic bulb (hanging by stem)
  const Garlic = ({x, y, scale=1, tint="#ede3c8"}) => (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      {/* stem */}
      <line x1="0" y1="-2" x2="0" y2="-18" stroke="#4d7c0f" strokeWidth="1.4"/>
      {/* leaves */}
      <path d="M0,-14 Q-6,-10 -8,-4" stroke="#4d7c0f" strokeWidth="1" fill="none"/>
      <path d="M0,-14 Q6,-10 8,-4" stroke="#4d7c0f" strokeWidth="1" fill="none"/>
      {/* bulb base */}
      <ellipse cx="0" cy="8" rx="11" ry="10" fill={tint} stroke="#7a5c00" strokeWidth="1"/>
      {/* clove divisions — sketch lines */}
      <path d="M0,-2 Q0,12 0,18" stroke="#a08030" strokeWidth="0.7" fill="none"/>
      <path d="M-6,-1 Q-5,10 -3,16" stroke="#a08030" strokeWidth="0.6" fill="none"/>
      <path d="M6,-1 Q5,10 3,16" stroke="#a08030" strokeWidth="0.6" fill="none"/>
      {/* papery skin lines */}
      <path d="M-9,4 Q-7,8 -5,14" stroke="#c8a860" strokeWidth="0.5" fill="none" opacity="0.8"/>
      <path d="M9,4 Q7,8 5,14" stroke="#c8a860" strokeWidth="0.5" fill="none" opacity="0.8"/>
      {/* twine tie */}
      <ellipse cx="0" cy="-2" rx="4" ry="2" fill="none" stroke="#8B6914" strokeWidth="1"/>
    </g>
  );

  // Sausage link
  const Sausage = ({x, y, angle=0}) => (
    <g transform={`translate(${x},${y}) rotate(${angle})`}>
      <line x1="0" y1="-2" x2="0" y2="-16" stroke="#8B6914" strokeWidth="1.2"/>
      <rect x="-8" y="0" width="16" height="38" rx="8" fill="#b54a2a" stroke="#7a2a10" strokeWidth="1.2"/>
      {/* highlight */}
      <path d="M-4,4 Q-3,20 -4,32" stroke="rgba(255,200,160,0.5)" strokeWidth="1.5" fill="none"/>
      {/* tie ends */}
      <ellipse cx="0" cy="0" rx="4" ry="2.5" fill="#8B6914" stroke="#5c3a00" strokeWidth="0.8"/>
      <ellipse cx="0" cy="38" rx="4" ry="2.5" fill="#8B6914" stroke="#5c3a00" strokeWidth="0.8"/>
      {/* second link */}
      <line x1="0" y1="40" x2="0" y2="48" stroke="#8B6914" strokeWidth="1.2"/>
      <rect x="-7" y="48" width="14" height="32" rx="7" fill="#c0501e" stroke="#7a2a10" strokeWidth="1.2"/>
      <path d="M-3,51 Q-2,64 -3,76" stroke="rgba(255,200,160,0.45)" strokeWidth="1.2" fill="none"/>
      <ellipse cx="0" cy="80" rx="3.5" ry="2" fill="#8B6914" stroke="#5c3a00" strokeWidth="0.8"/>
    </g>
  );

  // Red chili pepper
  const Chili = ({x, y, flip=false}) => {
    const s = flip ? -1 : 1;
    return (
      <g transform={`translate(${x},${y}) scale(${s},1)`}>
        <line x1="0" y1="-2" x2="0" y2="-14" stroke="#8B6914" strokeWidth="1.2"/>
        <path d="M0,-2 Q-3,0 -4,8 Q-3,22 0,30 Q3,22 4,8 Q3,0 0,-2 Z" fill="#dc2626" stroke="#7a0c0c" strokeWidth="1.2"/>
        {/* vein highlight */}
        <path d="M0,2 Q1,14 0,26" stroke="rgba(255,160,160,0.5)" strokeWidth="0.8" fill="none"/>
        {/* stem curl */}
        <path d="M0,-14 Q4,-16 3,-20" stroke="#4d7c0f" strokeWidth="1.2" fill="none"/>
      </g>
    );
  };

  // Braided onion bunch
  const Onion = ({x, y, color="#d97706"}) => (
    <g transform={`translate(${x},${y})`}>
      <line x1="0" y1="-2" x2="0" y2="-18" stroke="#8B6914" strokeWidth="1.2"/>
      {/* braid / stem */}
      <path d="M-3,-18 Q0,-12 3,-6 Q0,0 -3,0 Q0,-3 3,-6 Q0,-10 -3,-14" stroke="#8B6914" strokeWidth="0.8" fill="none"/>
      {/* leaves */}
      <path d="M0,-14 Q-7,-10 -9,-2" stroke="#4d7c0f" strokeWidth="1.1" fill="none"/>
      <path d="M0,-14 Q7,-10 9,-2" stroke="#4d7c0f" strokeWidth="1.1" fill="none"/>
      {/* bulb */}
      <ellipse cx="0" cy="12" rx="12" ry="14" fill={color} stroke="#7a3c00" strokeWidth="1.2"/>
      {/* concentric skin lines */}
      <ellipse cx="0" cy="10" rx="8" ry="10" fill="none" stroke="rgba(255,200,100,0.4)" strokeWidth="0.8"/>
      <ellipse cx="0" cy="8" rx="4" ry="6" fill="none" stroke="rgba(255,200,100,0.3)" strokeWidth="0.6"/>
      {/* root tendrils */}
      <path d="M-5,25 Q-7,30 -6,34" stroke="#7a3c00" strokeWidth="0.7" fill="none"/>
      <path d="M0,26 Q0,32 0,36" stroke="#7a3c00" strokeWidth="0.7" fill="none"/>
      <path d="M5,25 Q7,30 6,34" stroke="#7a3c00" strokeWidth="0.7" fill="none"/>
    </g>
  );

  // Corn cob
  const Corn = ({x, y}) => (
    <g transform={`translate(${x},${y})`}>
      <line x1="0" y1="-2" x2="0" y2="-16" stroke="#8B6914" strokeWidth="1.2"/>
      {/* husk leaves */}
      <path d="M0,-8 Q-12,10 -6,35" stroke="#4d7c0f" strokeWidth="1.5" fill="none"/>
      <path d="M0,-8 Q12,10 6,35" stroke="#4d7c0f" strokeWidth="1.5" fill="none"/>
      {/* cob body */}
      <rect x="-8" y="0" width="16" height="38" rx="8" fill="#fbbf24" stroke="#a16207" strokeWidth="1.2"/>
      {/* kernel rows */}
      {[6,12,18,24,30].map((ky,i)=>(
        <g key={i}>
          {[-5,-1,3,7].map((kx,j)=>(
            <ellipse key={j} cx={kx} cy={ky} rx="2.5" ry="2" fill="#f59e0b" stroke="#a16207" strokeWidth="0.5"/>
          ))}
        </g>
      ))}
    </g>
  );

  // Hanging rope
  const Rope = ({x1, y1, x2, y2}) => (
    <path d={`M${x1},${y1} Q${(x1+x2)/2},${y1+4} ${x2},${y2}`} stroke="#8B6914" strokeWidth="1.2" fill="none" strokeDasharray="2,1"/>
  );

  return (
    <svg style={bs} viewBox="0 0 390 844" preserveAspectRatio="none">
      <Beam/>
      {/* Nails for left side rope */}
      <RopeNail x={12}/><RopeNail x={60}/><RopeNail x={108}/>
      {/* Nails for right side rope */}
      <RopeNail x={282}/><RopeNail x={330}/><RopeNail x={378}/>

      {/* ── LEFT SIDE hanging items ── */}
      <g opacity="0.72">
        {/* Connecting rope left */}
        <Rope x1={12} y1={90} x2={12} y2={140}/>
        <Rope x1={12} y1={90} x2={60} y2={94}/>
        <Rope x1={60} y1={90} x2={108} y2={94}/>

        {/* Column from nail at x=12 */}
        <Garlic x={12} y={160} scale={1.1}/>
        <Rope x1={12} y1={186} x2={12} y2={218}/>
        <Garlic x={12} y={236} scale={0.9} tint="#f5edcc"/>
        <Rope x1={12} y1={258} x2={12} y2={288}/>
        <Onion x={12} y={310} color="#d97706"/>
        <Rope x1={12} y1={352} x2={12} y2={382}/>
        <Chili x={12} y={400}/>
        <Rope x1={12} y1={432} x2={12} y2={462}/>
        <Garlic x={12} y={480} scale={1} tint="#ede3c8"/>
        <Rope x1={12} y1={504} x2={12} y2={534}/>
        <Onion x={12} y={555} color="#b45309"/>
        <Rope x1={12} y1={597} x2={12} y2={626}/>
        <Chili x={12} y={644} flip={true}/>
        <Rope x1={12} y1={676} x2={12} y2={706}/>
        <Garlic x={12} y={724} scale={0.95} tint="#fef3c7"/>

        {/* Column from nail at x=60 */}
        <Sausage x={60} y={106}/>
        <Rope x1={60} y1={196} x2={60} y2={226}/>
        <Corn x={60} y={242}/>
        <Rope x1={60} y1={290} x2={60} y2={326}/>
        <Garlic x={60} y={344} scale={1.05}/>
        <Rope x1={60} y1={370} x2={60} y2={405}/>
        <Chili x={60} y={422}/>
        <Rope x1={60} y1={454} x2={60} y2={490}/>
        <Sausage x={60} y={504}/>
        <Rope x1={60} y1={594} x2={60} y2={628}/>
        <Onion x={60} y={648} color="#c2410c"/>
        <Rope x1={60} y1={690} x2={60} y2={722}/>
        <Garlic x={60} y={740} scale={0.9} tint="#fde68a"/>
      </g>

      {/* ── RIGHT SIDE hanging items (mirrored x = 390-x) ── */}
      <g opacity="0.72">
        <Rope x1={378} y1={90} x2={378} y2={140}/>
        <Rope x1={378} y1={90} x2={330} y2={94}/>
        <Rope x1={330} y1={90} x2={282} y2={94}/>

        {/* Column from x=378 */}
        <Garlic x={378} y={160} scale={1.1}/>
        <Rope x1={378} y1={186} x2={378} y2={218}/>
        <Sausage x={378} y={232}/>
        <Rope x1={378} y1={322} x2={378} y2={355}/>
        <Garlic x={378} y={373} scale={0.95} tint="#fde68a"/>
        <Rope x1={378} y1={397} x2={378} y2={428}/>
        <Chili x={378} y={445} flip={true}/>
        <Rope x1={378} y1={477} x2={378} y2={508}/>
        <Onion x={378} y={528} color="#d97706"/>
        <Rope x1={378} y1={570} x2={378} y2={602}/>
        <Garlic x={378} y={620} scale={1}/>
        <Rope x1={378} y1={644} x2={378} y2={675}/>
        <Corn x={378} y={690}/>
        <Rope x1={378} y1={738} x2={378} y2={762}/>
        <Chili x={378} y={778}/>

        {/* Column from x=330 */}
        <Sausage x={330} y={106}/>
        <Rope x1={330} y1={196} x2={330} y2={232}/>
        <Garlic x={330} y={250} scale={1.05} tint="#ede3c8"/>
        <Rope x1={330} y1={276} x2={330} y2={312}/>
        <Chili x={330} y={328}/>
        <Rope x1={330} y1={360} x2={330} y2={396}/>
        <Corn x={330} y={412}/>
        <Rope x1={330} y1={460} x2={330} y2={498}/>
        <Onion x={330} y={516} color="#b45309"/>
        <Rope x1={330} y1={558} x2={330} y2={590}/>
        <Garlic x={330} y={608} scale={0.9}/>
        <Rope x1={330} y1={632} x2={330} y2={666}/>
        <Sausage x={330} y={680}/>
        <Rope x1={330} y1={770} x2={330} y2={798}/>
      </g>
    </svg>
  );
}

function ForestBorder() {
  return (
    <svg style={bs} viewBox="0 0 390 844" preserveAspectRatio="none">
      <defs>
        <linearGradient id="fireGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#facc15" />
        </linearGradient>
      </defs>
      <g fill="#065f46" opacity="0.25">
        <polygon points="0,150 25,180 12,180 30,210 5,210 0,250" />
        <polygon points="0,320 35,350 20,350 40,390 10,390 0,440" />
        <polygon points="0,550 30,580 15,580 35,620 5,620 0,670" />
        <polygon points="390,200 365,230 378,230 360,260 385,260 390,300" />
        <polygon points="390,420 355,450 370,450 350,490 380,490 390,540" />
        <polygon points="390,680 360,710 375,710 355,750 385,750 390,800" />
      </g>
      <g opacity="0.6" transform="translate(325, 785)">
        <path d="M 12,18 C 2,18 -4,10 0,2 C 4,-6 14,0 20,8 C 24,14 20,18 12,18 Z" fill="#ea580c" />
        <path d="M 20,8 C 22,11 20,15 15,17" fill="#ffffff" />
        <circle cx="0" cy="15" r="15" fill="#ea580c" />
        <ellipse cx="4" cy="12" rx="6" ry="5" fill="#ffffff" />
        <ellipse cx="-4" cy="12" rx="6" ry="5" fill="#ffffff" />
        <polygon points="-12,5 -4,2 -8,-4" fill="#ea580c" />
        <polygon points="12,5 4,2 8,-4" fill="#ea580c" />
        <path d="M -8,11 Q -5,14 -2,11" fill="none" stroke="#27272a" strokeWidth="1.2" />
        <path d="M 8,11 Q 5,14 2,11" fill="none" stroke="#27272a" strokeWidth="1.2" />
        <circle cx="0" cy="15" r="2.5" fill="#27272a" />
      </g>
      <g transform="translate(45, 805)" opacity="0.75">
        <line x1="-15" y1="12" x2="15" y2="-2" stroke="#78350f" strokeWidth="4.5" strokeLinecap="round" />
        <line x1="15" y1="12" x2="-15" y2="-2" stroke="#78350f" strokeWidth="4.5" strokeLinecap="round" />
        <g style={{animation: "fireFlicker 1.8s infinite ease-in-out"}}>
          <path d="M -10,6 C -18,-15 -2,-32 0,-42 C 2,-32 18,-15 10,6 C 6,10 -6,10 -10,6 Z" fill="url(#fireGrad)" filter="drop-shadow(0 0 4px #ea580c)" />
          <path d="M -5,6 C -9,-6 -1,-18 0,-25 C 1,-18 9,-6 5,6 Z" fill="#facc15" />
        </g>
      </g>
    </svg>
  );
}

function SectionIcon({kind,color,size=24}){
  const p={width:size,height:size,viewBox:"0 0 24 24",fill:"none",stroke:color,strokeWidth:2.2,strokeLinecap:"round",strokeLinejoin:"round"};
  if(kind==="snow")  return <svg {...p}><path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19M12 6l3 3M12 18l-3-3M6 12l3 3M18 12l-3-3"/></svg>;
  if(kind==="ghost") return <svg {...p}><path d="M9 10h.01M15 10h.01M12 2a8 8 0 0 0-8 8v11l3-2 2 2 3-2 3 2 2-2 3 2V10a8 8 0 0 0-8-8z"/></svg>;
  if(kind==="herb")  return <svg {...p}><path d="M12 22V8M12 8c0-3 2-5 5-5 0 3-2 5-5 5zM12 12c0-3-2-5-5-5 0 3 2 5 5 5z"/></svg>;
  if(kind==="forest") return (<svg {...p}><path d="M12 3L20 17H16V21H8V17H4L12 3Z" fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" /><line x1="12" y1="17" x2="12" y2="21" stroke={color} strokeWidth="2.2" /></svg>);
  return <svg {...p}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
}

function Sheet({onClose,title,accent,surf,bdr,txt2,children}){
  const bg   = surf || "#12121a";
  const brdr = bdr  || "#282836";
  const sub  = txt2 || "#a1a1b5";
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(3,3,5,0.75)",zIndex:300,display:"flex",alignItems:"flex-end",backdropFilter:"blur(12px)",animation:"fadeIn .2s ease-out"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:500,margin:"0 auto",background:bg,borderTop:`1px solid ${brdr}`,borderRadius:"28px 28px 0 0",padding:"10px 0 0",animation:"sheet .28s cubic-bezier(0.16, 1, 0.3, 1)",boxShadow:"0 -10px 30px rgba(0,0,0,0.5)"}}>
        <div style={{width:42,height:5,background:brdr,borderRadius:3,margin:"0 auto 24px"}}/>
        <div style={{padding:"0 24px 44px"}}>
          <div style={{fontSize:12,fontWeight:800,color:accent||sub,letterSpacing:".12em",textTransform:"uppercase",marginBottom:20}}>{title}</div>
          {children}
        </div>
      </div>
    </div>
  );
}
export default function App(){
  const [data,setData] = useState(null);
  const [view,setView] = useState("home");
  const [modal,setModal] = useState(null);
  const [editing,setEditing] = useState(null);
  const [isDark,setIsDark] = useState(()=>{ try{ return localStorage.getItem("inv_dark")!=="false"; }catch{ return true; } });

  const T = isDark ? DARK_THEME : LIGHT_THEME;
  const CSS = makeCSS(T);

  function toggleDark(){
    const next=!isDark;
    setIsDark(next);
    try{ localStorage.setItem("inv_dark", String(next)); }catch{}
  }
  const nameRef=useRef(),qtyRef=useRef(),unitRef=useRef(),shopRef=useRef(),newStoreRef=useRef(),storeItemRef=useRef();
  const pollRef=useRef();

  useEffect(()=>{
    (async()=>{
      let d=null;
      try{ const r = await safeStorage.get(DB_KEY, true); if(r) d=JSON.parse(r.value); }catch{}
      const valid = d && typeof d==="object" && d.sections && typeof d.sections==="object";
      if(!valid){ d=freshData(); }
      SECTIONS.forEach(s=>{ if(!Array.isArray(d.sections[s.id])) d.sections[s.id]=[]; });
      if(!Array.isArray(d.shopping)) d.shopping=[];
      if(!Array.isArray(d.specialty)) d.specialty=JSON.parse(JSON.stringify(DEFAULT_SPECIALTY));
      d.specialty.forEach(sl=>{ if(!Array.isArray(sl.items)) sl.items=[]; });
      if(!d.names || typeof d.names!=="object") d.names={};
      try{ await safeStorage.set(DB_KEY, JSON.stringify(d), true); }catch{}
      setData(d);
    })();
  },[]);

  async function persist(next){
    setData(next);
    try{ await safeStorage.set(DB_KEY, JSON.stringify(next), true); }catch{}
  }

  useEffect(()=>{
    clearInterval(pollRef.current);
    pollRef.current=setInterval(async()=>{
      if(modal) return;
      try{
        const r = await safeStorage.get(DB_KEY, true);
        if(r){ const remote=JSON.parse(r.value);
          setData(prev=> JSON.stringify(prev)===JSON.stringify(remote) ? prev : remote );
        }
      }catch{}
    },10000);
    return ()=>clearInterval(pollRef.current);
  }, [modal]);

  if(!data) return <div style={{background:T.BG,minHeight:"100dvh",display:"flex",alignItems:"center",justifyContent:"center"}}><style>{CSS}</style>
      <style>{`body,html{background:${T.BG};color:${T.TXT}}`}</style><div style={{color:T.TXT3,fontSize:14,fontWeight:600,letterSpacing:"0.05em"}}>INITIALIZING SYSTEM…</div></div>;

  function sectionName(sec){ return data.names[sec.id] || sec.name; }
  function renameSection(id,val){ if(!val.trim()) return; persist({...data, names:{...data.names,[id]:val.trim()}}); }
  function changeQty(secId,itemId,delta){
    const list=data.sections[secId].map(it=>it.id===itemId?{...it,qty:Math.round((parseFloat(it.qty)+delta)*100)/100}:it).filter(it=>parseFloat(it.qty)>0);
    persist({...data, sections:{...data.sections,[secId]:list}});
  }
  function saveItem(secId){
    const name=autocorrect((nameRef.current?.value||"").trim());
    const qty=parseFloat(qtyRef.current?.value);
    const unit=(unitRef.current?.value||"").trim();
    if(!name){ nameRef.current?.focus(); return; }
    const q=isNaN(qty)?1:qty;
    let list=data.sections[secId];
    if(editing) list=list.map(it=>it.id===editing.id?{...it,name,qty:q,unit}:it);
    else list=[...list,{id:uid(),name,qty:q,unit}];
    setModal(null); setEditing(null);
    persist({...data, sections:{...data.sections,[secId]:list}});
  }
  function deleteItem(secId,itemId){
    const list=data.sections[secId].filter(it=>it.id!==itemId);
    setModal(null); setEditing(null);
    persist({...data, sections:{...data.sections,[secId]:list}});
  }
  function addShop(){
    const text=autocorrect((shopRef.current?.value||"").trim());
    if(!text){ shopRef.current?.focus(); return; }
    setModal(null);
    persist({...data, shopping:[...data.shopping,{id:uid(),text,done:false}]});
  }
  function toggleShop(id){ persist({...data, shopping:data.shopping.map(s=>s.id===id?{...s,done:!s.done}:s)}); }
  function delShop(id){ persist({...data, shopping:data.shopping.filter(s=>s.id!==id)}); }
  function clearDone(){ persist({...data, shopping:data.shopping.filter(s=>!s.done)}); }
  // ── SPECIALTY LIST FUNCTIONS ─────────────────────────────────────────────
  function addSpecialtyStore(name){
    const trimmed=name.trim(); if(!trimmed) return;
    const updated=[...data.specialty, {id:uid(), name:trimmed, items:[]}];
    persist({...data, specialty:updated});
  }
  function deleteSpecialtyStore(storeId){
    persist({...data, specialty:data.specialty.filter(sl=>sl.id!==storeId)});
  }
  function renameSpecialtyStore(storeId, name){
    if(!name.trim()) return;
    persist({...data, specialty:data.specialty.map(sl=>sl.id===storeId?{...sl,name:name.trim()}:sl)});
  }
  function addSpecialtyItem(storeId, text){
    const trimmed=autocorrect(text.trim()); if(!trimmed) return;
    persist({...data, specialty:data.specialty.map(sl=>sl.id===storeId?{...sl,items:[...sl.items,{id:uid(),text:trimmed,done:false}]}:sl)});
  }
  function toggleSpecialtyItem(storeId, itemId){
    persist({...data, specialty:data.specialty.map(sl=>sl.id===storeId?{...sl,items:sl.items.map(it=>it.id===itemId?{...it,done:!it.done}:it)}:sl)});
  }
  function delSpecialtyItem(storeId, itemId){
    persist({...data, specialty:data.specialty.map(sl=>sl.id===storeId?{...sl,items:sl.items.filter(it=>it.id!==itemId)}:sl)});
  }
  function clearSpecialtyDone(storeId){
    persist({...data, specialty:data.specialty.map(sl=>sl.id===storeId?{...sl,items:sl.items.filter(it=>!it.done)}:sl)});
  }

  async function resetAll(){
    setModal("confirmWipe");
  }

  async function confirmWipe(){
    const blank=emptyData();
    try{ await safeStorage.set(DB_KEY, JSON.stringify(blank), true); }catch{}
    setData(blank); setModal(null); setView("home");
  }

  if(view==="home") return (
    <div style={{background:T.BG,minHeight:"100dvh",display:"flex",flexDirection:"column",userSelect:"none"}}>
      <style>{CSS}</style>
      <style>{`body,html{background:${T.BG};color:${T.TXT}}`}</style>
      <div style={{padding:"64px 24px 32px",display:"flex",alignItems:"flex-end",justifyContent:"space-between",borderBottom:`1px solid ${T.BDR}`,background:`linear-gradient(180deg, #09090e 0%, ${T.BG} 100%)`}}>
        <div>
          <div style={{fontSize:11,fontWeight:800,color:T.TXT3,letterSpacing:".2em",textTransform:"uppercase",marginBottom:6}}>HOME</div>
          <div style={{fontSize:38,fontWeight:800,letterSpacing:"-0.03em",lineHeight:1.1,color:T.TXT}}>Inventory</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,background:"#0a1811",border:`1.5px solid rgba(74,222,128,0.2)`,borderRadius:24,padding:"8px 14px 8px 10px"}}>
          <span style={{width:8,height:8,borderRadius:"50%",background:CART,boxShadow:`0 0 10px ${CART}`,animation:"pulse 2s infinite"}}/>
          <span style={{fontSize:11,fontWeight:800,color:CART,letterSpacing:".08em",textTransform:"uppercase"}}>Synced</span>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,padding:"24px 18px",flex:1,alignContent:"start"}}>
        {SECTIONS.map(sec=>{
          const t=TH[sec.theme]; const n=data.sections[sec.id].length;
          return (
            <button key={sec.id} className="press" onClick={()=>setView("sec:"+sec.id)} style={{background:T.SURF,border:`2px solid ${T.BDR}`,borderRadius:28,padding:"24px 20px",display:"flex",flexDirection:"column",alignItems:"flex-start",gap:18,cursor:"pointer",minHeight:180,position:"relative",overflow:"hidden",textAlign:"left",boxShadow:"0 8px 24px rgba(0,0,0,0.3)"}}>
              <div style={{position:"absolute",top:-32,right:-32,width:110,height:110,borderRadius:"50%",background:t.accent,filter:"blur(40px)",opacity:0.15}}/>
              <div style={{width:52,height:52,borderRadius:18,background:`${t.accent}14`,border:`1.5px solid ${t.accent}40`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"inset 0 1px 3px rgba(255,255,255,0.08)"}}>
                <SectionIcon kind={t.icon} color={t.accent} size={26}/>
              </div>
              <div style={{flex:1}}/>
              <div style={{width:"100%"}}>
                <input className="nm" defaultValue={sectionName(sec)} maxLength={18} onClick={e=>e.stopPropagation()} onBlur={e=>renameSection(sec.id,e.target.value)} onKeyDown={e=>{if(e.key==="Enter")e.target.blur();}} placeholder="Name" style={{color:t.text,fontSize:18,fontWeight:800,letterSpacing:"-0.01em"}}/>
                <div style={{fontSize:12,fontWeight:600,color:T.TXT3,marginTop:4,letterSpacing:"0.03em"}}>{n===0?"Empty":`${n} items`}</div>
              </div>
            </button>
          );
        })}
      </div>
      <div style={{padding:"16px 18px 28px",display:"flex",flexDirection:"column",gap:10}}>
        <button className="press" onClick={()=>setView("shop")} style={{width:"100%",background:T.SURF,border:`2px solid ${T.BDR}`,borderRadius:22,padding:"18px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",position:"relative",overflow:"hidden",boxShadow:"0 6px 20px rgba(0,0,0,0.25)"}}>
          <div style={{position:"absolute",inset:0,background:`linear-gradient(90deg, ${CART}00, ${CART}08)`}}/>
          <div style={{width:44,height:44,borderRadius:14,background:`${CART}12`,border:`1.5px solid ${CART}33`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <SectionIcon kind="cart" color={CART} size={20}/>
          </div>
          <div style={{flex:1,textAlign:"left"}}>
            <div style={{fontSize:16,fontWeight:800,color:CART,letterSpacing:"-0.01em"}}>Shopping List</div>
            <div style={{fontSize:12,color:T.TXT3,fontWeight:600,marginTop:1}}>{data.shopping.filter(s=>!s.done).length} items to buy</div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.TXT3} strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <button className="press" onClick={()=>setView("specialty")} style={{width:"100%",background:T.SURF,border:`2px solid ${T.BDR}`,borderRadius:22,padding:"18px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",position:"relative",overflow:"hidden",boxShadow:"0 6px 20px rgba(0,0,0,0.25)"}}>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg, rgba(168,85,247,0),rgba(168,85,247,0.06))"}}/>
          <div style={{width:44,height:44,borderRadius:14,background:"rgba(168,85,247,0.1)",border:"1.5px solid rgba(168,85,247,0.25)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          </div>
          <div style={{flex:1,textAlign:"left"}}>
            <div style={{fontSize:16,fontWeight:800,color:"#a855f7",letterSpacing:"-0.01em"}}>Specialty Shopping</div>
            <div style={{fontSize:12,color:T.TXT3,fontWeight:600,marginTop:1}}>{data.specialty.length} store{data.specialty.length!==1?"s":""}</div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.TXT3} strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:10,padding:"4px 2px"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.TXT3} strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>
            <button onClick={toggleDark} style={{width:44,height:24,borderRadius:12,border:`1.5px solid ${T.BDR}`,background:isDark?"#1b1b26":"#d4d4cc",cursor:"pointer",position:"relative",transition:"background .25s",padding:0,flexShrink:0}}>
              <div style={{width:18,height:18,borderRadius:"50%",background:isDark?"#a1a1b5":"#555566",position:"absolute",top:2,left:isDark?22:2,transition:"left .22s cubic-bezier(.4,0,.2,1)"}}/>
            </button>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.TXT3} strokeWidth="2.2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/></svg>
          </div>
          <button onClick={resetAll} style={{background:"transparent",border:"none",color:T.TXT3,fontSize:11,fontWeight:600,letterSpacing:".05em",cursor:"pointer",padding:"6px 4px",display:"flex",alignItems:"center",gap:4,opacity:0.6}}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Wipe all data
          </button>
        </div>

      {modal==="confirmWipe" && (
        <div onClick={()=>setModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)",animation:"fadeIn .18s ease"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:T.SURF,border:`1px solid #7f1d1d`,borderRadius:24,padding:"32px 28px",width:"85%",maxWidth:340,textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,0.6)"}}>
            <div style={{fontSize:28,marginBottom:12}}>🗑️</div>
            <div style={{fontSize:17,fontWeight:800,color:T.TXT,marginBottom:8,letterSpacing:"-0.01em"}}>Wipe all data?</div>
            <div style={{fontSize:13,fontWeight:500,color:T.TXT2,marginBottom:28,lineHeight:1.6}}>This clears every list and cannot be undone. The original inventory will not be restored.</div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setModal(null)} style={{flex:1,padding:"13px",borderRadius:14,border:`1px solid ${T.BDR}`,background:"transparent",color:T.TXT2,fontSize:14,fontWeight:700,cursor:"pointer"}}>Cancel</button>
              <button onClick={confirmWipe} style={{flex:1,padding:"13px",borderRadius:14,border:"none",background:"#991b1b",color:"#fee2e2",fontSize:14,fontWeight:800,cursor:"pointer"}}>Wipe</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );

  if(view==="shop") return (
    <div style={{background:"linear-gradient(180deg, #020b05 0%, #051409 100%)",minHeight:"100dvh",display:"flex",flexDirection:"column",userSelect:"none",position:"relative"}}>
      <style>{CSS}</style>
      <style>{`body,html{background:${T.BG};color:${T.TXT}}`}</style>
      <div style={{display:"flex",alignItems:"center",padding:"58px 20px 22px",gap:14,position:"sticky",top:0,background:"rgba(2,11,5,0.88)",borderBottom:`1px solid rgba(74,222,128,0.2)`,zIndex:10,backdropFilter:"blur(20px)"}}>
        <button className="press" onClick={()=>setView("home")} style={{width:44,height:44,borderRadius:14,border:`1.5px solid ${T.BDR}`,background:T.SURF2,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.TXT2} strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div style={{flex:1}}>
          <div style={{fontSize:11,fontWeight:800,color:T.TXT3,letterSpacing:".15em",textTransform:"uppercase"}}>SHOPPING</div>
          <div style={{fontSize:24,fontWeight:800,color:CART,letterSpacing:"-0.02em"}}>Shopping List</div>
        </div>
        <button className="press" onClick={()=>setModal("shop")} style={{width:44,height:44,borderRadius:14,border:`1.5px solid ${CART}44`,background:`${CART}12`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={CART} strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"18px",display:"flex",flexDirection:"column",gap:12,zIndex:1}}>
        {data.shopping.length===0 && <div style={{textAlign:"center",color:T.TXT3,fontSize:15,padding:"90px 32px",lineHeight:1.6,fontWeight:500}}>Nothing on the list.<br/>Tap + to add items.</div>}
        {data.shopping.map(s=>(
          <div key={s.id} style={{background:s.done?"rgba(17,24,19,0.3)":T.SURF,border:`2px solid ${s.done?"rgba(74,222,128,0.1)":T.BDR}`,borderRadius:20,display:"flex",alignItems:"center",padding:"16px 18px",gap:14,opacity:s.done?0.55:1,boxShadow:"0 4px 12px rgba(0,0,0,0.2)"}}>
            <button onClick={()=>toggleShop(s.id)} style={{width:28,height:28,borderRadius:10,border:`2.5px solid ${s.done?CART:T.BDR}`,background:s.done?CART:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {s.done && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#020b05" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
            </button>
            <div style={{flex:1,fontSize:18,fontWeight:700,color:s.done?T.TXT3:T.TXT,textDecoration:s.done?"line-through":"none",letterSpacing:"-0.01em"}}>{s.text}</div>
            <button onClick={()=>delShop(s.id)} style={{width:34,height:34,borderRadius:10,border:"none",background:"transparent",color:T.TXT3,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        ))}
      </div>
      {data.shopping.some(s=>s.done) && (
        <div style={{padding:"14px 18px 28px",zIndex:1}}>
          <button className="press" onClick={clearDone} style={{width:"100%",padding:16,borderRadius:16,border:`2px solid ${T.BDR}`,background:T.SURF2,color:T.TXT,fontSize:14,fontWeight:800,letterSpacing:"0.05em",textTransform:"uppercase",cursor:"pointer"}}>Clear Checked</button>
        </div>
      )}
      {modal==="shop" && (
        <Sheet surf={T.SURF} bdr={T.BDR} txt2={T.TXT2} onClose={()=>setModal(null)} title="Add to List" accent={CART}>
          <input ref={shopRef} className="field" placeholder="Item name..." maxLength={60} style={{marginBottom:16}} onBlur={e=>{e.target.value=autocorrect(e.target.value);}} onKeyDown={e=>{if(e.key==="Enter")addShop();}} autoFocus/>
          <div style={{display:"flex",gap:12}}>
            <button onClick={()=>setModal(null)} style={{flex:1,padding:16,borderRadius:14,border:`2px solid ${T.BDR}`,background:"transparent",color:T.TXT2,fontSize:14,fontWeight:600,cursor:"pointer"}}>Cancel</button>
            <button onClick={addShop} style={{flex:2,padding:16,borderRadius:14,border:"none",background:CART,color:"#020b05",fontSize:14,fontWeight:800,cursor:"pointer"}}>Add Item</button>
          </div>
        </Sheet>
      )}
    </div>
  );


  /* ════════ SPECIALTY HUB ════════ */
  const SPEC_ACCENT = "#a855f7";
  if(view==="specialty") return (
    <div style={{background:"linear-gradient(180deg,#0d0414 0%,#160820 100%)",minHeight:"100dvh",display:"flex",flexDirection:"column",userSelect:"none"}}>
      <style>{CSS}</style>
      <style>{`body,html{background:${T.BG};color:${T.TXT}}`}</style>
      <div style={{display:"flex",alignItems:"center",padding:"58px 20px 22px",gap:14,position:"sticky",top:0,background:"rgba(13,4,20,0.9)",borderBottom:`1px solid rgba(168,85,247,0.2)`,zIndex:10,backdropFilter:"blur(20px)"}}>
        <button className="press" onClick={()=>setView("home")} style={{width:44,height:44,borderRadius:14,border:`1.5px solid ${T.BDR}`,background:T.SURF2,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.TXT2} strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div style={{flex:1}}>
          <div style={{fontSize:11,fontWeight:800,color:T.TXT3,letterSpacing:".15em",textTransform:"uppercase"}}>SHOPPING</div>
          <div style={{fontSize:24,fontWeight:800,color:SPEC_ACCENT,letterSpacing:"-0.02em"}}>Specialty Shopping</div>
        </div>
        <button className="press" onClick={()=>setModal("addStore")} style={{width:44,height:44,borderRadius:14,border:"1.5px solid rgba(168,85,247,0.35)",background:"rgba(168,85,247,0.1)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={SPEC_ACCENT} strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 18px 32px",display:"flex",flexDirection:"column",gap:12}}>
        {data.specialty.length===0 && <div style={{textAlign:"center",color:T.TXT3,fontSize:15,padding:"80px 32px",lineHeight:1.7}}>No stores yet.<br/>Tap + to add one.</div>}
        {data.specialty.map(sl=>{
          const pending=sl.items.filter(it=>!it.done).length;
          return(
            <button key={sl.id} className="press" onClick={()=>setView("specialty:"+sl.id)} style={{background:T.SURF,border:`2px solid ${T.BDR}`,borderRadius:20,padding:"18px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",boxShadow:"0 4px 14px rgba(0,0,0,0.2)",textAlign:"left"}}>
              <div style={{width:44,height:44,borderRadius:13,background:"rgba(168,85,247,0.1)",border:"1.5px solid rgba(168,85,247,0.25)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={SPEC_ACCENT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:17,fontWeight:800,color:T.TXT,letterSpacing:"-0.01em"}}>{sl.name}</div>
                <div style={{fontSize:12,color:T.TXT3,fontWeight:600,marginTop:2}}>{pending===0?"Nothing listed":`${pending} item${pending!==1?"s":""} to get`}</div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.TXT3} strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          );
        })}
      </div>
      {modal==="addStore" && (
        <Sheet surf={T.SURF} bdr={T.BDR} txt2={T.TXT2} onClose={()=>setModal(null)} title="Add Store" accent={SPEC_ACCENT}>
          <input ref={newStoreRef} className="field" placeholder="Store name..." maxLength={40} style={{marginBottom:16}} onKeyDown={e=>{if(e.key==="Enter"){addSpecialtyStore(newStoreRef.current?.value||"");newStoreRef.current.value="";setModal(null);}}} autoFocus/>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setModal(null)} style={{flex:1,padding:14,borderRadius:14,border:`1px solid ${T.BDR}`,background:"transparent",color:T.TXT2,fontSize:14,fontWeight:600,cursor:"pointer"}}>Cancel</button>
            <button onClick={()=>{addSpecialtyStore(newStoreRef.current?.value||"");if(newStoreRef.current)newStoreRef.current.value="";setModal(null);}} style={{flex:2,padding:14,borderRadius:14,border:"none",background:SPEC_ACCENT,color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer"}}>Add Store</button>
          </div>
        </Sheet>
      )}
    </div>
  );

  /* ════════ SPECIALTY STORE LIST ════════ */
  if(view.startsWith("specialty:")){
    const storeId=view.slice(10);
    const store=data.specialty.find(sl=>sl.id===storeId);
    if(!store){setView("specialty");return null;}
    return(
      <div style={{background:"linear-gradient(180deg,#0d0414 0%,#160820 100%)",minHeight:"100dvh",display:"flex",flexDirection:"column",userSelect:"none"}}>
        <style>{CSS}</style>
        <div style={{display:"flex",alignItems:"center",padding:"58px 20px 22px",gap:14,position:"sticky",top:0,background:"rgba(13,4,20,0.9)",borderBottom:"1px solid rgba(168,85,247,0.2)",zIndex:10,backdropFilter:"blur(20px)"}}>
          <button className="press" onClick={()=>setView("specialty")} style={{width:44,height:44,borderRadius:14,border:"1.5px solid "+T.BDR,background:T.SURF2,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.TXT2} strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <div style={{flex:1}}>
            <div style={{fontSize:11,fontWeight:800,color:T.TXT3,letterSpacing:".15em",textTransform:"uppercase"}}>SPECIALTY SHOPPING</div>
            <input className="nm" defaultValue={store.name} maxLength={40} style={{fontSize:22,fontWeight:800,color:SPEC_ACCENT,letterSpacing:"-0.02em",marginTop:2}} onBlur={e=>renameSpecialtyStore(storeId,e.target.value)} onKeyDown={e=>{if(e.key==="Enter")e.target.blur();}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="press" onClick={()=>{if(window.confirm("Delete "+store.name+"?")){deleteSpecialtyStore(storeId);setView("specialty");}}} style={{width:44,height:44,borderRadius:14,border:"1.5px solid #7f1d1d",background:"rgba(127,29,29,0.15)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round"><path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
            <button className="press" onClick={()=>setModal("addSpecItem")} style={{width:44,height:44,borderRadius:14,border:"1.5px solid rgba(168,85,247,0.35)",background:"rgba(168,85,247,0.1)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={SPEC_ACCENT} strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"16px 18px",display:"flex",flexDirection:"column",gap:10}}>
          {store.items.length===0&&<div style={{textAlign:"center",color:T.TXT3,fontSize:15,padding:"80px 32px",lineHeight:1.7}}>Nothing on this list.<br/>Tap + to add items.</div>}
          {store.items.map(it=>(
            <div key={it.id} style={{background:it.done?"rgba(17,10,26,0.4)":T.SURF,border:"2px solid "+(it.done?"rgba(168,85,247,0.1)":T.BDR),borderRadius:18,display:"flex",alignItems:"center",padding:"14px 16px",gap:12,opacity:it.done?0.5:1,transition:"opacity .2s"}}>
              <button onClick={()=>toggleSpecialtyItem(storeId,it.id)} style={{width:26,height:26,borderRadius:8,border:"2.5px solid "+(it.done?SPEC_ACCENT:T.BDR),background:it.done?SPEC_ACCENT:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
                {it.done&&<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
              </button>
              <div style={{flex:1,fontSize:17,fontWeight:700,color:it.done?T.TXT3:T.TXT,textDecoration:it.done?"line-through":"none"}}>{it.text}</div>
              <button onClick={()=>delSpecialtyItem(storeId,it.id)} style={{width:32,height:32,borderRadius:8,border:"none",background:"transparent",color:T.TXT3,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          ))}
        </div>
        {store.items.some(it=>it.done)&&(
          <div style={{padding:"8px 18px 28px"}}>
            <button className="press" onClick={()=>clearSpecialtyDone(storeId)} style={{width:"100%",padding:14,borderRadius:14,border:"1px solid "+T.BDR,background:T.SURF2,color:T.TXT2,fontSize:13,fontWeight:700,cursor:"pointer",letterSpacing:".04em"}}>Clear Checked</button>
          </div>
        )}
        {modal==="addSpecItem"&&(
          <Sheet surf={T.SURF} bdr={T.BDR} txt2={T.TXT2} onClose={()=>setModal(null)} title={"Add to "+store.name} accent={SPEC_ACCENT}>
            <input ref={storeItemRef} className="field" placeholder="Item name..." maxLength={60} style={{marginBottom:16}} onBlur={e=>{e.target.value=autocorrect(e.target.value);}} onKeyDown={e=>{if(e.key==="Enter"){addSpecialtyItem(storeId,storeItemRef.current?.value||"");if(storeItemRef.current)storeItemRef.current.value="";setModal(null);}}} autoFocus/>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setModal(null)} style={{flex:1,padding:14,borderRadius:14,border:"1px solid "+T.BDR,background:"transparent",color:T.TXT2,fontSize:14,fontWeight:600,cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>{addSpecialtyItem(storeId,storeItemRef.current?.value||"");if(storeItemRef.current)storeItemRef.current.value="";setModal(null);}} style={{flex:2,padding:14,borderRadius:14,border:"none",background:SPEC_ACCENT,color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer"}}>Add Item</button>
            </div>
          </Sheet>
        )}
      </div>
    );
  }

  var secId=view.slice(4);
  var sec=SECTIONS.filter(function(s){return s.id===secId;})[0];
  var t=TH[sec.theme];
  var list=data.sections[secId];
  return(
    <div style={{background:t.bg,minHeight:"100dvh",display:"flex",flexDirection:"column",userSelect:"none",position:"relative",overflow:"hidden"}}>
      <style>{CSS}</style>
      <style>{`body,html{background:${T.BG};color:${T.TXT}}`}</style>
      {sec.theme==="ice" && <IceBorder/>}
      {sec.theme==="spooky" && <SpookyBorder/>}
      {sec.theme==="pantry" && <CuringBorder/>}
      {sec.theme==="nursery" && <ForestBorder/>}
      <div style={{position:"fixed",top:-60,left:"50%",transform:"translateX(-50%)",width:320,height:180,borderRadius:"50%",background:t.accent,filter:"blur(100px)",opacity:0.08,zIndex:1}}/>
      <div style={{display:"flex",alignItems:"center",padding:"58px 20px 22px",gap:14,position:"sticky",top:0,background:t.hdr,borderBottom:`1px solid ${t.surfBdr}`,zIndex:10,backdropFilter:"blur(24px)"}}>
        <button className="press" onClick={()=>setView("home")} style={{width:44,height:44,borderRadius:14,border:`1.5px solid ${T.BDR}`,background:T.SURF2,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.TXT2} strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div style={{flex:1}}>
          <div style={{fontSize:11,fontWeight:800,color:T.TXT3,letterSpacing:".15em",textTransform:"uppercase"}}>INVENTORY</div>
          <div style={{fontSize:24,fontWeight:800,color:t.accent,letterSpacing:"-0.02em"}}>{sectionName(sec)}</div>
        </div>
        <button className="press" onClick={()=>{setEditing(null);setModal("item");}} style={{width:44,height:44,borderRadius:14,border:`1.5px solid ${t.accent}44`,background:`${t.accent}12`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 16px 44px",display:"flex",flexDirection:"column",gap:12,zIndex:1}}>
        {list.length===0 && <div style={{textAlign:"center",color:T.TXT3,fontSize:15,padding:"90px 32px",lineHeight:1.6,fontWeight:500}}>Nothing here yet.<br/>Tap + to add items.</div>}
        {list.map((it,i)=>(
          <div key={it.id} style={{background:t.surf,border:`2px solid ${t.surfBdr}`,borderRadius:22,display:"flex",alignItems:"center",padding:"16px 16px 16px 20px",gap:14,animation:`fadeUp .22s ease ${Math.min(i,15)*.022}s both`,backdropFilter:"blur(16px)",boxShadow:"0 6px 18px rgba(0,0,0,0.2)"}}>
            <button onClick={()=>{setEditing(it);setModal("item");}} style={{flex:1,minWidth:0,background:"transparent",border:"none",textAlign:"left",cursor:"pointer",padding:0}}>
              <div style={{fontSize:18,fontWeight:800,color:t.text,lineHeight:1.3,wordBreak:"break-word",letterSpacing:"-0.01em"}}>{it.name}</div>
              {it.unit && <div style={{fontSize:11,fontWeight:800,color:T.TXT3,letterSpacing:".1em",textTransform:"uppercase",marginTop:6}}>{it.unit}</div>}
            </button>
            <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
              <button className="press" onClick={()=>changeQty(secId,it.id,-1)} style={{width:42,height:42,borderRadius:12,border:`1.5px solid ${T.BDR}`,background:T.SURF2,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T.TXT2}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><path d="M5 12h14"/></svg>
              </button>
              <div style={{fontSize:20,fontWeight:800,minWidth:44,textAlign:"center",color:t.accent,fontVariantNumeric:"tabular-nums"}}>{fmtQ(it.qty)}</div>
              <button className="press" onClick={()=>changeQty(secId,it.id,+1)} style={{width:42,height:42,borderRadius:12,border:`1.5px solid ${t.accent}44`,background:`${t.accent}18`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:t.accent}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
      {modal==="item" && (
        <Sheet surf={T.SURF} bdr={T.BDR} txt2={T.TXT2} onClose={()=>{setModal(null);setEditing(null);}} title={editing?"Edit Item":"Add Item"} accent={t.accent}>
          <input ref={nameRef} className="field" placeholder="Item name..." maxLength={50} defaultValue={editing?.name||""} style={{marginBottom:16}} onBlur={e=>{e.target.value=autocorrect(e.target.value);}} onKeyDown={e=>{if(e.key==="Enter")qtyRef.current?.focus();}} autoFocus/>
          <div style={{display:"flex",gap:12,marginBottom:20}}>
            <input ref={qtyRef} type="number" className="field" placeholder="Qty" min="0" step="0.5" defaultValue={editing?.qty??""} style={{flex:"0 0 100px"}} onKeyDown={e=>{if(e.key==="Enter")unitRef.current?.focus();}}/>
            <input ref={unitRef} className="field" placeholder="Unit (lbs, bags…)" maxLength={24} defaultValue={editing?.unit||""} style={{flex:1}} onKeyDown={e=>{if(e.key==="Enter")saveItem(secId);}}/>
          </div>
          <div style={{display:"flex",gap:12}}>
            {editing
              ? <button onClick={()=>deleteItem(secId,editing.id)} style={{flex:1,padding:16,borderRadius:14,border:`2px solid #b91c1c`,background:"rgba(185,28,28,0.12)",color:"#ef4444",fontSize:14,fontWeight:800,letterSpacing:"0.03em",textTransform:"uppercase",cursor:"pointer"}}>Delete</button>
              : <button onClick={()=>{setModal(null);setEditing(null);}} style={{flex:1,padding:16,borderRadius:14,border:`2px solid ${T.BDR}`,background:"transparent",color:T.TXT2,fontSize:14,fontWeight:600,cursor:"pointer"}}>Cancel</button>}
            <button onClick={()=>saveItem(secId)} style={{flex:2,padding:16,borderRadius:14,border:"none",background:t.accent,color:"#050508",fontSize:14,fontWeight:800,letterSpacing:"0.03em",textTransform:"uppercase",cursor:"pointer"}}>{editing?"Save":"Add Item"}</button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
