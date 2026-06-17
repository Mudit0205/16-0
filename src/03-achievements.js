// ---- achievements (saved per-profile in the browser) ----
const ACHIEVEMENTS=[
  {id:"draft",   icon:"📋", name:"Team Sheet",  desc:"Complete your first XI",                         chk:s=>s.drafts>=1},
  {id:"title",   icon:"🏆", name:"Champions",   desc:"Win your first IPL title",                       chk:s=>s.titles>=1},
  {id:"perfect", icon:"🔥", name:"Sixteen-Zero",desc:"Go a flawless 16-0",                             chk:s=>s.perfects>=1},
  {id:"dynasty", icon:"👑", name:"Dynasty",     desc:"Win 5 IPL titles",                               chk:s=>s.titles>=5},
  {id:"erahop",  icon:"🌍", name:"Era Hopper",  desc:"Win titles in 5 different seasons",              chk:s=>s.seasonsWon.length>=5},
  {id:"timelord",icon:"⏳", name:"Time Lord",   desc:"Win a title in the 2000s, 2010s and 2020s",      chk:s=>{const d=new Set(s.seasonsWon.map(y=>Math.floor(y/10)*10));return d.has(2000)&&d.has(2010)&&d.has(2020);}},
  {id:"hard",    icon:"🧠", name:"No Numbers",  desc:"Win a title with Hard mode on",                  chk:s=>s.hardTitles>=1},
  {id:"galactico",icon:"💎",name:"Galácticos",  desc:"Build an XI rated 90 or higher",                 chk:s=>s.bestRating>=90},
  {id:"cap",     icon:"🧢", name:"Cap Collector",desc:"One of your players wins the Orange or Purple Cap",chk:s=>s.capWins>=1},
  {id:"mvp",     icon:"⭐", name:"MVP Machine", desc:"One of your players is named season MVP",         chk:s=>s.mvpWins>=1},
  {id:"underdog",icon:"🐐", name:"Giant Killer",desc:"Win the title projected outside the top 4",       chk:s=>s.underdogTitles>=1},
  {id:"veteran", icon:"🏟️",name:"Veteran",     desc:"Simulate 25 seasons",                            chk:s=>s.sims>=25},
  {id:"quota",   icon:"✈️", name:"Full Quota",  desc:"Draft the maximum 4 overseas players",           chk:s=>s.overseasMax>=4},
  // ---- meme achievements ----
  {id:"blindfold",icon:"🥷",name:"Blindfold Perfect",desc:"Go a flawless 16-0 with Hard mode on",      chk:s=>s.perfectHard>=1},
  {id:"finally", icon:"🤡", name:"Finally!",    desc:"Watch Punjab or Delhi actually win the IPL",     chk:s=>s.punjabDc>=1},
  {id:"comeback",icon:"🌊", name:"Mumbai Special",desc:"Lose 2 of your first 5 games, then win the title",   chk:s=>s.comeback>=1},
  {id:"spoon",   icon:"🥄", name:"Wooden Spoon",desc:"Finish stone last on the table",                 chk:s=>s.woodenSpoon>=1},
  {id:"choke",   icon:"😬", name:"Minor Premiers",desc:"Top the league table but win no trophy",        chk:s=>s.choke>=1},
  {id:"whitewash",icon:"🫠",name:"Whitewashed", desc:"Lose all 14 league games",                       chk:s=>s.whitewash>=1},
  {id:"thala",   icon:"7️⃣", name:"Thala for a Reason",desc:"Finish a league season 7 wins, 7 losses",  chk:s=>s.place7>=1},
];
const BLANK_STATS={drafts:0,sims:0,titles:0,perfects:0,hardTitles:0,seasonsWon:[],capWins:0,mvpWins:0,bestRating:0,underdogTitles:0,overseasMax:0,
  perfectHard:0,punjabDc:0,comeback:0,woodenSpoon:0,choke:0,whitewash:0,place7:0};
const loadProfile=()=>{try{const j=JSON.parse(localStorage.getItem("ipl160_profile"));if(j&&j.stats)return {name:j.name||"",unlocked:j.unlocked||[],stats:{...BLANK_STATS,...j.stats}};}catch(e){}return {name:"",unlocked:[],stats:{...BLANK_STATS,seasonsWon:[]}};};
