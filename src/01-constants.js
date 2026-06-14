const {useState,useEffect,useRef} = React;

// small cricket-cap badge (like the real Orange/Purple cap)
function CapIcon({c}){
  return (
    <svg className="capico" viewBox="0 0 64 40" width="30" height="20" aria-hidden="true">
      <path d="M6 31 C4 24 11 9 32 9 C49 9 58 18 60 27 L60 30 C60 31 59 32 58 32 L32 32 Z" fill={c}/>
      <path d="M30 32 C30 33 33 35 44 35 C56 35 61 31 61 29 C61 31 60 32 58 32 Z" fill={c} opacity="0.78"/>
      <path d="M6 31 C4 24 11 9 32 9 C32 9 20 14 18 31 Z" fill="#fff" opacity="0.16"/>
      <circle cx="32" cy="9.5" r="2.4" fill={c}/>
      <path d="M31 18 C31 13 33 11 33 11" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.4" fill="none"/>
      <path d="M40 19 C40 14 43 12 43 12" stroke="#fff" strokeOpacity="0.25" strokeWidth="1.2" fill="none"/>
    </svg>
  );
}

// Slot types & eligibility (role + batting position aware)
const bpOf=p=>p?(p.bp||6):6;   // highest batting position a player has historically batted (1-based)
const ROLE_NAME={BAT:"Batter",WK:"Keeper",AR:"All-rounder",PACE:"Pacer",SPIN:"Spinner",TOP:"Top order",FINISH:"Finisher",FLEX:"Middle"};
const SLOTDEF={
  TOP:  {label:"Top order", ok:p=>p.role==="BAT" && (p.pos==="TOP"||p.pos==="FLEX")},
  FIN:  {label:"Finisher",  ok:p=>p.role==="BAT" && (p.pos==="FINISH"||p.pos==="FLEX")},
  WK:   {label:"Wicketkeeper", ok:p=>p.role==="WK"},
  AR:   {label:"All-rounder",  ok:p=>p.role==="AR"},
  PACE: {label:"Pacer",   ok:p=>p.role==="PACE"},
  SPIN: {label:"Spinner", ok:p=>p.role==="SPIN"},
};
// Formations (each totals 11, keeper compulsory)
const FORMATIONS=[
  {name:"Balanced", desc:"The classic IPL XI — a bit of everything.",
   slots:["TOP","TOP","TOP","FIN","FIN","WK","AR","AR","PACE","PACE","SPIN"]},
  {name:"Batting heavy", desc:"Stack the line-up, bat deep, outscore everyone.",
   slots:["TOP","TOP","TOP","FIN","FIN","FIN","WK","AR","PACE","PACE","SPIN"]},
  {name:"Bowling heavy", desc:"Pace battery + extra spin to defend any total.",
   slots:["TOP","TOP","FIN","FIN","WK","AR","PACE","PACE","PACE","SPIN","SPIN"]},
  {name:"Spin heavy", desc:"Twin spinners to choke the middle overs.",
   slots:["TOP","TOP","TOP","FIN","FIN","WK","AR","PACE","PACE","SPIN","SPIN"]},
  {name:"All-rounder", desc:"Three all-rounders for maximum flexibility.",
   slots:["TOP","TOP","FIN","FIN","WK","AR","AR","AR","PACE","PACE","SPIN"]},
];
const MAX_OVERSEAS=4;
const sqKey=p=>p.team+"||"+p.season;
const allSquads=[...new Set(PLAYERS.map(sqKey))];
const rnd=a=>a[Math.floor(Math.random()*a.length)];
function gauss(m,s){let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();
  return m+s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
