<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Birdie Blitz — 9-Hole Gauntlet</title>
<style>
  :root{ --cream:#fff7e0; --ink:#1d3a22; --sun:#ffd84d; --chip:#ffffff; }
  *{box-sizing:border-box; margin:0; padding:0;}
  body{
    font-family:'Trebuchet MS','Comic Sans MS',ui-rounded,system-ui,sans-serif;
    background:radial-gradient(1200px 600px at 50% -10%, #d8f3ff 0%, #bfe8ff 45%, #9fd9f2 100%);
    display:flex; align-items:center; justify-content:center;
    min-height:100vh; min-height:100dvh; padding:12px; color:var(--ink);
    -webkit-user-select:none; user-select:none;
  }
  #stage{position:relative; width:960px; max-width:100%;
    /* never let the game box exceed the visible viewport height, so the bottom controls
       (power meter, club chip, readout) always stay on screen in a browser window */
    max-height:calc(100dvh - 24px); }
  canvas#game{display:block; width:100%; height:auto; max-height:calc(100dvh - 24px); background:#9fd9f2; object-fit:contain;}
  #gameWrap{
    position:relative; border-radius:22px; overflow:hidden;
    box-shadow:0 18px 40px rgba(20,60,30,.35), 0 0 0 8px rgba(255,255,255,.55);
  }
  /* fullscreen: fill the screen. Size the wrapper to the largest 960:600 box that fits the
     viewport, so it genuinely fills. Backing-store resolution follows in JS via sizeCanvas(). */
  #stage:fullscreen, #stage:-webkit-full-screen{ width:100vw; height:100vh; max-width:none; display:flex;
    align-items:center; justify-content:center; background:#0c1410; padding:0; }
  #stage:fullscreen #gameWrap, #stage:-webkit-full-screen #gameWrap{
    width:min(100vw, 160vh); height:min(62.5vw, 100vh); max-width:none; border-radius:0; box-shadow:none; }
  #stage:fullscreen canvas#game, #stage:-webkit-full-screen canvas#game{ width:100%; height:100%; display:block; }
  #hud{
    position:absolute; top:10px; left:10px; right:10px;
    display:flex; gap:8px; flex-wrap:wrap; justify-content:space-between;
    pointer-events:none; z-index:5;
  }
  .hudGroup{display:flex; gap:8px; flex-wrap:wrap;}
  :root{
    --ink:rgba(16,24,19,.58);            /* unified panel glass   */
    --hair:rgba(255,255,255,.16);        /* hairline borders      */
    --ivory:#f3f1e8;                     /* primary text          */
    --mute:rgba(243,241,232,.5);         /* secondary text        */
    --gold:#e3c878;                      /* calm accent           */
    --rad:13px;
    --pshadow:0 6px 18px rgba(8,18,12,.28);
  }
  .chip{
    background:var(--ink);
    -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px);
    border:1px solid var(--hair);
    border-radius:var(--rad); padding:7px 15px;
    font-weight:700; font-size:14px; letter-spacing:.4px;
    box-shadow:var(--pshadow);
    display:flex; align-items:center; gap:7px; white-space:nowrap;
    color:var(--ivory);
  }
  .chip small{font-weight:800; font-size:8.5px; color:var(--mute); text-transform:uppercase; letter-spacing:2.2px;}
  .chip b{font-size:15px; font-weight:800; letter-spacing:.5px;}
  #scoreChip b.under{color:#e8b4a8;}
  #scoreChip b.over{color:#a8c4e8;}
  #windArrow{display:inline-block; transition:transform .45s cubic-bezier(.3,1.2,.4,1);}
  #streakChip{display:none; border-color:rgba(227,200,120,.5);}
  #streakChip b{color:var(--gold);}
  #elevChip{display:none;}
  #minimap{
    position:absolute; right:10px; top:52px; z-index:5;
    border-radius:12px; box-shadow:0 4px 0 rgba(20,60,30,.3), 0 0 0 3px rgba(255,255,255,.85);
    opacity:.95;
  }
  /* bottom-right wind / distance / elevation readout — unobtrusive, bright yellow on smoked glass */
  #readout{
    position:absolute; right:10px; bottom:calc(10px + env(safe-area-inset-bottom, 0px)); z-index:5;
    display:flex; gap:7px; align-items:stretch;
  }
  .ro{
    display:flex; align-items:center; gap:7px;
    background:var(--ink);
    -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px);
    border:1px solid var(--hair);
    border-radius:var(--rad); padding:7px 12px 7px 10px;
    color:var(--sun);
    box-shadow:var(--pshadow);
  }
  .ro .roIcon{
    width:17px; height:17px; flex:none; color:var(--sun);
    display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:900;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.4));
  }
  #elevReadout .roIcon{transition:transform .3s ease;}
  .ro .roText{display:flex; flex-direction:column; line-height:1; align-items:flex-start;}
  .ro .roText b{
    font-size:16px; font-weight:900; letter-spacing:.3px;
    color:#ffe24d; text-shadow:0 1px 2px rgba(0,0,0,.45);
  }
  .ro .roText small{
    font-size:8px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase;
    color:rgba(255,255,255,.55); margin-top:1px;
  }
  @media (max-width:700px){ #readout{gap:5px;} .ro{padding:5px 8px;} .ro .roText b{font-size:13px;} }
  #bottomLeft{position:absolute; left:10px; bottom:calc(10px + env(safe-area-inset-bottom, 0px)); display:flex; gap:8px; z-index:5; align-items:flex-end;}
  #clubChip{
    background:var(--ink);
    -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px);
    border:1px solid var(--hair);
    border-left:3px solid var(--gold);
    border-radius:var(--rad); padding:9px 18px 8px;
    display:flex; flex-direction:column; align-items:flex-start; line-height:1.15;
    box-shadow:var(--pshadow);
  }
  #clubChip small{font-size:8px; font-weight:800; color:var(--mute); letter-spacing:2.4px;}
  #clubChip span{font-weight:800; font-size:17px; letter-spacing:2px; color:var(--ivory);}
  /* ===== driving range UI ===== */
  #rangePanel{ display:none; position:absolute; bottom:14px; left:50%; transform:translateX(-50%);
    z-index:20; flex-direction:column; align-items:center; gap:9px; pointer-events:none; }
  #rangeClubs{ display:flex; gap:7px; pointer-events:auto; background:rgba(16,28,22,.6);
    -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px); padding:7px; border-radius:16px;
    box-shadow:0 8px 22px rgba(8,20,12,.4), inset 0 0 0 1px rgba(255,255,255,.08); }
  .rcBtn{ font-family:inherit; font-weight:900; font-size:12px; letter-spacing:.5px; cursor:pointer;
    border:none; border-radius:11px; padding:9px 13px; color:#cfe2d4; background:rgba(255,255,255,.07);
    transition:transform .1s, background .12s; min-width:54px; }
  .rcBtn small{ display:block; font-size:8px; font-weight:800; opacity:.6; letter-spacing:1px; margin-top:2px; }
  .rcBtn:hover{ background:rgba(255,255,255,.14); transform:translateY(-1px); }
  .rcBtn.sel{ background:linear-gradient(180deg,#7ed957,#4cb83c); color:#10240f; box-shadow:0 3px 0 #2f8f2f; }
  #rangeReadout{ display:flex; flex-direction:column; align-items:center; line-height:1;
    background:rgba(16,28,22,.6); -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px);
    padding:7px 22px; border-radius:14px; box-shadow:0 6px 16px rgba(8,20,12,.35); }
  #rangeReadout #rrCarry{ font-size:22px; font-weight:900; color:#ffe27a; letter-spacing:1px; }
  #rangeReadout small{ font-size:8px; font-weight:800; letter-spacing:2px; color:#9fb6a4; margin-top:3px; text-transform:uppercase; }
  /* ===== vertical spin dock: left edge, minimal ink glass ===== */
  #spinChip{
    position:absolute; left:12px; top:50%; transform:translateY(-50%);
    z-index:6; display:none; flex-direction:column; align-items:center; gap:7px;
    background:var(--ink);
    -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px);
    border:1px solid var(--hair); border-radius:var(--rad);
    padding:11px 10px; box-shadow:var(--pshadow);
    touch-action:none; cursor:grab;
  }
  #spinChip:active{ cursor:grabbing; }
  .sdEnd{ font-size:7.5px; font-weight:800; letter-spacing:1.8px; color:var(--mute); }
  #spinTrack{
    position:relative; width:9px; height:128px; border-radius:999px;
    background:rgba(0,0,0,.34);
    box-shadow:inset 0 1px 3px rgba(0,0,0,.5);
  }
  #spinFill{
    position:absolute; left:0; right:0; top:50%; height:0%;
    border-radius:999px; transition:all .07s linear;
  }
  #spinDetent{
    position:absolute; left:-2px; right:-2px; top:calc(50% - 1px); height:2px;
    background:rgba(255,255,255,.4); border-radius:2px; z-index:2;
  }
  #spinKnob{
    position:absolute; left:50%; top:50%; width:15px; height:15px;
    transform:translate(-50%,-50%);
    border-radius:50%; background:var(--ivory); z-index:3;
    box-shadow:0 0 0 2px rgba(16,24,19,.6), 0 0 9px 1px var(--glow, transparent);
    transition:top .07s linear, box-shadow .15s ease;
  }
  #spinMeta{ display:flex; flex-direction:column; align-items:center; gap:2px; margin-top:2px; }
  .sdName{ font-size:8px; font-weight:800; letter-spacing:2.2px; color:var(--mute); }
  #spinVal{ font-size:9.5px; font-weight:800; letter-spacing:.8px; color:var(--ivory); transition:color .15s ease; }

  #meters{
    position:absolute; left:50%; bottom:calc(16px + env(safe-area-inset-bottom, 0px)); transform:translateX(-50%);
    width:330px; max-width:62%; z-index:5; display:none;
  }
  .meterLabel{
    text-align:center; font-weight:800; font-size:11px; letter-spacing:2.6px;
    text-transform:uppercase; color:var(--ivory); text-shadow:0 1px 4px rgba(8,18,12,.6); margin-bottom:5px;
  }
  .meterTrack{
    position:relative; height:24px; border-radius:999px; overflow:hidden;
    background:var(--ink);
    -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px);
    border:1px solid var(--hair);
    box-shadow:var(--pshadow), inset 0 2px 5px rgba(0,0,0,.32);
  }
  #powerFill{
    position:absolute; left:0; top:0; bottom:0; width:0%;
    background:linear-gradient(90deg,#7ed957,#ffd84d 60%,#ff7a4e); border-radius:999px;
  }
  #powerTrack.locked #powerFill{filter:saturate(1.4) brightness(1.08);}
  #sweetTick{
    position:absolute; left:75%; top:-2px; bottom:-2px; width:3px;
    background:#1d3a22; border-radius:2px; box-shadow:0 0 0 1.5px rgba(255,255,255,.85);
    z-index:2;
  }
  #sweetTick::after{
    content:'75'; position:absolute; top:-13px; left:50%; transform:translateX(-50%);
    font-size:9px; font-weight:900; color:#fff; text-shadow:0 1px 2px rgba(20,60,30,.6);
  }
  /* pendulum accuracy meter as an ARC (same style + speed, nicer feel) */
  #accArcWrap{ position:relative; width:100%; height:58px; margin-top:4px; }
  #accArc{ width:100%; height:100%; overflow:visible; display:block; }
  #accArc .arcBand{ fill:none; stroke-linecap:round; }
  #accArc .arcOutline{ fill:none; stroke:rgba(16,24,19,.55); }
  #accArc .arcTickC{ stroke:rgba(29,58,34,.7); stroke-width:2; }
  #accDot{
    fill:#fbfdfe; stroke:#1d3a22; stroke-width:2.5;
    filter:drop-shadow(0 1px 3px rgba(8,18,12,.6));
  }
  /* legacy (unused) */
  #accTrack{display:none;} #accZones{display:none;} .zone{display:none;}
  #hint{ display:none; }
  /* ===== GREEN-READING CAMERA UI ===== */
  #greenCamBtn{ position:absolute; right:14px; bottom:120px; z-index:30; font-family:inherit; font-weight:900;
    font-size:13px; letter-spacing:.4px; color:#10402a; cursor:pointer; display:inline-flex; align-items:center; gap:6px;
    background:linear-gradient(180deg,#caf5d4,#86d98e); border:none; border-radius:99px; padding:10px 18px;
    box-shadow:0 5px 0 rgba(20,90,40,.35), 0 10px 22px rgba(20,90,40,.28); transition:transform .1s; }
  #greenCamBtn:hover{ transform:translateY(-1px); }
  #greenCamBtn:active{ transform:translateY(3px); box-shadow:0 1px 0 rgba(20,90,40,.35); }
  #greenCamBtn.on{ background:linear-gradient(180deg,#fff0b8,#ffd84d); color:#5a3d00; box-shadow:0 5px 0 rgba(150,110,10,.35), 0 10px 22px rgba(180,130,20,.28); }
  #greenReadHud{ position:absolute; right:14px; bottom:180px; z-index:30; display:none; flex-direction:column;
    align-items:center; gap:8px; background:rgba(16,28,22,.7); -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px);
    padding:12px; border-radius:16px; box-shadow:0 8px 24px rgba(8,20,12,.4); }
  .grPadLabel{ font-size:9px; font-weight:900; letter-spacing:2px; color:#9fe0b0; }
  .grPad{ display:grid; grid-template-columns:repeat(3,36px); grid-template-rows:repeat(2,36px); gap:5px; }
  .grUp{ grid-column:2; grid-row:1; } .grLeft{ grid-column:1; grid-row:2; }
  .grRight{ grid-column:3; grid-row:2; } .grDown{ grid-column:2; grid-row:2; }
  .grZoom{ display:flex; gap:6px; }
  .grBtn{ font-family:inherit; font-weight:900; font-size:16px; color:#10402a; cursor:pointer;
    background:linear-gradient(180deg,#eafaee,#bfe9c6); border:none; border-radius:10px; width:36px; height:36px;
    display:flex; align-items:center; justify-content:center; box-shadow:0 3px 0 rgba(20,90,40,.3); transition:transform .08s; user-select:none; }
  .grBtn:active{ transform:translateY(2px); box-shadow:0 1px 0 rgba(20,90,40,.3); }
  @media (max-width:700px){ #greenCamBtn{ bottom:96px; font-size:12px; padding:9px 14px; } #greenReadHud{ bottom:150px; } }
  #banner{
    position:absolute; left:50%; top:32%; transform:translate(-50%,-50%) scale(.6);
    z-index:6; font-weight:900; font-size:46px; letter-spacing:1px;
    color:#fff; text-shadow:0 4px 0 rgba(20,60,30,.45);
    opacity:0; pointer-events:none; transition:all .18s ease;
    -webkit-text-stroke:2px rgba(20,60,30,.35);
  }
  #banner.show{opacity:1; transform:translate(-50%,-50%) scale(1);}
  #endCard{
    position:absolute; inset:0; z-index:10; display:none;
    align-items:center; justify-content:center;
    /* barely-there scrim: the course stays in view */
    background:linear-gradient(180deg, rgba(14,26,18,.34) 0%, rgba(14,26,18,.08) 30%,
               rgba(14,26,18,.08) 62%, rgba(14,26,18,.38) 100%);
    opacity:0; transition:opacity .35s ease;
  }
  #endCard.show{display:flex; opacity:1;}
  .card{
    background:none; border:none; box-shadow:none;
    text-align:center; max-width:92%;
    display:flex; flex-direction:column; align-items:center;
    color:#fdfcf7;
  }
  .cardEyebrow{
    display:flex; align-items:center; gap:14px;
    font-size:10.5px; font-weight:800; letter-spacing:4px;
    color:rgba(253,252,247,.85); text-shadow:0 1px 6px rgba(10,25,14,.6);
    margin-bottom:10px;
    animation:fadeRise .5s .05s ease both;
  }
  .cardEyebrow::before, .cardEyebrow::after{
    content:''; width:46px; height:1px; background:rgba(253,252,247,.55);
    transform:scaleX(0); animation:ruleIn .6s .15s ease forwards;
  }
  @keyframes ruleIn{to{transform:scaleX(1);}}
  @keyframes fadeRise{from{opacity:0; transform:translateY(10px);} to{opacity:1; transform:translateY(0);}}
  .card h2{
    font-size:60px; font-weight:800; letter-spacing:6px; text-transform:uppercase;
    line-height:1; color:#fff;
    text-shadow:0 2px 0 rgba(10,30,16,.25), 0 10px 34px rgba(10,25,14,.55);
    margin-bottom:6px;
    animation:fadeRise .55s .12s cubic-bezier(.2,.9,.3,1) both;
  }
  .card .sub{
    font-weight:600; font-size:13px; letter-spacing:.6px;
    color:rgba(253,252,247,.82); text-shadow:0 1px 6px rgba(10,25,14,.6);
    margin-bottom:22px;
    animation:fadeRise .55s .2s ease both;
  }
  /* scorecard: bare numbers with classic golf notation — ◯ birdie, ▢ bogey */
  #scorecard{display:flex; gap:14px; justify-content:center; margin-bottom:20px; flex-wrap:wrap;
    animation:fadeRise .55s .28s ease both;}
  .sq{
    position:relative; width:26px; height:34px;
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px;
    background:none; border:none; box-shadow:none;
  }
  .sq small{font-size:9.5px; font-weight:800; letter-spacing:1px; color:rgba(253,252,247,.85); text-shadow:0 1px 4px rgba(10,25,14,.6);}
  .sq b{
    position:relative; font-size:15px; font-weight:800; color:#fff;
    width:22px; height:22px; display:flex; align-items:center; justify-content:center;
    text-shadow:0 1px 5px rgba(10,25,14,.6);
  }
  .sq.birdie b::before{
    content:''; position:absolute; inset:-1px;
    border:1.6px solid rgba(255,214,130,.95); border-radius:50%;    /* circle = under par */
    box-shadow:0 0 10px rgba(255,200,100,.35);
  }
  .sq.bogey b::before{
    content:''; position:absolute; inset:-1px;
    border:1.6px solid rgba(170,205,235,.9); border-radius:4px;     /* square = over par */
  }
  .sq.now::after{
    content:''; position:absolute; bottom:-7px; left:50%; transform:translateX(-50%);
    width:4px; height:4px; border-radius:50%; background:#fff;
    box-shadow:0 0 8px rgba(255,255,255,.8);
  }
  /* stats: one quiet hairline-separated line */
  .statRow{display:flex; gap:0; justify-content:center; margin-bottom:20px; flex-wrap:wrap;
    animation:fadeRise .55s .36s ease both;}
  .stat{
    background:none; border:none; border-radius:0; padding:2px 18px; min-width:0;
    border-left:1px solid rgba(253,252,247,.28);
    animation:none;
  }
  .stat:first-child{border-left:none;}
  .stat small{display:block; font-size:8px; font-weight:800; letter-spacing:2.2px; text-transform:uppercase;
    color:rgba(253,252,247,.55); margin-bottom:2px; text-shadow:0 1px 4px rgba(10,25,14,.5);}
  .stat b{font-size:18px; font-weight:800; color:#fff; text-shadow:0 1px 6px rgba(10,25,14,.6);}
  #nextHoleRow{
    display:none; align-items:center; justify-content:center; gap:8px;
    margin:0 auto 22px; padding:0; width:fit-content;
    background:none; border:none;
    font-size:11.5px; font-weight:800; letter-spacing:2.6px; color:rgba(253,252,247,.7);
    text-shadow:0 1px 5px rgba(10,25,14,.55);
    animation:fadeRise .55s .44s ease both;
  }
  #nextHoleRow.show{display:flex;}
  #nextHoleRow b{color:#fff; letter-spacing:1.4px;}
  #nextHoleRow::before{content:'↓'; font-size:13px; color:rgba(255,214,130,.9);}
  #againBtn{
    background:rgba(253,252,247,.14);
    -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px);
    border:1px solid rgba(253,252,247,.55); cursor:pointer; font-family:inherit;
    font-weight:800; font-size:14px; color:#fff; letter-spacing:3px; text-transform:uppercase;
    padding:13px 42px; border-radius:999px;
    text-shadow:0 1px 5px rgba(10,25,14,.5);
    box-shadow:0 8px 24px rgba(10,25,14,.25);
    transition:background .2s ease, transform .15s ease, letter-spacing .2s ease;
    animation:fadeRise .55s .52s ease both;
  }
  #againBtn:hover{background:rgba(253,252,247,.26); transform:translateY(-2px); letter-spacing:3.6px;}
  #againBtn:active{transform:translateY(1px);}
  /* ================= MENU SYSTEM ================= */
  #menuScreen, #courseScreen{
    position:absolute; inset:0; z-index:40; overflow:hidden;
    background:linear-gradient(180deg,#9fd9f6 0%,#bde7fb 45%,#dff4ff 75%,#eafff0 100%);
    display:flex; flex-direction:column; align-items:center; justify-content:center;
  }
  /* ===== MULTIPLAYER screen: shares the course-select look ===== */  #mpScreen{
    position:absolute; inset:0; z-index:41; overflow-y:auto; -webkit-overflow-scrolling:touch; display:none;
    background:linear-gradient(180deg,#9fd9f6 0%,#bde7fb 45%,#dff4ff 75%,#eafff0 100%);
    flex-direction:column; align-items:center; justify-content:center;
    padding:max(24px,4vh) 0; }
  #mpScreen .csBgShared{ position:fixed; inset:0; z-index:0; width:100%; height:100%;
    pointer-events:none; filter:saturate(1.05); }
  #mpScreen .csVignetteShared{ position:fixed; inset:0; z-index:1; pointer-events:none;
    background:radial-gradient(130% 100% at 50% 38%, rgba(10,30,45,0) 40%, rgba(10,30,45,.28) 100%); }
  #mpScreen h2{ position:relative; z-index:3; font-size:34px; font-weight:900; letter-spacing:6px;
    color:#fff; margin-bottom:4px; text-shadow:0 2px 0 rgba(20,70,40,.35), 0 6px 18px rgba(10,40,60,.5); }
  #mpScreen .csSub{ position:relative; z-index:3; font-size:11px; font-weight:800; letter-spacing:3px;
    color:rgba(255,255,255,.85); text-transform:uppercase; margin-bottom:16px; text-shadow:0 1px 6px rgba(10,40,60,.5); }
  /* Pass & Play / Online toggle */
  #mpModeToggle{ position:relative; z-index:3; display:flex; gap:6px; margin-bottom:18px;
    background:rgba(16,40,55,.32); padding:6px; border-radius:14px;
    -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px); box-shadow:inset 0 0 0 1px rgba(255,255,255,.18); }
  #mpModeToggle button{ font-family:inherit; font-weight:900; font-size:13px; letter-spacing:2px; cursor:pointer;
    color:rgba(255,255,255,.82); background:transparent; border:none; padding:10px 22px; border-radius:10px; transition:all .15s; }
  #mpModeToggle button.on{ color:#1d5a2e; background:#fff; box-shadow:0 2px 8px rgba(10,40,60,.25); }
  #mpSetup{ position:relative; z-index:3; display:flex; flex-direction:column; align-items:center; gap:14px;
    width:min(560px,94vw); }
  .mpBlock{ display:flex; align-items:center; gap:16px; width:100%; justify-content:center; }
  .mpLabel{ font-size:11px; font-weight:900; letter-spacing:3px; color:rgba(255,255,255,.9);
    text-shadow:0 1px 5px rgba(10,40,60,.5); width:84px; text-align:right; }
  .mpChoice{ display:flex; flex-wrap:wrap; justify-content:center; gap:8px; background:rgba(16,40,55,.32); padding:6px; border-radius:14px;
    -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px); box-shadow:inset 0 0 0 1px rgba(255,255,255,.18); }
  .mpChoice button{ font-family:inherit; font-weight:900; font-size:15px; letter-spacing:1px; cursor:pointer;
    border:none; border-radius:10px; padding:9px 18px; color:#2a5570; background:rgba(255,255,255,.65);
    transition:transform .12s, box-shadow .12s; min-width:46px; }
  .mpChoice button:hover{ transform:translateY(-1px); }
  .mpChoice button.on{ background:linear-gradient(180deg,#ffeb8a,#ffd84d); color:#3a2a06; box-shadow:0 3px 10px rgba(214,150,20,.3), inset 0 1px 0 rgba(255,255,255,.8); }
  #mpPlayers{ display:grid; grid-template-columns:1fr 1fr; gap:12px; width:100%; margin-top:6px; }
  .mpCard{ background:linear-gradient(180deg, rgba(255,255,255,.86), rgba(244,251,255,.76));
    -webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px); border-radius:16px; padding:12px 14px;
    display:flex; align-items:center; gap:12px; box-shadow:0 12px 26px rgba(10,40,60,.26), 0 0 0 1px rgba(255,255,255,.5) inset;
    position:relative; overflow:hidden; }
  .mpCard .mpAv{ width:42px; height:42px; border-radius:50%; display:flex; align-items:center; justify-content:center;
    font-weight:900; font-size:19px; color:#fff; flex-shrink:0; box-shadow:0 2px 6px rgba(0,0,0,.2); }
  .mpCard input{ font-family:inherit; font-weight:800; font-size:15px; color:#1d3a22; border:none; background:transparent;
    width:100%; outline:none; border-bottom:2px solid rgba(40,90,60,.18); padding:3px 0; }
  .mpCard input:focus{ border-bottom-color:#5fb054; }
  .mpCard .mpTeam{ font-size:10px; font-weight:900; letter-spacing:1px; padding:4px 10px; border-radius:99px; cursor:pointer;
    flex-shrink:0; transition:transform .1s; }
  .mpCard .mpTeam:active{ transform:scale(.94); }
  .mpTeam.tA{ background:rgba(74,163,255,.22); color:#2f6db5; } .mpTeam.tB{ background:rgba(255,122,74,.22); color:#c25a2c; }
  .mpCard.teamA{ box-shadow:0 12px 26px rgba(10,40,60,.26), inset 4px 0 0 #4aa3ff, 0 0 0 1px rgba(255,255,255,.5) inset; }
  .mpCard.teamB{ box-shadow:0 12px 26px rgba(10,40,60,.26), inset 4px 0 0 #ff7a4a, 0 0 0 1px rgba(255,255,255,.5) inset; }
  .mpFoot{ position:relative; z-index:3; display:flex; gap:14px; margin-top:18px; align-items:center; }
  /* ===== online lobby screen ===== */
  #lobbyScreen{ position:fixed; inset:0; z-index:60; display:none; flex-direction:column; align-items:center;
    justify-content:flex-start; padding-top:8vh; overflow:hidden;
    font-family:'Trebuchet MS',system-ui,sans-serif; background:#cfeafd; }
  #lobbyScreen h2{ position:relative; z-index:3; font-size:34px; font-weight:900; letter-spacing:6px;
    color:#1d5a2e; text-shadow:0 2px 0 #fff; margin:0; }
  #lobbyScreen .csSub{ position:relative; z-index:3; font-size:12px; font-weight:800; letter-spacing:3px;
    color:#2c6a3a; opacity:.85; margin:8px 0 22px; text-transform:uppercase; }
  #mpOnline{ position:relative; z-index:3; display:flex; justify-content:center; width:100%; }
  #lobbyPanel{ position:relative; z-index:3; width:min(440px,90vw); background:rgba(255,255,255,.82);
    -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px); border-radius:18px; padding:22px;
    box-shadow:0 14px 40px rgba(20,50,30,.22); }
  .lobField{ display:flex; flex-direction:column; gap:6px; margin-bottom:14px; }
  .lobField label{ font-size:10px; font-weight:800; letter-spacing:2px; color:#3a6a48; }
  .lobField input{ font-size:18px; font-weight:700; padding:11px 14px; border-radius:11px; border:2px solid #bfe0c8;
    background:#fff; color:#1d3a22; outline:none; text-align:center; letter-spacing:1px; }
  .lobField input:focus{ border-color:#7cc24a; }
  .lobBtns{ display:flex; justify-content:center; margin-bottom:6px; }
  .lobBtns .menuBtn{ min-width:180px; }
  .lobOr{ text-align:center; font-size:11px; font-weight:700; letter-spacing:1px; color:#6a8a72; margin:16px 0 12px; }
  .lobJoinField{ flex-direction:column; align-items:stretch; margin-bottom:10px; }
  .lobJoinField input{ width:100%; font-size:30px; letter-spacing:10px; text-align:center; padding:12px 14px; }
  .lobCodeWrap{ display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:18px; }
  .lobCodeLabel{ font-size:10px; font-weight:800; letter-spacing:2px; color:#3a6a48; }
  #lobCode{ font-size:30px; font-weight:900; letter-spacing:8px; color:#1d5a2e; background:#eaf6ee;
    padding:6px 16px; border-radius:11px; }
  .lobCopy{ font-size:10px; font-weight:700; color:#3a7d5a; background:#dff0e4; border:none; padding:5px 9px;
    border-radius:7px; cursor:pointer; }
  #lobPlayers{ display:flex; flex-direction:column; gap:8px; margin-bottom:16px; }
  .lobRow{ display:flex; align-items:center; gap:11px; background:#fff; border-radius:11px; padding:9px 12px; }
  .lobAv{ width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center;
    font-weight:900; font-size:13px; color:#1d3a22; }
  .lobName{ font-weight:700; color:#22402a; flex:1; }
  .lobHost{ font-size:9px; font-weight:800; letter-spacing:1px; color:#a8741a; background:#ffeec2; padding:3px 7px; border-radius:6px; }
  #lobWait{ text-align:center; font-size:12px; font-weight:700; color:#6a8a72; margin-bottom:12px; }
  .lobMock{ display:block; margin:12px auto 0; font-size:11px; font-weight:700; color:#3a7d5a; background:transparent;
    border:1px dashed #9cc7a8; padding:7px 12px; border-radius:9px; cursor:pointer; }
  #lobAddLocal{ border-color:#7cc24a; color:#2e7a3a; }
  #lobLocalHint{ text-align:center; font-size:10px; color:#6a8a72; margin-top:5px; font-weight:600; }
  .lobRow.lobLocal{ background:rgba(124,194,74,.12); }
  .lobLocalName{ flex:1; font-family:inherit; font-weight:700; font-size:13px; color:#1d5a2e; background:#fff;
    border:1.5px solid #cfe3d4; border-radius:7px; padding:4px 8px; min-width:0; }
  .lobLocalTag{ font-size:9px; font-weight:900; letter-spacing:1px; color:#2e7a3a; background:#d9f0df;
    padding:2px 7px; border-radius:99px; flex-shrink:0; }
  .lobLocalDel{ font-family:inherit; font-weight:900; font-size:12px; color:#c0563a; background:transparent;
    border:none; cursor:pointer; padding:2px 6px; flex-shrink:0; }
  .lobLocalDel:hover{ color:#e8623a; }
  .lobHint{ text-align:center; font-size:11px; color:#5a7a64; margin-top:14px; min-height:16px; }
  /* expanded lobby */
  .lobCourseRow{ display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:14px; }
  /* host-only format/course pickers inside the lobby room */
  #lobHostOptions{ margin-bottom:14px; }
  .lobOptRow{ display:flex; align-items:center; gap:10px; margin-bottom:9px; }
  .lobOptLabel{ font-size:10px; font-weight:800; letter-spacing:1.5px; color:#3a6a48; width:58px; text-align:right; flex-shrink:0; }
  .lobOptChoice{ display:flex; flex-wrap:wrap; gap:5px; flex:1; }
  .lobOptChoice button{ font-family:inherit; font-weight:800; font-size:11px; letter-spacing:.5px; cursor:pointer;
    color:#3a6a48; background:#eef6f0; border:1.5px solid #d6e8db; padding:6px 11px; border-radius:9px; transition:all .12s; }
  .lobOptChoice button.on{ color:#fff; background:#3aa55e; border-color:#2e8a4c; }
  .lobCourseChoice button{ font-size:10px; padding:5px 9px; }
  .lobCourseLabel{ font-size:10px; font-weight:800; letter-spacing:2px; color:#3a6a48; }
  #lobCourseName{ font-weight:800; color:#1d5a2e; }
  .lobCourseBtn{ font-size:10px; font-weight:700; color:#3a7d5a; background:#dff0e4; border:none; padding:4px 9px; border-radius:7px; cursor:pointer; }
  .lobSlotHead{ text-align:center; font-size:11px; font-weight:700; color:#5a7a64; margin-bottom:8px; }
  #lobCount{ color:#1d5a2e; font-weight:900; }
  .lobRow{ transition:transform .25s ease, opacity .25s ease; }
  .lobRow.joining{ animation:lobPop .35s ease; }
  @keyframes lobPop{ 0%{ transform:scale(.7); opacity:0; } 60%{ transform:scale(1.05); } 100%{ transform:scale(1); opacity:1; } }
  .lobRow.empty{ opacity:.5; border:1.5px dashed #b6d4be; background:rgba(255,255,255,.4); }
  .lobRow.empty .lobAv{ background:#cfe2d4 !important; color:#8aa894; }
  .lobReadyChip{ font-size:9px; font-weight:800; letter-spacing:1px; padding:3px 7px; border-radius:6px; }
  .lobReadyChip.yes{ color:#1d6b3a; background:#cdf0d8; }
  .lobReadyChip.no{ color:#a86a1a; background:#ffeec2; }
  #lobReadyRow{ display:flex; justify-content:center; margin:4px 0 12px; }
  .lobReady{ font-size:12px; font-weight:800; letter-spacing:1px; color:#1d6b3a; background:#d6f0de;
    border:2px solid #9cd6ac; padding:9px 22px; border-radius:11px; cursor:pointer; transition:all .15s; }
  .lobReady.on{ color:#fff; background:#3aa55e; border-color:#2e8a4c; }
  #lobChatWrap{ margin-top:14px; }
  #lobChat{ height:84px; overflow-y:auto; background:rgba(255,255,255,.55); border-radius:11px; padding:8px 11px;
    font-size:12px; color:#2a402f; line-height:1.5; }
  #lobChat div{ margin-bottom:2px; }
  #lobChat b{ color:#1d5a2e; }
  #lobEmotes{ display:flex; gap:6px; justify-content:center; margin-top:8px; }
  #lobEmotes button{ font-size:18px; background:#fff; border:1.5px solid #cfe2d4; border-radius:9px;
    width:38px; height:38px; cursor:pointer; transition:transform .12s; }
  #lobEmotes button:hover{ transform:scale(1.12); }
  /* in-game multiplayer HUD: shot clock + turn banner + mini scoreboard */
  #mpHud{ position:absolute; top:10px; left:50%; transform:translateX(-50%); z-index:46; display:none;
    flex-direction:column; align-items:center; gap:6px; pointer-events:none; }
  #mpTurn{ background:rgba(16,28,22,.82); -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px);
    color:#fff; font-weight:900; font-size:15px; letter-spacing:1px; padding:7px 18px; border-radius:99px;
    box-shadow:0 6px 16px rgba(8,20,12,.4); display:flex; align-items:center; gap:10px; }
  #mpTurn .mpDot{ width:12px; height:12px; border-radius:50%; box-shadow:0 0 0 2px rgba(255,255,255,.5); }
  #mpClock{ font-variant-numeric:tabular-nums; font-weight:900; transition:color .15s; }
  #mpClock.low{ color:#ffb259; }
  #mpClock.danger{ color:#ff4a3a; animation:clockPulse .6s ease-in-out infinite; display:inline-block; }
  @keyframes clockPulse{ 0%,100%{ transform:scale(1); text-shadow:0 0 0 rgba(255,60,40,0); } 50%{ transform:scale(1.35); text-shadow:0 0 14px rgba(255,60,40,.8); } }
  /* the whole turn banner flashes red in the danger zone */
  #mpHud.clockDanger #mpTurn{ box-shadow:0 0 0 2px rgba(255,60,40,.6), 0 0 18px rgba(255,60,40,.5); }
  #mpBoard{ position:absolute; top:64px; left:10px; z-index:46; display:none; flex-direction:column; gap:5px;
    pointer-events:none; }
  #mpBoard.show{ display:flex; }
  #mpBoard .mpb{ background:rgba(16,28,22,.74); -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px);
    color:#e6f0e9; font-size:12px; font-weight:800; padding:6px 10px; border-radius:9px;
    display:flex; align-items:center; gap:7px; min-width:104px; box-shadow:0 4px 12px rgba(8,20,12,.35); }
  #mpBoard .mpb .pd{ width:9px; height:9px; border-radius:50%; flex-shrink:0; }
  #mpBoard .mpbName{ flex:1; white-space:nowrap; }
  #mpBoard .mpbScore{ font-weight:900; font-variant-numeric:tabular-nums; }
  #mpBoard .mpbScore.under{ color:#7ed957; }     /* under par = green */
  #mpBoard .mpbScore.over{ color:#ff9d6a; }       /* over par = orange */
  #mpBoard .mpbScore.even{ color:#ffe08a; }       /* even = gold */
  #mpBoard .mpb.act{ outline:2px solid var(--gold,#ffd84d); box-shadow:0 0 14px rgba(255,216,77,.4); }
  @media (max-width:700px){ #mpBoard{ top:56px; } #mpBoard .mpb{ font-size:11px; min-width:92px; padding:5px 8px; } }
  #mpBoard .mpbScore.skin{ color:#ffd84d; font-weight:900; }

  /* ===== SKINS POT (top-right chip during play) ===== */
  #skinPot{ position:absolute; top:64px; right:12px; z-index:46; display:none; pointer-events:none; }
  #skinPot.show{ display:block; }
  #skinPotInner{ position:relative; text-align:center;
    background:linear-gradient(180deg,#fff3c4,#ffd84d 55%,#f0a52e);
    border-radius:16px; padding:8px 18px 9px; min-width:96px;
    box-shadow:0 6px 18px rgba(150,100,10,.4), inset 0 1px 0 rgba(255,255,255,.7), inset 0 -2px 0 rgba(150,90,10,.25);
    border:1.5px solid rgba(255,255,255,.5); }
  #skinPotLabel{ font-size:9px; font-weight:900; letter-spacing:2px; color:#7a4e0a; }
  #skinPotVal{ font-size:30px; font-weight:900; line-height:1; color:#5a3500;
    text-shadow:0 1px 0 rgba(255,255,255,.5); font-variant-numeric:tabular-nums; }
  #skinPotCarry{ font-size:8px; font-weight:900; letter-spacing:1.5px; color:#b5491a; margin-top:2px;
    opacity:0; transition:opacity .2s; }
  #skinPot.carry #skinPotCarry{ opacity:1; }
  #skinPot.carry #skinPotInner{ animation:potGrow .6s cubic-bezier(.3,1.5,.5,1); box-shadow:0 0 0 3px rgba(255,107,40,.5), 0 6px 22px rgba(180,70,10,.5); }
  @keyframes potGrow{ 0%{ transform:scale(1);} 45%{ transform:scale(1.22) rotate(-3deg);} 100%{ transform:scale(1);} }
  @media (max-width:700px){ #skinPot{ top:56px; right:8px; } #skinPotVal{ font-size:24px; } #skinPotInner{ min-width:80px; padding:6px 12px 7px; } }

  /* ===== SKINS HOLE-RESULT REVEAL (center, dramatic) ===== */
  #skinReveal{ position:absolute; inset:0; z-index:55; display:none; align-items:center; justify-content:center; pointer-events:none; }
  #skinReveal.show{ display:flex; }
  #skinRevealCard{ text-align:center; padding:26px 40px; border-radius:22px;
    background:linear-gradient(180deg, rgba(20,32,26,.92), rgba(12,22,17,.94));
    box-shadow:0 20px 60px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.12);
    border:1.5px solid rgba(255,216,77,.35); transform:scale(.7); opacity:0; }
  #skinReveal.show #skinRevealCard{ animation:skinPop .5s cubic-bezier(.2,1.5,.4,1) forwards; }
  @keyframes skinPop{ 0%{ transform:scale(.7); opacity:0;} 60%{ transform:scale(1.08);} 100%{ transform:scale(1); opacity:1;} }
  #skinRevealIcon{ font-size:54px; line-height:1; filter:drop-shadow(0 4px 10px rgba(255,180,0,.4)); }
  #skinRevealTitle{ font-size:22px; font-weight:900; letter-spacing:2px; color:#fff; margin-top:8px; text-shadow:0 2px 10px rgba(0,0,0,.4); }
  #skinRevealSub{ font-size:16px; font-weight:900; color:#ffd84d; margin-top:4px; letter-spacing:1px; }
  #skinReveal.carry #skinRevealSub{ color:#ff9d6a; }
  #courseScreen{ display:none; }
  /* immersive Sakura backdrop for the course select: a soft, dreamy scene the cards float over */
  #courseScreen::before{
    content:''; position:absolute; inset:0; z-index:0; pointer-events:none;
    background:
      radial-gradient(120% 80% at 50% -10%, #cdeeff 0%, #aedffb 30%, #8fcdf2 60%, #6fb6e0 100%);
  }
  #csBg{ position:absolute; inset:0; z-index:0; width:100%; height:100%; pointer-events:none;
    filter:saturate(1.05); }
  #csVignette{ position:absolute; inset:0; z-index:1; pointer-events:none;
    background:radial-gradient(130% 100% at 50% 38%, rgba(10,30,45,0) 40%, rgba(10,30,45,.28) 100%); }
  #csPetals{ position:absolute; inset:0; z-index:1; pointer-events:none; }
  #petalCanvas{ position:absolute; inset:0; pointer-events:none; z-index:1; }
  /* cohesive illustrated course scene behind the logo */
  #menuScene{ position:absolute; inset:0; width:100%; height:100%; z-index:1;
    pointer-events:none; display:block; }
  /* gentle, connected motion — canopies sway from their trunk, flag flutters, ball breathes */
  #menuScene .msCanopy{ transform-origin:center bottom; animation:msSway 6s ease-in-out infinite; }
  #msTreeR .msCanopy{ animation-duration:6.8s; animation-delay:.6s; }
  @keyframes msSway{ 0%,100%{transform:rotate(-1.4deg);} 50%{transform:rotate(1.6deg);} }
  #msFlag{ transform-origin:1034px 386px; animation:msFlagWave 2.6s ease-in-out infinite; }
  @keyframes msFlagWave{ 0%,100%{transform:scaleX(1) skewY(0deg);} 50%{transform:scaleX(.86) skewY(-3deg);} }
  #msBall{ transform-origin:208px 628px; animation:msBob 4.5s ease-in-out infinite; }
  @keyframes msBob{ 0%,100%{transform:translateY(0);} 50%{transform:translateY(-3px);} }
  #menuLogo{ position:relative; z-index:3; text-align:center; margin-bottom:34px; animation:logoIn .8s cubic-bezier(.2,1.4,.4,1); }
  #menuLogo::before{ content:''; position:absolute; left:50%; top:50%; width:140%; height:200%;
    transform:translate(-50%,-50%); z-index:-1; pointer-events:none;
    background:radial-gradient(ellipse at center, rgba(255,255,255,.55), rgba(255,255,255,0) 68%); }
  @keyframes logoIn{ from{transform:scale(.6) translateY(30px); opacity:0;} to{transform:scale(1) translateY(0); opacity:1;} }
  #logoTop, #logoBottom{
    font-weight:900; letter-spacing:4px; line-height:.92;
    color:#ffd83d;
    text-shadow:
      0 2px 0 #f0a818, 0 5px 0 #3f9a44,
      0 8px 0 rgba(30,90,40,.45), 0 12px 22px rgba(40,90,140,.45),
      -2px -2px 0 #fff, 2px -2px 0 #fff;
    transform:rotate(-2deg);
  }
  #logoTop{ font-size:64px; }
  #logoBottom{ font-size:78px; transform:rotate(-2deg) translateX(6px); }
  #menuButtons{ position:relative; z-index:3; display:flex; flex-direction:column; gap:13px; align-items:stretch; width:244px; }
  #menuButtons .menuBtn{ width:100%; padding-left:0; padding-right:0; }
  .menuBtn{
    font-family:inherit; font-weight:800; font-size:18px; letter-spacing:1px;
    color:#143726; background:linear-gradient(180deg,#ffeb8a,#ffd84d);
    border:none; border-radius:16px; padding:16px 46px; cursor:pointer;
    box-shadow:0 10px 24px rgba(214,150,20,.3), 0 2px 6px rgba(40,90,140,.1), inset 0 1px 0 rgba(255,255,255,.8);
    transition:transform .2s cubic-bezier(.22,1,.36,1), box-shadow .2s ease, filter .2s ease;
  }
  .menuBtn:hover{ transform:translateY(-2px); box-shadow:0 16px 32px rgba(214,150,20,.38), 0 3px 8px rgba(40,90,140,.12), inset 0 1px 0 rgba(255,255,255,.9); filter:brightness(1.03); }
  .menuBtn:active{ transform:translateY(0) scale(.985); box-shadow:0 6px 16px rgba(214,150,20,.28), inset 0 1px 0 rgba(255,255,255,.7); }
  .menuBtn.alt{ background:linear-gradient(180deg,#ffffff,#eaf4fb); color:#2b6685;
    box-shadow:0 10px 24px rgba(60,110,150,.2), 0 2px 6px rgba(40,90,140,.1), inset 0 1px 0 #fff; }
  .menuBtn.alt:hover{ box-shadow:0 16px 32px rgba(60,110,150,.28), inset 0 1px 0 #fff; }
  .menuBtn.small{ font-size:14px; padding:11px 26px; border-radius:13px; }
  .menuBtn.danger{ background:linear-gradient(180deg,#ff9f8c,#f26d58); color:#fff;
    box-shadow:0 10px 24px rgba(220,80,55,.32), inset 0 1px 0 rgba(255,255,255,.4); }
  #courseScreen h2, #tourScreen h2{
    position:relative; z-index:3; font-size:38px; font-weight:900; letter-spacing:7px;
    color:#fff; margin-bottom:4px;
    text-shadow:0 2px 0 rgba(20,70,40,.35), 0 6px 18px rgba(10,40,60,.5);
  }
  #courseScreen .csSub, #tourScreen .csSub{
    position:relative; z-index:3; font-size:12px; font-weight:800; letter-spacing:4px;
    color:rgba(255,255,255,.85); text-transform:uppercase; margin-bottom:26px;
    text-shadow:0 1px 6px rgba(10,40,60,.5);
  }
  #courseCards{ display:flex; gap:16px; z-index:3; margin-bottom:26px; flex-wrap:wrap; justify-content:center; position:relative;}
  /* ===== TOUR SELECT screen ===== */
  #tourScreen{
    position:absolute; inset:0; z-index:40; overflow:hidden; display:none;
    background:linear-gradient(180deg,#9fd9f6 0%,#bde7fb 45%,#dff4ff 75%,#eafff0 100%);
    flex-direction:column; align-items:center; justify-content:center;
  }
  #tourScreen .csBgShared{ position:absolute; inset:0; z-index:0; width:100%; height:100%; pointer-events:none; filter:saturate(1.05); }
  /* tour cards reuse the exact .courseCard styling; only the grid container differs */
  #tourCards{ display:flex; gap:16px; z-index:3; margin-bottom:26px; flex-wrap:wrap; justify-content:center; position:relative; }
  .courseCard{
    width:208px; border-radius:22px; position:relative;
    background:linear-gradient(180deg, rgba(255,255,255,.82), rgba(244,251,255,.72));
    backdrop-filter:blur(10px) saturate(1.2); -webkit-backdrop-filter:blur(10px) saturate(1.2);
    box-shadow:0 18px 40px rgba(10,40,60,.32), 0 2px 0 rgba(255,255,255,.7) inset, 0 0 0 1px rgba(255,255,255,.55) inset;
    padding:13px 13px 15px; display:flex; flex-direction:column; align-items:center; gap:8px;
    transition:transform .22s cubic-bezier(.3,1.3,.5,1), box-shadow .22s ease;
    overflow:hidden;
  }
  /* a subtle sheen sweep across the glass */
  .courseCard::after{
    content:''; position:absolute; top:0; left:-60%; width:55%; height:100%; pointer-events:none;
    background:linear-gradient(105deg, transparent, rgba(255,255,255,.35), transparent);
    transform:skewX(-18deg); transition:left .5s ease; opacity:0;
  }
  .courseCard.open:hover{ transform:translateY(-8px) scale(1.035); box-shadow:0 26px 54px rgba(10,40,60,.4), 0 0 0 1px rgba(255,255,255,.7) inset, 0 0 22px rgba(126,217,89,.4); }
  .courseCard.open:hover::after{ left:120%; opacity:1; }
  .courseCard.locked{ filter:saturate(.6) brightness(.96); }
  .coursePreview{ position:relative; width:100%; height:108px; border-radius:12px; overflow:hidden; }
  .cpSky{ position:absolute; inset:0; background:linear-gradient(180deg,#8fd2f5,#d8f0ff 70%); }
  .cpSky.desert{ background:linear-gradient(180deg,#ffd9a0,#ffeed0 70%); }
  .cpSky.night{ background:linear-gradient(180deg,#27355e,#46618f 70%); }
  .cpHill{ position:absolute; left:-10%; right:-10%; bottom:-30%; height:75%; border-radius:50%; background:#5cbb57; }
  .cpHill.sand{ background:#e0bd7e; } .cpHill.dark{ background:#27513a; }
  .cpGreen{ position:absolute; right:12%; bottom:14%; width:64px; height:30px; border-radius:50%; background:#7fd96f; box-shadow:inset 0 2px 5px rgba(0,90,20,.3); }
  .cpWater{ position:absolute; left:8%; bottom:8%; width:70px; height:26px; border-radius:50%; background:#49b1e8; }
  .cpTree{ position:absolute; font-size:22px; } .cpTree.t1{ left:14%; bottom:34%; } .cpTree.t2{ left:30%; bottom:42%; font-size:17px; }
  .cpFlag{ position:absolute; right:20%; bottom:26%; font-size:20px; }
  .courseName{ font-weight:900; font-size:18px; color:#1d3a22; letter-spacing:.3px; }
  .courseInfo{ font-size:11px; font-weight:700; color:#6f8472; letter-spacing:.3px; }
  .courseBest{ font-size:12px; font-weight:900; color:#2e7f9e; }
  /* ===== TEE OFF button: glossy gradient pill with shine sweep + ball-and-flag flair ===== */
  .teeBtn{
    width:100%; margin-top:6px; border:none; cursor:pointer; font-family:inherit;
    font-weight:800; font-size:16px; letter-spacing:2px; color:#143726; padding:14px 10px;
    border-radius:15px; position:relative; overflow:hidden;
    background:linear-gradient(180deg,#ffeb8a 0%,#ffd84d 55%,#fcc933 100%);
    box-shadow:0 10px 24px rgba(214,150,20,.32), 0 2px 6px rgba(40,90,140,.1), inset 0 1px 0 rgba(255,255,255,.85);
    transition:transform .2s cubic-bezier(.22,1,.36,1), box-shadow .2s ease, filter .2s ease;
  }
  .teeBtn span{ position:relative; z-index:2; display:inline-flex; align-items:center; }
  /* a soft sheen that sweeps across on hover */
  .teeBtn::before{
    content:''; position:absolute; top:0; left:-70%; width:55%; height:100%; z-index:1; pointer-events:none;
    background:linear-gradient(105deg, transparent, rgba(255,255,255,.6), transparent);
    transform:skewX(-18deg); transition:left .55s ease;
  }
  .teeBtn:hover{
    transform:translateY(-2px);
    box-shadow:0 16px 32px rgba(214,150,20,.4), 0 3px 8px rgba(40,90,140,.12), inset 0 1px 0 rgba(255,255,255,.9), 0 0 22px rgba(126,217,89,.35);
    filter:brightness(1.04);
  }
  .teeBtn:hover::before{ left:130%; }
  .teeBtn:active{
    transform:translateY(0) scale(.985);
    box-shadow:0 6px 16px rgba(214,150,20,.28), inset 0 1px 0 rgba(255,255,255,.7);
  }
  /* ===== course-screen action buttons (Stats / Shop) ===== */
  #csButtons{ display:flex; gap:14px; align-items:center; z-index:3; margin-top:6px; position:relative; }
  /* always-visible back button pinned to the top-left of the course screen */
  .csTopBack{ position:absolute; top:16px; left:16px; z-index:8; font-family:inherit; font-weight:900;
    font-size:13px; letter-spacing:.5px; color:#2b6685; cursor:pointer;
    background:linear-gradient(180deg,#ffffff,#eaf4fb); border:none; border-radius:99px; padding:9px 18px;
    box-shadow:0 4px 0 rgba(60,110,150,.25), 0 8px 18px rgba(60,110,150,.22); transition:transform .1s; }
  .csTopBack:hover{ transform:translateY(-1px); }
  .csTopBack:active{ transform:translateY(3px); box-shadow:0 1px 0 rgba(60,110,150,.25); }
  @media (max-width:700px){ .csTopBack{ top:10px; left:10px; font-size:12px; padding:8px 14px; } }
  .csBtn{
    display:flex; align-items:center; gap:9px; border:none; cursor:pointer; font-family:inherit;
    font-weight:800; font-size:14px; letter-spacing:.5px; padding:13px 26px; border-radius:14px;
    color:#fff; transition:transform .2s cubic-bezier(.22,1,.36,1), box-shadow .2s ease, filter .2s ease;
    box-shadow:0 8px 20px rgba(20,60,40,.18), inset 0 1px 0 rgba(255,255,255,.28);
  }
  .csBtn:hover{ transform:translateY(-2px); filter:brightness(1.05); box-shadow:0 14px 28px rgba(20,60,40,.24), inset 0 1px 0 rgba(255,255,255,.3); }
  .csBtn:active{ transform:translateY(0) scale(.98); box-shadow:0 5px 14px rgba(20,60,40,.2); }
  .csBtn .csIcon{ font-size:18px; display:inline-flex; align-items:center; }
  .csBtn .csIcon svg{ width:18px; height:18px; display:block; }
  .btnIco{ width:19px; height:19px; vertical-align:-3px; margin-right:7px; }
  .coinIco{ width:17px; height:17px; vertical-align:-3px; display:inline-block; }
  .csBtn.rangeBtn{ background:linear-gradient(180deg,#5cba6e,#33934a); box-shadow:0 8px 20px rgba(30,110,55,.34), inset 0 1px 0 rgba(255,255,255,.28); }
  .csBtn.statsBtn{ background:linear-gradient(180deg,#b3e3fb,#7fc5ea); color:#15455f; box-shadow:0 8px 20px rgba(90,160,210,.28), inset 0 1px 0 rgba(255,255,255,.5); }
  .csBtn.shopBtn{ background:linear-gradient(180deg,#ff9d7a,#f0704e); color:#fff; box-shadow:0 8px 20px rgba(220,90,55,.32), inset 0 1px 0 rgba(255,255,255,.34); }
  #coinChip, .coinChipShared{ display:flex; align-items:center; gap:7px; background:rgba(255,255,255,.92); border-radius:14px; padding:11px 18px; font-weight:900; color:#b5860c; box-shadow:0 8px 20px rgba(180,140,20,.18), inset 0 1px 0 #fff; }
  /* ===== full-screen overlays for Stats and Shop ===== */
  #statsScreen, #storeScreen{
    position:fixed; inset:0; z-index:60; display:none; align-items:flex-start; justify-content:center;
    background:rgba(18,40,55,.55); backdrop-filter:blur(6px); padding:38px 16px; overflow:auto;
  }
  #statsScreen .sheet, #storeScreen .sheet{
    width:min(940px,96vw); background:linear-gradient(180deg,#f4fbff,#e3f1f8);
    border-radius:26px; padding:26px 26px 24px; box-shadow:0 26px 60px rgba(10,40,60,.4), inset 0 0 0 1px rgba(255,255,255,.7);
    display:flex; flex-direction:column; align-items:center; animation:sheetIn .32s cubic-bezier(.2,1.1,.4,1);
  }
  @keyframes sheetIn{ from{opacity:0; transform:translateY(24px) scale(.97);} to{opacity:1; transform:none;} }
  #statsScreen h2, #storeScreen h2{ font-size:30px; font-weight:900; letter-spacing:5px; color:#27607c; text-shadow:0 2px 0 #fff; margin-bottom:18px; }
  /* career stats grid */
  #statsReport{ display:flex; flex-wrap:wrap; justify-content:center; gap:0; width:100%; margin-bottom:22px;
    background:rgba(255,255,255,.7); border-radius:16px; padding:16px 8px; box-shadow:inset 0 0 0 1px rgba(40,90,110,.1); }
  #statsReport .srItem{ display:flex; flex-direction:column; align-items:center; padding:4px 20px; border-right:1px solid rgba(40,90,110,.12); }
  #statsReport .srItem:last-child{ border-right:none; }
  #statsReport .srVal{ font-size:26px; font-weight:900; color:#27607c; line-height:1; }
  #statsReport .srKey{ font-size:9.5px; font-weight:900; letter-spacing:1.4px; color:#6a8a9a; margin-top:6px; }
  /* challenges header + list */
  .chHead{ display:flex; justify-content:space-between; align-items:center; width:100%; margin-bottom:10px; }
  .chTitle{ font-size:13px; font-weight:900; letter-spacing:3px; color:#3c7a96; }
  .chCount{ font-size:13px; font-weight:900; color:#37b24d; background:rgba(124,217,89,.16); padding:3px 12px; border-radius:99px; }
  #challengesList{ width:100%; display:flex; flex-direction:column; gap:7px; margin-bottom:20px; }
  .chRow{ display:flex; align-items:center; gap:13px; background:rgba(255,255,255,.7); border-radius:13px; padding:11px 14px; box-shadow:inset 0 0 0 1px rgba(40,90,110,.08); }
  .chRow.locked{ opacity:.55; }
  .chRow .chIco{ width:38px; height:38px; flex:none; display:flex; align-items:center; justify-content:center; font-size:21px; border-radius:11px; background:rgba(40,90,110,.08); }
  .chRow.earned .chIco{ background:linear-gradient(180deg,#fff0c2,#ffe08a); box-shadow:0 0 0 2px #ffce5a; }
  .chRow .chMeta{ flex:1; min-width:0; }
  .chRow .chN{ font-size:14px; font-weight:900; color:#2c5d72; }
  .chRow .chD{ font-size:11px; font-weight:600; color:#6a8a9a; margin-top:1px; }
  .chRow .chReward{ font-size:12px; font-weight:900; color:#b5860c; display:flex; align-items:center; gap:4px; white-space:nowrap; }
  .chRow.earned .chReward{ color:#37b24d; }
  .chRow .chState{ font-size:18px; font-weight:900; margin-left:4px; }
  .chRow.earned .chState{ color:#37b24d; }
  .chRow.locked .chState{ color:#aab8c0; }
  /* ===== challenge unlock notification (custom style) ===== */
  #challengeToast{
    position:fixed; top:22px; left:50%; transform:translateX(-50%) translateY(-160%);
    z-index:130; display:flex; align-items:stretch; gap:0; min-width:300px; max-width:92vw;
    border-radius:16px; overflow:hidden; pointer-events:none;
    background:linear-gradient(135deg,#102a39,#1c4a63); color:#eaf6fb;
    box-shadow:0 16px 40px rgba(8,30,45,.5), inset 0 0 0 1px rgba(126,217,89,.4);
    transition:transform .5s cubic-bezier(.16,1.2,.3,1), opacity .3s; opacity:0;
  }
  #challengeToast.show{ transform:translateX(-50%) translateY(0); opacity:1; }
  #challengeToast .ctBar{ width:7px; background:linear-gradient(180deg,#7ed957,#37b24d); }
  #challengeToast .ctIconWrap{ display:flex; align-items:center; justify-content:center; padding:0 4px 0 16px; }
  #challengeToast .ctIcon{ font-size:34px; line-height:1; filter:drop-shadow(0 2px 4px rgba(0,0,0,.35)); }
  #challengeToast .ctBody{ padding:13px 20px 13px 12px; display:flex; flex-direction:column; justify-content:center; }
  #challengeToast .ctTag{ font-size:9.5px; font-weight:900; letter-spacing:2.5px; color:#7ed957; display:flex; align-items:center; gap:6px; }
  #challengeToast .ctName{ font-size:17px; font-weight:900; letter-spacing:.4px; margin:2px 0; }
  #challengeToast .ctDesc{ font-size:11px; font-weight:600; color:#a9c8d6; }
  #challengeToast .ctCoins{ font-size:11px; font-weight:900; color:#ffd84d; margin-top:4px; display:flex; align-items:center; gap:4px; }
  /* shimmer sweep across the toast */
  #challengeToast::after{
    content:''; position:absolute; inset:0; pointer-events:none;
    background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.16) 48%,transparent 62%);
    transform:translateX(-120%); 
  }
  #challengeToast.show::after{ animation:ctSweep 1.1s ease .25s 1; }
  @keyframes ctSweep{ to{ transform:translateX(120%); } }
  #storeCoins{ font-size:18px; font-weight:900; color:#b5860c; background:rgba(255,255,255,.8); padding:8px 22px; border-radius:99px; margin-bottom:22px; box-shadow:0 4px 12px rgba(180,140,20,.2); }
  #storeGrid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:14px; width:100%; margin-bottom:22px; }
  .ballCard{
    background:linear-gradient(180deg,#ffffff,#eef6fb); border-radius:18px; padding:14px 12px 12px; text-align:center;
    box-shadow:0 8px 20px rgba(40,90,110,.16), inset 0 0 0 1px rgba(255,255,255,.7); position:relative; transition:transform .15s;
  }
  .ballCard:hover{ transform:translateY(-4px); }
  .ballCard canvas{ width:96px; height:96px; display:block; margin:0 auto 8px; }
  .ballCard .bName{ font-size:14px; font-weight:900; color:#27607c; }
  .ballCard .bTier{ font-size:9px; font-weight:900; letter-spacing:2px; margin:3px 0 8px; text-transform:uppercase; }
  .ballCard .bTier.basic{color:#8aa0ad;} .ballCard .bTier.color{color:#3f9e6a;}
  .ballCard .bTier.metal{color:#b08a2c;} .ballCard .bTier.gem{color:#c0398a;} .ballCard .bTier.crystal{color:#3aa0c8;}
  .ballCard .bBuy{
    width:100%; border:none; border-radius:99px; padding:9px; font-family:inherit; font-weight:900; font-size:13px;
    cursor:pointer; color:#6a4a08; background:linear-gradient(180deg,#ffe07a,#f0b020); box-shadow:0 4px 0 #c98208; transition:transform .1s;
  }
  .ballCard .bBuy:active{ transform:translateY(2px); box-shadow:0 2px 0 #c98208; }
  .ballCard .bBuy.owned{ background:linear-gradient(180deg,#cfe8f5,#a9d2e6); box-shadow:0 4px 0 #7ba6bd; color:#2c5d72; }
  .ballCard .bBuy.equipped{ background:linear-gradient(180deg,#9be88a,#4cc24c); box-shadow:0 4px 0 #2f8f2f; color:#fff; }
  .ballCard .bBuy.cant{ background:linear-gradient(180deg,#e6e6e6,#cfcfcf); box-shadow:0 4px 0 #aaa; color:#888; cursor:not-allowed; }
  .ballCard.locked-skin{ opacity:.96; }
  .ballCard .bPrice{ display:inline-flex; align-items:center; gap:4px; }
  /* coin gain toast */
  #coinToast{
    position:fixed; top:64px; right:18px; left:auto; transform:translateY(-12px) scale(.7);
    z-index:118; display:flex; align-items:center; gap:7px;
    background:linear-gradient(180deg,#fff6d8,#ffd86a);
    color:#8a5a06; border-radius:99px; padding:9px 18px; font-weight:900; font-size:16px;
    box-shadow:0 10px 26px rgba(150,110,0,.4), inset 0 0 0 2px rgba(255,255,255,.7), 0 0 0 1px rgba(180,130,10,.3);
    opacity:0; transition:transform .35s cubic-bezier(.18,1.5,.4,1), opacity .25s; pointer-events:none;
  }
  #coinToast .ctEmoji{ font-size:18px; filter:drop-shadow(0 1px 2px rgba(120,80,0,.4)); animation:coinSpin .5s ease; }
  @keyframes coinSpin{ 0%{ transform:rotateY(0) scale(1.4);} 100%{ transform:rotateY(360deg) scale(1);} }
  #coinToast.show{ transform:translateY(0) scale(1); opacity:1; }
  /* challenge unlock toast (in-game) */
  /* challenges panel on the course screen */
  #challengesPanel{
    z-index:2; width:min(960px,94vw); margin:0 auto 22px; background:rgba(255,255,255,.62);
    border-radius:18px; padding:14px 16px; box-shadow:0 6px 18px rgba(40,90,110,.14);
  }
  #challengesPanel .chHead{ display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
  #challengesPanel .chTitle{ font-size:12px; font-weight:900; letter-spacing:3px; color:#3c7a96; }
  #challengesPanel .chCount{ font-size:12px; font-weight:900; color:#37b24d; }
  #challengesGrid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:8px; }
  .chItem{ display:flex; gap:9px; align-items:center; background:rgba(255,255,255,.7); border-radius:11px; padding:8px 10px; box-shadow:inset 0 0 0 1px rgba(40,90,110,.1); }
  .chItem.locked{ opacity:.5; filter:grayscale(.7); }
  .chItem .chIcon{ font-size:22px; line-height:1; }
  .chItem.locked .chIcon{ filter:grayscale(1) brightness(.8); }
  .chItem .chName{ font-size:12px; font-weight:900; color:#2c5d72; line-height:1.1; }
  .chItem .chDesc{ font-size:9.5px; font-weight:700; color:#6a8a9a; line-height:1.15; margin-top:2px; }
  .chItem.earned{ box-shadow:inset 0 0 0 2px #7ed957; background:linear-gradient(180deg,#f3fff0,#e4fbe0); }
  .chItem .chTick{ margin-left:auto; color:#37b24d; font-weight:900; font-size:14px; }
  /* per-card progress indicator */
  .cpProgress{ width:100%; margin-top:8px; }
  .cpProgress .cpBar{ height:7px; border-radius:99px; background:rgba(40,90,110,.18); overflow:hidden; }
  .cpProgress .cpFill{ height:100%; border-radius:99px; background:linear-gradient(90deg,#7ed957,#37b24d); width:0%; transition:width .5s ease; }
  .cpProgress .cpLabel{ font-size:10.5px; font-weight:900; letter-spacing:.6px; color:#557; margin-top:3px; text-align:center; }
  /* overall stats report banner above the cards */
  #statsReport{
    z-index:2; display:flex; gap:0; flex-wrap:wrap; justify-content:center; margin-bottom:22px;
    background:rgba(255,255,255,.7); border-radius:18px; padding:14px 10px;
    box-shadow:0 6px 18px rgba(40,90,110,.16), inset 0 0 0 1px rgba(255,255,255,.6); backdrop-filter:blur(4px);
  }
  #statsReport .srItem{ display:flex; flex-direction:column; align-items:center; padding:2px 22px; border-right:1px solid rgba(40,90,110,.14); }
  #statsReport .srItem:last-child{ border-right:none; }
  #statsReport .srVal{ font-size:24px; font-weight:900; color:#27607c; line-height:1; }
  #statsReport .srKey{ font-size:10px; font-weight:900; letter-spacing:1.4px; color:#6a8a9a; margin-top:5px; }
  #statsReport .srTitle{ width:100%; text-align:center; font-size:12px; font-weight:900; letter-spacing:3px; color:#3c7a96; margin-bottom:10px; }
  /* locked course: big red X overlay */
  .courseCard{ position:relative; }
  .lockX{ position:absolute; inset:0; display:none; align-items:center; justify-content:center; z-index:6; pointer-events:none; }
  .courseCard.locked .lockX{ display:flex; }
  .lockX svg{ width:84px; height:84px; filter:drop-shadow(0 3px 6px rgba(120,0,0,.5)); }
  /* unlock reveal: the red X shatters and flies off, the card pops and glows */
  .lockX.lockBreak{ display:flex !important; animation:xBreak .9s cubic-bezier(.5,-0.4,.7,1) forwards; }
  @keyframes xBreak{
    0%{ transform:scale(1) rotate(0); opacity:1; }
    18%{ transform:scale(1.28) rotate(-8deg); opacity:1; }
    30%{ transform:scale(1.18) rotate(5deg); }
    100%{ transform:scale(.4) rotate(40deg) translateY(60px); opacity:0; }
  }
  .courseCard.unlockPop{ animation:cardUnlock 1.0s ease-out; z-index:8; }
  @keyframes cardUnlock{
    0%{ transform:scale(1); filter:saturate(.6) brightness(.96); box-shadow:0 12px 30px rgba(10,40,60,.3); }
    14%{ transform:translateX(-6px) scale(1.01); }
    24%{ transform:translateX(6px) scale(1.02); }
    34%{ transform:translateX(-4px); }
    44%{ transform:translateX(4px); }
    52%{ transform:translateX(0) scale(1.06); filter:saturate(1.1) brightness(1.06); box-shadow:0 0 0 3px rgba(126,217,89,.7), 0 0 40px rgba(126,217,89,.7), 0 20px 44px rgba(10,40,60,.4); }
    100%{ transform:scale(1); filter:saturate(1) brightness(1); box-shadow:0 14px 34px rgba(10,40,60,.34); }
  }
  .lockBadge.lockBadgeBreak{ animation:badgePop .5s ease forwards; }
  @keyframes badgePop{
    0%{ transform:scale(1); opacity:1; }
    40%{ transform:scale(1.15); opacity:1; background:#bdf0c4; color:#1d6b3a; }
    100%{ transform:scale(.6) translateY(14px); opacity:0; }
  }
  .lockBadge{ font-size:12px; font-weight:900; letter-spacing:1px; color:#7c5a27; background:#ffe9b0; border-radius:999px; padding:5px 13px; }
  /* richer course preview: an SVG mini-map of the real course character */
  .cpArt{ width:100%; height:118px; border-radius:12px; overflow:hidden; display:block;
          box-shadow:inset 0 -2px 6px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.35); }
  .courseCard.locked .cpArt{ filter:saturate(.5) brightness(.92); }
  /* difficulty meter */
  .cpDiff{ display:flex; align-items:center; gap:7px; margin-top:2px; font-size:10px;
           font-weight:900; letter-spacing:1.4px; color:#7a8d7c; }
  .cpDiffDots{ display:flex; gap:3px; }
  .cpDiffDots i{ width:9px; height:9px; border-radius:50%; background:#d3ddd4; display:block;
                 box-shadow:inset 0 1px 1px rgba(0,0,0,.15); }
  .cpDiffDots i.on.easy{ background:#5bc46a; } .cpDiffDots i.on.med{ background:#f0a818; }
  .cpDiffDots i.on.hard{ background:#e8623a; }
  .cpDiffLabel{ color:#5a6d5c; }
  /* ===== TOUR COMPLETE CELEBRATION ===== */
  #tourCelebrate{
    position:absolute; inset:0; z-index:60; display:none; align-items:center; justify-content:center;
    overflow:hidden;
    background:radial-gradient(120% 100% at 50% 30%, #ffe9a8 0%, #ffcf5c 38%, #f5a93c 72%, #d97a1f 100%);
  }
  #tourCelebrate.show{ display:flex; animation:tcFade .5s ease; }
  @keyframes tcFade{ from{opacity:0;} to{opacity:1;} }
  #tcBox{ position:relative; z-index:3; text-align:center; padding:30px 34px; max-width:min(440px,90vw); }
  #tcTrophy{ font-size:96px; line-height:1; filter:drop-shadow(0 8px 18px rgba(120,60,0,.45));
    animation:tcTrophyIn .8s cubic-bezier(.2,1.4,.5,1) both; }
  @keyframes tcTrophyIn{ 0%{ transform:scale(0) rotate(-30deg); opacity:0; } 60%{ transform:scale(1.2) rotate(8deg); } 100%{ transform:scale(1) rotate(0); opacity:1; } }
  #tcEyebrow{ margin-top:12px; font-size:13px; font-weight:900; letter-spacing:5px; color:#7a4a10; opacity:0; animation:tcUp .5s ease .3s forwards; }
  #tcName{ font-size:40px; font-weight:900; letter-spacing:3px; color:#fff; margin:4px 0 2px;
    text-shadow:0 2px 0 rgba(150,80,0,.4), 0 8px 22px rgba(120,60,0,.4); opacity:0; animation:tcUp .5s ease .42s forwards; }
  #tcTagline{ font-size:14px; font-weight:700; font-style:italic; color:#8a5414; opacity:0; animation:tcUp .5s ease .54s forwards; }
  #tcStars{ margin:16px 0 10px; display:flex; gap:14px; justify-content:center; }
  #tcStars span{ font-size:38px; color:#fff5d0; text-shadow:0 2px 8px rgba(150,90,0,.5); transform:scale(0); display:inline-block; }
  #tcStars span:nth-child(1){ animation:tcStar .5s cubic-bezier(.2,1.6,.5,1) .7s forwards; }
  #tcStars span:nth-child(2){ animation:tcStar .5s cubic-bezier(.2,1.6,.5,1) .88s forwards; }
  #tcStars span:nth-child(3){ animation:tcStar .5s cubic-bezier(.2,1.6,.5,1) 1.06s forwards; }
  @keyframes tcStar{ 0%{ transform:scale(0) rotate(-40deg);} 70%{ transform:scale(1.3) rotate(10deg);} 100%{ transform:scale(1) rotate(0);} }
  #tcMsg{ font-size:14px; font-weight:600; color:#6e4410; line-height:1.5; margin-bottom:22px; opacity:0; animation:tcUp .5s ease 1.2s forwards; }
  #tcContinue{ opacity:0; animation:tcUp .5s ease 1.45s forwards; }
  @keyframes tcUp{ from{ opacity:0; transform:translateY(14px);} to{ opacity:1; transform:translateY(0);} }
  #tcConfetti{ position:absolute; inset:0; z-index:1; pointer-events:none; overflow:hidden; }
  .tcDot{ position:absolute; top:-20px; width:11px; height:14px; border-radius:2px; opacity:.95; animation:tcFall linear forwards; }
  @keyframes tcFall{ to{ transform:translateY(120vh) rotate(720deg); } }
  #settingsScreen{
    position:absolute; inset:0; z-index:50; display:none;
    background:rgba(20,40,55,.45); -webkit-backdrop-filter:blur(4px); backdrop-filter:blur(4px);
    align-items:center; justify-content:center;
  }
  #settingsBox{
    background:linear-gradient(180deg,#ffffff,#eef7fb);
    border-radius:20px; padding:26px 32px; width:min(360px,86%);
    box-shadow:0 14px 40px rgba(10,30,50,.4), inset 0 1px 0 #fff;
    display:flex; flex-direction:column; gap:15px;
  }
  #settingsBox h2{ font-weight:900; letter-spacing:3px; color:#27607c; text-align:center; }
  #settingsBox label{ display:flex; flex-direction:column; gap:5px; font-size:11px; font-weight:900; letter-spacing:1.6px; color:#557; }
  #settingsBox input[type=range]{ accent-color:#f0a818; }
  #settingsBox select{ font-family:inherit; font-weight:800; padding:7px; border-radius:9px; border:2px solid #cfe3ee; }
  /* controls reference screen */
  #controlsScreen{
    position:absolute; inset:0; z-index:51; display:none;
    background:rgba(20,40,55,.45); -webkit-backdrop-filter:blur(4px); backdrop-filter:blur(4px);
    align-items:center; justify-content:center;
  }
  #controlsBox{
    background:linear-gradient(180deg,#ffffff,#eef7fb);
    border-radius:20px; padding:24px 28px; width:min(380px,88%); max-height:88vh; overflow-y:auto;
    box-shadow:0 14px 40px rgba(10,30,50,.4), inset 0 1px 0 #fff;
    display:flex; flex-direction:column; gap:4px;
  }
  #controlsBox h2{ font-weight:900; letter-spacing:3px; color:#27607c; text-align:center; margin-bottom:8px; }
  .ctlSection{ font-size:10px; font-weight:900; letter-spacing:2px; color:#3a8aac; margin:14px 0 6px;
    border-bottom:2px solid #e0eef4; padding-bottom:5px; }
  .ctlRow{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:5px 0; }
  .ctlAct{ font-size:13px; font-weight:700; color:#33485a; }
  .ctlKey{ display:flex; gap:5px; align-items:center; font-size:12px; font-weight:700; color:#5a7488; flex-shrink:0; }
  .ctlKey kbd{ font-family:inherit; font-size:12px; font-weight:800; color:#27607c; background:#fff;
    border:1.5px solid #cfe3ee; border-bottom-width:3px; border-radius:6px; padding:2px 8px; min-width:14px; text-align:center; }
  #controlsBox .menuBtn{ margin-top:16px; }
  /* hole intro card */
  #holeIntro{
    position:absolute; left:50%; top:34%; transform:translate(-50%,-50%) scale(.8);
    z-index:18; text-align:center; opacity:0; pointer-events:none;
    transition:opacity .5s ease, transform .6s cubic-bezier(.2,1.3,.4,1);
  }
  #holeIntro.show{ opacity:1; transform:translate(-50%,-50%) scale(1); }
  #hiName{ font-size:42px; font-weight:900; letter-spacing:3px; color:#fff;
    text-shadow:0 3px 0 rgba(30,80,40,.55), 0 8px 22px rgba(10,40,20,.5); }
  #hiPar{ font-size:16px; font-weight:900; letter-spacing:4px; color:#ffe24d;
    text-shadow:0 2px 6px rgba(10,40,20,.6); margin-top:4px; }
  #controlsNote{
    margin-top:10px; text-align:center; display:none; gap:10px; justify-content:center; align-items:center;
  }
  #retryBtn{
    font-family:inherit; font-weight:900; font-size:14px; letter-spacing:.5px; cursor:pointer;
    color:#28502f; background:linear-gradient(180deg,#ffffff,#e8f3e6); border:none;
    border-radius:99px; padding:9px 20px; display:inline-flex; align-items:center; gap:9px;
    box-shadow:0 4px 0 rgba(20,60,30,.28), 0 8px 16px rgba(20,60,30,.18); transition:transform .1s;
  }
  #retryBtn:hover{ transform:translateY(-1px); }
  #retryBtn:active{ transform:translateY(3px); box-shadow:0 1px 0 rgba(20,60,30,.28); }
  #retryBtn .retryKey{ background:#28502f; color:#fff; border-radius:6px; padding:1px 8px; font-size:11px; font-weight:900; }
  #skipHoleBtn{
    font-family:inherit; font-weight:900; font-size:13px; letter-spacing:.5px; cursor:pointer;
    color:#5a3d00; background:linear-gradient(180deg,#ffe27a,#ffce3d); border:none;
    border-radius:99px; padding:9px 18px; display:inline-flex; align-items:center; gap:7px;
    box-shadow:0 4px 0 rgba(150,110,10,.32), 0 8px 16px rgba(180,130,20,.2); transition:transform .1s;
  }
  #skipHoleBtn:hover{ transform:translateY(-1px); }
  #skipHoleBtn:active{ transform:translateY(3px); box-shadow:0 1px 0 rgba(150,110,10,.32); }
  #menuBtnHud{
    font-family:inherit; font-weight:800; font-size:12.5px; letter-spacing:.5px; cursor:pointer;
    color:#3a5f6e; background:rgba(255,255,255,.7); border:none; border-radius:99px; padding:8px 16px;
    box-shadow:0 3px 0 rgba(40,90,110,.22); transition:transform .1s;
  }
  #menuBtnHud:hover{ transform:translateY(-1px); }
  #menuBtnHud:active{ transform:translateY(2px); box-shadow:0 1px 0 rgba(40,90,110,.22); }
  kbd{background:#fff; border-radius:6px; padding:1px 6px; box-shadow:0 2px 0 rgba(20,60,30,.25); font-family:inherit; font-size:10.5px;}
  @media (max-width:700px){ .chip{font-size:11px; padding:5px 9px;} #banner{font-size:32px;} #minimap{display:none;} }
</style>
</head>
<body>
<div id="challengeToast">
  <div class="ctBar"></div>
  <div class="ctIconWrap"><div class="ctIcon" id="ctIcon">🏆</div></div>
  <div class="ctBody">
    <div class="ctTag">★ CHALLENGE COMPLETE</div>
    <div class="ctName" id="ctName">—</div>
    <div class="ctDesc" id="ctDesc">—</div>
    <div class="ctCoins" id="ctCoins"><svg class="coinIco" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="#ffd84d" stroke="#e0a83c" stroke-width="1.4"/><path d="M12 7.5l1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4z" fill="#e0a83c"/></svg> +0</div>
  </div>
</div>
<div id="coinToast"><span class="ctEmoji"><svg class="coinIco" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="#ffd84d" stroke="#e0a83c" stroke-width="1.4"/><path d="M12 7.5l1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4z" fill="#e0a83c"/></svg></span> <span id="coinToastVal">+0</span></div>
<div id="stage">
  <div id="gameWrap">
    <canvas id="game" width="960" height="600"></canvas>
    <!-- multiplayer turn HUD: whose shot, 25s clock, mini scoreboard -->
    <div id="mpHud">
      <div id="mpTurn"><span class="mpDot"></span><span id="mpTurnName">Player 1</span><span>·</span><span id="mpClock">25</span>s</div>
    </div>
    <div id="mpBoard"></div>
    <!-- skins pot: shows the current hole's pot value, grows on carryover -->
    <div id="skinPot">
      <div id="skinPotInner">
        <div id="skinPotLabel">SKINS POT</div>
        <div id="skinPotVal">1</div>
        <div id="skinPotCarry">CARRYOVER</div>
      </div>
    </div>
    <!-- dramatic hole-result reveal for skins -->
    <div id="skinReveal">
      <div id="skinRevealCard">
        <div id="skinRevealIcon">🏆</div>
        <div id="skinRevealTitle">BEN WINS THE HOLE</div>
        <div id="skinRevealSub">+2 skins</div>
      </div>
    </div>
    <canvas id="minimap" width="150" height="96"></canvas>

    <button id="fsBtn" title="Fullscreen (F)" style="position:absolute;bottom:10px;right:10px;z-index:40;
      width:34px;height:34px;display:flex;align-items:center;justify-content:center;
      background:rgba(20,30,24,.7);color:#cfe8d4;border:1px solid rgba(120,180,120,.4);
      border-radius:8px;cursor:pointer;font-size:16px;line-height:1;padding:0;" aria-label="Toggle fullscreen">⛶</button>

    <div id="hud">
      <div class="hudGroup">
        <div class="chip"><small>Hole</small><b id="holeVal">1</b><small>· Par</small><b id="parVal">4</b></div>
        <div class="chip"><small>Strokes</small><b id="strokeVal">0</b></div>
        <div class="chip" id="scoreChip"><small>Round</small><b id="scoreVal">E</b></div>
        <div class="chip" id="streakChip">🔥<b id="streakVal">x2</b></div>
      </div>
    </div>

    <!-- READ GREEN: toggles the free-look putting camera; shows only while putting -->
    <button id="greenCamBtn" style="display:none">🔍 READ GREEN</button>
    <!-- directional pad shown while reading the green -->
    <div id="greenReadHud" style="display:none">
      <div class="grPadLabel">LOOK AROUND</div>
      <div class="grPad">
        <button class="grBtn grUp" data-dir="up">▲</button>
        <button class="grBtn grLeft" data-dir="left">◀</button>
        <button class="grBtn grRight" data-dir="right">▶</button>
        <button class="grBtn grDown" data-dir="down">▼</button>
      </div>
      <div class="grZoom">
        <button class="grBtn" data-dir="in">＋</button>
        <button class="grBtn" data-dir="out">－</button>
      </div>
    </div>

    <div id="readout">
      <div class="ro" id="distReadout">
        <svg viewBox="0 0 24 24" class="roIcon" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="2.4" fill="currentColor"/></svg>
        <div class="roText"><b id="distVal">—</b><small>to pin</small></div>
      </div>
      <div class="ro" id="elevReadout">
        <span class="roIcon" id="elevArrow">↑</span>
        <div class="roText"><b id="elevVal">FLAT</b><small>green</small></div>
      </div>
      <div class="ro" id="windReadout">
        <svg viewBox="0 0 24 24" class="roIcon" id="windArrow" aria-hidden="true"><path d="M4 12h13M11 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div class="roText"><b id="windVal">—</b><small id="windUnit">mph</small></div>
      </div>
    </div>

    <div id="bottomLeft">
      <div id="clubChip"><small>CLUB · AUTO</small><span id="clubName">DRIVER</span></div>
    </div>

    <!-- DRIVING RANGE UI (shown only in range mode) -->
    <div id="rangePanel">
      <div id="rangeClubs"></div>
      <div id="rangeReadout"><span id="rrCarry">—</span><small>last carry</small></div>
    </div>

    <div id="spinChip">
      <span class="sdEnd">TOP</span>
      <div id="spinTrack">
        <div id="spinFill"></div>
        <div id="spinDetent"></div>
        <div id="spinKnob"></div>
      </div>
      <span class="sdEnd">BACK</span>
      <div id="spinMeta"><span class="sdName">SPIN</span><span id="spinVal">NEUTRAL</span></div>
    </div>

    <div id="hint">Aim with ◀ ▶ · SPACE to swing</div>

    <div id="meters">
      <div class="meterLabel" id="meterLabel">POWER</div>
      <div class="meterTrack" id="powerTrack"><div id="powerFill"></div><div id="sweetTick"></div></div>
      <div id="accArcWrap">
        <svg id="accArc" viewBox="0 0 330 64" preserveAspectRatio="none">
          <!-- colored zone arcs (built in JS) sit under the track outline -->
          <g id="accArcZones"></g>
          <!-- the swinging marker rides along the arc -->
          <g id="accArcMarker"><circle id="accDot" r="7"/></g>
        </svg>
      </div>
    </div>

    <div id="banner"></div>
    <div id="eruptCue" style="display:none; position:absolute; top:14px; left:50%; transform:translateX(-50%);
         z-index:7; align-items:center; gap:6px; padding:7px 16px; border-radius:999px;
         background:rgba(20,10,8,.62); -webkit-backdrop-filter:blur(7px); backdrop-filter:blur(7px);
         border:1px solid rgba(255,140,60,.4); font-weight:800; font-size:13px; letter-spacing:.6px;
         color:#ffb03a; text-shadow:0 1px 4px rgba(0,0,0,.6);"></div>

    <div id="endCard">
      <div class="card">
        <div class="cardEyebrow" id="cardEyebrow">HOLE 1 · PAR 4</div>
        <h2 id="endTitle">Par!</h2>
        <div class="sub" id="endSub"></div>
        <div id="scorecard"></div>
        <div class="statRow">
          <div class="stat"><small>Round</small><b id="roundVal">E</b></div>
          <div class="stat"><small>Best round</small><b id="bestRoundVal">—</b></div>
          <div class="stat"><small>Birdie streak</small><b id="birdieStreakVal">0</b></div>
          <div class="stat"><small>Best streak</small><b id="streakBestVal">0</b></div>
        </div>
        <div id="nextHoleRow">NEXT&nbsp;·&nbsp;<b id="nextHoleInfo"></b></div>
        <button id="againBtn">Next hole ⛳</button>
      </div>
    </div>
  </div>
  <!-- ============== MAIN MENU ============== -->
  <div id="menuScreen">
    <!-- cohesive illustrated course scene: a proper preview of the game -->
    <svg id="menuScene" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMax slice">
      <defs>
        <linearGradient id="msSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#9fd9f6"/><stop offset=".5" stop-color="#c3e8fb"/><stop offset="1" stop-color="#e6f7ff"/></linearGradient>
        <linearGradient id="msFair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#7fcc6a"/><stop offset="1" stop-color="#5bb054"/></linearGradient>
        <linearGradient id="msFairLight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#a6e08f"/><stop offset="1" stop-color="#8bd072"/></linearGradient>
        <radialGradient id="msSun" cx=".5" cy=".5" r=".5">
          <stop offset="0" stop-color="#fff8d8"/><stop offset="1" stop-color="#fff8d8" stop-opacity="0"/></radialGradient>
        <linearGradient id="msWater" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#6cc4ee"/><stop offset="1" stop-color="#4aa6dd"/></linearGradient>
      </defs>
      <!-- sky + soft sun -->
      <rect width="1200" height="700" fill="url(#msSky)"/>
      <circle cx="980" cy="150" r="180" fill="url(#msSun)"/>
      <circle cx="980" cy="150" r="52" fill="#fff4c2"/>
      <!-- distant rolling hills -->
      <ellipse cx="250" cy="430" rx="430" ry="150" fill="#bfe7ad" opacity=".7"/>
      <ellipse cx="900" cy="440" rx="480" ry="160" fill="#b2e0a0" opacity=".7"/>
      <ellipse cx="560" cy="470" rx="520" ry="150" fill="#a4d893" opacity=".8"/>
      <!-- main turf -->
      <ellipse cx="600" cy="760" rx="820" ry="330" fill="url(#msFair)"/>
      <!-- fairway corridor sweeping back to a distant green -->
      <path id="msFairway" d="M-40 720 C 240 620, 360 560, 560 520 S 880 470, 1060 452"
            stroke="url(#msFairLight)" stroke-width="150" fill="none" stroke-linecap="round"/>
      <path d="M-40 720 C 240 620, 360 560, 560 520 S 880 470, 1060 452"
            stroke="#bdeaa9" stroke-width="74" fill="none" stroke-linecap="round" opacity=".85"/>
      <!-- mowing stripes on the fairway -->
      <g opacity=".18" stroke="#3f9a44" stroke-width="2">
        <path d="M120 700 C 320 612, 420 560, 600 524" fill="none"/>
        <path d="M180 718 C 360 632, 470 582, 660 540" fill="none"/>
      </g>
      <!-- pond beside the fairway -->
      <ellipse cx="330" cy="612" rx="120" ry="40" fill="url(#msWater)"/>
      <ellipse cx="330" cy="600" rx="120" ry="40" fill="#8fd6f4" opacity=".5"/>
      <path d="M250 604 q14 -8 28 0 t28 0 t28 0 t28 0" stroke="#eafaff" stroke-width="3" fill="none" opacity=".7"/>
      <!-- bunker -->
      <ellipse cx="760" cy="540" rx="70" ry="24" fill="#efd9a0"/>
      <ellipse cx="760" cy="536" rx="70" ry="24" fill="#f6e6bb" opacity=".6"/>
      <!-- right cherry tree set back on the distant hill, clear of the green -->
      <g id="msTreeR">
        <path d="M1150 446 q8 -44 -2 -104" stroke="#7a5446" stroke-width="13" fill="none" stroke-linecap="round"/>
        <g class="msCanopy">
          <circle cx="1148" cy="330" r="46" fill="#f9b9d6"/>
          <circle cx="1186" cy="350" r="31" fill="#f7add0"/>
          <circle cx="1114" cy="350" r="32" fill="#fcc6de"/>
          <circle cx="1148" cy="304" r="32" fill="#ffd2e6"/>
        </g>
      </g>
      <!-- the distant green with the pin -->
      <ellipse cx="1020" cy="450" rx="90" ry="36" fill="#86dd6c"/>
      <ellipse cx="1020" cy="448" rx="90" ry="36" fill="#9ce884" opacity=".5"/>
      <circle cx="1034" cy="450" r="5" fill="#26521f"/>
      <line x1="1034" y1="450" x2="1034" y2="372" stroke="#d8d2c4" stroke-width="3"/>
      <path id="msFlag" d="M1034 372 L1086 386 L1034 400 Z" fill="#e23b3b"/>
      <!-- a teed-up ball in the foreground (where the player stands) -->
      <g id="msBall">
        <ellipse cx="208" cy="652" rx="26" ry="7" fill="#3f8a3f" opacity=".35"/>
        <circle cx="208" cy="628" r="22" fill="#fbfdfe"/>
        <circle cx="208" cy="628" r="22" fill="none" stroke="#cdd6dc" stroke-width="1"/>
        <circle cx="201" cy="621" r="7" fill="#fff"/>
        <g fill="#dfe6ec"><circle cx="214" cy="624" r="2.2"/><circle cx="212" cy="634" r="2.2"/><circle cx="204" cy="636" r="2.2"/><circle cx="218" cy="632" r="1.8"/></g>
        <rect x="206" y="650" width="4" height="12" rx="2" fill="#e8e2d0"/>
      </g>
      <!-- cherry blossom trees rooted in the turf, framing the scene -->
      <g id="msTreeL">
        <path d="M150 560 q-10 -70 4 -150" stroke="#7a5446" stroke-width="22" fill="none" stroke-linecap="round"/>
        <path d="M158 470 q24 -16 56 -14 M150 430 q-26 -8 -52 6" stroke="#7a5446" stroke-width="12" fill="none" stroke-linecap="round"/>
        <g class="msCanopy">
          <circle cx="150" cy="380" r="78" fill="#f9b9d6"/>
          <circle cx="92" cy="410" r="52" fill="#f7add0"/>
          <circle cx="214" cy="408" r="56" fill="#fcc6de"/>
          <circle cx="150" cy="338" r="56" fill="#ffd2e6"/>
        </g>
      </g>
    </svg>
    <canvas id="petalCanvas"></canvas>
    <div id="menuLogo">
      <div id="logoTop">BIRDIE</div>
      <div id="logoBottom">BLITZ</div>
    </div>
    <div id="menuButtons">
      <button class="menuBtn" id="playBtn"><svg class="btnIco" viewBox="0 0 24 24" fill="none"><path d="M7 21 V3" stroke="#1d6b3a" stroke-width="2.4" stroke-linecap="round"/><path d="M7 3.5 L18 7 L7 10.5 Z" fill="#e8554e"/></svg>PLAY GAME</button>
      <button class="menuBtn" id="multiBtn"><svg class="btnIco" viewBox="0 0 24 24" fill="none"><circle cx="8.5" cy="8" r="3.2" fill="#1d6b3a"/><circle cx="16" cy="9" r="2.6" fill="#e8554e"/><path d="M3 19c0-3 2.4-5 5.5-5s5.5 2 5.5 5" stroke="#1d6b3a" stroke-width="2.2" stroke-linecap="round" fill="none"/><path d="M14.5 18.5c.3-2.4 2.2-4 4.5-4 2.2 0 3.8 1.6 4 4" stroke="#e8554e" stroke-width="2" stroke-linecap="round" fill="none"/></svg>MULTIPLAYER</button>
      <button class="menuBtn alt" id="settingsBtn"><svg class="btnIco" viewBox="0 0 24 24" fill="none"><path d="M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" stroke="#3a7d9c" stroke-width="2"/><path d="M12 2.5l1.4 2.7 3-.5.6 3 2.7 1.4-1.4 2.7 1.4 2.7-2.7 1.4-.6 3-3-.5L12 21.5l-1.4-2.7-3 .5-.6-3-2.7-1.4 1.4-2.7-1.4-2.7 2.7-1.4.6-3 3 .5L12 2.5z" stroke="#3a7d9c" stroke-width="1.6" stroke-linejoin="round" opacity=".55"/></svg>SETTINGS</button>
    </div>
  </div>

  <!-- ============== COURSE SELECT ============== -->
  <div id="tourScreen">
    <svg class="csBgShared" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="tsSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#bfe7fb"/><stop offset=".55" stop-color="#d6f0ff"/><stop offset="1" stop-color="#e9fbff"/></linearGradient>
        <linearGradient id="tsGrass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#86cf72"/><stop offset="1" stop-color="#5aa84e"/></linearGradient>
        <radialGradient id="tsSun" cx=".5" cy=".5" r=".5">
          <stop offset="0" stop-color="#fff8e0" stop-opacity=".9"/><stop offset="1" stop-color="#fff8e0" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="1200" height="700" fill="url(#tsSky)"/>
      <circle cx="930" cy="150" r="150" fill="url(#tsSun)"/>
      <ellipse cx="240" cy="330" rx="360" ry="120" fill="#a9dd9a" opacity=".5"/>
      <ellipse cx="960" cy="340" rx="420" ry="130" fill="#9fd790" opacity=".45"/>
      <ellipse cx="600" cy="760" rx="900" ry="430" fill="url(#tsGrass)"/>
      <path d="M120 700 C 320 600, 360 470, 560 430 S 880 400, 1020 320" stroke="#7cc063" stroke-width="120" fill="none" stroke-linecap="round" opacity=".5"/>
      <ellipse cx="1010" cy="316" rx="70" ry="30" fill="#76cc60"/>
      <line x1="1010" y1="316" x2="1010" y2="276" stroke="#fff" stroke-width="2.4"/>
      <path d="M1010 276 L1030 282 L1010 288 Z" fill="#e23b3b"/>
    </svg>
    <div id="csVignette"></div>
    <h2>GOLF TOURS</h2>
    <div class="csSub">Pick your tour</div>
    <div id="tourCards"></div>
    <div id="csButtons">
      <button class="csBtn rangeBtn" id="rangeBtnT"><span class="csIcon"><svg viewBox="0 0 24 24" fill="none"><path d="M16 3 L9 16" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="M16 3 q3 1 1 4" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none"/><circle cx="7" cy="19" r="2.6" fill="#fff"/></svg></span><span>RANGE</span></button>
      <button class="csBtn statsBtn" id="statsBtnT"><span class="csIcon"><svg viewBox="0 0 24 24" fill="none"><rect x="4" y="13" width="3.6" height="7" rx="1" fill="#15455f"/><rect x="10.2" y="8" width="3.6" height="12" rx="1" fill="#15455f"/><rect x="16.4" y="4" width="3.6" height="16" rx="1" fill="#15455f"/></svg></span><span>STATS</span></button>
      <button class="csBtn shopBtn" id="storeBtnT"><span class="csIcon"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="#ffe27a" stroke="#fff" stroke-width="1.6"/><path d="M12 7.5l1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4z" fill="#e0a83c"/></svg></span><span>SHOP</span></button>
    </div>
    <button class="menuBtn alt" id="tourBackBtn" style="position:relative; z-index:3; margin-top:14px;">← BACK</button>
  </div>

  <div id="courseScreen">
    <svg id="csBg" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="csSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#bfe7fb"/><stop offset=".55" stop-color="#d6f0ff"/><stop offset="1" stop-color="#e9fbff"/></linearGradient>
        <linearGradient id="csGrass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#86cf72"/><stop offset="1" stop-color="#5aa84e"/></linearGradient>
        <linearGradient id="csFair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#a9e296"/><stop offset="1" stop-color="#8ace74"/></linearGradient>
        <radialGradient id="csSun" cx=".5" cy=".5" r=".5">
          <stop offset="0" stop-color="#fff8e0" stop-opacity=".9"/><stop offset="1" stop-color="#fff8e0" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="1200" height="700" fill="url(#csSky)"/>
      <circle cx="930" cy="150" r="150" fill="url(#csSun)"/>
      <!-- distant hills -->
      <ellipse cx="240" cy="330" rx="360" ry="120" fill="#a9dd9a" opacity=".5"/>
      <ellipse cx="960" cy="340" rx="420" ry="130" fill="#9fd790" opacity=".45"/>
      <!-- rolling course ground -->
      <ellipse cx="600" cy="760" rx="900" ry="430" fill="url(#csGrass)"/>
      <!-- sweeping fairway corridor curving to a distant green -->
      <path d="M120 700 C 320 600, 360 470, 560 430 S 880 400, 1020 320" stroke="#7cc063" stroke-width="120" fill="none" stroke-linecap="round" opacity=".55"/>
      <path d="M120 700 C 320 600, 360 470, 560 430 S 880 400, 1020 320" stroke="url(#csFair)" stroke-width="74" fill="none" stroke-linecap="round"/>
      <!-- mowing stripes hint -->
      <path d="M120 700 C 320 600, 360 470, 560 430 S 880 400, 1020 320" stroke="rgba(255,255,255,.10)" stroke-width="74" fill="none" stroke-linecap="round" stroke-dasharray="34 30"/>
      <!-- pond -->
      <ellipse cx="330" cy="560" rx="120" ry="46" fill="#5db4e6" opacity=".9"/>
      <ellipse cx="330" cy="552" rx="120" ry="46" fill="#7fcdf2" opacity=".55"/>
      <!-- bunker -->
      <ellipse cx="690" cy="470" rx="56" ry="24" fill="#efd9a0"/>
      <!-- far green + flag -->
      <ellipse cx="1010" cy="316" rx="70" ry="30" fill="#76cc60"/>
      <circle cx="1010" cy="316" r="3" fill="#234a23"/>
      <line x1="1010" y1="316" x2="1010" y2="276" stroke="#fff" stroke-width="2.4"/>
      <path d="M1010 276 L1030 282 L1010 288 Z" fill="#e23b3b"/>
      <!-- cherry-blossom trees flanking the scene -->
      <g>
        <rect x="156" y="430" width="14" height="64" rx="5" fill="#7a5a48"/>
        <circle cx="163" cy="420" r="58" fill="#f7b8d6"/><circle cx="120" cy="440" r="40" fill="#f9c8e0"/><circle cx="206" cy="438" r="44" fill="#fcd3e6"/>
      </g>
      <g>
        <rect x="1040" y="470" width="16" height="70" rx="5" fill="#7a5a48"/>
        <circle cx="1048" cy="458" r="64" fill="#f7b8d6"/><circle cx="1098" cy="480" r="44" fill="#f9c8e0"/><circle cx="996" cy="480" r="46" fill="#fcd3e6"/>
      </g>
    </svg>
    <div id="csVignette"></div>
    <canvas id="csPetals"></canvas>
    <button class="csTopBack" id="csTopBack" aria-label="Back to tours">← BACK</button>
    <h2 id="csHeading">SELECT COURSE</h2>
    <div class="csSub" id="csSubHeading">Choose your links</div>
    <div id="courseCards">
      <div class="courseCard open" id="course1">
        <svg class="cpArt" viewBox="0 0 200 118" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="skSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#bfe7fb"/><stop offset="1" stop-color="#eaf7ff"/></linearGradient>
            <linearGradient id="skGrass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#7cc86a"/><stop offset="1" stop-color="#5fb054"/></linearGradient>
          </defs>
          <rect width="200" height="118" fill="url(#skSky)"/>
          <ellipse cx="100" cy="120" rx="150" ry="78" fill="url(#skGrass)"/>
          <!-- soft hills -->
          <ellipse cx="40" cy="46" rx="46" ry="20" fill="#9bd98c" opacity=".55"/>
          <ellipse cx="160" cy="42" rx="50" ry="22" fill="#9bd98c" opacity=".5"/>
          <!-- fairway corridor curving to the green -->
          <path d="M20 112 C 60 96, 70 78, 110 66 S 168 52, 182 40" stroke="#a9e09a" stroke-width="22" fill="none" stroke-linecap="round" opacity=".9"/>
          <path d="M20 112 C 60 96, 70 78, 110 66 S 168 52, 182 40" stroke="#bdeaa9" stroke-width="11" fill="none" stroke-linecap="round"/>
          <!-- pond -->
          <ellipse cx="70" cy="92" rx="26" ry="11" fill="#5bbbe8"/>
          <ellipse cx="70" cy="90" rx="26" ry="11" fill="#7fd0f2" opacity=".6"/>
          <!-- green + flag -->
          <ellipse cx="176" cy="40" rx="17" ry="9" fill="#88e070"/>
          <circle cx="176" cy="40" r="2" fill="#2e5c2e"/>
          <line x1="176" y1="40" x2="176" y2="22" stroke="#cf5b5b" stroke-width="1.5"/>
          <path d="M176 22 L186 25 L176 28 Z" fill="#e23b3b"/>
          <!-- cherry blossoms -->
          <g fill="#f7b8d6"><circle cx="34" cy="74" r="9"/><circle cx="26" cy="80" r="6"/><circle cx="44" cy="80" r="6"/></g>
          <rect x="32" y="80" width="3" height="10" fill="#7a5a48"/>
          <g fill="#f9c8e0"><circle cx="150" cy="86" r="7"/><circle cx="144" cy="91" r="5"/></g>
          <rect x="148" y="90" width="2.5" height="8" fill="#7a5a48"/>
        </svg>
        <div class="courseName">Sakura Links</div>
        <div class="courseInfo">9 holes · Par 34</div>
        <div class="cpDiff"><span>DIFFICULTY</span>
          <span class="cpDiffDots"><i class="on easy"></i><i class="on easy"></i><i></i><i></i><i></i></span>
          <span class="cpDiffLabel">Relaxed</span></div>
        <div class="courseBest" id="courseBest">Best: —</div>
        <div class="cpProgress"><div class="cpBar"><div class="cpFill" id="course1Prog"></div></div><div class="cpLabel" id="course1ProgLbl">0 / 9 holes</div></div>
        <button class="teeBtn" id="course1Play"><span><svg class="btnIco" viewBox="0 0 24 24" fill="none"><path d="M7 21 V3" stroke="#1d6b3a" stroke-width="2.4" stroke-linecap="round"/><path d="M7 3.5 L18 7 L7 10.5 Z" fill="#e8554e"/></svg>TEE OFF</span></button>
        <div class="lockX" id="course1X"></div>
      </div>
      <div class="courseCard" id="course2">
        <svg class="cpArt" viewBox="0 0 200 118" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="okSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#a9cfe0"/><stop offset="1" stop-color="#dfeef0"/></linearGradient>
            <linearGradient id="okGrass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#4f9a4c"/><stop offset="1" stop-color="#3c7d3c"/></linearGradient>
          </defs>
          <rect width="200" height="118" fill="url(#okSky)"/>
          <ellipse cx="100" cy="120" rx="150" ry="84" fill="url(#okGrass)"/>
          <!-- dogleg fairway (sharp bend left then to green) -->
          <path d="M22 110 C 56 100, 78 96, 92 80 S 96 50, 134 44 S 170 40, 184 32" stroke="#6fb255" stroke-width="20" fill="none" stroke-linecap="round" opacity=".92"/>
          <path d="M22 110 C 56 100, 78 96, 92 80 S 96 50, 134 44 S 170 40, 184 32" stroke="#8cc66e" stroke-width="9" fill="none" stroke-linecap="round"/>
          <!-- winding creek crossing the corridor -->
          <path d="M0 70 C 40 60, 60 86, 96 74 S 150 58, 200 78" stroke="#3f7d8c" stroke-width="7" fill="none" stroke-linecap="round" opacity=".85"/>
          <path d="M0 70 C 40 60, 60 86, 96 74 S 150 58, 200 78" stroke="#5fa9b8" stroke-width="3" fill="none" stroke-linecap="round"/>
          <!-- bunker at the dogleg corner -->
          <ellipse cx="104" cy="64" rx="11" ry="6" fill="#e6cd95"/>
          <!-- green + flag -->
          <ellipse cx="180" cy="32" rx="15" ry="8" fill="#74c45e"/>
          <circle cx="180" cy="32" r="2" fill="#214a21"/>
          <line x1="180" y1="32" x2="180" y2="16" stroke="#cf5b5b" stroke-width="1.5"/>
          <path d="M180 16 L190 19 L180 22 Z" fill="#e23b3b"/>
          <!-- dense oaks/pines lining the inside of the dogleg -->
          <g>
            <path d="M50 96 l6 -14 l6 14 z" fill="#2f6b34"/><rect x="54.5" y="96" width="3" height="6" fill="#5a4030"/>
            <path d="M66 100 l5 -12 l5 12 z" fill="#3a7d3e"/><rect x="69.5" y="100" width="2.5" height="5" fill="#5a4030"/>
            <circle cx="120" cy="92" r="9" fill="#357a39"/><rect x="118.5" y="92" width="3" height="7" fill="#5a4030"/>
            <circle cx="138" cy="98" r="7" fill="#2f6b34"/><rect x="136.5" y="98" width="2.5" height="6" fill="#5a4030"/>
            <path d="M158 96 l5 -13 l5 13 z" fill="#2f6b34"/><rect x="161.5" y="96" width="2.5" height="6" fill="#5a4030"/>
          </g>
        </svg>
        <div class="courseName">Oak Ridge Municipal</div>
        <div class="courseInfo">9 holes · Par 36</div>
        <div class="cpDiff"><span>DIFFICULTY</span>
          <span class="cpDiffDots"><i class="on med"></i><i class="on med"></i><i class="on med"></i><i></i><i></i></span>
          <span class="cpDiffLabel">Tactical</span></div>
        <div class="courseBest" id="course2Best">Best: —</div>
        <div class="cpProgress"><div class="cpBar"><div class="cpFill" id="course2Prog"></div></div><div class="cpLabel" id="course2ProgLbl">0 / 9 holes</div></div>
        <button class="teeBtn" id="course2Play"><span><svg class="btnIco" viewBox="0 0 24 24" fill="none"><path d="M7 21 V3" stroke="#1d6b3a" stroke-width="2.4" stroke-linecap="round"/><path d="M7 3.5 L18 7 L7 10.5 Z" fill="#e8554e"/></svg>TEE OFF</span></button>
        <div class="lockBadge" id="course2Lock">🔒 Birdie every hole on Sakura Links to unlock</div>
        <div class="lockX" id="course2X"></div>
      </div>
      <div class="courseCard" id="course3">
        <svg class="cpArt" viewBox="0 0 200 118" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="vSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#2a1822"/><stop offset=".55" stop-color="#7e3320"/><stop offset="1" stop-color="#c25a26"/></linearGradient>
            <linearGradient id="vLava" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#ffd23b"/><stop offset=".5" stop-color="#f0641a"/><stop offset="1" stop-color="#9a2207"/></linearGradient>
            <radialGradient id="vGlow" cx=".5" cy=".5" r=".5">
              <stop offset="0" stop-color="#ffe07a"/><stop offset="1" stop-color="#f0641a" stop-opacity="0"/></radialGradient>
          </defs>
          <rect width="200" height="118" fill="url(#vSky)"/>
          <!-- ash haze -->
          <ellipse cx="100" cy="14" rx="120" ry="22" fill="#3a2026" opacity=".6"/>
          <!-- lava field floor -->
          <rect y="58" width="200" height="60" fill="url(#vLava)"/>
          <!-- molten cracks -->
          <path d="M0 86 H200 M0 100 H200" stroke="#ffd23b" stroke-width="1.2" opacity=".5"/>
          <path d="M30 70 L46 92 M120 66 L138 96 M170 72 L182 100" stroke="#ffb43a" stroke-width="1.2" opacity=".55"/>
          <!-- the volcano -->
          <path d="M62 64 L96 14 L130 64 Z" fill="#1c1210"/>
          <path d="M62 64 L96 14 L106 64 Z" fill="#2a1a16"/>
          <ellipse cx="96" cy="16" rx="12" ry="4" fill="#ffce4a"/>
          <ellipse cx="96" cy="16" rx="20" ry="8" fill="url(#vGlow)"/>
          <!-- eruption spray -->
          <g fill="#ffd23b"><circle cx="92" cy="8" r="1.6"/><circle cx="100" cy="6" r="1.4"/><circle cx="96" cy="3" r="1.6"/><circle cx="88" cy="11" r="1.2"/><circle cx="104" cy="10" r="1.2"/></g>
          <!-- glowing lava veins down the slope -->
          <path d="M96 18 Q92 40 86 62" stroke="#ff7a1a" stroke-width="2" fill="none"/>
          <path d="M96 18 Q101 40 108 62" stroke="#ff9a2a" stroke-width="1.6" fill="none"/>
          <!-- island fairway stepping stones across the lava -->
          <ellipse cx="30" cy="98" rx="18" ry="9" fill="#5a7d3e"/>
          <ellipse cx="30" cy="96" rx="18" ry="9" fill="#6f9b4c"/>
          <ellipse cx="84" cy="104" rx="13" ry="7" fill="#6f9b4c"/>
          <ellipse cx="150" cy="92" rx="20" ry="10" fill="#5a7d3e"/>
          <ellipse cx="150" cy="90" rx="20" ry="10" fill="#6f9b4c"/>
          <!-- green + flag on the far island -->
          <ellipse cx="156" cy="88" rx="10" ry="5" fill="#84b85e"/>
          <circle cx="156" cy="88" r="1.6" fill="#1c3a1c"/>
          <line x1="156" y1="88" x2="156" y2="74" stroke="#ffe24d" stroke-width="1.5"/>
          <path d="M156 74 L165 77 L156 80 Z" fill="#ffd23b"/>
        </svg>
        <div class="courseName">Volcano Ridge</div>
        <div class="courseInfo">9 holes · Par 36</div>
        <div class="cpDiff"><span>DIFFICULTY</span>
          <span class="cpDiffDots"><i class="on hard"></i><i class="on hard"></i><i class="on hard"></i><i class="on hard"></i><i class="on hard"></i></span>
          <span class="cpDiffLabel">Brutal</span></div>
        <div class="courseBest" id="course3Best">Best: —</div>
        <div class="cpProgress"><div class="cpBar"><div class="cpFill" id="course3Prog"></div></div><div class="cpLabel" id="course3ProgLbl">0 / 9 holes</div></div>
        <button class="teeBtn" id="course3Play"><span><svg class="btnIco" viewBox="0 0 24 24" fill="none"><path d="M7 21 V3" stroke="#1d6b3a" stroke-width="2.4" stroke-linecap="round"/><path d="M7 3.5 L18 7 L7 10.5 Z" fill="#e8554e"/></svg>TEE OFF</span></button>
        <div class="lockBadge" id="course3Lock">🔒 Birdie every hole on Oak Ridge to unlock</div>
        <div class="lockX" id="course3X"></div>
      </div>
      <div class="courseCard open" id="course4">
        <svg class="cpArt" viewBox="0 0 200 118" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="mpSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#4f97cf"/><stop offset="1" stop-color="#d6e6ee"/></linearGradient>
            <linearGradient id="mpGrass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#4e9a4f"/><stop offset="1" stop-color="#3d8442"/></linearGradient>
            <linearGradient id="mpFall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#dff2fb"/><stop offset="1" stop-color="#86c9e8"/></linearGradient>
          </defs>
          <rect width="200" height="118" fill="url(#mpSky)"/>
          <!-- glacier peaks -->
          <path d="M0 52 L26 20 L46 40 L70 14 L96 44 L120 18 L150 46 L178 22 L200 48 L200 60 L0 60 Z" fill="#a9c2d4"/>
          <path d="M26 20 L34 30 L18 30 Z M70 14 L80 28 L60 28 Z M120 18 L130 32 L110 32 Z M178 22 L186 32 L170 32 Z" fill="#eef6fb"/>
          <ellipse cx="100" cy="122" rx="150" ry="80" fill="url(#mpGrass)"/>
          <!-- hilly fairway curving to the green -->
          <path d="M18 110 C 60 98, 74 84, 108 72 S 166 54, 184 44" stroke="#5fb05a" stroke-width="20" fill="none" stroke-linecap="round" opacity=".92"/>
          <path d="M18 110 C 60 98, 74 84, 108 72 S 166 54, 184 44" stroke="#7ac46a" stroke-width="9" fill="none" stroke-linecap="round"/>
          <!-- big weird pond -->
          <path d="M48 96 q -12 -10 4 -16 q 18 -6 30 2 q 14 8 2 16 q -20 10 -36 -2 Z" fill="#5bbbe8"/>
          <path d="M50 94 q -8 -8 4 -12 q 16 -5 26 2 q 10 6 0 12 q -18 8 -30 -2 Z" fill="#7fd0f2" opacity=".6"/>
          <!-- waterfall behind the green -->
          <rect x="150" y="20" width="26" height="26" fill="#5a6570"/>
          <rect x="155" y="20" width="16" height="26" fill="url(#mpFall)"/>
          <!-- green + flag -->
          <ellipse cx="163" cy="46" rx="15" ry="8" fill="#76c860"/>
          <circle cx="163" cy="46" r="2" fill="#214a21"/>
          <line x1="163" y1="46" x2="163" y2="30" stroke="#cf5b5b" stroke-width="1.5"/>
          <path d="M163 30 L173 33 L163 36 Z" fill="#e23b3b"/>
          <!-- orange maples + a boulder -->
          <g><circle cx="40" cy="74" r="9" fill="#e8801f"/><circle cx="33" cy="80" r="6" fill="#c85a1c"/><circle cx="47" cy="80" r="6" fill="#f6b32e"/><rect x="38.5" y="80" width="3" height="9" fill="#6a4a32"/></g>
          <g><circle cx="120" cy="86" r="7" fill="#e8801f"/><circle cx="114" cy="91" r="5" fill="#c85a1c"/><rect x="118.5" y="90" width="2.5" height="8" fill="#6a4a32"/></g>
          <ellipse cx="86" cy="92" rx="6" ry="4" fill="#5a626a"/><ellipse cx="84" cy="90" rx="4" ry="2.6" fill="#7c848c"/>
        </svg>
        <div class="courseName">Maple Falls</div>
        <div class="courseInfo">9 holes · Par 35</div>
        <div class="cpDiff"><span>DIFFICULTY</span>
          <span class="cpDiffDots"><i class="on med"></i><i class="on med"></i><i class="on med"></i><i class="on hard"></i><i></i></span>
          <span class="cpDiffLabel">Strategic</span></div>
        <div class="courseBest" id="course4Best">Best: —</div>
        <div class="cpProgress"><div class="cpBar"><div class="cpFill" id="course4Prog"></div></div><div class="cpLabel" id="course4ProgLbl">0 / 9 holes</div></div>
        <button class="teeBtn" id="course4Play"><span><svg class="btnIco" viewBox="0 0 24 24" fill="none"><path d="M7 21 V3" stroke="#1d6b3a" stroke-width="2.4" stroke-linecap="round"/><path d="M7 3.5 L18 7 L7 10.5 Z" fill="#e8554e"/></svg>TEE OFF</span></button>
        <div class="lockBadge" id="course4Lock">🔒 Birdie every hole on Volcano Ridge to unlock</div>
        <div class="lockX" id="course4X"></div>
      </div>
      <div class="courseCard open" id="course5">
        <svg class="cpArt" viewBox="0 0 200 118" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="glSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#bfe9d8"/><stop offset="1" stop-color="#eafaf1"/></linearGradient>
            <linearGradient id="glGrass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#3fa56a"/><stop offset="1" stop-color="#2f8a55"/></linearGradient>
            <linearGradient id="glWater" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#3fc7c0"/><stop offset="1" stop-color="#1f9aa0"/></linearGradient>
          </defs>
          <rect width="200" height="118" fill="url(#glSky)"/>
          <!-- misty hills -->
          <ellipse cx="50" cy="40" rx="70" ry="22" fill="#bfe6c8" opacity=".6"/>
          <ellipse cx="160" cy="34" rx="60" ry="20" fill="#aee0bf" opacity=".55"/>
          <ellipse cx="100" cy="124" rx="150" ry="82" fill="url(#glGrass)"/>
          <!-- serpentine emerald fairway -->
          <path d="M10 108 C 50 92, 40 74, 80 66 S 150 60, 150 40 S 184 28, 192 22" stroke="#54bd80" stroke-width="20" fill="none" stroke-linecap="round" opacity=".9"/>
          <path d="M10 108 C 50 92, 40 74, 80 66 S 150 60, 150 40 S 184 28, 192 22" stroke="#74d49a" stroke-width="9" fill="none" stroke-linecap="round"/>
          <!-- winding lagoon -->
          <path d="M20 96 q 18 -14 40 -6 q 22 8 10 20 q -16 14 -40 6 q -22 -10 -10 -20 Z" fill="url(#glWater)"/>
          <ellipse cx="44" cy="98" rx="16" ry="7" fill="#7fe3dd" opacity=".5"/>
          <!-- big green on an isle + flag -->
          <ellipse cx="150" cy="44" rx="22" ry="12" fill="#5fd086"/>
          <ellipse cx="150" cy="42" rx="22" ry="12" fill="#7ee0a0" opacity=".5"/>
          <circle cx="150" cy="44" r="2" fill="#1c5a33"/>
          <line x1="150" y1="44" x2="150" y2="26" stroke="#cf5b5b" stroke-width="1.5"/>
          <path d="M150 26 L160 29 L150 32 Z" fill="#e23b3b"/>
          <!-- weeping willows -->
          <g><circle cx="36" cy="60" r="11" fill="#3f9a64"/><circle cx="28" cy="66" r="7" fill="#5cb87e"/><circle cx="44" cy="66" r="7" fill="#8fd9a4"/>
             <path d="M30 66 q-1 8 -2 14 M36 68 q0 9 0 15 M42 66 q1 8 2 14" stroke="#5cb87e" stroke-width="1.4" fill="none" stroke-linecap="round"/>
             <rect x="34.5" y="66" width="3" height="10" fill="#6a4a32"/></g>
          <g><circle cx="112" cy="80" r="8" fill="#3f9a64"/><circle cx="106" cy="85" r="5" fill="#8fd9a4"/>
             <path d="M108 85 q-1 6 -1 10 M115 84 q0 6 0 10" stroke="#5cb87e" stroke-width="1.2" fill="none" stroke-linecap="round"/>
             <rect x="110.5" y="85" width="2.5" height="8" fill="#6a4a32"/></g>
          <!-- slender cypress -->
          <g><path d="M180 92 L184 70 L188 92 Z" fill="#2c7a54"/><path d="M181 84 L184 74 L187 84 Z" fill="#3a9468"/><rect x="183" y="92" width="2" height="6" fill="#5a3f28"/></g>
        </svg>
        <div class="courseName">The Glades</div>
        <div class="courseInfo">9 holes · Par 34</div>
        <div class="cpDiff"><span>DIFFICULTY</span>
          <span class="cpDiffDots"><i class="on med"></i><i class="on med"></i><i class="on med"></i><i class="on hard"></i><i class="on hard"></i></span>
          <span class="cpDiffLabel">Treacherous</span></div>
        <div class="courseBest" id="course5Best">Best: —</div>
        <div class="cpProgress"><div class="cpBar"><div class="cpFill" id="course5Prog"></div></div><div class="cpLabel" id="course5ProgLbl">0 / 9 holes</div></div>
        <button class="teeBtn" id="course5Play"><span><svg class="btnIco" viewBox="0 0 24 24" fill="none"><path d="M7 21 V3" stroke="#1d6b3a" stroke-width="2.4" stroke-linecap="round"/><path d="M7 3.5 L18 7 L7 10.5 Z" fill="#e8554e"/></svg>TEE OFF</span></button>
        <div class="lockBadge" id="course5Lock">🔒 Birdie every hole on Maple Falls to unlock</div>
        <div class="lockX" id="course5X"></div>
      </div>
      <div class="courseCard open" id="course6">
        <svg class="cpArt" viewBox="0 0 200 118" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="svSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#ffe7a8"/><stop offset="0.6" stop-color="#fff4d6"/><stop offset="1" stop-color="#eafce0"/></linearGradient>
            <linearGradient id="svGrass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#8fd24f"/><stop offset="1" stop-color="#6fb83f"/></linearGradient>
            <linearGradient id="svWater" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#5ec7ef"/><stop offset="1" stop-color="#2e9fd6"/></linearGradient>
          </defs>
          <rect width="200" height="118" fill="url(#svSky)"/>
          <circle cx="154" cy="32" r="20" fill="#fff0bf"/><circle cx="154" cy="32" r="12" fill="#ffd86b"/>
          <ellipse cx="100" cy="124" rx="150" ry="84" fill="url(#svGrass)"/>
          <!-- two fairway routes splitting (double fairway hint) -->
          <path d="M8 110 C 50 96, 70 86, 96 80 S 150 64, 196 40" stroke="#7cc24a" stroke-width="15" fill="none" stroke-linecap="round"/>
          <path d="M8 110 C 40 86, 70 70, 110 70 S 168 60, 196 40" stroke="#8fd457" stroke-width="11" fill="none" stroke-linecap="round" opacity=".9"/>
          <!-- a lake with a little grass island -->
          <ellipse cx="70" cy="96" rx="34" ry="13" fill="url(#svWater)"/>
          <ellipse cx="64" cy="95" rx="8" ry="5" fill="#7cc24a"/>
          <!-- giant green + flag -->
          <ellipse cx="156" cy="44" rx="30" ry="15" fill="#73d36a"/>
          <ellipse cx="156" cy="42" rx="30" ry="15" fill="#90e088" opacity=".5"/>
          <circle cx="156" cy="44" r="2" fill="#1c5a33"/>
          <line x1="156" y1="44" x2="156" y2="24" stroke="#cf5b5b" stroke-width="1.5"/>
          <path d="M156 24 L166 27 L156 30 Z" fill="#e23b3b"/>
          <!-- tall eucalyptus trees: pale trunks, airy silver-green canopies -->
          <g><rect x="33" y="58" width="3" height="20" fill="#d8cba8"/>
             <circle cx="34" cy="54" r="11" fill="#5e8f6a"/><circle cx="27" cy="58" r="7" fill="#7eb088"/><circle cx="41" cy="58" r="7" fill="#a7d4ad"/><circle cx="34" cy="48" r="7" fill="#cdeac8"/></g>
          <g><rect x="111" y="64" width="2.5" height="16" fill="#d8cba8"/>
             <circle cx="112" cy="60" r="8" fill="#5e8f6a"/><circle cx="107" cy="64" r="5" fill="#7eb088"/><circle cx="117" cy="64" r="5" fill="#a7d4ad"/><circle cx="112" cy="56" r="5" fill="#cdeac8"/></g>
          <g><rect x="183" y="70" width="2" height="14" fill="#d8cba8"/>
             <circle cx="184" cy="66" r="7" fill="#5e8f6a"/><circle cx="188" cy="69" r="4" fill="#a7d4ad"/><circle cx="184" cy="62" r="4" fill="#cdeac8"/></g>
        </svg>
        <div class="courseName">Mirage Dunes</div>
        <div class="courseInfo">9 holes · Par 34</div>
        <div class="cpDiff"><span>DIFFICULTY</span>
          <span class="cpDiffDots"><i class="on med"></i><i class="on med"></i><i class="on med"></i><i class="on hard"></i><i></i></span>
          <span class="cpDiffLabel">Strategic</span></div>
        <div class="courseBest" id="course6Best">Best: —</div>
        <div class="cpProgress"><div class="cpBar"><div class="cpFill" id="course6Prog"></div></div><div class="cpLabel" id="course6ProgLbl">0 / 9 holes</div></div>
        <button class="teeBtn" id="course6Play"><span><svg class="btnIco" viewBox="0 0 24 24" fill="none"><path d="M7 21 V3" stroke="#1d6b3a" stroke-width="2.4" stroke-linecap="round"/><path d="M7 3.5 L18 7 L7 10.5 Z" fill="#e8554e"/></svg>TEE OFF</span></button>
        <div class="lockBadge" id="course6Lock">🔒 Birdie every hole on The Glades to unlock</div>
        <div class="lockX" id="course6X"></div>
      </div>
    </div>
    <div id="csButtons">
      <button class="csBtn statsBtn" id="statsBtn"><span class="csIcon"><svg viewBox="0 0 24 24" fill="none"><rect x="4" y="13" width="3.6" height="7" rx="1" fill="#15455f"/><rect x="10.2" y="8" width="3.6" height="12" rx="1" fill="#15455f"/><rect x="16.4" y="4" width="3.6" height="16" rx="1" fill="#15455f"/></svg></span><span>STATS</span></button>
      <button class="csBtn shopBtn" id="storeBtn"><span class="csIcon"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="#ffe27a" stroke="#fff" stroke-width="1.6"/><path d="M12 7.5l1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4z" fill="#e0a83c"/></svg></span><span>SHOP</span></button>
      <div id="coinChip"><span style="display:inline-flex"><svg class="coinIco" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="#ffd84d" stroke="#e0a83c" stroke-width="1.4"/><path d="M12 7.5l1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4z" fill="#e0a83c"/></svg></span><span id="coinVal">0</span></div>
    </div>
    <button class="menuBtn alt" id="backBtn" style="position:relative; z-index:3; margin-top:14px;">← BACK</button>
  </div>

  <!-- ============== MULTIPLAYER SETUP (local hot-seat) ============== -->
  <div id="mpScreen">
    <svg class="csBgShared" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="mpSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#bfe7fb"/><stop offset=".55" stop-color="#d6f0ff"/><stop offset="1" stop-color="#e9fbff"/></linearGradient>
        <linearGradient id="mpGrass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#86cf72"/><stop offset="1" stop-color="#5aa84e"/></linearGradient>
        <linearGradient id="mpFair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#a9e296"/><stop offset="1" stop-color="#8ace74"/></linearGradient>
        <radialGradient id="mpSun" cx=".5" cy=".5" r=".5">
          <stop offset="0" stop-color="#fff8e0" stop-opacity=".9"/><stop offset="1" stop-color="#fff8e0" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="1200" height="700" fill="url(#mpSky)"/>
      <circle cx="930" cy="150" r="150" fill="url(#mpSun)"/>
      <ellipse cx="240" cy="330" rx="360" ry="120" fill="#a9dd9a" opacity=".5"/>
      <ellipse cx="960" cy="340" rx="420" ry="130" fill="#9fd790" opacity=".45"/>
      <ellipse cx="600" cy="760" rx="900" ry="430" fill="url(#mpGrass)"/>
      <path d="M120 700 C 320 600, 360 470, 560 430 S 880 400, 1020 320" stroke="#7cc063" stroke-width="120" fill="none" stroke-linecap="round" opacity=".55"/>
      <path d="M120 700 C 320 600, 360 470, 560 430 S 880 400, 1020 320" stroke="url(#mpFair)" stroke-width="74" fill="none" stroke-linecap="round"/>
      <ellipse cx="330" cy="560" rx="120" ry="46" fill="#5db4e6" opacity=".9"/>
      <ellipse cx="330" cy="552" rx="120" ry="46" fill="#7fcdf2" opacity=".55"/>
      <ellipse cx="690" cy="470" rx="56" ry="24" fill="#efd9a0"/>
      <ellipse cx="1010" cy="316" rx="70" ry="30" fill="#76cc60"/>
      <line x1="1010" y1="316" x2="1010" y2="276" stroke="#fff" stroke-width="2.4"/>
      <path d="M1010 276 L1030 282 L1010 288 Z" fill="#e23b3b"/>
      <g>
        <rect x="156" y="430" width="14" height="64" rx="5" fill="#7a5a48"/>
        <circle cx="163" cy="420" r="58" fill="#f7b8d6"/><circle cx="120" cy="440" r="40" fill="#f9c8e0"/><circle cx="206" cy="438" r="44" fill="#fcd3e6"/>
      </g>
      <g>
        <rect x="1040" y="470" width="16" height="70" rx="5" fill="#7a5a48"/>
        <circle cx="1048" cy="458" r="64" fill="#f7b8d6"/><circle cx="1098" cy="480" r="44" fill="#f9c8e0"/><circle cx="996" cy="480" r="46" fill="#fcd3e6"/>
      </g>
    </svg>
    <div class="csVignetteShared"></div>
    <h2>MULTIPLAYER</h2>
    <div class="csSub">Play online with friends · add local players too</div>

    <div id="mpSetup">
      <!-- player count -->
      <div class="mpBlock">
        <div class="mpLabel">PLAYERS</div>
        <div class="mpChoice" id="mpCount">
          <button data-n="2">2</button><button data-n="3">3</button><button class="on" data-n="4">4</button>
        </div>
      </div>
      <!-- mode -->
      <div class="mpBlock">
        <div class="mpLabel">MODE</div>
        <div class="mpChoice" id="mpMode">
          <button class="on" data-mode="ffa">1v1v1v1</button><button data-mode="teams">2v2</button>
        </div>
      </div>
      <!-- scoring format -->
      <div class="mpBlock">
        <div class="mpLabel">SCORING</div>
        <div class="mpChoice" id="mpScore">
          <button class="on" data-score="stroke">Stroke Play</button><button data-score="match">Match Play</button><button data-score="skins">Skins</button>
        </div>
      </div>
      <!-- course -->
      <div class="mpBlock">
        <div class="mpLabel">COURSE</div>
        <div class="mpChoice" id="mpCourse">
          <button class="on" data-course="0">Sakura</button><button data-course="1">Oak Ridge</button><button data-course="2">Volcano</button><button data-course="3">Maple Falls</button><button data-course="4">The Glades</button><button data-course="5">Mirage Dunes</button>
        </div>
      </div>
      <!-- player name cards -->
      <div id="mpPlayers"></div>
    </div>

    <!-- ONLINE panel (shown when the toggle is on PLAY ONLINE) -->
    <div id="mpOnline" style="display:none">
      <div id="lobbyPanel">
        <!-- STEP 1: dead-simple entry — name, then create OR join with a code -->
        <div id="lobCreateRow">
          <div class="lobField">
            <label>YOUR NAME</label>
            <input id="lobNameInput" maxlength="12" placeholder="You" value="You">
          </div>
          <div class="lobBtns">
            <button class="menuBtn small" id="lobCreateBtn">CREATE LOBBY</button>
          </div>
          <div class="lobOr">— or join a friend —</div>
          <div class="lobField lobJoinField">
            <input id="lobJoinInput" maxlength="4" inputmode="numeric" pattern="\d{4}" placeholder="0000">
          </div>
          <div class="lobBtns">
            <button class="menuBtn small alt" id="lobJoinBtn">JOIN LOBBY</button>
          </div>
        </div>

        <!-- STEP 2: the lobby room -->
        <div id="lobRoom" style="display:none">
          <div class="lobCodeWrap">
            <span class="lobCodeLabel">LOBBY CODE</span>
            <span id="lobCode">—</span>
            <button class="lobCopy" id="lobCopyBtn">copy</button>
          </div>

          <!-- HOST-ONLY: choose format + course right here -->
          <div id="lobHostOptions" style="display:none">
            <div class="lobOptRow">
              <span class="lobOptLabel">FORMAT</span>
              <div class="lobOptChoice" id="lobMode">
                <button class="on" data-mode="ffa">Free for all</button><button data-mode="teams">2v2</button>
              </div>
            </div>
            <div class="lobOptRow">
              <span class="lobOptLabel">SCORING</span>
              <div class="lobOptChoice" id="lobScore">
                <button class="on" data-score="stroke">Stroke</button><button data-score="match">Match</button><button data-score="skins">Skins</button>
              </div>
            </div>
            <div class="lobOptRow">
              <span class="lobOptLabel">COURSE</span>
              <div class="lobOptChoice lobCourseChoice" id="lobCourse">
                <button class="on" data-course="0">Sakura</button><button data-course="1">Oak Ridge</button><button data-course="2">Volcano</button><button data-course="3">Maple Falls</button><button data-course="4">The Glades</button><button data-course="5">Mirage Dunes</button>
              </div>
            </div>
          </div>
          <!-- JOINER sees the chosen course read-only -->
          <div class="lobCourseRow" id="lobCourseReadonly" style="display:none">
            <span class="lobCourseLabel">COURSE</span>
            <span id="lobCourseName">Sakura Links</span>
          </div>

          <div class="lobSlotHead"><span id="lobCount">1/4</span> players</div>
          <div id="lobPlayers"></div>
          <div id="lobReadyRow">
            <button class="lobReady" id="lobReadyBtn">I'M READY</button>
          </div>
          <div id="lobWait" style="display:none">Waiting for the host to start…</div>
          <button class="menuBtn small" id="lobStart" style="display:none">START MATCH ⛳</button>
          <div id="lobChatWrap">
            <div id="lobChat"></div>
            <div id="lobEmotes">
              <button data-e="👍 nice">👍</button>
              <button data-e="🔥 let's go">🔥</button>
              <button data-e="😅 oops">😅</button>
              <button data-e="⛳ ready?">⛳</button>
              <button data-e="😂 lol">😂</button>
            </div>
          </div>
          <div id="lobLocalRow" style="display:none">
            <button class="lobMock" id="lobAddLocal">＋ Add local player (same device)</button>
            <div id="lobLocalHint">Local players share this screen and take turns on your device.</div>
          </div>
          <button class="lobMock" id="lobAddFriend" style="display:none">＋ Add test friend</button>
        </div>

        <div id="lobHint" class="lobHint"></div>
      </div>
    </div>

    <div class="mpFoot">
      <button class="menuBtn alt small" id="mpBack">← BACK</button>
      <button class="menuBtn small" id="mpStart">START MATCH ⛳</button>
    </div>
  </div>

  <!-- ============== STATS + CHALLENGES ============== -->
  <div id="statsScreen">
    <div class="sheet">
      <h2>STATS</h2>
      <div id="statsReport">
        <div class="srItem"><span class="srVal" id="srRounds">0</span><span class="srKey">ROUNDS</span></div>
        <div class="srItem"><span class="srVal" id="srHoles">0</span><span class="srKey">HOLES</span></div>
        <div class="srItem"><span class="srVal" id="srBest">—</span><span class="srKey">BEST ROUND</span></div>
        <div class="srItem"><span class="srVal" id="srAvg">—</span><span class="srKey">AVG / HOLE</span></div>
        <div class="srItem"><span class="srVal" id="srStreak">0</span><span class="srKey">BIRDIE RUN</span></div>
        <div class="srItem"><span class="srVal" id="srProgress">0%</span><span class="srKey">COMPLETION</span></div>
      </div>
      <div class="chHead"><span class="chTitle">CHALLENGES</span><span class="chCount" id="chCount">0 / 0</span></div>
      <div id="challengesList"></div>
      <button class="menuBtn alt" id="statsBack">← BACK</button>
    </div>
  </div>

  <!-- ============== BALL STORE ============== -->
  <div id="storeScreen">
    <div class="sheet">
      <h2>BALL SHOP</h2>
      <div id="storeCoins"><svg class="coinIco" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="#ffd84d" stroke="#e0a83c" stroke-width="1.4"/><path d="M12 7.5l1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4z" fill="#e0a83c"/></svg> <span id="storeCoinVal">0</span> coins</div>
      <div id="storeGrid"></div>
      <button class="menuBtn alt" id="storeBack">← BACK</button>
    </div>
  </div>

  <!-- ============== TOUR COMPLETE CELEBRATION ============== -->
  <div id="tourCelebrate">
    <div id="tcConfetti"></div>
    <div id="tcBox">
      <div id="tcTrophy">🏆</div>
      <div id="tcEyebrow">TOUR COMPLETE</div>
      <h2 id="tcName">SUNRISE TOUR</h2>
      <div id="tcTagline">Every legend tees off here</div>
      <div id="tcStars"><span>★</span><span>★</span><span>★</span></div>
      <div id="tcMsg">You birdied every hole on every course. A new tour awaits.</div>
      <button class="menuBtn" id="tcContinue">CONTINUE →</button>
    </div>
  </div>

  <!-- ============== SETTINGS ============== -->
  <div id="settingsScreen">
    <div id="settingsBox">
      <h2>SETTINGS</h2>
      <button class="menuBtn small alt" id="settingsToMenu" style="display:none">← BACK TO MENU</button>
      <label>SOUND VOLUME <input type="range" id="sfxSlider" min="0" max="100" value="80"></label>
      <label>MUSIC VOLUME <input type="range" id="musicSlider" min="0" max="100" value="55"></label>
      <label>GRAPHICS QUALITY
        <select id="qualitySel"><option value="high" selected>HIGH</option><option value="low">LOW</option></select>
      </label>
      <button class="menuBtn small" id="controlsBtn">⌨ CONTROLS</button>
      <button class="menuBtn small danger" id="resetBtn">RESET PROGRESS</button>
      <button class="menuBtn small" id="settingsClose">DONE</button>
    </div>
  </div>

  <!-- ============== CONTROLS REFERENCE ============== -->
  <div id="controlsScreen">
    <div id="controlsBox">
      <h2>CONTROLS</h2>

      <div class="ctlSection">MOUSE &amp; TOUCH</div>
      <div class="ctlRow"><span class="ctlAct">Swing</span><span class="ctlKey">Drag back &amp; release</span></div>
      <div class="ctlRow"><span class="ctlAct">Power</span><span class="ctlKey">How far you drag</span></div>
      <div class="ctlRow"><span class="ctlAct">Aim / shape</span><span class="ctlKey">Drag left or right</span></div>
      <div class="ctlRow"><span class="ctlAct">Spin (backspin / topspin)</span><span class="ctlKey">Drag the spin dial</span></div>

      <div class="ctlSection">KEYBOARD</div>
      <div class="ctlRow"><span class="ctlAct">Aim left / right</span><span class="ctlKey"><kbd>←</kbd> <kbd>→</kbd></span></div>
      <div class="ctlRow"><span class="ctlAct">Backspin / topspin</span><span class="ctlKey"><kbd>↑</kbd> <kbd>↓</kbd></span></div>
      <div class="ctlRow"><span class="ctlAct">Skip flyover / continue</span><span class="ctlKey"><kbd>Space</kbd></span></div>
      <div class="ctlRow"><span class="ctlAct">Retry hole</span><span class="ctlKey"><kbd>R</kbd></span></div>
      <div class="ctlRow"><span class="ctlAct">Slope arrows on / off</span><span class="ctlKey"><kbd>S</kbd></span></div>
      <div class="ctlRow"><span class="ctlAct">Green book on / off</span><span class="ctlKey"><kbd>C</kbd></span></div>
      <div class="ctlRow"><span class="ctlAct">Replay last shot</span><span class="ctlKey"><kbd>P</kbd></span></div>
      <div class="ctlRow"><span class="ctlAct">Fullscreen</span><span class="ctlKey"><kbd>F</kbd></span></div>
      <div class="ctlRow"><span class="ctlAct">Settings</span><span class="ctlKey"><kbd>M</kbd></span></div>
      <div class="ctlRow"><span class="ctlAct">Clubs (driving range)</span><span class="ctlKey"><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd></span></div>

      <button class="menuBtn small" id="controlsClose">DONE</button>
    </div>
  </div>

  <div id="holeIntro"><div id="hiName"></div><div id="hiPar"></div></div>

  <div id="controlsNote">
    <button id="retryBtn" title="Retry this hole (R or Start)">🔁 RETRY HOLE <span class="retryKey">R</span></button>
    <button id="skipHoleBtn" title="Skip ahead — you've already birdied this hole" style="display:none">SKIP HOLE ▶▶</button>
    <button id="menuBtnHud" title="Settings (M)">⚙ SETTINGS</button>
  </div>
</div>

<script>
"use strict";
/* ============================ CORE CONSTANTS ============================ */
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
/* LOGICAL render space stays 960x600 — all game coordinates use these. The canvas BACKING
   store is sized to the real on-screen pixels (CSS size × devicePixelRatio) and the context
   is scaled to match, so everything renders crisp at any display size / in fullscreen instead
   of stretching 960x600 up and going blurry. */
const W = 960, H = 600;
function sizeCanvas(){
  const fs = !!document.fullscreenElement;
  const dpr = Math.min(window.devicePixelRatio || 1, fs ? 1.5 : 1.4);   /* cap DPR low for speed */
  const rect = cv.getBoundingClientRect();
  const cssW = rect.width  || W;
  const cssH = rect.height || cssW * (H/W);                  /* use real rendered height */
  const bw = Math.round(cssW*dpr), bh = Math.round(cssH*dpr);
  if(cv.width!==bw || cv.height!==bh){
    cv.width = bw; cv.height = bh;
  }
  /* map logical 960x600 → full backing store; crisp + correct regardless of pixel count */
  ctx.setTransform(bw/W, 0, 0, bh/H, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
}
sizeCanvas();
window.addEventListener('resize', sizeCanvas);
document.addEventListener('fullscreenchange', ()=>{ sizeCanvas(); setTimeout(sizeCanvas,120); });
document.addEventListener('webkitfullscreenchange', ()=>{ sizeCanvas(); setTimeout(sizeCanvas,120); });
/* fullscreen toggle: button + F key. Fullscreens the #stage so the canvas fills the screen,
   then sizeCanvas() lifts the backing-store resolution to match (crisp, not stretched). */
function toggleFullscreen(){
  const el = document.getElementById('stage');
  if(!document.fullscreenElement){
    (el.requestFullscreen ? el.requestFullscreen() :
     el.webkitRequestFullscreen ? el.webkitRequestFullscreen() : null);
  } else {
    (document.exitFullscreen ? document.exitFullscreen() :
     document.webkitExitFullscreen ? document.webkitExitFullscreen() : null);
  }
}
window.addEventListener('DOMContentLoaded', ()=>{
  const fb=document.getElementById('fsBtn');
  if(fb) fb.addEventListener('click', toggleFullscreen);
});
/* run once more after layout settles so the very first frame is already crisp */
requestAnimationFrame(sizeCanvas);
/* offscreen cache for the static lava-field plate texture (baked once, blitted each frame) */
const lavaTex = document.createElement('canvas'); lavaTex.width=W; lavaTex.height=H;
const lavaCtx = lavaTex.getContext('2d');
let lavaTexBaked = false, lavaTexQuality = '';
const LAVA_TOP = 60;   /* fixed bake horizon (above any live horizon); blit is clipped live */
function bakeLavaTex(){
  const lx=lavaCtx; lx.clearRect(0,0,W,H);
  const gy0=LAVA_TOP;
  const ROWS = SET.quality==='high' ? 14 : 9;
  for(let r=0;r<ROWS;r++){
    const fr=r/ROWS, fr2=(r+1)/ROWS;
    const yy = gy0+(H-gy0)*fr*fr, yy2= gy0+(H-gy0)*fr2*fr2;
    const rowH=Math.max(2.5, yy2-yy), plate=rowH*1.5;
    for(let cx=-20; cx<W+40; cx+=plate){
      const gi=Math.floor(cx/plate);
      const shade=22+Math.round(10*((gi*7+r*11)%5)/5);
      lx.fillStyle=`rgb(${shade},${Math.round(shade*0.62)},${Math.round(shade*0.55)})`;
      lx.beginPath();
      lx.ellipse(cx+plate*0.5, yy+rowH*0.5, plate*0.46, rowH*0.46, 0, 0, Math.PI*2);
      lx.fill();
      lx.strokeStyle='rgba(120,55,18,.5)';                /* static crack base; glow added live */
      lx.lineWidth=Math.max(0.5, plate*0.05);
      lx.stroke();
      if(((gi*13+r*7)%4)===0){
        lx.fillStyle='rgba(150,70,28,.5)';
        lx.fillRect(cx+plate*0.3, yy+rowH*0.35, Math.max(1,plate*0.12), Math.max(1,rowH*0.12));
      }
    }
  }
  lavaTexBaked = true; lavaTexQuality = SET.quality;
}
const YD_PER_PX = 0.55;
const NEAR = 4;
const PY0 = H*0.45;
const HOLE_R = 8, FLAG_H = 46;
const TRUNK_R = 10, TRUNK_H = 26, CANOPY_H = 36;
const RIM_ACCEL = 320, RIM_BAND_IN = 28, RIM_COLLAR = 30, RIM_EXIT_SPEED = 270;
const SLOPE_G = 170;                 // gravity scale on the green height field
const FRICTION = {fairway:115, green:46, rough:265, highrough:560, sand:950, tee:115};
const BASE_DECEL = 115;
const GRAV = 430;
const REQUIRED_DIFF = -1;            // campaign: must birdie (one under par) to advance to the next hole

/* clubs: 0 driver, 1 iron, 2 wedge, 3 putter — pendulum speeds are rad/s */
const CLUBS = [
  /* backF = backspin authority, topF = topspin authority (per the spin spec).
     spinF kept as the overall "has spin controls" flag + legacy scale for sfx/prediction. */
  {name:'DRIVER', maxDist:545, maxErr:20*Math.PI/180, accSpeed:4.3, powSpeed:3.4, loft:0.8,  windF:1.0,  spinF:0.6, backF:0.55, topF:0.385, shapeF:1.25},
  {name:'IRON',   maxDist:380, maxErr:14*Math.PI/180, accSpeed:3.5, powSpeed:2.4, loft:1.05, windF:0.7,  spinF:0.8, backF:0.6,  topF:0.95, shapeF:1.2},
  {name:'WEDGE',  maxDist:250, maxErr:11*Math.PI/180, accSpeed:2.9, powSpeed:2.4, loft:1.4,  windF:0.55, spinF:1,   backF:1.0,  topF:0.55, shapeF:0.8},
  {name:'PUTTER', maxDist:170, maxErr:5*Math.PI/180,  accSpeed:1.6, powSpeed:1.55, loft:0,    windF:0,    spinF:0,   backF:0,    topF:0,    shapeF:0},
  {name:'60° WEDGE', maxDist:165, maxErr:7*Math.PI/180, accSpeed:2.6, powSpeed:2.1, loft:1.85, windF:0.5, spinF:1.2, backF:1.5, topF:0.7, shapeF:0.7}
];
function lieMods(lie, club){
  if(lie==='sand')  return {dist:0.5,  err:1.5,  meter:1.3};
  if(lie==='rough') return {dist:club===0?0.82:0.9, err:1.15, meter:1.0};
  if(lie==='highrough') return {dist:club===0?0.58:0.66, err:1.4, meter:1.15};   /* thick stuff */
  return {dist:1, err:1, meter:1};
}

/* ============================ 9-HOLE COURSE ============================ */
/* greens are unions of circles (lobes) with a height field:
   slope = base tilt; features: tier (shelf) / bowl (dip; h<0 = crown/mound)
   / ridge (hump; h<0 = valley/feed channel) */
const HOLES = [
 {name:'Warm Up', par:3, windMax:4, tee:{x:480,y:440}, fw:95, fwSlope:{dx:0.5,dy:-0.2,s:0.32}, pin:{x:700,y:282}, windDir:0.7,
  green:{lobes:[{x:648,y:212,r:106},{x:578,y:296,r:80},{x:718,y:296,r:80}],  /* big heart */
         slope:{dx:0.71,dy:0.71,s:0.18}, flat:{r:30,f:0.4},
         features:[{type:'bowl',x:700,y:282,r:38,h:8},      /* right: feeds the pin   */
                   {type:'bowl',x:586,y:290,r:44,h:-7},     /* left: crown repels     */
                   {type:'bowl',x:650,y:344,r:36,h:6}]},    /* front: safe collection */
  spine:[{x:480,y:440},{x:565,y:345},{x:648,y:250}],
  waters:[], bunkers:[],
  trees:[{x:250,y:210,r:28},{x:860,y:430,r:30},{x:160,y:470,r:26},{x:880,y:120,r:24}]},
 {name:'The Bend', par:4, windMax:6, tee:{x:130,y:505}, fw:80, fwSlope:{dx:-0.45,dy:0.3,s:0.34}, pin:{x:718,y:206}, windDir:2.4,
  green:{lobes:[{x:790,y:132,r:96},{x:692,y:222,r:84}],                      /* big kidney */
         slope:{dx:0.79,dy:0.61,s:0.2}, flat:{r:30,f:0.4},
         features:[{type:'bowl',x:800,y:116,r:44,h:-7},                        /* back crown    */
                   {type:'bowl',x:718,y:206,r:44,h:12},                        /* pin bowl      */
                   {type:'ridge',x:684,y:178,dx:-0.61,dy:0.79,h:-5,w:20},      /* drain channel */
                   {type:'tier',x:812,y:150,dx:0.77,dy:-0.64,h:7,w:22}]},      /* back-right shelf */
  spine:[{x:130,y:505},{x:268,y:486},{x:420,y:452},{x:548,y:392},{x:630,y:308},{x:692,y:236},{x:730,y:200}],
  waters:[{x:332,y:312,rx:100,ry:66,rot:-0.35,pond:true}],
  bunkers:[{x:582,y:322,rx:48,ry:30,rot:-0.7}],
  trees:[{x:500,y:96,r:30},{x:160,y:296,r:26},{x:902,y:380,r:30},{x:470,y:560,r:26},{x:80,y:110,r:24}]},
 {name:'Short Iron', par:3, windMax:6, tee:{x:460,y:316}, fw:90, fwSlope:{dx:0.55,dy:0.15,s:0.3}, pin:{x:775,y:322}, windDir:-1.2,
  green:{lobes:[{x:632,y:312,r:64},{x:714,y:318,r:64},{x:798,y:324,r:64}],   /* long & wide */
         slope:{dx:-0.16,dy:-0.99,s:0.3}, flat:{r:28,f:0.4},
         features:[{type:'ridge',x:716,y:318,dx:1,dy:0,h:6,w:18},             /* mid ridge       */
                   {type:'bowl',x:780,y:322,r:34,h:6},                        /* pin dish        */
                   {type:'bowl',x:636,y:316,r:36,h:5}]},                      /* left lag zone   */
  spine:[{x:460,y:316},{x:560,y:305},{x:660,y:318}],
  waters:[], bunkers:[{x:560,y:412,rx:42,ry:26,rot:0.3}],
  trees:[{x:430,y:130,r:30},{x:330,y:500,r:28},{x:880,y:480,r:26},{x:840,y:130,r:28}]},
 {name:'Squeeze', par:4, windMax:10, tee:{x:120,y:520}, fw:62, fwSlope:{dx:-0.4,dy:-0.35,s:0.33}, pin:{x:818,y:86}, windDir:1.9,
  green:{lobes:[{x:796,y:140,r:104}],                                         /* big shelf green */
         slope:{dx:0.25,dy:-0.6,s:0.35}, flat:{r:28,f:0.4},
         features:[{type:'tier',x:800,y:118,dx:0.31,dy:-0.95,h:13,w:32},      /* back shelf      */
                   {type:'bowl',x:734,y:200,r:38,h:6},                        /* front-left collect */
                   {type:'bowl',x:864,y:158,r:36,h:-6}]},                     /* right crown sidehill */
  spine:[{x:120,y:520},{x:300,y:460},{x:470,y:380},{x:620,y:280},{x:740,y:195},{x:790,y:145}],
  waters:[], bunkers:[{x:664,y:252,rx:42,ry:26,rot:-0.6},{x:916,y:232,rx:38,ry:24,rot:0.5}],
  trees:[{x:380,y:200,r:30},{x:560,y:470,r:28},{x:240,y:300,r:26},{x:910,y:400,r:28},{x:660,y:60,r:26}]},
 {name:'The Island', par:3, windMax:8, tee:{x:372,y:452}, fw:60, pin:{x:560,y:300}, windDir:0.5,
  green:{lobes:[{x:566,y:286,r:64},{x:556,y:330,r:48}],                       /* bigger green, front tongue toward water */
         slope:{dx:-0.34,dy:0.74,s:0.30}, flat:{r:24,f:0.45},                 /* gentler tilt toward the front water */
         features:[{type:'ridge',x:572,y:262,dx:0.97,dy:0.24,h:5,w:18},       /* back shelf holds shots up */
                   {type:'bowl',x:560,y:316,r:38,h:9},                        /* stronger front pin bowl — catches & holds */
                   {type:'tier',x:556,y:352,dx:-0.34,dy:0.94,h:4,w:16}]},     /* front shelf eases the roll-out to water */
  spine:[{x:372,y:452},{x:430,y:420}],
  waters:[{x:556,y:300,rx:330,ry:236,rot:0,pond:true}], bunkers:[],
  trees:[{x:120,y:200,r:28},{x:150,y:520,r:26},{x:910,y:520,r:28},{x:100,y:60,r:24}]},
 {name:'Dogleg Down', par:4, windMax:10, tee:{x:140,y:140}, fw:66, fwSlope:{dx:-0.55,dy:0.2,s:0.36}, pin:{x:804,y:448}, windDir:3.0,
  green:{lobes:[{x:842,y:468,r:76},{x:750,y:478,r:70},{x:844,y:390,r:70}],   /* big L */
         slope:{dx:-0.92,dy:0.39,s:0.5}, flat:{r:28,f:0.4},
         features:[{type:'ridge',x:800,y:440,dx:0.71,dy:0.71,h:7,w:16},       /* arm-splitting ridge */
                   {type:'bowl',x:858,y:496,r:38,h:-6},                       /* outer-corner crown  */
                   {type:'bowl',x:844,y:386,r:32,h:5}]},                      /* top-arm collection  */
  spine:[{x:140,y:140},{x:320,y:180},{x:480,y:260},{x:560,y:360},{x:660,y:430},{x:780,y:458}],
  waters:[], bunkers:[{x:690,y:380,rx:42,ry:26,rot:0.4},{x:672,y:560,rx:40,ry:24,rot:0.2}],
  trees:[{x:430,y:430,r:30},{x:580,y:190,r:28},{x:250,y:330,r:26},{x:900,y:230,r:28},{x:80,y:420,r:26}]},
 {name:'The Long Road', par:5, windMax:12, tee:{x:90,y:540}, fw:64, fwSlope:{dx:0.45,dy:-0.3,s:0.32}, pin:{x:886,y:82}, windDir:-2.2,
  green:{lobes:[{x:884,y:92,r:76},{x:818,y:160,r:72}],                        /* big hourglass */
         slope:{dx:0.5,dy:0.86,s:0.42}, flat:{r:28,f:0.4},
         features:[{type:'ridge',x:851,y:126,dx:0.70,dy:-0.72,h:5,w:15},      /* neck ridge       */
                   {type:'ridge',x:886,y:82,dx:0.77,dy:0.64,h:-4,w:16},       /* back feed valley */
                   {type:'bowl',x:790,y:196,r:34,h:6}]},                      /* front-left collect */
  spine:[{x:90,y:540},{x:240,y:500},{x:400,y:470},{x:560,y:420},{x:680,y:330},{x:780,y:220},{x:856,y:136}],
  waters:[{x:460,y:262,rx:130,ry:85,rot:0.3,pond:true}],
  bunkers:[{x:732,y:252,rx:42,ry:28,rot:-0.6}],
  trees:[{x:300,y:300,r:30},{x:620,y:520,r:28},{x:170,y:170,r:26},{x:920,y:330,r:28}]},
 {name:'Postage Stamp', par:3, windMax:12, tee:{x:470,y:420}, fw:70, fwSlope:{dx:0.35,dy:0.4,s:0.34}, pin:{x:676,y:192}, windDir:1.1,
  green:{lobes:[{x:660,y:205,r:66}],                                          /* still tiny + fierce */
         slope:{dx:0.31,dy:0.95,s:0.45}, flat:{r:24,f:0.45},
         features:[{type:'bowl',x:672,y:196,r:28,h:5}]},
  spine:[{x:470,y:420},{x:660,y:210}],
  waters:[], bunkers:[{x:566,y:282,rx:40,ry:26,rot:0.7},{x:752,y:132,rx:38,ry:24,rot:-0.5}],
  trees:[{x:230,y:180,r:30},{x:200,y:480,r:28},{x:890,y:430,r:28},{x:870,y:90,r:24}]},
 {name:'The Gauntlet', par:5, windMax:15, tee:{x:80,y:520}, fw:60, fwSlope:{dx:-0.5,dy:-0.2,s:0.33}, pin:{x:890,y:78}, windDir:-0.6,
  green:{lobes:[{x:858,y:116,r:90}],                                          /* big two-tier finale */
         slope:{dx:0.6,dy:0.4,s:0.4}, flat:{r:28,f:0.4},
         features:[{type:'tier',x:868,y:106,dx:0.71,dy:-0.71,h:11,w:30},      /* upper tier       */
                   {type:'bowl',x:828,y:160,r:38,h:7},                        /* lower collection */
                   {type:'bowl',x:912,y:162,r:30,h:-5}]},                     /* low-right crown sidehill */
  spine:[{x:80,y:520},{x:230,y:490},{x:380,y:468},{x:520,y:430},{x:620,y:350},{x:700,y:262},{x:800,y:180},{x:846,y:140}],
  waters:[{x:350,y:330,rx:90,ry:60,rot:-0.3,pond:true},{x:735,y:305,rx:80,ry:55,rot:0.4,pond:true}],
  bunkers:[{x:782,y:236,rx:40,ry:26,rot:-0.5},{x:932,y:230,rx:34,ry:22,rot:0}],
  trees:[{x:540,y:130,r:30},{x:430,y:560,r:28},{x:170,y:280,r:26},{x:930,y:430,r:26}]}
];

/* current hole globals */
let CUR, PIN, TEE, SPINE, SPINE2, ISLANDS, FAIRWAY_W, GREEN, WATERS, BUNKERS, TREES, PAR;
let POLY, SHADE_CELLS, CONTOUR_SEGS, ARROWS, BLOTCH, TUFTS, SAND_DOTS;

/* ============================ GEOMETRY ============================ */
function dist(ax,ay,bx,by){ return Math.hypot(ax-bx, ay-by); }
function distToSegment(px,py,ax,ay,bx,by){
  const dx=bx-ax, dy=by-ay, L2=dx*dx+dy*dy;
  let t = L2 ? ((px-ax)*dx+(py-ay)*dy)/L2 : 0;
  t = Math.max(0, Math.min(1, t));
  return dist(px,py, ax+dx*t, ay+dy*t);
}
function distToSpine(px,py){
  let d = Infinity;
  for(let i=0;i<SPINE.length-1;i++)
    d = Math.min(d, distToSegment(px,py,SPINE[i].x,SPINE[i].y,SPINE[i+1].x,SPINE[i+1].y));
  if(SPINE2 && SPINE2.length>1){
    for(let i=0;i<SPINE2.length-1;i++)
      d = Math.min(d, distToSegment(px,py,SPINE2[i].x,SPINE2[i].y,SPINE2[i+1].x,SPINE2[i+1].y));
  }
  return d;
}
/* is the point on a fairway island? (a grass patch surrounded by hazard you must carry to) */
function onIsland(px,py){
  if(!ISLANDS) return false;
  for(const is of ISLANDS) if(inEllipse(px,py,is)) return true;
  return false;
}
function inEllipse(px,py,e){
  const c=Math.cos(-e.rot), s=Math.sin(-e.rot);
  const dx=px-e.x, dy=py-e.y;
  const lx=dx*c-dy*s, ly=dx*s+dy*c;
  return (lx*lx)/(e.rx*e.rx)+(ly*ly)/(e.ry*e.ry) <= 1;
}
/* water test that matches the RENDERED pond shape. Ponds are drawn as irregular blobs
   (blobPoly); the painted water extends past the base ellipse, so physics must use the
   exact same outline or balls "float" on painted water. We test against the precomputed
   blob polygon (w._poly) with a point-in-polygon test. */
function pointInPoly(px,py,poly){
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const xi=poly[i].x, yi=poly[i].y, xj=poly[j].x, yj=poly[j].y;
    if(((yi>py)!==(yj>py)) && (px < (xj-xi)*(py-yi)/(yj-yi)+xi)) inside=!inside;
  }
  return inside;
}
function inWater(px,py,w){
  if(!w.pond) return inEllipse(px,py,w);          /* non-pond hazards stay elliptical */
  if(w._poly && w._poly.length>2) return pointInPoly(px,py,w._poly);
  return inEllipse(px,py,w);                       /* fallback before poly is built */
}
/* like inWater but includes the sand-bank lip ring around the pond — used so the green's
   grass skirt/fringe doesn't paint over the sandy bank (which hid it near greens). */
function inWaterOrLip(px,py,w){
  if(!w.pond) return inEllipse(px,py,w);
  if(w._lipPoly && w._lipPoly.length>2) return pointInPoly(px,py,w._lipPoly);
  return inWater(px,py,w);
}
/* signed distance into the green (union of lobes): >0 inside */
function greenSDF(px,py){
  let best=-1e9;
  for(const l of GREEN.lobes) best = Math.max(best, l.r - dist(px,py,l.x,l.y));
  return best;
}
function onGreenAt(px,py){ return greenSDF(px,py) > 0; }
/* height field over the green (used for break, shading, contours) */
function greenHeight(px,py){
  const g = GREEN;
  let h = -((px-PIN.x)*g.slope.dx + (py-PIN.y)*g.slope.dy) * g.slope.s;
  for(const f of (g.features||[])){
    if(f.type==='tier'){
      const t = (px-f.x)*f.dx + (py-f.y)*f.dy;
      const u = Math.max(0, Math.min(1, (t+f.w)/(2*f.w)));
      h += f.h * u*u*(3-2*u);
    } else if(f.type==='bowl'){
      const d = dist(px,py,f.x,f.y);
      h -= f.h * Math.exp(-(d*d)/(f.r*f.r));
    } else if(f.type==='ridge'){
      const t = (px-f.x)*f.dx + (py-f.y)*f.dy;
      h += f.h * Math.exp(-(t*t)/(f.w*f.w));
    }
  }
  return h;
}
function greenGrad(px,py){
  const e=2;
  let gx=(greenHeight(px+e,py)-greenHeight(px-e,py))/(2*e);
  let gy=(greenHeight(px,py+e)-greenHeight(px,py-e))/(2*e);
  const m=Math.hypot(gx,gy);
  if(m>1.2){ gx*=1.2/m; gy*=1.2/m; }   /* smooth, gradual break — no spikes */
  /* flatter pocket around the pin: good shots get to stay close */
  const fz = GREEN.flat;
  if(fz){
    const d = dist(px,py, fz.x??PIN.x, fz.y??PIN.y);
    const r = fz.r??32, f = fz.f??0.35;
    if(d<r){ const k = f + (1-f)*(d/r); gx*=k; gy*=k; }
  }
  return {x:gx, y:gy};
}
function sdfGrad(px,py){
  const e=2;
  return {
    x:(greenSDF(px+e,py)-greenSDF(px-e,py))/(2*e),
    y:(greenSDF(px,py+e)-greenSDF(px,py-e))/(2*e)
  };
}
const HIGH_ROUGH_PX = 36;          /* ~20 yards of normal rough before the thick stuff */
function surfaceAt(px,py){
  /* bunkers take priority over the green so green-side/greenside bunkers actually play as sand */
  for(const b of BUNKERS) if(inEllipse(px,py,b)) return 'sand';
  if(onGreenAt(px,py)) return 'green';
  /* fairway islands: short grass that sits inside a hazard — checked before water so the
     ball rests on the island instead of splashing (forces a strategic layup carry) */
  if(ISLANDS && onIsland(px,py)) return 'fairway';
  for(const w of WATERS) if(inWater(px,py,w)) return 'water';
  /* trees tagged sandMulch have a sandy base that plays like a bunker */
  if(TREES) for(const t of TREES){
    if(!t.sandMulch) continue;
    const mr=t.r*0.78, dx=px-t.x, dy=py-t.y;
    if(dx*dx+dy*dy <= mr*mr) return 'sand';
  }
  /* creek sand banks: just outside the water channel along a creek */
  if(CREEKS && CREEKS.length){
    for(const w of WATERS){
      if(!w.creek) continue;
      /* a thin sand collar around each creek segment */
      const dx=px-w.x, dy=py-w.y;
      const rr=(dx*dx)/((w.rx+9)*(w.rx+9)) + (dy*dy)/((w.ry+9)*(w.ry+9));
      if(rr<=1) return 'sand';
    }
  }
  if(dist(px,py,TEE.x,TEE.y) <= 34) return 'tee';
  const ds = distToSpine(px,py);
  if(ds <= FAIRWAY_W) return 'fairway';
  /* Volcano Ridge has NO rough — everything off the short grass is molten lava (OOB) */
  if(THEME()==='volcano') return 'water';
  /* Oak Ridge: a band of thick HIGH ROUGH starts ~20yd outside the fairway, to stop
     players from simply walking it around the creeks. */
  if(THEME()==='oak' && ds > FAIRWAY_W + HIGH_ROUGH_PX) return 'highrough';
  return 'rough';
}

/* ---- marching squares: iso-contours of an arbitrary field ---- */
function marchSegs(f, x0,y0,x1,y1, cell, iso){
  const segs=[];
  const nx=Math.ceil((x1-x0)/cell), ny=Math.ceil((y1-y0)/cell);
  const g=[];
  for(let j=0;j<=ny;j++){ g[j]=[]; for(let i=0;i<=nx;i++) g[j][i]=f(x0+i*cell, y0+j*cell)-iso; }
  const frac=(a,b)=> a/(a-b);
  for(let j=0;j<ny;j++) for(let i=0;i<nx;i++){
    const v0=g[j][i], v1=g[j][i+1], v2=g[j+1][i+1], v3=g[j+1][i];
    const idx=(v0>0?1:0)|(v1>0?2:0)|(v2>0?4:0)|(v3>0?8:0);
    if(idx===0||idx===15) continue;
    const X=x0+i*cell, Y=y0+j*cell;
    const P={
      t:{x:X+cell*frac(v0,v1), y:Y},
      r:{x:X+cell, y:Y+cell*frac(v1,v2)},
      b:{x:X+cell*frac(v3,v2), y:Y+cell},
      l:{x:X, y:Y+cell*frac(v0,v3)}
    };
    const T={1:['l','t'],2:['t','r'],3:['l','r'],4:['r','b'],5:['l','t','r','b'],
             6:['t','b'],7:['l','b'],8:['b','l'],9:['b','t'],10:['t','r','b','l'],
             11:['b','r'],12:['r','l'],13:['r','t'],14:['t','l']}[idx];
    segs.push([P[T[0]], P[T[1]]]);
    if(T.length===4) segs.push([P[T[2]], P[T[3]]]);
  }
  return segs;
}
/* stitch segments into closed loops (for fillable outlines) — direction-agnostic */
function stitchLoops(segs){
  const key = p => (Math.round(p.x*2)/2)+','+(Math.round(p.y*2)/2);
  const adj = new Map();
  const add = (k,i)=>{ if(!adj.has(k)) adj.set(k,[]); adj.get(k).push(i); };
  segs.forEach((s,i)=>{ add(key(s[0]),i); add(key(s[1]),i); });
  const used = new Array(segs.length).fill(false);
  const loops=[];
  for(let i=0;i<segs.length;i++){
    if(used[i]) continue;
    used[i]=true;
    const loop=[segs[i][0], segs[i][1]];
    let guard=0;
    while(guard++ < segs.length+2){
      const end = loop[loop.length-1];
      const cands = adj.get(key(end))||[];
      let found=false;
      for(const c of cands){
        if(used[c]) continue;
        used[c]=true;
        const s=segs[c];
        /* append whichever endpoint continues the chain */
        loop.push(key(s[0])===key(end) ? s[1] : s[0]);
        found=true;
        break;
      }
      if(!found) break;
    }
    if(loop.length>=6) loops.push(loop);
  }
  return loops.sort((a,b)=>b.length-a.length);
}
function greenBBox(pad){
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(const l of GREEN.lobes){
    x0=Math.min(x0,l.x-l.r-pad); y0=Math.min(y0,l.y-l.r-pad);
    x1=Math.max(x1,l.x+l.r+pad); y1=Math.max(y1,l.y+l.r+pad);
  }
  return {x0,y0,x1,y1};
}

/* ---- fairway / shapes ---- */
function smoothSpine(samplesPerSeg, spinePts){
  const pts = spinePts || SPINE, out=[];
  for(let i=0;i<pts.length-1;i++){
    const p0=pts[Math.max(0,i-1)], p1=pts[i], p2=pts[i+1], p3=pts[Math.min(pts.length-1,i+2)];
    for(let j=0;j<samplesPerSeg;j++){
      const t=j/samplesPerSeg, t2=t*t, t3=t2*t;
      out.push({
        x:0.5*((2*p1.x)+(-p0.x+p2.x)*t+(2*p0.x-5*p1.x+4*p2.x-p3.x)*t2+(-p0.x+3*p1.x-3*p2.x+p3.x)*t3),
        y:0.5*((2*p1.y)+(-p0.y+p2.y)*t+(2*p0.y-5*p1.y+4*p2.y-p3.y)*t2+(-p0.y+3*p1.y-3*p2.y+p3.y)*t3)
      });
    }
  }
  out.push({...pts[pts.length-1]});
  return out;
}
function corridorPoly(spinePts, appendMow){
  const c = smoothSpine(8, spinePts), L=[], R=[];
  for(let i=0;i<c.length;i++){
    const a = c[Math.max(0,i-1)], b = c[Math.min(c.length-1,i+1)];
    let nx = -(b.y-a.y), ny = (b.x-a.x);
    const n = Math.hypot(nx,ny)||1; nx/=n; ny/=n;
    L.push({x:c[i].x+nx*FAIRWAY_W, y:c[i].y+ny*FAIRWAY_W});
    R.push({x:c[i].x-nx*FAIRWAY_W, y:c[i].y-ny*FAIRWAY_W});
  }
  /* mowing bands: one quad per spine segment, slightly inset from the edge */
  if(appendMow){
    const w = FAIRWAY_W*0.93;
    for(let i=0;i<c.length-1;i++){
      const a=c[i], b=c[i+1];
      let nx=-(b.y-a.y), ny=(b.x-a.x);
      const n=Math.hypot(nx,ny)||1; nx/=n; ny/=n;
      MOW_BANDS.push([
        {x:a.x+nx*w, y:a.y+ny*w},{x:b.x+nx*w, y:b.y+ny*w},
        {x:b.x-nx*w, y:b.y-ny*w},{x:a.x-nx*w, y:a.y-ny*w}
      ]);
    }
  }
  return L.concat(R.reverse());
}
function buildFairwayPoly(){
  MOW_BANDS = [];
  const main = corridorPoly(SPINE, true);
  /* second corridor (double fairway) shares the same mow-band styling */
  FAIRWAY2_POLY = (SPINE2 && SPINE2.length>1) ? corridorPoly(SPINE2, true) : null;
  /* island grass patches rendered as ellipse polys */
  ISLAND_POLYS = ISLANDS ? ISLANDS.map(is=>ellipsePoly(is, 30)) : null;
  return main;
}
let FAIRWAY2_POLY = null, ISLAND_POLYS = null;
let MOW_BANDS = [];
let HIGH_ROUGH = [];   /* two strips of thick grass flanking the fairway (Oak Ridge) */
function buildHighRoughBands(){
  HIGH_ROUGH = [];
  if(THEME()!=='oak') return;
  const c = smoothSpine(8);
  /* a band between two perpendicular offsets, on one side (sign) of the spine */
  const band = (sign, d0, d1)=>{
    const A=[], B=[];
    for(let i=0;i<c.length;i++){
      const a=c[Math.max(0,i-1)], b=c[Math.min(c.length-1,i+1)];
      let nx=-(b.y-a.y), ny=(b.x-a.x); const n=Math.hypot(nx,ny)||1; nx/=n; ny/=n;
      A.push({x:c[i].x+sign*nx*d0, y:c[i].y+sign*ny*d0});
      B.push({x:c[i].x+sign*nx*d1, y:c[i].y+sign*ny*d1});
    }
    return A.concat(B.reverse());
  };
  const F = FAIRWAY_W;
  /* one band per side covering the whole high-rough zone (no fill — just blades scatter here) */
  for(const sign of [1,-1]){
    HIGH_ROUGH.push({poly:band(sign, F+HIGH_ROUGH_PX, F+HIGH_ROUGH_PX+150), core:true});
  }
}
function ellipsePoly(e, n=28, grow=0){
  const out=[];
  for(let i=0;i<n;i++){
    const a=i/n*Math.PI*2;
    const lx=Math.cos(a)*(e.rx+grow), ly=Math.sin(a)*(e.ry+grow);
    out.push({
      x:e.x + lx*Math.cos(e.rot) - ly*Math.sin(e.rot),
      y:e.y + lx*Math.sin(e.rot) + ly*Math.cos(e.rot)
    });
  }
  return out;
}
function blobPoly(e, n=40, grow=0){
  /* an irregular pond outline: ellipse radius modulated by a few sines keyed to a per-pond
     seed, so each pond is a unique natural blob (lobes + inlets), not a circle */
  const seed = (e.x*0.13 + e.y*0.07);
  const out=[];
  for(let i=0;i<n;i++){
    const a=i/n*Math.PI*2;
    /* radius wobble: low-freq lobes + a little higher-freq ripple */
    const w = 1
      + 0.26*Math.sin(a*2 + seed)
      + 0.16*Math.sin(a*3 - seed*1.7)
      + 0.09*Math.sin(a*5 + seed*0.6);
    const lx=Math.cos(a)*((e.rx)*w+grow), ly=Math.sin(a)*((e.ry)*w+grow);
    out.push({
      x:e.x + lx*Math.cos(e.rot||0) - ly*Math.sin(e.rot||0),
      y:e.y + lx*Math.sin(e.rot||0) + ly*Math.cos(e.rot||0)
    });
  }
  return out;
}
function circlePoly(cx,cy,r,n=36){
  const out=[];
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2; out.push({x:cx+Math.cos(a)*r, y:cy+Math.sin(a)*r});}
  return out;
}

/* ============== MAP 2: OAK RIDGE MUNICIPAL · Par 36 (4-4-3-5-4-5-3-4-4) · shot-diet redesign: wedge approaches, sharp doglegs, creek crossings ============== */
const HOLES2 = [
 /* 1 — Camellia Ridge · P4 · opener: creek across the LZ, then a GIANT OAK guards the
        approach — drive around it left or right to open the angle to the green */
 {name:'Camellia Ridge', par:4, windMax:6, tee:{x:296,y:453}, fw:60, fwSlope:{dx:-0.5,dy:0.2,s:0.34}, pin:{x:790,y:230}, windDir:5.3,
  green:{lobes:[{x:790,y:230,r:58},{x:748,y:270,r:46},{x:836,y:268,r:44},{x:792,y:180,r:42}],
         slope:{dx:-0.4,dy:0.92,s:0.32}, flat:{r:28,f:0.45},
         features:[{type:'tier',x:792,y:200,dx:-0.4,dy:-0.92,h:12,w:22},
                   {type:'bowl',x:760,y:250,r:26,h:8},{type:'bowl',x:826,y:248,r:22,h:-6}]},
  spine:[{x:296,y:453},{x:380,y:430},{x:560,y:330},{x:790,y:232}],
  waters:[{x:585,y:505,rx:120,ry:82,rot:0,pond:true},{x:463,y:289,rx:17,ry:10,rot:1.26,creek:true},{x:472,y:316,rx:17,ry:10,rot:1.26,creek:true},{x:481,y:343,rx:17,ry:10,rot:1.26,creek:true},{x:489,y:369,rx:17,ry:10,rot:1.26,creek:true},{x:507,y:391,rx:17,ry:10,rot:0.87,creek:true},{x:525,y:412,rx:17,ry:10,rot:0.87,creek:true},{x:543,y:434,rx:17,ry:10,rot:0.87,creek:true}], /* creek cuts across the landing zone */
  bunkers:[{x:718,y:322,rx:22,ry:15,rot:0.2},{x:836,y:330,rx:20,ry:14,rot:-0.2}],
  trees:[{x:600,y:313,r:50,kind:'oak'},  /* THE giant fairway oak — play around it */
         {x:520,y:262,r:28},{x:700,y:160,r:26},{x:860,y:380,r:24,kind:'pine'}]},  /* trees behind the tee removed for a clear view */

 /* 2 — White Oak · P4 · SHARP dogleg-left: cut the corner (creek carry) for a wedge, or bail right for an iron */
 {name:'White Oak', par:4, windMax:8, tee:{x:704,y:485}, fw:54, fwSlope:{dx:0.5,dy:-0.25,s:0.32}, pin:{x:230,y:250}, windDir:2.4,
  green:{lobes:[{x:230,y:250,r:56},{x:272,y:288,r:44},{x:188,y:288,r:42},{x:230,y:200,r:40}],
         slope:{dx:0.5,dy:0.86,s:0.34}, flat:{r:26,f:0.42},
         features:[{type:'tier',x:230,y:224,dx:0.5,dy:-0.86,h:12,w:22},
                   {type:'bowl',x:262,y:270,r:24,h:8},{type:'bowl',x:200,y:272,r:22,h:-6}]},
  spine:[{x:704,y:485},{x:540,y:478},{x:430,y:392},{x:230,y:252}],
  waters:[{x:330,y:520,rx:116,ry:76,rot:0,pond:true},{x:403,y:475,rx:17,ry:10,rot:-0.69,creek:true},{x:424,y:457,rx:17,ry:10,rot:-0.69,creek:true},{x:446,y:439,rx:17,ry:10,rot:-0.69,creek:true},{x:468,y:421,rx:17,ry:10,rot:-0.69,creek:true},{x:480,y:396,rx:17,ry:10,rot:-1.12,creek:true},{x:492,y:371,rx:17,ry:10,rot:-1.12,creek:true},{x:504,y:345,rx:17,ry:10,rot:-1.12,creek:true}], /* creek snakes across the dogleg corner */
  bunkers:[{x:300,y:340,rx:24,ry:16,rot:0.5},{x:290,y:216,rx:20,ry:14,rot:0.3}],
  trees:[{x:620,y:430,r:30,kind:'pine'},{x:520,y:400,r:26,kind:'pine'},{x:430,y:300,r:30},{x:360,y:260,r:26,kind:'pine'},{x:300,y:430,r:28},{x:160,y:340,r:26}]},

 /* 3 — Golden Bell · P3 · wedge par3 over the creek; strong L→R green slope */
 {name:'Golden Bell', par:3, windMax:10, tee:{x:338,y:403}, fw:54, fwSlope:{dx:-0.4,dy:0.4,s:0.33}, pin:{x:560,y:300}, windDir:1.2,
  green:{lobes:[{x:560,y:300,r:56},{x:518,y:280,r:44},{x:602,y:280,r:44},{x:560,y:348,r:40}],
         slope:{dx:0.95,dy:0.0,s:0.5}, flat:{r:26,f:0.45},                       /* hard L→R tilt */
         features:[{type:'ridge',x:560,y:300,dx:0,dy:1,h:7,w:22},
                   {type:'bowl',x:530,y:300,r:24,h:8},{type:'bowl',x:596,y:300,r:22,h:-6}]},
  spine:[{x:338,y:403},{x:448,y:352},{x:558,y:302}],
  waters:[], /* creek removed */
  bunkers:[{x:560,y:400,rx:24,ry:16,rot:0},{x:620,y:334,rx:20,ry:14,rot:-0.3}],
  trees:[{x:340,y:340,r:28,kind:'pine'},{x:300,y:500,r:26},{x:660,y:260,r:30},{x:680,y:400,r:28,kind:'pine'},{x:780,y:320,r:26,kind:'pine'},{x:230,y:360,r:24}]},

 /* 4 — Azalea Bend · P5 · drive, mid-iron LAYUP short of the creek OR hero carry, then wedge in */
 {name:'Azalea Bend', par:4, windMax:10, tee:{x:810,y:150}, fw:52, fwSlope:{dx:0.6,dy:0.5,s:0.62}, teeDown:36, crossTilt:24, pin:{x:215,y:445}, windDir:2.6,
  green:{lobes:[{x:215,y:445,r:52},{x:185,y:411,r:40},{x:260,y:415,r:38},{x:220,y:489,r:36}],
         slope:{dx:0.4,dy:0.5,s:0.34}, flat:{r:26,f:0.45},
         features:[{type:'tier',x:232,y:425,dx:0.4,dy:0.5,h:11,w:22},
                   {type:'bowl',x:205,y:465,r:24,h:7}]},
  spine:[{x:810,y:150},{x:560,y:170},{x:330,y:230},{x:235,y:360},{x:215,y:445}],
  slopeZones:[{x:430,y:285,r:130,dx:0.7,dy:0.55,s:0.95},{x:300,y:330,r:110,dx:0.72,dy:0.5,s:0.9}],
  waters:[{x:630,y:400,rx:315,ry:165,rot:0,pond:true}], /* GIANT lake filling the RIGHT side; the diagonal corner cut must carry it, fairway stays left */
  bunkers:[{x:380,y:210,rx:48,ry:32,rot:0.3},{x:255,y:300,rx:22,ry:15,rot:-0.3}], /* large bunker in the middle of the fairway */
  trees:[{x:770,y:90,r:28,kind:'pine'},{x:640,y:95,r:28,kind:'pine'},{x:510,y:100,r:28,kind:'pine'},{x:390,y:115,r:26,kind:'pine'},{x:150,y:250,r:28,kind:'pine'},{x:140,y:340,r:28,kind:'pine'},{x:150,y:430,r:30,kind:'pine'},{x:180,y:510,r:28,kind:'pine'},{x:300,y:150,r:24,kind:'pine'}]},

 /* 5 — Chinese Fir · P4 · short, tight: position iron off tee, then a delicate wedge to a narrow green */
 {name:'Chinese Fir', par:4, windMax:8, tee:{x:217,y:304}, fw:48, fwSlope:{dx:-0.35,dy:-0.45,s:0.35}, pin:{x:760,y:330}, windDir:3.0,
  green:{lobes:[{x:760,y:330,r:54},{x:760,y:282,r:40},{x:760,y:388,r:40}],      /* tall narrow */
         slope:{dx:-0.2,dy:0.0,s:0.3}, flat:{r:24,f:0.42},
         features:[{type:'ridge',x:760,y:330,dx:0,dy:1,h:9,w:20},
                   {type:'bowl',x:760,y:302,r:22,h:7},{type:'bowl',x:760,y:368,r:22,h:-6}]},
  spine:[{x:217,y:304},{x:400,y:312},{x:760,y:330}],
  waters:[{x:465,y:485,rx:116,ry:82,rot:0,pond:true},{x:471,y:233,rx:17,ry:10,rot:1.77,creek:true},{x:466,y:260,rx:17,ry:10,rot:1.77,creek:true},{x:460,y:287,rx:17,ry:10,rot:1.77,creek:true},{x:455,y:315,rx:17,ry:10,rot:1.77,creek:true},{x:457,y:342,rx:17,ry:10,rot:1.48,creek:true},{x:460,y:370,rx:17,ry:10,rot:1.48,creek:true},{x:463,y:398,rx:17,ry:10,rot:1.48,creek:true}], /* creek runs straight across the fairway */
  bunkers:[{x:696,y:330,rx:20,ry:14,rot:0},{x:760,y:440,rx:20,ry:14,rot:0}],
  trees:[{x:320,y:240,r:28,kind:'pine'},{x:360,y:372,r:26,kind:'pine'},{x:600,y:268,r:28,kind:'pine'},{x:600,y:392,r:26,kind:'pine'},{x:680,y:262,r:30},{x:860,y:380,r:24,kind:'pine'}]},

 /* 6 — Firethorn · P5 · big drive, then iron lay-up vs go-for-it over the pond; tucked-right pin */
 {name:'Firethorn', par:5, windMax:10, tee:{x:80,y:430}, fw:56, fwSlope:{dx:0.4,dy:0.35,s:0.32}, pin:{x:846,y:312}, windDir:0.6,
  green:{lobes:[{x:846,y:312,r:60},{x:804,y:274,r:46},{x:804,y:352,r:46},{x:888,y:312,r:42}],
         slope:{dx:-1,dy:0,s:0.3}, flat:{r:30,f:0.48},
         features:[{type:'bowl',x:846,y:312,r:38,h:9},{type:'tier',x:872,y:312,dx:-1,dy:0,h:9,w:18},{type:'bowl',x:810,y:312,r:22,h:-6}]},
  spine:[{x:80,y:430},{x:320,y:400},{x:520,y:350},{x:690,y:322},{x:846,y:314}],
  waters:[{x:610,y:455,rx:82,ry:48,rot:0,pond:true}], /* pond just below the fairway edge as a lateral hazard, fully clear of the fairway */
  bunkers:[{x:360,y:356,rx:26,ry:15,rot:0.4},{x:790,y:214,rx:24,ry:16,rot:0.3}],
  trees:[{x:200,y:330,r:30,kind:'pine'},{x:280,y:480,r:28},{x:460,y:280,r:30},{x:540,y:300,r:26,kind:'pine'},{x:560,y:430,r:28,kind:'pine'},{x:660,y:200,r:30},{x:120,y:520,r:24}]},

 /* 7 — Redbud · P3 · the LONG hero par3 (~205yd): iron/topspin runner; water left + behind */
 {name:'Redbud', par:3, windMax:10, tee:{x:170,y:470}, fw:58, fwSlope:{dx:-0.55,dy:0.1,s:0.34}, pin:{x:510,y:308}, windDir:4.4,
  green:{lobes:[{x:510,y:308,r:56},{x:468,y:346,r:42},{x:552,y:270,r:42},{x:552,y:346,r:40}],
         slope:{dx:0.4,dy:0.9,s:0.24}, flat:{r:30,f:0.5},
         features:[{type:'bowl',x:510,y:310,r:38,h:9},{type:'ridge',x:536,y:308,dx:0.7,dy:-0.7,h:6,w:18}]},
  spine:[{x:170,y:470},{x:340,y:390},{x:508,y:310}],
  waters:[{x:415,y:215,rx:72,ry:54,rot:0,pond:true}], /* big irregular pond guarding the green */
  bunkers:[{x:470,y:404,rx:24,ry:16,rot:0.4},{x:574,y:392,rx:22,ry:15,rot:-0.3}],
  trees:[{x:240,y:380,r:30},{x:280,y:520,r:28,kind:'pine'},{x:720,y:240,r:30},{x:700,y:400,r:28,kind:'pine'},{x:140,y:360,r:26},{x:800,y:300,r:24,kind:'pine'}]},

 /* 8 — Nandina · P4 · SHARP dogleg-right: cut over trees for a wedge, or safe iron around the bend */
 {name:'Nandina', par:4, windMax:7, tee:{x:319,y:457}, fw:52, fwSlope:{dx:0.3,dy:-0.5,s:0.33}, pin:{x:780,y:210}, windDir:5.4,
  green:{lobes:[{x:780,y:210,r:58},{x:738,y:248,r:44},{x:824,y:248,r:44},{x:780,y:160,r:40}],
         slope:{dx:0,dy:0.5,s:0.34}, flat:{r:26,f:0.42},
         features:[{type:'tier',x:780,y:188,dx:0,dy:-1,h:11,w:20},
                   {type:'bowl',x:754,y:230,r:24,h:8},{type:'bowl',x:806,y:230,r:22,h:-6}]},
  spine:[{x:319,y:457},{x:400,y:452},{x:540,y:300},{x:780,y:212}],
  waters:[{x:470,y:392,rx:74,ry:54,rot:0,pond:true}], /* big irregular pond replaces the fairway water */
  bunkers:[],
  trees:[{x:300,y:380,r:34},{x:340,y:500,r:30},{x:360,y:500,r:28,kind:'pine'},{x:560,y:250,r:30,sandMulch:true},{x:700,y:300,r:30,sandMulch:true},{x:716,y:200,r:26},{x:870,y:200,r:26,kind:'pine'},{x:620,y:400,r:26,kind:'pine'}]},

 /* 9 — Holly · P4 · drive, then mid-wedge uphill to a heavily contoured green; deep short-left trap */
 {name:'Holly', par:4, windMax:8, tee:{x:282,y:271}, fw:56, fwSlope:{dx:0.45,dy:0.3,s:0.32}, pin:{x:800,y:430}, windDir:0.8,
  green:{lobes:[{x:800,y:430,r:60},{x:758,y:392,r:46},{x:844,y:392,r:44},{x:800,y:486,r:42}],
         slope:{dx:-0.5,dy:-0.86,s:0.4}, flat:{r:28,f:0.4},
         features:[{type:'tier',x:822,y:404,dx:-0.5,dy:-0.86,h:13,w:22},
                   {type:'ridge',x:776,y:448,dx:0.7,dy:0.7,h:7,w:18},
                   {type:'bowl',x:800,y:432,r:26,h:8},{type:'bowl',x:836,y:430,r:22,h:-6}]},
  spine:[{x:282,y:271},{x:400,y:300},{x:580,y:370},{x:800,y:432}],
  waters:[{x:505,y:515,rx:124,ry:84,rot:0,pond:true},{x:595,y:287,rx:17,ry:10,rot:2.13,creek:true},{x:580,y:311,rx:17,ry:10,rot:2.13,creek:true},{x:565,y:335,rx:17,ry:10,rot:2.13,creek:true},{x:550,y:358,rx:17,ry:10,rot:2.13,creek:true},{x:545,y:386,rx:17,ry:10,rot:1.75,creek:true},{x:540,y:414,rx:17,ry:10,rot:1.75,creek:true},{x:535,y:441,rx:17,ry:10,rot:1.75,creek:true}], /* creek winds across the approach */
  bunkers:[{x:736,y:470,rx:26,ry:16,rot:0.4},{x:866,y:340,rx:20,ry:14,rot:0.2}],
  trees:[{x:300,y:200,r:32},{x:240,y:300,r:28,kind:'pine'},{x:520,y:300,r:30},{x:640,y:430,r:28},{x:860,y:480,r:24,kind:'pine'},{x:560,y:430,r:26}]}
];
/* Volcano Ridge — lava = deadly water. Precision/timing course, wedge-heavy.
   One hole (H5) has an erupting volcano: time the carry over the crater. */
const HOLES3 = [
 /* 1 — Ember Start · P4 · gentle dogleg-right; fairway tilts right toward the lava edge,
        a black bunker on the right catches drives before they tumble off */
 {name:'Ember Start', par:4, windMax:6, tee:{x:250,y:470}, fw:54, pin:{x:744,y:303}, windDir:5.3,
  fwSlope:{dx:0.55,dy:-0.2,s:0.5},
  slopeZones:[{x:600,y:370,r:90,dx:0.8,dy:-0.3,s:0.7}],
  green:{lobes:[{x:800,y:250,r:54},{x:760,y:288,r:42},{x:842,y:288,r:40},{x:800,y:204,r:38}],
         slope:{dx:0.6,dy:0.0,s:0.413}, flat:{r:26,f:0.42},
         features:[{type:'bowl',x:800,y:252,r:32,h:8},{type:'tier',x:800,y:222,dx:0,dy:-1,h:10,w:18},
                   {type:'bowl',x:832,y:282,r:18,h:-6}]},
  spine:[{x:250,y:470},{x:430,y:452},{x:600,y:370},{x:800,y:252}],
  waters:[],
  bunkers:[{x:560,y:420,rx:30,ry:20,rot:0.5},{x:846,y:300,rx:18,ry:13,rot:-0.2}],
  trees:[{x:230,y:520,r:26},{x:300,y:300,r:24}]},

 /* 2 — Obsidian Drop · P3 · all-carry to a long green sloping hard right; miss right = lava,
        two black bunkers guard left as the safe bail */
 {name:'Obsidian Drop', par:3, windMax:9, tee:{x:300,y:300}, fw:50, pin:{x:663,y:301}, windDir:1.2,
  green:{lobes:[{x:610,y:300,r:54},{x:574,y:264,r:40},{x:574,y:336,r:40},{x:650,y:300,r:38}],
         slope:{dx:0.9,dy:0.1,s:0.488}, flat:{r:24,f:0.4},
         features:[{type:'bowl',x:606,y:300,r:34,h:9},{type:'ridge',x:610,y:300,dx:0,dy:1,h:8,w:18}]},
  spine:[{x:300,y:300},{x:455,y:300},{x:610,y:300}],
  waters:[],
  bunkers:[{x:566,y:352,rx:24,ry:16,rot:-0.3},{x:566,y:248,rx:22,ry:15,rot:0.3}],
  trees:[{x:250,y:240,r:26},{x:250,y:360,r:24}]},

 /* 3 — Switchback · P4 · double dogleg (right then left) threading two lava gaps; the
        fairway slopes left on the first leg, right on the second — pick your side */
 {name:'Switchback', par:4, windMax:8, tee:{x:140,y:300}, fw:50, pin:{x:764,y:294}, windDir:0.8,
  fwSlope:{dx:-0.5,dy:0.3,s:0.46},
  slopeZones:[{x:330,y:230,r:80,dx:-0.6,dy:-0.5,s:0.75},{x:670,y:380,r:80,dx:0.7,dy:0.4,s:0.7}],
  green:{lobes:[{x:820,y:330,r:54},{x:780,y:294,r:40},{x:780,y:366,r:40},{x:860,y:330,r:38}],
         slope:{dx:-0.8,dy:0.0,s:0.45}, flat:{r:26,f:0.42},
         features:[{type:'bowl',x:820,y:330,r:32,h:8},{type:'tier',x:846,y:330,dx:-1,dy:0,h:10,w:18},
                   {type:'bowl',x:786,y:330,r:18,h:-6}]},
  spine:[{x:140,y:300},{x:330,y:230},{x:520,y:300},{x:670,y:380},{x:820,y:332}],
  waters:[],
  bunkers:[{x:430,y:248,rx:26,ry:17,rot:0.4},{x:590,y:356,rx:30,ry:18,rot:-0.4},{x:774,y:330,rx:20,ry:14,rot:0.2},{x:754,y:330,rx:16,ry:12,rot:3.1}],
  trees:[{x:120,y:240,r:24},{x:120,y:360,r:24}]},

 /* 4 — Devil's Elbow · P4 · sharp dogleg-LEFT with an erupting volcano on the inside-left of
        the corner; cut close over it for a short approach, or bail right and leave a long one.
        The fairway tilts toward the lava as it bends. */
 {name:"Devil's Elbow", par:4, windMax:8, tee:{x:760,y:470}, fw:48, pin:{x:300,y:250}, windDir:3.0,
  fwSlope:{dx:-0.35,dy:-0.45,s:0.5},
  slopeZones:[{x:540,y:410,r:90,dx:-0.5,dy:0.6,s:0.72}],
  green:{lobes:[{x:300,y:250,r:52},{x:262,y:288,r:40},{x:338,y:288,r:38},{x:300,y:204,r:36}],
         slope:{dx:-0.5,dy:0.6,s:0.465}, flat:{r:24,f:0.4},
         features:[{type:'bowl',x:300,y:252,r:30,h:8},{type:'tier',x:300,y:222,dx:0,dy:-1,h:10,w:18},
                   {type:'bowl',x:330,y:282,r:18,h:-6}]},
  spine:[{x:760,y:470},{x:560,y:430},{x:430,y:350},{x:300,y:252}],
  volcano:{x:520, y:330, r:30, period:6.5},
  waters:[],
  bunkers:[{x:620,y:400,rx:28,ry:18,rot:0.4},{x:380,y:300,rx:24,ry:16,rot:-0.3},{x:262,y:300,rx:18,ry:13,rot:0.2}],
  trees:[{x:820,y:470,r:24},{x:800,y:540,r:24}]},

 /* 5 — The Island · P3 · the signature: a small, severely sloped green completely ringed by
        lava with three black bunkers on the safe side. Hit it or drop. */
 {name:'The Island', par:3, windMax:10, tee:{x:150,y:330}, fw:46, pin:{x:507,y:271}, windDir:0.0,
  islandGreen:true,
  green:{lobes:[{x:560,y:320,r:50},{x:524,y:288,r:36},{x:596,y:288,r:36},{x:560,y:362,r:36}],
         slope:{dx:0.6,dy:0.7,s:0.585}, flat:{r:20,f:0.36},
         features:[{type:'tier',x:560,y:300,dx:0,dy:-1,h:12,w:18},{type:'bowl',x:548,y:336,r:22,h:9},
                   {type:'ridge',x:584,y:300,dx:0.8,dy:0.6,h:8,w:16}]},
  spine:[{x:150,y:330},{x:300,y:328}],
  waters:[],
  bunkers:[{x:512,y:368,rx:22,ry:15,rot:-0.3},{x:604,y:360,rx:20,ry:14,rot:0.3},{x:560,y:268,rx:24,ry:15,rot:0},{x:600,y:367,rx:16,ry:12,rot:0.9}],
  trees:[{x:150,y:250,r:26},{x:150,y:420,r:24}]},

 /* 6 — Crater Rim · P4 · sharp dogleg-LEFT around an erupting crater; cut the corner over
        the eruption for a short approach, or play safe right and leave a long one */
 {name:'Crater Rim', par:4, windMax:8, tee:{x:760,y:480}, fw:50, pin:{x:302,y:302}, windDir:2.2,
  fwSlope:{dx:-0.3,dy:-0.5,s:0.44},
  green:{lobes:[{x:250,y:250,r:54},{x:212,y:288,r:40},{x:288,y:288,r:40},{x:250,y:204,r:38}],
         slope:{dx:-0.5,dy:0.4,s:0.427}, flat:{r:26,f:0.42},
         features:[{type:'bowl',x:250,y:252,r:32,h:8},{type:'tier',x:250,y:222,dx:0,dy:-1,h:10,w:18},
                   {type:'bowl',x:282,y:282,r:18,h:-6}]},
  spine:[{x:760,y:480},{x:560,y:440},{x:430,y:360},{x:250,y:252}],
  volcano:{x:520, y:300, r:30, period:6.0},
  waters:[],
  bunkers:[{x:600,y:380,rx:28,ry:18,rot:0.4},{x:360,y:300,rx:24,ry:16,rot:-0.3},{x:212,y:300,rx:18,ry:13,rot:0.2},{x:198,y:291,rx:16,ry:12,rot:2.5}],
  trees:[{x:820,y:470,r:26},{x:800,y:540,r:24}]},

 /* 7 — Twin Tilt · P4 · fairway crowns then falls away both sides; bunkers on each flank.
        Dogleg-right to a green tilting back-to-front toward the lava short side */
 {name:'Twin Tilt', par:4, windMax:9, tee:{x:270,y:470}, fw:52, pin:{x:740,y:354}, windDir:4.4,
  fwSlope:{dx:0.45,dy:-0.35,s:0.4},
  slopeZones:[{x:600,y:360,r:85,dx:0.7,dy:-0.4,s:0.72}],
  green:{lobes:[{x:780,y:300,r:54},{x:740,y:336,r:42},{x:822,y:336,r:40},{x:780,y:256,r:38}],
         slope:{dx:0.0,dy:0.85,s:0.45}, flat:{r:26,f:0.42},
         features:[{type:'bowl',x:780,y:300,r:32,h:8},{type:'tier',x:780,y:276,dx:0,dy:-1,h:10,w:18},
                   {type:'bowl',x:812,y:330,r:18,h:-6}]},
  spine:[{x:270,y:470},{x:440,y:430},{x:600,y:360},{x:780,y:302}],
  waters:[],
  bunkers:[{x:520,y:410,rx:30,ry:19,rot:0.5},{x:560,y:300,rx:26,ry:16,rot:-0.3},{x:740,y:262,rx:20,ry:14,rot:0.2},{x:780,y:366,rx:16,ry:12,rot:1.6}],
  trees:[{x:250,y:520,r:26},{x:300,y:300,r:24}]},

 /* 8 — Long Fire · P5 · the big risk hole: two carries over lava with a left-sloping fairway;
        bold line cuts the dogleg-left for a chance at two, safe line is three shots */
 {name:'Long Fire', par:5, windMax:10, tee:{x:100,y:180}, fw:52, pin:{x:840,y:506}, windDir:1.1,
  fwSlope:{dx:-0.5,dy:0.35,s:0.42},
  slopeZones:[{x:520,y:300,r:90,dx:-0.6,dy:-0.4,s:0.7},{x:680,y:380,r:80,dx:0.5,dy:0.6,s:0.68}],
  green:{lobes:[{x:840,y:430,r:56},{x:800,y:392,r:44},{x:880,y:392,r:42},{x:840,y:486,r:40}],
         slope:{dx:-0.5,dy:-0.7,s:0.39}, flat:{r:28,f:0.44},
         features:[{type:'tier',x:840,y:404,dx:-0.5,dy:-0.86,h:11,w:20},
                   {type:'bowl',x:814,y:450,r:24,h:8},{type:'bowl',x:866,y:430,r:20,h:-6}]},
  spine:[{x:100,y:180},{x:330,y:240},{x:520,y:300},{x:680,y:380},{x:840,y:432}],
  waters:[],
  bunkers:[{x:430,y:268,rx:30,ry:19,rot:0.4},{x:600,y:356,rx:28,ry:17,rot:-0.3},{x:740,y:420,rx:26,ry:16,rot:0.3},{x:886,y:390,rx:18,ry:13,rot:0.2},{x:800,y:374,rx:16,ry:12,rot:-2.2}],
  trees:[{x:90,y:130,r:26},{x:120,y:250,r:24}]},

 /* 9 — Summit Finish · P3 · long, demanding par 3 to a crowned green sloping front-right
        toward the lava; black bunkers ring the safe back-left */
 {name:'Summit Finish', par:3, windMax:8, tee:{x:240,y:430}, fw:50, pin:{x:733,y:279}, windDir:5.4,
  green:{lobes:[{x:680,y:230,r:54},{x:640,y:268,r:42},{x:722,y:268,r:40},{x:680,y:186,r:38}],
         slope:{dx:0.6,dy:0.6,s:0.488}, flat:{r:24,f:0.4},
         features:[{type:'ridge',x:680,y:230,dx:1,dy:0,h:8,w:18},{type:'tier',x:680,y:206,dx:0,dy:-1,h:11,w:18},
                   {type:'bowl',x:648,y:262,r:18,h:8},{type:'bowl',x:712,y:262,r:18,h:-6}]},
  spine:[{x:240,y:430},{x:460,y:330},{x:680,y:232}],
  waters:[],
  bunkers:[{x:636,y:300,rx:24,ry:16,rot:-0.3},{x:726,y:300,rx:22,ry:15,rot:0.3},{x:680,y:170,rx:20,ry:14,rot:0}],
  trees:[{x:220,y:480,r:26},{x:280,y:360,r:24}]}
];

const HOLES4 = [
 /* 1 — Valley Gate · P4 · gentle opener; smooth right-curving fairway with a maple
        guarding the inside, a boulder mid-fairway forces a placed drive */
 {name:'Valley Gate', par:4, windMax:5, tee:{x:250,y:478}, fw:62, pin:{x:792,y:250}, windDir:5.4,
  fwSlope:{dx:-0.25,dy:0.18,s:0.22},
  green:{lobes:[{x:792,y:250,r:56},{x:752,y:288,r:44},{x:834,y:286,r:42},{x:792,y:202,r:40}],
         slope:{dx:-0.35,dy:0.85,s:0.30}, flat:{r:28,f:0.46},
         features:[{type:'bowl',x:792,y:268,r:30,h:8},{type:'tier',x:792,y:214,dx:0,dy:-1,h:10,w:20},
                   {type:'bowl',x:826,y:280,r:18,h:-5}]},
  spine:[{x:250,y:478},{x:420,y:446},{x:600,y:356},{x:792,y:252}],
  waters:[],
  bunkers:[{x:556,y:404,rx:30,ry:20,rot:0.4},{x:840,y:316,rx:18,ry:13,rot:-0.2}],
  trees:[{x:512,y:300,r:40,kind:'maple'},{x:300,y:330,r:26,kind:'pine'},{x:700,y:170,r:26,kind:'maple'}],
  boulders:[{x:470,y:392,r:13},{x:636,y:312,r:10}]},

 /* 2 — Glacier Bend · P4 · SHARP DOGLEG LEFT around a big weird pond; fairway tilts toward
        the water and runs fast — bail right and you have a long way in, cut the corner over
        the maples for a short approach */
 {name:'Glacier Bend', par:4, windMax:7, tee:{x:230,y:300}, fw:56, pin:{x:300,y:486}, windDir:1.6,
  fwSlope:{dx:0.15,dy:0.6,s:0.5}, fastFw:true,
  slopeZones:[{x:360,y:360,r:110,dx:0.2,dy:0.8,s:0.7}],
  green:{lobes:[{x:300,y:486,r:54},{x:262,y:452,r:42},{x:344,y:452,r:42},{x:300,y:526,r:38}],
         slope:{dx:0.1,dy:-0.7,s:0.34}, flat:{r:26,f:0.44},
         features:[{type:'bowl',x:300,y:486,r:32,h:9},{type:'tier',x:300,y:514,dx:0,dy:1,h:8,w:18}]},
  spine:[{x:230,y:300},{x:430,y:310},{x:450,y:410},{x:360,y:470},{x:300,y:486}],
  waters:[{x:560,y:450,rx:120,ry:90,rot:-0.4,pond:true}],
  bunkers:[{x:392,y:250,rx:24,ry:16,rot:0.3},{x:230,y:452,rx:22,ry:15,rot:-0.4}],
  trees:[{x:470,y:330,r:42,kind:'maple'},{x:392,y:300,r:30,kind:'maple'},{x:170,y:240,r:24,kind:'pine'}],
  boulders:[{x:330,y:392,r:11},{x:250,y:392,r:9}]},

 /* 3 — Cascade · P3 · the WATERFALL hole; a long carry to a shelf green with the falls
        spilling behind it — anything long or thin finds the water. Backspin holds the shelf */
 {name:'Cascade', par:3, windMax:8, tee:{x:200,y:430}, fw:48, pin:{x:606,y:250}, windDir:0.5,
  waterfall:{x:606,y:150,w:150},
  green:{lobes:[{x:606,y:262,r:54},{x:566,y:236,r:38},{x:646,y:236,r:38},{x:606,y:300,r:36}],
         slope:{dx:0.0,dy:0.92,s:0.30}, flat:{r:24,f:0.5},
         features:[{type:'bowl',x:606,y:274,r:30,h:10},{type:'ridge',x:606,y:240,dx:0,dy:-1,h:7,w:16}]},
  spine:[{x:200,y:430},{x:400,y:340},{x:606,y:262}],
  waters:[{x:606,y:150,rx:140,ry:60,rot:0,pond:true},{x:606,y:196,rx:120,ry:30,rot:0,pond:true}],
  bunkers:[{x:556,y:312,rx:24,ry:16,rot:-0.3},{x:656,y:308,rx:22,ry:15,rot:0.3}],
  trees:[{x:250,y:330,r:28,kind:'maple'},{x:760,y:240,r:28,kind:'pine'},{x:730,y:330,r:26,kind:'maple'}],
  boulders:[{x:520,y:300,r:10},{x:690,y:300,r:11},{x:470,y:340,r:8}]},

 /* 4 — Rolling Pines · P4 · very hilly; fairway slopes toward a pond on the right and runs
        fast, the ball chases toward the water. Hold a draw up the high left side */
 {name:'Rolling Pines', par:4, windMax:7, tee:{x:230,y:470}, fw:60, pin:{x:800,y:300}, windDir:5.0,
  fwSlope:{dx:0.5,dy:0.25,s:0.5}, fastFw:true,
  slopeZones:[{x:560,y:380,r:120,dx:0.85,dy:0.2,s:0.7}],
  green:{lobes:[{x:800,y:300,r:54},{x:762,y:266,r:42},{x:838,y:266,r:40},{x:800,y:352,r:38}],
         slope:{dx:-0.3,dy:-0.4,s:0.32}, flat:{r:26,f:0.44},
         features:[{type:'bowl',x:800,y:300,r:32,h:8},{type:'bowl',x:834,y:330,r:18,h:-6}]},
  spine:[{x:230,y:470},{x:430,y:440},{x:600,y:380},{x:800,y:302}],
  waters:[{x:600,y:520,rx:150,ry:88,rot:0.2,pond:true}],
  bunkers:[{x:520,y:430,rx:28,ry:18,rot:0.4},{x:842,y:300,rx:18,ry:13,rot:-0.2}],
  trees:[{x:470,y:360,r:40,kind:'maple'},{x:300,y:330,r:30,kind:'pine'},{x:690,y:250,r:28,kind:'maple'}],
  boulders:[{x:560,y:420,r:12},{x:640,y:360,r:10}]},

 /* 5 — Boulder Run · P4 · a hilly fairway studded with dark boulders; the short grass spills
        toward a long pond left and runs fast. Pick a side and shape it in */
 {name:'Boulder Run', par:4, windMax:8, tee:{x:250,y:300}, fw:58, pin:{x:792,y:330}, windDir:0.4,
  fwSlope:{dx:-0.2,dy:0.5,s:0.46}, fastFw:true,
  slopeZones:[{x:520,y:300,r:120,dx:-0.3,dy:0.85,s:0.6}],
  green:{lobes:[{x:792,y:330,r:54},{x:754,y:300,r:42},{x:830,y:300,r:40},{x:792,y:382,r:38}],
         slope:{dx:-0.2,dy:-0.5,s:0.30}, flat:{r:26,f:0.46},
         features:[{type:'bowl',x:792,y:330,r:32,h:8},{type:'tier',x:792,y:300,dx:0,dy:-1,h:9,w:18}]},
  spine:[{x:250,y:300},{x:440,y:300},{x:620,y:330},{x:792,y:332}],
  waters:[{x:470,y:470,rx:160,ry:80,rot:-0.2,pond:true}],
  bunkers:[{x:600,y:392,rx:26,ry:17,rot:0.3},{x:836,y:362,rx:18,ry:13,rot:-0.2}],
  trees:[{x:560,y:248,r:38,kind:'maple'},{x:300,y:240,r:26,kind:'pine'},{x:700,y:410,r:26,kind:'maple'}],
  boulders:[{x:430,y:300,r:13},{x:520,y:320,r:11},{x:610,y:330,r:10},{x:480,y:280,r:8}]},

 /* 6 — High Meadow · P3 · a calm one-shotter to a crowned green ringed by light bunkers;
        smooth target but the crown sheds anything not flown to the heart */
 {name:'High Meadow', par:3, windMax:9, tee:{x:300,y:470}, fw:48, pin:{x:640,y:270}, windDir:4.6,
  green:{lobes:[{x:640,y:270,r:56},{x:600,y:300,r:40},{x:680,y:300,r:40},{x:640,y:228,r:38}],
         slope:{dx:0.0,dy:0.2,s:0.22}, flat:{r:22,f:0.4},
         features:[{type:'bowl',x:640,y:262,r:20,h:-7},{type:'bowl',x:640,y:296,r:24,h:8}]},
  spine:[{x:300,y:470},{x:470,y:370},{x:640,y:272}],
  waters:[],
  bunkers:[{x:592,y:330,rx:24,ry:16,rot:-0.3},{x:688,y:330,rx:24,ry:16,rot:0.3},{x:640,y:214,rx:22,ry:14,rot:0}],
  trees:[{x:360,y:330,r:28,kind:'maple'},{x:760,y:240,r:26,kind:'pine'},{x:520,y:250,r:26,kind:'maple'}],
  boulders:[{x:470,y:340,r:10}]},

 /* 7 — Maple Mile · P5 · the long one; a smooth S of fairway with maples pinching the second
        landing zone and boulders in the lay-up. Three good shots, each on an angle */
 {name:'Maple Mile', par:5, windMax:7, tee:{x:160,y:486}, fw:58, pin:{x:820,y:250}, windDir:5.6,
  fwSlope:{dx:-0.2,dy:0.18,s:0.24},
  green:{lobes:[{x:820,y:250,r:54},{x:782,y:284,r:42},{x:858,y:284,r:38},{x:820,y:204,r:38}],
         slope:{dx:-0.3,dy:0.8,s:0.30}, flat:{r:26,f:0.46},
         features:[{type:'bowl',x:820,y:266,r:30,h:8},{type:'tier',x:820,y:216,dx:0,dy:-1,h:10,w:18}]},
  spine:[{x:160,y:486},{x:360,y:430},{x:520,y:360},{x:680,y:320},{x:820,y:252}],
  waters:[{x:430,y:540,rx:120,ry:60,rot:0.2,pond:true}],
  bunkers:[{x:470,y:392,rx:28,ry:18,rot:0.4},{x:660,y:372,rx:24,ry:16,rot:-0.3},{x:856,y:312,rx:18,ry:13,rot:0.2}],
  trees:[{x:560,y:300,r:42,kind:'maple'},{x:620,y:360,r:34,kind:'maple'},{x:300,y:360,r:28,kind:'pine'},{x:740,y:250,r:28,kind:'maple'}],
  boulders:[{x:400,y:400,r:12},{x:520,y:360,r:11},{x:600,y:330,r:9}]},

 /* 8 — Aspen Carry · P4 · SHARP DOGLEG RIGHT around a big pond; the aggressive line carries
        the water off the tee, the safe line leaves a long approach over a boulder field */
 {name:'Aspen Carry', par:4, windMax:8, tee:{x:230,y:300}, fw:56, pin:{x:330,y:480}, windDir:1.5,
  green:{lobes:[{x:330,y:480,r:54},{x:292,y:446,r:42},{x:372,y:446,r:42},{x:330,y:520,r:38}],
         slope:{dx:-0.1,dy:-0.7,s:0.32}, flat:{r:26,f:0.44},
         features:[{type:'bowl',x:330,y:480,r:32,h:9},{type:'tier',x:330,y:508,dx:0,dy:1,h:8,w:18}]},
  spine:[{x:230,y:300},{x:480,y:280},{x:620,y:300},{x:680,y:430},{x:500,y:520},{x:330,y:490}],
  waters:[{x:516,y:426,rx:138,ry:92,rot:0.4,pond:true}],
  bunkers:[{x:430,y:250,rx:24,ry:16,rot:0.3},{x:250,y:446,rx:22,ry:15,rot:-0.4}],
  trees:[{x:400,y:230,r:34,kind:'maple'},{x:560,y:250,r:30,kind:'maple'},{x:170,y:360,r:24,kind:'pine'}],
  boulders:[{x:280,y:392,r:12},{x:340,y:430,r:10},{x:300,y:360,r:8}]},

 /* 9 — Falls Finish · P4 · grand closer back toward the falls; a hilly fairway sloping toward
        a big pond on the left, fast turf, with a maple sentinel guarding the green's left edge */
 {name:'Falls Finish', par:4, windMax:9, tee:{x:230,y:480}, fw:60, pin:{x:800,y:300}, windDir:5.2,
  fwSlope:{dx:-0.45,dy:0.2,s:0.46}, fastFw:true,
  slopeZones:[{x:560,y:360,r:120,dx:-0.85,dy:0.2,s:0.65}],
  waterfall:{x:870,y:180,w:120},
  green:{lobes:[{x:800,y:300,r:56},{x:760,y:266,r:42},{x:838,y:268,r:40},{x:800,y:352,r:38}],
         slope:{dx:0.2,dy:-0.3,s:0.30}, flat:{r:26,f:0.46},
         features:[{type:'bowl',x:800,y:312,r:30,h:8},{type:'tier',x:800,y:268,dx:0,dy:-1,h:10,w:18}]},
  spine:[{x:230,y:480},{x:400,y:425},{x:610,y:370},{x:800,y:302}],
  waters:[{x:470,y:520,rx:150,ry:84,rot:-0.2,pond:true},{x:870,y:180,rx:120,ry:54,rot:0,pond:true}],
  bunkers:[{x:560,y:420,rx:28,ry:18,rot:0.4},{x:838,y:330,rx:18,ry:13,rot:-0.2}],
  trees:[{x:744,y:300,r:42,kind:'maple'},{x:470,y:360,r:34,kind:'maple'},{x:300,y:330,r:28,kind:'pine'}],
  boulders:[{x:520,y:400,r:12},{x:620,y:350,r:10}]}
];

/* ============================================================================
   THE GLADES — Golden Snail Tour, course 1.  Par 34, 9 holes.
   A lush emerald wetland: serpentine fairways, sprawling greens, and water
   everywhere — winding creeks, kidney lagoons, and island approaches. New
   trees: weeping willows and swamp cypress. Difficulty ~7/10: no straight
   shots, forced carries, fast tilting greens, and tight water-guarded lines.
   Par run: 4,4,3,5,4,4,3,4,3 = 34
   ============================================================================ */
const HOLES5 = [
 /* 1 — Mire Gate · P4 · a gentle-looking opener that curls right around a long
        lagoon; the fairway tilts toward the water so a lazy drive feeds wet.
        Huge boomerang green tilts back-to-front. */
 {name:'Mire Gate', par:4, windMax:6, tee:{x:150,y:500}, fw:70, pin:{x:792,y:250}, windDir:0.6,
  fwSlope:{dx:0.35,dy:0.4,s:0.4},
  slopeZones:[{x:470,y:420,r:130,dx:0.5,dy:0.55,s:0.6}],
  green:{lobes:[{x:792,y:250,r:96},{x:720,y:300,r:74},{x:858,y:300,r:70},{x:792,y:196,r:60}], /* sprawling boomerang */
         slope:{dx:-0.3,dy:0.9,s:0.26}, flat:{r:34,f:0.42},
         features:[{type:'bowl',x:792,y:262,r:40,h:9},
                   {type:'tier',x:792,y:200,dx:0,dy:-1,h:11,w:24},
                   {type:'bowl',x:856,y:296,r:30,h:-6}]},
  spine:[{x:150,y:500},{x:330,y:470},{x:500,y:420},{x:650,y:340},{x:792,y:252}],
  waters:[{x:470,y:560,rx:170,ry:74,rot:-0.18,pond:true}],
  bunkers:[{x:632,y:392,rx:40,ry:24,rot:-0.5}],
  trees:[{x:300,y:300,r:44,kind:'willow'},{x:560,y:250,r:30,kind:'cypress'},{x:880,y:160,r:30,kind:'willow'},{x:160,y:330,r:26,kind:'cypress'}]},

 /* 2 — Serpent's Coil · P4 · a true S-curve: dogleg right then back left around two
        ponds, the fairway snaking between them. Fast sidehill tilt. Big green with a
        spine ridge splitting two pin shelves. */
 {name:"Serpent's Coil", par:4, windMax:8, tee:{x:140,y:300}, fw:58, pin:{x:760,y:430}, windDir:2.2,
  fwSlope:{dx:0.2,dy:-0.2,s:0.36}, fastFw:true,
  slopeZones:[{x:380,y:250,r:110,dx:0.6,dy:0.3,s:0.7},{x:560,y:430,r:120,dx:-0.4,dy:-0.5,s:0.62}],
  green:{lobes:[{x:760,y:430,r:92},{x:700,y:382,r:64},{x:818,y:382,r:64},{x:760,y:486,r:56}], /* large clover */
         slope:{dx:0.2,dy:-0.5,s:0.3}, flat:{r:30,f:0.42},
         features:[{type:'ridge',x:760,y:420,dx:1,dy:0.1,h:8,w:20},   /* dividing spine */
                   {type:'bowl',x:716,y:424,r:30,h:7},
                   {type:'bowl',x:806,y:424,r:30,h:6},
                   {type:'tier',x:760,y:480,dx:0,dy:1,h:7,w:20}]},
  spine:[{x:140,y:300},{x:300,y:250},{x:430,y:280},{x:520,y:360},{x:560,y:440},{x:650,y:450},{x:760,y:432}],
  waters:[{x:380,y:400,rx:96,ry:70,rot:0.3,pond:true},{x:560,y:200,rx:88,ry:60,rot:-0.3,pond:true}],
  bunkers:[{x:470,y:200,rx:34,ry:22,rot:0.4},{x:630,y:520,rx:32,ry:20,rot:-0.3}],
  trees:[{x:300,y:430,r:42,kind:'willow'},{x:470,y:330,r:28,kind:'cypress'},{x:660,y:300,r:34,kind:'willow'},{x:160,y:200,r:26,kind:'cypress'},{x:880,y:300,r:30,kind:'willow'}]},

 /* 3 — Lily Pad · P3 · a long island-ish par 3 over a lagoon to a wide, shallow green
        ringed by water on three sides. Wind matters. Backspin or you skip off the back. */
 {name:'Lily Pad', par:3, windMax:7, tee:{x:285,y:440}, fw:60, pin:{x:640,y:300}, windDir:-0.6,
  green:{lobes:[{x:640,y:300,r:82},{x:576,y:300,r:56},{x:704,y:300,r:56}], /* wide shallow ribbon */
         slope:{dx:0,dy:-0.5,s:0.26}, flat:{r:30,f:0.46},
         features:[{type:'bowl',x:640,y:300,r:40,h:7},
                   {type:'tier',x:578,y:300,dx:-1,dy:0,h:6,w:16},
                   {type:'tier',x:702,y:300,dx:1,dy:0,h:6,w:16}]},
  spine:[{x:285,y:440},{x:460,y:370},{x:640,y:302}],
  waters:[{x:640,y:300,rx:210,ry:150,rot:0,pond:true}],  /* big surrounding lagoon (green sits on its isle) */
  bunkers:[],
  trees:[{x:240,y:250,r:40,kind:'willow'},{x:300,y:500,r:30,kind:'cypress'},{x:860,y:340,r:36,kind:'willow'},{x:840,y:160,r:28,kind:'cypress'}]},

 /* 4 — The Long Marsh · P5 · a sweeping double dogleg three-shotter; a creek snakes the
        whole left side, two ponds pinch the layup zone. Reachable only with two perfect
        curving shots. Enormous tiered green. */
 {name:'The Long Marsh', par:5, windMax:9, tee:{x:120,y:520}, fw:64, pin:{x:840,y:150}, windDir:1.5,
  fwSlope:{dx:-0.2,dy:-0.25,s:0.34},
  slopeZones:[{x:430,y:430,r:120,dx:-0.3,dy:0.5,s:0.55},{x:680,y:280,r:120,dx:0.4,dy:-0.4,s:0.6}],
  green:{lobes:[{x:840,y:150,r:100},{x:782,y:200,r:72},{x:898,y:200,r:68},{x:840,y:104,r:58}], /* giant tiered shelf */
         slope:{dx:0.25,dy:-0.7,s:0.3}, flat:{r:32,f:0.42},
         features:[{type:'tier',x:840,y:112,dx:0.2,dy:-0.98,h:13,w:30},  /* back upper shelf */
                   {type:'bowl',x:806,y:196,r:34,h:7},                    /* front-left collect */
                   {type:'bowl',x:874,y:196,r:30,h:-6},                   /* right crown */
                   {type:'ridge',x:840,y:160,dx:0.7,dy:-0.7,h:-5,w:18}]}, /* drain seam */
  spine:[{x:120,y:520},{x:280,y:480},{x:420,y:430},{x:520,y:360},{x:620,y:300},{x:720,y:240},{x:840,y:152}],
  waters:[{x:230,y:340,rx:60,ry:150,rot:0.25,pond:true},{x:520,y:480,rx:90,ry:56,rot:-0.3,pond:true},{x:700,y:380,rx:70,ry:48,rot:0.4,pond:true}],
  bunkers:[{x:430,y:340,rx:36,ry:22,rot:0.4},{x:760,y:300,rx:32,ry:20,rot:-0.5},{x:900,y:250,rx:30,ry:18,rot:0.3}],
  trees:[{x:340,y:300,r:44,kind:'willow'},{x:560,y:430,r:30,kind:'cypress'},{x:620,y:200,r:36,kind:'willow'},{x:200,y:500,r:28,kind:'cypress'},{x:720,y:140,r:30,kind:'willow'},{x:920,y:360,r:28,kind:'cypress'}]},

 /* 5 — Switchback · P4 · sharp dogleg LEFT that bends almost 90°; cut the corner over a
        cypress stand and a creek for a short approach, or play safe right to a longer one.
        Punchbowl green gathers good shots, repels timid ones. */
 {name:'Switchback', par:4, windMax:8, tee:{x:820,y:500}, fw:58, pin:{x:230,y:200}, windDir:3.6,
  fwSlope:{dx:0.25,dy:0.2,s:0.34}, fastFw:true,
  slopeZones:[{x:520,y:430,r:120,dx:-0.5,dy:0.2,s:0.6}],
  green:{lobes:[{x:230,y:200,r:90},{x:288,y:248,r:64},{x:172,y:248,r:64},{x:230,y:150,r:54}], /* big punchbowl */
         slope:{dx:0.1,dy:0.5,s:0.24}, flat:{r:32,f:0.5},
         features:[{type:'bowl',x:230,y:212,r:46,h:12},   /* deep gather bowl — feeds the pin */
                   {type:'bowl',x:230,y:158,r:26,h:-6}]},
  spine:[{x:820,y:500},{x:660,y:470},{x:520,y:430},{x:430,y:360},{x:360,y:280},{x:230,y:202}],
  waters:[{x:560,y:300,rx:120,ry:64,rot:-0.3,pond:true}],
  bunkers:[{x:430,y:450,rx:34,ry:22,rot:0.4},{x:300,y:300,rx:28,ry:18,rot:-0.4}],
  trees:[{x:520,y:360,r:46,kind:'cypress'},{x:560,y:430,r:32,kind:'cypress'},{x:620,y:250,r:36,kind:'willow'},{x:340,y:430,r:30,kind:'willow'},{x:160,y:360,r:28,kind:'cypress'}]},

 /* 6 — Bayou Bend · P4 · a gentle reverse-C that hugs a long creek down the right; the
        green juts onto a peninsula. Approach must hold a green that runs hard to the water. */
 {name:'Bayou Bend', par:4, windMax:7, tee:{x:160,y:300}, fw:60, pin:{x:760,y:360}, windDir:5.0,
  fwSlope:{dx:0.15,dy:0.45,s:0.36},
  slopeZones:[{x:760,y:360,r:120,dx:0.5,dy:0.4,s:0.55}],
  green:{lobes:[{x:760,y:360,r:88},{x:712,y:316,r:60},{x:808,y:404,r:58},{x:760,y:420,r:52}], /* peninsula green */
         slope:{dx:0.45,dy:0.55,s:0.32}, flat:{r:30,f:0.42},
         features:[{type:'bowl',x:740,y:344,r:32,h:8},      /* safe upper-left collect */
                   {type:'tier',x:806,y:404,dx:0.7,dy:0.7,h:-7,w:18}]}, /* runs to water — danger shelf */
  spine:[{x:160,y:300},{x:320,y:300},{x:460,y:340},{x:560,y:400},{x:660,y:400},{x:760,y:362}],
  waters:[{x:620,y:520,rx:200,ry:80,rot:0.1,pond:true},{x:860,y:430,rx:80,ry:90,rot:0.2,pond:true}],
  bunkers:[{x:470,y:260,rx:34,ry:22,rot:0.4},{x:700,y:300,rx:28,ry:18,rot:-0.3}],
  trees:[{x:320,y:430,r:44,kind:'willow'},{x:460,y:240,r:30,kind:'cypress'},{x:560,y:300,r:34,kind:'willow'},{x:160,y:430,r:28,kind:'cypress'},{x:880,y:260,r:30,kind:'willow'}]},

 /* 7 — Toadstool · P3 · short but mean: a tiny target perched above a horseshoe of water,
        with a steeply crowned green that sheds everything but the purest strike. */
 {name:'Toadstool', par:3, windMax:9, tee:{x:480,y:470}, fw:58, pin:{x:560,y:250}, windDir:0.4,
  green:{lobes:[{x:560,y:250,r:74},{x:520,y:286,r:48},{x:600,y:286,r:48}], /* crowned mushroom */
         slope:{dx:0,dy:0.6,s:0.36}, flat:{r:22,f:0.4},
         features:[{type:'bowl',x:560,y:252,r:24,h:-9},     /* domed crown — repels */
                   {type:'bowl',x:524,y:292,r:26,h:7},       /* front-left chance */
                   {type:'bowl',x:598,y:292,r:26,h:7}]},      /* front-right chance */
  spine:[{x:480,y:470},{x:520,y:360},{x:560,y:252}],
  waters:[{x:560,y:410,rx:140,ry:44,rot:0,pond:true},{x:740,y:250,rx:58,ry:60,rot:0.2,pond:true}],
  bunkers:[{x:640,y:230,rx:26,ry:18,rot:-0.4}],
  trees:[{x:300,y:300,r:42,kind:'willow'},{x:760,y:300,r:36,kind:'willow'},{x:340,y:470,r:28,kind:'cypress'},{x:720,y:200,r:28,kind:'cypress'}]},

 /* 8 — Quagmire · P4 · the toughest hole: a tight serpentine through marsh with water on
        both sides of a narrow ribbon fairway, then a forced carry to a long angled green.
        Bail-out is short of the green; long is wet. */
 {name:'Quagmire', par:4, windMax:9, tee:{x:130,y:480}, fw:48, pin:{x:820,y:300}, windDir:1.8,
  fwSlope:{dx:0.1,dy:-0.2,s:0.32}, fastFw:true,
  slopeZones:[{x:420,y:380,r:110,dx:0.2,dy:-0.5,s:0.6}],
  green:{lobes:[{x:820,y:300,r:84},{x:776,y:256,r:58},{x:864,y:344,r:58},{x:820,y:360,r:50}], /* long angled */
         slope:{dx:0.4,dy:0.4,s:0.3}, flat:{r:28,f:0.42},
         features:[{type:'tier',x:780,y:256,dx:-0.7,dy:-0.7,h:9,w:20},  /* back shelf */
                   {type:'bowl',x:820,y:312,r:30,h:7},
                   {type:'ridge',x:840,y:330,dx:0.7,dy:0.7,h:-5,w:16}]},
  spine:[{x:130,y:480},{x:280,y:440},{x:420,y:380},{x:500,y:300},{x:600,y:260},{x:710,y:280},{x:820,y:302}],
  waters:[{x:300,y:300,rx:80,ry:90,rot:0.2,pond:true},{x:520,y:460,rx:110,ry:60,rot:-0.2,pond:true},{x:630,y:160,rx:70,ry:50,rot:0.3,pond:true}],
  bunkers:[{x:600,y:340,rx:30,ry:20,rot:0.4},{x:860,y:240,rx:26,ry:18,rot:-0.4}],
  trees:[{x:300,y:430,r:42,kind:'cypress'},{x:420,y:250,r:30,kind:'willow'},{x:600,y:200,r:34,kind:'cypress'},{x:200,y:360,r:26,kind:'willow'},{x:900,y:380,r:30,kind:'cypress'}]},

 /* 9 — Emerald Finish · P3 · a grand closing par 3 across a wide lagoon to a massive
        three-tier green backed by willows; flag is on the upper tier — go long into the
        slope and feed back, or come up short and three-putt the climb. */
 {name:'Emerald Finish', par:3, windMax:8, tee:{x:260,y:330}, fw:62, pin:{x:720,y:300}, windDir:-0.8,
  green:{lobes:[{x:720,y:300,r:104},{x:660,y:300,r:72},{x:780,y:300,r:72},{x:720,y:226,r:60}], /* enormous 3-tier */
         slope:{dx:0,dy:-0.7,s:0.32}, flat:{r:34,f:0.42},
         features:[{type:'tier',x:720,y:236,dx:0,dy:-1,h:13,w:30},   /* upper tier — the pin */
                   {type:'ridge',x:720,y:300,dx:1,dy:0,h:7,w:22},     /* mid step */
                   {type:'bowl',x:720,y:312,r:36,h:6},                 /* mid gather */
                   {type:'bowl',x:660,y:300,r:30,h:5}]},               /* low-left lag */
  spine:[{x:260,y:330},{x:490,y:316},{x:720,y:302}],
  waters:[{x:460,y:380,rx:200,ry:120,rot:0,pond:true}],
  bunkers:[{x:600,y:220,rx:30,ry:20,rot:0.4},{x:840,y:360,rx:28,ry:18,rot:-0.3}],
  trees:[{x:760,y:200,r:48,kind:'willow'},{x:820,y:280,r:40,kind:'willow'},{x:240,y:240,r:34,kind:'cypress'},{x:300,y:470,r:30,kind:'willow'},{x:680,y:170,r:30,kind:'cypress'}]}
];

/* ============================================================================
   MIRAGE DUNES — Sunrise Tour, course 3.  Par 34, 9 holes.
   Bright sun-baked eucalyptus country: vivid lime fairways, towering gum trees,
   sweeping water, and the BIGGEST greens on tour (3-4x normal). Built around
   strategy: long doglegs, two genuine DOUBLE fairways (safe route vs bold route),
   forced-carry fairway ISLANDS you must lay up to, and slopes that feed off into
   water and sand. Generous off the tee, punishing if greedy.
   Par run: 4,5,3,4,4,5,3,4,2 = 34
   ============================================================================ */
const HOLES6 = [
 /* 1 — First Light · P4 · a friendly wide opener with a gentle right bend, easing the
        player into the huge greens. A vast triple-lobed green tilts gently front-to-back. */
 {name:'First Light', par:4, windMax:6, tee:{x:150,y:470}, fw:80, pin:{x:770,y:250}, windDir:0.5,
  fwSlope:{dx:0.2,dy:-0.2,s:0.3},
  green:{lobes:[{x:770,y:250,r:150},{x:660,y:300,r:110},{x:880,y:300,r:110},{x:770,y:150,r:96}], /* GIANT */
         slope:{dx:0,dy:0.7,s:0.2}, flat:{r:60,f:0.4},
         features:[{type:'bowl',x:770,y:262,r:64,h:9},
                   {type:'tier',x:770,y:160,dx:0,dy:-1,h:12,w:40},
                   {type:'ridge',x:770,y:300,dx:1,dy:0,h:6,w:34}]},
  spine:[{x:150,y:470},{x:360,y:440},{x:560,y:360},{x:770,y:252}],
  waters:[{x:470,y:540,rx:150,ry:54,rot:-0.1,pond:true}],
  bunkers:[{x:640,y:420,rx:42,ry:26,rot:-0.4},{x:840,y:360,rx:34,ry:22,rot:0.3}],
  trees:[{x:300,y:300,r:54,kind:'eucalyptus'},{x:560,y:230,r:46,kind:'eucalyptus'},{x:900,y:170,r:48,kind:'eucalyptus'},{x:180,y:330,r:38,kind:'eucalyptus'}]},

 /* 2 — The Fork · P5 · the first DOUBLE FAIRWAY, now a brute. A long three-shotter from the
        deep corner: the LEFT fairway is the safe, winding long way around two lakes; the RIGHT
        fairway is a heroic double-water carry that can set up reaching the giant green in two,
        but misjudge it and you reload. Sand guards the green on both sides. */
 {name:'The Fork', par:5, windMax:9, tee:{x:90,y:560}, fw:58, pin:{x:850,y:180}, windDir:1.4,
  fwSlope:{dx:0.2,dy:-0.2,s:0.3},
  slopeZones:[{x:380,y:450,r:150,dx:-0.45,dy:0.4,s:0.55}],  /* left route slopes toward the lake */
  green:{lobes:[{x:850,y:180,r:150},{x:740,y:240,r:108},{x:910,y:270,r:100},{x:850,y:96,r:88}], /* GIANT angled */
         slope:{dx:0.2,dy:-0.6,s:0.24}, flat:{r:54,f:0.4},
         features:[{type:'tier',x:850,y:108,dx:0.2,dy:-0.98,h:14,w:42},
                   {type:'bowl',x:780,y:240,r:50,h:8},
                   {type:'bowl',x:902,y:266,r:42,h:-6},
                   {type:'ridge',x:850,y:200,dx:0.7,dy:-0.7,h:-5,w:20}]},  /* drain seam */
  spine:[{x:90,y:560},{x:230,y:520},{x:340,y:470},{x:430,y:430},{x:520,y:400},{x:620,y:340},{x:720,y:270},{x:850,y:182}], /* LEFT long winding route */
  spine2:[{x:90,y:560},{x:300,y:330},{x:470,y:200},{x:640,y:170},{x:760,y:180},{x:850,y:182}],                            /* RIGHT heroic double carry */
  waters:[{x:380,y:560,rx:170,ry:60,rot:0,pond:true},{x:360,y:380,rx:130,ry:100,rot:0.2,pond:true},{x:600,y:250,rx:110,ry:70,rot:-0.2,pond:true}],
  bunkers:[{x:770,y:300,rx:44,ry:26,rot:-0.4},{x:918,y:340,rx:34,ry:22,rot:0.3},{x:560,y:170,rx:36,ry:22,rot:0.2}],
  trees:[{x:240,y:240,r:52,kind:'eucalyptus'},{x:520,y:500,r:46,kind:'eucalyptus'},{x:700,y:120,r:48,kind:'eucalyptus'},{x:150,y:380,r:40,kind:'eucalyptus'},{x:930,y:200,r:44,kind:'eucalyptus'}]},

 /* 3 — Sundial · P3 · a long one-shotter to an ENORMOUS shallow-wide green; a slope on the
        right feeds timid shots into a waste bunker, a slope back-left feeds into water. */
 {name:'Sundial', par:3, windMax:10, tee:{x:200,y:430}, fw:66, pin:{x:680,y:300}, windDir:-0.5,
  green:{lobes:[{x:680,y:300,r:150},{x:560,y:300,r:104},{x:800,y:300,r:104},{x:680,y:210,r:84}], /* GIANT wide */
         slope:{dx:0.3,dy:0.4,s:0.26}, flat:{r:56,f:0.42},
         features:[{type:'bowl',x:680,y:300,r:60,h:8},
                   {type:'tier',x:680,y:218,dx:0,dy:-1,h:10,w:34},
                   {type:'ridge',x:760,y:330,dx:0.6,dy:0.6,h:-6,w:24},   /* right shed → sand */
                   {type:'ridge',x:600,y:330,dx:-0.6,dy:0.6,h:-6,w:24}]}, /* left shed → water */
  spine:[{x:200,y:430},{x:440,y:370},{x:680,y:302}],
  waters:[{x:540,y:430,rx:120,ry:64,rot:-0.2,pond:true}],
  bunkers:[{x:820,y:400,rx:60,ry:34,rot:0.3}],   /* big waste bunker right */
  trees:[{x:260,y:250,r:52,kind:'eucalyptus'},{x:840,y:220,r:48,kind:'eucalyptus'},{x:300,y:520,r:40,kind:'eucalyptus'},{x:760,y:160,r:42,kind:'eucalyptus'}]},

 /* 4 — Long Tom · P4 · a far, hard dogleg LEFT that sweeps ~80°. The corner is guarded by a
        big lake; bite off as much as you dare. Giant punchbowl green collects the bold line. */
 {name:'Long Tom', par:4, windMax:8, tee:{x:820,y:500}, fw:60, pin:{x:230,y:220}, windDir:3.7,
  fwSlope:{dx:0.25,dy:0.2,s:0.32}, fastFw:true,
  slopeZones:[{x:540,y:430,r:150,dx:-0.5,dy:0.3,s:0.6}],   /* feeds toward the corner lake */
  green:{lobes:[{x:230,y:220,r:148},{x:330,y:270,r:104},{x:150,y:270,r:104},{x:230,y:140,r:88}], /* GIANT punchbowl */
         slope:{dx:0.1,dy:0.5,s:0.22}, flat:{r:56,f:0.5},
         features:[{type:'bowl',x:230,y:232,r:70,h:13},     /* deep gather */
                   {type:'bowl',x:230,y:150,r:34,h:-6}]},
  spine:[{x:820,y:500},{x:650,y:470},{x:520,y:430},{x:420,y:360},{x:330,y:290},{x:230,y:222}],
  waters:[{x:560,y:300,rx:140,ry:78,rot:-0.3,pond:true}],   /* the corner lake */
  bunkers:[{x:430,y:460,rx:38,ry:24,rot:0.4},{x:300,y:330,rx:30,ry:20,rot:-0.3}],
  trees:[{x:560,y:430,r:54,kind:'eucalyptus'},{x:620,y:230,r:46,kind:'eucalyptus'},{x:380,y:470,r:44,kind:'eucalyptus'},{x:160,y:360,r:42,kind:'eucalyptus'}]},

 /* 5 — The Stepping Stones · P4 · a forced-layup ISLAND hole. The drive carries to a single
        grass island in the middle of a wide lake (you can't reach the green in one). From the
        island, a mid-iron to the giant green beyond. Greedy or short drives are wet. */
 {name:'The Stepping Stones', par:4, windMax:9, tee:{x:150,y:330}, fw:60, pin:{x:800,y:300}, windDir:1.2,
  green:{lobes:[{x:800,y:300,r:146},{x:690,y:300,r:104},{x:800,y:200,r:86},{x:800,y:400,r:84}], /* GIANT */
         slope:{dx:0.2,dy:-0.3,s:0.24}, flat:{r:54,f:0.42},
         features:[{type:'bowl',x:790,y:300,r:58,h:8},
                   {type:'tier',x:800,y:208,dx:0,dy:-1,h:10,w:30},
                   {type:'tier',x:800,y:392,dx:0,dy:1,h:8,w:28}]},
  spine:[{x:150,y:330},{x:280,y:330},{x:360,y:330}],   /* short tee fairway up to the lake edge */
  waters:[{x:560,y:330,rx:240,ry:150,rot:0,pond:true}],  /* the big lake the island sits in */
  islands:[{x:540,y:330,rx:66,ry:54,rot:0}],             /* one central layup island in the lake */
  bunkers:[{x:760,y:190,rx:34,ry:22,rot:0.3},{x:760,y:420,rx:32,ry:20,rot:-0.3}],
  trees:[{x:240,y:230,r:52,kind:'eucalyptus'},{x:300,y:470,r:44,kind:'eucalyptus'},{x:900,y:200,r:46,kind:'eucalyptus'},{x:900,y:410,r:44,kind:'eucalyptus'}]},

 /* 6 — Boomerang · P5 · the second DOUBLE FAIRWAY and the longest hole. A grand sweeping
        three-shotter that bends right then left. LEFT route is the long way round a marsh;
        RIGHT route flirts with a waste-sand belt but shortens it. Mammoth tiered green. */
 {name:'Boomerang', par:5, windMax:9, tee:{x:130,y:300}, fw:60, pin:{x:840,y:430}, windDir:1.8,
  fwSlope:{dx:0.15,dy:0.3,s:0.3},
  slopeZones:[{x:520,y:430,r:140,dx:0.4,dy:0.4,s:0.5}],
  green:{lobes:[{x:840,y:430,r:150},{x:730,y:400,r:108},{x:900,y:360,r:100},{x:840,y:520,r:92}], /* GIANT tiered */
         slope:{dx:0.2,dy:-0.5,s:0.26}, flat:{r:56,f:0.4},
         features:[{type:'tier',x:840,y:360,dx:0.2,dy:-0.98,h:13,w:42},
                   {type:'bowl',x:790,y:430,r:54,h:8},
                   {type:'ridge',x:860,y:470,dx:0.6,dy:0.6,h:-6,w:24}]},
  spine:[{x:130,y:300},{x:300,y:280},{x:430,y:320},{x:520,y:420},{x:640,y:470},{x:740,y:460},{x:840,y:432}], /* LEFT long */
  spine2:[{x:130,y:300},{x:340,y:200},{x:560,y:230},{x:720,y:320},{x:840,y:432}],                            /* RIGHT short, over sand */
  waters:[{x:430,y:470,rx:120,ry:70,rot:-0.2,pond:true}],
  bunkers:[{x:480,y:230,rx:80,ry:40,rot:0.2},{x:620,y:260,rx:60,ry:32,rot:-0.2},{x:900,y:470,rx:34,ry:22,rot:0.3}], /* waste belt on the bold line */
  trees:[{x:300,y:430,r:54,kind:'eucalyptus'},{x:560,y:400,r:46,kind:'eucalyptus'},{x:680,y:200,r:48,kind:'eucalyptus'},{x:170,y:200,r:42,kind:'eucalyptus'},{x:920,y:300,r:44,kind:'eucalyptus'}]},

 /* 7 — Heat Haze · P3 · a mid-length par 3 over a diagonal sand waste to a giant green that
        slopes hard off its back edge into a pond — long is dead, short is safe. */
 {name:'Heat Haze', par:3, windMax:9, tee:{x:200,y:470}, fw:60, pin:{x:600,y:280}, windDir:0.3,
  green:{lobes:[{x:600,y:280,r:142},{x:490,y:300,r:100},{x:710,y:300,r:100},{x:600,y:190,r:80}], /* GIANT */
         slope:{dx:0,dy:-0.6,s:0.3}, flat:{r:52,f:0.42},
         features:[{type:'bowl',x:600,y:300,r:56,h:8},
                   {type:'tier',x:600,y:198,dx:0,dy:-1,h:-7,w:30},   /* crowned back → sheds long */
                   {type:'bowl',x:540,y:300,r:34,h:6}]},
  spine:[{x:200,y:470},{x:400,y:380},{x:600,y:282}],
  waters:[{x:600,y:150,rx:130,ry:54,rot:0,pond:true}],   /* behind the green — long is wet */
  bunkers:[{x:430,y:430,rx:90,ry:40,rot:0.3}],            /* diagonal waste carry */
  trees:[{x:260,y:280,r:52,kind:'eucalyptus'},{x:780,y:240,r:48,kind:'eucalyptus'},{x:300,y:520,r:40,kind:'eucalyptus'},{x:720,y:430,r:42,kind:'eucalyptus'}]},

 /* 8 — Dunesweeper · P4 · a far, demanding dogleg RIGHT around a long sand desert; a slope
        on the left of the landing zone feeds bold drives down toward the green for an eagle
        look, but overcook it and you're in the dunes. Giant green with a spine ridge. */
 {name:'Dunesweeper', par:4, windMax:8, tee:{x:130,y:300}, fw:58, pin:{x:800,y:420}, windDir:5.0,
  fwSlope:{dx:0.2,dy:0.35,s:0.34}, fastFw:true,
  slopeZones:[{x:520,y:340,r:140,dx:0.3,dy:0.5,s:0.55}],
  green:{lobes:[{x:800,y:420,r:148},{x:690,y:400,r:106},{x:880,y:380,r:96},{x:800,y:520,r:88}], /* GIANT */
         slope:{dx:0.2,dy:-0.4,s:0.26}, flat:{r:54,f:0.42},
         features:[{type:'ridge',x:800,y:430,dx:1,dy:0.1,h:8,w:26},   /* dividing spine */
                   {type:'bowl',x:756,y:424,r:42,h:7},
                   {type:'bowl',x:846,y:424,r:40,h:6}]},
  spine:[{x:130,y:300},{x:300,y:280},{x:440,y:300},{x:560,y:360},{x:680,y:400},{x:800,y:422}],
  waters:[{x:560,y:540,rx:120,ry:50,rot:0.1,pond:true}],
  bunkers:[{x:470,y:200,rx:110,ry:54,rot:0.15},{x:640,y:230,rx:70,ry:36,rot:-0.2}], /* the desert along the inside */
  trees:[{x:300,y:430,r:54,kind:'eucalyptus'},{x:560,y:230,r:46,kind:'eucalyptus'},{x:700,y:280,r:48,kind:'eucalyptus'},{x:170,y:200,r:42,kind:'eucalyptus'},{x:900,y:300,r:44,kind:'eucalyptus'}]},

 /* 9 — Golden Hour · P2 · a short, thrilling drivable-style closer: a tiny par 2 over a wide
        lake to a GIANT three-tier green. Hole it from the tee for the eagle, or play safe to
        a fat green and two-putt for par. A grand bright finish. */
 {name:'Golden Hour', par:2, windMax:7, tee:{x:230,y:330}, fw:64, pin:{x:700,y:300}, windDir:-0.6,
  green:{lobes:[{x:700,y:300,r:160},{x:580,y:300,r:112},{x:820,y:300,r:108},{x:700,y:190,r:92}], /* BIGGEST green on tour */
         slope:{dx:0,dy:-0.6,s:0.3}, flat:{r:62,f:0.42},
         features:[{type:'tier',x:700,y:200,dx:0,dy:-1,h:13,w:42},   /* upper tier — the pin */
                   {type:'ridge',x:700,y:300,dx:1,dy:0,h:7,w:30},     /* mid step */
                   {type:'bowl',x:700,y:312,r:48,h:6},
                   {type:'bowl',x:580,y:300,r:40,h:5}]},
  spine:[{x:230,y:330},{x:470,y:316},{x:700,y:302}],
  waters:[{x:470,y:400,rx:200,ry:120,rot:0,pond:true}],
  bunkers:[{x:580,y:210,rx:34,ry:22,rot:0.3},{x:830,y:380,rx:32,ry:20,rot:-0.2}],
  trees:[{x:740,y:180,r:56,kind:'eucalyptus'},{x:820,y:250,r:48,kind:'eucalyptus'},{x:260,y:240,r:44,kind:'eucalyptus'},{x:300,y:460,r:42,kind:'eucalyptus'},{x:640,y:160,r:42,kind:'eucalyptus'}]}
];



/* ===== GOLF TOURS: each tour groups courses. Score a birdie (or better) somewhere in a
   tour to unlock the next. New maps slot in by adding their COURSES[] index to a tour. ===== */
const TOURS = [
  { id:'sunrise', name:'Sunrise Tour',     tagline:'Where every legend tees off',   courses:[0,4,5] },
  { id:'snail',   name:'Golden Snail Tour', tagline:'Slow and steady wins the green', courses:[1,3] },
  { id:'reckoning', name:"The Reckoning",   tagline:'Only the fearless finish',       courses:[2] }
];
let tourIdx = 0;   /* which tour is currently being viewed */
/* per-tour birdie flag: set true when a birdie or better is scored on any of the tour's holes */
function tourBirdied(ti){ const t=TOURS[ti]; if(!t) return false; return t.courses.some(ci => (stats.tourBirdie?.[ci])); }
/* a tour is complete (for progress display) when every course in it has 9 holes done */
function tourComplete(ti){
  const t = TOURS[ti]; if(!t || !t.courses.length) return false;
  const hd = stats.holesDone||[];
  return t.courses.every(ci => (hd[ci]||0) >= 9);
}
/* a tour is unlocked if it's the first, or you've COMPLETED the previous tour
   (every hole on all its courses birdied, since a hole only counts as done on a birdie) */
function tourUnlocked(ti){ return (typeof TESTING!=='undefined'&&TESTING) || ti===0 || tourComplete(ti-1); }
/* which tour a course belongs to */
function tourOfCourse(ci){ return TOURS.findIndex(t => t.courses.includes(ci)); }
/* a course is unlocked if its tour is unlocked AND it's first in the tour or the prior map is done */
function courseUnlocked(ci){
  if(typeof TESTING!=='undefined'&&TESTING) return true;
  const ti = tourOfCourse(ci); if(ti<0) return false;
  if(!tourUnlocked(ti)) return false;
  const list = TOURS[ti].courses, pos = list.indexOf(ci);
  if(pos===0) return true;
  return (stats.holesDone?.[list[pos-1]]||0) >= 9;
}


/* Driving range: four REAL greens at true carry distances, each its own green lobe so the
   ball physically lands/checks on them. Flags sit at each green centre. Tee is bottom-left;
   the fairway runs ~400 yards up to the back of the range. */
const RANGE_GREENS = [
  {x:268, y:430, r:30, yards:100},
  {x:340, y:392, r:34, yards:150},
  {x:430, y:352, r:38, yards:200},
  {x:512, y:296, r:42, yards:250}
];
const PRACTICE_HOLES = [
 {name:'The Range', par:3, windMax:0, tee:{x:110,y:540}, fw:150, fwSlope:{dx:0.2,dy:-0.1,s:0.08}, pin:{x:512,y:296}, windDir:0,
  isRange:true, rangeGreens:RANGE_GREENS,
  green:{lobes:RANGE_GREENS.map(g=>({x:g.x,y:g.y,r:g.r})),   /* every target is a real green */
         slope:{dx:0.06,dy:-0.06,s:0.07}, flat:{r:120,f:0.7},
         features:[]},
  spine:[{x:110,y:540},{x:300,y:430},{x:480,y:320},{x:700,y:160}],
  waters:[],
  bunkers:[{x:300,y:472,rx:34,ry:20,rot:0.2},{x:392,y:300,rx:30,ry:18,rot:-0.4},
           {x:560,y:340,rx:32,ry:19,rot:0.5},{x:470,y:420,rx:26,ry:16,rot:-0.2}],
  trees:[{x:60,y:120,r:26},{x:200,y:90,r:24},{x:420,y:70,r:26},{x:640,y:70,r:24},
         {x:830,y:110,r:28},{x:910,y:300,r:26},{x:890,y:480,r:26},{x:720,y:560,r:24},{x:520,y:575,r:22}]}
];
const COURSES = [
  {name:'Sakura Links',        holes:HOLES,  theme:'sakura'},
  {name:'Oak Ridge Municipal', holes:HOLES2, theme:'oak'},
  {name:'Volcano Ridge',       holes:HOLES3, theme:'volcano'},
  {name:'Maple Falls',         holes:HOLES4, theme:'maple'},
  {name:'The Glades',          holes:HOLES5, theme:'glade'},
  {name:'Mirage Dunes',        holes:HOLES6, theme:'savanna'},
  {name:'Practice',            holes:PRACTICE_HOLES, theme:'sakura'}
];
const PRACTICE_CI = 6;          /* index of the practice course */
let practiceMode = false;
let rangeMode = false;          /* driving-range: pick any club, hit at targets, ball resets to mat */
let rangeShots = 0, rangeBest = null, manualClub = false;
let courseIdx = 0;
function CH(){ return COURSES[courseIdx].holes; }
function THEME(){ return COURSES[courseIdx].theme; }
/* theme-aware fairway grass color — most courses use the standard green; the Glades
   (Golden Snail) course uses a richer jade/emerald to feel distinct and exotic */
function FAIRWAY_COLOR(){
  switch(THEME()){
    case 'glade':  return '#3fa56a';   /* deep jade-emerald wetland turf */
    case 'savanna':return '#7cc24a';   /* bright sunlit lime — fun, vivid eucalyptus country */
    default:       return '#5fa953';
  }
}
let CREEKS = [];
let CREEK_HILLS = [];   /* little hill clusters at each creek's source (water origin) */
/* Group consecutive creek:true waters into chains and build ribbon polygons:
   a wide sand band and, inside it, the light-blue water channel. Returns an array of
   {water:[...polygon], sand:[...polygon], mid:[{x,y}...]} in world space. */
function buildCreeks(waters){
  CREEK_HILLS = [];
  const chains=[]; let cur=[];
  for(const w of waters){
    if(w.creek){ cur.push(w); }
    else { if(cur.length){ chains.push(cur); cur=[]; } }
  }
  if(cur.length) chains.push(cur);
  const out=[];
  for(const ch of chains){
    if(ch.length<2) continue;
    const mid = ch.map(w=>({x:w.x, y:w.y}));
    /* The creek SOURCES from the mountains: whichever end points more toward the horizon
       (smaller y) runs far back and meanders, so it reads as flowing down out of the hills.
       The other (downstream) end just drifts off into the rough a short way. */
    const head = mid[0], h2 = mid[1];
    const tail = mid[mid.length-1], t2 = mid[mid.length-2];
    const dir = (a,b)=>{ let dx=a.x-b.x, dy=a.y-b.y; const L=Math.hypot(dx,dy)||1; return {x:dx/L, y:dy/L}; };
    const dH = dir(head, h2), dT = dir(tail, t2);
    /* a meandering tail from a start point/direction, n steps, length each, wandering */
    const meander = (p, d, n, step, wob)=>{
      const pts=[]; let cx=p.x, cy=p.y, ang=Math.atan2(d.y,d.x);
      for(let i=0;i<n;i++){
        ang += Math.sin(i*1.3+p.x*0.01)*wob;       /* gentle natural wander */
        cx += Math.cos(ang)*step; cy += Math.sin(ang)*step;
        pts.push({x:cx, y:cy});
      }
      return pts;
    };
    let full;
    const headUp = head.y <= tail.y;                /* head is the uphill (mountain) end? */
    const upEnd   = headUp ? head : tail;
    const upDir   = headUp ? dH   : dT;
    const downEnd = headUp ? tail : head;
    const downDir = headUp ? dT   : dH;
    /* SOURCE: run back to a small hill cluster near the back edge — march until we reach the
       far edge (y<=110) or a max distance, so the creek visibly emerges from the hills. */
    const source=[]; { let cx=upEnd.x, cy=upEnd.y, ang=Math.atan2(upDir.y,upDir.x), step=16, i=0;
      while(cy>-20 && i<22){ ang += Math.sin(i*1.3+upEnd.x*0.01)*0.12; cx+=Math.cos(ang)*step; cy+=Math.sin(ang)*step; source.push({x:cx,y:cy}); i++; }
    }
    const hillAt = source.length ? source[source.length-1] : {x:upEnd.x, y:upEnd.y-120};
    /* The creek is DRAWN starting from the far tip of the source meander (source[last]),
       way off to the side/back — that's where the water visibly begins. Put the boulder
       cluster THERE. Use the furthest source point that is still on-screen (y >= 8). */
    let creekStart = {x:upEnd.x, y:upEnd.y};
    for(const sp of source){                          /* source runs upEnd -> far tip */
      if(sp.y >= 8) creekStart = sp;                  /* keep the furthest still-visible point */
    }
    if(hillAt.y < 130) CREEK_HILLS.push({x:creekStart.x, y:creekStart.y, dx:upDir.x, dy:upDir.y});
    /* DOWNSTREAM: curve into the nearest pond so the creek empties into it */
    const ponds = (waters||[]).filter(w=>w.pond);
    let pond=null, best=1e9;
    for(const w of ponds){ const dd=Math.hypot(w.x-downEnd.x, w.y-downEnd.y); if(dd<best){best=dd; pond=w;} }
    let downTail;
    if(pond){
      /* a few points easing from the creek end into the pond center */
      const steps=5; downTail=[];
      for(let i=1;i<=steps;i++){ const t=i/steps;
        downTail.push({x:downEnd.x+(pond.x-downEnd.x)*t, y:downEnd.y+(pond.y-downEnd.y)*t}); }
    } else {
      downTail = meander(downEnd, downDir, 4, 30, 0.12);
    }
    /* assemble head→tail in geometric order (source is up, so it leads if headUp) */
    full = headUp ? [...source.slice().reverse(), ...mid, ...downTail]
                  : [...downTail.slice().reverse(), ...mid, ...source];
    /* resample to a smooth, denser centerline */
    const dense=[];
    for(let i=0;i<full.length-1;i++){
      const a=full[i], b=full[i+1];
      const steps=4;
      for(let k=0;k<steps;k++){ const t=k/steps; dense.push({x:a.x+(b.x-a.x)*t, y:a.y+(b.y-a.y)*t}); }
    }
    dense.push(full[full.length-1]);
    const waterHalf = 12, sandHalf = 21;        /* channel + sand bank half-widths */
    const N = dense.length;
    /* width multiplier: full through the middle, tapering to ~0 over the last ~10 points
       at each end so both tips come to a natural point (no flat caps) */
    const taper = (i)=>{
      const edge = 10;
      const a = Math.min(1, i/edge);
      const b = Math.min(1, (N-1-i)/edge);
      return Math.min(a, b);
    };
    const ribbon = (half)=>{
      const L=[], R=[];
      for(let i=0;i<dense.length;i++){
        const a=dense[Math.max(0,i-1)], b=dense[Math.min(dense.length-1,i+1)];
        let dx=b.x-a.x, dy=b.y-a.y; const len=Math.hypot(dx,dy)||1; dx/=len; dy/=len;
        const nx=-dy, ny=dx;                    /* perpendicular */
        const hw = half*taper(i);
        L.push({x:dense[i].x+nx*hw, y:dense[i].y+ny*hw});
        R.push({x:dense[i].x-nx*hw, y:dense[i].y-ny*hw});
      }
      return L.concat(R.reverse());             /* closed ribbon polygon */
    };
    out.push({ water:ribbon(waterHalf), sand:ribbon(sandHalf), mid:dense });
  }
  return out;
}
function loadHole(i){
  CUR = CH()[i];
  if(_shvCache) _shvCache.clear();
  if(_fhvCache) _fhvCache.clear();
  PIN = CUR.pin; TEE = CUR.tee; SPINE = CUR.spine;
  SPINE2 = CUR.spine2 || null;          /* optional second fairway corridor (double fairway) */
  ISLANDS = CUR.islands || null;        /* optional fairway islands: {x,y,rx,ry,rot} grass patches */
  FAIRWAY_W = CUR.fw; GREEN = CUR.green;
  WATERS = CUR.waters; BUNKERS = CUR.bunkers; PAR = CUR.par;
  /* precompute each pond's physics outline using the SAME blobPoly the renderer draws, so
     the splash boundary exactly matches the painted water (no floating on painted edges). */
  WATERS.forEach(w=>{
    w._poly = w.pond ? blobPoly(w, 40, 0) : null;
    w._lipPoly = w.pond ? blobPoly(w, 40, 13) : null;   /* a touch wider than the visible bank */
  });
  /* green height stats — anchor the visual tilt at the green's FRONT edge (the side the
     approach shot comes in from) so the front meets the fairway flush. The green then tilts
     across its width from there: no cliff at the front, smooth transition from the fairway. */
  { let s=0, n=0, mn=1e9; const gb0=greenBBox(0), gc={x:(gb0.x0+gb0.x1)/2,y:(gb0.y0+gb0.y1)/2};
    for(let y=gb0.y0;y<gb0.y1;y+=6) for(let x=gb0.x0;x<gb0.x1;x+=6){
      if(greenSDF(x,y)>0){ const h=greenHeight(x,y); s+=h; n++; if(h<mn) mn=h; } }
    GREEN._hMean = n? s/n : 0; GREEN._hMin = (mn<1e9)? mn : 0;
    /* approach direction: from the previous spine point toward the green centre */
    let ax=gc.x-TEE.x, ay=gc.y-TEE.y;
    if(SPINE && SPINE.length>=2){ const pv=SPINE[SPINE.length-2]; ax=gc.x-pv.x; ay=gc.y-pv.y; }
    const al=Math.hypot(ax,ay)||1; ax/=al; ay/=al;
    /* sample several points along the front edge (where the approach reaches the green) */
    let fs=0, fn=0;
    for(let t=-0.6;t<=0.6;t+=0.2){
      /* a point near the front rim: step back from centre toward the approach, with spread */
      const ex=-ax, ey=-ay, sx=-ay, sy=ax;       /* back dir + sideways */
      for(let r=58;r>=30;r-=6){
        const fx=gc.x+ex*r+sx*t*40, fy=gc.y+ey*r+sy*t*40;
        if(greenSDF(fx,fy)>2){ fs+=greenHeight(fx,fy); fn++; break; }
      }
    }
    GREEN._hFront = fn? fs/fn : GREEN._hMean;
    GREEN._gR = Math.max(20, Math.min((gb0.x1-gb0.x0), (gb0.y1-gb0.y0))/2);
    GREEN._apX = ax; GREEN._apY = ay;   /* approach direction (tee→green) */
    GREEN._gcx = gc.x; GREEN._gcy = gc.y; }
  /* ---- build connected creek ribbons (a real flowing creek, not chained ponds) ---- */
  CREEKS = buildCreeks(WATERS);
  buildHighRoughBands();
  TREES = CUR.trees.map((t,k)=>{
    let kind = t.kind || (k%3===2 ? 'pine' : 'round');
    /* Sakura is a cherry-blossom course: no pines — every tree blooms */
    if(THEME()==='sakura' && kind==='pine') kind='round';
    return {...t, kind};
  });
  VOLCANO = CUR.volcano || null;     /* {x,y,r,period,active} erupting crater */
  eruptT = 0;
  /* precompute static scorch-patch positions on the green (volcano only) */
  SCORCH = [];
  if((CUR.theme||COURSES[courseIdx].theme)==='volcano' || THEME()==='volcano'){
    const gb = greenBBox(0), rr = mulberry(i*131+7);
    for(let k=0;k<6;k++){
      const bx = gb.x0 + rr()*(gb.x1-gb.x0);
      const by = gb.y0 + rr()*(gb.y1-gb.y0);
      const br = 10 + rr()*16;
      const dark = rr()<0.5;
      if(greenSDF(bx,by) >= 14) SCORCH.push({x:bx,y:by,r:br,dark});
    }
  }

  const bb = greenBBox(26);
  /* outlines of the green & fringe from the SDF */
  const greenLoop  = stitchLoops(marchSegs(greenSDF, bb.x0,bb.y0,bb.x1,bb.y1, 7, 0))[0] || circlePoly(PIN.x,PIN.y,60);
  const fringeLoop = stitchLoops(marchSegs(greenSDF, bb.x0,bb.y0,bb.x1,bb.y1, 7, -12))[0] || circlePoly(PIN.x,PIN.y,72);

  POLY = {
    fairway: buildFairwayPoly(),
    waters: WATERS.map(w=>{
      const poly = w.pond ? blobPoly : ellipsePoly;
      return {lip:poly(w,40,10), body:poly(w,40),
              inner:poly({...w, rx:w.rx*0.72, ry:w.ry*0.68},36),
              ripples:[0.35,0.55,0.78].map(k=>poly({...w, rx:w.rx*k, ry:w.ry*k},28))};
    }),
    bunkers: BUNKERS.map(b=>({lip:ellipsePoly(b,24,5), body:ellipsePoly(b,24)})),
    fringe: fringeLoop,
    green: greenLoop,
    cup: circlePoly(PIN.x,PIN.y,HOLE_R,16),
    tee: [{x:TEE.x-28,y:TEE.y-24},{x:TEE.x+28,y:TEE.y-24},{x:TEE.x+28,y:TEE.y+22},{x:TEE.x-28,y:TEE.y+22}]
  };

  /* elevation shading cells + height range */
  SHADE_CELLS = [];
  let hmin=1e9, hmax=-1e9;
  const cs = 12;
  for(let y=bb.y0; y<bb.y1; y+=cs) for(let x=bb.x0; x<bb.x1; x+=cs){
    const corners=[[x,y],[x+cs,y],[x+cs,y+cs],[x,y+cs]];
    if(corners.every(([cx2,cy2])=>greenSDF(cx2,cy2)>1)){
      const h = greenHeight(x+cs/2, y+cs/2);
      hmin=Math.min(hmin,h); hmax=Math.max(hmax,h);
      /* lambert lighting from the upper-left: lit faces brighten, shaded faces darken */
      const g = greenGrad(x+cs/2, y+cs/2);
      const lam = Math.max(-1, Math.min(1, (g.x*0.55 + g.y*0.85)*1.6));
      SHADE_CELLS.push({pts:corners.map(([cx2,cy2])=>({x:cx2,y:cy2})), h, lam});
    }
  }
  const span = Math.max(0.001, hmax-hmin);
  SHADE_CELLS.forEach(c=>c.t=(c.h-hmin)/span);

  /* contour lines (green-reading map) */
  CONTOUR_SEGS = [];
  const levels = 8;
  for(let k=1;k<levels;k++){
    const iso = hmin + span*k/levels;
    marchSegs(greenHeight, bb.x0,bb.y0,bb.x1,bb.y1, 9, iso).forEach(s=>{
      const mx=(s[0].x+s[1].x)/2, my=(s[0].y+s[1].y)/2;
      if(greenSDF(mx,my)>3) CONTOUR_SEGS.push(s);
    });
  }

  /* slope arrows (toggle with S): point downhill, length = strength */
  ARROWS = [];
  for(let y=bb.y0; y<bb.y1; y+=22) for(let x=bb.x0; x<bb.x1; x+=22){
    if(greenSDF(x,y)>10){
      const g = greenGrad(x,y);
      const m = Math.hypot(g.x,g.y);
      if(m>0.04) ARROWS.push({x, y, dx:-g.x/m, dy:-g.y/m, m:Math.min(1,m/0.8), ph:Math.random()*6.28});
    }
  }

  /* rough texture, tufts, sand speckles */
  BLOTCH=[]; TUFTS=[]; SAND_DOTS=[];
  let guard=0;
  while(BLOTCH.length<24 && guard++<800){
    const x=20+Math.random()*920, y=20+Math.random()*560;
    if(surfaceAt(x,y)!=='rough') continue;
    const pts=[], r=16+Math.random()*26, n=6;
    for(let j=0;j<n;j++){
      const a=j/n*Math.PI*2, rr=r*(0.7+Math.random()*0.6);
      pts.push({x:x+Math.cos(a)*rr, y:y+Math.sin(a)*rr*0.8});
    }
    BLOTCH.push({pts, dark:Math.random()<0.5});
  }
  guard=0;
  while(TUFTS.length<55 && guard++<1200){
    const x=15+Math.random()*930, y=15+Math.random()*570;
    if(surfaceAt(x,y)!=='rough') continue;
    TUFTS.push({x, y, ph:Math.random()*6.28, s:0.8+Math.random()*0.6});
  }
  BUNKERS.forEach(b=>{
    for(let k=0;k<22;k++){
      const a=Math.random()*Math.PI*2, rr=Math.sqrt(Math.random());
      const lx=Math.cos(a)*rr*b.rx*0.85, ly=Math.sin(a)*rr*b.ry*0.85;
      SAND_DOTS.push({x:b.x+lx*Math.cos(b.rot)-ly*Math.sin(b.rot),
                      y:b.y+lx*Math.sin(b.rot)+ly*Math.cos(b.rot)});
    }
  });
}

/* ============================ STATE ============================ */
const ST = {AIM:0, PULL:1, MOVING:4, HOLED:5, FLY:6, REPLAY:7};
let state, strokes, aimAngle, clubIdx, wind, windShiftAt, spin, shape;
let holeIdx = 0, roundDiffs = [], birdieStreak = 0;
let roundHoleDiffs = [];           /* per-hole diff for the current round (challenge checks) */
let ball, lastSafe, trail, particles;
let powerT, powerVal, accT, accVal, pendingPower, accSpeedNow;
/* ===== putting nerves: stall too long over a putt and the stroke gets jittery ===== */
let puttClock = 0;            /* seconds spent reading the current putt              */
let puttPressure = 0;         /* 0..1 nervousness (drives the pendulum wobble)       */
let puttWobblePhase = 0;      /* free-running phase for the wobble                   */
const PUTT_NERVES = 9;        /* nerves start easing in at ~9s                       */
function resetPuttPressure(){ puttClock = 0; puttPressure = 0; puttWobblePhase = 0; }
let streak = 0;
const TESTING = false;  /* RELEASE: campaign courses unlock through play (multiplayer still has all courses) */
let stats = {bestRound:null, bestStreak:0, bestBirdieStreak:0,
  bests:[null,null,null,null,null,null], holesDone:[0,0,0,0,0,0], rounds:[0,0,0,0,0,0], totalStrokes:0, totalHoles:0,
  challenges:{}, coins:1000, ownedSkins:['white'], equippedSkin:'white', tourBirdie:{}};  /* everyone starts with 1000 coins to buy a custom ball */

/* ===== SAVE PROGRESS (player's own browser via localStorage) =====
   Persists coins, owned/equipped ball, challenges, and best scores on this device. Works on
   the live site; in some sandboxed previews storage is blocked, so every call is wrapped in
   try/catch and the game runs fine either way (just without saving). */
const SAVE_KEY = 'birdieBlitzSave_v1';
function saveProgress(){
  try{
    const data = { stats, set: (typeof SET!=='undefined'?SET:null), name: (typeof window!=='undefined'?window._savedName:null) };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }catch(e){ /* storage unavailable (private mode / sandbox) — play on without saving */ }
}
function loadProgress(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return;
    const data = JSON.parse(raw);
    if(data && data.stats){
      // merge saved values over the defaults so new fields in future updates still exist
      stats = Object.assign({}, stats, data.stats);
      if(!stats.ownedSkins || !stats.ownedSkins.length) stats.ownedSkins = ['white'];
      if(!stats.equippedSkin) stats.equippedSkin = 'white';
      if(typeof stats.coins !== 'number') stats.coins = 1000;
    }
    if(data && data.set && typeof SET!=='undefined'){ Object.assign(SET, data.set); }
    if(data && data.name && typeof window!=='undefined') window._savedName = data.name;
  }catch(e){ /* corrupt or blocked — ignore, start fresh */ }
}
/* ===== CHALLENGES (achievements) ===== id → {name, desc, icon}. stats.challenges[id]=true once earned. */
const CHALLENGES = [
  {id:'dunk5',     name:'Splashdown',      desc:'Dunk hole 5 on Sakura straight from the air', icon:'🎯', coins:800},
  {id:'ace',       name:'Hole in One',     desc:'Ace any hole', icon:'⛳', coins:1200},
  {id:'albatross', name:'Albatross',       desc:'Finish a hole 3 under par', icon:'🦅', coins:1500},
  {id:'eagle',     name:'Eagle Eye',       desc:'Make an eagle (2 under par)', icon:'🦅', coins:400},
  {id:'firstBack', name:'Check It',        desc:'Use backspin for the first time', icon:'⏪', coins:200},
  {id:'firstTop',  name:'Run It Out',      desc:'Use topspin for the first time', icon:'⏩', coins:200},
  {id:'birdieSak', name:'Sakura Perfect',  desc:'Birdie every hole on Sakura in one round', icon:'🌸', coins:1400},
  {id:'birdieOak', name:'Oak Perfect',     desc:'Birdie every hole on Oak Ridge in one round', icon:'🌳', coins:1700},
  {id:'birdieVol', name:'Volcano Perfect', desc:'Birdie-or-better every hole on Volcano in one round', icon:'🌋', coins:2000},
  {id:'dunkAny',   name:'From the Sky',    desc:'Dunk any hole straight from the air', icon:'💧', coins:500},
  {id:'streak5',   name:'On Fire',         desc:'Birdie 5 holes in a row', icon:'🔥', coins:700},
  {id:'sandSave',  name:'Sand Save',       desc:'Hole out for par or better from a bunker', icon:'🏖️', coins:350},
  {id:'longPutt',  name:'Snake Charmer',   desc:'Hole a putt from 40ft or more', icon:'🐍', coins:600},
  {id:'allCourses',name:'Globetrotter',    desc:'Complete all three courses', icon:'🌍', coins:1000},
  {id:'noBogey',   name:'Clean Card',      desc:'Finish a full round with no bogeys', icon:'✨', coins:900}
];
function earnChallenge(id){
  if(!stats.challenges) stats.challenges={};
  if(stats.challenges[id]) return;                 /* already earned */
  const c = CHALLENGES.find(x=>x.id===id); if(!c) return;
  stats.challenges[id] = true;
  addCoins(c.coins||40, 'challenge');             /* most coins come from challenges */
  showChallengeToast(c);
  if(SFX.fanfare) SFX.fanfare();
}
/* ===== BALL STORE ===== coins buy ball skins. Cooler look = more coins.
   Each skin defines radial-gradient stops (inner→outer) plus optional flags:
   metallic (extra sheen ring), sparkle (animated glints), facet (gem facet shimmer). */
const BALL_SKINS = [
  {id:'white',   name:'Classic White', price:0,    tier:'basic',  stops:['#ffffff','#fbfdfe','#e6ecf1','#c3ced6']},
  {id:'red',     name:'Cherry Red',    price:60,   tier:'color',  stops:['#ffd9d9','#ff7a7a','#e22f2f','#a01818']},
  {id:'blue',    name:'Cobalt Blue',   price:60,   tier:'color',  stops:['#dcecff','#7ab0ff','#2f6fe2','#1842a0']},
  {id:'green',   name:'Lime Green',    price:60,   tier:'color',  stops:['#e6ffd9','#9ee87a','#3fb22f','#1f7a18']},
  {id:'orange',  name:'Sunset Orange', price:60,   tier:'color',  stops:['#ffeed9','#ffb06a','#f0801a','#b85510']},
  {id:'purple',  name:'Violet',        price:60,   tier:'color',  stops:['#f1d9ff','#c07aff','#8b2fe2','#5a18a0']},
  {id:'pink',    name:'Blossom Pink',  price:60,   tier:'color',  stops:['#ffe0f2','#ff8ac4','#f03f9a','#b81866']},
  {id:'black',   name:'Stealth Black', price:120,  tier:'color',  stops:['#7a828a','#3c4148','#222629','#0d0f11']},
  {id:'silver',  name:'Silver',        price:400,  tier:'metal',  metallic:true, stops:['#ffffff','#dfe6ec','#aab6c0','#7c8a96']},
  {id:'gold',    name:'Gold',          price:700,  tier:'metal',  metallic:true, stops:['#fffae8','#ffe9ac','#f0c060','#b8862f']},
  {id:'emerald', name:'Emerald',       price:1100, tier:'gem',    facet:true, stops:['#dfffe9','#5fe39a','#16a85a','#0a6638']},
  {id:'ruby',    name:'Ruby',          price:1400, tier:'gem',    facet:true, stops:['#ffe2ea','#ff6a8e','#d61a48','#8a0e2c']},
  {id:'sapphire',name:'Sapphire',      price:1700, tier:'gem',    facet:true, stops:['#e2ecff','#6a9aff','#1a52d6','#0e2c8a']},
  {id:'crystal', name:'Crystal',       price:2400, tier:'crystal',facet:true, sparkle:true, stops:['#ffffff','#eafaff','#bfe6f5','#90c4dd'], alpha:0.92},
  {id:'pinkDia', name:'Pink Diamond',  price:5500, tier:'diamond', brilliant:true, stops:['#ffffff','#ffe6f4','#ffaede','#e87ab8'], alpha:0.96, prismatic:true},
  {id:'blueDia', name:'Blue Diamond',  price:6500, tier:'diamond', brilliant:true, stops:['#ffffff','#e6f4ff','#a8d4ff','#6aa0e8'], alpha:0.96, prismatic:true},
  {id:'yellowDia',name:'Canary Diamond',price:7500,tier:'diamond', brilliant:true, stops:['#ffffff','#fffae0','#ffeb9e','#e8c95a'], alpha:0.96, prismatic:true},
  {id:'blackDia',name:'Black Diamond', price:8500, tier:'diamond', brilliant:true, stops:['#cfd6dc','#8a949c','#454d54','#1a1f24'], alpha:0.97, prismatic:true},
  {id:'diamond', name:'White Diamond', price:10000,tier:'diamond', brilliant:true, stops:['#ffffff','#fbffff','#e2f4fb','#bfe2f0'], alpha:0.97, prismatic:true},
  {id:'snowglobe', name:'Snow Globe', price:10000, tier:'special', sparkle:true, stops:['#f0feff','#c8e8ff','#8fd4ff','#5ab8e8'], alpha:0.94, frosty:true}
];
function skinById(id){ return BALL_SKINS.find(s=>s.id===id) || BALL_SKINS[0]; }
/* draw a dazzling brilliant-cut diamond surface: a cluster of little facets, each catching
   light at a different angle, with bright facet edges, a hot central table flash, rainbow
   fire and animated star glints. cx,cy,r = ball; t = time(ms); lx,ly = light dir. */
function drawBrilliant(ctx, cx, cy, r, skin, t, lx, ly){
  const st = skin.stops;
  ctx.save();
  ctx.beginPath(); ctx.arc(cx,cy,r*0.995,0,Math.PI*2); ctx.clip();
  /* 1 — many radial "kite" facets like the crown of a brilliant cut, two rings of them */
  const rings=[{n:8,r0:0.30,r1:1.0,rot:0.0},{n:8,r0:0.0,r1:0.34,rot:0.39}];
  const spin=(t/2600);                        /* slow shimmer rotation */
  for(const ring of rings){
    for(let i=0;i<ring.n;i++){
      const a0=ring.rot+spin+i/ring.n*Math.PI*2;
      const a1=ring.rot+spin+(i+1)/ring.n*Math.PI*2;
      const am=(a0+a1)/2;
      /* brightness from how aligned the facet normal is with the light dir */
      const nx=Math.cos(am), ny=Math.sin(am);
      const lit=Math.max(0,(nx*-lx+ny*-ly));   /* 0..1 */
      const shade=0.25+0.75*lit*lit;
      /* blend toward white when lit, toward deep stop when not */
      const base = lit>0.55 ? '255,255,255' : null;
      ctx.beginPath();
      ctx.moveTo(cx+Math.cos(a0)*r*ring.r0, cy+Math.sin(a0)*r*ring.r0);
      ctx.lineTo(cx+Math.cos(a0)*r*ring.r1, cy+Math.sin(a0)*r*ring.r1);
      ctx.lineTo(cx+Math.cos(am)*r*ring.r1*1.02, cy+Math.sin(am)*r*ring.r1*1.02);
      ctx.lineTo(cx+Math.cos(a1)*r*ring.r1, cy+Math.sin(a1)*r*ring.r1);
      ctx.lineTo(cx+Math.cos(a1)*r*ring.r0, cy+Math.sin(a1)*r*ring.r0);
      ctx.closePath();
      ctx.globalAlpha=0.55;
      ctx.fillStyle = base ? `rgba(${base},${0.35+0.5*lit})` : st[Math.min(3, 1+Math.floor((1-lit)*2))];
      ctx.fill();
      /* bright facet edge */
      ctx.globalAlpha=0.5*shade;
      ctx.strokeStyle='rgba(255,255,255,'+(0.3+0.6*lit)+')';
      ctx.lineWidth=Math.max(0.4,r*0.02); ctx.stroke();
    }
  }
  ctx.globalAlpha=1;
  /* 2 — rainbow fire scattered through the stone */
  const fire=['rgba(255,90,120,','rgba(255,210,90,','rgba(120,255,150,','rgba(110,200,255,','rgba(210,130,255,'];
  for(let f=0;f<fire.length;f++){
    const a=spin*1.7 + f*1.256;
    const fx=cx+Math.cos(a)*r*0.5, fy=cy+Math.sin(a)*r*0.5;
    const fg=ctx.createRadialGradient(fx,fy,0,fx,fy,r*0.42);
    fg.addColorStop(0,fire[f]+'.5)'); fg.addColorStop(1,fire[f]+'0)');
    ctx.fillStyle=fg; ctx.beginPath(); ctx.arc(fx,fy,r*0.42,0,Math.PI*2); ctx.fill();
  }
  /* 3 — hot central table flash (the big mirror facet on top) */
  const tg=ctx.createRadialGradient(cx+lx*r*0.25,cy+ly*r*0.25,r*0.02,cx,cy,r*0.5);
  tg.addColorStop(0,'rgba(255,255,255,.95)'); tg.addColorStop(0.5,'rgba(255,255,255,.3)'); tg.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=tg; ctx.beginPath(); ctx.arc(cx,cy,r*0.5,0,Math.PI*2); ctx.fill();
  ctx.restore();
  /* 4 — bright crisp rim (girdle of the gem) */
  ctx.globalAlpha=0.7; ctx.strokeStyle='rgba(255,255,255,.7)'; ctx.lineWidth=Math.max(0.6,r*0.05);
  ctx.beginPath(); ctx.arc(cx,cy,r*0.95,0,Math.PI*2); ctx.stroke(); ctx.globalAlpha=1;
  /* 5 — multiple animated 4-point star glints, very shiny */
  const star=(gx,gy,gr,alpha)=>{
    ctx.globalAlpha=alpha; ctx.fillStyle='#ffffff';
    ctx.beginPath();
    ctx.moveTo(gx,gy-gr); ctx.lineTo(gx+gr*0.16,gy-gr*0.16); ctx.lineTo(gx+gr,gy);
    ctx.lineTo(gx+gr*0.16,gy+gr*0.16); ctx.lineTo(gx,gy+gr);
    ctx.lineTo(gx-gr*0.16,gy+gr*0.16); ctx.lineTo(gx-gr,gy);
    ctx.lineTo(gx-gr*0.16,gy-gr*0.16); ctx.closePath(); ctx.fill();
    /* center hot dot */
    ctx.beginPath(); ctx.arc(gx,gy,gr*0.16,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;
  };
  const glints=[[lx*0.55,ly*0.55,0.5,0],[0.5,-0.35,0.34,0.5],[-0.4,0.3,0.3,1.1],[0.15,0.5,0.26,1.7],[-0.45,-0.25,0.24,2.3]];
  for(const [gxr,gyr,base,phase] of glints){
    const tw=0.5+0.5*Math.sin(t/520 + phase*3.0);
    star(cx+gxr*r, cy+gyr*r, r*base*(0.5+0.7*tw), 0.4+0.6*tw);
  }
}
function addCoins(n, src){
  if(!n) return;
  stats.coins = (stats.coins||0) + n;
  showCoinToast(n, src);
  saveProgress();
}
let keys = {};
let cam = {x:0, y:0, h:120, yaw:0, pitch:0.5, foc:400};
/* free-look green-reading camera: toggled on the green to orbit/tilt and study the slope */
let greenCam = { on:false, yaw:0, pitch:0.5, dist:150, tYaw:0, tPitch:0.5, tDist:150 };
let timeScale = 1, shake = 0, camPunch = 0, nearMiss = false;
let flash = null;                       // {color, a}
let celebT = 0;                         // eagle/ace celebration timer
let dunkFlag = false;                   // set when a shot drops straight into the cup from the air
let prediction = null;
let showArrows = true;
let greenBook = false;        // C: green-reading book view
let flyT = 0, flyPath = null;
let shotRec = [], replayAvail = false, replayT = 0, savedBall = null;

function randomWind(){
  /* each hole has a prevailing wind; gusts vary around it (learnable) */
  const a = (CUR.windDir ?? 0) + (Math.random()-0.5)*1.05;
  const mph = Math.round(CUR.windMax*0.35 + Math.random()*CUR.windMax*0.65);
  return {angle:a, mph, x:Math.cos(a), y:Math.sin(a)};
}

/* ============================ AUDIO ============================ */
let AC=null, rollGain=null;
function ac(){
  if(!AC){
    AC = new (window.AudioContext||window.webkitAudioContext)();
    try{
      const len = AC.sampleRate*1.5;
      const buf = AC.createBuffer(1, len, AC.sampleRate);
      const d = buf.getChannelData(0);
      for(let i=0;i<len;i++) d[i]=Math.random()*2-1;
      const src = AC.createBufferSource(); src.buffer=buf; src.loop=true;
      const filt = AC.createBiquadFilter(); filt.type='bandpass'; filt.frequency.value=420; filt.Q.value=0.8;
      rollGain = AC.createGain(); rollGain.gain.value=0;
      src.connect(filt).connect(rollGain).connect(AC.destination);
      src.start();
    }catch(e){}
  }
  return AC;
}
const SET = { sfx:0.8, music:0.55, quality:'high' };   /* player settings */
loadProgress();   /* restore coins/balls/scores/settings from this browser, if any */
const AUTOQ = { avg:0, t:0, good:0, user:false };       /* adaptive-quality tracker (user:true once they pick manually) */
function tone(freq, dur, type='sine', vol=0.18, when=0, slide=0){
  try{
    const a=ac(), o=a.createOscillator(), g=a.createGain();
    vol *= SET.sfx;
    if(vol<=0.0001) return;
    o.type=type; o.frequency.setValueAtTime(freq, a.currentTime+when);
    if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide), a.currentTime+when+dur);
    g.gain.setValueAtTime(vol, a.currentTime+when);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime+when+dur);
    o.connect(g).connect(a.destination);
    o.start(a.currentTime+when); o.stop(a.currentTime+when+dur+0.05);
  }catch(e){}
}
function noise(dur, vol=0.2, when=0, low=false){
  vol *= SET.sfx; if(vol<=0.0001) return;
  try{
    const a=ac(), n=a.createBufferSource(), g=a.createGain();
    const buf=a.createBuffer(1, a.sampleRate*dur, a.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*(1-i/d.length);
    n.buffer=buf;
    g.gain.setValueAtTime(vol, a.currentTime+when);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime+when+dur);
    if(low){
      const f=a.createBiquadFilter(); f.type='lowpass'; f.frequency.value=500;
      n.connect(f).connect(g).connect(a.destination);
    } else n.connect(g).connect(a.destination);
    n.start(a.currentTime+when);
  }catch(e){}
}
const SFX = {
  swing(club, p){
    if(club===0){ tone(95+p*120,.12,'triangle',.34); noise(.09,.2); }
    else if(club===1){ tone(150+p*150,.1,'triangle',.32); noise(.07,.16); }
    else if(club===2){ tone(200+p*170,.09,'triangle',.3); noise(.06,.14); }
    else { tone(240,.05,'triangle',.22); }
  },
  sand(){ noise(.3,.3,0,true); },
  splash(){ noise(.45,.32,0,true); tone(380,.4,'sine',.2,0,-300); },
  bounce(v){ const k=Math.min(1,(v||120)/300);
    tone(220+k*160,.05,'triangle',.07+k*0.1); if(k>0.6) noise(.04,.07,0,true); },
  rustle(){ noise(.2,.18,0,true); },
  drop(){ /* the real sound of a ball dropping into the cup: a soft rim tick, the hollow
             plastic-liner knock as it lands, a tiny rattle as it settles, and the muted
             reverberation of the cup. No musical sparkle — that's for celebrations. */
    tone(740,.025,'sine',.10,0,-180);                 /* faint rim/edge tick as it tips in */
    tone(196,.13,'sine',.34,.02,-30);                 /* hollow knock on the cup floor      */
    tone(150,.18,'sine',.22,.02,-24);                 /* low body of the cup resonance      */
    tone(330,.05,'triangle',.12,.05);                 /* plastic-liner click                */
    tone(280,.04,'triangle',.08,.09);                 /* small settle rattle                */
    noise(.05,.05,.02);                               /* the brush of grass + dirt          */
  },
  dropFancy(){ /* the old bright drop, kept for celebration makes */
    tone(900,.04,'square',.14); tone(140,.16,'sine',.3,.03,-60);
    tone(520,.07,'triangle',.25,.12); tone(660,.09,'triangle',.25,.2); tone(880,.22,'triangle',.25,.28); },
  perfect(){ tone(1040,.12,'sine',.2); tone(1560,.18,'sine',.16,.07); },
  lock(){ tone(660,.05,'square',.1); },
  streak(n){ for(let i=0;i<Math.min(n,4);i++) tone(880+i*220,.1,'triangle',.18,i*.07); },
  fanfare(){ [523,659,784,1047].forEach((f,i)=>tone(f,.18,'triangle',.22,i*.11)); },
  eagle(){ [659,784,988,1319,1568,1976].forEach((f,i)=>tone(f,.2,'triangle',.24,i*.09));
           [2093,2637,3136].forEach((f,i)=>tone(f,.3,'sine',.12,.55+i*.12));
           noise(.25,.12,.5); },
  dunk(){ /* descending swish → deep plunk → bright sparkle */
          tone(900,.12,'sine',.18,0,-620);            /* falling whoosh        */
          noise(.10,.10,0);
          tone(150,.18,'sine',.34,.10,-40);           /* low plunk into cup    */
          tone(220,.14,'triangle',.20,.10);
          [1568,2093,2637,3136].forEach((f,i)=>tone(f,.22,'sine',.16,.26+i*.06)); }, /* sparkle */
  roundFanfare(){ [392,523,659,784,1047,1319].forEach((f,i)=>tone(f,.22,'triangle',.22,i*.13)); },
  unlock(){ /* a padlock snapping open: a metallic clunk + click, then a bright rising chime */
    noise(.06,.22,0,true);                       /* mechanical clunk */
    tone(180,.08,'square',.18,0,-60);            /* heavy metal snap downward */
    tone(1200,.04,'square',.10,.05);             /* sharp click of the shackle popping */
    [659,988,1319].forEach((f,i)=>tone(f,.16,'triangle',.18,.14+i*.07));  /* rising "opened!" chime */
  },
  /* ===== SHOT CLOCK suspense ===== a tick that gets higher and harder as time runs out.
     `urgency` 0..1 (1 = about to expire) raises pitch + volume so the pressure builds. */
  clockTick(urgency){
    const u = Math.max(0, Math.min(1, urgency||0));
    const f = 520 + u*620;                         // pitch climbs as time dies
    tone(f, .035, 'square', 0.05 + u*0.13);        // dry mechanical tick
    if(u>0.55) tone(f*0.5, .05, 'sine', 0.05+u*0.08);   // a low thud underneath in the danger zone
  },
  clockHeart(urgency){                              // a double-thump heartbeat for the final seconds
    const u = Math.max(0, Math.min(1, urgency||0));
    tone(70, .12, 'sine', 0.12+u*0.12, 0, -18);
    tone(64, .14, 'sine', 0.10+u*0.10, 0.14, -16);
  },
  clockExpire(){                                    // buzzer when the clock runs out
    tone(160,.5,'sawtooth',.22,0,-40); noise(.2,.2);
  },
  yourTurn(){ /* bright two-note alert when it becomes your turn — clearly "you're up!" */
    tone(784,.13,'triangle',.2,0);        /* G5 */
    tone(1047,.18,'triangle',.22,.12);    /* C6 — rising, attention-grabbing */
    tone(1568,.12,'sine',.12,.26);        /* sparkle on top */
  },
  tick(){ tone(900,.03,'square',.05); },
  coin(n){ /* bright ka-ching: two quick ascending dings + a sparkle, scaled a touch by amount */
    const big = (n||0) >= 100;
    tone(1318,.07,'triangle',.16,0);        /* E6 */
    tone(1760,.12,'triangle',.16,.06);      /* A6 */
    if(big) tone(2637,.14,'triangle',.12,.12);  /* high sparkle for bigger payouts */
    tone(2640,.04,'sine',.06,.02);          /* tiny shimmer */
  },
  /* ---- feel pass ---- */

  release(p){                                 /* the band lets go: twang + body */
    const k=p/100;
    tone(520+k*460,.05,'triangle',.14+k*0.14,0,-(380+k*320));   /* fast falling pluck */
    tone(130+k*40,.09,'sine',.1+k*0.1,.01,-40);                 /* low body thump     */
    noise(.035,.08+k*0.07);                                     /* string tick        */
  },
  contact(q){                                 /* strike quality */
    if(q==='perfect'){
      tone(2093,.16,'sine',.22);                /* crisp C7 ping            */
      tone(3136,.22,'sine',.09,.015);           /* sparkle partial          */
      tone(1046,.07,'triangle',.1);             /* brief body under it      */
      tone(4186,.3,'sine',.035,.05);            /* long airy tail           */
    }
    else if(q==='good'){ tone(1100,.08,'sine',.14); tone(1650,.1,'sine',.07,.04); }
    else if(q==='bad'){ tone(150,.12,'sine',.22,0,-60); noise(.08,.14,0,true); }
    else { tone(760,.06,'sine',.1); }
  },
  spinFx(sp){                                 /* spin character at launch */
    if(sp<-0.3) tone(620,.22,'sine',.07,.06,-240);       /* backspin: smooth glide down */
    else if(sp>0.3){ tone(340,.04,'square',.09,.05); tone(480,.04,'square',.07,.1); } /* topspin: sharp snaps */
  },
  rollTick(v){ noise(.09, Math.min(.06, v/3400), 0, true); },
  lipSting(){                                 /* the heartbreaker */
    tone(520,.12,'sine',.2,0,-160); tone(180,.2,'sine',.22,.08,-50); noise(.07,.1,.06,true);
  },
  tension(){ tone(160,.7,'sine',.045,0,18); }, /* low swell while it hangs on the edge */
  rimRattle(v){ /* the ball knocking around the plastic lip as it circles */
    const k=Math.min(1,(v||100)/180);
    tone(300+k*180,.035,'triangle',.06+k*0.05); }
};
/* ===== Pendulum Swoosh: the backswing you can hear =====
   One looping noise voice through a bandpass. Its loudness and brightness
   follow the NEEDLE'S INSTANTANEOUS SPEED — |cos(accT)| × needle rate — so
   each visual sweep produces one audible swoosh: silent at the turn-points,
   peaking through center. Pull past 75% and the pendulum (and therefore the
   swoosh tempo, pitch and force) accelerates with it. Perfectly in sync,
   because it is computed from the same numbers that move the needle. */
const PULLSND = {on:false, nodes:null};
let _noiseBuf = null;
function noiseBuf(a){
  if(_noiseBuf) return _noiseBuf;
  _noiseBuf = a.createBuffer(1, a.sampleRate, a.sampleRate);
  const d=_noiseBuf.getChannelData(0);
  for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;   /* raw white (used by impacts) */
  return _noiseBuf;
}
/* a SMOOTH air buffer: brown-ish noise (integrated + gently high-passed) so it sounds
   like rushing air, not static. Used for the club swoosh. */
let _airBuf = null;
function airBuf(a){
  if(_airBuf) return _airBuf;
  _airBuf = a.createBuffer(1, a.sampleRate*2, a.sampleRate);
  const d=_airBuf.getChannelData(0);
  let last=0, lastOut=0;
  for(let i=0;i<d.length;i++){
    const w=Math.random()*2-1;
    last = (last + 0.02*w) / 1.02;          /* brown noise: integrate → kills harsh highs */
    d[i]=Math.max(-1,Math.min(1, last*3.2));
  }
  /* one smoothing pass to remove any residual grit */
  for(let i=1;i<d.length-1;i++) d[i]=(d[i-1]+d[i]*2+d[i+1])*0.25;
  return _airBuf;
}
function pullSndStart(){
  if(PULLSND.on || SET.sfx<=0.01) return;
  try{
    const a=ac();
    const src=a.createBufferSource(); src.buffer=airBuf(a); src.loop=true;
    /* AIR RUSH: a focused, resonant bandpass on smooth brown noise = a real whoosh.
       Higher Q makes it sing like moving air instead of hissing like static. */
    const bp=a.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=520; bp.Q.value=3.2;
    const g=a.createGain(); g.gain.value=0.0001;
    /* BODY: a deep low layer = the mass of the clubhead pushing air */
    const lp=a.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=360; lp.Q.value=0.7;
    const lg=a.createGain(); lg.gain.value=0.0001;
    /* a gentle final lowpass on the whoosh so no gritty top end ever leaks through */
    const tame=a.createBiquadFilter(); tame.type='lowpass'; tame.frequency.value=2600; tame.Q.value=0.5;
    src.connect(bp).connect(g).connect(tame).connect(a.destination);
    src.connect(lp).connect(lg).connect(a.destination);
    src.start();
    PULLSND.nodes={src,bp,g,lp,lg,tame};
    PULLSND.on=true;
  }catch(e){}
}
/* called every frame from the PULL state, right after the needle advances */
function pullSndUpdate(){
  if(!PULLSND.on) return;
  try{
    const a=ac(), t=a.currentTime, n=PULLSND.nodes;
    if(pullPower<4){ n.g.gain.setTargetAtTime(0.0001, t, 0.05);
                      n.lg.gain.setTargetAtTime(0.0001, t, 0.05); return; }
    const rate = needleSpeedNow();                  /* rad/s — same as the visual */
    const sweepRaw = Math.abs(Math.cos(accT));
    const sweep = Math.pow(sweepRaw, 1.4);          /* peaks through center of each sweep */
    const fast = Math.min(1, rate/5.5);             /* normalized needle speed    */
    const depth = Math.min(1, pullPower/100);       /* how far back = how committed the swing */
    /* The swoosh builds with BOTH the pull depth and the sweep speed:
       small pull → quiet, low, slow · full pull → loud, bright, fast. */
    const drive = (0.25 + 0.75*depth) * (0.3 + 0.7*sweep);
    /* air-rush whoosh */
    const vol = SET.sfx*(0.006 + drive*(0.10 + fast*0.13));
    n.g.gain.setTargetAtTime(vol, t, 0.03);
    n.bp.frequency.setTargetAtTime(360 + depth*420 + sweep*900 + fast*700, t, 0.045);
    /* slightly tighten the resonance as the swing speeds up = a sharper cut through air */
    n.bp.Q.setTargetAtTime(2.6 + fast*2.2, t, 0.06);
    /* open the taming lowpass as it gets faster so the whoosh brightens naturally */
    n.tame.frequency.setTargetAtTime(1500 + depth*900 + fast*2200, t, 0.06);
    /* low body: the mass of air the clubhead pushes — deep, just behind the whoosh */
    n.lg.gain.setTargetAtTime(SET.sfx*drive*(0.05 + fast*0.08), t, 0.05);
    n.lp.frequency.setTargetAtTime(220 + depth*180 + sweep*220 + fast*160, t, 0.06);
  }catch(e){}
}
function pullSndStop(){
  if(!PULLSND.on) return;
  PULLSND.on=false;
  try{
    const a=ac(), t=a.currentTime, n=PULLSND.nodes;
    n.g.gain.cancelScheduledValues(t); n.lg.gain.cancelScheduledValues(t);
    n.g.gain.setTargetAtTime(0.0001, t, 0.02);
    n.lg.gain.setTargetAtTime(0.0001, t, 0.02);
    setTimeout(()=>{ try{n.src.stop(); [n.src,n.bp,n.g,n.lp,n.lg,n.tame].forEach(x=>x&&x.disconnect());}catch(e){} }, 140);
  }catch(e){}
  PULLSND.nodes=null;
}
/* the downswing: one strong committed whoosh, sweeping high→low */
function downswing(p){
  try{
    const a=ac(), k=p/100;
    const t=a.currentTime, dur=0.18+k*0.12;
    /* the committed whoosh: smooth air swept high→low through a resonant bandpass,
       tamed by a lowpass so it stays silky — a real club cutting through air */
    const src=a.createBufferSource(); src.buffer=airBuf(a);
    const bp=a.createBiquadFilter(); bp.type='bandpass'; bp.Q.value=3.4;
    const tame=a.createBiquadFilter(); tame.type='lowpass'; tame.frequency.value=3200; tame.Q.value=0.5;
    const g=a.createGain();
    src.connect(bp).connect(tame).connect(g).connect(a.destination);
    bp.frequency.setValueAtTime(1700+k*1000, t);
    bp.frequency.exponentialRampToValueAtTime(240, t+dur);
    bp.Q.setValueAtTime(2.4, t); bp.Q.linearRampToValueAtTime(5.0, t+dur*0.7);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(SET.sfx*(0.18+k*0.22), t+0.02);  /* quick swell in */
    g.gain.exponentialRampToValueAtTime(0.0001, t+dur+0.06);
    src.start(t); src.stop(t+dur+0.12);
    /* low air-mass layer: the WEIGHT of the swing underneath */
    const src2=a.createBufferSource(); src2.buffer=airBuf(a);
    const lp2=a.createBiquadFilter(); lp2.type='lowpass'; lp2.Q.value=0.7;
    const g2=a.createGain();
    src2.connect(lp2).connect(g2).connect(a.destination);
    lp2.frequency.setValueAtTime(560+k*280, t);
    lp2.frequency.exponentialRampToValueAtTime(150, t+dur+0.06);
    g2.gain.setValueAtTime(0.0001, t);
    g2.gain.exponentialRampToValueAtTime(SET.sfx*(0.12+k*0.16), t+0.03);
    g2.gain.exponentialRampToValueAtTime(0.0001, t+dur+0.12);
    src2.start(t); src2.stop(t+dur+0.18);
  }catch(e){}
}
/* music duck for near-miss tension: wind drops away, then breathes back */
/* ===== Green Roll: turf bed + speed-synced grass-blade brushing,
   with a charged zip layer when checking under heavy backspin ===== */
const ROLLSND = {on:false, nodes:null};
function rollSndStart(){
  if(ROLLSND.on || SET.sfx<=0.01) return;
  try{
    const a=ac();
    const src=a.createBufferSource(); src.buffer=noiseBuf(a); src.loop=true;
    const lp=a.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=600; lp.Q.value=0.5;
    const lg=a.createGain(); lg.gain.value=0.0001;                  /* turf bed     */
    src.connect(lp).connect(lg).connect(a.destination);
    const bp=a.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=3400; bp.Q.value=2.4;
    const bg=a.createGain(); bg.gain.value=0.0001;                  /* blade brush  */
    src.connect(bp).connect(bg).connect(a.destination);
    const lfo=a.createOscillator(); lfo.type='sine'; lfo.frequency.value=14;
    const lfoG=a.createGain(); lfoG.gain.value=0;
    lfo.connect(lfoG).connect(bg.gain);                             /* rhythmic mod */
    const zip=a.createOscillator(); zip.type='sine'; zip.frequency.value=1200;
    const zg=a.createGain(); zg.gain.value=0.0001;                  /* backspin zip */
    zip.connect(zg).connect(a.destination);
    src.start(); lfo.start(); zip.start();
    ROLLSND.nodes={src,lp,lg,bp,bg,lfo,lfoG,zip,zg};
    ROLLSND.on=true;
  }catch(e){}
}
function rollSndUpdate(sp, spin){
  if(!ROLLSND.on) return;
  try{
    const a=ac(), t=a.currentTime, n=ROLLSND.nodes;
    const v=Math.min(1, sp/260);
    const back = spin<-0.3;
    n.lg.gain.setTargetAtTime(SET.sfx*(0.012+v*0.04), t, 0.06);
    n.lp.frequency.setTargetAtTime(450+v*450, t, 0.08);
    n.lfo.frequency.setTargetAtTime((6+v*22)*(back?1.6:1), t, 0.05);
    const blade=SET.sfx*(0.008+v*(back?0.034:0.022));
    n.bg.gain.setTargetAtTime(blade, t, 0.05);
    n.lfoG.gain.setTargetAtTime(blade*0.8, t, 0.05);
    n.bp.frequency.setTargetAtTime(back ? 4600+v*900 : 3100+v*700, t, 0.07);
    n.zg.gain.setTargetAtTime(back ? SET.sfx*(0.006+v*0.014) : 0.0001, t, 0.06);
    n.zip.frequency.setTargetAtTime(1100+v*500, t, 0.06);
  }catch(e){}
}
function rollSndStop(){
  if(!ROLLSND.on) return;
  ROLLSND.on=false;
  try{
    const a=ac(), t=a.currentTime, n=ROLLSND.nodes;
    [n.lg,n.bg,n.zg].forEach(x=>{ x.gain.cancelScheduledValues(t); x.gain.setTargetAtTime(0.0001, t, 0.04); });
    setTimeout(()=>{ try{n.src.stop(); n.lfo.stop(); n.zip.stop();
      Object.values(n).forEach(x=>x.disconnect());}catch(e){} }, 220);
  }catch(e){}
  ROLLSND.nodes=null;
}

let duckHold=false;
function duckMusic(on){
  duckHold = on;
  if(MUSIC.gain){
    const a=ac();
    MUSIC.gain.gain.cancelScheduledValues(a.currentTime);
    MUSIC.gain.gain.linearRampToValueAtTime(SET.music*0.4*(on?0.22:1), a.currentTime+(on?0.18:0.9));
  }
}

/* ============== MUSIC: Emerald-Web-inspired ethereal ambient ==============
   Lush, slow, dreamy. Overlapping detuned pad washes drift under a soft flute-like
   lead and the occasional floating arpeggio, all bathed in a long algorithmic reverb. */
const MUSIC = { on:false, gain:null, wet:null, verb:null, next:0, step:0, lastIdx:4, chord:0 };
/* a warm, consonant set — root drifts through I → vi → IV → V style washes (D major-ish,
   with a lydian lift) so it stays sweet and floating rather than pentatonic-plinky */
const PADS = [                                   /* each = stacked partials (Hz) for a wash */
  [146.83, 220.00, 293.66, 369.99],              /* D  : D A D F#         */
  [164.81, 246.94, 329.63, 415.30],              /* Em-ish lift           */
  [196.00, 293.66, 392.00, 493.88],              /* G  : G D G B          */
  [110.00, 220.00, 329.63, 440.00]               /* A  : A A E A          */
];
const LEAD_SCALE = [293.66,329.63,369.99,440.00,493.88,587.33,659.25,739.99]; /* D lydian up high */
function buildVerb(a){
  /* small algorithmic reverb impulse — long, soft tail for that drifting space */
  const len = Math.floor(a.sampleRate*3.2), buf = a.createBuffer(2, len, a.sampleRate);
  for(let ch=0; ch<2; ch++){
    const d = buf.getChannelData(ch);
    for(let i=0;i<len;i++){
      const t = i/len;
      d[i] = (Math.random()*2-1) * Math.pow(1-t, 2.6) * 0.6;   /* decaying noise tail */
    }
  }
  const c = a.createConvolver(); c.buffer = buf; return c;
}
function musicGain(){
  const a=ac();
  if(!MUSIC.gain){
    MUSIC.gain=a.createGain(); MUSIC.gain.connect(a.destination);
    MUSIC.verb=buildVerb(a);
    MUSIC.wet=a.createGain(); MUSIC.wet.gain.value=0.85;
    MUSIC.verb.connect(MUSIC.wet).connect(MUSIC.gain);
  }
  MUSIC.gain.gain.value = SET.music*0.4;
  return MUSIC.gain;
}
/* a single soft voice: long attack/release, optional vibrato, fed to both dry + reverb */
function mNote(freq, when, dur, vol, type, opts){
  const a=ac(), o=a.createOscillator(), g=a.createGain();
  opts = opts||{};
  o.type=type||'sine'; o.frequency.value=freq;
  if(opts.detune) o.detune.value = opts.detune;
  /* gentle low-pass so partials stay velvety, never harsh */
  const lp=a.createBiquadFilter(); lp.type='lowpass';
  lp.frequency.value = opts.cutoff || 1400; lp.Q.value=0.3;
  const t0=a.currentTime+when, atk=opts.atk!==undefined?opts.atk:dur*0.35;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0+atk);
  g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
  o.connect(lp).connect(g);
  g.connect(musicGain());                         /* dry */
  if(MUSIC.wet){ const sg=a.createGain(); sg.gain.value=(opts.send!==undefined?opts.send:0.6); g.connect(sg).connect(MUSIC.verb); }
  /* soft vibrato for the flute-like lead */
  if(opts.vib){
    const lfo=a.createOscillator(), lg=a.createGain();
    lfo.frequency.value=opts.vib; lg.gain.value=freq*0.006;
    lfo.connect(lg).connect(o.frequency); lfo.start(t0); lfo.stop(t0+dur+0.1);
  }
  o.start(t0); o.stop(t0+dur+0.2);
}
function startMusic(){
  if(MUSIC.on) return;
  MUSIC.on=true; MUSIC.next=0;
  musicTick();
}
function musicTick(){
  if(!MUSIC.on) return;
  /* ---- the slow pad wash: drift to the next chord and bloom a lush, detuned stack ---- */
  const ch = PADS[MUSIC.chord % PADS.length];
  ch.forEach((f,i)=>{
    const vol = 0.05 - i*0.006;                   /* lower partials louder */
    mNote(f,      0.0, 9.0, vol,        'sine',     {atk:3.2, cutoff:1100, send:0.7});
    mNote(f*1.003,0.0, 9.0, vol*0.7,    'triangle', {atk:3.6, cutoff:1000, send:0.7, detune:6});  /* shimmer */
  });
  /* a soft high "halo" fifth that fades in over the top */
  mNote(ch[2]*1.5, 0.5, 8.0, 0.018, 'sine', {atk:4.0, cutoff:2200, send:0.9});

  /* ---- floating flute-like lead: a sparse, drifting phrase on the lydian scale ---- */
  if(Math.random()<0.82){
    const notes = 1 + (Math.random()<0.5?1:0) + (Math.random()<0.3?1:0);   /* 1–3 notes */
    let t = 1.2 + Math.random()*1.0;
    for(let k=0;k<notes;k++){
      let idx = MUSIC.lastIdx + (Math.random()<0.5?-1:1)*(Math.random()<0.7?1:2);
      idx = Math.max(0, Math.min(LEAD_SCALE.length-1, idx));
      MUSIC.lastIdx = idx;
      mNote(LEAD_SCALE[idx], t, 2.4+Math.random()*1.2, 0.07, 'sine',
            {atk:0.5, cutoff:2600, send:0.8, vib:5.2});
      t += 1.1 + Math.random()*1.3;
    }
  }
  /* ---- occasional gentle arpeggio sprinkle, like a harp/celesta far off ---- */
  if(Math.random()<0.35){
    let t=2.0+Math.random()*2.0;
    const arp=[ch[0]*2, ch[1]*2, ch[2]*2, ch[3]*2];
    arp.forEach((f,i)=>{ mNote(f, t+i*0.42, 1.6, 0.03, 'triangle', {atk:0.05, cutoff:3200, send:0.95}); });
  }

  if(MUSIC.step%2===1) MUSIC.chord = (MUSIC.chord+1) % PADS.length;   /* change chord slowly */
  MUSIC.step++;
  setTimeout(musicTick, 7600 + Math.random()*1400);   /* long, unhurried cycle */
}
function stopMusic(){ MUSIC.on=false; }
</script>
<script>
"use strict";
/* ============================ CAMERA & PROJECTION ============================ */
const CAM_MODES = {
  drive:    {h:120, back:150, pitch:0.50, foc:400},
  approach: {h:70,  back:100, pitch:0.46, foc:430},
  putt:     {h:26,  back:64,  pitch:0.34, foc:540},
  tension:  {h:16,  back:44,  pitch:0.30, foc:600}
};
function camMode(){
  const onG = onGreenAt(ball.x,ball.y) && !ball.air;
  const dH = dist(ball.x,ball.y,PIN.x,PIN.y);
  const spd = Math.hypot(ball.vx,ball.vy);
  if(onG && ball.moving && dH<55 && spd<160 && spd>4) return CAM_MODES.tension;
  if(onG) return CAM_MODES.putt;
  if(dH < 300) return CAM_MODES.approach;
  return CAM_MODES.drive;
}
/* ===== GREEN-READING FREE-LOOK CAMERA controls ===== */
function canGreenRead(){
  return !rangeMode && state===ST.AIM && onGreenAt(ball.x,ball.y) && !ball.air && !(MP && MP.online && MP._inputLocked);
}
function toggleGreenCam(force){
  const want = (force!=null) ? force : !greenCam.on;
  if(want && !canGreenRead()){ return; }   // only while putting
  if(want){
    // seed the orbit from the current putt view so it eases in smoothly
    greenCam.on = true;
    greenCam.yaw = cam.yaw; greenCam.tYaw = cam.yaw;
    greenCam.pitch = 0.62;  greenCam.tPitch = 0.62;
    greenCam.dist = 150;    greenCam.tDist = 150;
    try{ SFX.tick && SFX.tick(); }catch(e){}
    setHint('Reading the green · drag or ◀▶▲▼ to look around · V or DONE to putt');
    const b=$m('greenCamBtn'); if(b){ b.classList.add('on'); b.textContent='✓ DONE READING'; }
    const dr=$m('greenReadHud'); if(dr) dr.style.display='flex';
  } else {
    greenCam.on = false;
    setHint('Pick a line ◀ ▶ · pull back to see the read');
    const b=$m('greenCamBtn'); if(b){ b.classList.remove('on'); b.textContent='🔍 READ GREEN'; }
    const dr=$m('greenReadHud'); if(dr) dr.style.display='none';
  }
  updateGreenCamBtn();
}
function panGreenCam(dYaw, dPitch, dDist){
  if(!greenCam.on) return;
  greenCam.tYaw += dYaw;
  greenCam.tPitch = Math.max(0.12, Math.min(1.15, greenCam.tPitch + dPitch));   // up/down tilt limits
  greenCam.tDist  = Math.max(70,  Math.min(320,  greenCam.tDist  + dDist));     // zoom in/out limits
}
/* show/hide the READ GREEN button based on whether we're putting */
function updateGreenCamBtn(){
  const b=$m('greenCamBtn'); if(!b) return;
  b.style.display = (canGreenRead() || greenCam.on) ? 'inline-flex' : 'none';
}

/* convert a #rrggbb (or #rgb) color to an rgba() string at the given alpha */
function rgbaFrom(col, a){
  if(typeof col!=='string') return `rgba(16,28,22,${a})`;
  let h = col.trim();
  if(h[0]==='#') h = h.slice(1);
  if(h.length===3) h = h.split('').map(c=>c+c).join('');
  if(h.length<6) return `rgba(16,28,22,${a})`;
  const r=parseInt(h.slice(0,2),16), g=parseInt(h.slice(2,4),16), b=parseInt(h.slice(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
}
function lerpAngle(a,b,t){
  let d=b-a;
  while(d> Math.PI) d-=Math.PI*2;
  while(d<-Math.PI) d+=Math.PI*2;
  return a+d*t;
}
function updateCamera(dt){
  /* GREEN-READING FREE-LOOK CAMERA: when toggled on (only while putting), the camera
     detaches from auto-follow so the player can orbit and tilt to read the slope. It orbits
     around the ball; yaw spins left/right, pitch tilts up/down, height follows pitch. */
  if(greenCam && greenCam.on){
    const gc = greenCam;
    // smooth toward the player-controlled orbit targets
    const k = Math.min(1, dt*8);
    gc.yaw   = lerpAngle(gc.yaw, gc.tYaw, k);
    gc.pitch += (gc.tPitch - gc.pitch)*k;
    gc.dist  += (gc.tDist  - gc.dist )*k;
    const surfH = (typeof surfaceHeightVis==='function') ? surfaceHeightVis(ball.x,ball.y) : 0;
    cam.yaw = gc.yaw;
    cam.pitch = gc.pitch;
    cam.foc = 430;
    cam.h += ((90 + surfH + gc.pitch*120) - cam.h)*k;
    // orbit the ball at the chosen distance
    cam.x += ((ball.x - Math.cos(gc.yaw)*gc.dist) - cam.x)*k;
    cam.y += ((ball.y - Math.sin(gc.yaw)*gc.dist) - cam.y)*k;
    return;
  }
  if(state===ST.FLY){
    /* flyover: drift from green back to the tee along the hole */
    const p = Math.max(0, Math.min(1, flyT/3.2));
    if(!flyPath || !flyPath.length){ state = ST.AIM; return; }   /* safety: no path → go to aim */
    const idx = (1-p)*(flyPath.length-1);
    const i0 = Math.max(0, Math.min(flyPath.length-1, Math.floor(idx)));
    const i1 = Math.min(flyPath.length-1, i0+1);
    const f = idx-i0;
    const px = flyPath[i0].x + (flyPath[i1].x-flyPath[i0].x)*f;
    const py = flyPath[i0].y + (flyPath[i1].y-flyPath[i0].y)*f;
    cam.x = px; cam.y = py;
    cam.h = 150 - 40*p;
    cam.pitch = 0.42;
    cam.foc = 420;
    cam.yaw = lerpAngle(cam.yaw, Math.atan2(PIN.y-py, PIN.x-px), Math.min(1,dt*5));
    return;
  }
  const m = camMode();
  let targetYaw = cam.yaw;
  if(state===ST.AIM || state===ST.PULL) targetYaw = aimAngle;
  else if(ball.moving || ball.air){
    const sp=Math.hypot(ball.vx,ball.vy);
    if(sp>40) targetYaw = Math.atan2(ball.vy,ball.vx);
  }
  const k = Math.min(1, dt*4.5);
  cam.yaw   = lerpAngle(cam.yaw, targetYaw, k);
  /* the green renders with a visual tilt now, so the camera target height includes the
     surface elevation under the ball — keeps the putting view correctly above the raised
     green (no clipping through the surface, correct perspective on a slope) */
  const surfH = (typeof surfaceHeightVis==='function') ? surfaceHeightVis(ball.x,ball.y) : 0;
  cam.h    += (m.h + surfH - cam.h)*k;
  cam.pitch+= (m.pitch- cam.pitch)*k;
  cam.foc  += (m.foc  - cam.foc) *k;
  cam.x += (ball.x - Math.cos(cam.yaw)*m.back - cam.x)*k;
  cam.y += (ball.y - Math.sin(cam.yaw)*m.back - cam.y)*k;
  if(celebT>0) cam.foc += (660 - cam.foc)*Math.min(1, dt*2.5);
  cam.foc += camPunch;                                /* perfect-contact lens punch */
}
function toCam(x,y,z){
  const dx=x-cam.x, dy=y-cam.y;
  const cs=Math.cos(cam.yaw), sn=Math.sin(cam.yaw);
  const f1 =  dx*cs + dy*sn;
  const l  = -dx*sn + dy*cs;
  const v  = z - cam.h;
  const cp=Math.cos(cam.pitch), sp=Math.sin(cam.pitch);
  return { l, Y: v*cp + f1*sp, Z: f1*cp - v*sp };
}
function proj(x,y,z){
  const c = toCam(x,y,z);
  if(c.Z < NEAR) return null;
  return { x: W/2 + cam.foc*c.l/c.Z, y: PY0 - cam.foc*c.Y/c.Z, z: c.Z };
}
function horizonY(){ return PY0 - cam.foc*Math.tan(cam.pitch); }
/* a ridge profile height at horizontal screen x for a given layer (deterministic) */
function ridgeH(x, layer, scroll){
  const u = x*0.005 + scroll;
  /* far range (0) is the tall snowy skyline; nearer ranges (1,2) are lower foreground ridges.
     Heights are generous so the ranges form a wall around the valley (hides flat far-ground). */
  const base = layer===0 ? 128 : layer===1 ? 82 : 46;
  const amp  = layer===0 ? 74  : layer===1 ? 46 : 28;
  let h = Math.sin(u*0.9+layer*2.1)*0.5 + Math.sin(u*2.1+layer*4.0)*0.32
        + Math.sin(u*4.3+layer*1.3)*0.22 + Math.sin(u*8.1+layer*0.7)*0.1;
  /* sharpen into peaks (mountains, not hills) */
  h = Math.sign(h)*Math.pow(Math.abs(h),0.7);
  return base + amp*(0.5+0.5*h);
}
function drawCreekHills(){
  for(const hpos of CREEK_HILLS){
    /* A modest LOCAL cluster of hills where the creek emerges (the big distant range is the
       horizon mountains). Grounded on real world points; the creek dips out the front. */
    const base = proj(hpos.x, hpos.y, 0); if(!base) continue;

    /* All shapes are built from REAL world ground points so they sit flat on the terrain
       and move correctly with the camera. dx = world X offset, depth = world Y push-back,
       h = world height (Z), w = world width. We project left/right base corners (on the
       ground) and the raised peak, then connect them. */
    const groundPts = (dx, depth, w)=>{
      const wx=hpos.x+dx, wy=hpos.y - depth;
      const bl=proj(wx-w*0.5, wy, 0), br=proj(wx+w*0.5, wy, 0), bc=proj(wx, wy, 0);
      return (bl&&br&&bc) ? {wx,wy,bl,br,bc} : null;
    };
    const hill = (dx, depth, h, w, fill, shade)=>{
      const g=groundPts(dx,depth,w); if(!g) return;
      const t=proj(g.wx, g.wy, h); if(!t) return;
      const {bl,br,bc}=g;
      /* rounded dome: base corners on the ground, smooth crest at the peak */
      ctx.fillStyle=fill;
      ctx.beginPath();
      ctx.moveTo(bl.x, bl.y);
      ctx.bezierCurveTo(bl.x+(t.x-bl.x)*0.45, bl.y+(t.y-bl.y)*0.55, t.x-(t.x-bl.x)*0.30, t.y, t.x, t.y);
      ctx.bezierCurveTo(t.x+(br.x-t.x)*0.30, t.y, br.x-(br.x-t.x)*0.45, br.y+(t.y-br.y)*0.55, br.x, br.y);
      /* close along the (slightly curved) ground base */
      ctx.quadraticCurveTo(bc.x, Math.max(bl.y,br.y)+(bc.y-Math.max(bl.y,br.y))*0.4, bl.x, bl.y);
      ctx.closePath(); ctx.fill();
      if(shade){
        ctx.fillStyle=shade;
        ctx.beginPath();
        ctx.moveTo(t.x, t.y);
        ctx.bezierCurveTo(t.x+(br.x-t.x)*0.30, t.y, br.x-(br.x-t.x)*0.45, br.y+(t.y-br.y)*0.55, br.x, br.y);
        ctx.lineTo(bc.x, bc.y); ctx.closePath(); ctx.fill();
      }
    };
    const mountain = (dx, depth, h, w, fill, shade)=>{
      const g=groundPts(dx,depth,w); if(!g) return;
      const t=proj(g.wx, g.wy, h); if(!t) return;
      const {bl,br,bc}=g;
      /* pointed peak from ground corners */
      ctx.fillStyle=fill;
      ctx.beginPath();
      ctx.moveTo(bl.x, bl.y); ctx.lineTo(t.x, t.y); ctx.lineTo(br.x, br.y);
      ctx.quadraticCurveTo(bc.x, Math.max(bl.y,br.y)+(bc.y-Math.max(bl.y,br.y))*0.4, bl.x, bl.y);
      ctx.closePath(); ctx.fill();
      /* shaded right face */
      ctx.fillStyle=shade;
      ctx.beginPath();
      ctx.moveTo(t.x, t.y); ctx.lineTo(br.x, br.y); ctx.lineTo(bc.x, bc.y);
      ctx.closePath(); ctx.fill();
      /* snow cap proportional to the on-screen peak height */
      const peakH=Math.max(bl.y,br.y)-t.y, capH=peakH*0.26, capW=(br.x-bl.x)*0.16;
      ctx.fillStyle='#f4f8fc';
      ctx.beginPath();
      ctx.moveTo(t.x, t.y);
      ctx.lineTo(t.x+capW, t.y+capH*0.7);
      ctx.lineTo(t.x+capW*0.5, t.y+capH*0.5);
      ctx.lineTo(t.x+capW*0.1, t.y+capH);
      ctx.lineTo(t.x-capW*0.5, t.y+capH*0.55);
      ctx.lineTo(t.x-capW, t.y+capH*0.75);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle='rgba(150,180,210,.5)';
      ctx.beginPath();
      ctx.moveTo(t.x+capW*0.1, t.y+capH); ctx.lineTo(t.x+capW, t.y+capH*0.7);
      ctx.lineTo(t.x+capW*0.5, t.y+capH*0.95); ctx.closePath(); ctx.fill();
    };

    /* ---- a couple of snowy peaks behind the cluster ---- */
    mountain(-70, 90, 150, 220, '#8fa6b6', '#7e96a8');
    mountain(  6, 105, 180, 240, '#9aafbe', '#86a0b0');
    mountain( 82, 92, 158, 220, '#8fa6b6', '#7e96a8');

    /* ---- BIG hills behind ---- */
    hill(-96, 52, 96, 300, '#356e38', 'rgba(18,46,24,.3)');
    hill( 70, 56, 104, 320, '#356e38', 'rgba(18,46,24,.3)');

    /* ---- MEDIUM hills ---- */
    hill(-50, 30, 70, 240, '#3f7d3f', 'rgba(20,52,26,.26)');
    hill( 46, 32, 74, 250, '#3f7d3f', 'rgba(20,52,26,.26)');

    /* ---- SMALL hills (front, creek dips between them) ---- */
    hill(-66, 12, 48, 190, '#4a8c46', 'rgba(22,56,28,.22)');
    hill( 66, 12, 50, 190, '#4a8c46', 'rgba(22,56,28,.22)');
  }
}

function drawMountains(hy, glacier){
  if(hy<=-40) return;
  const layers = glacier ? [
    {col:'#b9cfe0', snow:true,  scrollK:1.2, base:0, fill2:'#cfe2ee'},  /* far glacier peaks  */
    {col:'#8aa6b6', snow:true,  scrollK:1.9, base:0, fill2:'#9cb8c6'},  /* mid icy ridge      */
    {col:'#5d7a78', snow:false, scrollK:2.7, base:0, fill2:'#4a6360'}   /* near rock+treeline */
  ] : [
    {col:'#9fb6c0', snow:true,  scrollK:1.2, base:0, fill2:'#b7c8d0'},  /* far snowy peaks    */
    {col:'#6f8f7a', snow:false, scrollK:1.9, base:0, fill2:'#7e9c87'},  /* mid forested ridge */
    {col:'#3f5a44', snow:false, scrollK:2.7, base:0, fill2:'#324a38'}   /* near dark treeline */
  ];
  /* draw far → near; each nearer range sits a bit lower so the far peaks show above it */
  for(let li=0; li<layers.length; li++){
    const L=layers[li];
    const scroll = cam.yaw*L.scrollK;
    const baseY = hy + 2;                 /* all anchor to ground; height does the layering */
    ctx.fillStyle=L.col;
    ctx.beginPath();
    ctx.moveTo(-20, baseY);
    for(let x=-20;x<=W+20;x+=6){
      ctx.lineTo(x, baseY - (ridgeH(x, li, scroll) + L.base));
    }
    ctx.lineTo(W+20, baseY);
    ctx.closePath(); ctx.fill();
    /* shaded lower slope band for form */
    ctx.fillStyle=L.fill2; ctx.globalAlpha=0.45;
    ctx.beginPath(); ctx.moveTo(-20, baseY);
    for(let x=-20;x<=W+20;x+=6){
      const dh=ridgeH(x, li, scroll)+L.base;
      ctx.lineTo(x, baseY - dh*0.55);
    }
    ctx.lineTo(W+20, baseY); ctx.closePath(); ctx.fill();
    ctx.globalAlpha=1;
    /* snow caps on the far range peaks (glaciers get heavier, lower snow) */
    if(L.snow && SET.quality==='high'){
      ctx.fillStyle = glacier ? 'rgba(236,246,252,.95)' : 'rgba(248,251,254,.9)';
      ctx.beginPath();
      const snowThresh = glacier ? 120 : 165;
      for(let x=-20;x<=W+20;x+=4){
        const dh=ridgeH(x, li, scroll)+L.base;
        const peakTop = baseY - dh;
        if(dh > snowThresh){ const cap = glacier ? 14 : 9; ctx.moveTo(x-cap*0.5,peakTop+cap); ctx.lineTo(x, peakTop); ctx.lineTo(x+cap*0.5, peakTop+cap); ctx.closePath(); }
      }
      ctx.fill();
    }
  }
  /* soft atmospheric haze where the mountains meet the valley floor */
  const mh = ctx.createLinearGradient(0, hy-30, 0, hy+6);
  mh.addColorStop(0,'rgba(214,228,224,0)');
  mh.addColorStop(1,'rgba(214,228,224,.45)');
  ctx.fillStyle=mh; ctx.fillRect(-20, hy-30, W+40, 36);
}
function clipGround(pts){
  const cs=Math.cos(cam.yaw), sn=Math.sin(cam.yaw);
  const f1min = (NEAR - cam.h*Math.sin(cam.pitch))/Math.cos(cam.pitch) + 0.05;
  const f = p => (p.x-cam.x)*cs + (p.y-cam.y)*sn;
  const out=[];
  for(let i=0;i<pts.length;i++){
    const a=pts[i], b=pts[(i+1)%pts.length];
    const fa=f(a), fb=f(b);
    if(fa>=f1min) out.push(a);
    if((fa>=f1min)!==(fb>=f1min)){
      const t=(f1min-fa)/(fb-fa);
      out.push({x:a.x+(b.x-a.x)*t, y:a.y+(b.y-a.y)*t});
    }
  }
  return out;
}
function pathGround(pts){
  const cp = clipGround(pts);
  if(cp.length<3) return false;
  ctx.beginPath();
  for(let i=0;i<cp.length;i++){
    const s = proj(cp[i].x, cp[i].y, 0);
    if(!s) return false;
    i ? ctx.lineTo(s.x,s.y) : ctx.moveTo(s.x,s.y);
  }
  ctx.closePath();
  return true;
}
function fillGround(pts, fill){ if(pathGround(pts)){ ctx.fillStyle=fill; ctx.fill(); } }
/* visual elevation of the playing surface at a world point. Returns a world-Z height that
   proj() lifts the rendered polygon by, so a sloped green/fairway actually tilts in the
   picture (high side drawn higher on screen) instead of looking flat. */
const ELEV_VIS = 0.257;               /* visual-only tilt of the green (physics slope unchanged) */
let _shvCache = new Map();   /* memoize the static height field — same verts each frame */
function surfaceHeightVis(px,py){
  if(typeof GREEN==='undefined' || !GREEN) return 0;
  const key = (Math.round(px*2)) * 8192 + Math.round(py*2);
  const cached = _shvCache.get(key);
  if(cached!==undefined) return cached;
  const v = _surfaceHeightVis(px,py);
  if(_shvCache.size > 24000) _shvCache.clear();   /* keep memory bounded */
  _shvCache.set(key, v);
  return v;
}
function _surfaceHeightVis(px,py){
  const sd = greenSDF(px,py);          /* >0 inside the green, <0 outside (≈ -distance) */
  /* downhill holes drop the whole green to the bottom of the slope so the elevation reads
     continuously from the high tee down to the low green */
  let baseDrop = 0;
  if(CUR && CUR.teeDown && THEME()!=='volcano'){
    const tx=PIN.x-TEE.x, ty=PIN.y-TEE.y, tl=(tx*tx+ty*ty)||1;
    let prog=((px-TEE.x)*tx+(py-TEE.y)*ty)/tl; prog=Math.max(0,Math.min(1,prog));
    baseDrop = -CUR.teeDown * prog * FW_ELEV;
  }
  if(sd>0){
    /* ON the green: anchor at the front edge (meets the approach flush), tilt across, + crown */
    let h = (greenHeight(px,py) - GREEN._hFront) * ELEV_VIS;
    if(GREEN._gR){
      const t = Math.min(1, sd/GREEN._gR);
      h += Math.sin(t*Math.PI*0.5) * GREEN._gR * 0.1;   /* gentle crown */
    }
    return h + baseDrop;
  }
  /* OUTSIDE the green: on grass courses the ground rises to meet the green and eases back
     down (a natural hill). On the lava map the green sits on a rocky ASH SHELF that steps
     out from the green edge and then drops down toward the molten lava — a believable
     transition from putting surface → scorched rock → lava, instead of a floating edge. */
  const d = -sd;                        /* distance outside the green */
  const edgeH = (greenHeight(px,py) - GREEN._hFront) * ELEV_VIS;
  if(THEME()==='volcano'){
    const SHELF = 30;                   /* width of the flat-ish rock shelf around the green */
    const DROP  = 34;                   /* how far the shelf then falls before it meets lava */
    /* how much this point is on the FRONT (approach) side: 1 at the front, 0 at the back/sides.
       On the front we DON'T drop into lava — we bridge out to the fairway so the approach
       connects. Everywhere else the shelf falls into the lava as before. */
    let front=0;
    if(GREEN._apX!==undefined){
      const vx=px-GREEN._gcx, vy=py-GREEN._gcy, vl=Math.hypot(vx,vy)||1;
      const dotp = -(vx/vl*GREEN._apX + vy/vl*GREEN._apY);   /* +1 toward the tee/front */
      front = Math.max(0, dotp);
    }
    if(d <= SHELF){
      const f = 1 - d/SHELF;
      const shelfH = edgeH * (0.45 + 0.55*f*f*(3-2*f)) - (d/SHELF)*6;
      return shelfH * (1-front) + (edgeH*(0.6+0.4*f) ) * front;   /* front stays up near fairway */
    }
    if(d <= SHELF+DROP){
      const dd=(d-SHELF)/DROP, base=edgeH*0.45-6, f=1-dd;
      const lavaSide = base * f*f*(3-2*f) - dd*22;
      const bridge   = edgeH*0.5*f;                 /* front eases gently to ~fairway level */
      return lavaSide*(1-front) + bridge*front;
    }
    const lavaFloor=-28, bridgeFar=0;
    return lavaFloor*(1-front) + bridgeFar*front;
  }
  /* grass courses: rising hill that eases back to flat */
  const SKIRT = 58 + Math.min(60, Math.abs(edgeH)*1.4);
  if(d > SKIRT) return baseDrop * Math.max(0, 1 - (d-SKIRT)/40);   /* ease the drop out past the skirt */
  const f = 1 - d/SKIRT;
  const ease = f*f*f*(f*(f*6-15)+10);   /* quintic smootherstep → ultra-smooth at both ends */
  let h = edgeH * ease + baseDrop;
  /* WATER-EDGE BLEND: where the raised green-surround meets a pond, ease the ground height
     back down toward water level (0). Without this the elevated skirt geometry and the flat
     pond geometry project to different screen points and the edge looks glitched/unfinished.
     We measure how deep the point is into the nearest pond (0 at the shore, 1 well inside)
     and fade the height to 0 across that band so the slope meets the water flush. */
  if(WATERS && WATERS.length){
    let wet = 0;
    for(const w of WATERS){
      if(!w.pond) continue;
      /* quick reject: far outside this pond's bounds */
      const maxR = Math.max(w.rx, w.ry)*1.6;
      if(Math.abs(px-w.x) > maxR || Math.abs(py-w.y) > maxR) continue;
      if(inWater(px,py,w)){ wet = 1; break; }     /* inside the painted water → fully flat */
      /* just outside the shore: ease the height down over a thin band so the slope meets the
         waterline smoothly. Sample inWater a few px toward the pond centre to gauge nearness. */
      const dx=w.x-px, dy=w.y-py, dl=Math.hypot(dx,dy)||1;
      const ux=dx/dl, uy=dy/dl;
      for(let step=6; step<=22; step+=8){
        if(inWater(px+ux*step, py+uy*step, w)){
          const t = 1 - (step-6)/16;             /* nearer the shore → stronger ease */
          if(t > wet) wet = t;
          break;
        }
      }
    }
    if(wet > 0) h = h * (1 - wet);   /* fade ground height to water level at/near the pond */
  }
  return h;
}
/* visual tilt of the FAIRWAY (grass courses): the short grass leans the way CUR.fwSlope/
   slopeZones push the ball, expressed as a gentle elevation. It fades to 0 toward the fairway
   edges so it transitions smoothly into the rough instead of a hard slab. Visual only. */
const FW_ELEV = 0.5;
let _fhvCache = new Map();
function fairwayHeightVis(px,py){
  const key = (Math.round(px*2)) * 8192 + Math.round(py*2);
  const cached = _fhvCache.get(key);
  if(cached!==undefined) return cached;
  const v = _fairwayHeightVis(px,py);
  if(_fhvCache.size > 24000) _fhvCache.clear();
  _fhvCache.set(key, v);
  return v;
}
function _fairwayHeightVis(px,py){
  if(THEME()==='volcano') return 0;          /* volcano fairway handled separately */
  const hasLocal = CUR && (CUR.fwSlope || CUR.slopeZones);
  const hasBig = CUR && (CUR.teeDown || CUR.crossTilt);
  if(!hasLocal && !hasBig) return 0;
  const ds = distToSpine(px,py);
  if(ds > FAIRWAY_W) return 0;                /* only on the fairway */
  let h=0;
  if(CUR.fwSlope){
    h += -((px-PIN.x)*CUR.fwSlope.dx + (py-PIN.y)*CUR.fwSlope.dy) * CUR.fwSlope.s * 0.16;
  }
  if(CUR.slopeZones) for(const z of CUR.slopeZones){
    const dx=px-z.x, dy=py-z.y, dd=Math.hypot(dx,dy);
    if(dd<z.r){ const fall=1-dd/z.r; h += -(dx*z.dx+dy*z.dy)*z.s*0.1*fall; }
  }
  /* BIG terrain shaping (per-hole, optional): a whole-hole drop from the tee down to the
     green, and a cross-slope that tilts one side of the fairway higher than the other. */
  if(CUR.teeDown){
    /* progress 0 at tee → 1 at green along the straight tee→pin line; green sits lower */
    const tx=PIN.x-TEE.x, ty=PIN.y-TEE.y, tl=(tx*tx+ty*ty)||1;
    let prog=((px-TEE.x)*tx+(py-TEE.y)*ty)/tl; prog=Math.max(0,Math.min(1,prog));
    h += -CUR.teeDown * prog;                 /* positive teeDown = downhill toward green */
  }
  if(CUR.crossTilt){
    /* signed distance to the spine's RIGHT side (perpendicular). Right side rides higher. */
    const s=nearestSpineFrame(px,py);
    if(s) h += s.side * CUR.crossTilt;        /* side: +1 right of play line, -1 left */
  }
  /* fade out near the fairway edge so it blends into the rough (no cliff at the fairway line) */
  const edgeFade = Math.min(1, (FAIRWAY_W - ds)/26);
  return h * FW_ELEV * Math.max(0, edgeFade);
}
/* nearest point on the spine + signed side (perp). side>0 = right of the tee→green direction */
function nearestSpineFrame(px,py){
  if(!SPINE || SPINE.length<2) return null;
  let best=1e9, bi=0, bt=0;
  for(let i=0;i<SPINE.length-1;i++){
    const a=SPINE[i], b=SPINE[i+1];
    const vx=b.x-a.x, vy=b.y-a.y, L=(vx*vx+vy*vy)||1;
    let t=((px-a.x)*vx+(py-a.y)*vy)/L; t=Math.max(0,Math.min(1,t));
    const cx=a.x+vx*t, cy=a.y+vy*t, d=Math.hypot(px-cx,py-cy);
    if(d<best){ best=d; bi=i; bt=t; }
  }
  const a=SPINE[bi], b=SPINE[bi+1];
  const vx=b.x-a.x, vy=b.y-a.y, n=Math.hypot(vx,vy)||1;
  const cx=a.x+vx*bt, cy=a.y+vy*bt;
  /* right-normal of travel direction (vx,vy) is (vy,-vx)/|v| in screen coords */
  const rnx=vy/n, rny=-vx/n;
  const side=((px-cx)*rnx+(py-cy)*rny);       /* signed perpendicular offset (px) */
  return {cx, cy, side: Math.max(-1,Math.min(1, side/FAIRWAY_W))};
}
/* like pathGround but lifts each vertex by its surface elevation (true visual tilt) */
function pathGroundH(pts, hfn){
  const cp = clipGround(pts);
  if(cp.length<3) return false;
  let started=false, n=0;
  for(let i=0;i<cp.length;i++){
    const z = hfn(cp[i].x, cp[i].y);
    const s = proj(cp[i].x, cp[i].y, z);
    if(!s) continue;                       /* skip a vertex behind the camera, don't abort */
    if(!started){ ctx.beginPath(); ctx.moveTo(s.x,s.y); started=true; }
    else ctx.lineTo(s.x,s.y);
    n++;
  }
  if(n<3) return false;
  ctx.closePath();
  return true;
}
function fillGroundH(pts, fill, hfn){ if(pathGroundH(pts, hfn)){ ctx.fillStyle=fill; ctx.fill(); } }
function circlePolyXY(cx, cy, rx, ry, n){
  const pts=[];
  for(let i=0;i<n;i++){ const a=i/n*Math.PI*2;
    pts.push({x:cx+Math.cos(a)*rx, y:cy+Math.sin(a)*ry}); }
  return pts;
}
function strokeWorldLine(pts, style, width, dash){
  ctx.save();
  ctx.strokeStyle=style; ctx.lineWidth=width; ctx.lineCap='round'; ctx.lineJoin='round';
  if(dash) ctx.setLineDash(dash);
  ctx.beginPath();
  let started=false;
  for(const p of pts){
    const s=proj(p.x,p.y,p.z||0);
    if(!s){ started=false; continue; }
    started ? ctx.lineTo(s.x,s.y) : ctx.moveTo(s.x,s.y);
    started=true;
  }
  ctx.stroke();
  ctx.restore();
}
/* project a world polyline to screen points, splitting at off-screen gaps */
function projPath(pts){
  const out=[]; let run=[];
  for(const p of pts){
    const s=proj(p.x,p.y,p.z||0);
    if(!s){ if(run.length) out.push(run); run=[]; continue; }
    run.push(s);
  }
  if(run.length) out.push(run);
  return out;
}
/* smooth screen polyline via Catmull-Rom → cubic bezier */
function tracePath(scr){
  if(scr.length<2) return;
  ctx.moveTo(scr[0].x, scr[0].y);
  if(scr.length===2){ ctx.lineTo(scr[1].x, scr[1].y); return; }
  for(let i=0;i<scr.length-1;i++){
    const p0=scr[i-1]||scr[i], p1=scr[i], p2=scr[i+1], p3=scr[i+2]||scr[i+1];
    const c1x=p1.x+(p2.x-p0.x)/6, c1y=p1.y+(p2.y-p0.y)/6;
    const c2x=p2.x-(p3.x-p1.x)/6, c2y=p2.y-(p3.y-p1.y)/6;
    ctx.bezierCurveTo(c1x,c1y,c2x,c2y,p2.x,p2.y);
  }
}
/* premium curved preview stroke: soft glow underlay + clean bright core */
function strokeSmooth(pts, color, width, dash, glow){
  const segs=projPath(pts);
  if(!segs.length) return;
  ctx.save();
  ctx.lineCap='round'; ctx.lineJoin='round';
  if(glow){
    ctx.strokeStyle=glow; ctx.lineWidth=width+5;
    ctx.beginPath(); segs.forEach(tracePath); ctx.stroke();
  }
  ctx.strokeStyle=color; ctx.lineWidth=width;
  if(dash) ctx.setLineDash(dash);
  ctx.beginPath(); segs.forEach(tracePath); ctx.stroke();
  ctx.restore();
}
function canPutt(){ return greenSDF(ball.x,ball.y) > -RIM_COLLAR; }
function autoClubFor(){
  const sf = surfaceAt(ball.x,ball.y);
  const d = dist(ball.x,ball.y,PIN.x,PIN.y);
  const yds = d * YD_PER_PX;                                    // distance to pin in yards
  if(sf==='sand') return 4;                                     // 60° wedge from sand — you never putt out of a bunker, even a greenside one
  if(sf==='green' || canPutt()) return 3;                      // putter on/around green
  if(yds <= 100) return 4;                                      // 60° wedge: 100yds and in (high, rips back)
  if(PAR===3 && yds <= 130) return 4;                          // short par 3s: lofted wedge
  if(PAR===3){                                                  // par 3s: club up to the distance
    if(d > 360) return 0;                                       //   long carry par 3 → driver
    if(d > 235) return 1;                                       //   mid-long par 3 → iron
    return 2;                                                   //   standard par 3 → wedge
  }
  if(d > 380 || (strokes===0 && PAR>=4 && d > 320)) return 0;   // driver: long openings
  if(d > 235) return 1;                                         // iron: fairway placement
  return 2;                                                     // wedge: scoring range
}
function applyAutoClub(){
  clubIdx = autoClubFor();
  document.getElementById('clubName').textContent = CLUBS[clubIdx].name;
  document.getElementById('spinChip').style.display  = CLUBS[clubIdx].spinF>0.5 ? 'flex' : 'none';
  updateCtlUI();
}
function updateCtlUI(){
  /* vertical spin dock: top = topspin (+), bottom = backspin (-) */
  const fill=document.getElementById('spinFill');
  const knob=document.getElementById('spinKnob');
  const val =document.getElementById('spinVal');
  if(!fill) return;
  const topCol='#d99a5b', backCol='#7fa8c9';     /* muted amber / muted steel-blue */
  const pct=Math.abs(spin)*50;
  if(spin>=0){ fill.style.top=(50-pct)+'%'; fill.style.height=pct+'%';
               fill.style.background='linear-gradient(180deg,'+topCol+','+topCol+'cc)'; }
  else       { fill.style.top='50%'; fill.style.height=pct+'%';
               fill.style.background='linear-gradient(180deg,'+backCol+'cc,'+backCol+')'; }
  const eng = Math.abs(spin)>=0.2;
  knob.style.top=(50 - spin*50)+'%';
  knob.style.setProperty('--glow', eng ? (spin>0?topCol:backCol) : 'transparent');
  knob.style.background = eng ? (spin>0?topCol:backCol) : 'var(--ivory)';
  val.textContent = spin<-0.2?'BACKSPIN':spin>0.2?'TOPSPIN':'NEUTRAL';
  val.style.color = eng ? (spin>0?'#eebd8e':'#a9c9e4') : 'var(--ivory)';
}
/* drag the spin dock directly: pointer Y maps to spin (+1 top … -1 bottom) */
{
  const dock = document.getElementById('spinChip');
  const track = document.getElementById('spinTrack');
  let dragging=false;
  function spinFromY(clientY){
    const r=track.getBoundingClientRect();
    const t=Math.max(0, Math.min(1, (clientY-r.top)/r.height));
    spin = Math.max(-1, Math.min(1, 1 - t*2));
    updateCtlUI();
    if(state===ST.AIM) refreshPrediction();
  }
  dock.addEventListener('pointerdown', e=>{
    if(!(state===ST.AIM || state===ST.PULL)) return;
    dragging=true; dock.setPointerCapture(e.pointerId);
    e.stopPropagation(); e.preventDefault();
    spinFromY(e.clientY);
  });
  dock.addEventListener('pointermove', e=>{ if(dragging){ e.stopPropagation(); spinFromY(e.clientY); } });
  dock.addEventListener('pointerup',   e=>{ dragging=false; e.stopPropagation(); });
  dock.addEventListener('pointercancel', ()=>{ dragging=false; });
}

/* ============================ SHARED SHOT PHYSICS ============================ */
/* realistic break: the green is a height field; gravity does the rest.
   uphill bleeds speed, downhill adds it, side-slope bends the line. */
function applySlopeAndRim(o, sf, speed, dt){
  if(sf==='green' && speed>4){
    const g = greenGrad(o.x,o.y);
    /* honest gravity along the line; the BREAK (lateral pull) bites harder
       as the ball dies — late curve without starving uphill putts.
       Volcano greens are steeper (extra tilt) so a weak shot rolls off into the lava. */
    const gScale = THEME()==='volcano' ? SLOPE_G*1.35 : SLOPE_G;
    let ax=-g.x*gScale, ay=-g.y*gScale;
    const vx=o.vx/speed, vy=o.vy/speed;
    const along = ax*vx + ay*vy;
    const lx = ax - along*vx, ly = ay - along*vy;
    const m = 1 + 0.9*Math.max(0, 1 - speed/240);
    o.vx += (along*vx + lx*m)*dt;
    o.vy += (along*vy + ly*m)*dt;
  }
  /* FAIRWAY slope (Volcano Ridge): the short grass tilts, so a rolling ball drifts toward the
     lava edge. A global fwSlope tilts the whole fairway; optional slopeZones add stronger local
     tilts in specific spots so the ball rolls off into lava if it stops in the wrong place. */
  if(sf==='fairway' && speed>2.5){
    let ax=0, ay=0;
    if(CUR.fwSlope){ ax += CUR.fwSlope.dx*CUR.fwSlope.s; ay += CUR.fwSlope.dy*CUR.fwSlope.s; }
    if(CUR.slopeZones) for(const z of CUR.slopeZones){
      const dx=o.x-z.x, dy=o.y-z.y, d2=dx*dx+dy*dy;
      if(d2 < z.r*z.r){
        const fall = 1 - Math.sqrt(d2)/z.r;          /* stronger toward the zone center */
        ax += z.dx*z.s*fall; ay += z.dy*z.s*fall;
      }
    }
    o.vx += ax*SLOPE_G*0.85*dt;
    o.vy += ay*SLOPE_G*0.85*dt;
  }
  const sd = greenSDF(o.x,o.y);
  if(sd < RIM_BAND_IN && sd > -RIM_COLLAR && speed < RIM_EXIT_SPEED){
    const n = sdfGrad(o.x,o.y);
    const m = Math.hypot(n.x,n.y)||1;
    const k = Math.min(1.35, (RIM_BAND_IN - sd)/(RIM_BAND_IN+RIM_COLLAR));
    o.vx += n.x/m * k*RIM_ACCEL*dt;
    o.vy += n.y/m * k*RIM_ACCEL*dt;
  }
}
function launchParams(power, angle, ci, lie, spinAmt){
  const club = CLUBS[ci];
  let distPx = (power/100)*club.maxDist*lieMods(lie,ci).dist;
  if(ci===2) distPx *= 1.5;              /* hidden wedge range calibration (all holes) */
  /* BACKSPIN adds a touch of carry: extra spin makes the ball climb and hang, flying slightly
     FARTHER through the air before it checks down. Smooth, scales with the club's backspin
     authority — up to ~5% more at full backspin. */
  if(spinAmt < 0 && club.loft>0){
    const backAuth = (club.backF ?? club.spinF) || 0;       /* 0..1.5 */
    const grab = Math.min(1, (-spinAmt) * Math.min(1, backAuth));
    distPx *= (1 + 0.05*grab);
  }
  /* ===== DEDICATED BUNKER SHOT (lofted/60° wedge from sand) =====
     A real splash shot: the ball pops UP steeply and out, travels short, and can't be
     blasted far no matter the power. Backspin makes it check & stop; topspin rolls it out. */
  const isBunkerShot = (lie==='sand') && (ci===4 || ci===2) && club.loft>0;
  if(isBunkerShot){
    /* hard distance cap so it never flies the green — escape first, distance second */
    const SAND_CAP = (ci===4 ? 150 : 175);                  /* px: ~82y (60°) / ~96y (wedge) */
    distPx = Math.min(distPx, SAND_CAP);
    const v = Math.sqrt(2*BASE_DECEL*Math.max(8,distPx));
    /* steeper, higher launch out of the sand (more vertical, less forward) */
    const fwd = 0.74;                                       /* travels out, just less than normal */
    const lift = 1.32;                                      /* extra-high pop to clear the lip     */
    return {vx:Math.cos(angle)*v*fwd, vy:Math.sin(angle)*v*fwd, vz:v*0.8*club.loft*lift, air:true};
  }
  if(club.loft>0){
    const v = Math.sqrt(2*BASE_DECEL*Math.max(8,distPx));
    return {vx:Math.cos(angle)*v*0.8, vy:Math.sin(angle)*v*0.8, vz:v*0.8*club.loft, air:true};
  }
  /* putter calibrated against actual (fast) green friction;
     full power always covers ~1.7x the current putt — no dead putts, ever */
  const pm = putterMax();
  distPx = (power/100)*pm;
  const v = Math.sqrt(2*50*Math.max(8,distPx));
  return {vx:Math.cos(angle)*v, vy:Math.sin(angle)*v, vz:0, air:false};
}
function putterMax(){
  return Math.min(340, Math.max(120, dist(ball.x,ball.y,PIN.x,PIN.y)*2.3));
}
function contactSpin(o, sf, settle){
  const s = (o.spin||0);
  const sh = (o.shape||0);            /* fade (sh>0) lands soft & stops; draw releases */
  if(settle){
    let m = Math.max(0.2, 0.85 + 0.7*s);
    m *= (1 - 0.2*sh);
    if(sf==='green' && o.impactVz!=null){
      /* steep descent checks up; a flat trajectory releases across the green */
      const steep = Math.min(1, -o.impactVz/300);
      m *= Math.max(0.75, Math.min(1.12, 1.12 - steep*0.37));
    }
    if(o.windF){
      const sp0=Math.hypot(o.vx,o.vy);
      if(sp0>1){
        const along=(wind.x*o.vx + wind.y*o.vy)/sp0;
        m *= 1 + Math.max(-0.15, Math.min(0.15, along*wind.mph*0.012*o.windF));
      }
    }
    o.vx*=m; o.vy*=m;
    /* ===== green spin behavior (PGA-style) ===== */
    if(sf==='green'){
      const sp = Math.hypot(o.vx,o.vy);
      /* BACKSPIN: the ball grabs the green and rolls BACK toward the player.
         Fires across a wide speed window so it's reliable, and the strength
         scales with how much backspin and how steeply the ball came down. */
      if(s < -0.15 && sp > 0.01){                       /* backspin checks + rips */
        const steep = o.impactVz!=null ? Math.min(1, -o.impactVz/260) : 0.5;
        const grab = (-s);                              /* 0.15 .. 1 */
        /* SLOPE EFFECT: backspin rolls the ball BACK toward the player. If the green falls
           away in that backward direction, the ball must climb back uphill, so it rips back
           LESS. If it falls toward the player, it rips back a touch more. greenGrad points
           uphill; dotting it with the backward roll dir gives the uphill-along-backspin amount. */
        const g = greenGrad(o.x, o.y);
        const bx = -Math.cos(aimAngle), by = -Math.sin(aimAngle);   /* backward roll dir */
        const upBack = g.x*bx + g.y*by;                 /* >0 = rolling back is UPHILL (downslope away) */
        /* ~25% less on a typical downslope, scaling with steepness (gradient ~0..1.2);
           caps so it never fully kills the check and can give a small boost downhill-to-player */
        let slopeF = 1 - upBack*0.85;
        slopeF = Math.max(0.45, Math.min(1.35, slopeF));
        const gEff = grab * slopeF;                     /* slope-adjusted backspin authority */
        /* 1) CHECK dead: kill the forward momentum entirely */
        o.vx = 0; o.vy = 0;
        /* 2) RIP backward toward the player. The sustained crawl below does most of the
           travel, so set a moderate launch and a strong, longer-lived crawl. */
        const back = (30 + 50*gEff) * (0.5 + 0.5*steep);    /* px/s initial backward */
        o.vx = -Math.cos(aimAngle)*back;
        o.vy = -Math.sin(aimAngle)*back;
        o.zipped = true;
        o.spinRoll = -gEff*(0.78 + 0.5*steep);            /* strong, sustained backward crawl */
      }
      /* TOPSPIN: the ball releases and chases forward (no velocity spike — the
         reduced green friction + a gentle forward crawl give a natural run-out). */
      else if(s > 0.25 && sp > 0.01){
        o.spinRoll = s*0.45;                            /* sustains a short forward run */
      }
    }
  } else {
    /* measure incoming pace BEFORE the spin/turf cut, so we can tell a hot (hard-hit)
       shot from a soft one and decide whether it skips forward first. */
    const inSpd = Math.hypot(o.vx,o.vy);
    let m = Math.max(0.3, 0.78 + 0.42*s);
    m *= (1 - 0.14*sh);
    o.vx*=m; o.vy*=m;
    /* BACKSPIN on the green (realistic two-phase):
       a hard, high-spin shot SKIPS FORWARD on the first hop, then the spin catches
       and rips it back on the following hops — the classic TV "release then zip back".
       A soft/short shot just grabs right away. */
    if(sf==='green' && s < -0.15){
      o.bounceN = (o.bounceN||0) + 1;
      const grab = -s;                               /* 0.15 .. 1 */
      const hot = Math.min(1, inSpd/130);            /* how hard it landed (pre-cut)      */
      if(o.bounceN===1 && hot>0.4){
        /* FIRST hop on a hot shot: RELEASE forward, but ~40% shorter than before so it
           skips out a modest amount, then bites. Restores less of the spin-cut speed. */
        const release = (0.33 + 0.24*hot) / Math.max(0.3, m);  /* ~40% less forward skip */
        o.vx *= release; o.vy *= release;
        o.vz *= (1 - grab*0.30);                      /* lower second hop = shorter skip    */
      } else {
        /* later hops (or a soft first hop): the spin GRABS and checks hard. */
        const bite = Math.max(0.14, 1 - grab*0.94);
        o.vx *= bite; o.vy *= bite;
        o.vz *= (1 - grab*0.6);
      }
    }
    /* shaped shots kick sideways off the first bounce */
    const sp = Math.hypot(o.vx,o.vy);
    if(sp>1 && sh!==0){
      const px=-o.vy/sp, py=o.vx/sp;
      o.vx += px*sh*sp*0.12;
      o.vy += py*sh*sp*0.12;
    }
  }
}
/* flight: wind + shot shape curve */
function airAccel(o, club, dt){
  o.vz -= GRAV*dt;
  o.vx += wind.x*wind.mph*3*club.windF*dt;
  o.vy += wind.y*wind.mph*3*club.windF*dt;
  const sp = Math.hypot(o.vx,o.vy);
  if(sp>1){
    const px = -o.vy/sp, py = o.vx/sp;
    const sh = (o.shape||0)*club.shapeF;
    if(sh!==0){
      /* fade curves right of flight, draw curves left */
      o.vx += px*sh*115*dt;
      o.vy += py*sh*115*dt;
    }
    /* quartering wind bends the shot on the same axis as shape */
    const cross = (wind.x*px + wind.y*py)*wind.mph;
    o.vx += px*cross*0.9*club.windF*dt;
    o.vy += py*cross*0.9*club.windF*dt;
  }
}

/* prediction with phases: air (dashed) / roll (solid), bounce markers */
function predictShot(power){
  const club = CLUBS[clubIdx];
  /* putting preview: a faint, imperfect read of the break.
     it under-senses slope (more on longer putts) and knows nothing
     about the rim assist — line + speed are still on the player. */
  if(clubIdx===3){
    const v = Math.sqrt(2*50*Math.max(8,(power/100)*putterMax()));
    const o = {x:ball.x, y:ball.y, z:0, vx:Math.cos(aimAngle)*v, vy:Math.sin(aimAngle)*v, vz:0, air:false, moving:true};
    const pts=[{x:o.x,y:o.y,z:surfaceHeightVis(o.x,o.y)}];
    let trav=0;
    const dt=1/40;
    /* EXACT accuracy: drive the prediction through the SAME physics the real ball uses
       (applySlopeAndRim), including the rim/SDF pull near the hole and volcano steepness.
       No reimplemented copy, so the yellow line cannot drift from reality on sharp breaks. */
    for(let i=0;i<460;i++){
      const sf=surfaceAt(o.x,o.y);
      const spd=Math.hypot(o.vx,o.vy);
      if(sf==='water') break;
      applySlopeAndRim(o, sf, spd, dt);            // ← the real putt physics
      let decel=FRICTION[sf] ?? FRICTION.rough;
      if(sf==='green' && spd<24) decel += (24-spd)*(24-spd)*0.62;
      const sp2=Math.hypot(o.vx,o.vy);
      const ns=Math.max(0, sp2 - decel*dt);
      if(sp2>0){ o.vx*=ns/sp2; o.vy*=ns/sp2; }
      o.x+=o.vx*dt; o.y+=o.vy*dt; trav+=ns*dt;
      if(i%2===0) pts.push({x:o.x,y:o.y,z:surfaceHeightVis(o.x,o.y)});
      if(ns<6) break;
    }
    return {puttPath:pts, puttLen:trav};
  }
  const lie = surfaceAt(ball.x,ball.y);
  const startLine = aimAngle - shape*club.shapeF*0.07;   /* fade starts left, draw starts right */
  const L = launchParams(power, startLine, clubIdx, lie, spin);
  const predSpin = spin * (spin<0 ? (CLUBS[clubIdx].backF ?? CLUBS[clubIdx].spinF) : (CLUBS[clubIdx].topF ?? CLUBS[clubIdx].spinF));
  /* match fireShot's launch shape so the predicted arc = the real flight */
  if(L.air && clubIdx!==3 && Math.abs(predSpin)>0.01){
    if(predSpin<0){ const b=-predSpin; L.vz*=(1+b*0.30); L.vx*=(1-b*0.24); L.vy*=(1-b*0.24); }
    else { L.vz*=(1-predSpin*0.16); L.vx*=(1+predSpin*0.06); L.vy*=(1+predSpin*0.06); }
  }
  const o = {x:ball.x, y:ball.y, z:0, vx:L.vx, vy:L.vy, vz:L.vz, air:L.air,
             spin: predSpin, shape: shape*CLUBS[clubIdx].shapeF, windF:club.windF};
  const airPts=[{x:o.x,y:o.y,z:surfaceHeightVis(o.x,o.y)}], rollPts=[];
  const bounces=[];
  let landing=null, water=false, zipIdx=-1;
  const dt=1/40;
  for(let i=0;i<460;i++){
    if(o.air){
      airAccel(o, club, dt);
      o.x += o.vx*dt; o.y += o.vy*dt; o.z += o.vz*dt;
      if(o.z<=0){
        o.z=0;
        if(o.impactVz==null) o.impactVz=o.vz;
        const sf=surfaceAt(o.x,o.y);
        if(!landing) landing={x:o.x,y:o.y};
        if(sf==='water'){ water=true; break; }
        if(sf==='sand'){ o.air=false; o.vz=0; o.vx*=0.2; o.vy*=0.2; }
        else if(o.vz<-90){ bounces.push({x:o.x,y:o.y}); o.vz=-o.vz*0.38; contactSpin(o, sf, false); o.vx*=0.78; o.vy*=0.78; }
        else { o.air=false; o.vz=0; o.vx*=0.85; o.vy*=0.85; contactSpin(o, sf, true);
               if(o.zipped && zipIdx<0) zipIdx=rollPts.length; }
      }
      if(i%2===0) airPts.push({x:o.x,y:o.y,z:o.z+surfaceHeightVis(o.x,o.y)});
    } else {
      const sf=surfaceAt(o.x,o.y);
      if(sf==='water'){ water=true; if(!landing) landing={x:o.x,y:o.y}; break; }
      const sp=Math.hypot(o.vx,o.vy);
      applySlopeAndRim(o, sf, sp, dt);
      let decel = FRICTION[sf] ?? FRICTION.rough;
      if(CUR.fastFw && sf==='fairway') decel *= 0.62;     /* match fast fairway roll */
      if((o.spin||0)>0.3 && !o.zipped) decel *= (1 - 0.28*o.spin);   /* match real physics */
      /* sustained spin crawl, same as the live ball (so the line shows the true roll) */
      if(sf==='green' && o.spinRoll && Math.abs(o.spinRoll)>0.02){
        const dirx=Math.cos(aimAngle), diry=Math.sin(aimAngle);
        const crawl = o.spinRoll * 42 * dt;
        o.vx += dirx*crawl; o.vy += diry*crawl;
        o.spinRoll *= (1 - dt*1.9);
      }
      if(sf==='green' && sp<24) decel += (24-sp)*(24-sp)*0.62;
      const ns = Math.max(0, Math.hypot(o.vx,o.vy) - decel*dt);
      const sp2 = Math.hypot(o.vx,o.vy);
      if(sp2>0){ o.vx*=ns/sp2; o.vy*=ns/sp2; }
      o.x += o.vx*dt; o.y += o.vy*dt;
      if(i%2===0) rollPts.push({x:o.x,y:o.y,z:surfaceHeightVis(o.x,o.y)});
      if(dist(o.x,o.y,PIN.x,PIN.y)<HOLE_R && ns<125){ rollPts.push({x:PIN.x,y:PIN.y,z:surfaceHeightVis(PIN.x,PIN.y)}); break; }
      if(ns<8) break;
    }
  }
  if(!landing) landing={x:o.x,y:o.y};
  const carry = dist(ball.x,ball.y,landing.x,landing.y);
  const backPts = zipIdx>=0 ? rollPts.slice(Math.max(0,zipIdx-1)) : [];
  const fwdPts  = zipIdx>=0 ? rollPts.slice(0, zipIdx+1) : rollPts;
  return {airPts, rollPts:fwdPts, backPts, bounces, landing, rest:{x:o.x,y:o.y}, water, carry,
          errR: 13 + Math.sin(club.maxErr*lieMods(lie,clubIdx).err)*carry*0.55};
}

/* ============================ RENDER ============================ */
let clouds = [];
for(let i=0;i<7;i++) clouds.push({a:Math.random()*Math.PI*2, h:30+Math.random()*70, s:30+Math.random()*40, d:0.6+Math.random()*0.8});
let curNow = 0;
let VOLCANO = null, eruptT = 0, lastNow = 0, SCORCH = [];   /* eruption phase clock (sec into the cycle) */
function eruptPhase(){            /* 0..1 across the cycle; danger during the burst window */
  if(!VOLCANO) return {active:false, k:0};
  const period = VOLCANO.period || 6.0;
  const t = eruptT % period;
  const warn = period-1.4, burst = period;          /* last 1.4s = eruption */
  if(t >= warn) return {active:true, k:(t-warn)/(burst-warn)};   /* k: 0→1 plume rise/fall */
  return {active:false, k:0, warn:(warn - t)};       /* seconds until it blows */
}
/* dimple directions: evenly distributed points on the unit sphere (Fibonacci).
   Denser pattern reads as a real golf-ball surface; still cheap to draw. */
const DIMPLES = Array.from({length:130},(_,i)=>{
  const t=(i+0.5)/130, ga=i*2.39996323;                /* golden angle */
  const z=1-2*t, rr=Math.sqrt(Math.max(0,1-z*z));
  return {x:Math.cos(ga)*rr, y:z, z:Math.sin(ga)*rr};
});
const GAME_PETALS = Array.from({length:14},(_,k)=>({
  x:(k*173)%960, y:(k*97)%380, s:2+(k%3), spd:2600+(k%5)*700, ph:k*1.3
}));
function shadeColor(t, lam=0){
  /* low = darker, high = lighter, plus directional lighting on the slopes */
  let lo=[70,138,66], hi=[182,228,150];               /* natural bent-grass range */
  if(THEME()==='volcano'){ lo=[58,70,40]; hi=[140,138,70]; }   /* scorched olive-brown turf */
  else if(THEME()==='maple'){ lo=[54,128,58], hi=[150,214,120]; }  /* lush, deep mountain-valley turf */
  let r=lo[0]+(hi[0]-lo[0])*t, g=lo[1]+(hi[1]-lo[1])*t, b=lo[2]+(hi[2]-lo[2])*t;
  const k = 1 + lam*0.34;
  return `rgb(${Math.round(r*k)},${Math.round(g*k)},${Math.round(b*k)})`;
}
function draw(now){
  curNow = now;
  if(VOLCANO) eruptT += Math.min(0.05, (now-(lastNow||now))/1000);
  lastNow = now;
  ctx.clearRect(0,0,W,H);
  ctx.save();
  if(shake>0.2) ctx.translate((Math.random()-0.5)*shake, (Math.random()-0.5)*shake);
  const hy = horizonY();

  /* sky + distant hills */
  /* graded atmosphere: deep zenith → warm hazed horizon */
  const sky = ctx.createLinearGradient(0,0,0,Math.max(hy,1));
  if(THEME()==='volcano'){
    sky.addColorStop(0,'#3a2630'); sky.addColorStop(0.5,'#6e4338');
    sky.addColorStop(0.82,'#a8623a'); sky.addColorStop(1,'#d68a4a');   /* ash + ember haze */
  } else if(THEME()==='maple'){
    sky.addColorStop(0,'#3f86c4'); sky.addColorStop(0.5,'#7db4dd');
    sky.addColorStop(0.85,'#c2dcea'); sky.addColorStop(1,'#e8eef0');   /* crisp alpine blue */
  } else {
    sky.addColorStop(0,'#5fb0e8'); sky.addColorStop(0.55,'#a8d6f2');
    sky.addColorStop(0.85,'#d9ecf4'); sky.addColorStop(1,'#f2efe2');
  }
  ctx.fillStyle=sky; ctx.fillRect(-20,-20,W+40,Math.max(hy,0)+21);
  {
    /* sun: small hot core inside a broad warm bloom */
    let sx = ((0.8 - cam.yaw*0.9)/(Math.PI*2))*(W*2.4);
    sx = ((sx % (W*2.4)) + W*2.4) % (W*2.4) - W*0.7;
    const sy = Math.max(hy-86,30);
    const bloom = ctx.createRadialGradient(sx,sy,4, sx,sy,120);
    bloom.addColorStop(0,'rgba(255,246,214,.9)');
    bloom.addColorStop(0.25,'rgba(255,240,190,.35)');
    bloom.addColorStop(1,'rgba(255,240,190,0)');
    ctx.fillStyle=bloom; ctx.fillRect(sx-130,sy-130,260,260);
    ctx.fillStyle='rgba(255,250,232,.95)';
    ctx.beginPath(); ctx.arc(sx, sy, 19, 0, Math.PI*2); ctx.fill();
  }
  /* clouds: soft multi-lobe masses with shaded undersides */
  clouds.forEach(c=>{
    let x = ((c.a - cam.yaw*c.d)/(Math.PI*2))*(W*2.4);
    x = ((x % (W*2.4)) + W*2.4) % (W*2.4) - W*0.7;
    const y = hy - c.h + Math.sin(now/4000+c.a)*3;
    ctx.fillStyle='rgba(173,196,212,.35)';                 /* underside shadow */
    ctx.beginPath();
    ctx.ellipse(x+c.s*0.1, y+c.s*0.12, c.s*1.02, c.s*0.36, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.92)';
    ctx.beginPath();
    ctx.ellipse(x, y, c.s, c.s*0.4, 0, 0, Math.PI*2);
    ctx.ellipse(x+c.s*0.55, y+3, c.s*0.62, c.s*0.3, 0, 0, Math.PI*2);
    ctx.ellipse(x-c.s*0.5, y+4, c.s*0.5, c.s*0.26, 0, 0, Math.PI*2);
    ctx.ellipse(x+c.s*0.15, y-c.s*0.16, c.s*0.55, c.s*0.3, 0, 0, Math.PI*2);
    ctx.fill();
  });
  /* atmospheric haze settling on the horizon line */
  if(hy>0){
    const hz = ctx.createLinearGradient(0,Math.max(0,hy-46),0,hy+8);
    hz.addColorStop(0,'rgba(242,239,226,0)');
    hz.addColorStop(1,'rgba(242,239,226,.55)');
    ctx.fillStyle=hz; ctx.fillRect(-20,Math.max(0,hy-46),W+40,54);
  }
  /* horizon relief: Oak Ridge sits in a forested VALLEY ringed by mountains; other
     non-lava courses keep gentle rolling hills. */
  if(THEME()==='oak'){
    drawMountains(hy);
  } else if(THEME()==='maple'){
    drawMountains(hy, true);                 /* glacier variant: brighter ice-blue snowy peaks */
  } else if(THEME()!=='volcano') for(let layer=0; layer<2; layer++){
    ctx.fillStyle = layer? 'rgba(74,128,96,.5)' : 'rgba(96,140,128,.3)';
    ctx.beginPath();
    ctx.moveTo(-20, hy+1);
    for(let x=-20;x<=W+20;x+=24){
      const ph = (x*0.013 + cam.yaw*(layer?2.2:1.4));
      ctx.lineTo(x, hy+1 - (6+layer*5)*(0.5+0.5*Math.sin(ph)) );
    }
    ctx.lineTo(W+20, hy+1);
    ctx.closePath(); ctx.fill();
  }

  /* ground */
  const gnd = ctx.createLinearGradient(0,hy,0,H);
  const volc = THEME()==='volcano';
  if(volc){
    gnd.addColorStop(0,'#5a2410');                     /* hazed molten distance */
    gnd.addColorStop(0.22,'#8a2c0c');
    gnd.addColorStop(0.55,'#c4470f');
    gnd.addColorStop(1,'#e85a14');                     /* bright lava near camera */
  } else if(THEME()==='oak'){
    /* Oak Ridge: thick dark rough across the whole map (matches the high-grass band) */
    gnd.addColorStop(0,'#3a6b3c');                     /* hazed dark distance */
    gnd.addColorStop(0.18,'#27512a');
    gnd.addColorStop(0.55,'#2a5a2c');
    gnd.addColorStop(1,'#2f6330');                     /* deep thick grass near camera */
  } else if(THEME()==='maple'){
    /* Maple Falls: lush mountain-valley turf, deep green hazed into the distance */
    gnd.addColorStop(0,'#5a8a54');                     /* hazed distance     */
    gnd.addColorStop(0.18,'#3a7a40');
    gnd.addColorStop(0.55,'#3d8442');
    gnd.addColorStop(1,'#449049');                     /* lush near grass    */
  } else {
    gnd.addColorStop(0,'#5e8e57');                     /* hazed distance     */
    gnd.addColorStop(0.18,'#3e7e3e');
    gnd.addColorStop(0.55,'#418a40');
    gnd.addColorStop(1,'#499845');
  }
  ctx.fillStyle=gnd; ctx.fillRect(-20,Math.max(hy,0),W+40,H-Math.max(hy,0)+20);
  if(volc){
    /* ===== cooled-crust lava field (cached texture + cheap live glow) =====
       The dark plate texture is screen-fixed, so it's baked once to an offscreen
       canvas and blitted. Only a few large soft glow bands animate on top. */
    const gy0=Math.max(hy,0);
    if(!lavaTexBaked || lavaTexQuality!==SET.quality) bakeLavaTex();
    ctx.save();
    ctx.beginPath(); ctx.rect(-20,gy0,W+40,H-gy0+20); ctx.clip();
    ctx.drawImage(lavaTex, 0, 0);                        /* texture, masked to live ground */
    /* live breathing glow: a handful of big soft radial bands, additive */
    ctx.globalCompositeOperation='lighter';
    const BANDS=4;
    for(let b=0;b<BANDS;b++){
      const pulse=0.5+0.5*Math.sin(curNow/1400 + b*1.7);
      const bx=W*(0.18+0.66*((b*0.37)%1));
      const by=gy0+(H-gy0)*(0.35+0.6*((b*0.53)%1));
      const rad=160+b*40;
      const g=ctx.createRadialGradient(bx,by,10,bx,by,rad);
      g.addColorStop(0,`rgba(255,${120+Math.round(60*pulse)},30,${0.10+0.10*pulse})`);
      g.addColorStop(1,'rgba(255,90,20,0)');
      ctx.fillStyle=g; ctx.fillRect(bx-rad,by-rad,rad*2,rad*2);
    }
    ctx.globalCompositeOperation='source-over';
    ctx.restore();
    /* gentle rising embers (cheap, only on high) */
    if(SET.quality==='high'){
      for(let k=0;k<12;k++){
        const t=((curNow/3200)+k*0.08)%1;
        const ex=((k*89+k*k*7)%(W+40))-20;
        const ey=H - t*(H-gy0)*0.7;
        ctx.fillStyle=`rgba(255,${175-Math.round(70*t)},${60-Math.round(35*t)},${0.5*(1-t)})`;
        ctx.fillRect(ex, ey, 1+Math.round(1.5*(1-t)), 1+Math.round(1.5*(1-t)));
      }
    }
  }

  if(THEME()!=='volcano') BLOTCH.forEach(b=>fillGround(b.pts, b.dark?'rgba(20,60,25,.16)':'rgba(255,255,255,.06)'));
  /* HIGH ROUGH (Oak Ridge): a soft, slightly different shade of green with NO hard edges —
     rendered as overlapping soft blotches (organic, no sharp corners) plus a few sparse
     grass blades. Reads as natural longer grass, not a painted strip. */
  if(THEME()==='oak' && HIGH_ROUGH.length){
    HIGH_ROUGH.forEach((b,bi)=>{
      if(!pathGround(b.poly)) return;
      ctx.save(); ctx.clip();
      let minx=1e9,miny=1e9,maxx=-1e9,maxy=-1e9;
      for(const pt of b.poly){ if(pt.x<minx)minx=pt.x; if(pt.x>maxx)maxx=pt.x; if(pt.y<miny)miny=pt.y; if(pt.y>maxy)maxy=pt.y; }
      /* soft tint: a scatter of big feathered blobs in a slightly cooler/darker green so the
         zone reads different without any straight edge (the blobs feather via radial alpha) */
      const bw=maxx-minx, bh=maxy-miny;
      for(let k=0;k<7;k++){
        const gx=minx+((k*53+bi*29)%100)/100*bw;
        const gy=miny+((k*71+bi*41)%100)/100*bh;
        if(greenSDF(gx,gy) > -14) continue;            /* never tint over/under the green */
        const sp=proj(gx,gy,0); if(!sp) continue;
        const rad=Math.max(20, cam.foc*70/sp.z);
        const g=ctx.createRadialGradient(sp.x,sp.y,0, sp.x,sp.y,rad);
        g.addColorStop(0,'rgba(40,86,52,.5)');         /* cooler green, soft */
        g.addColorStop(1,'rgba(40,86,52,0)');
        ctx.fillStyle=g; ctx.fillRect(sp.x-rad, sp.y-rad, rad*2, rad*2);
      }
      /* a few sparse grass blades (far fewer than before) */
      if(SET.quality==='high'){
        ctx.strokeStyle='rgba(22,60,28,.5)'; ctx.lineWidth=1.3; ctx.lineCap='round';
        ctx.beginPath();
        for(let k=0;k<26;k++){
          const gx=minx+((k*73+bi*37)%1000)/1000*bw;
          const gy=miny+((k*137+bi*53)%1000)/1000*bh;
          if(greenSDF(gx,gy) > -14) continue;          /* no blades on the green */
          const sp=proj(gx,gy,0); if(!sp) continue;
          const h=Math.max(2, cam.foc*7/sp.z);
          const sway=Math.sin(curNow/700+k)*h*0.16;
          ctx.moveTo(sp.x, sp.y); ctx.lineTo(sp.x+sway, sp.y-h);
        }
        ctx.stroke();
        ctx.strokeStyle='rgba(130,185,100,.34)'; ctx.lineWidth=1; ctx.beginPath();
        for(let k=0;k<14;k++){
          const gx=minx+((k*191+bi*37)%1000)/1000*bw;
          const gy=miny+((k*89+bi*53)%1000)/1000*bh;
          if(greenSDF(gx,gy) > -14) continue;          /* no blades on the green */
          const sp=proj(gx,gy,0); if(!sp) continue;
          const h=Math.max(2, cam.foc*6/sp.z);
          ctx.moveTo(sp.x, sp.y); ctx.lineTo(sp.x+Math.sin(curNow/650+k)*h*0.18, sp.y-h);
        }
        ctx.stroke();
      }
      ctx.restore();
    });
  }
  /* creek-source hill cluster removed: pinned world hills fight the camera. The horizon
     mountain range (drawMountains) is the backdrop the creeks read as flowing from. */
  if(THEME()==='volcano'){
    /* VOLCANO FAIRWAY as a floating rock-grass island: a rocky rim drops from the fairway
       edge into the lava (same language as the green shelf), so the fairway and green read
       as one connected volcanic landmass instead of flat slabs colliding. */
    const fp = POLY.fairway;
    if(fp && fp.length>2){
      const fc={x:0,y:0}; fp.forEach(p=>{fc.x+=p.x;fc.y+=p.y;}); fc.x/=fp.length; fc.y/=fp.length;
      const expandF=(out)=> fp.map(p=>{
        const dx=p.x-fc.x, dy=p.y-fc.y, d=Math.hypot(dx,dy)||1;
        return {x:p.x+dx/d*out, y:p.y+dy/d*out};
      });
      /* shadow halo on the lava under the island */
      { const halo=expandF(26); if(pathGround(halo)){ ctx.fillStyle='rgba(10,6,5,.5)'; ctx.fill(); } }
      /* rocky rim rings stepping down into the lava */
      const frings=[{out:6,col:'#3a3320'},{out:14,col:'#2c2419'},{out:22,col:'#241a14'},{out:27,col:'#7a2c10'}];
      for(let r=frings.length-1;r>=0;r--){
        const outer=expandF(frings[r].out), inner=expandF(r?frings[r-1].out:0);
        for(let i=0;i<fp.length;i++){ const j=(i+1)%fp.length;
          fillGround([outer[i],outer[j],inner[j],inner[i]], frings[r].col); }
      }
    }
    /* the grass fairway surface on top of its rock base */
    fillGround(POLY.fairway, '#545a2c');
  } else {
    /* grass fairway, tessellated and lifted by fairwayHeightVis so its slope shows as a real
       tilt. A solid flat base is drawn first so the tessellation never shows seams/slits. */
    fillGround(POLY.fairway, FAIRWAY_COLOR());
    const haveSlope = CUR && (CUR.fwSlope || CUR.slopeZones);
    if(haveSlope && SPINE && SPINE.length>1){
      const STEPS = SET.quality==='high' ? 4 : 3;    /* cross-fairway subdivisions per side */
      for(let si=0; si<SPINE.length-1; si++){
        const a=SPINE[si], b=SPINE[si+1];
        let nx=-(b.y-a.y), ny=(b.x-a.x); const nn=Math.hypot(nx,ny)||1; nx/=nn; ny/=nn;
        const segLen=Math.hypot(b.x-a.x,b.y-a.y);
        const along=Math.max(1, Math.round(segLen/30));
        for(let u=0; u<along; u++){
          for(let v=-STEPS; v<STEPS; v++){
            const t0=u/along, t1=(u+1)/along;
            const w0=v/STEPS*FAIRWAY_W, w1=(v+1)/STEPS*FAIRWAY_W;
            const cx0=a.x+(b.x-a.x)*t0, cy0=a.y+(b.y-a.y)*t0;
            const cx1=a.x+(b.x-a.x)*t1, cy1=a.y+(b.y-a.y)*t1;
            const quad=[
              {x:cx0+nx*w0,y:cy0+ny*w0},{x:cx1+nx*w0,y:cy1+ny*w0},
              {x:cx1+nx*w1,y:cy1+ny*w1},{x:cx0+nx*w1,y:cy0+ny*w1}
            ];
            fillGroundH(quad, FAIRWAY_COLOR(), fairwayHeightVis);
          }
        }
      }
    }
    /* second fairway corridor (double fairway) — a flat fill in the same turf color */
    if(FAIRWAY2_POLY) fillGround(FAIRWAY2_POLY, FAIRWAY_COLOR());
    /* fairway islands: short-grass patches sitting in a hazard. A sandy collar then turf. */
    if(ISLAND_POLYS){
      ISLAND_POLYS.forEach((poly,k)=>{
        const is=ISLANDS[k];
        fillGround(ellipsePoly({...is, rx:is.rx+7, ry:is.ry+7}, 30), '#d8c294');  /* sand rim  */
        fillGround(poly, FAIRWAY_COLOR());                                          /* turf top  */
        fillGround(ellipsePoly({...is, rx:is.rx*0.6, ry:is.ry*0.6}, 24), '#6fbf5e');/* lighter centre */
      });
    }
  }
  /* fairway mowing stripes: alternating light bands across the spine.
     The base bands render at EVERY quality level so the fairway always shows its stripes
     (previously they vanished whenever auto-quality dropped to 'low', making the fairway
     look like one flat green). Only the fine directional grain is gated to high quality. */
  if(MOW_BANDS.length){
    const fwH = (THEME()!=='volcano' && CUR && (CUR.fwSlope||CUR.slopeZones)) ? fairwayHeightVis : (()=>0);
    MOW_BANDS.forEach((band,bi)=>{
      if(bi%2===0) fillGroundH(band, 'rgba(255,255,255,.07)', fwH);
      else fillGroundH(band, 'rgba(20,60,30,.045)', fwH);     /* counter-grain band */
    });
    /* directional grain: hairline streaks running with the cut (high quality only) */
    if(SET.quality==='high'){
      ctx.globalAlpha=0.5;
      MOW_BANDS.forEach((band,bi)=>{
        if(bi%3!==0) return;
        const mid={x:(band[0].x+band[2].x)/2, y:(band[0].y+band[2].y)/2};
        const sp=proj(mid.x,mid.y,0);
        if(!sp || sp.z>520) return;
        strokeWorldLine([band[0],band[1]], 'rgba(235,250,225,.10)', 0.8);
        strokeWorldLine([band[3],band[2]], 'rgba(15,50,25,.10)', 0.8);
      });
      ctx.globalAlpha=1;
    }
  }
  const isLava = THEME()==='volcano';
  /* ---- connected creek ribbons: light-blue channel with sand banks on both sides ---- */
  if(!isLava && CREEKS && CREEKS.length){
    CREEKS.forEach(ck=>{
      /* sand banks (wider, underneath) */
      fillGround(ck.sand, '#cdb487');
      fillGround(ck.sand.map(p=>p), '#d8c294');     /* lighter sand top */
      /* a touch of darker damp sand right at the water's edge */
      /* the light-blue water channel on top */
      fillGround(ck.water, '#8fd4ef');               /* light blue base   */
      /* clip to the channel for shimmer + flow lines */
      if(pathGround(ck.water)){
        ctx.save(); ctx.clip();
        /* a brighter core down the middle */
        ctx.strokeStyle='rgba(190,235,250,.55)'; ctx.lineWidth=6; ctx.lineCap='round'; ctx.lineJoin='round';
        ctx.beginPath(); let st=false;
        for(const p of ck.mid){ const sp=proj(p.x,p.y,0); if(!sp){st=false;continue;} st?ctx.lineTo(sp.x,sp.y):ctx.moveTo(sp.x,sp.y); st=true; }
        ctx.stroke();
        /* drifting flow highlights along the current */
        if(SET.quality==='high'){
          ctx.strokeStyle='rgba(255,255,255,.4)'; ctx.lineWidth=1.6;
          ctx.setLineDash([7,12]); ctx.lineDashOffset=-(now/120)%19;
          ctx.beginPath(); st=false;
          for(const p of ck.mid){ const sp=proj(p.x,p.y,0); if(!sp){st=false;continue;} st?ctx.lineTo(sp.x,sp.y):ctx.moveTo(sp.x,sp.y); st=true; }
          ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset=0;
        }
        ctx.restore();
      }
    });
  }
  POLY.waters.forEach((w,wi)=>{
    if(WATERS[wi].creek) return;                     /* creeks drawn as ribbons above */
    const oakW = THEME()==='oak';
    if(isLava){
      /* lava pond: same calm detailed plate style as the field, clipped to shape.
         Small dark basalt plates + slow breathing crack glow + speckle, over a
         bright molten base with a gentle pulsing core. */
      fillGround(w.lip,  '#2a1410');                      /* cooled black crust  */
      fillGround(w.body, '#7a1e07');                      /* dark molten         */
      fillGround(w.inner,'#d44e16');                      /* bright flow base    */
      const wd=WATERS[wi];
      /* a few drifting crust blobs (cheap: ~5 ellipses) + a pulsing molten core.
         No per-cell grid — keeps the pond detailed but light. */
      if(SET.quality==='high' && pathGround(w.inner)){
        ctx.save(); ctx.clip();
        for(let k=0;k<5;k++){
          const a=k*1.7+wi, rr=0.32+0.5*((k*0.27)%1);
          const bx=wd.x+Math.cos(a)*wd.rx*rr, by=wd.y+Math.sin(a)*wd.ry*rr;
          const sp=proj(bx,by,0);
          if(sp){ const pr=Math.max(2,(cam.foc/sp.z)*(6+k*1.5));
            ctx.fillStyle='rgba(26,15,12,.7)';
            ctx.beginPath(); ctx.ellipse(sp.x,sp.y,pr,pr*0.62,k,0,Math.PI*2); ctx.fill();
            const pulse=0.45+0.55*Math.sin(curNow/1400 + k*0.8 + wi*1.3);
            ctx.strokeStyle=`rgba(255,${120+Math.round(70*pulse)},35,${0.3+0.25*pulse})`;
            ctx.lineWidth=1; ctx.stroke();
          }
        }
        ctx.restore();
        /* gentle pulsing core + soft white-hot center */
        const pulse=0.5+0.5*Math.sin(now/1300 + wi*1.7);
        const core=circlePolyXY(wd.x,wd.y,wd.rx*0.42,wd.ry*0.42,14);
        if(pathGround(core)){ ctx.fillStyle=`rgba(255,${160+Math.round(60*pulse)},55,${0.3+0.2*pulse})`; ctx.fill(); }
        const hot=circlePolyXY(wd.x,wd.y,wd.rx*0.2,wd.ry*0.2,10);
        if(pathGround(hot)){ ctx.fillStyle=`rgba(255,240,190,${0.32+0.28*pulse})`; ctx.fill(); }
      }
      return;   /* skip the water shimmer/caustics/ripples below */
    }
    const isPond = WATERS[wi].pond;
    if(isPond){
      /* lighter-blue pond water with sandy banks */
      fillGround(w.lip,  '#d8c294');                    /* sand bank */
      fillGround(w.body, '#aee3f5');                    /* lighter blue */
      fillGround(w.inner,'#c6eefb');                    /* lighter still in the middle */
    } else {
      fillGround(w.lip,  oakW ? '#7d6f4a' : '#b89a6a'); /* muddy vs sandy bank */
      fillGround(w.body, oakW ? '#23423c' : '#2e7fb8'); /* dark natural water  */
      fillGround(w.inner,oakW ? '#33584c' : '#4ba3d6');
    }
    /* sky reflection sheet on the upper half + shore caustics */
    if(SET.quality==='high'){
      const wd=WATERS[wi];
      const refl = circlePolyXY(wd.x, wd.y-wd.ry*0.32, wd.rx*0.72, wd.ry*0.4, 18);
      if(pathGround(refl)){ ctx.fillStyle='rgba(190,228,248,.22)'; ctx.fill(); }
      const ca = circlePolyXY(wd.x, wd.y, wd.rx*0.93, wd.ry*0.93, 22);
      if(pathGround(ca)){
        ctx.setLineDash([5,9]);
        ctx.strokeStyle='rgba(220,245,255,.4)';
        ctx.lineWidth=1.1;
        ctx.lineDashOffset = -(now/140)%14;             /* caustics shimmer along the edge */
        ctx.stroke();
        ctx.setLineDash([]); ctx.lineDashOffset=0;
      }
    }
    /* moving light shimmer: drifting highlight streaks on the surface */
    if(SET.quality==='high'){
      for(let k=0;k<4;k++){
        const ph=((now/3400)+(k*0.25)+wi*0.13)%1;
        const wx=WATERS[wi].x + Math.cos(k*1.9)*WATERS[wi].rx*0.55*(ph*2-1);
        const wy=WATERS[wi].y + Math.sin(k*2.6)*WATERS[wi].ry*0.5*(1-ph);
        const sp=proj(wx,wy,0);
        if(sp && sp.z<800){
          const r=Math.max(1,cam.foc*5/sp.z);
          ctx.fillStyle=`rgba(255,255,255,${0.22*Math.sin(Math.PI*ph)})`;
          ctx.beginPath(); ctx.ellipse(sp.x,sp.y,r*2.6,r*0.5,0,0,Math.PI*2); ctx.fill();
        }
      }
    }
    /* animated expanding ripples */
    w.ripples.forEach((r,ri)=>{
      const ph = ((now/2600 + ri*0.33 + wi*0.2) % 1);
      const a = 0.35*(1-ph);
      if(a>0.03){
        const scaled = r.map(p=>({x:WATERS[wi].x+(p.x-WATERS[wi].x)*(0.4+ph*0.75),
                                  y:WATERS[wi].y+(p.y-WATERS[wi].y)*(0.4+ph*0.75)}));
        strokeWorldLine(scaled.concat([scaled[0]]), `rgba(255,255,255,${a})`, 1.6);
      }
    });
  });
  /* WATERFALL (Maple Falls): a tall cascade rising up behind the green, spilling into the
     pond hazard. Drawn as a vertical sheet of falling water with animated streaks + mist. */
  if(CUR.waterfall){
    const wf = CUR.waterfall;
    const baseP = proj(wf.x, wf.y, 0);
    if(baseP && baseP.z>NEAR){
      const sc = cam.foc/baseP.z;
      const fallW = wf.w*sc;
      const fallH = wf.w*1.5*sc;                          /* tall sheet */
      const cx = baseP.x, by = baseP.y;
      const ty = by - fallH;
      /* rock face behind the falls */
      ctx.fillStyle='#4a5560';
      ctx.fillRect(cx-fallW*0.62, ty-6*sc, fallW*1.24, fallH+6*sc);
      ctx.fillStyle='#3a444e';
      ctx.fillRect(cx-fallW*0.62, ty-6*sc, fallW*0.3, fallH+6*sc);
      ctx.fillStyle='rgba(255,255,255,.05)';
      ctx.fillRect(cx+fallW*0.34, ty-6*sc, fallW*0.28, fallH+6*sc);
      /* the water sheet */
      const wg = ctx.createLinearGradient(0, ty, 0, by);
      wg.addColorStop(0,'#cfeef9'); wg.addColorStop(0.5,'#a9def2'); wg.addColorStop(1,'#7fc8e8');
      ctx.fillStyle=wg;
      ctx.fillRect(cx-fallW*0.5, ty, fallW, fallH);
      /* animated falling streaks */
      if(SET.quality!=='low'){
        for(let k=0;k<7;k++){
          const fx = cx - fallW*0.42 + (k/6)*fallW*0.84;
          const ph = ((curNow/420) + k*0.37) % 1;
          const sy = ty + ph*fallH;
          ctx.strokeStyle='rgba(255,255,255,.55)'; ctx.lineWidth=Math.max(1,2*sc);
          ctx.beginPath(); ctx.moveTo(fx, sy); ctx.lineTo(fx, Math.min(by, sy+fallH*0.28)); ctx.stroke();
        }
      }
      /* crest highlight at the top lip */
      ctx.fillStyle='rgba(255,255,255,.7)';
      ctx.fillRect(cx-fallW*0.5, ty-2*sc, fallW, 3*sc);
      /* mist/spray pooling at the base */
      if(SET.quality!=='low'){
        for(let k=0;k<10;k++){
          const ph=((curNow/900)+k*0.21)%1;
          const mx=cx + (Math.sin(k*2.3)*fallW*0.5)*(0.4+ph*0.6);
          const myy=by - ph*22*sc;
          ctx.fillStyle=`rgba(244,252,255,${0.32*(1-ph)})`;
          ctx.beginPath(); ctx.ellipse(mx, myy, (5+ph*10)*sc, (2.5+ph*5)*sc, 0,0,Math.PI*2); ctx.fill();
        }
      }
    }
  }
  /* erupting volcano crater */
  if(VOLCANO){
    const c = proj(VOLCANO.x, VOLCANO.y, 0);
    if(c && c.z>NEAR){
      const sc = cam.foc/c.z;
      const R = VOLCANO.r*sc;
      const ep = eruptPhase();
      const H3D = R*2.0;                                 /* taller, more imposing cone */
      const my = c.y - H3D;                              /* crater mouth y */
      const baseHalf = R*1.7, topHalf = R*0.62;
      /* ground contact shadow */
      ctx.fillStyle='rgba(20,6,4,.4)';
      ctx.beginPath(); ctx.ellipse(c.x+R*0.3, c.y+R*0.1, baseHalf*1.1, R*0.42, 0,0,Math.PI*2); ctx.fill();
      /* opaque rocky base mound so the cone always reads as solid rock (never see-through
         against the bright lava behind it) */
      ctx.fillStyle='#150d0b';
      ctx.beginPath(); ctx.ellipse(c.x, c.y, baseHalf*1.08, R*0.5, 0,0,Math.PI*2); ctx.fill();
      /* solid opaque silhouette of the whole cone first, so nothing shows through it */
      ctx.fillStyle='#120b09';
      ctx.beginPath();
      ctx.moveTo(c.x-baseHalf, c.y);
      ctx.lineTo(c.x-topHalf, my);
      ctx.lineTo(c.x+topHalf, my);
      ctx.lineTo(c.x+baseHalf, c.y);
      ctx.closePath(); ctx.fill();
      /* solid cone body: left-lit volume via horizontal gradient */
      const body=ctx.createLinearGradient(c.x-baseHalf,0,c.x+baseHalf,0);
      body.addColorStop(0,'#4a3a34'); body.addColorStop(0.4,'#2a1c18');
      body.addColorStop(0.7,'#1a1110'); body.addColorStop(1,'#0c0808');
      ctx.fillStyle=body;
      ctx.beginPath();
      ctx.moveTo(c.x-baseHalf, c.y);
      ctx.lineTo(c.x-topHalf, my);
      ctx.lineTo(c.x+topHalf, my);
      ctx.lineTo(c.x+baseHalf, c.y);
      ctx.closePath(); ctx.fill();
      /* rock facets for 3D texture: jagged vertical ridges down the face */
      ctx.lineWidth=Math.max(0.6,R*0.05);
      for(let f=-2;f<=2;f++){
        const tx=c.x+f*topHalf*0.4, bx=c.x+f*baseHalf*0.42;
        ctx.strokeStyle = f<0 ? 'rgba(150,120,108,.22)' : 'rgba(0,0,0,.3)';   /* lit left, shadow right */
        ctx.beginPath(); ctx.moveTo(tx, my+R*0.1);
        ctx.lineTo(bx+(f*7%5), c.y); ctx.stroke();
      }
      /* glowing lava veins trickling down the cone */
      const heat = ep.active ? 1 : 0.5+0.3*Math.sin(now/300);
      for(let v=-1;v<=1;v++){
        ctx.strokeStyle=`rgba(255,${90+Math.round(60*heat)},25,${0.5+0.3*heat})`;
        ctx.lineWidth=Math.max(0.7,R*0.07);
        ctx.beginPath(); ctx.moveTo(c.x+v*topHalf*0.5, my+R*0.15);
        ctx.quadraticCurveTo(c.x+v*baseHalf*0.4+8, c.y-H3D*0.4, c.x+v*baseHalf*0.55, c.y-R*0.2);
        ctx.stroke();
      }
      /* crater rim: raised lip ellipse with a dark inner throat */
      ctx.fillStyle='#1a1210';
      ctx.beginPath(); ctx.ellipse(c.x, my, topHalf*1.05, R*0.34, 0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#0a0605';
      ctx.beginPath(); ctx.ellipse(c.x, my+R*0.04, topHalf*0.78, R*0.24, 0,0,Math.PI*2); ctx.fill();
      /* molten glow pooling in the throat */
      const glow = ctx.createRadialGradient(c.x, my, 1, c.x, my, topHalf*1.3);
      glow.addColorStop(0,`rgba(255,${210+Math.round(40*heat)},140,${0.9})`);
      glow.addColorStop(0.45,`rgba(255,120,35,${0.65*heat+0.25})`);
      glow.addColorStop(1,'rgba(140,30,10,0)');
      ctx.fillStyle=glow;
      ctx.beginPath(); ctx.ellipse(c.x, my, topHalf*0.78, R*0.24, 0, 0, Math.PI*2); ctx.fill();
      /* rim highlight catching the glow */
      ctx.strokeStyle=`rgba(255,160,70,${0.4+0.3*heat})`; ctx.lineWidth=Math.max(0.6,R*0.05);
      ctx.beginPath(); ctx.ellipse(c.x, my, topHalf*1.0, R*0.32, 0, Math.PI*0.1, Math.PI*0.9); ctx.stroke();
      /* idle smoke column */
      if(SET.quality==='high' && !ep.active){
        for(let k=0;k<4;k++){
          const t=((now/2600)+k*0.25)%1;
          const sy=my - t*R*2.6, sx=c.x+Math.sin(t*4+k)*R*0.4;
          ctx.fillStyle=`rgba(80,70,68,${0.22*(1-t)})`;
          ctx.beginPath(); ctx.ellipse(sx, sy, R*(0.2+t*0.4), R*(0.16+t*0.3), 0, 0, Math.PI*2); ctx.fill();
        }
      }
      /* WARNING tell: crater brightens + embers in the ~1.5s before it blows */
      if(!ep.active && ep.warn!==undefined && ep.warn<1.5){
        const w=1-ep.warn/1.5;
        ctx.fillStyle=`rgba(255,${120+Math.round(80*w)},40,${0.4*w})`;
        ctx.beginPath(); ctx.ellipse(c.x, my, R*(0.6+w*0.3), R*(0.3+w*0.15), 0,0,Math.PI*2); ctx.fill();
      }
      /* THE ERUPTION: lava plume bursting up + arcing debris */
      if(ep.active){
        const rise = Math.sin(ep.k*Math.PI);            /* up then down */
        const top = my - R*3.4*rise;
        const col = ctx.createLinearGradient(c.x, my, c.x, top);
        col.addColorStop(0,'rgba(255,230,150,.95)');
        col.addColorStop(0.5,'rgba(255,120,30,.85)');
        col.addColorStop(1,'rgba(200,50,10,0)');
        ctx.fillStyle=col;
        ctx.beginPath();
        ctx.moveTo(c.x-R*0.4, my);
        ctx.quadraticCurveTo(c.x-R*0.7, (my+top)/2, c.x-R*0.12, top);
        ctx.lineTo(c.x+R*0.12, top);
        ctx.quadraticCurveTo(c.x+R*0.7, (my+top)/2, c.x+R*0.4, my);
        ctx.closePath(); ctx.fill();
        /* arcing lava bombs */
        for(let k=0;k<9;k++){
          const a=(k/9)*Math.PI - Math.PI/2 + Math.sin(k)*0.2;
          const reach=R*2.4*rise*(0.6+0.4*((k*37)%10)/10);
          const bx=c.x+Math.cos(a)*reach, by=my-Math.abs(Math.sin(a))*reach*0.9 - rise*R*0.5;
          ctx.fillStyle=`rgba(255,${140+(k*23)%90},40,${0.9*rise})`;
          ctx.beginPath(); ctx.arc(bx,by,Math.max(1,R*0.09),0,Math.PI*2); ctx.fill();
        }
        if(!VOLCANO._sfx && ep.k<0.2){ VOLCANO._sfx=true; SFX.splash(); }
        if(ep.k>0.8) VOLCANO._sfx=false;
      }
    }
  }
  /* VOLCANO SHELF: the green sits on a scorched rock shelf that steps out from the green
     edge and drops into the lava — green → ash rock → glowing molten rim → lava. Gives the
     floating green a believable base and transition instead of a hard cut-off. */
  if(THEME()==='volcano' && POLY.green && POLY.green.length>2){
    const gc={x:0,y:0}; POLY.green.forEach(p=>{gc.x+=p.x;gc.y+=p.y;});
    gc.x/=POLY.green.length; gc.y/=POLY.green.length;
    const expand=(out)=> POLY.green.map(p=>{
      const dx=p.x-gc.x, dy=p.y-gc.y, d=Math.hypot(dx,dy)||1;
      return {x:p.x+dx/d*out, y:p.y+dy/d*out};
    });
    /* ground shadow / lava-darkened halo under the whole shelf */
    { const halo=expand(70); if(pathGroundH(halo, ()=>-30)){ ctx.fillStyle='rgba(10,6,5,.55)'; ctx.fill(); } }
    /* rings: green edge → ash shelf → basalt cliff → molten rim. Colour + height step out. */
    const rings=[
      {out:8,  col:'#4a4a26'},          /* burnt collar just off the green */
      {out:18, col:'#3a3320'},          /* ash */
      {out:30, col:'#2c2419'},          /* dark scorched rock (shelf lip) */
      {out:48, col:'#241a14'},          /* basalt cliff face */
      {out:60, col:'#3a201a'},          /* warming toward lava */
      {out:66, col:'#7a2c10'},          /* molten-edged rock */
      {out:72, col:'#c4470f'}           /* glowing lava rim */
    ];
    /* per-vertex "front-ness": 1 on the approach side (blend to grass/fairway), 0 elsewhere */
    const frontness=(p)=>{
      if(GREEN._apX===undefined) return 0;
      const vx=p.x-gc.x, vy=p.y-gc.y, vl=Math.hypot(vx,vy)||1;
      return Math.max(0, -(vx/vl*GREEN._apX + vy/vl*GREEN._apY));
    };
    const GRASS='#545a2c';              /* volcano fairway grass */
    for(let r=rings.length-1; r>=0; r--){
      const outer=expand(rings[r].out);
      const inner=expand(r? rings[r-1].out : 0);
      for(let i=0;i<POLY.green.length;i++){
        const j=(i+1)%POLY.green.length;
        const quad=[outer[i],outer[j],inner[j],inner[i]];
        const fr=(frontness(POLY.green[i])+frontness(POLY.green[j]))/2;
        /* on the front, the inner rock rings become grass (a turf apron to the fairway);
           the outer molten rings stay rock even on the front but only barely show there */
        const col = (fr>0.45 && rings[r].out<=48) ? GRASS : rings[r].col;
        fillGroundH(quad, col, surfaceHeightVis);
      }
    }
    /* faceted rock highlights on the cliff for a craggy 3D feel */
    if(SET.quality==='high'){
      const lip=expand(30), toe=expand(58);
      for(let i=0;i<POLY.green.length;i+=2){
        const a=proj(lip[i].x,lip[i].y,surfaceHeightVis(lip[i].x,lip[i].y));
        const b=proj(toe[i].x,toe[i].y,surfaceHeightVis(toe[i].x,toe[i].y));
        if(a&&b){ ctx.strokeStyle='rgba(0,0,0,.3)'; ctx.lineWidth=0.9;
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
      }
      /* glowing molten seams flickering at the lava rim */
      const rim=expand(67);
      const pp=rim.map(p=>proj(p.x,p.y,surfaceHeightVis(p.x,p.y))).filter(Boolean);
      if(pp.length>2){
        const glow=0.4+0.3*Math.sin(now/280);
        ctx.strokeStyle=`rgba(255,140,40,${glow})`; ctx.lineWidth=1.6;
        ctx.beginPath(); pp.forEach((s,k)=>k?ctx.lineTo(s.x,s.y):ctx.moveTo(s.x,s.y));
        ctx.closePath(); ctx.stroke();
      }
    }
  }
  /* GREEN SURROUND (Sakura/Oak): a tessellated grass skirt that rises from the flat fairway
     up to the green's edge, so a high green side becomes a natural hill instead of a sharp
     drop-off. Built as concentric rings expanded out from the green outline, each lifted by
     surfaceHeightVis (which fades the green's edge height out over the skirt).
     Skipped for island greens (sitting in a pond) — there the water IS the surround. */
  const greenInWater = WATERS && WATERS.some(w=> w.pond &&
      ((PIN.x-w.x)*(PIN.x-w.x))/((w.rx-8)*(w.rx-8)) + ((PIN.y-w.y)*(PIN.y-w.y))/((w.ry-8)*(w.ry-8)) <= 1);
  if(THEME()!=='volcano' && !greenInWater && POLY.green && POLY.green.length>2){
    const gc={x:0,y:0}; POLY.green.forEach(p=>{gc.x+=p.x;gc.y+=p.y;});
    gc.x/=POLY.green.length; gc.y/=POLY.green.length;
    const expand=(loop,out)=> loop.map(p=>{
      const dx=p.x-gc.x, dy=p.y-gc.y, d=Math.hypot(dx,dy)||1;
      return {x:p.x+dx/d*out, y:p.y+dy/d*out};
    });
    const baseCol = THEME()==='oak' ? '#5aa54e' : '#5fa953';   /* matches fairway grass */
    const bands=[0,12,24,38,54,72,94,118];
    for(let bi=bands.length-1; bi>0; bi--){
      const outer=expand(POLY.green, bands[bi]);
      const inner=expand(POLY.green, bands[bi-1]);
      const stripe = (bi%2===0) ? 'rgba(255,255,255,.07)' : 'rgba(20,60,30,.06)';
      for(let i=0;i<POLY.green.length;i++){
        const j=(i+1)%POLY.green.length;
        const quad=[outer[i],outer[j],inner[j],inner[i]];
        /* project ONCE, fill twice (base turf + mown stripe) — saves half the projection work */
        if(pathGroundH(quad, surfaceHeightVis)){
          ctx.fillStyle=baseCol; ctx.fill();
          ctx.fillStyle=stripe;  ctx.fill();
        }
      }
      /* hairline grain between rings, with the cut */
      if(SET.quality==='high' && bi%2===0){
        const ring=expand(POLY.green, bands[bi]);
        const pp=ring.map(p=>proj(p.x,p.y,surfaceHeightVis(p.x,p.y))).filter(Boolean);
        if(pp.length>2){
          ctx.strokeStyle='rgba(235,250,225,.08)'; ctx.lineWidth=0.8;
          ctx.beginPath(); pp.forEach((s,k)=>k?ctx.lineTo(s.x,s.y):ctx.moveTo(s.x,s.y));
          ctx.closePath(); ctx.stroke();
        }
      }
    }
    /* a soft shadow where the hill meets the flat fairway, grounding the rise */
    const foot=expand(POLY.green, 118);
    const fp=foot.map(p=>proj(p.x,p.y,0)).filter(Boolean);
    if(fp.length>2){
      ctx.save(); ctx.strokeStyle='rgba(20,50,28,.12)'; ctx.lineWidth=6;
      ctx.beginPath(); fp.forEach((s,k)=>k?ctx.lineTo(s.x,s.y):ctx.moveTo(s.x,s.y));
      ctx.closePath(); ctx.stroke(); ctx.restore();
    }
  }
  /* green: a clean grassy surface that tilts to show its slope, sitting flush with the
     ground (no rock wall / no black base / no stacked layers). The tilt reads through the
     surface elevation + a smooth light-to-shadow gradient along the fall line. */
  if(THEME()==='volcano'){
    fillGroundH(POLY.fringe, '#63702f', surfaceHeightVis);
    fillGroundH(POLY.green, '#6c7635', surfaceHeightVis);
    /* SMOOTH slope shading: one continuous gradient over the whole tilted green — bright on
       the high/sunlit side, dark toward the low side — for a sculpted, real-game look. */
    if(pathGroundH(POLY.green, surfaceHeightVis)){
      ctx.save(); ctx.clip();
      const gb=greenBBox(0), gcx=(gb.x0+gb.x1)/2, gcy=(gb.y0+gb.y1)/2;
      const sl=GREEN.slope, m=Math.hypot(sl.dx,sl.dy)||1;
      const ux=sl.dx/m, uy=sl.dy/m, R=(gb.x1-gb.x0+gb.y1-gb.y0)/2;
      /* extend the gradient line a bit past the green so the lit/shaded ends fade gently
         instead of hitting a hard band right at the edge */
      const hi=proj(gcx-ux*R*1.25, gcy-uy*R*1.25, surfaceHeightVis(gcx-ux*R,gcy-uy*R));
      const lo=proj(gcx+ux*R*1.25, gcy+uy*R*1.25, surfaceHeightVis(gcx+ux*R,gcy+uy*R));
      if(hi&&lo){
        const grad=ctx.createLinearGradient(hi.x,hi.y,lo.x,lo.y);
        /* gentle, evenly-stepped stops → no visible banding */
        grad.addColorStop(0.00,'rgba(188,206,128,.34)');
        grad.addColorStop(0.20,'rgba(168,186,110,.20)');
        grad.addColorStop(0.40,'rgba(130,146,84,.08)');
        grad.addColorStop(0.55,'rgba(70,80,46,.06)');
        grad.addColorStop(0.72,'rgba(48,56,30,.16)');
        grad.addColorStop(0.88,'rgba(34,42,22,.28)');
        grad.addColorStop(1.00,'rgba(26,32,16,.38)');
        ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);
      }
      const cr=proj(gcx-ux*R*0.35, gcy-uy*R*0.35, surfaceHeightVis(gcx-ux*R*0.35,gcy-uy*R*0.35));
      if(cr){
        const rg=ctx.createRadialGradient(cr.x,cr.y,2,cr.x,cr.y,R*1.7);
        rg.addColorStop(0,'rgba(214,232,164,.18)'); rg.addColorStop(0.5,'rgba(214,232,164,.05)'); rg.addColorStop(1,'rgba(214,232,164,0)');
        ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
      }
      /* soft inner-edge shade: darkens the rim so the green nestles into the land naturally */
      const ec=proj(gcx,gcy,surfaceHeightVis(gcx,gcy));
      if(ec){
        const er=ctx.createRadialGradient(ec.x,ec.y,R*0.5,ec.x,ec.y,R*1.15);
        er.addColorStop(0,'rgba(0,0,0,0)'); er.addColorStop(0.7,'rgba(18,26,12,.08)'); er.addColorStop(1,'rgba(18,26,12,.24)');
        ctx.fillStyle=er; ctx.fillRect(0,0,W,H);
      }
      ctx.restore();
    }
  } else {
    /* fringe: a thin grass collar just outside the green */
    fillGroundH(POLY.fringe, '#5fb85a', surfaceHeightVis);
    /* Re-lay the STATIC base of any pond near the green ON TOP of the skirt/fringe grass, so
       the grass-to-pond edge is always clean (the grass may overlap the pond, then the pond
       paints back over it). Drawn BELOW the green body so island/peninsula greens still sit on
       top. Because the skirt now eases to water level at the shore, this matches seamlessly. */
    if(WATERS && WATERS.length && POLY.waters && WATERS.some(w=>w.pond)){
      const gc={x:0,y:0}; POLY.green.forEach(p=>{gc.x+=p.x;gc.y+=p.y;});
      gc.x/=POLY.green.length; gc.y/=POLY.green.length;
      const reach = 140;
      POLY.waters.forEach((w,wi)=>{
        const wd=WATERS[wi]; if(!wd || wd.creek || !wd.pond) return;
        if(Math.hypot(wd.x-gc.x, wd.y-gc.y) > Math.max(wd.rx,wd.ry)+reach) return;  /* only near-green ponds */
        fillGround(w.lip,  '#d8c294');                  /* sand bank   */
        fillGround(w.body, '#aee3f5');                  /* pond water  */
        fillGround(w.inner,'#c6eefb');                  /* lighter centre */
        /* restore the sky-reflection sheet + shore caustics so it matches other ponds */
        if(SET.quality==='high'){
          const refl = circlePolyXY(wd.x, wd.y-wd.ry*0.32, wd.rx*0.72, wd.ry*0.4, 18);
          if(pathGround(refl)){ ctx.fillStyle='rgba(190,228,248,.22)'; ctx.fill(); }
          const ca = circlePolyXY(wd.x, wd.y, wd.rx*0.93, wd.ry*0.93, 22);
          if(pathGround(ca)){
            ctx.setLineDash([5,9]); ctx.strokeStyle='rgba(220,245,255,.4)'; ctx.lineWidth=1.1;
            ctx.lineDashOffset = -(now/140)%14; ctx.stroke();
            ctx.setLineDash([]); ctx.lineDashOffset=0;
          }
        }
      });
    }
    fillGroundH(POLY.green, '#86db78', surfaceHeightVis);
    SHADE_CELLS.forEach(c=>fillGroundH(c.pts, shadeColor(c.t, c.lam), surfaceHeightVis));
  }
  /* scorched burn patches on the green: brown/black where lava once hit (precomputed) */
  if(THEME()==='volcano'){
    for(const sp of SCORCH){
      const patch = circlePolyXY(sp.x, sp.y, sp.r, sp.r*0.78, 12);
      if(pathGroundH(patch, surfaceHeightVis)){
        ctx.fillStyle = sp.dark ? 'rgba(60,38,22,.5)' : 'rgba(28,18,14,.55)';
        ctx.fill();
        ctx.fillStyle = 'rgba(120,60,28,.28)';
        ctx.fill();
      }
    }
  }
  /* contour lines, batched into a single stroke */
  ctx.save();
  ctx.strokeStyle = greenBook ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.45)';
  ctx.lineWidth = greenBook ? 1.9 : 1.2;
  ctx.lineCap='round';
  ctx.beginPath();
  for(const s of CONTOUR_SEGS){
    const a=proj(s[0].x,s[0].y,surfaceHeightVis(s[0].x,s[0].y)), b=proj(s[1].x,s[1].y,surfaceHeightVis(s[1].x,s[1].y));
    if(a&&b){ ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); }
  }
  ctx.stroke();
  ctx.restore();
  /* directional grass pattern: faint lines along contours already give grain;
     add animated slope arrows when toggled */
  if(showArrows){
    ARROWS.forEach(a=>{
      const drift = ((now/1400 + a.ph) % 1) * 6;
      const x0=a.x + a.dx*(drift-3), y0=a.y + a.dy*(drift-3);
      const len = 3 + 3*a.m;
      const x1=x0+a.dx*len, y1=y0+a.dy*len;
      const al = 0.26*Math.sin(Math.PI*((now/1400 + a.ph) % 1));
      strokeWorldLine([{x:x0,y:y0},{x:x1,y:y1}], `rgba(24,52,30,${al})`, 0.9);
      strokeWorldLine([{x:x1-a.dx*2.4 - a.dy*1.8, y:y1-a.dy*2.4 + a.dx*1.8},{x:x1,y:y1},
                       {x:x1-a.dx*2.4 + a.dy*1.8, y:y1-a.dy*2.4 - a.dx*1.8}], `rgba(24,52,30,${al})`, 0.9);
    });
  }
  POLY.bunkers.forEach((b,bi)=>{
    const blackSand = THEME()==='volcano';
    const graySand = THEME()==='maple';                /* light-gray alpine sand */
    const bk=BUNKERS[bi];
    /* bunkers ride the surface: a greenside bunker sits on the tilted green, not flat under it */
    const bh = bk ? (x,y)=>surfaceHeightVis(x,y) : (x,y)=>0;
    fillGroundH(b.lip, blackSand ? 'rgba(10,8,8,.5)' : 'rgba(25,70,30,.32)', bh);
    fillGroundH(b.body, blackSand ? '#26211f' : graySand ? '#c8ccce' : '#e8d5a4', bh);  /* gray alpine sand */
    if(bk){
      const hz=surfaceHeightVis(bk.x,bk.y);
      /* lit center pocket + shaded windward edge (lifted with the bunker) */
      const lit = circlePolyXY(bk.x-bk.rx*0.15, bk.y-bk.ry*0.18, bk.rx*0.62, bk.ry*0.6, 16);
      if(pathGroundH(lit, ()=>hz)){ ctx.fillStyle= blackSand ? 'rgba(90,80,76,.45)' : graySand ? 'rgba(240,243,245,.55)' : 'rgba(255,243,212,.5)'; ctx.fill(); }
      const sh = circlePolyXY(bk.x+bk.rx*0.2, bk.y+bk.ry*0.24, bk.rx*0.7, bk.ry*0.55, 16);
      if(pathGroundH(sh, ()=>hz)){ ctx.fillStyle= blackSand ? 'rgba(0,0,0,.4)' : graySand ? 'rgba(150,158,162,.34)' : 'rgba(168,138,92,.32)'; ctx.fill(); }
    }
    /* rake lines: concentric arcs combed through the sand, lifted onto the surface */
    if(SET.quality==='high' && bk){
      const hz=surfaceHeightVis(bk.x,bk.y);
      ctx.save();
      for(let rr=0.32; rr<0.92; rr+=0.2){
        const arc=[];
        for(let a=0.4; a<Math.PI*2-0.2; a+=0.34)
          arc.push({x:bk.x+Math.cos(a)*bk.rx*rr, y:bk.y+Math.sin(a)*bk.ry*rr});
        const proj2=arc.map(pt=>proj(pt.x,pt.y,hz)).filter(Boolean);
        if(proj2.length>1){
          ctx.strokeStyle= blackSand ? 'rgba(70,62,58,.4)' : graySand ? 'rgba(140,148,152,.4)' : 'rgba(190,150,85,.35)';
          ctx.lineWidth=0.8; ctx.beginPath();
          proj2.forEach((s,k)=> k?ctx.lineTo(s.x,s.y):ctx.moveTo(s.x,s.y));
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  });
  SAND_DOTS.forEach(d=>{
    const s=proj(d.x,d.y,0);
    if(s && s.z<600){ ctx.fillStyle='rgba(180,140,70,.5)';
      const r=Math.max(0.6,cam.foc*1.4/s.z); ctx.fillRect(s.x,s.y,r,r); }
  });
  fillGround(POLY.tee, THEME()==='volcano' ? '#56582c' : '#6fb763');
  fillGround(POLY.tee.map(p=>({x:TEE.x+(p.x-TEE.x)*0.86, y:TEE.y+(p.y-TEE.y)*0.8})), 'rgba(255,255,255,.06)');
  /* black tee markers on both sides: a gate square to the playing line */
  const sp1 = (CUR.spine && CUR.spine.length>1) ? CUR.spine[1] : PIN;
  let tdx = sp1.x-TEE.x, tdy = sp1.y-TEE.y;
  const tdn = Math.hypot(tdx,tdy)||1; tdx/=tdn; tdy/=tdn;
  const tpx = -tdy, tpy = tdx;                    /* perpendicular to aim */
  [-22,22].forEach(off=>{
    const mp=proj(TEE.x+tpx*off, TEE.y+tpy*off, 0);
    if(mp && mp.z<500){
      const r=Math.max(1.4, cam.foc*2.6/mp.z);
      ctx.fillStyle='rgba(20,28,24,.4)';
      ctx.beginPath(); ctx.ellipse(mp.x+r*0.3, mp.y+r*0.4, r*1.1, r*0.4, 0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#1c2420';
      ctx.beginPath(); ctx.ellipse(mp.x, mp.y-r*0.7, r*0.75, r*1.05, 0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.25)';
      ctx.beginPath(); ctx.ellipse(mp.x-r*0.22, mp.y-r*1.0, r*0.22, r*0.3, 0,0,Math.PI*2); ctx.fill();
    }
  });
  /* ===== 3D cup v2: built from the ACTUAL projected rim polygon =====
     The world-space rim circle is sampled and projected point-by-point,
     so the opening is always the true perspective shape at any camera
     angle — never a misaligned oval. All interior layers reuse scaled
     projections of the same circle, keeping everything concentric.
     Factored into a function so the range can draw the same real cup on every green. */
  function drawCup3D(HX, HY, allowSink){
    /* project a scaled rim circle at a given depth; returns screen pts + center, or null */
    const CUP_DEPTH = 5;                             /* world-Z depth of the hole (below ground) */
    /* nudge the floor toward the FAR side of the cup (away from camera) so a putting view
       looks down into the hole — you see the floor set back against the far wall, not a disc
       bulging out the front. Offset is in world space along the camera's view direction. */
    const _vfx=Math.cos(cam.yaw), _vfy=Math.sin(cam.yaw), _foff=HOLE_R*0.42;
    const rimPathZ = (k, depth)=>{
      const pts=[]; let cx=0, cy=0;
      const ox = depth? _vfx*_foff : 0, oy = depth? _vfy*_foff : 0;
      for(let i=0;i<18;i++){
        const a=i/18*Math.PI*2;
        const cpx=HX+ox+Math.cos(a)*HOLE_R*k, cpy=HY+oy+Math.sin(a)*HOLE_R*k;
        const sp=proj(cpx, cpy, surfaceHeightVis(cpx,cpy) - (depth||0));
        if(!sp) return null;
        pts.push(sp); cx+=sp.x; cy+=sp.y;
      }
      return {pts, cx:cx/18, cy:cy/18};
    };
    const rimPath = (k)=> rimPathZ(k, 0);
    const trace = (o)=>{ ctx.beginPath();
      o.pts.forEach((p,i)=> i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
      ctx.closePath(); };
    const rim = rimPath(1);                          /* opening at ground level */
    const bot = rimPathZ(0.5, CUP_DEPTH);            /* inset floor, down in the ground */
    if(rim && bot){
      let rMax=0, ryTop=1e9, ryBot=-1e9;
      rim.pts.forEach(p=>{ rMax=Math.max(rMax, Math.hypot(p.x-rim.cx, p.y-rim.cy));
                           ryTop=Math.min(ryTop,p.y); ryBot=Math.max(ryBot,p.y); });
      const ryH=(ryBot-ryTop)/2;

      /* 1 — thin dirt ring at the very lip (grass → soil) */
      ctx.save(); trace(rim); ctx.clip();
      trace(rim); ctx.fillStyle='#5e4228'; ctx.fill();

      /* 2 — THE CUP WALL: a real cylinder wall connecting the top rim down to the floor.
         Drawn as one band (top rim outline → reversed floor outline) and shaded by a vertical
         gradient: bright where the far wall catches light up top, dark down in the depths. */
      const wall = new Path2D();
      rim.pts.forEach((p,i)=> i?wall.lineTo(p.x,p.y):wall.moveTo(p.x,p.y));
      for(let i=bot.pts.length-1;i>=0;i--){ const p=bot.pts[i]; wall.lineTo(p.x,p.y); }
      wall.closePath();
      const wg = ctx.createLinearGradient(0, ryTop, 0, bot.cy+ (bot.cy-rim.cy<8?ryH:0));
      wg.addColorStop(0,'#9aa6ac');                  /* far wall just under the rim, softly lit */
      wg.addColorStop(0.28,'#5c666c');
      wg.addColorStop(0.6,'#333b40');
      wg.addColorStop(1,'#161a1d');                  /* deep shadow at the bottom */
      ctx.fillStyle=wg; ctx.fill(wall);
      /* near (front) wall darker — the side closest to camera is in shadow */
      const ng=ctx.createLinearGradient(0, rim.cy, 0, bot.cy);
      ng.addColorStop(0,'rgba(0,0,0,.15)'); ng.addColorStop(1,'rgba(0,0,0,.6)');
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(rim.pts[0].x,rim.pts[0].y);
      rim.pts.forEach(p=>{ if(p.y>=rim.cy) ctx.lineTo(p.x,p.y); });
      bot.pts.slice().reverse().forEach(p=>{ if(p.y>=bot.cy) ctx.lineTo(p.x,p.y); });
      ctx.closePath(); ctx.fillStyle=ng; ctx.fill();
      ctx.restore();
      /* inner-lip shadow: a dark band hugging just inside the rim so the hole reads as cut
         into the turf (the grass edge casts shade straight down) */
      ctx.save(); trace(rim); ctx.clip();
      const ls=ctx.createRadialGradient(rim.cx,rim.cy,rMax*0.55,rim.cx,rim.cy,rMax*1.02);
      ls.addColorStop(0,'rgba(0,0,0,0)'); ls.addColorStop(1,'rgba(0,0,0,.5)');
      ctx.fillStyle=ls; trace(rim); ctx.fill(); ctx.restore();

      /* 3 — the white cup liner floor at the bottom */
      ctx.beginPath();
      bot.pts.forEach((p,i)=> i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
      ctx.closePath();
      const ff=ctx.createRadialGradient(bot.cx-rMax*0.2,bot.cy-ryH*0.2,1,bot.cx,bot.cy,rMax*0.9);
      ff.addColorStop(0,'#b9c2c7'); ff.addColorStop(1,'#4a5258');
      ctx.fillStyle=ff; ctx.fill();

      /* 4 — ball sinking: drops down the real cylinder from rim to floor */
      if(allowSink && sinkT>0){
        const t = 1 - sinkT/SINK_DUR;
        let fall = t*t;
        const bounce = (t>0.72) ? Math.sin((t-0.72)/0.28*Math.PI)*0.08 : 0;
        fall = Math.min(1, fall - bounce);
        const br = rMax*0.6*(1 - fall*0.22);
        const bx = rim.cx + (bot.cx-rim.cx)*fall;
        const by = rim.cy + (bot.cy-rim.cy)*fall + fall*ryH*0.4;
        /* shadow on the floor */
        ctx.globalAlpha=0.4*fall; ctx.fillStyle='#000';
        ctx.beginPath(); ctx.ellipse(bot.cx, bot.cy, br*0.85*fall, br*0.3*fall, 0,0,Math.PI*2); ctx.fill();
        ctx.globalAlpha=1;
        const shade=1-fall*0.66;
        const bg=ctx.createRadialGradient(bx-br*0.32,by-br*0.36,br*0.15,bx,by,br);
        bg.addColorStop(0,`rgba(${255*shade|0},${255*shade|0},${255*shade|0},1)`);
        bg.addColorStop(1,`rgba(${164*shade|0},${176*shade|0},${184*shade|0},1)`);
        ctx.fillStyle=bg;
        ctx.beginPath(); ctx.arc(bx,by,br,0,Math.PI*2); ctx.fill();
        if(fall<0.5){ ctx.globalAlpha=(0.5-fall)*1.6; ctx.fillStyle='#fff';
          ctx.beginPath(); ctx.arc(bx-br*0.3,by-br*0.38,br*0.2,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1; }
      }
      ctx.restore();

      /* 5 — crisp grass cut-edge around the opening; a subtle bright highlight on the far lip
         and a soft cast shadow on the near grass sell the raised rim */
      trace(rim);
      ctx.lineWidth=Math.max(0.8, rMax*0.09);
      ctx.strokeStyle='rgba(28,48,28,.6)'; ctx.lineJoin='round'; ctx.stroke();
      /* far-lip highlight (top, catching light) */
      ctx.beginPath();
      rim.pts.forEach((p,i)=>{ if(p.y<=rim.cy){ i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);} });
      ctx.strokeStyle='rgba(180,210,150,.4)'; ctx.lineWidth=Math.max(0.6,rMax*0.05); ctx.stroke();
    }
  }
  /* draw the real 3D cup: on the range, one on every green; otherwise just at the pin */
  if(rangeMode && CUR.rangeGreens){
    const ah = activeHole();
    for(const g of CUR.rangeGreens) drawCup3D(g.x, g.y, g===ah);
  } else {
    drawCup3D(PIN.x, PIN.y, true);
  }
  if(celebT>0){
    /* bright green/gold rings rippling out from the hole */
    for(let i=0;i<3;i++){
      const ph = ((1.8-celebT)*0.9 + i*0.3) % 1;
      const rr = 10 + ph*70;
      const al = (1-ph)*0.55*Math.min(1,celebT);
      const ring = circlePoly(PIN.x, PIN.y, rr, 26);
      if(pathGround(ring)){
        ctx.strokeStyle = i%2 ? `rgba(255,216,77,${al})` : `rgba(126,217,87,${al})`;
        ctx.lineWidth = 3; ctx.stroke();
      }
    }
  }

  /* wedge/iron/driver shot preview */
  if(prediction && (state===ST.AIM || state===ST.PULL || (greenCam && greenCam.on))){
    const P = prediction;
    if(P.puttPath){
      /* bright yellow putting guide: shows the break path, no end markers */
      const reveal = (greenCam && greenCam.on)
        ? 1                                          // reading the green: show the FULL break path
        : (state===ST.PULL
            ? Math.min(1, 0.15 + pullPower/100*0.95)
            : 0.35);
      const n = Math.max(2, Math.round(P.puttPath.length*reveal));
      const path = P.puttPath.slice(0, n);
      const chunks=[[0,Math.floor(n/3),1],[Math.floor(n/3),Math.floor(2*n/3),0.7],[Math.floor(2*n/3),n,0.42]];
      chunks.forEach(([a,b,f])=>{
        if(b-a>1){
          const seg=path.slice(Math.max(0,a-1),b);
          strokeSmooth(seg, `rgba(255,235,59,${0.88*f})`, 2.6, [7,6], `rgba(255,215,0,${0.28*f})`);
        }
      });
    } else if(P.puttLine){
      /* intended starting line only — the break is yours to read */
      strokeSmooth(P.puttLine, 'rgba(255,255,255,.92)', 2.4, [7,6], 'rgba(255,255,255,.18)');
      const tip = proj(P.puttLine[1].x, P.puttLine[1].y, surfaceHeightVis(P.puttLine[1].x,P.puttLine[1].y));
      if(tip){ ctx.fillStyle='rgba(255,255,255,.9)';
        ctx.beginPath(); ctx.arc(tip.x,tip.y,Math.max(1.6,cam.foc*2.2/tip.z),0,Math.PI*2); ctx.fill(); }
    } else {
    strokeSmooth(P.airPts,
      'rgba(255,255,255,.92)', 2.6, [9,7], 'rgba(255,255,255,.2)');
    if(P.rollPts.length>1)
      strokeSmooth(P.rollPts, 'rgba(255,228,77,.98)', 2.8, null, 'rgba(255,200,40,.28)');   // bounce + rollout
    if(P.backPts && P.backPts.length>1)
      strokeSmooth(P.backPts, 'rgba(150,225,255,.98)', 2.8, null, 'rgba(90,190,255,.28)');  // backspin rollback
    P.bounces.forEach(b=>{
      const s=proj(b.x,b.y,0);
      if(s){ ctx.fillStyle='rgba(255,255,255,.8)';
        ctx.beginPath(); ctx.arc(s.x,s.y,Math.max(1.6,cam.foc*2.4/s.z),0,Math.PI*2); ctx.fill(); }
    });
    const zone = circlePoly(P.landing.x, P.landing.y, P.errR, 24);
    if(pathGround(zone)){
      ctx.fillStyle = 'rgba(255,255,255,.14)';
      ctx.fill();
      ctx.setLineDash([6,6]);
      ctx.strokeStyle = 'rgba(255,255,255,.75)';
      ctx.lineWidth=1.6; ctx.stroke(); ctx.setLineDash([]);
    }
    /* landing X + rest ring + carry/total labels */
    { const s=proj(P.landing.x,P.landing.y,0);
      if(s){ const r=Math.max(2,cam.foc*4/s.z);
        ctx.strokeStyle='rgba(255,255,255,.9)'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(s.x-r,s.y-r); ctx.lineTo(s.x+r,s.y+r);
        ctx.moveTo(s.x+r,s.y-r); ctx.lineTo(s.x-r,s.y+r); ctx.stroke(); } }
    { const s=proj(P.rest.x,P.rest.y,0);
      if(s && !P.water){ const r=Math.max(2.5,cam.foc*5/s.z);
        ctx.strokeStyle='rgba(255,224,130,.95)'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(s.x,s.y,r,0,Math.PI*2); ctx.stroke(); } }
    const rs = proj(P.rest.x, P.rest.y, 0);
    if(rs && rs.z>20){
      const totYd = Math.round(dist(ball.x,ball.y,P.rest.x,P.rest.y)*YD_PER_PX);
      const sw = Math.abs(pullShape)>1 ? (pullShape>0?'SLICE':'HOOK') :
                 shape<-0.2 ? 'DRAW' : shape>0.2 ? 'FADE' : 'STRAIGHT';
      const txt = P.water ? (THEME()==='volcano' ? 'LAVA' : 'WATER') :
        (CLUBS[clubIdx].loft>0 ? `${sw} · ${totYd} YDS` : `${totYd} YDS`);
      ctx.font='bold 13px Trebuchet MS, sans-serif';
      ctx.textAlign='center';
      ctx.lineWidth=3; ctx.strokeStyle='rgba(29,58,34,.8)';
      ctx.strokeText(txt, rs.x, rs.y-12);
      ctx.fillStyle='#fff'; ctx.fillText(txt, rs.x, rs.y-12);
    }
    }
  }

  /* billboards */
  const bills = [];
  TREES.forEach((t,i)=>{
    const groundZ = (THEME()!=='volcano') ? surfaceHeightVis(t.x,t.y) : 0;
    const s = proj(t.x,t.y,groundZ);
    if(!s) return;
    /* fade a tree that stands between the camera and the ball and covers it on screen,
       so the player can always see the shot (aim + flight). */
    let alpha = 1;
    if(state===ST.AIM || state===ST.PULL || ball.moving || ball.air){
      const bs = proj(ball.x, ball.y, (ball.z||0)+surfaceHeightVis(ball.x,ball.y));
      if(bs && s.z < bs.z - 6){                       /* tree is nearer than the ball   */
        const sc = cam.foc/s.z;
        const rx = t.r*sc*1.05, ry = (TRUNK_H+t.r)*sc;
        const dx = Math.abs(bs.x - s.x), dy = Math.abs(bs.y - (s.y - TRUNK_H*sc*0.5));
        if(dx < rx+10 && dy < ry+10){                 /* ball sits within the canopy     */
          const cover = 1 - Math.min(1, Math.hypot(dx/(rx+10), dy/(ry+10)));
          alpha = 1 - 0.62*Math.min(1, cover*1.6);    /* down to ~0.38 dead-center        */
        }
      }
    }
    bills.push({z:s.z, draw:()=>drawTree(t,s,i,alpha)});
  });
  for(const d of DECOR){
    const s = proj(d.x, d.y, 0);
    if(!s || s.z<NEAR+2 || s.z>900) continue;
    const sc = cam.foc/s.z;
    if(d.kind==='rock') bills.push({z:s.z, draw:()=>{
      const r=d.r*sc;
      ctx.fillStyle='rgba(25,60,30,.25)';
      ctx.beginPath(); ctx.ellipse(s.x+r*0.2,s.y+r*0.25,r*1.1,r*0.4,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=d.tone<0.5?'#9aa3a8':'#aab3b8';
      ctx.beginPath(); ctx.ellipse(s.x,s.y-r*0.4,r,r*0.72,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.3)';
      ctx.beginPath(); ctx.ellipse(s.x-r*0.3,s.y-r*0.65,r*0.32,r*0.2,0.4,0,Math.PI*2); ctx.fill();
    }});
    else if(d.kind==='boulder') bills.push({z:s.z, draw:()=>{
      const r=d.r*sc;
      const rr=mulberry(d.seed);
      /* build a jagged outline: radii wobble per vertex, taller than wide, sitting on ground */
      const N=9, top=s.y - r*1.5, cx=s.x, cyb=s.y;
      const pts=[];
      for(let k=0;k<N;k++){
        const a=(k/N)*Math.PI*2 - Math.PI/2;           /* start at top */
        const wob=0.62+rr()*0.5;                        /* jagged radius */
        const rx=r*1.0*wob, ry=r*1.18*wob;
        pts.push({x:cx+Math.cos(a)*rx, y:(cyb - r*0.9) + Math.sin(a)*ry});
      }
      /* contact shadow */
      ctx.fillStyle='rgba(20,45,24,.32)';
      ctx.beginPath(); ctx.ellipse(cx+r*0.15, cyb-r*0.05, r*1.15, r*0.4, 0,0,Math.PI*2); ctx.fill();
      /* base rock body */
      const g=d.tone;
      const baseCol=`rgb(${Math.round(120*g)},${Math.round(126*g)},${Math.round(134*g)})`;
      ctx.fillStyle=baseCol;
      ctx.beginPath(); pts.forEach((p,k)=> k?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.closePath(); ctx.fill();
      /* lit top-left facet */
      ctx.fillStyle=`rgb(${Math.round(170*g)},${Math.round(176*g)},${Math.round(182*g)})`;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.lineTo(pts[1].x, pts[1].y);
      ctx.lineTo(cx-r*0.1, cyb-r*0.95);
      ctx.lineTo(pts[N-1].x, pts[N-1].y);
      ctx.closePath(); ctx.fill();
      /* dark right facet */
      ctx.fillStyle=`rgb(${Math.round(80*g)},${Math.round(86*g)},${Math.round(94*g)})`;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.lineTo(cx-r*0.1, cyb-r*0.95);
      ctx.lineTo(pts[Math.floor(N*0.5)].x, pts[Math.floor(N*0.5)].y);
      ctx.lineTo(pts[Math.floor(N*0.62)].x, pts[Math.floor(N*0.62)].y);
      ctx.closePath(); ctx.fill();
      /* a couple of crack lines for rocky detail */
      if(SET.quality==='high'){
        ctx.strokeStyle=`rgba(${Math.round(60*g)},${Math.round(64*g)},${Math.round(70*g)},.7)`;
        ctx.lineWidth=Math.max(0.6, r*0.06);
        ctx.beginPath();
        ctx.moveTo(cx-r*0.1, cyb-r*0.95);
        ctx.lineTo(cx+r*0.05, cyb-r*0.5);
        ctx.lineTo(cx-r*0.2, cyb-r*0.2);
        ctx.stroke();
      }
    }});
    else if(d.kind==='bush') bills.push({z:s.z, draw:()=>{
      const r=d.r*sc, sway=Math.sin(curNow/1100+d.ph)*r*0.06;
      ctx.fillStyle='rgba(25,60,30,.25)';
      ctx.beginPath(); ctx.ellipse(s.x,s.y,r*1.1,r*0.35,0,0,Math.PI*2); ctx.fill();
      ['#256e35','#2f8443','#3a9a50'].forEach((c,j)=>{
        ctx.fillStyle=c;
        ctx.beginPath(); ctx.arc(s.x+(j-1)*r*0.45+sway, s.y-r*0.45-(j%2)*r*0.18, r*0.55, 0, Math.PI*2); ctx.fill();
      });
    }});
    else if(d.kind==='flowers') bills.push({z:s.z, draw:()=>{
      const rr=mulberry(d.seed);
      for(let f=0; f<d.n; f++){
        const fx=s.x+(rr()-0.5)*16*sc, fy=s.y-(rr())*5*sc;
        const col=['#ff9ec4','#ffd84d','#ffffff'][f%3];
        const r=Math.max(0.7, 1.7*sc);
        ctx.fillStyle=col;
        ctx.beginPath(); ctx.arc(fx,fy,r,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='rgba(40,90,40,.6)';
        ctx.fillRect(fx-0.4*sc, fy+r*0.5, Math.max(0.5,0.8*sc), 2.4*sc);
      }
    }});
    else if(d.kind==='reed') bills.push({z:s.z, draw:()=>{
      const hgt=Math.max(3, 11*sc), swy=Math.sin(curNow/900+d.ph)*hgt*0.12;
      ctx.lineCap='round';
      for(let q=0;q<d.n;q++){
        const bx=s.x+(q-d.n/2)*2.6*sc;
        ctx.strokeStyle = q%2 ? '#3d5a2e' : '#4a6b36';
        ctx.lineWidth=Math.max(0.7, 1.4*sc);
        ctx.beginPath();
        ctx.moveTo(bx, s.y);
        ctx.quadraticCurveTo(bx+swy*0.4, s.y-hgt*0.6, bx+swy, s.y-hgt*(0.9+q*0.12));
        ctx.stroke();
        if(q===0){
          ctx.fillStyle='#6e4a26';
          ctx.beginPath();
          ctx.ellipse(bx+swy, s.y-hgt*0.98, Math.max(0.6,1.2*sc), Math.max(1.2,2.8*sc), 0, 0, Math.PI*2);
          ctx.fill();
        }
      }
    }});
    else if(d.kind==='goose') bills.push({z:s.z, draw:()=>{
      const r=Math.max(1.6, 4.2*sc);
      const bob=Math.sin(curNow/640+d.ph)*r*0.1;
      ctx.fillStyle='rgba(25,60,30,.25)';
      ctx.beginPath(); ctx.ellipse(s.x,s.y,r*1.2,r*0.35,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#f4f6f2';                                  /* body */
      ctx.beginPath(); ctx.ellipse(s.x,s.y-r*0.55,r,r*0.6,0,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#2a2f33'; ctx.lineWidth=Math.max(0.8,r*0.22); ctx.lineCap='round';
      ctx.beginPath();                                          /* neck */
      ctx.moveTo(s.x+d.face*r*0.7, s.y-r*0.75);
      ctx.quadraticCurveTo(s.x+d.face*r*1.05, s.y-r*1.5+bob, s.x+d.face*r*0.95, s.y-r*1.75+bob);
      ctx.stroke();
      ctx.fillStyle='#2a2f33';                                  /* head */
      ctx.beginPath(); ctx.arc(s.x+d.face*r*0.95, s.y-r*1.78+bob, r*0.22, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle='#ff9d2e';                                  /* bill */
      ctx.beginPath();
      ctx.moveTo(s.x+d.face*r*1.1, s.y-r*1.78+bob);
      ctx.lineTo(s.x+d.face*r*1.42, s.y-r*1.72+bob);
      ctx.lineTo(s.x+d.face*r*1.1, s.y-r*1.66+bob);
      ctx.closePath(); ctx.fill();
    }});
  }
  TUFTS.forEach(tf=>{
    if(typeof greenSDF==='function' && greenSDF(tf.x,tf.y) > -10) return;   /* never on/over the green */
    const tz = (THEME()!=='volcano') ? surfaceHeightVis(tf.x,tf.y) : 0;
    const s = proj(tf.x,tf.y,tz);
    if(s && s.z>45 && s.z<700) bills.push({z:s.z, draw:()=>drawTuft(tf,s)});
  });
  if(!rangeMode){ const pz=surfaceHeightVis(PIN.x,PIN.y); const s = proj(PIN.x,PIN.y,pz);
    if(s) bills.push({z:s.z-1, draw:()=>drawFlag(s,pz)}); }
  /* DRIVING RANGE: each green is real with a real 3D cup (drawn in the ground pass).
     Here we add just the flag + yard marker as a billboard so it stands up correctly. */
  if(rangeMode && CUR.rangeGreens){
    for(const t of CUR.rangeGreens){
      const gz = surfaceHeightVis(t.x, t.y);
      const fs = proj(t.x, t.y, gz);
      if(!fs) continue;
      bills.push({z:fs.z-1, draw:()=>{
        const sc = cam.foc/fs.z;
        const fh = 42*sc;
        /* pole shadow + white pole rising from the cup */
        ctx.strokeStyle='rgba(20,40,26,.3)'; ctx.lineWidth=Math.max(1.6,2*sc);
        ctx.beginPath(); ctx.moveTo(fs.x+1.5, fs.y); ctx.lineTo(fs.x+1.5, fs.y-fh); ctx.stroke();
        ctx.strokeStyle='#f4f4f4'; ctx.lineWidth=Math.max(1.3,1.6*sc);
        ctx.beginPath(); ctx.moveTo(fs.x, fs.y); ctx.lineTo(fs.x, fs.y-fh); ctx.stroke();
        /* flag with yard number on it */
        const fw=Math.max(16,26*sc), fhh=Math.max(11,15*sc);
        ctx.fillStyle='#e23b3b';
        ctx.beginPath(); ctx.moveTo(fs.x, fs.y-fh); ctx.lineTo(fs.x+fw, fs.y-fh+fhh*0.5);
        ctx.lineTo(fs.x, fs.y-fh+fhh); ctx.closePath(); ctx.fill();
        ctx.fillStyle='#fff'; ctx.font='900 '+Math.max(8,11*sc)+'px Trebuchet MS, sans-serif';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(t.yards, fs.x+fw*0.42, fs.y-fh+fhh*0.5);
        ctx.textAlign='start'; ctx.textBaseline='alphabetic';
      }});
    }
  }
  trail.forEach(tp=>{
    const s = proj(tp.x,tp.y,tp.z);
    if(s) bills.push({z:s.z, draw:()=>{
      ctx.globalAlpha=tp.life*1.4;
      ctx.fillStyle = tp.gold ? '#ffd84d' : (tp.hue || '#fff');
      ctx.beginPath(); ctx.arc(s.x,s.y,Math.max(1,cam.foc*(tp.gold?2.2:1.7)/s.z),0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=1;
    }});
  });
  /* MULTIPLAYER: show every OTHER player's ball on the course so you can see where
     everyone lies while it's your turn. Drawn as a seat-colored marker with a seat number;
     skipped for the active player (their ball is the main one drawn below) and for anyone
     who has holed out or has no ball yet. */
  if(MP && MP.on && MP.players){
    MP.players.forEach((pl, pi)=>{
      if(pi === MP.turn) return;                 // active player's ball is drawn normally
      if(pl.holed || !pl.ball) return;
      const b = pl.ball;
      const bh = surfaceHeightVis(b.x, b.y);
      const sp = proj(b.x, b.y, (b.z||0)+bh+3);
      const ss = proj(b.x, b.y, bh);             // shadow on the ground
      if(ss) bills.push({ z: ss.z+0.4, draw:()=>{
        const r = cam.foc*4.5/ss.z;
        ctx.fillStyle='rgba(25,70,30,.28)';
        ctx.beginPath(); ctx.ellipse(ss.x, ss.y, r*0.9, r*0.4, 0, 0, Math.PI*2); ctx.fill();
      }});
      if(sp) bills.push({ z: sp.z, draw:()=>{
        const r = Math.max(2.2, cam.foc*4.0/sp.z);
        const lx=-0.42, ly=-0.46;
        // render this player's ACTUAL equipped ball skin (so people can show off shop balls)
        const skin = skinById(pl.skin || 'white');
        const st = skin.stops;
        const g = ctx.createRadialGradient(sp.x+lx*r*0.8, sp.y+ly*r*0.8, r*0.1, sp.x, sp.y, r*1.06);
        g.addColorStop(0, st[0]); g.addColorStop(0.5, st[1]); g.addColorStop(0.82, st[2]); g.addColorStop(1, st[3]);
        if(skin.alpha!==undefined) ctx.globalAlpha = skin.alpha;
        ctx.beginPath(); ctx.arc(sp.x, sp.y, r, 0, Math.PI*2);
        ctx.fillStyle = g; ctx.fill();
        ctx.globalAlpha = 1;
        // thin seat-colored ring so you can still tell players apart at a glance
        ctx.lineWidth = Math.max(1, r*0.20); ctx.strokeStyle = pl.color || 'rgba(255,255,255,.85)'; ctx.stroke();
        // NAME tag above the ball when reasonably close (their entered name, not "P3").
        // Each player's tag is tinted with THEIR color, semi-transparent so it floats lightly.
        if(sp.z < 680){
          const label = (pl.name || ('Player '+((pl.seat!=null?pl.seat:pi)+1))).slice(0, 12);
          ctx.font = `800 ${Math.max(8, r*1.15)}px system-ui,sans-serif`;
          ctx.textAlign='center'; ctx.textBaseline='middle';
          const padX = Math.max(5, r*0.65);
          const tw = ctx.measureText(label).width;
          const boxW = tw + padX*2, boxH = Math.max(11, r*1.55);
          const boxY = sp.y - r*2.9;
          // translucent tint from the player's seat color (falls back to dark)
          const tint = (typeof rgbaFrom==='function') ? rgbaFrom(pl.color, 0.42) : 'rgba(16,28,22,.42)';
          ctx.globalAlpha = 1;
          ctx.fillStyle = tint;
          ctx.beginPath(); ctx.roundRect(sp.x - boxW/2, boxY, boxW, boxH, boxH*0.34); ctx.fill();
          // soft seat-colored hairline so each tag reads as that player's
          ctx.lineWidth = 1; ctx.strokeStyle = (typeof rgbaFrom==='function') ? rgbaFrom(pl.color, 0.55) : 'rgba(255,255,255,.3)';
          ctx.beginPath(); ctx.roundRect(sp.x - boxW/2, boxY, boxW, boxH, boxH*0.34); ctx.stroke();
          // the name, slightly translucent white for a lighter look
          ctx.fillStyle = 'rgba(255,255,255,.92)';
          ctx.fillText(label, sp.x, boxY + boxH/2);
          ctx.textAlign='start'; ctx.textBaseline='alphabetic';
        }
      }});
    });
  }
  if(state!==ST.HOLED){
    const bze = surfaceHeightVis(ball.x,ball.y);
    const sh = proj(ball.x,ball.y,bze);
    const sb = proj(ball.x,ball.y,ball.z+4+bze);
    if(sh) bills.push({z:sh.z+0.5, draw:()=>{
      const r = cam.foc*5/sh.z * Math.max(0.4, 1-ball.z/220);
      ctx.fillStyle='rgba(25,70,30,.32)';
      ctx.beginPath(); ctx.ellipse(sh.x,sh.y,r,r*0.45,0,0,Math.PI*2); ctx.fill();
    }});
    if(sb && state!==ST.HOLED) bills.push({z:sb.z, draw:()=>{
      const r = Math.max(2.4, cam.foc*4.5/sb.z);
      const lx=-0.42, ly=-0.46;                          /* light direction (upper-left) */
      /* active ball skin: a streak temporarily forces gold, otherwise the equipped store skin */
      const skin = ball.gold ? skinById('gold') : skinById(stats.equippedSkin||'white');
      const st = skin.stops;
      const g = ctx.createRadialGradient(sb.x+lx*r*0.8, sb.y+ly*r*0.8, r*0.1, sb.x, sb.y, r*1.06);
      g.addColorStop(0, st[0]); g.addColorStop(0.5, st[1]); g.addColorStop(0.82, st[2]); g.addColorStop(1, st[3]);
      if(skin.alpha!==undefined) ctx.globalAlpha = skin.alpha;
      ctx.fillStyle=g;
      ctx.beginPath(); ctx.arc(sb.x,sb.y,r,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
      /* dimples: fixed points on a real unit sphere, rotated in 3D by ball.rot and
         projected. Each dimple is a tiny crater: shadow on the lit side, faint
         highlight on the far side — so the surface reads as real and the spin is clear. */
      if(r>4.2){
        ctx.save();
        ctx.beginPath(); ctx.arc(sb.x,sb.y,r*0.985,0,Math.PI*2); ctx.clip();
        const a = ball.rot||0, ca=Math.cos(a), sa=Math.sin(a);
        const baseA = 0.34+Math.min(0.16,Math.abs(ball.spin||0)*0.14);
        /* thin the dimple count when the ball is mid-size: full detail only when large &
           close. Stepping the loop keeps the look while cutting draw calls way down. */
        const dStep = r>10 ? 1 : (r>6.5 ? 2 : 3);
        for(let i=0;i<DIMPLES.length;i+=dStep){
          const d=DIMPLES[i];
          /* rotate around the screen-horizontal axis: pure rolling motion */
          const y =  d.y*ca - d.z*sa;
          const z =  d.y*sa + d.z*ca;
          if(z < 0.06) continue;                         /* back hemisphere hidden */
          const px = sb.x + d.x*r*0.94;
          const py = sb.y - y*r*0.94;
          const dr = r*0.082*(0.4+0.6*z);                /* foreshorten toward the limb */
          const fade = Math.min(1, (z-0.06)*2.2);        /* soften dimples at the limb */
          if(dr<0.5){ continue; }
          /* crater shadow (offset toward the light) + tiny far-side rim highlight */
          ctx.globalAlpha = baseA*fade;
          ctx.fillStyle = '#aab4bd';
          ctx.beginPath();
          ctx.ellipse(px, py, dr, dr*Math.max(0.42,z), 0, 0, Math.PI*2);
          ctx.fill();
          ctx.globalAlpha = baseA*fade*0.7;
          ctx.fillStyle = '#7f8c97';
          ctx.beginPath();
          ctx.ellipse(px - lx*dr*0.5, py - ly*dr*0.5, dr*0.62, dr*0.62*Math.max(0.42,z), 0, 0, Math.PI*2);
          ctx.fill();
          if(r>6){                                       /* rim catch-light when large enough */
            ctx.globalAlpha = baseA*fade*0.5;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(px + lx*dr*0.55, py + ly*dr*0.55, dr*0.4, dr*0.4*Math.max(0.42,z), 0, 0, Math.PI*2);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
        /* terminator shading: soft core shadow on the lower-right */
        const ao = ctx.createRadialGradient(sb.x+lx*r*0.5, sb.y+ly*r*0.5, r*0.25, sb.x, sb.y, r*1.02);
        ao.addColorStop(0,'rgba(0,0,0,0)');
        ao.addColorStop(0.7,'rgba(0,0,0,0)');
        ao.addColorStop(1,'rgba(54,70,82,.26)');
        ctx.fillStyle=ao;
        ctx.beginPath(); ctx.arc(sb.x,sb.y,r,0,Math.PI*2); ctx.fill();
        /* bright reflected rim light on the shadow side (fill light) */
        ctx.globalAlpha=0.5;
        ctx.strokeStyle='rgba(255,255,255,.4)'; ctx.lineWidth=Math.max(0.5,r*0.05);
        ctx.beginPath(); ctx.arc(sb.x,sb.y,r*0.94, Math.PI*0.15, Math.PI*0.75); ctx.stroke();
        ctx.globalAlpha=1;
        ctx.restore();
      }
      /* glossy specular: a hot pinpoint + a soft bloom around it */
      const sg=ctx.createRadialGradient(sb.x+lx*r*0.9, sb.y+ly*r*0.9, 0, sb.x+lx*r*0.9, sb.y+ly*r*0.9, r*0.5);
      sg.addColorStop(0,'rgba(255,255,255,.95)'); sg.addColorStop(0.4,'rgba(255,255,255,.3)'); sg.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=sg;
      ctx.beginPath(); ctx.arc(sb.x+lx*r*0.9, sb.y+ly*r*0.9, r*0.5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.95)';
      ctx.beginPath(); ctx.arc(sb.x+lx*r*0.95, sb.y+ly*r*0.95, Math.max(0.6,r*0.13), 0, Math.PI*2); ctx.fill();
      /* ===== premium skin effects ===== */
      const fxSkin = ball.gold ? skinById('gold') : skinById(stats.equippedSkin||'white');
      if(r>3 && fxSkin.brilliant){
        const tnow=(typeof curNow!=='undefined'?curNow:Date.now());
        drawBrilliant(ctx, sb.x, sb.y, r, fxSkin, tnow, lx, ly);
      } else if(r>3 && (fxSkin.metallic || fxSkin.facet || fxSkin.sparkle)){
        ctx.save();
        ctx.beginPath(); ctx.arc(sb.x,sb.y,r*0.99,0,Math.PI*2); ctx.clip();
        if(fxSkin.metallic){
          /* a bright anisotropic sheen band sweeping across the metal */
          const mg=ctx.createLinearGradient(sb.x-r, sb.y-r*0.3, sb.x+r, sb.y+r*0.3);
          mg.addColorStop(0,'rgba(255,255,255,0)');
          mg.addColorStop(0.46,'rgba(255,255,255,.55)');
          mg.addColorStop(0.5,'rgba(255,255,255,.8)');
          mg.addColorStop(0.54,'rgba(255,255,255,.5)');
          mg.addColorStop(1,'rgba(255,255,255,0)');
          ctx.fillStyle=mg; ctx.beginPath(); ctx.arc(sb.x,sb.y,r,0,Math.PI*2); ctx.fill();
        }
        if(fxSkin.facet){
          /* faceted gem look: a few angular bright/dark slices rotating with the ball */
          const a0=(ball.rot||0)*0.6, st=fxSkin.stops;
          for(let f=0;f<6;f++){
            const a=a0+f*Math.PI/3;
            const fx=sb.x+Math.cos(a)*r*0.5, fy=sb.y+Math.sin(a)*r*0.5;
            ctx.globalAlpha=f%2?0.18:0.30;
            ctx.fillStyle=f%2?'#ffffff':st[3];
            ctx.beginPath();
            ctx.moveTo(sb.x,sb.y);
            ctx.lineTo(sb.x+Math.cos(a-0.5)*r, sb.y+Math.sin(a-0.5)*r);
            ctx.lineTo(sb.x+Math.cos(a+0.1)*r, sb.y+Math.sin(a+0.1)*r);
            ctx.closePath(); ctx.fill();
          }
          ctx.globalAlpha=1;
          /* bright central table facet */
          const cg=ctx.createRadialGradient(sb.x+lx*r*0.3,sb.y+ly*r*0.3,r*0.05,sb.x,sb.y,r*0.6);
          cg.addColorStop(0,'rgba(255,255,255,.55)'); cg.addColorStop(1,'rgba(255,255,255,0)');
          ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(sb.x,sb.y,r*0.6,0,Math.PI*2); ctx.fill();
        }
        if(fxSkin.prismatic){
          /* diamond: faint rainbow dispersion arcs */
          const hues=['rgba(255,120,120,.22)','rgba(255,230,120,.22)','rgba(120,255,160,.22)','rgba(120,200,255,.22)','rgba(210,140,255,.22)'];
          for(let h=0;h<hues.length;h++){
            ctx.strokeStyle=hues[h]; ctx.lineWidth=Math.max(0.6,r*0.05);
            ctx.beginPath(); ctx.arc(sb.x,sb.y,r*(0.6+h*0.07), Math.PI*0.1, Math.PI*0.6); ctx.stroke();
          }
        }
        ctx.restore();
        if(fxSkin.sparkle){
          /* animated twinkle glints (crystal/diamond) */
          const tnow=(typeof curNow!=='undefined'?curNow:Date.now());
          for(let s=0;s<3;s++){
            const ph=(tnow/620 + s*0.37)%1;
            const aa=(s*2.1 + ph*6.28);
            const gx=sb.x+Math.cos(aa)*r*0.55, gy=sb.y+Math.sin(aa)*r*0.55;
            const tw=Math.sin(ph*Math.PI); if(tw<=0.05) continue;
            const gr=r*0.34*tw;
            ctx.globalAlpha=tw*0.9; ctx.fillStyle='#ffffff';
            ctx.beginPath();
            ctx.moveTo(gx,gy-gr); ctx.lineTo(gx+gr*0.18,gy-gr*0.18); ctx.lineTo(gx+gr,gy);
            ctx.lineTo(gx+gr*0.18,gy+gr*0.18); ctx.lineTo(gx,gy+gr);
            ctx.lineTo(gx-gr*0.18,gy+gr*0.18); ctx.lineTo(gx-gr,gy);
            ctx.lineTo(gx-gr*0.18,gy-gr*0.18); ctx.closePath(); ctx.fill();
          }
          ctx.globalAlpha=1;
        }
      }
    }});
  }
  particles.forEach(p=>{
    const s = proj(p.x,p.y,p.z);
    if(s) bills.push({z:s.z, draw:()=>{
      ctx.globalAlpha=Math.max(0,p.life/p.max);
      ctx.fillStyle=p.color;
      const r=Math.max(1,cam.foc*p.size/s.z);
      ctx.fillRect(s.x-r/2,s.y-r/2,r,r);
      ctx.globalAlpha=1;
    }});
  });
  bills.sort((a,b)=>b.z-a.z).forEach(b=>b.draw());

  /* result flash overlay */
  if(flash && flash.a>0.01){
    ctx.fillStyle=flash.color;
    ctx.globalAlpha=flash.a;
    ctx.fillRect(-20,-20,W+40,H+40);
    ctx.globalAlpha=1;
  }
  /* ambient sakura petals drifting across the course */
  if(SET.quality==='high' && THEME()==='sakura'){
    for(let k=0;k<GAME_PETALS.length;k++){
      const gp=GAME_PETALS[k];
      const px=((gp.x + now/gp.spd*40) % (W+60))-30;
      const py=((gp.y + now/gp.spd*16) % (H*0.7));
      const a = 0.34*(0.5+0.5*Math.sin(now/900+gp.ph));
      ctx.save();
      ctx.translate(px,py); ctx.rotate(now/700+gp.ph);
      ctx.fillStyle=`rgba(255,178,210,${a})`;
      ctx.beginPath(); ctx.ellipse(0,0,gp.s,gp.s*0.6,0,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
  }
  /* lighting: warm sun glow + soft vignette for depth */
  {
    const sun = ctx.createRadialGradient(W*0.22, H*0.08, 20, W*0.22, H*0.08, W*0.85);
    sun.addColorStop(0,'rgba(255,244,200,.14)');
    sun.addColorStop(0.4,'rgba(255,244,200,.05)');
    sun.addColorStop(1,'rgba(255,244,200,0)');
    ctx.fillStyle=sun; ctx.fillRect(0,0,W,H);
    const vig = ctx.createRadialGradient(W/2, H*0.46, H*0.42, W/2, H*0.52, H*0.95);
    if(THEME()==='volcano'){ vig.addColorStop(0,'rgba(40,8,4,0)'); vig.addColorStop(1,'rgba(40,8,4,.28)'); }
    else { vig.addColorStop(0,'rgba(10,30,16,0)'); vig.addColorStop(1,'rgba(10,30,16,.17)'); }
    ctx.fillStyle=vig; ctx.fillRect(0,0,W,H);
  }
  ctx.restore();
  drawMinimap();
}
function drawTree(t, s, i, alpha){
  if(alpha!==undefined && alpha<0.999){ ctx.save(); ctx.globalAlpha = alpha; }
  const sc = cam.foc/s.z;
  const sway = Math.sin(curNow/900 + i*1.7)*2.2*sc;
  /* big trees (the giant fairway oak) get a proportionally thicker, taller trunk */
  const big = Math.max(1, t.r/30);                    /* 1 for normal, ~1.7 for the giant oak */
  const trunkW = Math.max(1.5, 7*sc*Math.min(1.7,big)), trunkH = TRUNK_H*sc*Math.min(1.5,0.7+big*0.45);
  if(THEME()==='volcano'){
    /* squat jagged volcanic rock — low to the ground so it rarely blocks the shot */
    const h = (trunkH*0.5 + t.r*sc*0.7);
    const w = t.r*sc*0.85;
    ctx.fillStyle='rgba(10,6,6,.34)';                                  /* ground shadow */
    ctx.beginPath(); ctx.ellipse(s.x+w*0.4, s.y, w*1.2, w*0.4, 0.1, 0,Math.PI*2); ctx.fill();
    const seed=(i*97)%5;
    const rock=ctx.createLinearGradient(s.x-w,0,s.x+w,0);
    rock.addColorStop(0,'#3a3330'); rock.addColorStop(0.5,'#231d1c'); rock.addColorStop(1,'#0e0a0a');
    ctx.fillStyle=rock;
    ctx.beginPath();
    ctx.moveTo(s.x-w, s.y);
    ctx.lineTo(s.x-w*0.5, s.y-h*0.55);
    ctx.lineTo(s.x-w*0.15+sway*0.3, s.y-h);                            /* jagged peak */
    ctx.lineTo(s.x+w*0.3+sway*0.3, s.y-h*0.7);
    ctx.lineTo(s.x+w*0.55, s.y-h*0.4);
    ctx.lineTo(s.x+w, s.y);
    ctx.closePath(); ctx.fill();
    /* lit left facet */
    ctx.fillStyle='rgba(120,108,104,.3)';
    ctx.beginPath();
    ctx.moveTo(s.x-w, s.y); ctx.lineTo(s.x-w*0.5, s.y-h*0.55);
    ctx.lineTo(s.x-w*0.15+sway*0.3, s.y-h); ctx.lineTo(s.x-w*0.2, s.y);
    ctx.closePath(); ctx.fill();
    /* ember cracks near the base */
    if(seed<2){
      ctx.strokeStyle=`rgba(255,${110+seed*40},30,${0.4+0.2*Math.sin(curNow/400+i)})`;
      ctx.lineWidth=Math.max(0.6,w*0.1);
      ctx.beginPath(); ctx.moveTo(s.x-w*0.3,s.y-h*0.1); ctx.lineTo(s.x,s.y-h*0.35); ctx.lineTo(s.x+w*0.2,s.y-h*0.2); ctx.stroke();
    }
    return;
  }
  /* soft canopy shadow cast toward lower-right (one sun) — but NOT when the tree sits on or
     beside a green, where a screen-space shadow would float over the raised putting surface */
  const nearGreen = (typeof greenSDF==='function') && greenSDF(t.x, t.y) > -36;
  if(!nearGreen){
    ctx.fillStyle='rgba(18,50,26,.16)';
    ctx.beginPath(); ctx.ellipse(s.x+t.r*sc*0.5, s.y+t.r*sc*0.1, t.r*sc*1.25, t.r*sc*0.4, 0.12, 0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(18,50,26,.22)';
    ctx.beginPath(); ctx.ellipse(s.x, s.y, t.r*sc*0.8, t.r*sc*0.27, 0,0,Math.PI*2); ctx.fill();
  }
  /* pine-straw mulch ring on the GROUND beneath the tree (drawn before the trunk so the
     trunk stands on top of it, not behind it). Oak theme, normal trees only.
     Trees tagged sandMulch LOOK identical (brown straw) but PLAY as sand (see surfaceAt). */
  if(THEME()==='oak' && t.kind!=='oak' && t.kind!=='pine'){
    const mr = t.r*0.78;
    const ring = circlePolyXY(t.x, t.y, mr, mr, 22);
    fillGround(ring, '#6b4a2a');                    /* darker brown straw base */
    const ring2 = circlePolyXY(t.x, t.y, mr*0.7, mr*0.7, 18);
    fillGround(ring2, '#5a3d22');                   /* shaded inner */
    /* straw strands: short world-anchored strokes (fixed = no swim), radiating outward */
    if(SET.quality==='high' && pathGround(ring)){
      ctx.save(); ctx.clip();
      const rr2=mulberry((t.x*131+t.y*17)|0);
      ctx.lineCap='round';
      for(let k=0;k<30;k++){
        const a=rr2()*Math.PI*2, rad=mr*(0.2+0.75*rr2());
        const px=t.x+Math.cos(a)*rad, py=t.y+Math.sin(a)*rad;
        const dir=a+(rr2()-0.5)*0.8, len=mr*0.16;
        const p0=proj(px,py,0), p1=proj(px+Math.cos(dir)*len, py+Math.sin(dir)*len,0);
        if(!p0||!p1) continue;
        ctx.strokeStyle = (k%3===0) ? 'rgba(150,108,60,.7)' : 'rgba(92,64,36,.7)';
        ctx.lineWidth=Math.max(0.5, cam.foc*0.9/p0.z);
        ctx.beginPath(); ctx.moveTo(p0.x,p0.y); ctx.lineTo(p1.x,p1.y); ctx.stroke();
      }
      ctx.restore();
    }
  }
  /* trunk: lit left edge, bark streaks */
  const bark = ctx.createLinearGradient(s.x-trunkW/2,0, s.x+trunkW/2,0);
  bark.addColorStop(0,'#8a5a38'); bark.addColorStop(0.45,'#6e4528'); bark.addColorStop(1,'#4e3019');
  ctx.fillStyle=bark;
  ctx.fillRect(s.x-trunkW/2, s.y-trunkH, trunkW, trunkH);
  if(trunkW>3){
    ctx.strokeStyle='rgba(40,24,12,.4)'; ctx.lineWidth=Math.max(0.5,trunkW*0.12);
    for(let b=0;b<2;b++){
      const bx=s.x-trunkW*0.2+b*trunkW*0.3;
      ctx.beginPath(); ctx.moveTo(bx, s.y-trunkH*0.9); ctx.lineTo(bx+trunkW*0.08, s.y-trunkH*0.15); ctx.stroke();
    }
  }
  if(t.kind==='eucalyptus'){
    /* tall eucalyptus (gum tree): slender pale trunk with peeling patches, and an airy,
       open silvery blue-green canopy of hanging leaf clusters. Reads tall + bright. */
    const tallH = trunkH*1.5;                          /* taller than normal */
    /* repaint the trunk pale (the generic brown one was drawn above) */
    const gum = ctx.createLinearGradient(s.x-trunkW/2,0, s.x+trunkW/2,0);
    gum.addColorStop(0,'#e7ddc8'); gum.addColorStop(0.5,'#cdbfa2'); gum.addColorStop(1,'#a99a7c');
    ctx.fillStyle=gum;
    ctx.fillRect(s.x-trunkW/2, s.y-tallH, trunkW, tallH);
    /* peeling-bark streaks: warm ribbons revealing fresh bark beneath */
    if(trunkW>2){
      ctx.lineWidth=Math.max(0.6, trunkW*0.16); ctx.lineCap='round';
      [['rgba(170,120,90,.5)',-0.18],['rgba(120,150,120,.4)',0.16],['rgba(190,150,110,.45)',0.02]].forEach(([col,off],k)=>{
        ctx.strokeStyle=col;
        const bx=s.x+trunkW*off;
        ctx.beginPath(); ctx.moveTo(bx, s.y-tallH*0.92); 
        ctx.quadraticCurveTo(bx+trunkW*0.2, s.y-tallH*(0.5-k*0.08), bx-trunkW*0.05, s.y-tallH*0.12); ctx.stroke();
      });
    }
    /* airy open canopy: a few rounded silver-green clumps high up, lighter and bluer than
       other trees, with small gaps so it reads as the wispy eucalyptus look */
    const cy = s.y - tallH - t.r*sc*0.2;
    const clumps=[
      ['#5e8f6a', [[0,0.30,0.74],[-0.42,0.34,0.52],[0.44,0.34,0.5]]],     /* shaded blue-green */
      ['#7eb088', [[-0.12,0.02,0.7],[0.30,0.06,0.56],[-0.40,-0.06,0.42]]],/* body silvery green */
      ['#a7d4ad', [[0.06,-0.28,0.5],[-0.28,-0.30,0.4],[0.36,-0.22,0.36]]],/* lit silver crown   */
      ['#cdeac8', [[-0.14,-0.5,0.26],[0.18,-0.48,0.22]]]                   /* sun kiss           */
    ];
    clumps.forEach(([col,lobes])=>{
      ctx.fillStyle=col;
      lobes.forEach(([dx,dy,k])=>{
        ctx.beginPath();
        ctx.arc(s.x+dx*t.r*sc+sway*(1.2+dy*0.5), cy+dy*t.r*sc, t.r*sc*k*0.6, 0, Math.PI*2);
        ctx.fill();
      });
    });
    /* a few hanging leaf strands for the drooping gum-leaf feel */
    if(SET.quality==='high'){
      ctx.lineCap='round';
      for(let f=0; f<5; f++){
        const fx=s.x+(f/4-0.5)*t.r*sc*1.3;
        const top=cy+t.r*sc*0.34;
        const len=t.r*sc*(0.34+0.26*Math.sin(f*1.6));
        const tip=sway*1.3 + Math.sin(curNow/720 + f + i)*t.r*sc*0.08;
        ctx.strokeStyle=(f%2===0)?'rgba(126,176,136,.7)':'rgba(167,212,173,.65)';
        ctx.lineWidth=Math.max(0.7, t.r*sc*0.05);
        ctx.beginPath(); ctx.moveTo(fx,top); ctx.quadraticCurveTo(fx+tip*0.5, top+len*0.6, fx+tip, top+len); ctx.stroke();
      }
    }
  } else if(t.kind==='willow'){
    /* weeping willow: a soft teal-green dome with long drooping fronds that sway */
    const cy = s.y - trunkH - t.r*sc*0.4;
    const R = t.r*sc;
    /* canopy dome — layered jade greens */
    const dome=[
      ['#2f7d52', [[0,0.18,1.05],[-0.5,0.28,0.7],[0.5,0.28,0.7]]],
      ['#3f9a64', [[-0.18,-0.05,0.82],[0.28,-0.02,0.7],[0,0.32,0.8]]],
      ['#5cb87e', [[-0.28,-0.34,0.5],[0.2,-0.4,0.42]]],
      ['#8fd9a4', [[-0.12,-0.52,0.28]]]
    ];
    dome.forEach(([col,lobes])=>{
      ctx.fillStyle=col;
      lobes.forEach(([dx,dy,k])=>{ ctx.beginPath();
        ctx.arc(s.x+dx*R+sway*(1+dy*0.4), cy+dy*R, R*k*0.62, 0, Math.PI*2); ctx.fill(); });
    });
    /* drooping fronds: vertical strands hanging from the dome edge, swaying at the tips */
    ctx.lineCap='round';
    const fronds = SET.quality==='high' ? 9 : 6;
    for(let f=0; f<fronds; f++){
      const fx = s.x + (f/(fronds-1)-0.5)*R*1.5;
      const top = cy + R*0.3;
      const len = R*(0.7 + 0.5*Math.sin(f*1.7));
      const tipSway = sway*1.6 + Math.sin(curNow/680 + f*0.9 + i)*R*0.12;
      ctx.strokeStyle = (f%2===0) ? 'rgba(75,170,110,.85)' : 'rgba(110,200,140,.8)';
      ctx.lineWidth = Math.max(0.8, R*0.07);
      ctx.beginPath();
      ctx.moveTo(fx, top);
      ctx.quadraticCurveTo(fx+tipSway*0.4, top+len*0.6, fx+tipSway, top+len);
      ctx.stroke();
    }
  } else if(t.kind==='cypress'){
    /* tall slender swamp cypress — a narrow dark-teal spire, plays like a pine but exotic */
    const base = s.y - trunkH;
    ['#1f5e44','#2c7a54','#3a9468'].forEach((col,j)=>{
      const w = t.r*sc*(0.62-j*0.13), hgt = t.r*sc*1.05;
      const yy = base - j*hgt*0.5;
      const tip = s.x+sway*(j+1)*0.5;
      ctx.fillStyle=col;
      ctx.beginPath();
      ctx.moveTo(tip, yy-hgt);
      ctx.lineTo(s.x-w, yy);
      ctx.lineTo(s.x+w, yy);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle='rgba(0,0,0,.16)';
      ctx.beginPath(); ctx.moveTo(tip, yy-hgt); ctx.lineTo(s.x+w, yy); ctx.lineTo(tip, yy);
      ctx.closePath(); ctx.fill();
    });
  } else if(t.kind==='pine'){
    const base = s.y - trunkH;
    ['#1d5e33','#27793f','#33914c'].forEach((col,j)=>{
      const w = t.r*sc*(1-j*0.22), hgt = t.r*sc*0.85;
      const yy = base - j*hgt*0.62;
      const tip = s.x+sway*(j+1)*0.4;
      ctx.fillStyle=col;
      ctx.beginPath();
      ctx.moveTo(tip, yy-hgt);
      ctx.lineTo(s.x-w, yy);
      ctx.lineTo(s.x+w, yy);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle='rgba(0,0,0,.18)';                /* shaded right face */
      ctx.beginPath();
      ctx.moveTo(tip, yy-hgt); ctx.lineTo(s.x+w, yy); ctx.lineTo(tip, yy);
      ctx.closePath(); ctx.fill();
    });
  } else if(t.kind==='maple'){
    /* maple: layered fiery canopy — deep red-orange shade up to bright golden-orange crown */
    const cy = s.y - trunkH - t.r*sc*0.55;
    const layers=[
      ['#9c3a16', [[0.15,0.34,0.92],[-0.4,0.4,0.72],[0.5,0.42,0.6]]],
      ['#c85a1c', [[0,0.05,1.02],[-0.58,0.18,0.76],[0.58,0.18,0.76],[0.1,-0.36,0.62]]],
      ['#e8801f', [[-0.2,-0.3,0.64],[0.32,-0.4,0.5],[-0.52,-0.05,0.42]]],
      ['#f6b32e', [[-0.3,-0.52,0.3],[0.14,-0.56,0.24]]]
    ];
    layers.forEach(([col,lobes])=>{
      ctx.fillStyle=col;
      lobes.forEach(([dx,dy,k])=>{
        ctx.beginPath();
        ctx.arc(s.x+dx*t.r*sc+sway*(1+dy*0.4), cy+dy*t.r*sc, t.r*sc*k*0.62, 0, Math.PI*2);
        ctx.fill();
      });
    });
    if(SET.quality==='high'){
      for(let q=0;q<2;q++){
        const ph=(curNow/760 + i*2.3 + q*2.1)%6.28;
        ctx.fillStyle='rgba(230,128,31,.6)';
        ctx.beginPath();
        ctx.ellipse(s.x+Math.sin(ph)*t.r*sc*0.8, cy+t.r*sc*(0.6+q*0.5)+ph*2.2*sc,
                    Math.max(0.8,2.2*sc), Math.max(0.5,1.4*sc), ph, 0, Math.PI*2);
        ctx.fill();
      }
    }
  } else if(THEME()==='oak'){
    const cy = s.y - trunkH - t.r*sc*0.55;
    const layers=[
      ['#274d2a', [[0.15,0.34,0.92],[-0.4,0.4,0.72],[0.5,0.42,0.6]]],
      ['#33682f', [[0,0.05,1.02],[-0.58,0.18,0.76],[0.58,0.18,0.76],[0.1,-0.36,0.62]]],
      ['#47853c', [[-0.2,-0.3,0.64],[0.32,-0.4,0.5],[-0.52,-0.05,0.42]]],
      ['#5fa04b', [[-0.3,-0.52,0.3],[0.14,-0.56,0.24]]]
    ];
    layers.forEach(([col,lobes])=>{
      ctx.fillStyle=col;
      lobes.forEach(([dx,dy,k])=>{
        ctx.beginPath();
        ctx.arc(s.x+dx*t.r*sc+sway*(1+dy*0.4), cy+dy*t.r*sc, t.r*sc*k*0.62, 0, Math.PI*2);
        ctx.fill();
      });
    });
  } else {
    /* sakura: layered blossom canopy — deep pink shade up to pale highlight */
    const cy = s.y - trunkH - t.r*sc*0.55;
    /* volumetric blossom: shadow mass underneath, mid tone, sunlit crown */
    const layers=[
      ['#b35a86', [[0.15,0.32,0.9],[-0.35,0.4,0.7],[0.5,0.42,0.6]]],          /* shaded underside */
      ['#d77ba6', [[0,0.05,1],[-0.55,0.2,0.74],[0.55,0.2,0.74],[0.1,-0.35,0.6]]], /* body        */
      ['#eea2c4', [[-0.2,-0.3,0.62],[0.3,-0.38,0.5],[-0.5,-0.05,0.42]]],      /* lit upper lobes  */
      ['#f9cfe1', [[-0.3,-0.5,0.3],[0.12,-0.55,0.24]]]                        /* sun kiss         */
    ];
    layers.forEach(([col,lobes])=>{
      ctx.fillStyle=col;
      lobes.forEach(([dx,dy,k])=>{
        ctx.beginPath();
        ctx.arc(s.x+dx*t.r*sc+sway*(1+dy*0.4), cy+dy*t.r*sc, t.r*sc*k*0.62, 0, Math.PI*2);
        ctx.fill();
      });
    });
    /* a few petals drifting beneath the canopy */
    if(SET.quality==='high' && THEME()==='sakura'){
      for(let q=0;q<2;q++){
        const ph=(curNow/700 + i*2.3 + q*2.1)%6.28;
        ctx.fillStyle='rgba(255,180,210,.55)';
        ctx.beginPath();
        ctx.ellipse(s.x+Math.sin(ph)* t.r*sc*0.8, cy+t.r*sc*(0.6+q*0.5)+ph*2.4*sc,
                    Math.max(0.8,2.2*sc), Math.max(0.5,1.4*sc), ph, 0, Math.PI*2);
        ctx.fill();
      }
    }
  }
  if(alpha!==undefined && alpha<0.999) ctx.restore();
}
function drawTuft(tf, s){
  const sc = cam.foc/s.z;
  const sway = Math.sin(curNow/700 + tf.ph)*1.6*sc;
  const h = 7*tf.s*sc;
  ctx.strokeStyle='rgba(34,110,45,.8)'; ctx.lineWidth=Math.max(1,1.4*sc); ctx.lineCap='round';
  ctx.beginPath();
  ctx.moveTo(s.x-2*sc, s.y); ctx.quadraticCurveTo(s.x-2*sc+sway*0.5, s.y-h*0.6, s.x-2.6*sc+sway, s.y-h);
  ctx.moveTo(s.x, s.y);      ctx.quadraticCurveTo(s.x+sway*0.5, s.y-h*0.7, s.x+sway, s.y-h*1.15);
  ctx.moveTo(s.x+2*sc, s.y); ctx.quadraticCurveTo(s.x+2*sc+sway*0.5, s.y-h*0.6, s.x+2.6*sc+sway, s.y-h);
  ctx.stroke();
}
function drawFlag(s, pz){
  const top = proj(PIN.x,PIN.y,FLAG_H+(pz||0));
  if(!top) return;
  ctx.strokeStyle='rgba(20,40,26,.3)'; ctx.lineWidth=Math.max(2.2, cam.foc*2.2/s.z);
  ctx.beginPath(); ctx.moveTo(s.x+2,s.y+1); ctx.lineTo(top.x+2,top.y+1); ctx.stroke();
  ctx.strokeStyle='#f4f4f4'; ctx.lineWidth=Math.max(1.5, cam.foc*1.6/s.z); ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(s.x,s.y); ctx.lineTo(top.x,top.y); ctx.stroke();
  ctx.fillStyle='#ffd84d';
  ctx.beginPath(); ctx.arc(top.x, top.y, Math.max(1.2, cam.foc*1.7/s.z), 0, Math.PI*2); ctx.fill();
  const fl = Math.max(8, cam.foc*16/s.z);
  const wob = curNow/((330 - wind.mph*9) / (celebT>0 ? 2.6 : 1));
  const wave  = Math.sin(wob)*fl*(0.08 + wind.mph*0.012)*(celebT>0 ? 1.9 : 1);
  const wave2 = Math.sin(wob*1.7+1.3)*fl*(0.05 + wind.mph*0.008);
  ctx.fillStyle='#ff5a4e';
  ctx.beginPath();
  ctx.moveTo(top.x, top.y);
  ctx.quadraticCurveTo(top.x+fl*0.5, top.y+fl*0.06+wave*0.5, top.x+fl, top.y+fl*0.2+wave);
  ctx.quadraticCurveTo(top.x+fl*0.55, top.y+fl*0.34+wave2, top.x, top.y+fl*0.5);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle='rgba(0,0,0,.12)';
  ctx.beginPath();
  ctx.moveTo(top.x+fl*0.45, top.y+fl*0.1+wave*0.5);
  ctx.quadraticCurveTo(top.x+fl*0.7, top.y+fl*0.18+wave*0.8, top.x+fl, top.y+fl*0.2+wave);
  ctx.quadraticCurveTo(top.x+fl*0.7, top.y+fl*0.26+wave2, top.x+fl*0.45, top.y+fl*0.28);
  ctx.closePath(); ctx.fill();
}
const mm = document.getElementById('minimap').getContext('2d');
function drawMinimap(){
  const sc = 150/960;
  mm.clearRect(0,0,150,96);
  mm.fillStyle='#3f9a3f'; mm.fillRect(0,0,150,96);
  mm.strokeStyle='#62c25c'; mm.lineWidth=FAIRWAY_W*2*sc; mm.lineCap='round'; mm.lineJoin='round';
  mm.beginPath(); mm.moveTo(SPINE[0].x*sc,SPINE[0].y*sc);
  for(let i=1;i<SPINE.length;i++) mm.lineTo(SPINE[i].x*sc,SPINE[i].y*sc);
  mm.stroke();
  WATERS.forEach(w=>{
    mm.save(); mm.translate(w.x*sc,w.y*sc); mm.rotate(w.rot);
    mm.fillStyle='#3aa7e0'; mm.beginPath(); mm.ellipse(0,0,w.rx*sc,w.ry*sc,0,0,Math.PI*2); mm.fill(); mm.restore();
  });
  mm.fillStyle='#8ee07f';
  mm.beginPath();
  POLY.green.forEach((p,i)=> i? mm.lineTo(p.x*sc,p.y*sc) : mm.moveTo(p.x*sc,p.y*sc));
  mm.closePath(); mm.fill();
  BUNKERS.forEach(b=>{
    mm.save(); mm.translate(b.x*sc,b.y*sc); mm.rotate(b.rot);
    mm.fillStyle='#f3dfa2'; mm.beginPath(); mm.ellipse(0,0,b.rx*sc,b.ry*sc,0,0,Math.PI*2); mm.fill(); mm.restore();
  });
  mm.fillStyle='#ff5a4e'; mm.beginPath(); mm.arc(PIN.x*sc,PIN.y*sc,2.6,0,Math.PI*2); mm.fill();
  mm.fillStyle='rgba(255,255,255,.25)';
  mm.beginPath(); mm.moveTo(ball.x*sc,ball.y*sc);
  mm.lineTo(ball.x*sc+Math.cos(cam.yaw-0.42)*34, ball.y*sc+Math.sin(cam.yaw-0.42)*34);
  mm.lineTo(ball.x*sc+Math.cos(cam.yaw+0.42)*34, ball.y*sc+Math.sin(cam.yaw+0.42)*34);
  mm.closePath(); mm.fill();
  mm.fillStyle='#fff'; mm.strokeStyle='#1d3a22'; mm.lineWidth=1;
  mm.beginPath(); mm.arc(ball.x*sc,ball.y*sc,3,0,Math.PI*2); mm.fill(); mm.stroke();
}
</script>
<script>
"use strict";
/* ============================ PARTICLES ============================ */
function burst(x,y,z,color,n,spd,life,up=0){
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2, s=spd*(0.3+Math.random()*0.7);
    particles.push({x,y,z:z+2,vx:Math.cos(a)*s,vy:Math.sin(a)*s,vz:up*(0.4+Math.random()*0.8),
      life:life*(0.5+Math.random()*0.5),max:life,color,size:2.4+Math.random()*2.6});
  }
}
function confetti(x,y){
  const cols=['#ffd84d','#ff5a4e','#54bdf0','#8ee07f','#ffffff','#c792ff'];
  for(let i=0;i<70;i++){
    const a=Math.random()*Math.PI*2, s=40+Math.random()*90;
    particles.push({x,y,z:4,vx:Math.cos(a)*s,vy:Math.sin(a)*s,vz:160+Math.random()*200,
      life:1+Math.random()*0.8,max:1.8,color:cols[i%cols.length],size:3+Math.random()*3});
  }
}

/* ============================ SHOT FLOW (4-press) ============================ */
/* ============================ DRAG-AND-RELEASE SWING ============================ */
const PULL_MAX_PX = 170;       /* full pull-back distance on screen */
const SHAPE_PULL_PX = 90;      /* lateral pull for full fade/draw   */
let pullStart = null;          /* pointer-down screen position       */
let pullPower = 0;             /* 0..100 from drag distance          */
let pullShape = 0;             /* -1.3..1.3 from lateral drag (|>1| = hook/slice) */

/* sweet spot: 75% pull gives ~85% of distance; the last 25% of pull
   buys the final 15% of distance at the cost of a faster needle */
function powerCurve(p){
  return p<=75 ? (p/75)*85 : 85 + (p-75)*0.6;
}
function needleSpeedNow(){
  if(clubIdx===3){
    /* pace pendulum: bigger putts sweep faster — smaller timing window
       (+15% overall: more tension, still the slowest, smoothest needle) */
    return CLUBS[3].accSpeed * (0.92 + pullPower/100*1.61);
  }
  const lie = surfaceAt(ball.x,ball.y);
  const base = CLUBS[clubIdx].accSpeed * lieMods(lie,clubIdx).meter;
  const over = Math.max(0, (pullPower-75)/25);     /* 0 at ≤75%, 1 at 100% */
  return base * (1 + over*0.8);
}
function beginPull(px,py){
  if(MP && MP.online && MP._inputLocked) return;   // not your turn in an online match
  if(greenCam && greenCam.on) return;              // reading the green — exit read mode first
  pullStart = {x:px, y:py};
  pullPower = 0; pullShape = 0;
  accT = 0; accVal = 0;
  state = ST.PULL;
  pullSndStart();
  document.getElementById('meters').style.display='block';
  document.getElementById('powerTrack').style.display='block';
  document.getElementById('powerTrack').classList.remove('locked');
  document.getElementById('accArcWrap').style.display = 'block';
  document.getElementById('sweetTick').style.display = clubIdx===3 ? 'none' : 'block';
  buildAccZones(clubIdx);
  document.getElementById('meterLabel').textContent = 'PULL BACK';
  setHint(clubIdx===3 ? 'Pull back · watch the read grow · release at the right pace'
                      : 'Pull back for power · sideways to shape · release!');
}
function updatePull(px,py){
  if(!pullStart) return;
  const k = 960/Math.max(320, wrapEl.getBoundingClientRect().width);
  const dy = (py - pullStart.y)*k;                   /* backward = down  */
  const dx = (px - pullStart.x)*k;                   /* right = fade     */
  pullPower = Math.max(0, Math.min(100, dy/PULL_MAX_PX*100));
  pullShape = clubIdx===3 ? 0 : Math.max(-1.3, Math.min(1.3, dx/SHAPE_PULL_PX));
  shape = Math.max(-1, Math.min(1, pullShape));      /* physics shape (slice/hook adds error, not more curve) */
  updateCtlUI();
  const fill=document.getElementById('powerFill');
  fill.style.width = pullPower+'%';
  const lbl=document.getElementById('meterLabel');
  if(Math.abs(pullShape)>1)
    lbl.textContent = (pullShape>0?'SLICE':'HOOK')+' RISK · '+Math.round(pullPower)+'%';
  else
    lbl.textContent = 'PULL · '+Math.round(pullPower)+'%' + (clubIdx!==3 && pullPower>75 ? ' ⚡' : '');
}
let paceGrade = null;
function gradePace(a){
  const e=Math.abs(a), sign=a>=0?1:-1;
  if(e<0.10) return {label:'PURE PACE!', err:0,    perfect:true};
  if(e<0.28) return {label:null,         err:0.04*sign};
  if(e<0.50) return {label:null,         err:0.08*sign};
  if(e<0.75) return {label:'HEAVY',      err:0.13*sign};
  return            {label:'MISHIT',     err:0.18*sign};
}
function releasePull(){
  if(state!==ST.PULL) return;
  pullStart = null;
  pullSndStop();                                      /* tension resolves the instant you let go */
  if(pullPower < 6){                                  /* too small: cancel the swing */
    state = ST.AIM;
    hideMeters();
    const keepClock = puttClock, keepPress = puttPressure;
    nextShotSetup();
    puttClock=keepClock; puttPressure=keepPress;       /* same shot continues to accrue nerves */
    return;
  }
  if(clubIdx===3){
    paceGrade = gradePace(accVal);
    /* pressure adds a touch of pace error that grows the longer you stalled */
    let perr = paceGrade.err;
    if(puttPressure>0.001){
      const drift = puttPressure * 0.06 * (accVal>=0?1:-1);   /* nudges, doesn't dominate */
      perr += drift;
    }
    pendingPower = pullPower * (1 + perr);            /* pace error, not line error */
    downswing(pullPower*0.35);                        /* gentle putting-stroke swish */
    resetPuttPressure();                              /* putt taken — clear the clock */
  } else {
    paceGrade = null;
    pendingPower = powerCurve(pullPower);
    downswing(pullPower);                             /* strong committed downswing */
    resetPuttPressure();                              /* shot taken — clear the nerves clock */
  }
  fireShot();
}
function buildAccZones(ci){
  /* ----- ARC pendulum meter ----- */
  /* arc geometry: a gentle dome across the 330x64 viewBox. t in [-1,1] maps along it. */
  const z=document.getElementById('accArcZones');
  if(!z) return;
  z.innerHTML='';
  const pw = ci===3 ? 0.10 : ci===0 ? 0.06 : 0.08;
  const gw = ci===3 ? 0.28 : ci===0 ? 0.20 : 0.25;
  /* draw each zone as a thick stroked arc segment from -half..+half (red full width
     first, then yellow, then green on top), so the center is the perfect window. */
  const bands=[[0.45,'#ff8a7a'],[gw,'#ffd84d'],[pw,'#7ed957']];
  bands.forEach(([half,color])=>{
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('class','arcBand');
    path.setAttribute('d', arcSegPath(-half, half));
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width','14');
    z.appendChild(path);
  });
  /* thin dark outline arc over the top edge + a center tick */
  const outline=document.createElementNS('http://www.w3.org/2000/svg','path');
  outline.setAttribute('class','arcBand arcOutline');
  outline.setAttribute('d', arcSegPath(-1, 1));
  outline.setAttribute('stroke-width','15.5');
  z.insertBefore(outline, z.firstChild);
  const c0=arcPoint(0), cTop={x:c0.x, y:c0.y-9.5}, cBot={x:c0.x, y:c0.y+9};
  const tick=document.createElementNS('http://www.w3.org/2000/svg','line');
  tick.setAttribute('class','arcTickC');
  tick.setAttribute('x1',cTop.x); tick.setAttribute('y1',cTop.y);
  tick.setAttribute('x2',cBot.x); tick.setAttribute('y2',cBot.y);
  z.appendChild(tick);
}
/* arc point: t in [-1,1] → {x,y} along a shallow dome across the 330-wide viewBox.
   Same horizontal span as before; the dome adds the pendulum feel. */
const ARC_W=330, ARC_PAD=14, ARC_BASE=46, ARC_RISE=30;
function arcPoint(t){
  const x = ARC_PAD + (t*0.5+0.5)*(ARC_W - ARC_PAD*2);
  const y = ARC_BASE - ARC_RISE*(1 - t*t);     /* peak at center, drops to the sides */
  return {x, y};
}
function arcSegPath(t0, t1){
  /* sample the dome between t0 and t1 into a smooth polyline path */
  const n=18; let d='';
  for(let i=0;i<=n;i++){
    const t=t0+(t1-t0)*(i/n); const p=arcPoint(t);
    d += (i?'L':'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ' ';
  }
  return d.trim();
}
function gradeAcc(a, ci){
  const e=Math.abs(a);
  const pw = ci===0 ? 0.06 : 0.08;       /* driver: tighter perfect window */
  const gw = ci===0 ? 0.20 : 0.25;
  if(e<pw) return {label:'PERFECT!', color:'#7ed957', flash:'#7ed957', mult:ci===0?1.08:1.05, errScale:0, perfect:true};
  if(e<gw) return {label:'GOOD!',    color:'#ffe082', flash:'#ffe082', mult:1.0,  errScale:0.25, good:true};
  if(e<0.45) return {label:'AVERAGE',  color:'#ffd84d', flash:null,      mult:0.97, errScale:0.55};
  if(e<0.72) return {label:'POOR',     color:'#ff8a7a', flash:'#ff8a7a', mult:0.9,  errScale:1.1,  bad:true};
  return            {label:'MISS!',    color:'#ff8a7a', flash:'#ff8a7a', mult:0.8,  errScale:1.8,  bad:true};
}
function wrapA(d){ while(d>Math.PI)d-=Math.PI*2; while(d<-Math.PI)d+=Math.PI*2; return d; }
function fireShot(){
  const club = CLUBS[clubIdx];
  const lie = surfaceAt(ball.x,ball.y);
  const mods = lieMods(lie, clubIdx);
  /* challenge bookkeeping: remember if this shot was from sand, and the putt length in ft */
  ball._fromSand = (lie==='sand');
  ball._puttDist = (clubIdx===3) ? dist(ball.x,ball.y,PIN.x,PIN.y) * YD_PER_PX * 3 : 0;  /* px→yd→ft */
  /* putter: no needle — release IS the stroke; line + pace are the whole skill */
  let grade;
  if(clubIdx===3){
    grade = {label:'STROKE', color:'#aef0d0', flash:null, mult:1.0, errScale:0, putt:true};
    if(paceGrade && paceGrade.perfect){
      grade = {...grade, label:'PURE PACE!', color:'#7ed957', flash:'#7ed957', putt:false, pure:true};
    } else if(paceGrade && paceGrade.label){
      grade = {...grade, label:paceGrade.label, color:'#ffab5e', putt:false};
    }
  } else {
    grade = gradeAcc(accVal, clubIdx);
    if(clubIdx===0 && grade.errScale>0.5) grade = {...grade, errScale:grade.errScale*1.25};
    /* pulling far off-center risks a slice/hook: harder to control */
    const overPull = Math.max(0, Math.abs(pullShape)-1);
    if(overPull>0) grade = {...grade, errScale: grade.errScale + 0.35 + overPull*1.2, perfect:false};
  }
  const sign = accVal>=0 ? 1 : -1;
  /* shaped shots start opposite the curve (fade starts left, draws back right) */
  const startLine = aimAngle - shape*club.shapeF*0.07;
  let angle;
  if(clubIdx===3){
    /* putter: the needle zones map directly to directional error —
       green = dead straight, yellow = slight curve toward the needle side,
       red = clear push/pull, outer red = a mini slice/hook off the blade.
       Zone edges match the meter exactly (0.10 / 0.28 / 0.75). */
    const e = Math.abs(accVal);
    let deg;
    if(e < 0.10)      deg = 0;                                   /* green: pure   */
    else if(e < 0.28) deg = 1.2 + (e-0.10)/0.18*1.8;             /* yellow: 1.2–3° */
    else if(e < 0.75) deg = 3.0 + (e-0.28)/0.47*5.0;             /* red: 3–8°      */
    else              deg = 8.0 + Math.min(1,(e-0.75)/0.25)*6.0; /* outer red: 8–14° */
    /* mild distance scaling with a floor: the meter matters on EVERY putt */
    const d = dist(ball.x,ball.y,PIN.x,PIN.y);
    const distMult = 0.55 + 0.45*Math.min(1, d/150);
    angle = aimAngle + Math.sign(accVal)*deg*(Math.PI/180)*distMult;
  } else {
    angle = startLine + sign*grade.errScale*club.maxErr*mods.err*(0.7+Math.random()*0.3);
    if(grade.perfect){
      const toPin = Math.atan2(PIN.y-ball.y, PIN.x-ball.x);
      const delta = wrapA(toPin - aimAngle);
      angle = startLine + Math.max(-0.052, Math.min(0.052, delta*0.3));
    }
  }
  const L = launchParams(pendingPower*grade.mult, angle, clubIdx, lie, spin);

  lastSafe = {x:ball.x, y:ball.y};
  ball.vx=L.vx; ball.vy=L.vy; ball.vz=L.vz; ball.air=L.air;
  /* MULTIPLAYER: record this shot's exact launch so it can be broadcast and replayed on
     other clients as a real animated flight (spectating), with the resting spot sent as an
     authoritative correction. Captured post-grade so it's the actual resolved shot. */
  if(MP && MP.online && MP.players[MP.turn] && (MP.mySeats ? MP.mySeats.has(MP.players[MP.turn].seat) : MP.players[MP.turn].seat===MP.mySeat)){
    MP._pendingShot = {
      from:{ x:lastSafe.x, y:lastSafe.y },
      vx:L.vx, vy:L.vy, vz:L.vz, air:L.air,
      spin: ball.spin, shape: ball.shape, club: clubIdx
    };
  }
  ball.windF = club.windF;
  /* sign-dependent spin authority: backspin uses backF, topspin uses topF */
  ball.spin  = spin * (spin<0 ? (club.backF ?? club.spinF) : (club.topF ?? club.spinF));
  /* launch shape (PGA feel):
     BACKSPIN  → climbs higher AND lands shorter/steeper (a soft check shot), so it
                 does NOT fly farther — it trades forward carry for height + bite.
     TOPSPIN   → bores in flatter and runs out a bit longer. */
  if(L.air && clubIdx!==3 && Math.abs(ball.spin)>0.01){
    const sp = ball.spin;
    if(sp < 0){                          /* backspin */
      const b = -sp;                     /* 0..1 */
      ball.vz *= (1 + b*0.30);           /* noticeably higher launch          */
      ball.vx *= (1 - b*0.24);           /* but pull back the forward carry    */
      ball.vy *= (1 - b*0.24);
    } else {                             /* topspin */
      ball.vz *= (1 - sp*0.16);          /* flatter, more penetrating          */
      ball.vx *= (1 + sp*0.06);          /* slightly more forward              */
      ball.vy *= (1 + sp*0.06);
    }
  }
  ball.shape = shape*club.shapeF;
  ball.zipped = false;
  ball.spinRoll = 0;
  ball.bounceN = 0;
  ball.impactVz = null;
  ball.rimming = false;
  ball.grazed = false;
  ball.bit = false;
  ball.rot = 0;
  ball.hue = null;
  ball.moving = true;

  if(grade.perfect){
    streak++;
    if(streak>stats.bestStreak) stats.bestStreak=streak;
    ball.gold = streak>=2;
    if(streak>=2){ setTimeout(()=>{ showBanner('PERFECT x'+streak+' 🔥','#ffd84d'); SFX.streak(streak); }, 700); }
  } else if(clubIdx!==3){ streak=0; ball.gold=false; }

  strokes++;
  state = ST.MOVING;
  hideMeters();
  trail = [];
  prediction = null;
  shotRec = []; replayAvail = false;

  if(lie==='sand'){ SFX.sand(); burst(ball.x,ball.y,0,'#f3dfa2',16,80,0.5,120); }
  SFX.swing(clubIdx, pendingPower/100);
  /* contact quality: ding scales with the strike */
  SFX.contact(grade.perfect?'perfect' : (grade.good?'good' : (grade.bad?'bad':'avg')));
  if(clubIdx!==3){ const cf=(spin<0?(CLUBS[clubIdx].backF??CLUBS[clubIdx].spinF):(CLUBS[clubIdx].topF??CLUBS[clubIdx].spinF)); SFX.spinFx((spin||0)*cf); }
  if((spin||0) < -0.25) earnChallenge('firstBack');
  else if((spin||0) > 0.25) earnChallenge('firstTop');
  if(grade.perfect){
    camPunch = 46;                                    /* quick lens punch-in */
    burst(ball.x, ball.y, 2, '#fff6c8', 10, 90, 0.35, 110);   /* strike glow */
  } else if(grade.good){
    burst(ball.x, ball.y, 2, '#ffffff', 5, 60, 0.25, 80);
  }
  /* expressive shot shaping: trail tints with the curve */
  ball.hue = Math.abs(shape)>0.35 ? (shape>0 ? '#a8d4ff' : '#ffc491') : null;
  if(grade.perfect){
    setTimeout(()=>SFX.perfect(),60);
    if(club.loft>0) timeScale = 0.38;
    flash = {color:'#7ed957', a:0.22};
  } else if(grade.good){
    flash = {color:'#ffe082', a:0.14};
  } else if(grade.bad){
    shake = 6;
    flash = {color:'#ff8a7a', a:0.16};
  }

  if(!grade.putt) showBanner(grade.label, grade.color);
  if(strokes>=windShiftAt){
    wind = randomWind(); windShiftAt = strokes+3;
    setTimeout(()=>showBanner('WIND SHIFT','#9fd9f2'), 1300);
  }
  updateHUD();
}

/* ============================ LIVE PHYSICS ============================ */
/* the active hole the ball can drop into: PIN normally, or — on the range — whichever
   target green the ball is closest to, so every range green has a real, holeable cup. */
function activeHole(){
  if(rangeMode && CUR.rangeGreens){
    let best=PIN, bd=1e9;
    for(const g of CUR.rangeGreens){ const d=dist(ball.x,ball.y,g.x,g.y); if(d<bd){ bd=d; best=g; } }
    return best;
  }
  return PIN;
}
function physics(dt){
  if(!ball.moving) return;
  if(ball.air){
    airAccel(ball, CLUBS[clubIdx], dt);
    ball.x += ball.vx*dt; ball.y += ball.vy*dt; ball.z += ball.vz*dt;
    trail.push({x:ball.x,y:ball.y,z:ball.z,life:0.55,gold:ball.gold,hue:ball.hue});

    TREES.forEach(t=>{
      if(ball.z>TRUNK_H*0.6 && ball.z<TRUNK_H+CANOPY_H && dist(ball.x,ball.y,t.x,t.y)<t.r*0.8){
        ball.vx*=0.25; ball.vy*=0.25; ball.vz=Math.min(ball.vz,-30);
        SFX.rustle(); burst(ball.x,ball.y,ball.z,'#46b85f',10,60,0.4,40);
      }
    });
    /* eruption: a ball passing over the crater during the burst is struck down into the lava */
    if(VOLCANO){
      const ep=eruptPhase();
      if(ep.active && dist(ball.x,ball.y,VOLCANO.x,VOLCANO.y) < VOLCANO.r*1.05){
        SFX.splash();
        burst(ball.x,ball.y,ball.z,'#ff7a1a',26,150,0.8,200);
        showBanner('CAUGHT IN THE ERUPTION! +1','#ff7a1a');
        ball.air=false; ball.moving=false;
        waterReset();   /* same penalty handling: +1, back to last safe spot */
        return;
      }
    }

    /* visible rotation: backspin spins backward in flight, topspin forward.
       Scaled up so the dimples make the spin obvious from the camera. */
    {
      const airSpd = Math.hypot(ball.vx, ball.vy, ball.vz);
      const baseRoll = 6 + airSpd*0.012;               /* faster ball = visibly faster roll */
      ball.rot = (ball.rot||0) + dt*( baseRoll - (ball.spin||0)*30 );
    }
    if(ball.z<=0){
      ball.z=0;
      if(ball.impactVz==null) ball.impactVz=ball.vz;
      const sf = surfaceAt(ball.x,ball.y);
      /* ===== DUNK: a shot that drops straight out of the air into the cup ===== */
      const HOLEPOS = activeHole();
      const dHole = dist(ball.x, ball.y, HOLEPOS.x, HOLEPOS.y);
      if(dHole < HOLE_R*0.72){
        const horiz = Math.hypot(ball.vx, ball.vy);
        const drop  = Math.abs(ball.vz);
        /* needs to be DROPPING into the cup: the descent must be steep relative to how
           fast it's skidding sideways (a steep high ball, not a low screamer), and it
           can't be carrying too much pace across the hole. A backspin wedge is ideal. */
        const steepEnough = drop > horiz*1.15;
        if(drop > 120 && steepEnough && horiz < 210){
          dunkFlag = true;                  /* tell holed() to celebrate a DUNK */
          holed(); return;
        }
      }
      if(sf==='water'){ waterReset(); return; }
      if(sf==='sand'){
        ball.air=false; ball.vz=0; ball.vx*=0.2; ball.vy*=0.2;
        SFX.sand(); burst(ball.x,ball.y,0,'#f3dfa2',16,90,0.5,130);
      } else if(ball.vz<-90){
        ball.vz=-ball.vz*0.38;
        contactSpin(ball, sf, false);
        ball.vx*=0.78; ball.vy*=0.78;
        ball.rot = (ball.rot||0) + ((ball.spin||0)<0 ? -1.4 : 1.0);   /* visual snap on the bounce */
        SFX.bounce(Math.abs(ball.impactVz||120));
        burst(ball.x,ball.y,0,sf==='rough'?'#2f8f46':'#a4ec90',5,50,0.3,60);
      } else {
        ball.air=false; ball.vz=0; ball.vx*=0.85; ball.vy*=0.85;
        contactSpin(ball, sf, true);
        if(ball.zipped){ showBanner('ZIP BACK!','#aef07a'); ball.zipped=false; }
      }
    }
  } else {
    if(ball.rimming){
      /* riding the rim: decaying speed circles the cup until it either
         rattles in or runs out of allotted wrap and gets thrown off */
      const RH = activeHole();
      ball.rimSpd *= Math.max(0, 1 - 1.7*dt);
      const dAng = (ball.rimSpd/(HOLE_R+1)) * dt;
      ball.rimAng += ball.rimSide * dAng;
      ball.rimWrap += dAng;
      ball.x = RH.x + Math.cos(ball.rimAng)*(HOLE_R+1);
      ball.y = RH.y + Math.sin(ball.rimAng)*(HOLE_R+1);
      trail.push({x:ball.x,y:ball.y,z:0,life:0.4,gold:ball.gold});
      /* rattle tick each part-wrap so you HEAR it knocking around the lip */
      ball._rimTickAt = (ball._rimTickAt||0) + dAng;
      if(ball._rimTickAt > 0.7){ ball._rimTickAt = 0; SFX.rimRattle(ball.rimSpd); }
      if(ball.rimSpd < 70){
        ball.rimming=false;
        showBanner('RATTLED IN!','#aef0d0');
        holed(); return;
      }
      if(ball.rimWrap >= ball.rimMax){
        ball.rimming=false;
        const tx=-Math.sin(ball.rimAng)*ball.rimSide, ty=Math.cos(ball.rimAng)*ball.rimSide;
        const nx=Math.cos(ball.rimAng), ny=Math.sin(ball.rimAng);
        const v = ball.rimSpd*0.75;
        ball.vx=(tx*0.8+nx*0.6)*v; ball.vy=(ty*0.8+ny*0.6)*v;
        showBanner('LIP OUT!','#ff8a7a'); SFX.lipSting(); shake=5;
      } else {
        if(shotRec.length<700) shotRec.push({x:ball.x,y:ball.y,z:0});
        return;
      }
    }
    const sf = surfaceAt(ball.x,ball.y);
    const speed = Math.hypot(ball.vx,ball.vy);
    applySlopeAndRim(ball, sf, speed, dt);
    const sp2 = Math.hypot(ball.vx,ball.vy);
    let decel = FRICTION[sf] ?? FRICTION.rough;
    if(CUR.fastFw && sf==='fairway') decel *= 0.62;     /* lush-but-firm fast fairway: ball runs out */
    if((ball.spin||0)>0.3 && !ball.zipped) decel *= (1 - 0.28*ball.spin);   /* topspin keeps running */
    /* sustained spin crawl on the green: backspin keeps pulling back, topspin keeps
       chasing forward, for a short moment after landing — then friction wins. */
    if(sf==='green' && ball.spinRoll && Math.abs(ball.spinRoll)>0.02){
      const dirx=Math.cos(aimAngle), diry=Math.sin(aimAngle);
      const crawl = ball.spinRoll * 42 * dt;           /* +forward (top) / -back (back) */
      ball.vx += dirx*crawl; ball.vy += diry*crawl;
      ball.spinRoll *= (1 - dt*1.9);                   /* fades out smoothly */
    }
    /* turf interaction: soft rolling ticks scale with speed */
    ball._rollT = (ball._rollT||0) + dt;
    if(ball._rollT > 0.13 && sp2 > 50 && sf!=='green'){ ball._rollT = 0; SFX.rollTick(sp2); }
    /* rolling rotation: speed-true, boosted by topspin, signed by travel direction */
    {
      const fwd = (ball.vx*Math.cos(aimAngle)+ball.vy*Math.sin(aimAngle))>=0 ? 1 : -1;
      ball.rot = (ball.rot||0) + dt*fwd*(sp2*0.14)*(1 + Math.max(0,ball.spin||0)*0.9);  /* more visible roll */
    }
    if(sf==='green' && sp2<24) decel += (24-sp2)*(24-sp2)*0.62;   /* grass grip eases in smoothly */
    const ns = Math.max(0, sp2 - decel*dt);
    if(sp2>0){ ball.vx*=ns/sp2; ball.vy*=ns/sp2; }
    ball.x += ball.vx*dt;
    ball.y += ball.vy*dt;
    if(ns>40) trail.push({x:ball.x,y:ball.y,z:0,life:0.45,gold:ball.gold});

    if(sf==='water'){ waterReset(); return; }
    if(sf==='sand' && ns>120 && !ball.sanded){
      ball.sanded=true; SFX.sand(); burst(ball.x,ball.y,0,'#f3dfa2',12,80,0.5,100);
    } else if(sf!=='sand') ball.sanded=false;

    TREES.forEach(t=>{
      const d=dist(ball.x,ball.y,t.x,t.y);
      if(d < TRUNK_R+5 && d>0.001){
        const nx=(ball.x-t.x)/d, ny=(ball.y-t.y)/d;
        const dot=ball.vx*nx+ball.vy*ny;
        ball.vx=(ball.vx-2*dot*nx)*0.45;
        ball.vy=(ball.vy-2*dot*ny)*0.45;
        ball.x=t.x+nx*(TRUNK_R+5.5); ball.y=t.y+ny*(TRUNK_R+5.5);
        SFX.bounce();
      }
    });
    /* boulders block a rolling ball too — hard rock, lively bounce */
    if(DECOR) DECOR.forEach(d0=>{
      if(d0.kind!=='boulder') return;
      const br=(d0.r||11)*0.6, d=dist(ball.x,ball.y,d0.x,d0.y);
      if(d < br+4 && d>0.001){
        const nx=(ball.x-d0.x)/d, ny=(ball.y-d0.y)/d;
        const dot=ball.vx*nx+ball.vy*ny;
        ball.vx=(ball.vx-2*dot*nx)*0.55;
        ball.vy=(ball.vy-2*dot*ny)*0.55;
        ball.x=d0.x+nx*(br+4.5); ball.y=d0.y+ny*(br+4.5);
        SFX.bounce();
      }
    });
    const HOLEPOS = activeHole();
    const dHole = dist(ball.x,ball.y,HOLEPOS.x,HOLEPOS.y);
    const spd = Math.hypot(ball.vx,ball.vy);
    if(dHole < HOLE_R){
      /* how close to the cup's center line is the ball travelling? */
      let off=0, side=1;
      if(spd>0.01){
        const vx=ball.vx/spd, vy=ball.vy/spd;
        const cx=HOLEPOS.x-ball.x, cy=HOLEPOS.y-ball.y;
        const cross = cx*vy - cy*vx;
        off = Math.min(1, Math.abs(cross)/HOLE_R);   /* 0 = dead center, 1 = grazing edge */
        side = cross>=0 ? 1 : -1;
      }
      /* deterministic capture, golf-realistic: the window collapses fast
         with entry offset — center swallows pace, edges only take a dying
         ball. A near-center putt that is only slightly hot slams the back
         of the cup and still drops. No dice, ever. */
      const capSpd = 165*Math.pow(Math.max(0, 1 - 0.85*off), 1.15);
      if(spd <= capSpd){ holed(); return; }
      if(off < 0.2 && spd <= capSpd*1.3){              /* back-of-the-cup slam dunk */
        showBanner('OFF THE BACK!','#aef0d0');
        holed(); return;
      }
      if(spd > 215 && off < 0.35){
        /* way too hot on a good line: the ball hops right over the hole */
        ball.air=true; ball.z=0.1; ball.vz=70;
        ball.x=HOLEPOS.x+(ball.vx/spd)*(HOLE_R+1);
        ball.y=HOLEPOS.y+(ball.vy/spd)*(HOLE_R+1);
        showBanner('TOO HOT!','#ff8a7a');
        SFX.bounce();
      } else {
        /* the ball catches the rim and rides it — horseshoe, rattle-in,
           or pop-out all fall out of the same physics */
        ball.rimming = true;
        ball.rimAng  = Math.atan2(ball.y-HOLEPOS.y, ball.x-HOLEPOS.x);
        ball.rimSide = side;
        ball.rimSpd  = spd*0.9;
        ball.rimWrap = 0;
        /* wrap allowance shrinks for grazing entries: a fast edge-catch
           whips off quickly, a near-center hot putt rides longer */
        ball.rimMax  = Math.min(2.8, (0.25 + (spd-capSpd)/130) * (1 - 0.25*off));
        ball.x = HOLEPOS.x + Math.cos(ball.rimAng)*(HOLE_R+1);
        ball.y = HOLEPOS.y + Math.sin(ball.rimAng)*(HOLE_R+1);
        timeScale = 0.42;                              /* the world holds its breath */
        SFX.tension();
        SFX.bounce();
      }
    }
    else if(dHole < HOLE_R+3 && spd>0.01){
      /* edge clip: a sliver of overlap is NOT a make */
      if(spd < 60){ holed(); return; }               /* a dead ball at the lip topples in */
      if(!ball.grazed){
        ball.grazed = true;                          /* burned edge: deflects slightly away */
        const nx=(ball.x-HOLEPOS.x)/dHole, ny=(ball.y-HOLEPOS.y)/dHole;
        ball.vx += nx*spd*0.12; ball.vy += ny*spd*0.12;
        SFX.tick();
      }
    } else ball.grazed = false;
    if(spd < 6 && !ball.rimming){
      ball.vx=ball.vy=0; ball.moving=false;
      finishShot(false);
    }
  }
  /* record for replay */
  if(ball.moving || ball.air){
    if(shotRec.length<700) shotRec.push({x:ball.x,y:ball.y,z:ball.z});
  }
  const PAD=8;
  if(ball.x<PAD){ball.x=PAD; ball.vx=Math.abs(ball.vx)*0.5;}
  if(ball.x>960-PAD){ball.x=960-PAD; ball.vx=-Math.abs(ball.vx)*0.5;}
  if(ball.y<PAD){ball.y=PAD; ball.vy=Math.abs(ball.vy)*0.5;}
  if(ball.y>600-PAD){ball.y=600-PAD; ball.vy=-Math.abs(ball.vy)*0.5;}
}
function finishShot(wasHoled){
  state = ST.AIM;
  if(MP && MP.on){
    /* if this was a SPECTATED remote shot, snap to the authoritative landing the owner sent,
       then advance the turn (don't re-broadcast — we're not the owner). */
    if(MP.online && MP._remoteCorrect){
      const rc = MP._remoteCorrect; MP._remoteCorrect = null;
      const p = MP.players.find(pl=>pl.seat===rc.seat);
      if(p){
        ball.x = rc.rest.x; ball.y = rc.rest.y; ball.z=0; ball.vx=ball.vy=ball.vz=0; ball.air=false; ball.moving=false;
        p.ball = ball; p.strokes = rc.strokes; p.holed = !!rc.holed;
        if(rc.holed) p.holeStrokes = rc.strokes;
      }
      if(typeof mpRenderBoard==='function') mpRenderBoard();
      MP_advanceAfterRemote(rc.holed);
      updateHUD();
      return;
    }
    const dPin = dist(ball.x,ball.y,PIN.x,PIN.y);
    if(!wasHoled && dPin < 14){ showBanner('SO CLOSE!','#ffd84d'); SFX.tick(); }
    mpAfterShot(wasHoled);
    updateHUD();
    return;
  }
  if(rangeMode){
    /* driving range: report the carry, then reset to the mat for another ball */
    const carryYd = Math.round(dist(TEE.x,TEE.y,ball.x,ball.y)*YD_PER_PX);
    rangeShots++;
    /* landed on a real green? find which range green it's on */
    let bestT=null, bestD=1e9;
    if(CUR.rangeGreens) for(const t of CUR.rangeGreens){
      const dd=dist(ball.x,ball.y,t.x,t.y);
      if(dd<bestD){ bestD=dd; bestT=t; }
    }
    const onGreen = onGreenAt(ball.x,ball.y);
    if(onGreen && bestT){
      if(rangeBest===null || bestD<rangeBest) rangeBest=bestD;
      showBanner(bestT.yards+' YD GREEN! 🎯','#7ed957'); SFX.tick();
      burst(ball.x,ball.y,2,'#7ed957',26,90,0.8,160);
      addCoins(5, 'range');                               /* 5 coins for finding a green */
    } else {
      showBanner(carryYd+' yds','#ffd84d');
    }
    setRangeReadout(carryYd, onGreen && bestT ? bestT.yards : null);
    setTimeout(()=>resetToMat(), 900);
    return;
  }
  const dPin = dist(ball.x,ball.y,PIN.x,PIN.y);
  if(!wasHoled && dPin < 14){ showBanner('SO CLOSE!','#ffd84d'); SFX.tick(); }
  /* great shot? offer a replay */
  const near = dPin < 30;
  if(shotRec.length>20 && (wasHoled || near || streak>0)){
    replayAvail = true;
  }
  nextShotSetup();
}
/* ===== driving range UI ===== */
function setRangeClub(ci){
  /* only allow swapping clubs when standing over the ball (not mid-swing or mid-flight),
     otherwise the meters/prediction can glitch */
  if(typeof state!=='undefined' && state!==ST.AIM) return;
  clubIdx = ci; manualClub = true;
  /* fresh setup for the new club: clear any spin/shape dialed in for the previous club, so
     switching clubs doesn't carry hidden spin (e.g. backspin set on the wedge bleeding onto
     the driver) or leave the prediction line jumping. */
  spin = 0; shape = 0; pullShape = 0;
  document.getElementById('clubName').textContent = CLUBS[clubIdx].name;
  document.getElementById('spinChip').style.display = CLUBS[clubIdx].spinF>0.5 ? 'flex' : 'none';
  updateCtlUI();
  /* refresh selected highlight */
  document.querySelectorAll('#rangeClubs .rcBtn').forEach(b=>b.classList.toggle('sel', +b.dataset.ci===ci));
  refreshPrediction();
}
function buildRangeClubs(){
  const wrap = document.getElementById('rangeClubs'); if(!wrap) return;
  /* offer the full bag except the putter (index 3) — no putting on the range */
  const order = [0,1,2,4];                  /* driver, iron, wedge, 60° wedge */
  const labels = {0:'DRIVER',1:'IRON',2:'WEDGE',4:'60° WEDGE'};
  wrap.innerHTML = order.map(ci=>{
    const yd = Math.round(CLUBS[ci].maxDist*YD_PER_PX*(ci===2?1.5:1));   /* approx full-power carry */
    return `<button class="rcBtn" data-ci="${ci}">${labels[ci]}<small>~${yd}y</small></button>`;
  }).join('');
  wrap.querySelectorAll('.rcBtn').forEach(b=> b.onclick = ()=> setRangeClub(+b.dataset.ci));
}
function setRangeReadout(carryYd, targetYd){
  const el=document.getElementById('rrCarry'); if(!el) return;
  el.textContent = carryYd + 'y';
  el.style.color = targetYd!=null ? '#7ed957' : '#ffe27a';
}
function resetToMat(){
  ball.x=TEE.x; ball.y=TEE.y; ball.z=0;
  ball.vx=ball.vy=ball.vz=0; ball.air=false; ball.moving=false;
  ball.rimming=false; ball.grazed=false; ball.spin=0; ball.shape=0;
  trail=[];
  state = ST.AIM;
  spin=0; shape=0; pullShape=0;
  aimAngle = Math.atan2(PIN.y-TEE.y, PIN.x-TEE.x);
  resetPuttPressure();
  if(!manualClub) applyAutoClub();   /* keep the player's chosen club between range shots */
  hideMeters();
  refreshPrediction();
  updateHUD();
}
function waterReset(){
  /* MULTIPLAYER SPECTATING: if we're replaying a remote shot, don't run our own water
     penalty — snap to the shooter's authoritative resting spot instead. */
  if(MP && MP.online && MP._remoteCorrect){
    ball.moving=false; ball.air=false; ball.vx=ball.vy=ball.vz=0;
    state = ST.AIM;
    finishShot(!!MP._remoteCorrect.holed);
    return;
  }
  const lava = THEME()==='volcano';
  SFX.splash();
  if(lava){
    burst(ball.x,ball.y,0,'#ff7a1a',26,130,0.8,180);
    burst(ball.x,ball.y,0,'#ffd24a',14,90,0.5,130);
    burst(ball.x,ball.y,0,'#3a1208',16,70,0.6,90);     /* charred debris */
  } else {
    burst(ball.x,ball.y,0,'#54bdf0',24,120,0.7,170);
    burst(ball.x,ball.y,0,'#ffffff',12,80,0.5,120);
  }
  strokes++;
  streak=0; ball.gold=false;
  showBanner(lava ? 'IN THE LAVA! +1' : 'SPLASH! +1', lava ? '#ff7a1a' : '#54bdf0');
  ball.x=lastSafe.x; ball.y=lastSafe.y; ball.z=0;
  ball.vx=ball.vy=ball.vz=0; ball.air=false; ball.moving=false;
  ball.rimming=false; ball.grazed=false;
  state = ST.AIM;
  /* MULTIPLAYER (the shooter): a water penalty keeps the SAME player on the tee for another
     shot. Use the unified penalty path so the shooter stays unlocked AND opponents stay synced. */
  if(MP && MP.on){
    mpPenaltyContinue();
    return;
  }
  nextShotSetup();
}
/* Unified MP water/penalty handler: the active player keeps their turn (same player shoots
   again with +1). Re-broadcast so opponents update the ball but DON'T advance, re-arm input
   and clock for the controlling device, and set up the next shot. Robust against desync:
   we never advance the turn here, and the controlling device always regains control. */
function mpPenaltyContinue(){
  const p = MP.players[MP.turn];
  if(p){ p.ball = ball; p.strokes = strokes; p.holed = false; }
  if(typeof mpRenderBoard==='function') mpRenderBoard();
  const mine = MP.online
    ? (MP.mySeats ? MP.mySeats.has(p.seat) : (p.seat===MP.mySeat))
    : true;   // local hot-seat: this device controls everyone
  if(MP.online && mine && typeof MP_broadcastResolvedShot==='function'){
    MP._pendingShot = null;                          // no flight to replay; reset to lastSafe
    MP_broadcastResolvedShot(p.seat, ball, strokes, false, true);   // penalty=true → opponents don't advance
  }
  if(mine){
    MP._inputLocked = false;                         // the shooter can swing again immediately
    if(typeof mpArmClock==='function') mpArmClock();
  }
  nextShotSetup();
  updateHUD();
}
function nextShotSetup(){
  if(greenCam && greenCam.on) toggleGreenCam(false);   // exit green-reading on a fresh shot
  aimAngle = Math.atan2(PIN.y-ball.y, PIN.x-ball.x);
  spin = 0; shape = 0; pullShape = 0;
  resetPuttPressure();                 /* new shot → fresh pressure clock */
  applyAutoClub();
  const onG = onGreenAt(ball.x,ball.y);
  const inSand = surfaceAt(ball.x,ball.y)==='sand';
  setHint(
    (replayAvail ? 'P = replay · ' : '') +
    (inSand ? 'Splash out! ▲ backspin to check · ▼ topspin to roll out' :
     onG ? 'Pick a line ◀ ▶ · pull back to see the read' :
     'Aim ◀ ▶ · drag back to swing'));
  refreshPrediction();
  updateHUD();
}
let DECOR = [];
function mulberry(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function genDecor(hi){
  DECOR = [];
  const rnd = mulberry(hi*7919+13);
  /* explicit per-hole fairway boulders (Maple Falls): dark grey rocks sitting in play */
  if(CUR.boulders) for(const b of CUR.boulders){
    DECOR.push({kind:'boulder', x:b.x, y:b.y, r:b.r||11, seed:Math.floor((b.x*7+b.y*13))%9999, tone:0.34+((b.x%5)/5)*0.12});
  }
  const clearOf = (x,y,d)=> surfaceAt(x,y)==='rough' && dist(x,y,PIN.x,PIN.y)>d && dist(x,y,TEE.x,TEE.y)>50;
  /* rocks */
  for(let k=0;k<4;k++){
    const x=60+rnd()*840, y=60+rnd()*480;
    if(clearOf(x,y,80)) DECOR.push({kind:'rock', x, y, r:3.5+rnd()*4, tone:rnd()});
  }
  /* bushes */
  for(let k=0;k<6;k++){
    const x=50+rnd()*860, y=50+rnd()*500;
    if(clearOf(x,y,70)) DECOR.push({kind:'bush', x, y, r:6+rnd()*6, ph:rnd()*6});
  }
  /* flower clusters near trees */
  TREES.forEach((t,ti)=>{
    if(rnd()<0.6){
      const a=rnd()*Math.PI*2, d=t.r+8+rnd()*14;
      const x=t.x+Math.cos(a)*d, y=t.y+Math.sin(a)*d;
      if(surfaceAt(x,y)==='rough') DECOR.push({kind:'flowers', x, y, n:4+Math.floor(rnd()*4), seed:ti*31+hi});
    }
  });
  /* waterside reeds: spread out, clumpy, kept away from the fairway. Pond reeds run on any
     map that has ponds (Sakura too); creek-bank reeds are Oak Ridge only. */
  if(THEME()==='oak' || WATERS.some(w=>w.pond)){
    const dropReed = (x,y)=>{
      const sf=surfaceAt(x,y);
      if(sf==='water'||sf==='fairway'||sf==='green'||sf==='tee') return;   /* banks/rough only */
      if(distToSpine(x,y) < FAIRWAY_W + 26 && rnd()<0.85) return;  /* mostly off the fairway, a rare few through */
      DECOR.push({kind:'reed', x, y, ph:rnd()*6, n:2+Math.floor(rnd()*2)});
    };
    /* along the whole creek centerline (Oak only), in occasional clumps, varied offsets */
    if(THEME()==='oak') for(const ck of CREEKS){
      const line = ck.mid || [];
      for(let i=2;i<line.length-2;i+=2){
        if(rnd()<0.5) continue;                          /* gaps → spread out, not continuous */
        const a=line[i-1], b=line[i+1];
        let nx=-(b.y-a.y), ny=(b.x-a.x); const nl=Math.hypot(nx,ny)||1; nx/=nl; ny/=nl;
        const clump=1+Math.floor(rnd()*3);               /* a little clump of reeds */
        for(let c=0;c<clump;c++){
          const side=rnd()<0.5?1:-1, off=14+rnd()*22;    /* varied distance from the water */
          const jx=(rnd()-0.5)*14, jy=(rnd()-0.5)*14;
          dropReed(line[i].x+nx*side*off+jx, line[i].y+ny*side*off+jy);
        }
      }
    }
    /* around ponds (any map): scattered clumps at varied distances, not a tight ring */
    WATERS.forEach((w)=>{
      if(!w.pond && THEME()!=='oak') return;             /* Sakura: ponds only */
      const nClumps = w.pond ? 6+Math.floor(rnd()*5) : 5+Math.floor(rnd()*4);
      for(let k=0;k<nClumps;k++){
        const a=rnd()*Math.PI*2, rr=1.06+rnd()*0.4;      /* spread out from the shore */
        dropReed(w.x+Math.cos(a)*w.rx*rr, w.y+Math.sin(a)*w.ry*rr);
      }
    });
  }
  /* boulders: creek-source + creek-bank clusters are Oak only; pond-shore clusters run on
     any map that has ponds (Sakura too). */
  if(THEME()==='oak' || WATERS.some(w=>w.pond)){
    /* jagged boulders right at the VERY START of each creek (Oak only) */
    if(THEME()==='oak') for(const h of CREEK_HILLS){
      const n = 5+Math.floor(rnd()*3);                 /* 5-7 boulders */
      let placed=0, tries=0;
      while(placed<n && tries<26){
        tries++;
        /* cluster tightly right on the creek start */
        const a=rnd()*Math.PI*2, d=3+rnd()*18;
        const x=h.x+Math.cos(a)*d, y=h.y+Math.sin(a)*d;
        if(surfaceAt(x,y)==='water') continue;           /* keep big boulders on the banks */
        const r=8+rnd()*15;                              /* range of sizes */
        DECOR.push({kind:'boulder', x, y, r, seed:Math.floor(rnd()*9999), tone:0.42+rnd()*0.5});
        placed++;
      }
    }
    /* helper: a small cluster of 1-3 small boulders at a bank point (here and there) */
    const boulderCluster = (px, py)=>{
      const n = 1+Math.floor(rnd()*3);                 /* 1-3 */
      let placed=0, tries=0;
      while(placed<n && tries<10){
        tries++;
        const a=rnd()*Math.PI*2, d=2+rnd()*9;
        const x=px+Math.cos(a)*d, y=py+Math.sin(a)*d;
        if(surfaceAt(x,y)==='water') continue;
        const r=3+rnd()*6;                               /* small, varied */
        DECOR.push({kind:'boulder', x, y, r, seed:Math.floor(rnd()*9999), tone:0.42+rnd()*0.5});
        placed++;
      }
    };
    /* VERY RARE clusters along the creek banks (Oak only) */
    if(THEME()==='oak') for(const ck of CREEKS){
      const line = ck.mid || [];
      for(let i=4;i<line.length-4;i+=4){
        if(rnd()<0.94) continue;                          /* very rare */
        const a=line[i-1], b=line[i+1];
        let nx=-(b.y-a.y), ny=(b.x-a.x); const nl=Math.hypot(nx,ny)||1; nx/=nl; ny/=nl;
        const side = rnd()<0.5?1:-1, off=16+rnd()*8;
        boulderCluster(line[i].x+nx*side*off, line[i].y+ny*side*off);
      }
    }
    /* VERY RARE cluster at a pond shore (any map) */
    WATERS.forEach((w)=>{
      if(!w.pond || rnd()<0.8) return;                   /* rarely */
      const a=rnd()*Math.PI*2, rr=1.08+rnd()*0.12;
      boulderCluster(w.x+Math.cos(a)*w.rx*rr, w.y+Math.sin(a)*w.ry*rr);
    });
  }
  /* a goose or two loitering near the green */
  const gN = rnd()<0.55 ? 1 : 2;
  for(let k=0;k<gN;k++){
    const a=rnd()*Math.PI*2, d=55+rnd()*45;
    const x=PIN.x+Math.cos(a)*d, y=PIN.y+Math.sin(a)*d;
    const sf=surfaceAt(x,y);
    if(sf==='rough'||sf==='fairway') DECOR.push({kind:'goose', x, y, ph:rnd()*6, face:rnd()<0.5?1:-1});
  }
}
function startHole(i, skipFly){
  holeIdx = i;
  if(greenCam){ greenCam.on = false; const dr=$m('greenReadHud'); if(dr) dr.style.display='none'; const gb=$m('greenCamBtn'); if(gb){ gb.classList.remove('on'); gb.style.display='none'; gb.textContent='🔍 READ GREEN'; } }
  loadHole(i);
  genDecor(i);
  resetPuttPressure();
  strokes = 0;
  ball = {x:TEE.x, y:TEE.y, z:0, vx:0, vy:0, vz:0, air:false, moving:false, sanded:false, gold:false, spin:0, shape:0, rimming:false, grazed:false};
  lastSafe = {x:TEE.x, y:TEE.y};
  trail = []; particles = [];
  wind = randomWind(); windShiftAt = 3;
  powerT = 0; accT = 0; pendingPower = 0; spin = 0; shape = 0;
  timeScale = 1; shake = 0; flash = null;
  shotRec = []; replayAvail = false;
  aimAngle = Math.atan2(PIN.y-TEE.y, PIN.x-TEE.x);
  manualClub = false;
  applyAutoClub();
  { const nb=document.getElementById('nextHoleBtn'); if(nb) nb.style.display = rangeMode ? 'none' : ''; }
  if(rangeMode){
    buildRangeClubs();
    setRangeClub(0);                 /* start with the driver */
    manualClub = true;
    document.getElementById('rangePanel').style.display = 'flex';
    const rc=document.getElementById('rrCarry'); if(rc) rc.textContent='—';
  } else {
    const rp=document.getElementById('rangePanel'); if(rp) rp.style.display='none';
  }
  hideMeters();
  document.getElementById('endCard').classList.remove('show');
  /* hole intro card */
  const hiEl=document.getElementById('holeIntro');
  document.getElementById('hiName').textContent = rangeMode ? 'THE RANGE' : (practiceMode ? 'WARM UP · '+CUR.name.toUpperCase() : 'HOLE '+(i+1)+' · '+CUR.name.toUpperCase());
  document.getElementById('hiPar').textContent = rangeMode ? 'Pick a club · hit the targets' : 'PAR '+CUR.par+'  ·  '+Math.round(dist(TEE.x,TEE.y,PIN.x,PIN.y)*YD_PER_PX)+' YDS';
  hiEl.classList.add('show');
  clearTimeout(hiEl._t);
  hiEl._t = setTimeout(()=>hiEl.classList.remove('show'), 2600);
  if(skipFly || rangeMode){
    state = ST.AIM;
    cam.yaw = aimAngle;
    cam.x = TEE.x - Math.cos(cam.yaw)*150;
    cam.y = TEE.y - Math.sin(cam.yaw)*150;
    setHint(rangeMode ? 'Pick a club below · aim ◀ ▶ · drag back to swing' : 'Aim ◀ ▶ · drag back to swing');
    refreshPrediction();
  } else {
    /* hole preview flyover */
    state = ST.FLY;
    flyT = 0;
    flyPath = smoothSpine(6);
    cam.x = PIN.x; cam.y = PIN.y+40; cam.h = 150; cam.pitch = 0.42; cam.foc = 420;
    cam.yaw = Math.atan2(PIN.y-(PIN.y+40), PIN.x-PIN.x) || aimAngle;
    prediction = null;
    setHint('Hole preview…');
  }
  /* SKIP HOLE: in the single-player campaign, if you've already birdied this hole on a
     previous visit (holeIdx < furthest birdied), let the player jump ahead instead of
     re-birdieing holes they've cleared. They can skip one at a time up to the farthest
     hole they still need to birdie. */
  { const sk=document.getElementById('skipHoleBtn');
    if(sk){
      const cleared = (stats.holesDone && stats.holesDone[courseIdx]) || 0;
      const canSkip = !rangeMode && !practiceMode && !(MP&&MP.on) && holeIdx < cleared && holeIdx < CH().length-1;
      sk.style.display = canSkip ? 'inline-flex' : 'none';
    } }
  updateHUD();
}
function endFlyover(){
  state = ST.AIM;
  cam.yaw = aimAngle;
  setHint(clubIdx<=2 ? 'Aim ◀ ▶ · drag back to swing' : 'Aim ◀ ▶ · drag back to swing');
  refreshPrediction();
}
function startReplay(){
  if(!replayAvail || shotRec.length<2) return;
  savedBall = ball;
  ball = {...shotRec[0], vx:0, vy:0, vz:0, air:false, moving:true, gold:savedBall.gold};
  replayT = 0;
  prediction = null;
  state = ST.REPLAY;
  trail = [];
  setHint('Replay…');
}
function endReplay(){
  ball = savedBall;
  ball.moving = false;
  state = ST.AIM;
  trail = [];
  nextShotSetup();
}
const SINK_DUR = 0.6;
let sinkT = 0;                       /* render-only: ball dropping below the rim */
function holed(){
  /* MULTIPLAYER SPECTATING: when we're replaying someone else's shot, our local physics must
     NOT decide the ball was holed — the shooter already told us the authoritative outcome.
     If they said it was NOT holed (just close), let the ball settle and snap to their rest. */
  if(MP && MP.online && MP._remoteCorrect && !MP._remoteCorrect.holed){
    ball.moving=false; ball.air=false; ball.vx=ball.vy=ball.vz=0;
    state = ST.AIM;
    finishShot(false);   // applies the authoritative resting spot
    return;
  }
  if(rangeMode){
    /* on the range there's no holing out — dropping it in a cup is a hole-in-one: 250 coins */
    dunkFlag = false;
    ball.moving=false; ball.air=false; ball.vx=ball.vy=ball.vz=0;
    state = ST.AIM;
    SFX.dropFancy(); confetti(ball.x, ball.y);
    const carryYd = Math.round(dist(TEE.x,TEE.y,ball.x,ball.y)*YD_PER_PX);
    rangeShots++;
    showBanner('HOLE IN ONE! 🎯','#7ed957');
    addCoins(250, 'ace');
    setRangeReadout(carryYd, carryYd);
    setTimeout(()=>resetToMat(), 1100);
    return;
  }
  sinkT = SINK_DUR;
  ball.moving=false; ball.air=false; ball.vx=ball.vy=ball.vz=0;
  ball.x=PIN.x; ball.y=PIN.y; ball.z=0;
  state = ST.HOLED;
  const diff0 = strokes - PAR;
  const isCeleb = dunkFlag || strokes===1 || diff0<=-2;   /* dunk / ace / eagle+ = celebration */
  if(isCeleb){ SFX.dropFancy(); } else { SFX.drop(); }     /* otherwise the true cup-drop plunk */
  confetti(PIN.x, PIN.y);
  const diff = strokes - PAR;
  const ace = strokes===1;
  const dunk = dunkFlag; dunkFlag = false;          /* consume the flag */
  /* track birdie-or-better per course for tour unlocking (single-player, real courses only) */
  if(!practiceMode && !rangeMode && !(MP&&MP.on) && diff<=-1){
    stats.tourBirdie = stats.tourBirdie || {};
    stats.tourBirdie[courseIdx] = true;
  }
  /* ===== multiplayer: celebrate the cup-drop, then hand off to the turn system ===== */
  if(MP && MP.on){
    showBanner((ace?'HOLE IN ONE! ':'') + MP.players[MP.turn].name + ' holed in ' + strokes + '!', MP.players[MP.turn].color);
    setTimeout(()=>{ trail=[]; finishShot(true); }, 700);
    return;
  }
  /* ===== challenge checks on hole-out (skipped in no-stakes practice) ===== */
  if(!practiceMode){
  if(ace) earnChallenge('ace');
  if(diff<=-3) earnChallenge('albatross');
  if(diff===-2) earnChallenge('eagle');
  if(dunk){ earnChallenge('dunkAny'); if(courseIdx===0 && holeIdx===4) earnChallenge('dunk5'); }
  if(diff<=0 && ball._fromSand) earnChallenge('sandSave');
  if(diff<=-1 && (ball._puttDist||0) >= 40) earnChallenge('longPutt');
  }
  const names = {'-3':'ALBATROSS!','-2':'EAGLE!','-1':'BIRDIE!','0':'PAR!','1':'BOGEY','2':'DOUBLE BOGEY'};
  let title = ace ? 'HOLE IN ONE!' : (names[String(diff)] || (diff<0 ? 'INCREDIBLE!' : `+${diff}`));
  /* a DUNK (dropped straight in from the air) is the showcase shot — it leads the title */
  if(dunk) title = ace ? 'DUNK! HOLE IN ONE!' : 'DUNK! · ' + title;
  if(dunk || ace || diff<=-2){
    /* the big one: slow-mo, gold burst, glow rings, flag shake, camera punch-in */
    celebT = dunk ? 2.4 : 1.8;                       /* dunk gets a longer moment */
    timeScale = dunk ? 0.35 : 0.45;
    flash = {color: dunk ? '#7af0c0' : '#ffd84d', a: dunk ? 0.34 : 0.28};
    confetti(PIN.x, PIN.y);
    if(dunk){
      /* extra splashy: green-and-gold double burst + a second confetti pop */
      burst(PIN.x,PIN.y,6,'#7af0c0',54,140,1.4,300);
      burst(PIN.x,PIN.y,5,'#ffd84d',40,110,1.2,260);
      burst(PIN.x,PIN.y,3,'#ffffff',30,80,1.0,220);
      setTimeout(()=>confetti(PIN.x, PIN.y), 260);
      if(SFX.dunk) SFX.dunk(); else SFX.eagle();
      setTimeout(()=>SFX.eagle(), 120);
    } else {
      burst(PIN.x,PIN.y,4,'#ffd84d',40,110,1.2,260);
      burst(PIN.x,PIN.y,4,'#fff7d0',24,70,1.0,200);
      SFX.eagle();
    }
  }
  const qualified = diff <= REQUIRED_DIFF;
  if(!practiceMode){
    if(diff<=-1){
      setTimeout(()=>SFX.fanfare(), 450);
      birdieStreak++;
      if(birdieStreak>stats.bestBirdieStreak) stats.bestBirdieStreak=birdieStreak;
      if(birdieStreak>=5) earnChallenge('streak5');
      /* coin reward for scoring well: birdie 25, eagle 50, albatross+ 100 */
      addCoins(diff===-1 ? 25 : (diff===-2 ? 50 : 100), 'score');
    } else birdieStreak=0;
    if(ace) addCoins(1000, 'ace');     /* a hole-in-one pays out big */
    /* per-round bookkeeping for the "birdie every hole" / "no bogey" challenges */
    if(!roundHoleDiffs) roundHoleDiffs = [];
    roundHoleDiffs[holeIdx] = diff;
  } else if(diff<=-1){
    setTimeout(()=>SFX.fanfare(), 450);
  }

  showBanner(title, dunk ? '#7af0c0' : '#ffd84d');
  setTimeout(()=>{
    if(practiceMode){
      /* warm-up: no scoring, no unlocks — just encourage another rep */
      document.getElementById('endTitle').textContent = ace ? 'HOLE IN ONE!' : (diff<=-1?'NICE ONE!':'GOOD REP!');
      document.getElementById('endSub').textContent =
        `${strokes} stroke${strokes===1?'':'s'} on the practice green. Hit as many as you like — nothing's on the line here.`;
      const btn = document.getElementById('againBtn');
      btn.textContent = 'Hit again 🏌';
      btn.dataset.action = 'practice';
      document.getElementById('cardEyebrow').textContent = 'WARM UP · THE RANGE';
      document.getElementById('nextHoleRow').classList.remove('show');
      const sc=document.getElementById('scorecard'); if(sc) sc.innerHTML='';
      document.getElementById('roundVal').textContent = '—';
      document.getElementById('bestRoundVal').textContent = fmtScore(stats.bestRound);
      document.getElementById('birdieStreakVal').textContent = stats.bestBirdieStreak;
      document.getElementById('streakBestVal').textContent = stats.bestStreak;
      document.getElementById('endCard').classList.add('show');
      updateHUD();
      return;
    }
    const last = holeIdx === CH().length-1;
    if(qualified) roundDiffs[holeIdx] = diff;
    /* snapshot which courses were unlocked AND which tours were complete BEFORE recording
       this hole, so on a course completion we can detect a newly-unlocked card AND whether
       this finishes an entire tour (which earns a celebration screen). */
    const wasUnlocked = [];
    for(let ci=0; ci<COURSES.length-1; ci++) wasUnlocked[ci] = courseUnlocked(ci);
    const wasTourDone = [];
    for(let ti=0; ti<TOURS.length; ti++) wasTourDone[ti] = tourComplete(ti);
    window._unlockReveal = null;
    window._tourCelebrate = null;
    if(qualified){
      stats.holesDone = stats.holesDone||[0,0,0,0];
      stats.holesDone[courseIdx] = Math.max(stats.holesDone[courseIdx]||0, holeIdx+1);
    }
    if(qualified && last){
      for(let ci=0; ci<COURSES.length-1; ci++){
        if(!wasUnlocked[ci] && courseUnlocked(ci)){ window._unlockReveal = ci; break; }
      }
      /* did this round just COMPLETE a whole tour? */
      for(let ti=0; ti<TOURS.length; ti++){
        if(!wasTourDone[ti] && tourComplete(ti)){ window._tourCelebrate = ti; break; }
      }
    }
    document.getElementById('endTitle').textContent =
      qualified && last ? 'ROUND COMPLETE!' : title;
    document.getElementById('endSub').textContent =
      qualified
        ? (last ? (window._tourCelebrate!=null ? `Tour complete! Every hole birdied 🏆` : (window._unlockReveal!=null ? `All 9 birdied! A new course is unlocking…` : `You birdied all 9 holes!`)) : `${strokes} stroke${strokes===1?'':'s'} on a Par ${PAR} — hole ${holeIdx+2} unlocked`)
        : `${strokes} on a Par ${PAR} — birdie or better to advance. Run it back!`;
    renderScorecard();
    const total = roundDiffs.reduce((a,b)=>a+(b??0),0);
    document.getElementById('roundVal').textContent = fmtScore(roundDiffs.some(d=>d!==undefined)?total:null);
    if(qualified){
      stats.totalHoles = (stats.totalHoles||0) + 1;
      stats.totalStrokes = (stats.totalStrokes||0) + strokes;
      saveProgress();
    }
    if(qualified && last){
      if(stats.bestRound===null || total<stats.bestRound) stats.bestRound=total;
      stats.bests = stats.bests||[null,null,null,null];
      if(stats.bests[courseIdx]===null || total<stats.bests[courseIdx]) stats.bests[courseIdx]=total;
      stats.rounds = stats.rounds||[0,0,0,0];
      stats.rounds[courseIdx] = (stats.rounds[courseIdx]||0) + 1;
      /* unlock progression now derives from stats.holesDone via courseUnlocked()/tourComplete() */
      /* ===== full-round challenges ===== */
      const N = CH().length;
      const allHoles = roundHoleDiffs.slice(0,N);
      const haveAll = allHoles.length===N && allHoles.every(d=>d!==undefined && d!==null);
      if(haveAll){
        const allBirdieOrBetter = allHoles.every(d=>d<=-1);
        const allBirdieExact     = allHoles.every(d=>d===-1);
        if(courseIdx===0 && (allBirdieExact||allBirdieOrBetter)) earnChallenge('birdieSak');
        if(courseIdx===1 && (allBirdieExact||allBirdieOrBetter)) earnChallenge('birdieOak');
        if(courseIdx===2 && allBirdieOrBetter) earnChallenge('birdieVol');   /* birdie or less */
        if(allHoles.every(d=>d<=0)) earnChallenge('noBogey');                /* no bogeys */
      }
      if(stats.holesDone && stats.holesDone[0]>=9 && stats.holesDone[1]>=9 && stats.holesDone[2]>=9)
        earnChallenge('allCourses');
      SFX.roundFanfare();
    }
    document.getElementById('bestRoundVal').textContent = fmtScore(stats.bestRound);
    document.getElementById('birdieStreakVal').textContent = stats.bestBirdieStreak;
    document.getElementById('streakBestVal').textContent = stats.bestStreak;
    const btn = document.getElementById('againBtn');
    btn.textContent = qualified ? (last ? 'Course select 🏆' : 'Next hole ⛳') : 'Retry hole 🔁';
    btn.dataset.action = qualified ? (last ? 'courseselect' : 'next') : 'retry';
    document.getElementById('cardEyebrow').textContent = 'HOLE '+(holeIdx+1)+' · PAR '+PAR;
    /* next hole preview: number, par, distance */
    const nr = document.getElementById('nextHoleRow');
    const target = qualified ? (last ? null : CH()[holeIdx+1]) : CH()[holeIdx];
    if(target){
      const yd = Math.round(dist(target.tee.x,target.tee.y,target.pin.x,target.pin.y)*YD_PER_PX);
      document.getElementById('nextHoleInfo').textContent =
        (qualified?'HOLE '+(holeIdx+2):'RETRY HOLE '+(holeIdx+1))+' · PAR '+target.par+' · '+yd+' YDS';
      nr.classList.add('show');
    } else nr.classList.remove('show');
    document.getElementById('endCard').classList.add('show');
  }, 1200);
  updateHUD();
}
function renderScorecard(){
  const sc = document.getElementById('scorecard');
  sc.innerHTML='';
  CH().forEach((h,i)=>{
    const d = document.createElement('div');
    d.className='sq' + (i===holeIdx?' now':'');
    const diff = roundDiffs[i];
    if(diff!==undefined){
      if(diff<0) d.classList.add('birdie');
      if(diff>0) d.classList.add('bogey');
    }
    d.innerHTML = `<small>${i+1}</small><b>${diff===undefined?'·':(h.par+diff)}</b>`;
    sc.appendChild(d);
  });
}

/* ============================ HUD / UI ============================ */
function fmtScore(d){
  if(d===null||d===undefined) return '—';
  if(d===0) return 'E';
  return d>0 ? '+'+d : String(d);
}
function updateHUD(){
  if(practiceMode){
    const hv=document.getElementById('holeVal'); if(hv){ hv.textContent='—'; hv.previousElementSibling.textContent = rangeMode ? 'Range' : 'Practice'; }
  } else {
    const hv=document.getElementById('holeVal'); if(hv){ hv.textContent = holeIdx+1; hv.previousElementSibling.textContent='Hole'; }
  }
  document.getElementById('parVal').textContent = PAR;
  document.getElementById('strokeVal').textContent = strokes;
  const total = roundDiffs.reduce((a,b)=>a+(b??0),0);
  const played = roundDiffs.some(d=>d!==undefined);
  const sv = document.getElementById('scoreVal');
  sv.textContent = played ? fmtScore(total) : 'E';
  sv.className = played && total<0 ? 'under' : played && total>0 ? 'over' : '';
  const dYd = Math.round(dist(ball.x,ball.y,PIN.x,PIN.y)*YD_PER_PX);
  document.getElementById('distVal').textContent = state===ST.HOLED ? 'IN!' : dYd;
  document.getElementById('windVal').textContent = wind.mph;
  const rel = (wind.angle - cam.yaw)*180/Math.PI;
  document.getElementById('windArrow').style.transform = `rotate(${rel}deg)`;
  const stc = document.getElementById('streakChip');
  stc.style.display = streak>=2 ? 'flex' : 'none';
  document.getElementById('streakVal').textContent = 'x'+streak;
  /* uphill / downhill putt indicator (in the readout cluster) */
  /* eruption timing cue while aiming/pulling on the volcano hole */
  const vc = document.getElementById('eruptCue');
  if(VOLCANO && (state===ST.AIM || state===ST.PULL)){
    const ep = eruptPhase();
    vc.style.display='flex';
    if(ep.active){ vc.textContent='🌋 ERUPTING — WAIT'; vc.style.color='#ff5a2a'; }
    else { const sec=Math.max(0,ep.warn||0);
      vc.textContent = sec<1.6 ? '🌋 ABOUT TO BLOW' : '🌋 safe · blows in '+sec.toFixed(1)+'s';
      vc.style.color = sec<1.6 ? '#ffb03a' : '#9fe0c0'; }
  } else if(vc) vc.style.display='none';
  const er = document.getElementById('elevReadout');
  if(onGreenAt(ball.x,ball.y) && state!==ST.HOLED){
    const dh = greenHeight(PIN.x,PIN.y) - greenHeight(ball.x,ball.y);
    const ft = Math.abs(dh)*0.12;
    er.style.display='flex';
    const flat = Math.abs(dh)<2;
    document.getElementById('elevVal').textContent = flat ? 'FLAT' : ft.toFixed(1)+' ft';
    const ar = document.getElementById('elevArrow');
    ar.textContent = flat ? '•' : (dh>0?'↑':'↓');
    ar.style.color = flat ? '#ffe24d' : (dh>0 ? '#ff9c5e' : '#7be3b8');
  } else er.style.display='none';
}
function setHint(t){ document.getElementById('hint').textContent = t; }
function hideMeters(){ document.getElementById('meters').style.display='none'; }
let bannerTimer=null;
function showBanner(text,color){
  const b=document.getElementById('banner');
  b.textContent=text; b.style.color=color||'#fff';
  b.classList.remove('show'); void b.offsetWidth;
  b.classList.add('show');
  clearTimeout(bannerTimer);
  bannerTimer=setTimeout(()=>b.classList.remove('show'), 1100);
}
function refreshPrediction(){
  if(state===ST.AIM || (greenCam && greenCam.on)) prediction = predictShot(clubIdx===3 ? 62 : 78);
  else if(state===ST.PULL) prediction = predictShot(Math.max(clubIdx===3 ? pullPower : powerCurve(pullPower), 8));
}

/* ============================ LOOP & INPUT ============================ */
let lastT = performance.now();
function frame(now){
  const dt = Math.max(0, Math.min(0.033, (now-lastT)/1000));   /* clamp: never negative on a bad timestamp */
  lastT = now;
  /* ADAPTIVE QUALITY: keep the full look on capable devices, but if frames run slow for a
     sustained stretch, automatically shed the expensive extras so it stays smooth. */
  if(!AUTOQ.user){                                  /* only auto-manage if the player hasn't set it */
    const fps = dt>0 ? 1/dt : 60;
    AUTOQ.avg = AUTOQ.avg ? AUTOQ.avg*0.92 + fps*0.08 : fps;
    AUTOQ.t += dt;
    if(AUTOQ.t > 1.4){
      AUTOQ.t = 0;
      if(AUTOQ.avg < 40 && SET.quality==='high'){ SET.quality='low'; }
      else if(AUTOQ.avg > 54 && SET.quality==='low' && ++AUTOQ.good >= 3){ SET.quality='high'; AUTOQ.good=0; }
      else if(AUTOQ.avg <= 54) AUTOQ.good=0;
    }
  }
  pollGamepad(dt);                              /* Xbox / gamepad input */
  timeScale += (1-timeScale)*Math.min(1, dt*1.1);
  if(timeScale>0.97) timeScale=1;
  camPunch = Math.max(0, camPunch - dt*150);
  /* green roll voice: alive only while the ball runs on the putting surface */
  {
    const sp = Math.hypot(ball.vx,ball.vy);
    const rolling = ball.moving && !ball.air && sp>22 &&
                    surfaceAt(ball.x,ball.y)==='green';
    if(rolling){
      if(!ROLLSND.on) rollSndStart();
      rollSndUpdate(sp, ball.spin||0);
    } else if(ROLLSND.on) rollSndStop();
  }
  /* ===== near-miss tension: same treatment for makes AND misses =====
     when the ball hangs around the hole, the world holds its breath:
     gentle slow-mo + the music ducks away (handled per-frame, releases itself) */
  {
    const dH = dist(ball.x,ball.y,PIN.x,PIN.y);
    const sp = Math.hypot(ball.vx,ball.vy);
    const tense = (ball.moving && !ball.air && dH<55 && sp>4 && sp<170) || ball.rimming;
    if(tense){
      timeScale = Math.min(timeScale, ball.rimming ? 0.42 : 0.62);
      if(!nearMiss){ nearMiss=true; duckMusic(true); if(ball.rimming) SFX.tension(); }
    } else if(nearMiss){
      nearMiss=false; duckMusic(false);
    }
  }
  shake = Math.max(0, shake - dt*14);
  if(flash) flash.a = Math.max(0, flash.a - dt*0.5);
  celebT = Math.max(0, celebT - dt);
  sinkT  = Math.max(0, sinkT  - dt);

  if(state===ST.FLY){
    flyT += dt;
    if(flyT>3.4) endFlyover();
  }
  if(state===ST.REPLAY){
    replayT += dt*40;   /* samples were recorded per-frame; play at ~2/3 speed */
    const idx = Math.floor(replayT);
    if(idx>=shotRec.length){ endReplay(); }
    else {
      const s = shotRec[idx];
      ball.x=s.x; ball.y=s.y; ball.z=s.z;
      trail.push({x:s.x,y:s.y,z:s.z,life:0.55,gold:ball.gold});
    }
  }
  if(greenCam && greenCam.on){
    // while reading the green, the arrow keys orbit/tilt the camera instead of aiming
    if(keys.ArrowLeft)  panGreenCam(-2.6*dt, 0, 0);
    if(keys.ArrowRight) panGreenCam( 2.6*dt, 0, 0);
    if(keys.ArrowUp)    panGreenCam(0,  1.6*dt, 0);
    if(keys.ArrowDown)  panGreenCam(0, -1.6*dt, 0);
  } else if(state===ST.AIM){
    let changed = false;
    if(keys.ArrowLeft) { aimAngle -= 1.6*dt; changed=true; }
    if(keys.ArrowRight){ aimAngle += 1.6*dt; changed=true; }
    if(CLUBS[clubIdx].spinF>0.5){
      if(keys.ArrowUp)  { spin = Math.min(1,  spin + 1.4*dt); updateCtlUI(); changed=true; }
      if(keys.ArrowDown){ spin = Math.max(-1, spin - 1.4*dt); updateCtlUI(); changed=true; }
    }
    if(changed || !prediction) refreshPrediction();
  }
  /* ---- putting nerves (only while reading/standing over a putt) ----
     No audio. The longer you stall, the more the stroke gets the jitters —
     the "nervous" pendulum wobble eases in from ~9s and builds smoothly. */
  if(state===ST.AIM || state===ST.PULL){
    puttClock += dt;
    const over = Math.max(0, puttClock - PUTT_NERVES);
    const target = Math.min(1, over/5);                 /* full nerves ~5s after onset */
    puttPressure += (target - puttPressure) * Math.min(1, dt*1.5);   /* smooth ramp */
    puttWobblePhase += dt * (3.0 + puttPressure*2.2);
  } else if(puttClock>0 && state!==ST.MOVING && state!==ST.FLY){
    /* not actively over the shot (e.g. menus) — let nerves relax */
    puttPressure += (0 - puttPressure) * Math.min(1, dt*2);
  }
  if(state===ST.PULL){
    /* needle swings while the ball is held back; full swings speed up past
       the 75% sweet spot, putts speed up with pull length */
    if(pullPower>4){
      accT += dt * needleSpeedNow();
      accVal = Math.sin(accT);                /* pendulum: eases at the edges */
      /* nerves wobble: a tremor on the needle that grows the longer you stall */
      if(puttPressure>0.001){
        const wob = puttPressure * 0.16 * Math.sin(puttWobblePhase)
                  + puttPressure * 0.06 * Math.sin(puttWobblePhase*2.3+1.1);
        accVal = Math.max(-1, Math.min(1, accVal + wob));
      }
    } else { accVal = 0; }
    {
      const mk=document.getElementById('accArcMarker');
      if(mk){
        const p=arcPoint(Math.max(-1,Math.min(1,accVal)));
        /* lean the marker along the arc tangent so it reads like a swinging pendulum */
        const tan = -ARC_RISE*(-2*accVal);                 /* dy/dt slope of the dome */
        const ang = Math.atan2(tan, (ARC_W-ARC_PAD*2)*0.5) * 180/Math.PI;
        mk.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${ang.toFixed(1)})`);
      }
    }
    pullSndUpdate();                       /* swoosh rides the same needle math */
    refreshPrediction();
  }

  if(state!==ST.REPLAY && state!==ST.FLY) physics(dt*timeScale);
  updateCamera(dt);
  if(typeof updateGreenCamBtn==='function') updateGreenCamBtn();   // show READ GREEN only while putting
  if(greenCam && greenCam.on && clubIdx===3) refreshPrediction();  // keep the read line live while looking around

  if(rollGain){
    const sp = (!ball.air && ball.moving && state===ST.MOVING) ? Math.hypot(ball.vx,ball.vy) : 0;
    try{ rollGain.gain.setTargetAtTime(Math.min(0.1, sp/2800), AC.currentTime, 0.07); }catch(e){}
  }

  particles = particles.filter(p=>{
    const pdt = dt*timeScale;
    p.life -= pdt;
    p.x += p.vx*pdt; p.y += p.vy*pdt; p.z += p.vz*pdt;
    p.vz -= 320*pdt;
    if(p.z<0){p.z=0; p.vz=-p.vz*0.3; p.vx*=0.7; p.vy*=0.7;}
    return p.life>0;
  });
  trail = trail.filter(t=>{ t.life-=dt*timeScale; return t.life>0; });

  if(state===ST.AIM || state===ST.MOVING) updateHUD();
  draw(now);
  requestAnimationFrame(frame);
}

/* ============================ XBOX / GAMEPAD SUPPORT ============================
   Left stick X / D-pad: aim          Left stick Y: backspin(up)/topspin(down)
   Right stick: pull DOWN for power, push UP to release · sideways = fade/draw
   A: swing / select / advance        B: cancel pull / retry hole
   X: green book                      Y: slope arrows
   LB: replay                         Start/Menu: main menu
   Bumpers also nudge spin · works alongside mouse/touch/keyboard. */
const PAD = {
  index:null, prev:{}, pulling:false, deadzone:0.18, disabled:false,
  axLX:0, axLY:1, axRX:2, axRY:3,           /* standard mapping axis order */
};
/* The Gamepad API may be blocked by a permissions policy (e.g. when the game runs
   inside a sandboxed iframe). If so, getGamepads() throws — we disable gracefully so
   the game keeps running with mouse/touch/keyboard. */
function gamepadsSafe(){
  if(PAD.disabled) return null;
  try{
    if(!navigator.getGamepads) { PAD.disabled=true; return null; }
    return navigator.getGamepads();
  }catch(e){ PAD.disabled=true; return null; }
}
try{
  window.addEventListener('gamepadconnected', e=>{
    PAD.index = e.gamepad.index;
    try{ setHint('🎮 '+(e.gamepad.id||'Controller').split('(')[0].trim()+' connected'); }catch(_){}
  });
  window.addEventListener('gamepaddisconnected', e=>{ if(PAD.index===e.gamepad.index) PAD.index=null; });
}catch(e){ PAD.disabled=true; }
function padDead(v){ return Math.abs(v) < PAD.deadzone ? 0 : v; }
function padPressed(gp, i){ return !!(gp.buttons[i] && gp.buttons[i].pressed); }
/* edge-detect: true only on the frame a button goes down */
function padEdge(gp, i){
  const now = padPressed(gp,i), was = !!PAD.prev[i];
  PAD.prev[i] = now;
  return now && !was;
}
function pollGamepad(dt){
  if(PAD.disabled || PAD.index===null) return;
  const pads = gamepadsSafe();
  if(!pads) return;
  const gp = pads[PAD.index];
  if(!gp) return;
  if(inMenu) return;                          /* menus are mouse/touch for now */

  const lx = padDead(gp.axes[PAD.axLX]||0), ly = padDead(gp.axes[PAD.axLY]||0);
  const rx = padDead(gp.axes[PAD.axRX]||0), ry = padDead(gp.axes[PAD.axRY]||0);
  const rxRaw = gp.axes[PAD.axRX]||0;        /* un-deadzoned X — for latched fade/draw shaping */
  /* d-pad (standard mapping buttons 12-15) for aim too */
  const dLeft = padPressed(gp,14), dRight = padPressed(gp,15);
  const A=0, B=1, X=2, Y=3, LB=4, RB=5, START=9;

  /* ----- non-aim state screens: A advances, like Space ----- */
  if(state===ST.FLY){ if(padEdge(gp,A)) endFlyover(); return; }
  if(state===ST.REPLAY){ if(padEdge(gp,A)) endReplay(); return; }
  if(state===ST.HOLED){
    if(padEdge(gp,A) && document.getElementById('endCard').classList.contains('show'))
      document.getElementById('againBtn').click();
    return;
  }

  /* global toggles (edge-triggered) */
  if(padEdge(gp,Y)){ showArrows=!showArrows; if(state===ST.AIM) setHint(showArrows?'Slope arrows ON':'Slope arrows OFF'); }
  if(padEdge(gp,X)){ greenBook=!greenBook; if(state===ST.AIM) setHint(greenBook?'Green book ON':'Green book OFF'); }
  if(rangeMode && state===ST.AIM && (padEdge(gp,LB) || padEdge(gp,RB))){
    const order=[0,1,2,4]; let p=order.indexOf(clubIdx); if(p<0)p=0;
    p = padEdge(gp,RB) ? (p+1)%order.length : (p-1+order.length)%order.length;
    setRangeClub(order[p]);
  } else if(padEdge(gp,LB) && state===ST.AIM) startReplay();
  if(padEdge(gp,START)) { if(!inMenu) startHole(holeIdx, true); return; }   /* Start = quick retry hole */

  /* ----- AIMING ----- */
  if(state===ST.AIM){
    /* aim: left-stick X, right-stick X, or d-pad. A curved response gives fine control for
       the last small adjustments (slow near center) and quicker repositioning on a big tilt,
       so it's easy to creep onto your exact line and STOP there without it drifting. */
    const AIM_DZ = 0.16;                                  /* settling dead zone */
    const axis = Math.abs(lx) >= Math.abs(rx) ? lx : rx*0.7;   /* whichever stick you're using */
    let aim = 0;
    if(Math.abs(axis) > AIM_DZ){
      const dir = Math.sign(axis);
      const mag = (Math.abs(axis) - AIM_DZ) / (1 - AIM_DZ);    /* 0..1 past the dead zone */
      aim = dir * (0.30*mag + 0.70*mag*mag);                   /* slow-start, ramps up */
    }
    if(dLeft) aim -= 0.5;
    if(dRight) aim += 0.5;
    if(aim){ aimAngle += aim*2.3*dt; refreshPrediction(); }
    /* spin with left-stick Y: UP = backspin, DOWN = topspin (spin clubs only).
       Flipped so the on-screen dock matches the stick: push up → ball checks back. */
    if(CLUBS[clubIdx].spinF>0.5 && ly){
      spin = Math.max(-1, Math.min(1, spin - ly*1.4*dt));
      updateCtlUI(); refreshPrediction();
    }
    /* START the swing as soon as you draw the RIGHT stick back a little, or press A.
       Engages just past the deadzone so small/low-power pulls register immediately. */
    if(ry > 0.22 || padEdge(gp,A)){
      beginPull(0,0);
      PAD.pulling = true; PAD.peakPull = 0; PAD.armed = false; PAD.settled = 0;
      pullStart = {x:0, y:0};
    }
    return;
  }

  /* ----- LOADING / SWINGING (right stick) -----
     Pull back to load power — it HOLDS at the deepest point you reach, so you can
     settle on the distance you want. Then simply RELEASE the stick (let it spring
     back toward center) to swing through. The pendulum needle at that instant is
     your accuracy, so the release timing is the skill. Tilt ⟷ while loaded = shape. */
  if(state===ST.PULL && PAD.pulling){
    /* LEFT STICK stays live while you load power: aim with X, adjust backspin/topspin with Y,
       so you can fine-tune your line and spin right up until you release the shot. */
    {
      const AIM_DZ = 0.16;
      let aimP = 0;
      if(Math.abs(lx) > AIM_DZ){
        const dir = Math.sign(lx), mag = (Math.abs(lx)-AIM_DZ)/(1-AIM_DZ);
        aimP = dir*(0.30*mag + 0.70*mag*mag);
      }
      if(dLeft) aimP -= 0.5;
      if(dRight) aimP += 0.5;
      if(aimP){ aimAngle += aimP*2.3*dt; }
      if(CLUBS[clubIdx].spinF>0.5 && ly){
        spin = Math.max(-1, Math.min(1, spin - ly*1.4*dt));
        updateCtlUI();
      }
    }
    const back = Math.max(0, ry);                          /* how far back the stick is held */
    /* Map the USABLE stick travel to 0..100 so power responds right from a small pull:
       just past the deadzone (~0.15) = a little power, ~0.85 deflection = full power. */
    const PULL_LO = 0.15, PULL_HI = 0.85;
    const loadPct = Math.max(0, Math.min(100, (back - PULL_LO)/(PULL_HI - PULL_LO) * 100));
    /* LIVE power: tracks the stick directly so you can freely dial it UP or DOWN —
       pull back for more, ease forward for less, until you let go. */
    pullPower = loadPct;
    PAD.peakPull = Math.max(PAD.peakPull||0, loadPct);
    /* "settled" power lags the live value a little. When you snap the stick forward to
       release, the live value drops to ~0 within a frame or two, but settled stays near
       what you were holding — so the shot fires at the power you intended, not ~0. */
    if(loadPct >= (PAD.settled||0)) PAD.settled = loadPct;          /* rises instantly   */
    else PAD.settled = (PAD.settled||0) + (loadPct - (PAD.settled||0)) * 0.08;  /* falls slowly so a quick release keeps your power */
    /* ARM after a real draw (works for low-power pulls too). Once armed it stays armed,
       so you can freely dial power down without firing. */
    if(back > 0.22) PAD.armed = true;
    /* SHAPE (fade/draw) — LATCHED. Tilting the right stick ⟷ steers the shape and it HOLDS
       where you leave it; centering the stick does NOT snap back to straight. Push the other
       way to reduce or reverse it. This fixes the old behavior where easing the stick toward
       center (to hold power) instantly killed your fade/draw. */
    if(clubIdx===3){ pullShape = 0; }
    else {
      const SX_DEAD = 0.07;                              /* tiny X dead zone (anti-drift only) */
      let sx = Math.abs(rxRaw) < SX_DEAD ? 0 : rxRaw;
      if(sx){
        /* curved response: small tilt = fine control, big tilt = fast steer. Rate-based. */
        const dir = Math.sign(sx), mag = (Math.abs(sx)-SX_DEAD)/(1-SX_DEAD);
        pullShape += dir * (0.5*mag + 1.9*mag*mag) * dt;   /* accumulate toward fade/draw */
        pullShape = Math.max(-1.3, Math.min(1.3, pullShape));
      }
      /* when the stick is centered, pullShape simply stays put (latched) */
    }
    shape = Math.max(-1, Math.min(1, pullShape));
    updateCtlUI();
    refreshPrediction();                                   /* track live aim/spin/power */
    const fill=document.getElementById('powerFill'); if(fill) fill.style.width=pullPower+'%';
    const lbl=document.getElementById('meterLabel');
    if(lbl){
      if(Math.abs(pullShape)>1) lbl.textContent=(pullShape>0?'SLICE':'HOOK')+' RISK · '+Math.round(pullPower)+'%';
      else lbl.textContent=(PAD.armed?'LET GO TO SWING · ':'DRAW BACK · ')+Math.round(pullPower)+'%'+(clubIdx!==3&&pullPower>75?' ⚡':'');
    }
    /* CANCEL: B */
    if(padEdge(gp,B)){
      PAD.pulling=false; PAD.peakPull=0; PAD.armed=false;
      state=ST.AIM; hideMeters();
      const kc=puttClock, kp=puttPressure; nextShotSetup(); puttClock=kc; puttPressure=kp;
      return;
    }
    /* RELEASE: only a genuine LET-GO fires — the stick must return essentially to rest
       (back < 0.06). Easing off to lower your power (e.g. 0.40 → 0.20) no longer counts,
       so you can freely reduce power without firing. A also commits instantly.
       Fires at the power showing the moment you let go. */
    if(padEdge(gp,A) || (PAD.armed && back < 0.06)){
      pullPower = Math.max(PAD.settled||pullPower, 5);    /* the power you were holding */
      PAD.pulling=false; PAD.peakPull=0; PAD.armed=false; PAD.settled=0;
      PAD.prev[0]=true;
      releasePull();
    }
    return;
  }
}
window.addEventListener('keydown', e=>{
  if(typeof inMenu!=='undefined' && inMenu) return;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)) e.preventDefault();
  if(e.repeat){ keys[e.key]=true; return; }
  keys[e.key]=true;
  ac();
  if(e.key==='r' || e.key==='R') startHole(holeIdx, true);
  if(rangeMode && state===ST.AIM && ['1','2','3','4'].includes(e.key)){
    const map={'1':0,'2':1,'3':2,'4':4};   /* driver, iron, wedge, 60° wedge */
    setRangeClub(map[e.key]);
  }
  if(e.key==='f' || e.key==='F') toggleFullscreen();
  if(e.key==='s' || e.key==='S'){ showArrows=!showArrows; if(state===ST.AIM) setHint(showArrows?'Slope arrows ON':'Slope arrows OFF'); }
  if(e.key==='c' || e.key==='C'){ greenBook=!greenBook; if(state===ST.AIM) setHint(greenBook?'Green book ON':'Green book OFF'); }
  if((e.key==='p' || e.key==='P') && state===ST.AIM) startReplay();
  if(e.key==='m' || e.key==='M'){ if(!inMenu) openInGameSettings(); }
  if(e.key==='v' || e.key==='V'){ if(!inMenu) toggleGreenCam(); }
  if(e.key===' '){
    if(state===ST.FLY) endFlyover();
    else if(state===ST.REPLAY) endReplay();
    else if(state===ST.HOLED && document.getElementById('endCard').classList.contains('show'))
      document.getElementById('againBtn').click();
  }
});
window.addEventListener('keyup', e=>{ keys[e.key]=false; });

/* ---- drag-and-release swing input (mouse + touch via pointer events) ---- */
const wrapEl = document.getElementById('gameWrap');
wrapEl.style.touchAction = 'none';
wrapEl.addEventListener('pointerdown', e=>{
  ac();
  if(inMenu || e.target.closest('#endCard, #bottomLeft, #readout, #minimap, #hud, #menuScreen, #courseScreen, #settingsScreen, #spinChip, #greenReadHud, #greenCamBtn')) return;
  // GREEN-READING: drag anywhere on the scene to orbit/tilt the camera
  if(greenCam && greenCam.on){
    e.preventDefault();
    wrapEl.setPointerCapture(e.pointerId);
    greenCam._drag = { x:e.clientX, y:e.clientY };
    return;
  }
  if(state===ST.FLY){ endFlyover(); return; }
  if(state===ST.REPLAY){ endReplay(); return; }
  if(state!==ST.AIM || ball.moving) return;
  e.preventDefault();
  wrapEl.setPointerCapture(e.pointerId);
  beginPull(e.clientX, e.clientY);
});
wrapEl.addEventListener('pointermove', e=>{
  if(greenCam && greenCam.on && greenCam._drag){
    e.preventDefault();
    const dx = e.clientX - greenCam._drag.x, dy = e.clientY - greenCam._drag.y;
    greenCam._drag = { x:e.clientX, y:e.clientY };
    panGreenCam(dx*0.006, -dy*0.004, 0);   // horizontal drag = orbit, vertical = tilt
    return;
  }
  if(state!==ST.PULL) return;
  e.preventDefault();
  updatePull(e.clientX, e.clientY);
});
wrapEl.addEventListener('pointerup', e=>{
  if(greenCam && greenCam.on && greenCam._drag){ greenCam._drag=null; return; }
  if(state!==ST.PULL) return;
  e.preventDefault();
  releasePull();
});
wrapEl.addEventListener('pointercancel', ()=>{
  if(state===ST.PULL){ pullSndStop(); pullStart=null; pullPower=0; state=ST.AIM; hideMeters(); nextShotSetup(); }
});
document.getElementById('againBtn').addEventListener('click', function(){
  const a = this.dataset.action || 'retry';
  if(a==='mpdone'){ document.getElementById('endCard').classList.remove('show'); goToMenu(); return; }
  if(a==='next') startHole(holeIdx+1);
  else if(a==='courseselect'){
    /* round complete: clear the round, hide the card. If a whole TOUR just finished, show
       the celebration screen first; otherwise go straight to course select (which plays the
       single-course unlock reveal). */
    roundDiffs=[]; roundHoleDiffs=[]; birdieStreak=0;
    document.getElementById('endCard').classList.remove('show');
    { const cn=document.getElementById('controlsNote'); if(cn) cn.style.display='none'; }
    inMenu = true;
    if(window._tourCelebrate!=null){
      const ti = window._tourCelebrate; window._tourCelebrate = null;
      showTourCelebration(ti);
    } else {
      if(window._unlockReveal!=null){ const ut=tourOfCourse(window._unlockReveal); if(ut>=0) tourIdx=ut; }
      showCourses();
    }
  }
  else if(a==='newround'){ roundDiffs=[]; roundHoleDiffs=[]; birdieStreak=0; startHole(0); }
  else if(a==='practice') startHole(0, true);
  else startHole(holeIdx, true);
});

roundDiffs = [];
/* ============== MENU SYSTEM ============== */
let inMenu = true;
const $m = id=>document.getElementById(id);

/* falling sakura petals on the menu */
const petalCv = $m('petalCanvas');
const pctx = petalCv.getContext('2d');
let petals = [];
function sizePetals(){
  petalCv.width  = $m('menuScreen').clientWidth;
  petalCv.height = $m('menuScreen').clientHeight;
}
function initPetals(){
  sizePetals();
  const n = SET.quality==='high' ? 38 : 16;
  petals = Array.from({length:n}, ()=>({
    x:Math.random()*petalCv.width, y:Math.random()*petalCv.height,
    s:3+Math.random()*4.5, a:Math.random()*Math.PI*2,
    vy:14+Math.random()*22, vx:6+Math.random()*16,
    spin:(Math.random()-0.5)*2.4, ph:Math.random()*Math.PI*2
  }));
}
let petalRAF = null, petalLast = 0;
function petalLoop(ts){
  if(!inMenu){ petalRAF=null; return; }
  const dt = Math.min(0.05, (ts-petalLast)/1000 || 0.016); petalLast = ts;
  pctx.clearRect(0,0,petalCv.width,petalCv.height);
  for(const pt of petals){
    pt.ph += dt;
    pt.x += (pt.vx + Math.sin(pt.ph*1.3)*18)*dt;
    pt.y += pt.vy*dt;
    pt.a += pt.spin*dt;
    if(pt.y > petalCv.height+10){ pt.y=-10; pt.x=Math.random()*petalCv.width; }
    if(pt.x > petalCv.width+10) pt.x=-10;
    pctx.save();
    pctx.translate(pt.x,pt.y); pctx.rotate(pt.a);
    pctx.fillStyle='rgba(255,170,205,.85)';
    pctx.beginPath();
    pctx.ellipse(0,0,pt.s,pt.s*0.62,0,0,Math.PI*2);
    pctx.fill();
    pctx.fillStyle='rgba(255,210,228,.7)';
    pctx.beginPath();
    pctx.ellipse(pt.s*0.25,-pt.s*0.15,pt.s*0.45,pt.s*0.3,0.5,0,Math.PI*2);
    pctx.fill();
    pctx.restore();
  }
  petalRAF = requestAnimationFrame(petalLoop);
}
/* course-select petals: same dreamy fall, lives while the course screen is open */
const csCv = $m('csPetals'); const cspx = csCv ? csCv.getContext('2d') : null;
let csPetalsArr = [], csRAF = null, csLast = 0;
function initCsPetals(){
  if(!csCv) return;
  csCv.width = $m('courseScreen').clientWidth; csCv.height = $m('courseScreen').clientHeight;
  const n = SET.quality==='high' ? 30 : 12;
  csPetalsArr = Array.from({length:n}, ()=>({
    x:Math.random()*csCv.width, y:Math.random()*csCv.height,
    s:3+Math.random()*4.5, a:Math.random()*Math.PI*2,
    vy:14+Math.random()*22, vx:6+Math.random()*16,
    spin:(Math.random()-0.5)*2.4, ph:Math.random()*Math.PI*2
  }));
}
function csPetalLoop(ts){
  if($m('courseScreen').style.display==='none'){ csRAF=null; return; }
  const dt = Math.min(0.05, (ts-csLast)/1000 || 0.016); csLast = ts;
  cspx.clearRect(0,0,csCv.width,csCv.height);
  for(const pt of csPetalsArr){
    pt.ph += dt;
    pt.x += (pt.vx + Math.sin(pt.ph*1.3)*18)*dt;
    pt.y += pt.vy*dt; pt.a += pt.spin*dt;
    if(pt.y > csCv.height+10){ pt.y=-10; pt.x=Math.random()*csCv.width; }
    if(pt.x > csCv.width+10) pt.x=-10;
    cspx.save(); cspx.translate(pt.x,pt.y); cspx.rotate(pt.a);
    cspx.fillStyle='rgba(255,175,208,.82)';
    cspx.beginPath(); cspx.ellipse(0,0,pt.s,pt.s*0.62,0,0,Math.PI*2); cspx.fill();
    cspx.fillStyle='rgba(255,214,230,.66)';
    cspx.beginPath(); cspx.ellipse(pt.s*0.25,-pt.s*0.15,pt.s*0.45,pt.s*0.3,0.5,0,Math.PI*2); cspx.fill();
    cspx.restore();
  }
  csRAF = requestAnimationFrame(csPetalLoop);
}
function showMenu(){
  inMenu = true;
  if(greenCam){ greenCam.on = false; const dr=$m('greenReadHud'); if(dr) dr.style.display='none'; const gb=$m('greenCamBtn'); if(gb){ gb.classList.remove('on'); gb.style.display='none'; } }
  if(MP){ clearInterval(MP.clockTimer); clearInterval(MP._turnBeat); MP=null; }
  { const h=$m('mpHud'); if(h) h.style.display='none'; const sb=$m('mpBoard'); if(sb) sb.classList.remove('show'); const sp=$m('skinPot'); if(sp) sp.classList.remove('show'); }
  $m('menuScreen').style.display='flex';
  $m('courseScreen').style.display='none';
  { const ts=$m('tourScreen'); if(ts) ts.style.display='none'; }
  { const mp=$m('mpScreen'); if(mp) mp.style.display='none'; }
  { const cn=$m('controlsNote'); if(cn) cn.style.display='none'; }
  initPetals();
  if(!petalRAF) petalRAF = requestAnimationFrame(petalLoop);
}
/* return to the main menu from in-game (M key) — clean up the active shot/UI */
function goToMenu(){
  try{ pullSndStop(); }catch(e){}
  try{ if('speechSynthesis' in window) speechSynthesis.cancel(); }catch(e){}
  pullStart=null; keys={};
  if(typeof hideMeters==='function') hideMeters();
  const ec=$m('endCard'); if(ec) ec.classList.remove('show');
  const ss=$m('settingsScreen'); if(ss) ss.style.display='none';
  showMenu();
}
function fmtBest(v){ return v===undefined||v===null ? '—' : (v>0?'+':'')+(v===0?'E':v); }
function showCoinToast(n, src){
  const t = $m('coinToast'); if(!t) return;
  $m('coinToastVal').textContent = '+' + n;
  /* restart the pop animation cleanly even on rapid repeats */
  t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
  clearTimeout(showCoinToast._t);
  showCoinToast._t = setTimeout(()=> t.classList.remove('show'), 2000);
  const cv=$m('coinVal'); if(cv) cv.textContent = stats.coins||0;
  const sv=$m('storeCoinVal'); if(sv) sv.textContent = stats.coins||0;
  /* coin sound — but NOT during a big celebration (ace/eagle+ already have a fanfare; a
     ka-ching on top is cluttered). Small, frequent rewards (birdie, range green, challenge)
     get the satisfying ding, nudged slightly late so it lands just after the main cue. */
  const bigCeleb = (src==='ace') || (src==='score' && n>=50);
  if(!bigCeleb){
    clearTimeout(showCoinToast._s);
    showCoinToast._s = setTimeout(()=>{ try{ SFX.coin(n); }catch(e){} }, src==='score' ? 140 : 40);
  }
}
function drawBallPreview(cv, skin){
  const ctx=cv.getContext('2d'), W=cv.width;
  ctx.clearRect(0,0,W,W);
  const cx=W/2, cy=W/2, r=W*0.40, lx=-0.42, ly=-0.46;
  ctx.fillStyle='rgba(30,70,40,.16)';
  ctx.beginPath(); ctx.ellipse(cx, cy+r*0.95, r*0.9, r*0.3, 0,0,Math.PI*2); ctx.fill();
  const st=skin.stops;
  const g=ctx.createRadialGradient(cx+lx*r*0.8, cy+ly*r*0.8, r*0.1, cx, cy, r*1.06);
  g.addColorStop(0,st[0]); g.addColorStop(0.5,st[1]); g.addColorStop(0.82,st[2]); g.addColorStop(1,st[3]);
  if(skin.alpha!==undefined) ctx.globalAlpha=skin.alpha;
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
  ctx.globalAlpha=1;
  if(skin.brilliant){
    /* dazzling diamond cluster — animated, so kick off a loop for this canvas */
    drawBrilliant(ctx, cx, cy, r, skin, (cv._bt||0), lx, ly);
    if(!cv._bloop){
      cv._bloop=true;
      const loop=()=>{
        if(!cv.isConnected){ cv._bloop=false; return; }
        cv._bt=(cv._bt||0)+16;
        ctx.clearRect(0,0,W,W);
        ctx.fillStyle='rgba(30,70,40,.16)';
        ctx.beginPath(); ctx.ellipse(cx, cy+r*0.95, r*0.9, r*0.3, 0,0,Math.PI*2); ctx.fill();
        ctx.globalAlpha=skin.alpha!==undefined?skin.alpha:1;
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
        ctx.globalAlpha=1;
        drawBrilliant(ctx, cx, cy, r, skin, cv._bt, lx, ly);
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
    return;
  }
  ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,r*0.98,0,Math.PI*2); ctx.clip();
  ctx.globalAlpha=0.18; ctx.fillStyle='#8a96a0';
  for(let yy=-3;yy<=3;yy++) for(let xx=-3;xx<=3;xx++){
    const px=cx+xx*r*0.26+ (yy%2?r*0.13:0), py=cy+yy*r*0.26;
    if(Math.hypot(px-cx,py-cy)<r*0.82){ ctx.beginPath(); ctx.arc(px,py,r*0.05,0,Math.PI*2); ctx.fill(); }
  }
  ctx.globalAlpha=1;
  if(skin.metallic){
    const mg=ctx.createLinearGradient(cx-r,cy-r*0.3,cx+r,cy+r*0.3);
    mg.addColorStop(0,'rgba(255,255,255,0)');mg.addColorStop(0.48,'rgba(255,255,255,.6)');
    mg.addColorStop(0.5,'rgba(255,255,255,.85)');mg.addColorStop(0.52,'rgba(255,255,255,.55)');mg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=mg; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
  }
  if(skin.facet){
    for(let f=0;f<6;f++){
      const a=f*Math.PI/3+0.3;
      ctx.globalAlpha=f%2?0.18:0.30; ctx.fillStyle=f%2?'#fff':st[3];
      ctx.beginPath(); ctx.moveTo(cx,cy);
      ctx.lineTo(cx+Math.cos(a-0.5)*r,cy+Math.sin(a-0.5)*r);
      ctx.lineTo(cx+Math.cos(a+0.1)*r,cy+Math.sin(a+0.1)*r); ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha=1;
    const cg=ctx.createRadialGradient(cx+lx*r*0.3,cy+ly*r*0.3,r*0.05,cx,cy,r*0.6);
    cg.addColorStop(0,'rgba(255,255,255,.55)');cg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(cx,cy,r*0.6,0,Math.PI*2); ctx.fill();
  }
  if(skin.prismatic){
    const hues=['rgba(255,120,120,.3)','rgba(255,230,120,.3)','rgba(120,255,160,.3)','rgba(120,200,255,.3)','rgba(210,140,255,.3)'];
    for(let h=0;h<hues.length;h++){ ctx.strokeStyle=hues[h]; ctx.lineWidth=r*0.05;
      ctx.beginPath(); ctx.arc(cx,cy,r*(0.6+h*0.07),Math.PI*0.1,Math.PI*0.6); ctx.stroke(); }
  }
  ctx.restore();
  if(skin.sparkle){
    [[0.5,-0.4],[-0.35,0.2]].forEach(([sx,sy])=>{
      const gx=cx+sx*r, gy=cy+sy*r, gr=r*0.3;
      ctx.fillStyle='rgba(255,255,255,.95)';
      ctx.beginPath();
      ctx.moveTo(gx,gy-gr);ctx.lineTo(gx+gr*0.18,gy-gr*0.18);ctx.lineTo(gx+gr,gy);
      ctx.lineTo(gx+gr*0.18,gy+gr*0.18);ctx.lineTo(gx,gy+gr);ctx.lineTo(gx-gr*0.18,gy+gr*0.18);
      ctx.lineTo(gx-gr,gy);ctx.lineTo(gx-gr*0.18,gy-gr*0.18);ctx.closePath(); ctx.fill();
    });
  }
  const sg=ctx.createRadialGradient(cx+lx*r*0.9,cy+ly*r*0.9,0,cx+lx*r*0.9,cy+ly*r*0.9,r*0.5);
  sg.addColorStop(0,'rgba(255,255,255,.95)');sg.addColorStop(0.4,'rgba(255,255,255,.3)');sg.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=sg; ctx.beginPath(); ctx.arc(cx+lx*r*0.9,cy+ly*r*0.9,r*0.5,0,Math.PI*2); ctx.fill();
}
function renderStore(){
  const grid=$m('storeGrid'); if(!grid) return;
  stats.ownedSkins = stats.ownedSkins||['white'];
  $m('storeCoinVal').textContent = stats.coins||0;
  grid.innerHTML='';
  BALL_SKINS.forEach(skin=>{
    const owned = stats.ownedSkins.includes(skin.id);
    const equipped = stats.equippedSkin===skin.id;
    const card=document.createElement('div'); card.className='ballCard';
    const cv=document.createElement('canvas'); cv.width=96; cv.height=96;
    card.appendChild(cv);
    const nm=document.createElement('div'); nm.className='bName'; nm.textContent=skin.name; card.appendChild(nm);
    const tr=document.createElement('div'); tr.className='bTier '+skin.tier; tr.textContent=skin.tier; card.appendChild(tr);
    const btn=document.createElement('button'); btn.className='bBuy';
    if(equipped){ btn.classList.add('equipped'); btn.textContent='EQUIPPED'; }
    else if(owned){ btn.classList.add('owned'); btn.textContent='EQUIP'; }
    else if((stats.coins||0) >= skin.price){ btn.innerHTML='<span class="bPrice"><svg class="coinIco" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="#ffd84d" stroke="#e0a83c" stroke-width="1.4"/><path d="M12 7.5l1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4z" fill="#e0a83c"/></svg> '+skin.price+'</span>'; }
    else { btn.classList.add('cant'); btn.innerHTML='<span class="bPrice"><svg class="coinIco" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="#ffd84d" stroke="#e0a83c" stroke-width="1.4"/><path d="M12 7.5l1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4z" fill="#e0a83c"/></svg> '+skin.price+'</span>'; }
    btn.onclick=()=>{
      if(stats.equippedSkin===skin.id) return;
      if(stats.ownedSkins.includes(skin.id)){ stats.equippedSkin=skin.id; if(SFX.click)SFX.click(); saveProgress(); renderStore(); return; }
      if((stats.coins||0) >= skin.price){
        stats.coins -= skin.price; stats.ownedSkins.push(skin.id); stats.equippedSkin=skin.id;
        if(SFX.fanfare) SFX.fanfare();
        saveProgress();
        renderStore();
      }
    };
    card.appendChild(btn);
    grid.appendChild(card);
    drawBallPreview(cv, skin);
  });
}
function showStore(){ $m('storeScreen').style.display='flex'; renderStore(); }
function hideStore(){ $m('storeScreen').style.display='none'; }
function showChallengeToast(c){
  const t = $m('challengeToast'); if(!t) return;
  $m('ctIcon').textContent = c.icon;
  $m('ctName').textContent = c.name;
  $m('ctDesc').textContent = c.desc;
  $m('ctCoins').innerHTML = '<svg class="coinIco" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="#ffd84d" stroke="#e0a83c" stroke-width="1.4"/><path d="M12 7.5l1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4z" fill="#e0a83c"/></svg> +' + (c.coins||0);
  t.classList.remove('show'); void t.offsetWidth;   /* restart the animation each time */
  t.classList.add('show');
  clearTimeout(showChallengeToast._t);
  showChallengeToast._t = setTimeout(()=> t.classList.remove('show'), 4200);
}
function renderChallenges(){
  const list = $m('challengesList'); if(!list) return;
  const earned = stats.challenges||{};
  let n=0;
  list.innerHTML = CHALLENGES.map(c=>{
    const got = !!earned[c.id]; if(got) n++;
    return `<div class="chRow ${got?'earned':'locked'}">
      <div class="chIco">${c.icon}</div>
      <div class="chMeta"><div class="chN">${c.name}</div><div class="chD">${c.desc}</div></div>
      <div class="chReward"><svg class="coinIco" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="#ffd84d" stroke="#e0a83c" stroke-width="1.4"/><path d="M12 7.5l1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4z" fill="#e0a83c"/></svg> ${c.coins||0}</div>
      <div class="chState">${got?'✓':'🔒'}</div>
    </div>`;
  }).join('');
  $m('chCount').textContent = n + ' / ' + CHALLENGES.length;
}
function renderStatsReport(){
  const HN=9;
  const totalRounds=(stats.rounds||[0,0,0,0]).reduce((a,c)=>a+(c||0),0);
  const totalHoles=stats.totalHoles||0;
  const avg=totalHoles>0 ? (stats.totalStrokes/totalHoles) : null;
  const totalDone=(stats.holesDone||[0,0,0,0]).reduce((a,c)=>a+Math.min(HN,c||0),0);
  $m('srRounds').textContent   = totalRounds;
  $m('srHoles').textContent    = totalHoles;
  $m('srBest').textContent     = fmtBest(stats.bestRound);
  $m('srAvg').textContent      = avg!==null ? avg.toFixed(1) : '—';
  $m('srStreak').textContent   = stats.bestBirdieStreak||0;
  $m('srProgress').textContent = Math.round(totalDone/(HN*4)*100)+'%';
}
function showStats(){ renderStatsReport(); renderChallenges(); $m('statsScreen').style.display='flex'; }
function hideStats(){ $m('statsScreen').style.display='none'; }
/* ===== TOUR SELECT ===== build the tour cards and show the picker ===== */
function showTours(){
  $m('menuScreen').style.display='none';
  $m('courseScreen').style.display='none';
  $m('tourScreen').style.display='flex';
  renderTourCards();
  inMenu = true;
  if(!petalRAF) petalRAF = requestAnimationFrame(petalLoop);
}

/* detailed, uncrowded scenic preview per tour, matching the course-card cpArt frame */
function tourBannerSVG(ti){
  const themes = [
    /* Sunrise Tour — dawn sky, layered hills, a lone flag on a distant green */
    `<defs>
       <linearGradient id="tsg0a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd9a8"/><stop offset=".5" stop-color="#ffe8c4"/><stop offset="1" stop-color="#dff1ff"/></linearGradient>
       <linearGradient id="tsg0b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd479"/><stop offset="1" stop-color="#5fb054"/></linearGradient>
     </defs>
     <rect width="200" height="118" fill="url(#tsg0a)"/>
     <circle cx="148" cy="40" r="20" fill="#fff1c4"/><circle cx="148" cy="40" r="13" fill="#ffd86b"/>
     <ellipse cx="40" cy="44" rx="60" ry="16" fill="#ffffff" opacity=".5"/>
     <ellipse cx="120" cy="30" rx="34" ry="9" fill="#ffffff" opacity=".45"/>
     <path d="M0 78 Q 50 60 100 74 T 200 70 L200 118 L0 118 Z" fill="#9ed98a"/>
     <path d="M0 92 Q 60 78 120 90 T 200 86 L200 118 L0 118 Z" fill="url(#tsg0b)"/>
     <ellipse cx="150" cy="92" rx="26" ry="9" fill="#7fd06a"/>
     <line x1="150" y1="90" x2="150" y2="68" stroke="#fff" stroke-width="2"/><path d="M150 68 L162 72 L150 76 Z" fill="#e8554e"/>
     <g><rect x="32" y="74" width="4" height="16" rx="2" fill="#7a5a48"/><circle cx="34" cy="68" r="11" fill="#f7b8d6"/><circle cx="26" cy="74" r="7" fill="#f9c8e0"/><circle cx="42" cy="74" r="7" fill="#fcd3e6"/></g>`,
    /* Golden Snail Tour — warm gold meadow, winding fairway, a single snail accent */
    `<defs>
       <linearGradient id="tsg1a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe7a8"/><stop offset="1" stop-color="#fff6df"/></linearGradient>
       <linearGradient id="tsg1b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#86c659"/><stop offset="1" stop-color="#5fa83f"/></linearGradient>
     </defs>
     <rect width="200" height="118" fill="url(#tsg1a)"/>
     <circle cx="150" cy="36" r="22" fill="#ffe07a" opacity=".85"/>
     <path d="M0 70 Q 60 56 120 68 T 200 62 L200 118 L0 118 Z" fill="#9ccf6a"/>
     <path d="M0 86 Q 70 74 140 86 T 200 82 L200 118 L0 118 Z" fill="url(#tsg1b)"/>
     <path d="M10 112 Q 70 96 110 86 T 196 64" stroke="#c9e89a" stroke-width="10" fill="none" stroke-linecap="round" opacity=".8"/>
     <ellipse cx="150" cy="84" rx="22" ry="8" fill="#7ec257"/>
     <line x1="150" y1="82" x2="150" y2="62" stroke="#fff" stroke-width="2"/><path d="M150 62 L162 66 L150 70 Z" fill="#e8554e"/>
     <g transform="translate(44,90)">
       <path d="M-14 6 q-3 -13 11 -13 q16 0 16 11 q0 8 -11 8 q-12 0 -16 -6 Z" fill="#e0a83c"/>
       <circle cx="13" cy="-7" r="8" fill="#caa636"/><circle cx="13" cy="-7" r="5" fill="#a9842a"/>
       <path d="M9 -12 l3 -7 M16 -12 l4 -7" stroke="#9c6f1e" stroke-width="1.6" stroke-linecap="round"/>
       <circle cx="8" cy="-19" r="1.6" fill="#5a3f12"/><circle cx="20" cy="-19" r="1.6" fill="#5a3f12"/>
     </g>`,
    /* The Reckoning — stormy dusk, jagged peaks, blood-red flag, ominous and clean */
    `<defs>
       <linearGradient id="tsg2a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#241d3a"/><stop offset="1" stop-color="#4b3a63"/></linearGradient>
       <linearGradient id="tsg2b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f5e42"/><stop offset="1" stop-color="#1d4630"/></linearGradient>
     </defs>
     <rect width="200" height="118" fill="url(#tsg2a)"/>
     <circle cx="150" cy="32" r="14" fill="#e6dcff" opacity=".9"/><circle cx="156" cy="29" r="14" fill="#241d3a"/>
     <path d="M0 64 L34 26 L58 52 L92 18 L128 56 L162 24 L200 58 L200 72 L0 72 Z" fill="#3b3358"/>
     <path d="M92 18 L104 36 L80 36 Z M162 24 L172 40 L152 40 Z" fill="#cfc6ee" opacity=".8"/>
     <path d="M0 80 Q 60 68 120 80 T 200 76 L200 118 L0 118 Z" fill="url(#tsg2b)"/>
     <ellipse cx="150" cy="88" rx="22" ry="8" fill="#3f7d57"/>
     <line x1="150" y1="86" x2="150" y2="64" stroke="#d8d0f0" stroke-width="2"/><path d="M150 64 L163 68 L150 72 Z" fill="#e01f2d"/>
     <g opacity=".5"><path d="M40 14 L46 30 L38 26 L44 40" stroke="#fff6a0" stroke-width="2" fill="none" stroke-linecap="round"/></g>`
  ];
  return '<svg class="cpArt" viewBox="0 0 200 118" preserveAspectRatio="xMidYMid slice">'+(themes[ti]||themes[0])+'</svg>';
}

function renderTourCards(){
  const wrap = $m('tourCards'); if(!wrap) return;
  const X = '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" fill="rgba(180,20,20,.22)" stroke="#d62828" stroke-width="6"/><path d="M32 32 L68 68 M68 32 L32 68" stroke="#d62828" stroke-width="9" stroke-linecap="round"/></svg>';
  wrap.innerHTML = TOURS.map((t,ti)=>{
    const unlocked = tourUnlocked(ti);
    const totalMaps = t.courses.length;
    const doneMaps = t.courses.filter(ci => (stats.holesDone?.[ci]||0) >= 9).length;
    const pct = totalMaps ? Math.round(doneMaps/totalMaps*100) : 0;
    const prevT = TOURS[ti-1];
    const prevMaps = prevT ? prevT.courses.length : 0;
    const lockMsg = ti>0
      ? ('🔒 Birdie every hole on all '+prevMaps+' '+prevT.name+' map'+(prevMaps>1?'s':'')+' to unlock')
      : '';
    const mapsLabel = totalMaps ? (totalMaps+' map'+(totalMaps>1?'s':'')) : 'Coming soon';
    return `<div class="courseCard ${unlocked?'open':'locked'}" data-tour="${ti}">
      ${tourBannerSVG(ti)}
      <div class="courseName">${t.name}</div>
      <div class="courseInfo">${mapsLabel}</div>
      <div class="cpProgress"><div class="cpBar"><div class="cpFill" style="width:${pct}%"></div></div>
        <div class="cpLabel">${totalMaps?(doneMaps+' / '+totalMaps+' complete'):'New tour'}</div></div>
      ${unlocked && totalMaps
        ? `<button class="teeBtn tourEnter" data-tour="${ti}"><span><svg class="btnIco" viewBox="0 0 24 24" fill="none"><path d="M7 21 V3" stroke="#1d6b3a" stroke-width="2.4" stroke-linecap="round"/><path d="M7 3.5 L18 7 L7 10.5 Z" fill="#e8554e"/></svg>ENTER</span></button>`
        : (unlocked
            ? `<div class="lockBadge" style="display:block">More maps soon</div>`
            : `<div class="lockBadge" style="display:block">${lockMsg}</div><div class="lockX">${X}</div>`)}
    </div>`;
  }).join('');
  wrap.querySelectorAll('.tourEnter').forEach(b=>{
    b.onclick = (e)=>{ e.stopPropagation(); ac(); enterTour(+b.dataset.tour); };
  });
  wrap.querySelectorAll('.courseCard.open').forEach(c=>{
    if(!TOURS[+c.dataset.tour].courses.length) return;
    c.onclick = ()=>{ ac(); enterTour(+c.dataset.tour); };
  });
}

/* open a tour: show only its course cards in the course screen */
function enterTour(ti){
  if(!tourUnlocked(ti)) return;
  tourIdx = ti;
  showCourses();
}

/* full-screen celebration when a player completes an entire tour (every hole on every
   course birdied). Trophy, stars, confetti, fanfare; Continue → course select where the
   newly unlocked next tour does its unlock reveal. */
function showTourCelebration(ti){
  const t = TOURS[ti]; if(!t) return;
  $m('tcName').textContent = (t.name||'TOUR').toUpperCase();
  $m('tcTagline').textContent = t.tagline || '';
  const isLastTour = ti >= TOURS.length-1;
  $m('tcMsg').textContent = isLastTour
    ? 'You birdied every hole on every course in the game. You are a Birdie Blitz legend.'
    : 'You birdied every hole on every course. The next tour is now unlocked.';
  $m('tcContinue').textContent = isLastTour ? 'FINISH 🏆' : 'CONTINUE →';
  // confetti
  const cc = $m('tcConfetti'); if(cc){
    cc.innerHTML='';
    const colors=['#fff','#7ed957','#4aa3ff','#ff6b6b','#ffd84d','#b06bff'];
    for(let i=0;i<70;i++){
      const d=document.createElement('div'); d.className='tcDot';
      d.style.left=(Math.random()*100)+'%';
      d.style.background=colors[i%colors.length];
      d.style.animationDuration=(2.2+Math.random()*2.4)+'s';
      d.style.animationDelay=(Math.random()*1.2)+'s';
      d.style.width=(7+Math.random()*7)+'px'; d.style.height=(9+Math.random()*9)+'px';
      cc.appendChild(d);
    }
  }
  inMenu = true;
  $m('menuScreen').style.display='none';
  $m('courseScreen').style.display='none';
  { const ts=$m('tourScreen'); if(ts) ts.style.display='none'; }
  { const mp=$m('mpScreen'); if(mp) mp.style.display='none'; }
  { const cn=$m('controlsNote'); if(cn) cn.style.display='none'; }
  $m('tourCelebrate').classList.add('show');
  ac(); try{ SFX.roundFanfare && SFX.roundFanfare(); }catch(e){}
  setTimeout(()=>{ try{ SFX.fanfare && SFX.fanfare(); }catch(e){} }, 700);
}

function showCourses(){
  $m('menuScreen').style.display='none';
  $m('tourScreen').style.display='none';
  $m('courseScreen').style.display='flex';
  initCsPetals();
  if(!csRAF) csRAF = requestAnimationFrame(csPetalLoop);
  const b = stats.bests||[null,null,null,null,null,null];
  $m('courseBest').textContent  = 'Best: ' + fmtBest(b[0]);
  $m('course2Best').textContent = 'Best: ' + fmtBest(b[1]);
  $m('course3Best').textContent = 'Best: ' + fmtBest(b[2]);
  { const e=$m('course4Best'); if(e) e.textContent = 'Best: ' + fmtBest(b[3]); }
  { const e=$m('course5Best'); if(e) e.textContent = 'Best: ' + fmtBest(b[4]); }
  { const e=$m('course6Best'); if(e) e.textContent = 'Best: ' + fmtBest(b[5]); }
  { const cv=$m('coinVal'); if(cv) cv.textContent = stats.coins||0; }

  /* tour heading */
  const t = TOURS[tourIdx];
  { const h=$m('csHeading'); if(h) h.textContent = (t? t.name.toUpperCase() : 'SELECT COURSE'); }
  { const s=$m('csSubHeading'); if(s) s.textContent = (t? t.tagline : 'Choose your links'); }

  /* ---- per-course progress indicators (all cards) ---- */
  const holesDone = stats.holesDone||[0,0,0,0];
  const HN = 9;
  for(let i=0;i<COURSES.length-1;i++){   // all real courses (exclude practice)
    const done = Math.min(HN, holesDone[i]||0);
    const fill = $m('course'+(i+1)+'Prog'), lbl = $m('course'+(i+1)+'ProgLbl');
    if(fill) fill.style.width = Math.round(done/HN*100)+'%';
    if(lbl)  lbl.textContent = done>=HN ? '✓ Course complete' : (done+' / '+HN+' holes');
  }

  /* red X markup for a locked card */
  const X = '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" fill="rgba(180,20,20,.22)" stroke="#d62828" stroke-width="6"/><path d="M32 32 L68 68 M68 32 L32 68" stroke="#d62828" stroke-width="9" stroke-linecap="round"/></svg>';

  /* Show only this tour's cards; hide the rest. Within a tour, each map unlocks
     the next (first map open when the tour itself is unlocked). */
  const tourCourses = t ? t.courses : [0,1,2,3,4];
  for(let ci=0; ci<COURSES.length-1; ci++){   // all real courses (exclude practice)
    const card = $m('course'+(ci+1));
    if(!card) continue;
    const inTour = tourCourses.includes(ci);
    card.style.display = inTour ? '' : 'none';
    if(!inTour) continue;
    const pos = tourCourses.indexOf(ci);       // position within the tour (0-based)
    const open = courseUnlocked(ci);
    const playBtn=$m('course'+(ci+1)+'Play'), lockEl=$m('course'+(ci+1)+'Lock'), xEl=$m('course'+(ci+1)+'X');
    card.classList.toggle('locked', !open);
    if(playBtn) playBtn.style.display = open ? '' : 'none';
    if(lockEl){
      lockEl.style.display = open ? 'none' : '';
      if(!open && pos>0){ const prevName = COURSES[tourCourses[pos-1]].name; lockEl.textContent = '🔒 Birdie every hole on '+prevName+' to unlock'; }
    }
    if(xEl) xEl.innerHTML = open ? '' : X;
  }

  /* ===== NEW-COURSE UNLOCK REVEAL =====
     If a course just unlocked, momentarily show it still locked (X + lock badge),
     then break the lock off with a shake + sound so the player sees it open. */
  if(window._unlockReveal!=null && tourCourses.includes(window._unlockReveal)){
    const ci = window._unlockReveal; window._unlockReveal = null;
    const card = $m('course'+(ci+1));
    const xEl  = $m('course'+(ci+1)+'X');
    const lockEl = $m('course'+(ci+1)+'Lock');
    const playBtn = $m('course'+(ci+1)+'Play');
    if(card && xEl){
      // 1. put the card back into its locked look to start
      card.classList.add('locked');
      xEl.innerHTML = X;
      if(lockEl){ lockEl.style.display=''; lockEl.textContent='🔒 UNLOCKING…'; }
      if(playBtn) playBtn.style.display='none';
      // 2. after a beat, break the lock off
      setTimeout(()=>{
        try{ SFX.unlock && SFX.unlock(); }catch(e){}
        xEl.classList.add('lockBreak');            // X shatters + flies off (CSS)
        card.classList.add('unlockPop');           // card pops/glows
        if(lockEl) lockEl.classList.add('lockBadgeBreak');
        // 3. once the break finishes, clear to the normal unlocked state
        setTimeout(()=>{
          card.classList.remove('locked','unlockPop');
          xEl.classList.remove('lockBreak'); xEl.innerHTML='';
          if(lockEl){ lockEl.classList.remove('lockBadgeBreak'); lockEl.style.display='none'; }
          if(playBtn) playBtn.style.display='';
          try{ SFX.roundFanfare && SFX.roundFanfare(); }catch(e){}
        }, 1100);
      }, 650);
      // make sure the newly unlocked card is scrolled into view
      try{ card.scrollIntoView({behavior:'smooth', block:'center'}); }catch(e){}
    }
  }

  inMenu = true;
  if(!petalRAF) petalRAF = requestAnimationFrame(petalLoop);
}
function enterWarmup(){
  practiceMode = true;
  rangeMode = true;
  if(MP){ clearInterval(MP.clockTimer); clearInterval(MP._turnBeat); MP=null; }
  { const h=$m('mpHud'); if(h) h.style.display='none'; const sb=$m('mpBoard'); if(sb) sb.classList.remove('show'); const sp=$m('skinPot'); if(sp) sp.classList.remove('show'); }
  courseIdx = PRACTICE_CI;
  inMenu = false;
  $m('menuScreen').style.display='none';
  $m('courseScreen').style.display='none';
  { const ts=$m('tourScreen'); if(ts) ts.style.display='none'; }
  { const cn=$m('controlsNote'); if(cn) cn.style.display='flex'; }
  sizeCanvas();
  ac(); startMusic();
  roundDiffs=[]; roundHoleDiffs=[]; birdieStreak=0;
  rangeShots = 0; rangeBest = null;
  startHole(0);
}
function enterGame(ci){
  ci = ci||0;
  /* gate: the course must be unlocked within its tour (prior map in the tour complete) */
  if(!courseUnlocked(ci)) return;
  practiceMode = false;
  rangeMode = false;
  if(MP){ clearInterval(MP.clockTimer); clearInterval(MP._turnBeat); MP=null; }
  { const h=$m('mpHud'); if(h) h.style.display='none'; const sb=$m('mpBoard'); if(sb) sb.classList.remove('show'); const sp=$m('skinPot'); if(sp) sp.classList.remove('show'); }
  courseIdx = ci;
  inMenu = false;
  $m('menuScreen').style.display='none';
  $m('courseScreen').style.display='none';
  { const ts=$m('tourScreen'); if(ts) ts.style.display='none'; }
  { const cn=$m('controlsNote'); if(cn) cn.style.display='flex'; }
  sizeCanvas();                       /* lock crisp resolution now the canvas is visible/sized */
  ac(); startMusic();
  roundDiffs=[]; roundHoleDiffs=[]; birdieStreak=0;
  startHole(0);
}
/* ============================================================================
   LOCAL MULTIPLAYER (pass & play) — 1-4 players take turns, 1v1v1v1 or 2v2.
   Each player keeps their own ball; on a turn switch we swap ball state in/out.
   A hole ends when everyone has holed out; lowest total over 9 holes wins
   (in teams, the lower combined team total wins).
   ============================================================================ */
const MP_COLORS = ['#ffd84d','#4aa3ff','#ff7a4a','#7ed957'];   // P1..P4 seat colors
const MP_SHOT_MS = 25000;
let MP = null;   // { on, mode, players:[{name,team,color,ball,strokes,holed,total}], turn, courseIdx, holeIdx, deadline }

function buildMpPlayers(){
  const wrap = $m('mpPlayers'); if(!wrap) return;
  const n = MP_setup.count, teams = MP_setup.mode==='teams';
  wrap.innerHTML='';
  for(let i=0;i<n;i++){
    const team = teams ? (i%2) : null;
    MP_setup.names[i] = MP_setup.names[i] || ('Player '+(i+1));
    if(teams) MP_setup.teams[i] = team;
    const card = document.createElement('div');
    card.className = 'mpCard' + (teams ? (team===0?' teamA':' teamB') : '');
    card.innerHTML = `
      <div class="mpAv" style="background:${MP_COLORS[i]}">${i+1}</div>
      <input maxlength="12" value="${MP_setup.names[i]}" data-i="${i}">
      ${teams ? `<span class="mpTeam ${team===0?'tA':'tB'}" data-i="${i}">${team===0?'TEAM A':'TEAM B'}</span>` : ''}`;
    wrap.appendChild(card);
  }
  wrap.querySelectorAll('input').forEach(inp=> inp.oninput = e=>{ MP_setup.names[+e.target.dataset.i]=e.target.value; });
  wrap.querySelectorAll('.mpTeam').forEach(t=> t.onclick = e=>{
    const i=+e.target.dataset.i; MP_setup.teams[i] = MP_setup.teams[i]===0?1:0; buildMpPlayers();
  });
}
const MP_setup = { count:4, mode:'ffa', scoreMode:'stroke', courseIdx:0, names:[], teams:[] };

function showMultiplayer(){
  inMenu = true;
  $m('menuScreen').style.display='none';
  $m('mpScreen').style.display='flex';
  // online only: open straight into the lobby (local pass-and-play is retired; you can add
  // local players from inside the online lobby instead)
  const setup = $m('mpSetup'); if(setup) setup.style.display='none';
  const startBtn = $m('mpStart'); if(startBtn) startBtn.style.display='none';
  const online = $m('mpOnline'); if(online) online.style.display='block';
  openLobbyScreen(true);
  initPetals(); if(!petalRAF) petalRAF = requestAnimationFrame(petalLoop);
}

/* retained for safety; online is the only path now */
function setMpMode(mode){
  const online = $m('mpOnline'); if(online) online.style.display='block';
  const setup = $m('mpSetup'); if(setup) setup.style.display='none';
  const startBtn = $m('mpStart'); if(startBtn) startBtn.style.display='none';
  openLobbyScreen(true);
}

function startMultiplayerMatch(){
  const n = MP_setup.count, teams = MP_setup.mode==='teams';
  // in 2v2 we need 4 players
  const count = teams ? 4 : n;
  const players = [];
  for(let i=0;i<count;i++){
    players.push({
      name: (MP_setup.names[i]||('Player '+(i+1))).trim() || ('Player '+(i+1)),
      team: teams ? (MP_setup.teams[i] ?? (i%2)) : null,
      color: MP_COLORS[i],
      skin:(stats.equippedSkin||'white'),
      ball:null, strokes:0, holed:false, total:0, holeStrokes:0, totalPrev:0,
      matchPoints:0,  // for match play: points won on holes
      skins:0         // for skins: skins won
    });
  }
  MP = { on:true, mode:MP_setup.mode, scoreMode:MP_setup.scoreMode, courseIdx:MP_setup.courseIdx, players, turn:0, holeIdx:0, deadline:0, clockTimer:null, skinPot:1 };
  practiceMode=false; rangeMode=false; courseIdx=MP_setup.courseIdx; inMenu=false;
  $m('mpScreen').style.display='none';
  { const cn=$m('controlsNote'); if(cn) cn.style.display='flex'; }
  { const h=$m('mpHud'); if(h) h.style.display='flex'; const sb=$m('mpBoard'); if(sb) sb.classList.add('show'); }
  { const nb=$m('nextHoleBtn'); if(nb) nb.style.display='none'; }   // no test-skip in MP
  sizeCanvas(); ac(); startMusic();
  mpStartHole(0);
}

function mpFreshBall(){
  return {x:TEE.x, y:TEE.y, z:0, vx:0, vy:0, vz:0, air:false, moving:false, sanded:false,
          gold:false, spin:0, shape:0, rimming:false, grazed:false};
}

function mpStartHole(hi){
  MP.holeIdx = hi;
  MP.players.forEach(p=>{ p.holed=false; p.strokes=0; p.ball=null; });
  MP.turn = 0;
  startHole(hi, true);                 // load the hole (no flyover in MP)
  { const nb=$m('nextHoleBtn'); if(nb) nb.style.display='none'; }   // no test-skip in MP
  // give every player a fresh ball at the tee
  MP.players.forEach(p=> p.ball = mpFreshBall());
  MP._holeIntroUntil = Date.now() + 2700;   // suppress turn banner while hole intro card is up
  mpLoadPlayer(0);
  mpRenderBoard();
}

/* swap a player's ball into the live engine and set up their shot */
function mpLoadPlayer(idx){
  MP.turn = idx;
  const p = MP.players[idx];
  ball = p.ball;
  strokes = p.strokes;
  state = ST.AIM;
  aimAngle = Math.atan2(PIN.y-ball.y, PIN.x-ball.x);
  spin=0; shape=0; pullShape=0;
  if(typeof resetPuttPressure==='function') resetPuttPressure();
  applyAutoClub();
  if(typeof hideMeters==='function') hideMeters();
  refreshPrediction();
  mpShowTurn();
  mpRenderBoard();

  /* ONLINE: only the player whose seat this is may control. For everyone else the seat is
     driven by network shot events, so lock input and don't run the local shot clock. */
  if(MP.online){
    const mine = MP.mySeats ? MP.mySeats.has(p.seat) : (p.seat === MP.mySeat);
    MP._inputLocked = !mine;
    if(mine){
      try{ SFX.yourTurn && SFX.yourTurn(); }catch(e){}   // audible alert: you're up
      mpArmClock();
    } else {
      // not my turn: stop my clock and show a neutral "waiting" dash
      clearInterval(MP.clockTimer);
      { const c=$m('mpClock'); if(c){ c.textContent='–'; c.classList.remove('low','danger'); } }
      setHint(p.name + ' is playing…');
      // in local mock mode, ask the mock transport to produce this seat's shot
      if(NET.mode==='local' && p.seat!==MP.mySeat){
        setTimeout(()=>{ if(MP && MP.turn===idx) NET.requestBotShot(p.seat, ball, PIN); }, 900);
      }
    }
    return;
  }
  try{ SFX.yourTurn && SFX.yourTurn(); }catch(e){}   // local hot-seat: signal the handoff
  mpArmClock();
}

function mpShowTurn(){
  const p = MP.players[MP.turn];
  $m('mpTurnName').textContent = p.name + (p.team!=null?(' · '+(p.team===0?'A':'B')):'');
  document.querySelector('#mpTurn .mpDot').style.background = p.color;
  // Don't stack the "to play" banner on top of the hole intro card
  if(!MP._holeIntroUntil || Date.now() >= MP._holeIntroUntil){
    showBanner(p.name+' to play', p.color);
  }
}

function mpArmClock(){
  clearInterval(MP.clockTimer);
  MP.deadline = Date.now()+MP_SHOT_MS;
  MP._lastTickSec = null;                 // so we play one sound per whole second
  { const c=$m('mpClock'); if(c){ c.textContent = Math.ceil(MP_SHOT_MS/1000); c.classList.remove('low','danger'); } }  // reset display at once
  MP.clockTimer = setInterval(()=>{
    const left = Math.max(0, MP.deadline - Date.now());
    const s = Math.ceil(left/1000);
    const total = MP_SHOT_MS/1000;
    const urgency = 1 - (left/MP_SHOT_MS);          // 0 at start → 1 at expiry
    const c = $m('mpClock');
    if(c){
      c.textContent = s;
      c.classList.toggle('low', s<=8 && s>5);
      c.classList.toggle('danger', s<=5);
      { const hud=$m('mpHud'); if(hud) hud.classList.toggle('clockDanger', s<=5); }
    }
    // one audio cue per whole second as the clock ticks down — only in the last ~10s so it
    // builds suspense without being annoying all turn
    if(s !== MP._lastTickSec){
      MP._lastTickSec = s;
      if(s<=10 && s>0){
        try{
          if(s<=5){ SFX.clockHeart && SFX.clockHeart((6-s)/5); }   // heartbeat, intensifying
          else    { SFX.clockTick  && SFX.clockTick((10-s)/10); }  // accelerating tick
        }catch(e){}
      }
    }
    if(left<=0){
      clearInterval(MP.clockTimer);
      try{ SFX.clockExpire && SFX.clockExpire(); }catch(e){}
      mpAutoShot();
    }
  }, 100);
}

/* timeout: fire a gentle safe shot toward the pin so play never stalls */
function mpAutoShot(){
  if(state!==ST.AIM) return;            // mid-swing already, let it resolve
  showBanner('Out of time!', '#ff8a7a');
  aimAngle = Math.atan2(PIN.y-ball.y, PIN.x-ball.x);
  spin=0; shape=0; pullShape=0;
  // ~45% power lay-up via the normal fire path
  if(typeof fireShotWithPower==='function') fireShotWithPower(45);
  else { pendingPower = 45; fireShot(); }
}

/* called from finishShot/holed when the active player's ball comes to rest in MP */
function mpAfterShot(wasHoled){
  clearInterval(MP.clockTimer);
  { const hud=$m('mpHud'); if(hud) hud.classList.remove('clockDanger'); const c=$m('mpClock'); if(c) c.classList.remove('low','danger'); }
  const p = MP.players[MP.turn];
  p.ball = ball;                        // store updated ball
  p.strokes = strokes;
  p.total = (p.totalPrev||0) + strokes; // running total incl this hole so far
  if(wasHoled){ p.holed = true; p.holeStrokes = strokes; }
  mpRenderBoard();

  /* ONLINE: if this was MY seat's shot, broadcast the resolved result. The turn-advance
     then happens the same way locally; remote peers apply the result and advance in step. */
  if(MP.online && typeof MP_broadcastResolvedShot==='function' && (MP.mySeats ? MP.mySeats.has(p.seat) : p.seat===MP.mySeat)){
    MP_broadcastResolvedShot(p.seat, ball, strokes, wasHoled);
  }

  // everyone holed? -> next hole
  if(MP.players.every(pl=>pl.holed)){
    MP.players.forEach(pl=>{ pl.totalPrev = (pl.totalPrev||0)+pl.holeStrokes; });
    setTimeout(()=>mpHoleComplete(), 800);
    return;
  }
  // TURN ADVANCE. Online: only the HOST decides the next turn and broadcasts it; non-hosts
  // wait for that authoritative 'turn' message (prevents split-brain freezes). Offline/local:
  // advance directly.
  if(MP.online){
    if(MP.isHost){ setTimeout(()=>mpHostAdvance(), 700); }
    // non-host: do nothing — the host will tell us whose turn is next via onTurn
  } else {
    setTimeout(()=>{
      let next = MP.turn;
      do { next = (next+1)%MP.players.length; } while(MP.players[next].holed);
      mpLoadPlayer(next);
    }, 700);
  }
}

/* HOST ONLY: compute the next turn, broadcast it to everyone, and apply it locally.
   This is the single source of truth for whose turn it is in an online match. */
function mpHostAdvance(){
  if(!(MP && MP.online && MP.isHost)) return;
  if(MP.players.every(pl=>pl.holed)){
    MP.players.forEach(pl=>{ pl.totalPrev = (pl.totalPrev||0)+pl.holeStrokes; });
    mpHoleComplete();
    return;
  }
  let next = MP.turn;
  do { next = (next+1)%MP.players.length; } while(MP.players[next].holed);
  // tell everyone (and ourselves) the authoritative next turn
  MP._turnSeq = (MP._turnSeq||0) + 1;
  try{ NET.sendTurn && NET.sendTurn({ turnSeat: MP.players[next].seat, holeIdx: MP.holeIdx, seq: MP._turnSeq }); }catch(e){}
  mpLoadPlayer(next);
}

/* apply an authoritative turn message from the host (non-host clients) */
function mpApplyTurn(evt){
  if(!(MP && MP.online)) return;
  if(MP.isHost) return;                       // host already advanced locally; ignore echoes
  if(evt.seq!=null){ if(MP._turnSeqSeen!=null && evt.seq<=MP._turnSeqSeen) return; MP._turnSeqSeen = evt.seq; }
  if(evt.holeIdx!=null && evt.holeIdx!==MP.holeIdx) return;   // stale hole
  const idx = MP.players.findIndex(p=>p.seat===evt.turnSeat);
  if(idx<0) return;
  if(MP.turn===idx && !MP._inputLocked===MP.mySeats.has(evt.turnSeat)){
    // already on this turn with correct lock state — a heartbeat, nothing to do (avoids
    // re-playing the your-turn sound / resetting the clock every few seconds)
    return;
  }
  if(MP.turn===idx){
    // same turn index but maybe our lock drifted — just fix the lock, don't reload
    MP._inputLocked = !(MP.mySeats ? MP.mySeats.has(evt.turnSeat) : (evt.turnSeat===MP.mySeat));
    return;
  }
  MP._remoteCorrect = null;                   // any cosmetic replay is done; this is authoritative
  mpLoadPlayer(idx);
}
window.MP_applyTurn = mpApplyTurn;
window.MP_hostAdvance = mpHostAdvance;

function mpHoleComplete(){
  // Calculate match play points if in match play mode
  if(MP.scoreMode==='match'){
    if(MP.mode==='teams'){
      const teamA = MP.players.filter(p=>p.team===0).reduce((sum,p)=>sum+p.holeStrokes, 0);
      const teamB = MP.players.filter(p=>p.team===1).reduce((sum,p)=>sum+p.holeStrokes, 0);
      if(teamA < teamB){ MP.players.forEach(p=>{ if(p.team===0) p.matchPoints++; }); }
      else if(teamB < teamA){ MP.players.forEach(p=>{ if(p.team===1) p.matchPoints++; }); }
    } else {
      const best = Math.min(...MP.players.map(p=>p.holeStrokes));
      MP.players.forEach(p=>{ if(p.holeStrokes===best) p.matchPoints++; });
    }
  }
  // SKINS: lowest score wins the pot; a tie carries it to the next hole (pot grows)
  if(MP.scoreMode==='skins'){
    const best = Math.min(...MP.players.map(p=>p.holeStrokes));
    const winners = MP.players.filter(p=>p.holeStrokes===best);
    const pot = MP.skinPot||1;
    if(winners.length===1){
      winners[0].skins += pot;
      MP._lastSkin = { result:'won', winner:winners[0], pot, hole:MP.holeIdx };
      MP.skinPot = 1;                         // reset pot after a clean win
    } else {
      MP._lastSkin = { result:'carry', pot, nextPot:pot+1, hole:MP.holeIdx };
      MP.skinPot = pot + 1;                   // tie: carry over, pot grows
    }
    showSkinResult(MP._lastSkin);
    mpRenderBoard();
  }
  if(MP.holeIdx >= 8){ return mpMatchComplete(); }
  if(MP.scoreMode==='skins'){
    // give the skins reveal a moment to play before the next hole
    showBanner('Hole '+(MP.holeIdx+1)+' done!', '#7ed957');
    setTimeout(()=>mpStartHole(MP.holeIdx+1), 2200);
    return;
  }
  showBanner('Hole '+(MP.holeIdx+1)+' done!', '#7ed957');
  setTimeout(()=>mpStartHole(MP.holeIdx+1), 900);
}

function mpMatchComplete(){
  clearInterval(MP.clockTimer);
  let html='', title='';
  if(MP.scoreMode==='skins'){
    const sorted = MP.players.slice().sort((x,y)=>(y.skins||0)-(x.skins||0));
    const top = sorted[0].skins||0;
    const champs = sorted.filter(p=>(p.skins||0)===top);
    title = champs.length>1 ? 'Skins tied!' : (sorted[0].name+' takes the skins!');
    html = sorted.map(p=>`${p.name} — ${p.skins||0} ${(p.skins||0)===1?'skin':'skins'}`).join('   ');
    if((MP.skinPot||1)>1) html += `   ·   ${MP.skinPot} skins left on the table!`;
  } else if(MP.scoreMode==='match'){
    if(MP.mode==='teams'){
      const teamA = MP.players.filter(p=>p.team===0).reduce((sum,p)=>sum+p.matchPoints, 0);
      const teamB = MP.players.filter(p=>p.team===1).reduce((sum,p)=>sum+p.matchPoints, 0);
      title = teamA===teamB?'Tie!':(teamA>teamB?'Team A wins!':'Team B wins!');
      html = `Team A: ${teamA} pts · Team B: ${teamB} pts`;
    } else {
      const sorted = MP.players.slice().sort((x,y)=>y.matchPoints-x.matchPoints);
      title = sorted[0].name+' wins!';
      html = sorted.map((p,i)=>`${i+1}. ${p.name} — ${p.matchPoints} pts`).join('   ');
    }
  } else {
    if(MP.mode==='teams'){
      let a=0,b=0; MP.players.forEach(p=> (p.team===0?a+=p.totalPrev:b+=p.totalPrev));
      title = a===b?'Tie!':(a<b?'Team A wins!':'Team B wins!');
      html = `Team A: ${a} · Team B: ${b}`;
    } else {
      const sorted = MP.players.slice().sort((x,y)=>x.totalPrev-y.totalPrev);
      title = sorted[0].name+' wins!';
      html = sorted.map((p,i)=>`${i+1}. ${p.name} — ${p.totalPrev}`).join('   ');
    }
  }
  showBanner(title, '#ffd84d');
  // reuse the end card
  const ec=$m('endCard');
  $m('cardTitle') && ($m('cardTitle').textContent = title);
  $m('cardEyebrow') && ($m('cardEyebrow').textContent = 'MULTIPLAYER · FINAL');
  const btn=$m('againBtn'); if(btn){ btn.textContent='Back to menu'; btn.dataset.action='mpdone'; }
  const nr=$m('nextHoleRow'); if(nr) nr.classList.remove('show');
  if(ec) ec.classList.add('show');
}

/* a player's score RELATIVE TO PAR across the holes played so far (E, +1, -5, …) */
function mpToPar(p, i){
  const holes = COURSES[MP.courseIdx].holes;
  // par for all completed holes (0 .. holeIdx-1)
  let parDone = 0;
  for(let h=0; h<MP.holeIdx; h++){ parDone += (holes[h] ? holes[h].par : 4); }
  // strokes for completed holes = totalPrev; current hole strokes (live for active, stored otherwise)
  const completedStrokes = p.totalPrev || 0;
  let curStrokes = 0, curParCounts = false;
  if(p.holed){ curStrokes = p.holeStrokes; curParCounts = true; }            // finished this hole
  else if(i===MP.turn){ curStrokes = strokes; curParCounts = strokes>0; }    // playing now
  else { curStrokes = p.strokes||0; curParCounts = (p.strokes||0)>0; }       // mid-hole, waiting
  const curPar = curParCounts ? (holes[MP.holeIdx] ? holes[MP.holeIdx].par : 4) : 0;
  const totalStrokes = completedStrokes + curStrokes;
  const totalPar = parDone + curPar;
  return totalStrokes - totalPar;   // negative = under par
}
function fmtToPar(d){ return d===0 ? 'E' : (d>0 ? '+'+d : ''+d); }

function mpRenderBoard(){
  const b=$m('mpBoard'); if(!b||!MP) return;
  b.innerHTML = MP.players.map((p,i)=>{
    let display, cls='';
    if(MP.scoreMode==='match'){
      display = (p.matchPoints||0) + ' pt';
    } else if(MP.scoreMode==='skins'){
      const s = p.skins||0;
      display = s + (s===1?' skin':' skins'); cls='skin';
    } else {
      const d = mpToPar(p, i);
      display = fmtToPar(d);
      cls = d<0 ? 'under' : (d>0 ? 'over' : 'even');
    }
    return `<div class="mpb ${i===MP.turn?'act':''}">
              <span class="pd" style="background:${p.color}"></span>
              <span class="mpbName">${p.name.slice(0,7)}</span>
              <span class="mpbScore ${cls}">${display}${p.holed?' ✓':''}</span>
            </div>`;
  }).join('');
  const d=document.querySelector('#mpTurn .mpDot'); if(d && MP.players[MP.turn]) d.style.background = MP.players[MP.turn].color;
  updateSkinPot();
}

/* keep the gold pot chip in sync with the current carryover value */
function updateSkinPot(){
  const el=$m('skinPot'); if(!el) return;
  if(!MP || MP.scoreMode!=='skins'){ el.classList.remove('show'); return; }
  el.classList.add('show');
  const val=$m('skinPotVal'); if(val) val.textContent = MP.skinPot||1;
  el.classList.toggle('carry', (MP.skinPot||1) > 1);
}

/* dramatic center reveal when a hole's skins are decided (won or carried over) */
function showSkinResult(info){
  if(!info) return;
  const rev=$m('skinReveal'), card=$m('skinRevealCard');
  const icon=$m('skinRevealIcon'), title=$m('skinRevealTitle'), sub=$m('skinRevealSub');
  if(!rev) return;
  if(info.result==='won'){
    rev.classList.remove('carry');
    if(icon) icon.textContent='🏆';
    if(title) title.textContent = info.winner.name.toUpperCase()+' WINS THE HOLE';
    if(sub) sub.textContent = '+'+info.pot+' '+(info.pot===1?'skin':'skins');
    try{ SFX.roundFanfare && SFX.roundFanfare(); }catch(e){}
  } else {
    rev.classList.add('carry');
    if(icon) icon.textContent='🔥';
    if(title) title.textContent = 'PUSH — POT CARRIES OVER';
    if(sub) sub.textContent = 'Hole '+(info.hole+2)+' now worth '+info.nextPot+' skins';
    try{ SFX.unlock && SFX.unlock(); }catch(e){}   // tense rising sting for a carryover
  }
  // restart the pop animation
  rev.classList.remove('show'); void rev.offsetWidth; rev.classList.add('show');
  clearTimeout(rev._t);
  rev._t = setTimeout(()=>{ rev.classList.remove('show'); updateSkinPot(); }, 2000);
}

/* fire a shot with an explicit power (for timeout auto-shots) — clean contact, straight */
function fireShotWithPower(pct){
  pendingPower = pct;
  accVal = 0;                      // dead-center contact, no slice/hook
  paceGrade = {label:'', perfect:false};
  pullShape = 0; shape = 0;
  if(typeof fireShot==='function') fireShot();
}


/* ===== ONLINE MP CONFIG ===== Cloudflare Worker backend (live) */
const PARTY_CONFIGURED = true;    // multiplayer server is deployed
let FORCE_LOCAL_NET = false;      // dev: force the in-page mock transport

/* ============================================================================
   BIRDIE BLITZ — ONLINE MULTIPLAYER NETWORK LAYER  (self-contained)
   ----------------------------------------------------------------------------
   This block is a WRAPPER around the existing local (hotseat) MP system. It does
   NOT touch course data, rendering, physics, or club logic. It only:
     1. Provides a 4-digit lobby (create / join) over a pluggable transport.
     2. Turns each resolved shot into a small event and syncs it to other players.
     3. Drives remote seats from incoming events; you only control your own seat.

   Editing the game later is unaffected: new courses/holes/greens still produce
   the same shot event shape, so this layer never needs to change.

   TRANSPORTS:
     - NET.local : an in-page mock (two simulated clients) for testing with no server.
     - NET.party : PartyKit WebSocket client for real free online play.
   Switch with NET.use('local'|'party'). Default is 'local' until you deploy.
   ============================================================================ */
const NET = (function(){
  let transport = null;           // active transport object
  let mode = 'local';             // 'local' | 'party'
  let handlers = {};              // event handlers: onPlayers, onStart, onShot, onHole, onChat, onClose, onError
  let me = { id:null, name:'You', seat:null, host:false };
  let room = { code:null, players:[], open:false, settings:null };

  function on(ev, fn){ handlers[ev] = fn; }
  function emit(ev, data){ if(handlers[ev]) handlers[ev](data); }

  /* ---- Multiplayer server host (Render, live). ---- */
  const PARTY_HOST = 'birdie-blitz-server.onrender.com';

  function code4(){ return String(Math.floor(1000 + Math.random()*9000)); }

  /* =========================================================================
     LOCAL MOCK TRANSPORT — simulates a second player in-page so the whole
     create/join/turn/shot flow is testable with no server. The "friend" plays
     gentle auto-shots so you can watch turns hand off.
     ========================================================================= */
  function makeLocalTransport(){
    let simTimer = null;
    const T = {
      kind:'local',
      createLobby(name, settings){
        me.host = true; me.seat = 0; me.name = name||'You';
        room.code = code4(); room.open = true; room.settings = settings;
        room.players = [{ id:'me', name:me.name, seat:0, host:true, ready:true }];
        setTimeout(()=>{ emit('onOpen', { code:room.code }); emit('onPlayers', room.players.slice()); }, 60);
        return room.code;
      },
      joinLobby(code, name){
        // mock: pretend we joined an existing host's room as seat 1
        me.host = false; me.seat = 1; me.name = name||'You';
        room.code = code; room.open = true;
        room.players = [
          { id:'host', name:'Host', seat:0, host:true, ready:true },
          { id:'me', name:me.name, seat:1, host:false, ready:true }
        ];
        setTimeout(()=>{ emit('onOpen', { code }); emit('onPlayers', room.players.slice()); }, 80);
        return true;
      },
      addMockFriend(){
        if(room.players.length>=4) return;
        const seat = room.players.length;
        room.players.push({ id:'bot'+seat, name:'Friend '+seat, seat, host:false, ready:true, bot:true });
        emit('onPlayers', room.players.slice());
      },
      setReady(){ /* mock: always ready */ },
      start(settings){
        room.open = false;
        emit('onStart', { settings, players: room.players.slice(), seed: (Date.now()&0xffff) });
      },
      sendShot(evt){
        // our own shot already applied locally; nothing to send in mock.
        // schedule the mock friends' shots when it's their turn (handled by game loop).
      },
      sendHole(evt){},
      sendTurn(evt){ /* mock: single device, turn handled locally */ },
      sendChat(t){ emit('onChat', { from:me.name, text:t }); },
      // the game asks the mock to produce a remote seat's shot
      requestBotShot(seat, ball, pin){
        // gentle lay-up toward the pin, slight randomness — returned via onShot
        const ang = Math.atan2(pin.y-ball.y, pin.x-ball.x) + (Math.random()-0.5)*0.18;
        emit('onShot', { seat, kind:'auto', power: 42+Math.random()*22, angle:ang });
      },
      close(){ if(simTimer) clearInterval(simTimer); room.open=false; emit('onClose',{}); }
    };
    return T;
  }

  /* =========================================================================
     PARTYKIT TRANSPORT — real free online play over WebSocket. Each lobby is a
     PartyKit "room" keyed by the 4-digit code. Messages are small JSON events.
     ========================================================================= */
  function makePartyTransport(){
    let ws = null;
    function connect(code){
      const proto = location.protocol==='https:' ? 'wss' : 'ws';
      ws = new WebSocket(`${proto}://${PARTY_HOST}/room/${code}`);
      ws.onopen = ()=> ws.send(JSON.stringify({ t:'hello', name:me.name, host:me.host, skin:(stats.equippedSkin||'white') }));
      ws.onmessage = (m)=>{
        let msg; try{ msg = JSON.parse(m.data); }catch{ return; }
        switch(msg.t){
          case 'players': room.players = msg.players; if(msg.you!==undefined && msg.you!==null) me.seat = msg.you; emit('onPlayers', msg.players); break;
          case 'open':    room.code = code; emit('onOpen', { code }); break;
          case 'start':   room.open=false; emit('onStart', msg); break;
          case 'shot':    emit('onShot', msg); break;
          case 'turn':    emit('onTurn', msg); break;
          case 'hole':    emit('onHole', msg); break;
          case 'chat':    emit('onChat', msg); break;
          case 'left':    emit('onPlayers', msg.players); break;
          case 'error':   emit('onError', msg); break;
        }
      };
      ws.onclose = ()=> emit('onClose', {});
      ws.onerror = (e)=> emit('onError', { message:'connection error' });
    }
    const send = (o)=>{ if(ws && ws.readyState===1) ws.send(JSON.stringify(o)); };
    return {
      kind:'party',
      createLobby(name, settings){
        me.host = true; me.name = name||'You'; room.code = code4(); room.settings = settings;
        connect(room.code);
        return room.code;
      },
      joinLobby(code, name){ me.host=false; me.name=name||'You'; connect(code); return true; },
      addMockFriend(){ /* n/a online */ },
      setReady(r){ send({ t:'ready', ready:r!==false }); },
      start(settings){ send({ t:'start', settings }); },
      sendShot(evt){ send(Object.assign({ t:'shot' }, evt)); },
      sendTurn(evt){ send(Object.assign({ t:'turn' }, evt)); },
      sendHole(evt){ send(Object.assign({ t:'hole' }, evt)); },
      sendChat(text){ send({ t:'chat', from:me.name, text }); },
      requestBotShot(){ /* no bots online */ },
      close(){ try{ ws && ws.close(); }catch{} }
    };
  }

  function use(m){
    mode = m;
    transport = (m==='party') ? makePartyTransport() : makeLocalTransport();
    return transport;
  }

  return {
    on, use, get mode(){ return mode; }, get me(){ return me; }, get room(){ return room; },
    get t(){ return transport || use(mode); },
    isOnline(){ return mode==='party'; },
    // convenience pass-throughs
    create(name, settings){ return this.t.createLobby(name, settings); },
    join(code, name){ return this.t.joinLobby(code, name); },
    start(settings){ return this.t.start(settings); },
    sendShot(evt){ return this.t.sendShot(evt); },
    sendTurn(evt){ return this.t.sendTurn && this.t.sendTurn(evt); },
    sendHole(evt){ return this.t.sendHole(evt); },
    addMockFriend(){ return this.t.addMockFriend && this.t.addMockFriend(); },
    requestBotShot(seat, ball, pin){ return this.t.requestBotShot && this.t.requestBotShot(seat, ball, pin); },
    close(){ return this.t.close && this.t.close(); }
  };
})();


/* ============================================================================
   ONLINE GLUE — connects the NET layer to the existing local MP turn system.
   Single on/off: MP.online is true only when a lobby launched an online match.
   When it's not your seat's turn, input is locked and the seat is driven by the
   shot events arriving over NET. Stroke play first; teams/match reuse MP later.
   ============================================================================ */
(function(){
  // --- wire NET event handlers once ---
  let wired = false;
  function wireNet(){
    if(wired) return; wired = true;

    NET.on('onOpen', (d)=>{ lobbyState.code = d.code; renderLobby(); });
    NET.on('onPlayers', (players)=>{ lobbyState.players = players; renderLobby(); });
    NET.on('onStart', (d)=>{ launchOnlineMatch(d); });
    NET.on('onShot', (evt)=>{ applyRemoteShot(evt); });
    NET.on('onTurn', (evt)=>{ mpApplyTurn(evt); });
    NET.on('onChat', (m)=>{ pushLobbyChat(m.from, m.text); });
    NET.on('onClose', ()=>{ if(lobbyState.open){ setLobbyHint('Connection closed.'); } });
    NET.on('onError', (e)=>{ setLobbyHint(e.message || 'Network error.'); });
  }

  // --- lobby state shown in the waiting room ---
  const lobbyState = { open:false, code:null, players:[], host:false, chat:[], localPlayers:[] };
  window.lobbyState = lobbyState;

  function setLobbyHint(t){ const e=$m('lobHint'); if(e) e.textContent = t; }
  function pushLobbyChat(from, text){ lobbyState.chat.push({from,text}); const box=$m('lobChat'); if(box){ box.innerHTML += `<div><b>${from}:</b> ${text}</div>`; box.scrollTop=box.scrollHeight; } }

  let _prevSeats = new Set();
  function renderLobby(){
    const codeEl = $m('lobCode'); if(codeEl) codeEl.textContent = lobbyState.code || '—';
    const players = lobbyState.players || [];
    const me = players.find(p=>p.seat===NET.me.seat);
    // Host status: if I created this lobby, I'm the host regardless of whether the player
    // list has arrived yet. Otherwise derive it from my entry in the list. (Without the
    // sticky flag, the first render before onPlayers fires would wrongly clear host and
    // hide the host controls + add-local button.)
    if(lobbyState.iCreated){ lobbyState.host = true; }
    else if(me){ lobbyState.host = !!me.host; }
    // if neither (list not in yet and I didn't create), leave the previous value as-is
    // host sees the FORMAT/COURSE pickers; joiners see the chosen course read-only
    const hostOpts = $m('lobHostOptions'); if(hostOpts) hostOpts.style.display = lobbyState.host ? 'block' : 'none';
    const roCourse = $m('lobCourseReadonly'); if(roCourse) roCourse.style.display = lobbyState.host ? 'none' : 'flex';
    const cn = $m('lobCourseName'); if(cn) cn.textContent = (COURSES[MP_setup.courseIdx]||{}).name || 'Sakura Links';
    const cnt = $m('lobCount');
    { const selfShown = (lobbyState.iCreated && !players.some(p=>p.seat===NET.me.seat)) ? 1 : 0;
      const total = players.length + selfShown + (lobbyState.localPlayers||[]).length;
      if(cnt) cnt.textContent = total + '/4'; }

    const list = $m('lobPlayers'); if(!list) return;
    list.innerHTML = '';
    // Build the networked-player list to display. If I created the lobby but the server's
    // player list hasn't arrived yet, show ME as Player 1 / HOST right away so the lobby
    // never looks empty while connecting.
    let netPlayers = players.slice();
    if(lobbyState.iCreated && !netPlayers.some(p=>p.seat===NET.me.seat)){
      netPlayers.push({ seat: NET.me.seat, name: (window._savedName||'You'), host:true, ready:false, _selfPlaceholder:true });
    }
    const seatsNow = new Set(netPlayers.map(p=>p.seat));
    // filled seats (networked players)
    netPlayers.slice().sort((a,b)=>a.seat-b.seat).forEach(p=>{
      const row = document.createElement('div');
      const isNew = !_prevSeats.has(p.seat) && _prevSeats.size>0;
      row.className = 'lobRow' + (isNew ? ' joining' : '');
      const readyChip = p.host ? '<span class="lobHost">HOST</span>'
        : `<span class="lobReadyChip ${p.ready?'yes':'no'}">${p.ready?'READY':'…'}</span>`;
      row.innerHTML = `<span class="lobAv" style="background:${MP_COLORS[p.seat]||'#888'}">${p.seat+1}</span>
                       <span class="lobName">${p.name||('Player '+(p.seat+1))}</span>${readyChip}`;
      list.appendChild(row);
    });
    // LOCAL players the host added (same device) — editable name + remove
    const baseSeat = netPlayers.length;
    (lobbyState.localPlayers||[]).forEach((nm, li)=>{
      const seat = baseSeat + li;
      const row = document.createElement('div');
      row.className = 'lobRow lobLocal';
      row.innerHTML = `<span class="lobAv" style="background:${MP_COLORS[seat]||'#888'}">${seat+1}</span>
                       <input class="lobLocalName" data-li="${li}" maxlength="12" value="${nm}">
                       <span class="lobLocalTag">LOCAL</span>
                       <button class="lobLocalDel" data-li="${li}" title="Remove">✕</button>`;
      list.appendChild(row);
    });
    // wire local name edits + removes
    list.querySelectorAll('.lobLocalName').forEach(inp=> inp.oninput = e=>{ lobbyState.localPlayers[+e.target.dataset.li] = e.target.value; });
    list.querySelectorAll('.lobLocalDel').forEach(b=> b.onclick = ()=>{ lobbyState.localPlayers.splice(+b.dataset.li,1); renderLobby(); });
    // empty slots up to 4
    const filled = netPlayers.length + (lobbyState.localPlayers||[]).length;
    for(let s=filled; s<4; s++){
      const row = document.createElement('div');
      row.className = 'lobRow empty';
      row.innerHTML = `<span class="lobAv">${s+1}</span><span class="lobName">Open slot…</span>`;
      list.appendChild(row);
    }
    _prevSeats = seatsNow;

    // host can add local players (same device); show the row only for the host and only if room
    { const lr=$m('lobLocalRow'); if(lr) lr.style.display = (lobbyState.host && filled<4) ? 'block' : 'none'; }

    // ready button reflects my state
    const rb = $m('lobReadyBtn');
    if(rb){
      const iAmReady = !!(me && me.ready);
      rb.classList.toggle('on', iAmReady);
      rb.textContent = iAmReady ? '✓ READY' : "I'M READY";
      // host doesn't need to ready up
      $m('lobReadyRow').style.display = lobbyState.host ? 'none' : 'flex';
    }
    // host start: enabled once everyone (non-host) is ready
    const startBtn = $m('lobStart');
    if(startBtn){
      const others = players.filter(p=>!p.host);
      const allReady = others.every(p=>p.ready);
      startBtn.style.display = lobbyState.host ? 'inline-flex' : 'none';
      startBtn.disabled = players.length < 1 || !allReady;
      startBtn.textContent = allReady ? 'START MATCH ⛳' : 'WAITING FOR READY…';
    }
    const waitMsg = $m('lobWait');
    if(waitMsg) waitMsg.style.display = lobbyState.host ? 'none' : 'block';
  }

  // ---- entry points from the UI ----
  function openLobbyScreen(embedded){
    wireNet();
    inMenu = true;
    if(!embedded){
      // legacy full-screen path (kept for safety); normally called embedded from the toggle
      $m('menuScreen') && ($m('menuScreen').style.display='none');
      $m('mpScreen') && ($m('mpScreen').style.display='flex');
    }
    // reset to the create/join view
    $m('lobCreateRow') && ($m('lobCreateRow').style.display='block');
    $m('lobRoom') && ($m('lobRoom').style.display='none');
    // pick transport: party if a host has been configured, else local mock
    NET.use((typeof FORCE_LOCAL_NET!=='undefined' && FORCE_LOCAL_NET) ? 'local'
            : (PARTY_CONFIGURED ? 'party' : 'local'));
    lobbyState.open = true; lobbyState.players=[]; lobbyState.chat=[];
    lobbyState.iCreated = false; lobbyState.host = false; lobbyState.localPlayers = [];
    // the "Add test friend" button is only meaningful in the in-page mock; hide it for real online play
    { const af=$m('lobAddFriend'); if(af) af.style.display = (NET.mode==='local') ? '' : 'none'; }
    setLobbyHint(NET.mode==='local'
      ? 'Test mode (server not deployed yet): use “＋ Add test friend”, then Start.'
      : 'Create a lobby and share the 4-digit code, or join a friend.');
    renderLobby();
  }
  window.openLobbyScreen = openLobbyScreen;
  window.renderLobby = renderLobby;

  function hostCreate(){
    const name = (($m('lobNameInput')&&$m('lobNameInput').value)||'You').trim().slice(0,12) || 'You';
    try{ window._savedName = name; saveProgress(); }catch(e){}
    const code = NET.create(name, { scoreMode: MP_setup.scoreMode, mode: MP_setup.mode, courseIdx: MP_setup.courseIdx });
    lobbyState.code = code; lobbyState.host = true; lobbyState.iCreated = true;
    $m('lobCreateRow') && ($m('lobCreateRow').style.display='none');
    $m('lobRoom') && ($m('lobRoom').style.display='block');
    renderLobby();
  }
  function joinByCode(){
    const name = (($m('lobNameInput')&&$m('lobNameInput').value)||'You').trim().slice(0,12) || 'You';
    try{ window._savedName = name; saveProgress(); }catch(e){}
    const code = (($m('lobJoinInput')&&$m('lobJoinInput').value)||'').trim();
    if(!/^\d{4}$/.test(code)){ setLobbyHint('Enter the 4-digit code.'); return; }
    NET.join(code, name);
    lobbyState.iCreated = false; lobbyState.host = false;
    $m('lobCreateRow') && ($m('lobCreateRow').style.display='none');
    $m('lobRoom') && ($m('lobRoom').style.display='block');
    setLobbyHint('Joining '+code+'…');
  }
  function hostStart(){
    NET.start({ scoreMode: MP_setup.scoreMode, mode: MP_setup.mode, courseIdx: MP_setup.courseIdx,
                localPlayers: (lobbyState.localPlayers||[]).slice(), hostSeat: NET.me.seat });
  }

  // ---- launch the actual match from lobby players ----
  function launchOnlineMatch(d){
    const lp = (d.players||lobbyState.players||[]).slice().sort((a,b)=>a.seat-b.seat);
    const settings = d.settings || { scoreMode:'stroke', courseIdx:0 };
    const localNames = (settings.localPlayers||[]);
    const hostSeat = settings.hostSeat;
    const players = lp.map((p,i)=>({
      name: p.name||('Player '+(i+1)),
      team: null,
      color: MP_COLORS[p.seat],
      seat: p.seat,
      local:false,
      skin: p.skin||'white',
      ball:null, strokes:0, holed:false, total:0, holeStrokes:0, totalPrev:0, matchPoints:0, skins:0
    }));
    // append the host's LOCAL players as extra seats after the networked ones; these are
    // controlled from the host's device (same screen, take turns).
    const baseSeat = lp.length;
    localNames.forEach((nm, li)=>{
      const seat = baseSeat + li;
      players.push({
        name: nm || ('Player '+(seat+1)), team:null, color: MP_COLORS[seat], seat,
        local:true, ownerSeat: hostSeat, skin:(stats.equippedSkin||'white'),
        ball:null, strokes:0, holed:false, total:0, holeStrokes:0, totalPrev:0, matchPoints:0, skins:0
      });
    });
    const sMode = settings.scoreMode || 'stroke';
    // which seats does THIS device control? my own seat, plus any local players I own (host).
    const mySeats = new Set([NET.me.seat]);
    if(hostSeat===NET.me.seat){ players.forEach(p=>{ if(p.local) mySeats.add(p.seat); }); }
    // TURN AUTHORITY: the host owns the turn order and broadcasts it; everyone else obeys.
    // hostSeat comes from the start settings; fall back to the lowest seat present.
    const authSeat = (hostSeat!=null) ? hostSeat : Math.min(...players.map(p=>p.seat));
    const isHost = (NET.me.seat === authSeat);
    MP = { on:true, online:true, mySeat: NET.me.seat, mySeats, isHost, authSeat, mode:'ffa', scoreMode:sMode,
           courseIdx: settings.courseIdx||0, players, turn:0, holeIdx:0, deadline:0, clockTimer:null, skinPot:1 };
    practiceMode=false; rangeMode=false; courseIdx = MP.courseIdx; inMenu=false;
    lobbyState.open=false;
    $m('mpScreen') && ($m('mpScreen').style.display='none');
    { const cn=$m('controlsNote'); if(cn) cn.style.display='flex'; }
    { const h=$m('mpHud'); if(h) h.style.display='flex'; const sb=$m('mpBoard'); if(sb) sb.classList.add('show'); }
    { const nb=$m('nextHoleBtn'); if(nb) nb.style.display='none'; }
    sizeCanvas(); ac(); startMusic();
    mpStartHole(0);
    // HOST TURN HEARTBEAT: every few seconds the host re-broadcasts the current authoritative
    // turn. If a turn message was ever dropped, a drifted client resyncs within seconds — so a
    // split-brain freeze can't persist. Cheap (one tiny message) and only the host sends it.
    if(MP && MP.isHost){
      clearInterval(MP._turnBeat);
      MP._turnBeat = setInterval(()=>{
        if(!(MP && MP.online && MP.isHost)) return;
        const cur = MP.players[MP.turn]; if(!cur) return;
        MP._turnSeq = (MP._turnSeq||0) + 1;
        try{ NET.sendTurn && NET.sendTurn({ turnSeat: cur.seat, holeIdx: MP.holeIdx, seq: MP._turnSeq, beat:true }); }catch(e){}
      }, 4000);
    }
  }

  /* =========================================================================
     SHOT SYNC. When my seat's shot resolves, broadcast the RESULT (resting
     ball + strokes + holed). Remote clients apply it to that seat's ball and
     advance the turn. We send the resolved resting position so flight outcome
     is identical everywhere with no random divergence.
     ========================================================================= */
  /* ============================================================================
     NETCODE (clean model). Authoritative & simple:
       • The SHOOTER resolves their shot locally, then broadcasts ONCE, immediately:
         { seat, n, launch, rest, strokes, holed, penalty }
         - n  = per-seat shot counter (cheap dedupe; no timers, no retries)
         - launch = how to animate the flight (cosmetic on spectators)
         - rest/holed/penalty = the AUTHORITATIVE outcome (always wins)
       • SPECTATORS replay the flight for smoothness, but the replay NEVER decides
         holed/water — when it settles we apply the authoritative outcome and advance.
       • A water penalty keeps the same player on turn (penalty:true → no advance).
     This removes the retry/watchdog/dual-broadcast layers that caused lag & glitches.
     ============================================================================ */
  window.MP_broadcastResolvedShot = function(seat, ball, strokes, holed, penalty){
    if(!(MP && MP.online)) return;
    const mine = MP.mySeats ? MP.mySeats.has(seat) : (seat === MP.mySeat);
    if(!mine) return;                              // only broadcast seats THIS device controls
    const launch = MP._pendingShot || null;
    MP._pendingShot = null;
    MP._sentN = MP._sentN || {};
    const n = (MP._sentN[seat] = (MP._sentN[seat]||0) + 1);
    NET.sendShot({
      seat, n,
      launch,                                       // animate the flight on spectators (cosmetic)
      rest: { x:ball.x, y:ball.y, z:0 },            // AUTHORITATIVE resting spot
      strokes, holed: !!holed, penalty: !!penalty
    });
  };

  // apply an incoming shot from another player's device
  function applyRemoteShot(evt){
    if(!(MP && MP.online)) return;
    const seat = evt.seat;
    const ownSeat = MP.mySeats ? MP.mySeats.has(seat) : (seat === MP.mySeat);
    if(ownSeat) return;                            // ignore echoes of seats we control
    const p = MP.players.find(pl=>pl.seat===seat); if(!p) return;
    // DEDUPE: per-seat monotonic counter. Ignore anything we've already applied or older.
    if(evt.n != null){
      MP._recvN = MP._recvN || {};
      if(MP._recvN[seat] != null && evt.n <= MP._recvN[seat]) return;
      MP._recvN[seat] = evt.n;
    }
    // mock-bot path (local testing): power/angle → drive a real fired shot
    if(evt.kind==='auto' && MP.turn===idxOfSeat(seat)){
      aimAngle = evt.angle; spin=0; shape=0; pullShape=0;
      if(typeof fireShotWithPower==='function') fireShotWithPower(evt.power);
      return;
    }
    // AUTHORITATIVE TURN SYNC: a shot arriving for a seat means that seat was the active player
    // on the shooter's device. If our turn pointer drifted (a dropped earlier message), snap it
    // to this seat so we still SHOW the shot and recover — this is what fixes "missing shots".
    const seatIdx = idxOfSeat(seat);
    if(seatIdx>=0 && MP.turn !== seatIdx && !MP.players[seatIdx].holed){
      MP.turn = seatIdx;
      MP._inputLocked = !(MP.mySeats ? MP.mySeats.has(seat) : (seat===MP.mySeat));
      if(typeof mpShowTurn==='function') mpShowTurn();
    }
    const isTheirTurn = (MP.turn === idxOfSeat(seat));
    // store the authoritative outcome on the player regardless of replay
    const applyAuthoritative = ()=>{
      p.ball = Object.assign(p.ball||{}, { x:evt.rest.x, y:evt.rest.y, z:0, vx:0,vy:0,vz:0, air:false, moving:false });
      p.strokes = evt.strokes; p.holed = !!evt.holed;
      if(evt.holed) p.holeStrokes = evt.strokes;
    };
    // SMOOTH FLIGHT: replay the shot visually, then snap to the authoritative rest on settle.
    if(evt.launch && isTheirTurn && !evt.penalty){
      const L = evt.launch;
      ball = p.ball;
      ball.x = L.from.x; ball.y = L.from.y; ball.z = 0;
      ball.vx = L.vx; ball.vy = L.vy; ball.vz = L.vz; ball.air = L.air;
      ball.spin = L.spin||0; ball.shape = L.shape||0;
      ball.moving = true; ball.rimming=false; ball.grazed=false; ball.bounceN=0;
      lastSafe = { x:L.from.x, y:L.from.y };
      strokes = evt.strokes;
      state = ST.MOVING;
      // the replay is cosmetic; this is what actually resolves the turn when it settles
      MP._remoteCorrect = { seat, rest:evt.rest, strokes:evt.strokes, holed:!!evt.holed };
      if(typeof mpRenderBoard==='function') mpRenderBoard();
      return;
    }
    // WATER PENALTY: same player keeps shooting — snap ball, splash, do NOT advance.
    if(evt.penalty){
      MP._remoteCorrect = null;                    // cancel any cosmetic replay in progress
      applyAuthoritative();
      if(isTheirTurn){ ball = p.ball; strokes = p.strokes; state = ST.AIM; }
      showBanner('SPLASH! +1', '#54bdf0');
      if(typeof mpRenderBoard==='function') mpRenderBoard();
      return;
    }
    // NO-LAUNCH path (or not their turn yet): snap authoritative, advance if it's their turn.
    applyAuthoritative();
    if(isTheirTurn){
      ball = p.ball; strokes = p.strokes;
      if(typeof mpRenderBoard==='function') mpRenderBoard();
      advanceAfterRemote(evt.holed);
    } else {
      if(typeof mpRenderBoard==='function') mpRenderBoard();
    }
  }
  function idxOfSeat(seat){ return MP.players.findIndex(p=>p.seat===seat); }

  // a remote seat's shot resolved on a spectator. Only the HOST advances + broadcasts the
  // turn; non-hosts wait for the authoritative 'turn' message. This kills split-brain freezes.
  function advanceAfterRemote(wasHoled){
    clearInterval(MP.clockTimer);
    if(MP.isHost){
      setTimeout(()=>mpHostAdvance(), 500);
    }
    // non-host: do nothing — wait for onTurn from the host
  }
  window.MP_advanceAfterRemote = advanceAfterRemote;
  window.MP_applyRemoteShot = applyRemoteShot;

  // ---- wire lobby UI buttons (guarded; only if elements exist) ----
  function wireLobbyButtons(){
    $m('lobCreateBtn') && ($m('lobCreateBtn').onclick = hostCreate);
    $m('lobJoinBtn') && ($m('lobJoinBtn').onclick = joinByCode);
    $m('lobStart') && ($m('lobStart').onclick = hostStart);
    $m('lobAddFriend') && ($m('lobAddFriend').onclick = ()=>{ NET.addMockFriend(); });
    $m('lobAddLocal') && ($m('lobAddLocal').onclick = ()=>{
      const used = (lobbyState.players||[]).length + (lobbyState.localPlayers||[]).length;
      if(used >= 4){ setLobbyHint('Lobby is full (4 players max).'); return; }
      lobbyState.localPlayers = lobbyState.localPlayers || [];
      lobbyState.localPlayers.push('Player '+(used+1));
      try{ SFX.click && SFX.click(); }catch(e){}
      renderLobby();
    });
    $m('lobCopyBtn') && ($m('lobCopyBtn').onclick = ()=>{ navigator.clipboard&&navigator.clipboard.writeText(lobbyState.code||''); setLobbyHint('Code copied.'); });
    // ready-up toggle (non-host)
    $m('lobReadyBtn') && ($m('lobReadyBtn').onclick = ()=>{
      const me = lobbyState.players.find(p=>p.seat===NET.me.seat);
      const next = !(me && me.ready);
      NET.t.setReady && NET.t.setReady(next);
      // local mock: there's no server to echo, so flip my own ready flag and re-render
      if(NET.mode==='local' && me){ me.ready = next; renderLobby(); }
    });
    // quick emotes → lobby chat
    $m('lobEmotes') && $m('lobEmotes').querySelectorAll('button').forEach(b=> b.onclick = ()=>{
      const text = b.dataset.e || b.textContent;
      NET.t.sendChat ? NET.t.sendChat(text) : pushLobbyChat(NET.me.name, text);
      if(NET.mode==='local') pushLobbyChat(NET.me.name, text);   // mock echoes locally
    });
    // host-only pickers inside the lobby room
    $m('lobMode') && $m('lobMode').querySelectorAll('button').forEach(b=> b.onclick = ()=>{
      $m('lobMode').querySelectorAll('button').forEach(x=>x.classList.remove('on')); b.classList.add('on');
      MP_setup.mode = b.dataset.mode;
    });
    $m('lobScore') && $m('lobScore').querySelectorAll('button').forEach(b=> b.onclick = ()=>{
      $m('lobScore').querySelectorAll('button').forEach(x=>x.classList.remove('on')); b.classList.add('on');
      MP_setup.scoreMode = b.dataset.score;
    });
    $m('lobCourse') && $m('lobCourse').querySelectorAll('button').forEach(b=> b.onclick = ()=>{
      $m('lobCourse').querySelectorAll('button').forEach(x=>x.classList.remove('on')); b.classList.add('on');
      MP_setup.courseIdx = +b.dataset.course;
      renderLobby();
    });
  }
  if(document.readyState!=='loading') wireLobbyButtons();
  else document.addEventListener('DOMContentLoaded', wireLobbyButtons);
})();


/* ---- multiplayer screen wiring ---- */
$m('multiBtn') && ($m('multiBtn').onclick = ()=>{ ac(); startMusic(); showMultiplayer(); });
$m('mpBack') && ($m('mpBack').onclick = ()=>{ NET.close&&NET.close(); showMenu(); });
$m('mpStart') && ($m('mpStart').onclick = ()=> startMultiplayerMatch());
$m('mpCount') && $m('mpCount').querySelectorAll('button').forEach(btn=> btn.onclick = ()=>{
  $m('mpCount').querySelectorAll('button').forEach(x=>x.classList.remove('on'));
  btn.classList.add('on'); MP_setup.count = +btn.dataset.n;
  if(MP_setup.mode==='teams') MP_setup.count = 4;  // teams forces 4
  buildMpPlayers();
});
$m('mpMode') && $m('mpMode').querySelectorAll('button').forEach(btn=> btn.onclick = ()=>{
  $m('mpMode').querySelectorAll('button').forEach(x=>x.classList.remove('on'));
  btn.classList.add('on'); MP_setup.mode = btn.dataset.mode;
  if(MP_setup.mode==='teams'){
    MP_setup.count=4;
    $m('mpCount').querySelectorAll('button').forEach(x=>x.classList.toggle('on', x.dataset.n==='4'));
  }
  buildMpPlayers();
});
$m('mpScore') && $m('mpScore').querySelectorAll('button').forEach(btn=> btn.onclick = ()=>{
  $m('mpScore').querySelectorAll('button').forEach(x=>x.classList.remove('on'));
  btn.classList.add('on'); MP_setup.scoreMode = btn.dataset.score;
});
$m('mpCourse') && $m('mpCourse').querySelectorAll('button').forEach(btn=> btn.onclick = ()=>{
  $m('mpCourse').querySelectorAll('button').forEach(x=>x.classList.remove('on'));
  btn.classList.add('on'); MP_setup.courseIdx = +btn.dataset.course;
});

$m('playBtn').onclick = ()=>{ ac(); startMusic(); showTours(); };
{ const rb=$m('rangeBtnT'); if(rb) rb.onclick = ()=>{ ac(); startMusic(); enterWarmup(); }; }
$m('course1Play').onclick = ()=>enterGame(0);
$m('course2Play').onclick = ()=>enterGame(1);
$m('course3Play').onclick = ()=>enterGame(2);
{ const e=$m('course4Play'); if(e) e.onclick = ()=>enterGame(3); }
{ const e=$m('course5Play'); if(e) e.onclick = ()=>enterGame(4); }
{ const e=$m('course6Play'); if(e) e.onclick = ()=>enterGame(5); }
$m('backBtn').onclick = showTours;
{ const tb=$m('csTopBack'); if(tb) tb.onclick = ()=>{ ac(); showTours(); }; }
{ const tb=$m('tourBackBtn'); if(tb) tb.onclick = showMenu; }
{ const sb=$m('statsBtnT'); if(sb) sb.onclick = showStats; }
{ const st=$m('storeBtnT'); if(st) st.onclick = showStore; }
{ const rb=$m('retryBtn'); if(rb) rb.onclick = ()=>{ if(!inMenu) startHole(holeIdx, true); }; }
$m('tcContinue') && ($m('tcContinue').onclick = ()=>{
  $m('tourCelebrate').classList.remove('show');
  /* go to the tour that contains the newly unlocked course (or stay if none) and play
     the course unlock reveal there */
  if(window._unlockReveal!=null){ const ut=tourOfCourse(window._unlockReveal); if(ut>=0) tourIdx=ut; }
  showCourses();
});
{ const mb=$m('menuBtnHud'); if(mb) mb.onclick = ()=>{ if(!inMenu) openInGameSettings(); }; }
{ const gb=$m('greenCamBtn'); if(gb) gb.onclick = ()=>toggleGreenCam(); }
{ // directional pad: press-and-hold to keep panning
  const pad=$m('greenReadHud');
  if(pad){
    let padTimer=null;
    const step=(dir)=>{
      if(dir==='left')  panGreenCam(-0.05,0,0);
      else if(dir==='right') panGreenCam(0.05,0,0);
      else if(dir==='up')    panGreenCam(0,0.035,0);
      else if(dir==='down')  panGreenCam(0,-0.035,0);
      else if(dir==='in')    panGreenCam(0,0,-8);
      else if(dir==='out')   panGreenCam(0,0,8);
    };
    pad.querySelectorAll('.grBtn').forEach(b=>{
      const dir=b.dataset.dir;
      const start=(e)=>{ e.preventDefault(); step(dir); clearInterval(padTimer); padTimer=setInterval(()=>step(dir), 55); };
      const stop=()=>{ clearInterval(padTimer); padTimer=null; };
      b.addEventListener('mousedown', start); b.addEventListener('touchstart', start, {passive:false});
      b.addEventListener('mouseup', stop); b.addEventListener('mouseleave', stop);
      b.addEventListener('touchend', stop); b.addEventListener('touchcancel', stop);
    });
  }
}
{ const sk=$m('skipHoleBtn'); if(sk) sk.onclick = ()=>{
    if(inMenu || rangeMode || practiceMode || (MP&&MP.on)) return;
    if(holeIdx < CH().length-1) startHole(holeIdx+1);   // jump to the next hole (already cleared)
  }; }
$m('statsBtn').onclick = showStats;
$m('statsBack').onclick = hideStats;
$m('storeBtn').onclick = showStore;
$m('storeBack').onclick = hideStore;
/* open the settings panel from the MAIN MENU: hide the in-game "back to menu" button,
   show RESET PROGRESS (a menu-only action) */
$m('settingsBtn').onclick = ()=>{
  const tm=$m('settingsToMenu'); if(tm) tm.style.display='none';
  const rb=$m('resetBtn'); if(rb) rb.style.display='';
  $m('settingsScreen').style.display='flex';
};
/* open the settings panel DURING A GAME (from the in-game ⚙ SETTINGS button):
   show "back to menu", hide RESET PROGRESS so a live game can't be wiped by accident */
function openInGameSettings(){
  const tm=$m('settingsToMenu'); if(tm) tm.style.display='';
  const rb=$m('resetBtn'); if(rb) rb.style.display='none';
  $m('settingsScreen').style.display='flex';
}
$m('settingsClose').onclick = ()=>{ $m('settingsScreen').style.display='none'; };
$m('settingsToMenu') && ($m('settingsToMenu').onclick = ()=>{ $m('settingsScreen').style.display='none'; goToMenu(); });
$m('controlsBtn') && ($m('controlsBtn').onclick = ()=>{ $m('controlsScreen').style.display='flex'; });
$m('controlsClose') && ($m('controlsClose').onclick = ()=>{ $m('controlsScreen').style.display='none'; });
$m('sfxSlider').oninput = e=>{ SET.sfx = e.target.value/100; saveProgress(); };
$m('musicSlider').oninput = e=>{ SET.music = e.target.value/100; if(MUSIC.gain) MUSIC.gain.gain.value = SET.music*0.4; saveProgress(); };
$m('qualitySel').onchange = e=>{ SET.quality = e.target.value; AUTOQ.user = true; if(inMenu) initPetals(); saveProgress(); };
/* reflect any restored settings in the controls */
{ const s=$m('sfxSlider');  if(s) s.value = Math.round(SET.sfx*100); }
{ const m=$m('musicSlider'); if(m) m.value = Math.round(SET.music*100); }
{ const q=$m('qualitySel'); if(q) q.value = SET.quality; }
{ const ni=$m('lobNameInput'); if(ni && window._savedName){ ni.value = window._savedName; } }
$m('resetBtn').onclick = ()=>{
  stats.bestRound=null; stats.bestStreak=0; stats.bests=[null,null,null,null,null,null];
  stats.holesDone=[0,0,0,0,0,0]; stats.rounds=[0,0,0,0,0,0]; stats.totalStrokes=0; stats.totalHoles=0; stats.bestBirdieStreak=0; stats.challenges={};
  stats.coins=1000; stats.ownedSkins=['white']; stats.equippedSkin='white';   /* back to a fresh 1000-coin start */
  try{ localStorage.removeItem(SAVE_KEY); }catch(e){}
  saveProgress();   /* write the fresh state so the reset itself persists */
  $m('courseBest').textContent='Best: —';
  $m('settingsScreen').style.display='none';
};
window.addEventListener('resize', ()=>{ if(inMenu) initPetals(); });

startHole(0, true);   /* silent pre-load so the course renders behind the menu */
showMenu();
requestAnimationFrame(frame);
</script>
</body>
</html>
