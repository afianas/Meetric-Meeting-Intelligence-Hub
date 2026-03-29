// 
import { useState, useRef, useEffect } from "react";

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@300;400;500&family=Outfit:wght@300;400;500;600&display=swap');
`;

const CSS = `
  :root {
    --bg: #e2e2e2;
    --bg2: rgba(255,255,255,0.72);
    --bg3: rgba(117,114,114,0.11);
    --surface: rgba(255,255,255,0.85);
    --border: rgba(0,0,0,0.08);
    --border2: rgba(0,0,0,0.15);
    --text: rgb(0,0,0);
    --text2: rgba(0,0,0,0.6);
    --text3: rgba(0,0,0,0.35);
    --accent: #000;
    --accent2: #3a3a3a;
    --pill: rgba(117,114,114,0.11);
    --fd: 'Instrument Serif', Georgia, serif;
    --fb: 'Outfit', sans-serif;
    --fm: 'DM Mono', monospace;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { width: 100vw; height: 100vh; overflow: hidden; }
  body { width: 100vw; height: 100vh; overflow: hidden; margin: 0; padding: 0; background: var(--bg); color: var(--text); font-family: var(--fb); -webkit-font-smoothing: antialiased; }
  #root { width: 100vw; height: 100vh; overflow: hidden; }

  /* ── LANDING PAGE ── */
  .land {
  position: relative;
  width: 100vw;
  height: 100vh;
}

  /* spline — force true fullscreen with no gaps */
  .land-spline {
  position: absolute;
  inset: 0; /* instead of top/left/width/height */
}
  .land-spline iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; outline: 0; display: block; }

  /* Open App — top right, with comfortable inset from edges */
  .land-nav { position: absolute; top: 28px; right: 36px; z-index: 20; pointer-events: all; }
  .land-nav-cta button {
    background: rgb(80,4,4); color: #fff; border: none; border-radius: 100px;
    padding: 11px 26px; font-family: var(--fb); font-size: 13px; font-weight: 500;
    cursor: pointer; letter-spacing: .03em; transition: all .2s;
    box-shadow: 0 4px 18px rgba(80,4,4,0.3);
  }
  .land-nav-cta button:hover { background: rgb(100,6,6); transform: translateY(-1px); box-shadow: 0 6px 24px rgba(80,4,4,0.4); }

  /* cta block — pinned to bottom center, side by side, floating above spline */
  .land-ctas { position: fixed; bottom: 60px; left: 50%; transform: translateX(-50%); z-index: 20; display: flex; flex-direction: row; align-items: center; gap: 12px; animation: fadeUp .7s .2s ease both; pointer-events: all; white-space: nowrap; }
  .btn-primary { background: rgb(80,4,4); color: #fff; border: none; border-radius: 100px; padding: 13px 32px; font-family: var(--fb); font-size: 13px; font-weight: 500; cursor: pointer; letter-spacing: .02em; transition: all .2s; display: inline-flex; align-items: center; gap: 7px; box-shadow: 0 4px 20px rgba(80,4,4,0.3); }
  .btn-primary:hover { background: rgb(100,6,6); transform: translateY(-1px); box-shadow: 0 8px 28px rgba(80,4,4,0.45); }
  .btn-secondary { background: rgba(255,255,255,0.18); color: var(--text); border: 1px solid rgba(0,0,0,0.12); border-radius: 100px; padding: 13px 32px; font-family: var(--fb); font-size: 13px; font-weight: 400; cursor: pointer; letter-spacing: .02em; transition: all .2s; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
  .btn-secondary:hover { background: rgba(255,255,255,0.32); border-color: rgba(0,0,0,0.22); }

  @keyframes scrollPulse { 0%,100%{opacity:.4} 50%{opacity:1} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }

  /* ── APP SHELL ── */
  .app-shell { display: flex; height: 100vh; overflow: hidden; background: var(--bg); }

  /* ── SIDEBAR ── */
  .sb { width: 220px; min-width: 220px; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; backdrop-filter: blur(20px); }
  .sb-logo { padding: 22px 20px 18px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 10px; cursor: pointer; }
  .sb-logo-mark { font-family: var(--fd); font-size: 20px; font-weight: 400; color: var(--text); letter-spacing: -.02em; }
  .sb-logo-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text); margin-top: 2px; }
  .sb-nav { flex: 1; padding: 12px 10px; overflow-y: auto; }
  .nav-sec { padding: 0 10px 4px; font-size: 9px; letter-spacing: .12em; text-transform: uppercase; color: var(--text3); margin: 14px 0 4px; font-family: var(--fm); }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; cursor: pointer; font-size: 13px; color: var(--text2); font-weight: 400; transition: all .15s; border-radius: 8px; margin: 1px 0; font-family: var(--fb); }
  .nav-item:hover { color: var(--text); background: var(--bg3); }
  .nav-item.active { color: var(--text); background: rgba(0,0,0,0.07); font-weight: 500; }
  .nav-icon { font-size: 14px; width: 18px; text-align: center; opacity: .7; }
  .sb-footer { padding: 14px; border-top: 1px solid var(--border); display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
  .sf { background: var(--bg3); border-radius: 8px; padding: 10px 12px; }
  .sf-v { font-family: var(--fd); font-size: 20px; font-weight: 400; color: var(--text); }
  .sf-l { font-size: 9px; color: var(--text3); text-transform: uppercase; letter-spacing: .07em; margin-top: 2px; font-family: var(--fm); }

  /* ── TOPBAR ── */
  .main { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
  .topbar { height: 54px; background: var(--surface); border-bottom: 1px solid var(--border); display: flex; align-items: center; padding: 0 24px; gap: 12px; flex-shrink: 0; backdrop-filter: blur(20px); }
  .tb-title { font-family: var(--fd); font-size: 16px; font-weight: 400; flex: 1; color: var(--text); letter-spacing: -.01em; }
  .tb-badge { font-family: var(--fm); font-size: 10px; padding: 3px 8px; border-radius: 4px; border: 1px solid var(--border2); color: var(--text3); background: var(--bg3); }
  .tb-rag { font-size: 11px; color: var(--text3); font-family: var(--fm); display: flex; align-items: center; gap: 5px; }
  .tb-rag-dot { width: 5px; height: 5px; border-radius: 50%; background: #16a34a; }
  .tb-back { font-family: var(--fm); font-size: 11px; color: var(--text2); cursor: pointer; padding: 5px 12px; border: 1px solid var(--border2); border-radius: 6px; transition: all .15s; background: var(--bg3); }
  .tb-back:hover { background: var(--text); color: #fff; }

  /* ── CONTENT ── */
  .content { flex: 1; overflow-y: auto; padding: 28px; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 2px; }

  /* ── CARDS ── */
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; backdrop-filter: blur(10px); transition: border-color .2s; }
  .card:hover { border-color: rgba(0,0,0,0.15); }
  .card-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .card-title { font-family: var(--fd); font-size: 14px; font-weight: 400; color: var(--text); letter-spacing: -.01em; }
  .card-act { font-size: 11px; color: var(--text3); cursor: pointer; font-family: var(--fm); transition: color .15s; }
  .card-act:hover { color: var(--text); }

  /* ── ANIMATIONS ── */
  .page { animation: pgIn .2s ease; }
  @keyframes pgIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fuUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-4px)} }
  @keyframes expandDown { from{opacity:0;max-height:0} to{opacity:1;max-height:600px} }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

  /* ── DASHBOARD ── */
  .d-greet { font-family: var(--fd); font-size: 32px; font-weight: 400; line-height: 1.1; margin-bottom: 6px; letter-spacing: -.02em; }
  .d-greet em { font-style: italic; color: var(--text2); }
  .d-sub { font-size: 13px; color: var(--text3); margin-bottom: 28px; font-family: var(--fm); }
  .mg { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 24px; }
  .mc { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 18px; position: relative; overflow: hidden; transition: all .2s; cursor: default; }
  .mc:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.07); border-color: rgba(0,0,0,0.15); }
  .mc-lbl { font-size: 10px; text-transform: uppercase; letter-spacing: .09em; color: var(--text3); font-family: var(--fm); }
  .mc-val { font-family: var(--fd); font-size: 42px; font-weight: 400; margin: 4px 0 2px; color: var(--text); letter-spacing: -.03em; }
  .mc-d { font-size: 11px; color: var(--text3); font-family: var(--fm); }
  .mc-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: rgba(0,0,0,0.08); }
  .g3 { display: grid; grid-template-columns: 2fr 1fr; gap: 14px; margin-bottom: 24px; }
  .mr { display: flex; align-items: center; gap: 12px; padding: 10px 8px; border-radius: 8px; cursor: pointer; transition: all .15s; border: 1px solid transparent; }
  .mr:hover { background: var(--bg3); border-color: var(--border); }
  .mr-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .mr-info { flex: 1; min-width: 0; }
  .mr-name { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text); font-family: var(--fb); }
  .mr-meta { font-size: 11px; color: var(--text3); margin-top: 2px; font-family: var(--fm); }
  .mr-score { font-family: var(--fm); font-size: 11px; padding: 3px 9px; border-radius: 20px; flex-shrink: 0; font-weight: 500; }
  .sp { background: rgba(22,163,74,0.1); color: #16a34a; border: 1px solid rgba(22,163,74,0.2); }
  .sn { background: rgba(220,38,38,0.08); color: #dc2626; border: 1px solid rgba(220,38,38,0.15); }
  .su { background: var(--bg3); color: var(--text2); border: 1px solid var(--border); }
  .ai-item { display: flex; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border); }
  .ai-item:last-child { border-bottom: none; }
  .ai-icon { width: 28px; height: 28px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; background: var(--bg3); border: 1px solid var(--border); }
  .ai-text { font-size: 12px; color: var(--text2); line-height: 1.5; font-family: var(--fb); }
  .ai-text strong { color: var(--text); font-weight: 500; }
  .ai-time { font-size: 10px; color: var(--text3); font-family: var(--fm); margin-top: 2px; }

  /* ── MEETING DETAIL ── */
  .detail-hero { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 22px; margin-bottom: 18px; }
  .detail-hero-top { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
  .detail-hero-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .detail-hero-name { font-family: var(--fd); font-size: 20px; font-weight: 400; color: var(--text); letter-spacing: -.02em; }
  .detail-hero-proj { font-size: 11px; color: var(--text3); font-family: var(--fm); margin-left: auto; }
  .detail-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
  .ds { background: var(--bg3); border-radius: 8px; padding: 12px 14px; }
  .ds-v { font-family: var(--fd); font-size: 22px; font-weight: 400; letter-spacing: -.02em; }
  .ds-l { font-size: 9px; color: var(--text3); text-transform: uppercase; letter-spacing: .07em; font-family: var(--fm); margin-top: 3px; }
  .detail-cols { display: grid; grid-template-columns: 1fr 1fr 340px; gap: 14px; align-items: start; }

  /* ── DECISIONS ── */
  .dec-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; margin-bottom: 9px; overflow: hidden; transition: all .2s; }
  .dec-card:hover { border-color: rgba(0,0,0,0.18); }
  .dec-card.open { border-color: rgba(0,0,0,0.25); box-shadow: 0 4px 20px rgba(0,0,0,0.07); }
  .dec-header { display: flex; align-items: flex-start; gap: 10px; padding: 14px 16px; cursor: pointer; }
  .dec-badge { font-size: 9px; padding: 2px 8px; border-radius: 4px; font-family: var(--fm); white-space: nowrap; background: rgba(0,0,0,0.06); color: var(--text2); flex-shrink: 0; margin-top: 3px; font-weight: 500; text-transform: uppercase; letter-spacing: .05em; border: 1px solid var(--border); }
  .dec-content { flex: 1; }
  .dec-text { font-size: 13px; font-weight: 500; line-height: 1.5; color: var(--text); font-family: var(--fb); }
  .dec-meta { font-size: 10px; color: var(--text3); margin-top: 3px; font-family: var(--fm); }
  .dec-chevron { font-size: 10px; color: var(--text3); transition: transform .2s; flex-shrink: 0; margin-top: 4px; }
  .dec-card.open .dec-chevron { transform: rotate(180deg); }
  .dec-trace { animation: expandDown .2s ease; overflow: hidden; }
  .dec-trace-inner { padding: 0 16px 16px; }
  .dec-divider { font-size: 9px; text-transform: uppercase; letter-spacing: .1em; color: var(--text3); font-family: var(--fm); margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
  .dec-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .dec-snippet { background: var(--bg3); border-radius: 8px; padding: 14px; border-left: 2px solid rgba(0,0,0,0.25); }
  .dec-who { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .dec-av { width: 26px; height: 26px; border-radius: 6px; background: rgba(0,0,0,0.07); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: var(--text); font-family: var(--fm); flex-shrink: 0; border: 1px solid var(--border); }
  .dec-spk { font-size: 11px; font-weight: 600; color: var(--text); font-family: var(--fb); }
  .dec-ts { font-size: 10px; color: var(--text3); font-family: var(--fm); }
  .dec-quote { font-size: 12px; color: var(--text2); line-height: 1.7; font-style: italic; font-family: var(--fd); }
  .dec-quote em { color: var(--text); font-style: normal; font-weight: 400; border-bottom: 1px solid rgba(0,0,0,0.3); }
  .dec-ctx { font-size: 10px; color: var(--text3); margin-top: 8px; font-family: var(--fm); line-height: 1.5; }
  .dec-reasons { display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap; }
  .dec-reason { font-size: 10px; padding: 2px 9px; border-radius: 20px; border: 1px solid var(--border2); color: var(--text2); font-family: var(--fm); background: var(--bg3); }

  /* ── ACTION TRACKER ── */
  .at-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 13px 16px; margin-bottom: 8px; display: flex; align-items: flex-start; gap: 12px; transition: all .2s; }
  .at-card:hover { border-color: rgba(0,0,0,0.15); }
  .at-card.done-c { opacity: .5; }
  .at-check { width: 20px; height: 20px; border-radius: 5px; border: 1.5px solid var(--border2); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all .2s; flex-shrink: 0; margin-top: 1px; }
  .at-check:hover { border-color: #16a34a; background: rgba(22,163,74,0.06); }
  .at-check.ticked { background: #16a34a; border-color: #16a34a; }
  .at-check-mark { font-size: 11px; color: #fff; font-weight: 700; line-height: 1; }
  .at-body { flex: 1; min-width: 0; }
  .at-text { font-size: 13px; font-weight: 400; line-height: 1.5; color: var(--text); font-family: var(--fb); }
  .at-card.done-c .at-text { text-decoration: line-through; color: var(--text3); }
  .at-row2 { display: flex; gap: 8px; margin-top: 5px; align-items: center; flex-wrap: wrap; }
  .at-who { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: rgba(0,0,0,0.06); font-size: 9px; font-weight: 700; border: 1px solid var(--border2); font-family: var(--fm); color: var(--text); }
  .at-dl { font-size: 10px; font-family: var(--fm); }
  .at-dl.urg { color: #dc2626; font-weight: 600; }
  .at-dl.ok { color: var(--text3); }
  .at-dl.dn { color: #16a34a; }
  .at-status { font-size: 9px; padding: 2px 8px; border-radius: 20px; font-family: var(--fm); font-weight: 500; white-space: nowrap; flex-shrink: 0; text-transform: uppercase; letter-spacing: .04em; border: 1px solid var(--border); }
  .at-status.pend { background: var(--bg3); color: var(--text2); }
  .at-status.done-s { background: rgba(22,163,74,0.1); color: #16a34a; border-color: rgba(22,163,74,0.2); }
  .at-status.ovrd { background: rgba(220,38,38,0.08); color: #dc2626; border-color: rgba(220,38,38,0.15); }
  .trk-prog { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .trk-bar { flex: 1; height: 2px; background: var(--bg3); border-radius: 1px; overflow: hidden; }
  .trk-fill { height: 100%; background: var(--text); border-radius: 1px; transition: width .4s ease; }
  .trk-lbl { font-size: 11px; color: var(--text3); font-family: var(--fm); white-space: nowrap; }

  /* ── SCOPED CHATBOT ── */
  .scoped-chat { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; display: flex; flex-direction: column; height: 560px; overflow: hidden; }
  .sc-hd { padding: 14px 16px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
  .sc-hd-title { font-family: var(--fd); font-size: 14px; font-weight: 400; color: var(--text); }
  .sc-scope-badge { display: inline-flex; align-items: center; gap: 5px; margin-top: 5px; background: var(--bg3); border: 1px solid var(--border); border-radius: 20px; padding: 3px 10px; font-size: 10px; font-family: var(--fm); color: var(--text2); }
  .sc-scope-dot { width: 5px; height: 5px; border-radius: 50%; background: #16a34a; animation: blink 2s infinite; }
  .sc-msgs { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 12px; background: var(--bg); }
  .sc-msg { display: flex; gap: 8px; animation: fuUp .25s ease; }
  .sc-msg.u { flex-direction: row-reverse; }
  .sc-av { width: 28px; height: 28px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; font-family: var(--fm); flex-shrink: 0; }
  .sc-av.ai { background: rgba(0,0,0,0.07); color: var(--text); border: 1px solid var(--border2); }
  .sc-av.u { background: var(--text); color: #fff; }
  .sc-bub { max-width: 82%; padding: 10px 13px; border-radius: 10px; font-size: 12px; line-height: 1.6; font-family: var(--fb); }
  .sc-msg.ai .sc-bub { background: var(--surface); border: 1px solid var(--border); border-top-left-radius: 2px; color: var(--text); }
  .sc-msg.u  .sc-bub { background: var(--text); color: #fff; border-top-right-radius: 2px; }
  .sc-cite { margin-top: 8px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border2); }
  .sc-cite-hd { background: var(--bg3); padding: 5px 10px; display: flex; align-items: center; gap: 6px; }
  .sc-cite-mtg { font-size: 10px; font-weight: 500; color: var(--text2); font-family: var(--fm); }
  .sc-cite-body { background: var(--surface); padding: 7px 10px; }
  .sc-cite-row { display: flex; gap: 6px; margin-bottom: 2px; }
  .sc-cite-k { font-size: 9px; color: var(--text3); font-family: var(--fm); text-transform: uppercase; letter-spacing: .06em; min-width: 52px; }
  .sc-cite-v { font-size: 10px; color: var(--text2); font-family: var(--fm); }
  .sc-cite-ex { margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--border); font-size: 10px; color: var(--text2); line-height: 1.5; font-style: italic; font-family: var(--fd); }
  .sc-in-row { padding: 10px 12px; border-top: 1px solid var(--border); display: flex; gap: 8px; align-items: flex-end; background: var(--surface); }
  .sc-in { flex: 1; background: var(--bg3); border: 1px solid var(--border2); border-radius: 7px; color: var(--text); font-family: var(--fb); font-size: 12px; padding: 8px 11px; resize: none; outline: none; transition: border-color .15s; min-height: 36px; max-height: 80px; line-height: 1.5; }
  .sc-in:focus { border-color: rgba(0,0,0,0.35); }
  .sc-in::placeholder { color: var(--text3); }
  .sc-send { background: var(--text); color: #fff; border: none; border-radius: 7px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 14px; transition: all .15s; flex-shrink: 0; }
  .sc-send:hover { background: #333; }
  .sc-send:disabled { opacity: .3; cursor: not-allowed; }
  .sc-typing { display: flex; align-items: center; gap: 4px; padding: 3px 0; }
  .sc-td { width: 5px; height: 5px; border-radius: 50%; background: var(--text3); animation: bounce 1.2s infinite; }
  .sc-td:nth-child(2){animation-delay:.2s;} .sc-td:nth-child(3){animation-delay:.4s;}

  /* ── UPLOAD ── */
  .up-meta-row { display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
  .up-meta-grp { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 140px; }
  .up-lbl { font-size: 10px; color: var(--text3); font-family: var(--fm); text-transform: uppercase; letter-spacing: .07em; }
  .up-inp { background: var(--surface); border: 1px solid var(--border2); border-radius: 8px; color: var(--text); font-family: var(--fb); font-size: 13px; padding: 9px 12px; outline: none; transition: all .15s; width: 100%; }
  .up-inp:focus { border-color: rgba(0,0,0,0.4); }
  .up-inp::placeholder { color: var(--text3); }
  .up-zone { border: 1.5px dashed rgba(0,0,0,0.18); border-radius: 14px; padding: 48px; text-align: center; cursor: pointer; transition: all .2s; background: var(--surface); position: relative; overflow: hidden; }
  .up-zone:hover, .up-zone.drag { border-color: rgba(0,0,0,0.5); background: var(--bg3); }
  .up-zone-icon { font-size: 28px; margin-bottom: 12px; opacity: .5; }
  .up-zone-title { font-family: var(--fd); font-size: 18px; font-weight: 400; margin-bottom: 5px; color: var(--text); letter-spacing: -.01em; }
  .up-zone-sub { font-size: 12px; color: var(--text3); }
  .up-formats { display: flex; gap: 7px; justify-content: center; margin-top: 14px; flex-wrap: wrap; }
  .fmt-badge { font-family: var(--fm); font-size: 10px; padding: 3px 9px; border: 1px solid var(--border2); border-radius: 4px; color: var(--text3); background: var(--bg3); }
  .up-hidden { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  .fs-card { background: var(--surface); border: 1px solid var(--border); border-radius: 11px; padding: 14px; margin-bottom: 9px; animation: slIn .3s ease; }
  .fs-top { display: flex; align-items: flex-start; gap: 11px; }
  .fs-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; opacity: .6; }
  .fs-info { flex: 1; min-width: 0; }
  .fs-name { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text); }
  .fs-proj { font-size: 10px; color: var(--text3); font-family: var(--fm); margin-top: 2px; }
  .fs-stat { font-size: 10px; padding: 3px 10px; border-radius: 20px; font-family: var(--fm); white-space: nowrap; flex-shrink: 0; font-weight: 500; border: 1px solid var(--border); }
  .st-done { background: rgba(22,163,74,0.08); color: #16a34a; border-color: rgba(22,163,74,0.2); }
  .st-proc { background: var(--bg3); color: var(--text2); }
  .st-err { background: rgba(220,38,38,0.08); color: #dc2626; }
  .fs-del { color: var(--text3); cursor: pointer; font-size: 13px; transition: color .15s; margin-top: 2px; flex-shrink: 0; }
  .fs-del:hover { color: #dc2626; }
  .prog-bar { height: 1px; background: var(--bg3); border-radius: 1px; margin-top: 8px; overflow: hidden; }
  .prog-fill { height: 100%; background: var(--text); border-radius: 1px; transition: width .4s ease; }
  .fs-summary { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); }
  .fs-sum-lbl { font-size: 9px; color: var(--text3); text-transform: uppercase; letter-spacing: .07em; font-family: var(--fm); }
  .fs-sum-val { font-size: 13px; font-weight: 500; font-family: var(--fd); margin-top: 2px; color: var(--text); }
  .fs-acts { display: flex; gap: 6px; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border); flex-wrap: wrap; }
  .fs-btn { background: var(--bg3); border: 1px solid var(--border2); color: var(--text2); padding: 5px 12px; border-radius: 6px; font-size: 10px; cursor: pointer; transition: all .15s; font-family: var(--fm); display: inline-flex; align-items: center; gap: 4px; }
  .fs-btn:hover { border-color: var(--text); color: var(--text); }
  .pg-hdr { display: flex; align-items: center; gap: 9px; margin: 18px 0 8px; }
  .pg-name { font-family: var(--fd); font-size: 13px; font-weight: 400; color: var(--text); letter-spacing: -.01em; }
  .pg-cnt { font-size: 10px; color: var(--text3); font-family: var(--fm); }

  /* ── FILTER CHIPS ── */
  .fc { font-family: var(--fm); font-size: 11px; padding: 5px 14px; border-radius: 20px; border: 1px solid var(--border2); color: var(--text2); cursor: pointer; transition: all .15s; background: var(--surface); }
  .fc.active { background: var(--text); color: #fff; border-color: var(--text); }
  .fc:hover:not(.active) { border-color: var(--text); color: var(--text); }
  .fr { display: flex; gap: 7px; flex-wrap: wrap; }
  .tk-fc { font-family: var(--fm); font-size: 11px; padding: 5px 14px; border-radius: 20px; border: 1px solid var(--border2); color: var(--text2); cursor: pointer; transition: all .15s; background: var(--surface); }
  .tk-fc.active { background: var(--text); color: #fff; border-color: var(--text); }
  .tk-fc:hover:not(.active) { border-color: var(--text); color: var(--text); }
  .own-sel { background: var(--surface); border: 1px solid var(--border2); border-radius: 8px; color: var(--text); font-family: var(--fm); font-size: 11px; padding: 5px 10px; outline: none; cursor: pointer; }
  .ex-btn { background: var(--surface); border: 1px solid var(--border2); color: var(--text2); padding: 6px 14px; border-radius: 8px; font-size: 11px; cursor: pointer; transition: all .15s; font-family: var(--fm); display: inline-flex; align-items: center; gap: 5px; }
  .ex-btn:hover { border-color: var(--text); color: var(--text); }

  /* ── CHATBOT ── */
  .chat-layout { display: grid; grid-template-columns: 1fr 280px; gap: 14px; height: calc(100vh - 110px); }
  .chat-win { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; }
  .chat-hd { padding: 14px 18px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 10px; }
  .chat-msgs { flex: 1; overflow-y: auto; padding: 18px; display: flex; flex-direction: column; gap: 14px; background: var(--bg); }
  .msg { display: flex; gap: 9px; animation: fuUp .25s ease; }
  .msg.u { flex-direction: row-reverse; }
  .msg-av { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; font-family: var(--fm); flex-shrink: 0; }
  .msg-av.ai { background: rgba(0,0,0,0.07); color: var(--text); border: 1px solid var(--border2); }
  .msg-av.u { background: var(--text); color: #fff; }
  .msg-bub { max-width: 78%; padding: 12px 14px; border-radius: 10px; font-size: 13px; line-height: 1.6; font-family: var(--fb); }
  .msg.ai .msg-bub { background: var(--surface); border: 1px solid var(--border); border-top-left-radius: 2px; color: var(--text); }
  .msg.u  .msg-bub { background: var(--text); color: #fff; border-top-right-radius: 2px; }
  .citation { margin-top: 10px; border-radius: 7px; overflow: hidden; border: 1px solid var(--border2); }
  .cite-hd { background: var(--bg3); padding: 6px 11px; display: flex; align-items: center; gap: 6px; }
  .cite-mtg { font-size: 10px; font-weight: 500; color: var(--text2); font-family: var(--fm); }
  .cite-body { background: var(--surface); padding: 8px 11px; }
  .cite-row { display: flex; gap: 7px; margin-bottom: 2px; }
  .cite-k { font-size: 9px; color: var(--text3); font-family: var(--fm); text-transform: uppercase; letter-spacing: .06em; min-width: 55px; }
  .cite-v { font-size: 10px; color: var(--text2); font-family: var(--fm); }
  .cite-ex { margin-top: 7px; padding-top: 7px; border-top: 1px solid var(--border); font-size: 11px; color: var(--text2); line-height: 1.5; font-style: italic; font-family: var(--fd); }
  .chat-in-row { padding: 12px 14px; border-top: 1px solid var(--border); display: flex; gap: 9px; align-items: flex-end; background: var(--surface); }
  .chat-in { flex: 1; background: var(--bg3); border: 1px solid var(--border2); border-radius: 8px; color: var(--text); font-family: var(--fb); font-size: 13px; padding: 9px 13px; resize: none; outline: none; transition: border-color .15s; min-height: 38px; max-height: 90px; line-height: 1.5; }
  .chat-in:focus { border-color: rgba(0,0,0,0.4); }
  .chat-in::placeholder { color: var(--text3); }
  .send-btn { background: var(--text); color: #fff; border: none; border-radius: 8px; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 15px; transition: all .15s; flex-shrink: 0; }
  .send-btn:hover { background: #333; }
  .send-btn:disabled { opacity: .3; cursor: not-allowed; }
  .sug-chip { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: 9px 12px; font-size: 12px; color: var(--text2); cursor: pointer; transition: all .15s; line-height: 1.4; margin-bottom: 7px; font-family: var(--fb); }
  .sug-chip:hover { border-color: var(--text); color: var(--text); background: var(--surface); }
  .typing { display: flex; align-items: center; gap: 4px; padding: 3px 0; }
  .td { width: 5px; height: 5px; border-radius: 50%; background: var(--text3); animation: bounce 1.2s infinite; }
  .td:nth-child(2){animation-delay:.2s;} .td:nth-child(3){animation-delay:.4s;}

  /* ── SENTIMENT ── */
  .sent-layout { display: grid; grid-template-columns: 1fr 300px; gap: 14px; }
  .tl-row { margin-bottom: 16px; }
  .tl-spk { font-size: 11px; color: var(--text2); margin-bottom: 4px; display: flex; justify-content: space-between; font-family: var(--fm); }
  .tl-bar { height: 22px; border-radius: 6px; display: flex; overflow: hidden; cursor: pointer; border: 1px solid var(--border); }
  .tl-ticks { display: flex; justify-content: space-between; margin-top: 3px; }
  .tl-tick { font-size: 9px; color: var(--text3); font-family: var(--fm); }
  .seg { height: 100%; transition: filter .15s; opacity: .8; }
  .seg:hover { filter: brightness(.85); opacity: 1; }
  .seg-pos{background:#86efac;} .seg-neg{background:#fca5a5;}
  .seg-neu{background:#d1d5db;} .seg-conflict{background:#f87171;}
  .seg-enthus{background:#a5b4fc;}
  .spk-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 13px; margin-bottom: 9px; }
  .spk-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 9px; }
  .spk-name { font-size: 13px; font-weight: 500; color: var(--text); font-family: var(--fb); }
  .spk-ring { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: var(--fd); font-size: 13px; font-weight: 400; }
  .mbars { display: flex; gap: 4px; align-items: flex-end; height: 26px; }
  .mbar { width: 8px; border-radius: 2px; }
  .legend { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
  .leg-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text2); font-family: var(--fm); }
  .leg-dot { width: 10px; height: 10px; border-radius: 2px; border: 1px solid rgba(0,0,0,.08); }
  .tp { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: 13px; font-size: 11px; color: var(--text2); line-height: 1.7; border-left: 2px solid rgba(0,0,0,.25); font-family: var(--fd); font-style: italic; max-height: 180px; overflow-y: auto; margin-top: 14px; font-size: 13px; }
`;

// ─── DATA ─────────────────────────────────────────────────────────────
const MEETINGS = [
  { id:1, name:"Q3 Product Roadmap Review",  date:"2024-07-10", speakers:5, words:12400, sentiment:72, color:"#16a34a", project:"Product Team"  },
  { id:2, name:"API Launch Strategy",         date:"2024-07-08", speakers:4, words:8900,  sentiment:48, color:"#d97706", project:"Engineering"   },
  { id:3, name:"Finance Lead Sync — Budget",  date:"2024-07-05", speakers:3, words:6200,  sentiment:31, color:"#dc2626", project:"Finance"        },
  { id:4, name:"Design System Kickoff",       date:"2024-07-03", speakers:6, words:15100, sentiment:85, color:"#7c3aed", project:"Design"         },
  { id:5, name:"Client Onboarding Review",    date:"2024-06-28", speakers:4, words:9300,  sentiment:61, color:"#0891b2", project:"Client Success" },
];
const DECISIONS = [
  { id:1, meeting:"API Launch Strategy",        date:"Jul 8",  content:"Delay API launch to Q4 pending security audit.", speaker:"Alex M.",  initials:"AM", timestamp:"05:10", quote:"Okay, decision made. Q4 it is. We can't ship without the audit and Jordan's docs aren't ready.", highlight:"Q4 it is", context:"3-min debate between Sam R. and Jordan D. All 4 attendees agreed.", reasons:["Audit incomplete","Docs 60% done","Enterprise risk"] },
  { id:2, meeting:"Q3 Product Roadmap Review",  date:"Jul 10", content:"Adopt React as primary frontend framework for 2024.", speaker:"Taylor M.", initials:"TM", timestamp:"22:34", quote:"We've evaluated Vue and Svelte but ecosystem maturity and team familiarity make React the clear choice. React across the board for 2024.", highlight:"React across the board", context:"15-min framework comparison. Vue main contender. 5/5 agreed.", reasons:["Team familiarity","Ecosystem","Existing library"] },
  { id:3, meeting:"Design System Kickoff",      date:"Jul 3",  content:"Freeze all design tokens until August sprint review.", speaker:"KL", initials:"KL", timestamp:"08:45", quote:"Tokens are frozen as of today. No changes until August sprint review — this is non-negotiable.", highlight:"Tokens are frozen", context:"Unanimous — prevent scope creep during active migration.", reasons:["Prevent instability","Active migration","August deadline"] },
  { id:4, meeting:"Client Onboarding Review",   date:"Jun 28", content:"Proceed with enterprise tier at $499/month.", speaker:"Taylor M.", initials:"TM", timestamp:"31:45", quote:"Three beta accounts have already said $499 is workable. Lock it in and move forward.", highlight:"Lock it in", context:"Pricing under review 2 weeks. Beta client feedback was deciding factor.", reasons:["3 betas confirmed","Competitive analysis","2-week delay"] },
  { id:5, meeting:"Finance Lead Sync — Budget", date:"Jul 5",  content:"Freeze non-essential spending until Q4 forecasts revised.", speaker:"Sam R.", initials:"SR", timestamp:"14:22", quote:"We cannot approve further spend until we understand the Q2 variance. That 12% gap needs an owner before another dollar goes out.", highlight:"12% gap needs an owner", context:"Finance Lead imposed immediate freeze. TM assigned variance report by Jul 14.", reasons:["12% Q2 variance","Unowned contracts","Q4 forecast pending"] },
];
const INIT_ACTIONS = [
  { id:1, content:"Prepare complete API docs and migration guide.", who:"JD", deadline:"Jul 15", meeting:"API Launch Strategy", urgent:true, done:false },
  { id:2, content:"Schedule security audit with third-party vendor.", who:"SR", deadline:"Jul 12", meeting:"API Launch Strategy", urgent:true, done:false },
  { id:3, content:"Compile competitor analysis report for the board.", who:"AM", deadline:"Jul 20", meeting:"Q3 Product Roadmap Review", urgent:false, done:false },
  { id:4, content:"Set up bi-weekly sync for roadmap check-ins.", who:"PK", deadline:"Jul 17", meeting:"Q3 Product Roadmap Review", urgent:false, done:true },
  { id:5, content:"Migrate legacy color variables to new token system.", who:"KL", deadline:"Jul 18", meeting:"Design System Kickoff", urgent:false, done:false },
  { id:6, content:"Present budget variance report to Finance Lead.", who:"TM", deadline:"Jul 14", meeting:"Finance Lead Sync — Budget", urgent:true, done:false },
  { id:7, content:"Set up onboarding checklist automation in CRM.", who:"BN", deadline:"Jul 22", meeting:"Client Onboarding Review", urgent:false, done:true },
  { id:8, content:"Draft client email for enterprise accounts.", who:"TM", deadline:"Jul 11", meeting:"API Launch Strategy", urgent:true, done:false },
  { id:9, content:"Review and sign off on vendor contract terms.", who:"SR", deadline:"Jul 25", meeting:"Finance Lead Sync — Budget", urgent:false, done:false },
  { id:10, content:"Circulate updated roadmap to all stakeholders.", who:"AM", deadline:"Jul 16", meeting:"Q3 Product Roadmap Review", urgent:false, done:false },
];
const SCOPED_QA = {
  "API Launch Strategy": {
    "Why was the launch delayed?": { text:"Delayed to Q4: security audit not completed, migration docs 60% done (Jordan D.), enterprise clients needed more beta time. Decision at 05:10 by Alex M.", citation:{segment:"03:00 — 05:10",speakers:["Sam R.","Alex M.","Jordan D."],excerpt:'"I cannot sign off on this timeline." — Sam R. | "Q4 it is." — Alex M.'} },
    "Who owns the action items?": { text:"Jordan D. — API docs, Jul 15 [URGENT]. Sam R. — vendor audit contact, Jul 12 [URGENT]. Both flagged critical.", citation:{segment:"05:10",speakers:["Alex M."],excerpt:'"Jordan — API docs by July 15th. Sam — vendor contact by July 12th."'} },
    "What was Sam's concern?": { text:"Sam flagged the security audit as a hard blocker — minimum 3 weeks, couldn't sign off earlier. Primary driver of the Q4 decision.", citation:{segment:"01:30 — 03:00",speakers:["Sam R."],excerpt:'"I cannot sign off on this timeline. Three weeks minimum."'} },
  },
  "Q3 Product Roadmap Review": {
    "What framework was chosen?": { text:"React chosen unanimously. Vue and Svelte evaluated but React won on ecosystem maturity and team familiarity.", citation:{segment:"22:34",speakers:["Taylor M."],excerpt:'"React across the board for 2024."'} },
  },
  "Finance Lead Sync — Budget": {
    "What were the main concerns?": { text:"12% Q2 variance, ~$340K unowned vendor contracts, and immediate spend freeze until Q4 forecasts revised.", citation:{segment:"12:00 — 19:30",speakers:["Sam R."],excerpt:'"That 12% gap needs an owner before another dollar goes out."'} },
  },
  "Design System Kickoff": {
    "What was decided about tokens?": { text:"All tokens frozen immediately — no changes until August sprint review. Unanimous.", citation:{segment:"08:45",speakers:["KL"],excerpt:'"Tokens are frozen as of today. Non-negotiable."'} },
  },
  "Client Onboarding Review": {
    "What pricing was agreed?": { text:"Enterprise tier confirmed at $499/month. Three beta clients had already verbally agreed.", citation:{segment:"31:45",speakers:["Taylor M."],excerpt:'"Lock it in and move forward."'} },
  },
};
const GLOBAL_QA = {
  "Why did we delay the API launch?": { text:"Pushed to Q4: audit incomplete, migration docs 60%, enterprise clients needed more time.", citation:{meeting:"API Launch Strategy",date:"Jul 8, 2024",segment:"03:00 — 05:10",speakers:["Sam R.","Alex M."],excerpt:'"Q4 it is." — Alex M.'} },
  "What were Finance's main concerns?": { text:"12% Q2 budget variance, unowned $340K vendor contracts, spend freeze pending Q4 forecasts.", citation:{meeting:"Finance Lead Sync",date:"Jul 5, 2024",segment:"12:00 — 19:30",speakers:["Sam R."],excerpt:'"That 12% gap needs an owner before another dollar goes out."'} },
  "What is the overall sentiment?": { text:"Average 59% across 5 meetings. Design Kickoff highest (85%), Finance Sync lowest (31%).", citation:{meeting:"All meetings",date:"Jun 28 — Jul 10",segment:"Full corpus",speakers:["Multiple"],excerpt:'Conflict peaks: Finance Sync 23:40, API Launch 01:30.'} },
  "What pricing was decided?": { text:"Enterprise tier locked at $499/mo in Client Onboarding Review — confirmed by 3 beta clients.", citation:{meeting:"Client Onboarding Review",date:"Jun 28, 2024",segment:"31:45",speakers:["Taylor M."],excerpt:'"Lock it in and move forward."'} },
  "When is the next deadline?": { text:"Jul 12 — Sam R. vendor audit [URGENT]. Jul 14 — TM budget report. Jul 15 — Jordan D. API docs [URGENT].", citation:{meeting:"API Launch + Finance Sync",date:"Jul 5–8",segment:"Action item extraction",speakers:["Alex M."],excerpt:'Deadlines assigned at close of both sessions.'} },
};
const SPEAKERS_SENT = [
  {name:"Alex M.",  score:78,bars:[3,5,8,6,7,4,9],ring:"#16a34a",ringBg:"rgba(22,163,74,0.1)"},
  {name:"Jordan D.",score:52,bars:[6,4,3,7,5,6,4],ring:"#d97706",ringBg:"rgba(217,119,6,0.1)"},
  {name:"Sam R.",   score:31,bars:[8,6,5,4,3,5,2],ring:"#dc2626",ringBg:"rgba(220,38,38,0.1)"},
  {name:"Taylor M.",score:65,bars:[4,5,7,6,8,5,7],ring:"#7c3aed",ringBg:"rgba(124,58,237,0.1)"},
];
const TL_DATA = [
  {speaker:"Alex M.",  segs:[{t:"pos",w:20},{t:"neu",w:15},{t:"enthus",w:10},{t:"pos",w:20},{t:"neu",w:10},{t:"pos",w:25}]},
  {speaker:"Jordan D.",segs:[{t:"neu",w:15},{t:"neg",w:12},{t:"neu",w:18},{t:"pos",w:15},{t:"neg",w:10},{t:"neu",w:30}]},
  {speaker:"Sam R.",   segs:[{t:"neg",w:10},{t:"conflict",w:15},{t:"neg",w:10},{t:"neu",w:20},{t:"conflict",w:15},{t:"neg",w:30}]},
  {speaker:"Taylor M.",segs:[{t:"pos",w:25},{t:"enthus",w:15},{t:"pos",w:20},{t:"neu",w:15},{t:"pos",w:15},{t:"neu",w:10}]},
];
const TIME_TICKS = ["0:00","10:00","20:00","30:00","40:00","50:00","60:00"];
const SEG_TEXTS = {
  pos:"Largely aligned. Clear enthusiasm — no pushback from either side.",
  neg:"Visible hesitation. Timeline concerns surfaced, energy shifted downward.",
  neu:"Clarifying questions and factual exchange. No strong opinions — information mode.",
  conflict:'"I cannot sign off on this timeline. Three weeks minimum." The room went quiet.',
  enthus:'"This is exactly the bold move we\'ve been waiting to make." High momentum.',
};
const DEMO_FILES = [
  {name:"q3_roadmap_review.txt",  size:248,status:"done",progress:100,project:"Product Team",date:"2024-07-10",speakers:5,words:12400},
  {name:"api_launch_strategy.vtt",size:172,status:"done",progress:100,project:"Engineering", date:"2024-07-08",speakers:4,words:8900},
  {name:"finance_sync_july.txt",  size:119,status:"done",progress:100,project:"Finance",     date:"2024-07-05",speakers:3,words:6200},
];

function dl(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function exportFileCSV(f){const rows=[["Field","Value"],["File",f.name],["Project",f.project],["Date",f.date],["Speakers",f.speakers],["Words",f.words]];dl(new Blob([rows.map(r=>r.join(",")).join("\n")],{type:"text/csv"}),`${f.name.replace(/\.[^.]+$/,"")}_summary.csv`);}
function exportActionsCSV(items){const rows=[["Content","Who","Deadline","Meeting","Status","Urgent"],...items.map(i=>[`"${i.content}"`,i.who,i.deadline||"—",`"${i.meeting}"`,i.done?"Done":"Pending",i.urgent?"Yes":"No"])];dl(new Blob([rows.map(r=>r.join(",")).join("\n")],{type:"text/csv"}),"meetric_tracker.csv");}

// ─── LANDING ──────────────────────────────────────────────────────────
function Landing({ onEnter }) {
  return (
    <div className="land">

      {/* Spline — true fullscreen, mouse events live for cursor/hover tracking */}
      <div className="land-spline">
        <iframe
          src="https://my.spline.design/chromaticcopycopy-irSgUQ3O37WdeNx98ea2fQH2-YKJ/"
          frameBorder="0"
        />
      </div>

      {/* Open App button only — top right */}
      <div className="land-nav">
        <div className="land-nav-cta">
          <button onClick={onEnter}>Open App →</button>
        </div>
      </div>

    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────
function Sidebar({ active, setActive, onHome }) {
  const nav = [
    {id:"dashboard", icon:"⬛", label:"Dashboard"},
    {id:"upload",    icon:"↑",  label:"Upload"},
    {id:"decisions", icon:"◈",  label:"Decisions"},
    {id:"tracker",   icon:"✓",  label:"Action Tracker"},
    {id:"chatbot",   icon:"◎",  label:"Query Engine"},
    {id:"sentiment", icon:"◑",  label:"Sentiment"},
  ];
  return (
    <div className="sb">
      <div className="sb-logo" onClick={onHome}>
        <div className="sb-logo-mark">meetric</div>
        <div className="sb-logo-dot"/>
      </div>
      <div className="sb-nav">
        <div className="nav-sec">Workspace</div>
        {nav.map(n => (
          <div key={n.id} className={`nav-item${active===n.id?" active":""}`} onClick={() => setActive(n.id)}>
            <span className="nav-icon">{n.icon}</span>{n.label}
          </div>
        ))}
      </div>
      <div className="sb-footer">
        <div className="sf"><div className="sf-v">5</div><div className="sf-l">Meetings</div></div>
        <div className="sf"><div className="sf-v">{DECISIONS.length}</div><div className="sf-l">Decisions</div></div>
        <div className="sf"><div className="sf-v">{INIT_ACTIONS.length}</div><div className="sf-l">Actions</div></div>
        <div className="sf"><div className="sf-v">{INIT_ACTIONS.filter(a=>a.urgent&&!a.done).length}</div><div className="sf-l">Urgent</div></div>
      </div>
    </div>
  );
}

function Topbar({ page, isDetail, onBack, meetingName }) {
  const titles = {dashboard:"Command Center",upload:"Upload Transcripts",decisions:"Decision Traceability",tracker:"Action Tracker",chatbot:"Query Engine",sentiment:"Sentiment & Tone"};
  return (
    <div className="topbar">
      {isDetail && <div className="tb-back" onClick={onBack}>← Back</div>}
      <div className="tb-title">{isDetail ? meetingName : titles[page]}</div>
      <div className="tb-badge">v2.5</div>
      <div className="tb-rag"><div className="tb-rag-dot"/><span>RAG active</span></div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────
function Dashboard({ setPage, openDetail }) {
  return (
    <div className="content page">
      <div className="d-greet">Good morning. <em>Intelligence ready.</em></div>
      <div className="d-sub">5 transcripts indexed · last sync 2 min ago · 52,900 words</div>
      <div className="mg">
        {[
          {val:"5",    lbl:"Transcripts", d:"↑ 2 this week"},
          {val:String(INIT_ACTIONS.length), lbl:"Action Items",  d:"↑ 7 this session"},
          {val:String(INIT_ACTIONS.filter(a=>a.urgent&&!a.done).length), lbl:"Urgent", d:"⚠ attention needed"},
          {val:"59%",  lbl:"Avg Sentiment", d:"↓ 8pts vs last week"},
        ].map(m => (
          <div key={m.lbl} className="mc">
            <div className="mc-lbl">{m.lbl}</div>
            <div className="mc-val">{m.val}</div>
            <div className="mc-d">{m.d}</div>
            <div className="mc-bar"/>
          </div>
        ))}
      </div>
      <div className="g3">
        <div className="card">
          <div className="card-hd">
            <div className="card-title">Recent Meetings</div>
            <div className="card-act" onClick={() => setPage("upload")}>+ upload →</div>
          </div>
          {MEETINGS.map(m => (
            <div key={m.id} className="mr" onClick={() => openDetail(m)}>
              <div className="mr-dot" style={{background:m.color}}/>
              <div className="mr-info">
                <div className="mr-name">{m.name}</div>
                <div className="mr-meta">{m.date} · {m.speakers} speakers · {m.words.toLocaleString()} words</div>
              </div>
              <div className={`mr-score ${m.sentiment>=60?"sp":m.sentiment>=45?"su":"sn"}`}>{m.sentiment}%</div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-hd"><div className="card-title">Activity</div></div>
          {[
            {icon:"↑", t:<><strong>API Launch Strategy</strong> transcript processed</>, time:"2 min ago"},
            {icon:"◈", t:<><strong>5 decisions</strong> traced with RAG evidence</>, time:"10 min ago"},
            {icon:"✓", t:<><strong>Action tracker</strong> — 2 items completed</>, time:"1 hr ago"},
            {icon:"◑", t:<><strong>Conflict detected</strong> Finance Sync 23:40</>, time:"3 hrs ago"},
            {icon:"◎", t:<><strong>Query</strong>: "Why delay the API launch?"</>, time:"4 hrs ago"},
          ].map((a,i) => (
            <div key={i} className="ai-item">
              <div className="ai-icon">{a.icon}</div>
              <div><div className="ai-text">{a.t}</div><div className="ai-time">{a.time}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DecisionCard({ d }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`dec-card${open?" open":""}`}>
      <div className="dec-header" onClick={() => setOpen(o => !o)}>
        <span className="dec-badge">decision</span>
        <div className="dec-content">
          <div className="dec-text">{d.content}</div>
          <div className="dec-meta">{d.meeting} · {d.date}</div>
        </div>
        <span className="dec-chevron">{open?"▲":"▼"}</span>
      </div>
      {open && (
        <div className="dec-trace"><div className="dec-trace-inner">
          <div className="dec-divider">RAG Evidence</div>
          <div className="dec-snippet">
            <div className="dec-who">
              <div className="dec-av">{d.initials}</div>
              <div><div className="dec-spk">{d.speaker}</div><div className="dec-ts">{d.timestamp} · {d.meeting}</div></div>
            </div>
            <div className="dec-quote">"…{d.quote.split(d.highlight).map((part,i,arr)=>(
              <span key={i}>{part}{i<arr.length-1&&<em>{d.highlight}</em>}</span>
            ))}…"</div>
            <div className="dec-ctx">{d.context}</div>
          </div>
          <div className="dec-reasons" style={{marginTop:8}}>
            <span style={{fontSize:9,color:"var(--text3)",fontFamily:"var(--fm)",alignSelf:"center",textTransform:"uppercase",letterSpacing:".06em"}}>reasons:</span>
            {d.reasons.map(r => <span key={r} className="dec-reason">{r}</span>)}
          </div>
        </div></div>
      )}
    </div>
  );
}

function ActionCard({ a, onToggle }) {
  return (
    <div className={`at-card${a.done?" done-c":""}`}>
      <div className={`at-check${a.done?" ticked":""}`} onClick={() => onToggle(a.id)}>
        {a.done && <span className="at-check-mark">✓</span>}
      </div>
      <div className="at-body">
        <div className="at-text">{a.content}</div>
        <div className="at-row2">
          <div className="at-who">{a.who}</div>
          {a.deadline && <div className={`at-dl${a.done?" dn":a.urgent?" urg":" ok"}`}>{a.done?"✓ ":a.urgent?"⚠ ":""}{a.deadline}</div>}
        </div>
      </div>
      <div className={`at-status${a.done?" done-s":a.urgent?" ovrd":" pend"}`}>{a.done?"Done":a.urgent?"Urgent":"Pending"}</div>
    </div>
  );
}

function ScopedChatbot({ meeting }) {
  const qa = SCOPED_QA[meeting.name] || {};
  const suggestions = Object.keys(qa);
  const [messages, setMessages] = useState([{role:"ai", text:`Scoped exclusively to "${meeting.name}". I can only answer from this transcript.`, citation:null}]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef();
  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages, thinking]);

  const send = (text) => {
    const q = (text||input).trim(); if (!q||thinking) return;
    setInput("");
    setMessages(p => [...p, {role:"user", text:q, citation:null}]);
    setThinking(true);
    setTimeout(() => {
      const resp = qa[q] || {text:`No exact match in "${meeting.name}". Try one of the suggested questions.`, citation:{segment:"Full transcript searched",speakers:[],excerpt:null}};
      setMessages(p => [...p, {role:"ai", text:resp.text, citation:{...resp.citation, meeting:meeting.name}}]);
      setThinking(false);
    }, 800 + Math.random()*500);
  };

  return (
    <div className="scoped-chat">
      <div className="sc-hd">
        <div className="sc-hd-title">Meeting Q&A</div>
        <div className="sc-scope-badge"><div className="sc-scope-dot"/>Scoped: {meeting.name.split(" ").slice(0,3).join(" ")}…</div>
      </div>
      <div className="sc-msgs">
        {messages.map((m,i) => (
          <div key={i} className={`sc-msg ${m.role==="user"?"u":"ai"}`}>
            <div className={`sc-av ${m.role==="user"?"u":"ai"}`}>{m.role==="ai"?"AI":"You"}</div>
            <div style={{maxWidth:"85%"}}>
              <div className="sc-bub">
                {m.text}
                {m.citation?.segment && (
                  <div className="sc-cite">
                    <div className="sc-cite-hd"><span>📌</span><span className="sc-cite-mtg">{m.citation.meeting}</span></div>
                    <div className="sc-cite-body">
                      <div className="sc-cite-row"><span className="sc-cite-k">Segment</span><span className="sc-cite-v">{m.citation.segment}</span></div>
                      {m.citation.speakers?.length>0 && <div className="sc-cite-row"><span className="sc-cite-k">Speakers</span><span className="sc-cite-v">{m.citation.speakers.join(", ")}</span></div>}
                      {m.citation.excerpt && <div className="sc-cite-ex">{m.citation.excerpt}</div>}
                    </div>
                  </div>
                )}
              </div>
              {i===0 && suggestions.length>0 && (
                <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:5}}>
                  {suggestions.map(s => <div key={s} style={{fontSize:11,color:"var(--text2)",cursor:"pointer",fontFamily:"var(--fm)",padding:"4px 9px",background:"var(--bg3)",borderRadius:6,border:"1px solid var(--border)"}} onClick={() => send(s)}>↗ {s}</div>)}
                </div>
              )}
            </div>
          </div>
        ))}
        {thinking && <div className="sc-msg ai"><div className="sc-av ai">AI</div><div className="sc-bub"><div className="sc-typing"><div className="sc-td"/><div className="sc-td"/><div className="sc-td"/></div></div></div>}
        <div ref={bottomRef}/>
      </div>
      <div className="sc-in-row">
        <textarea className="sc-in" placeholder={`Ask about "${meeting.name.split(" ").slice(0,2).join(" ")}"…`} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => {if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} rows={1}/>
        <button className="sc-send" onClick={() => send()} disabled={thinking||!input.trim()}>→</button>
      </div>
    </div>
  );
}

function MeetingDetail({ meeting, actions, onToggleAction }) {
  const meetDecs = DECISIONS.filter(d => d.meeting===meeting.name);
  const meetActions = actions.filter(a => a.meeting===meeting.name);
  const doneCount = meetActions.filter(a => a.done).length;
  const pct = meetActions.length ? Math.round((doneCount/meetActions.length)*100) : 0;
  return (
    <div className="content page">
      <div className="detail-hero">
        <div className="detail-hero-top">
          <div className="detail-hero-dot" style={{background:meeting.color}}/>
          <div className="detail-hero-name">{meeting.name}</div>
          <div className="detail-hero-proj">{meeting.project} · {meeting.date}</div>
        </div>
        <div className="detail-stats">
          {[{lbl:"Speakers",val:meeting.speakers,c:"var(--text)"},{lbl:"Words",val:meeting.words.toLocaleString(),c:"var(--text)"},{lbl:"Sentiment",val:`${meeting.sentiment}%`,c:meeting.sentiment>=60?"#16a34a":meeting.sentiment>=45?"#d97706":"#dc2626"},{lbl:"Decisions",val:meetDecs.length,c:"var(--text)"}].map(s => (
            <div key={s.lbl} className="ds">
              <div className="ds-v" style={{color:s.c}}>{s.val}</div>
              <div className="ds-l">{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="detail-cols">
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <div style={{fontFamily:"var(--fd)",fontSize:14,fontWeight:400,color:"var(--text)",letterSpacing:"-.01em"}}>Traced Decisions</div>
            <div style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:"var(--bg3)",color:"var(--text2)",fontFamily:"var(--fm)",border:"1px solid var(--border)"}}>{meetDecs.length}</div>
          </div>
          {meetDecs.length===0
            ? <div style={{color:"var(--text3)",fontSize:12,fontFamily:"var(--fm)",padding:"20px",textAlign:"center",background:"var(--surface)",borderRadius:10,border:"1px solid var(--border)"}}>No traced decisions</div>
            : meetDecs.map(d => <DecisionCard key={d.id} d={d}/>)}
        </div>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <div style={{fontFamily:"var(--fd)",fontSize:14,fontWeight:400,color:"var(--text)",letterSpacing:"-.01em"}}>Action Items</div>
            <div style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:"var(--bg3)",color:"var(--text2)",fontFamily:"var(--fm)",border:"1px solid var(--border)"}}>{doneCount}/{meetActions.length}</div>
          </div>
          {meetActions.length>0 && <div className="trk-prog"><div className="trk-bar"><div className="trk-fill" style={{width:`${pct}%`}}/></div><div className="trk-lbl">{pct}%</div></div>}
          {meetActions.length===0
            ? <div style={{color:"var(--text3)",fontSize:12,fontFamily:"var(--fm)",padding:"20px",textAlign:"center",background:"var(--surface)",borderRadius:10,border:"1px solid var(--border)"}}>No action items</div>
            : meetActions.map(a => <ActionCard key={a.id} a={a} onToggle={onToggleAction}/>)}
        </div>
        <div>
          <div style={{fontFamily:"var(--fd)",fontSize:14,fontWeight:400,color:"var(--text)",letterSpacing:"-.01em",marginBottom:12}}>Meeting Assistant</div>
          <ScopedChatbot meeting={meeting}/>
        </div>
      </div>
    </div>
  );
}

function Decisions() {
  const [filter, setFilter] = useState("all");
  const meetings = [...new Set(DECISIONS.map(d => d.meeting))];
  const filtered = filter==="all" ? DECISIONS : DECISIONS.filter(d => d.meeting===filter);
  return (
    <div className="content page">
      <div style={{marginBottom:18}}>
        <div style={{fontSize:13,color:"var(--text3)",marginBottom:12,fontFamily:"var(--fm)"}}>Click any decision to reveal the exact transcript snippet and reasoning.</div>
        <div className="fr">
          <div className={`fc${filter==="all"?" active":""}`} onClick={() => setFilter("all")}>All</div>
          {meetings.map(m => <div key={m} className={`fc${filter===m?" active":""}`} onClick={() => setFilter(m)}>{m.split(" ").slice(0,3).join(" ")}</div>)}
        </div>
      </div>
      {filtered.map(d => <DecisionCard key={d.id} d={d}/>)}
    </div>
  );
}

function ActionTracker() {
  const [actions, setActions] = useState(INIT_ACTIONS);
  const [sf, setSf] = useState("all");
  const [of, setOf] = useState("all");
  const toggle = (id) => setActions(p => p.map(a => a.id===id?{...a,done:!a.done}:a));
  const owners = [...new Set(actions.map(a => a.who))];
  const filtered = actions.filter(a => {
    const ms = sf==="all"||(sf==="done"&&a.done)||(sf==="pending"&&!a.done)||(sf==="urgent"&&a.urgent&&!a.done);
    const mo = of==="all"||a.who===of;
    return ms&&mo;
  });
  const doneCount = actions.filter(a => a.done).length;
  const pct = Math.round((doneCount/actions.length)*100);
  return (
    <div className="content page">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18,flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:13,color:"var(--text3)",marginBottom:12,fontFamily:"var(--fm)"}}>Mark items complete as tasks get done.</div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"center"}}>
            {["all","pending","urgent","done"].map(f => <div key={f} className={`tk-fc${sf===f?" active":""}`} onClick={() => setSf(f)}>{f==="all"?"All":f==="pending"?"Pending":f==="urgent"?"⚠ Urgent":"✓ Done"}</div>)}
            <select className="own-sel" value={of} onChange={e => setOf(e.target.value)}>
              <option value="all">All owners</option>
              {owners.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
          <div style={{fontSize:11,color:"var(--text3)",fontFamily:"var(--fm)"}}>{doneCount} of {actions.length} complete</div>
          <div className="trk-prog"><div className="trk-bar" style={{width:130}}><div className="trk-fill" style={{width:`${pct}%`}}/></div><div className="trk-lbl">{pct}%</div></div>
          <button className="ex-btn" onClick={() => exportActionsCSV(actions)}>↓ Export CSV</button>
        </div>
      </div>
      {filtered.map(a => <ActionCard key={a.id} a={a} onToggle={toggle}/>)}
      <div style={{marginTop:16,padding:"14px 18px",background:"var(--surface)",borderRadius:10,border:"1px solid var(--border)",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        {[{lbl:"Total",val:actions.length},{lbl:"Done",val:actions.filter(a=>a.done).length},{lbl:"Pending",val:actions.filter(a=>!a.done).length},{lbl:"Urgent",val:actions.filter(a=>a.urgent&&!a.done).length}].map(s => (
          <div key={s.lbl} style={{textAlign:"center"}}>
            <div style={{fontFamily:"var(--fd)",fontSize:26,fontWeight:400,color:"var(--text)",letterSpacing:"-.02em"}}>{s.val}</div>
            <div style={{fontSize:9,color:"var(--text3)",fontFamily:"var(--fm)",textTransform:"uppercase",letterSpacing:".07em"}}>{s.lbl}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Upload() {
  const [files, setFiles] = useState(DEMO_FILES);
  const [drag, setDrag] = useState(false);
  const [projName, setProjName] = useState("");
  const [projDate, setProjDate] = useState("");
  const inputRef = useRef();
  const cRef = useRef(files.length);
  const groups = {};
  files.forEach(f => { if (!groups[f.project]) groups[f.project]=[]; groups[f.project].push(f); });

  const addFiles = (incoming) => {
    const valid = Array.from(incoming).filter(f => f.name.endsWith(".txt")||f.name.endsWith(".vtt"));
    if (!valid.length) return;
    const proj = projName.trim()||"Unassigned";
    const date = projDate||new Date().toISOString().slice(0,10);
    const start = cRef.current; cRef.current += valid.length;
    const added = valid.map(f => ({name:f.name,size:Math.max(1,Math.round(f.size/1024)),status:"proc",progress:0,project:proj,date,speakers:0,words:0}));
    setFiles(p => [...p, ...added]);
    added.forEach((_,i) => {
      const fi = start+i; let prog = 0;
      const iv = setInterval(() => {
        prog += Math.random()*18+8;
        if (prog>=100) { clearInterval(iv); setFiles(p => p.map((f,idx) => idx===fi?{...f,status:"done",progress:100,speakers:Math.floor(Math.random()*4)+2,words:Math.floor(Math.random()*8000)+3000}:f)); }
        else setFiles(p => p.map((f,idx) => idx===fi?{...f,progress:Math.round(prog)}:f));
      }, 200);
    });
  };

  return (
    <div className="content page">
      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"16px 20px",marginBottom:16}}>
        <div style={{fontSize:12,fontFamily:"var(--fd)",fontSize:14,marginBottom:12,color:"var(--text)"}}>Group Settings</div>
        <div className="up-meta-row">
          <div className="up-meta-grp"><div className="up-lbl">Project Name</div><input className="up-inp" placeholder="e.g. Product Team, Q3 Finance…" value={projName} onChange={e => setProjName(e.target.value)}/></div>
          <div className="up-meta-grp" style={{maxWidth:190}}><div className="up-lbl">Meeting Date</div><input className="up-inp" type="date" value={projDate} onChange={e => setProjDate(e.target.value)}/></div>
        </div>
      </div>
      <div className={`up-zone${drag?" drag":""}`} onDragOver={e => {e.preventDefault();setDrag(true);}} onDragLeave={() => setDrag(false)} onDrop={e => {e.preventDefault();setDrag(false);addFiles(e.dataTransfer.files);}} onClick={() => inputRef.current.click()}>
        <input ref={inputRef} type="file" multiple accept=".txt,.vtt" className="up-hidden" onChange={e => {addFiles(e.target.files);e.target.value="";}} onClick={e => e.stopPropagation()}/>
        <div className="up-zone-icon">⬆</div>
        <div className="up-zone-title">Drop transcripts here</div>
        <div className="up-zone-sub">Drag & drop or click to browse · .txt and .vtt</div>
        <div className="up-formats">{[".txt",".vtt","WebVTT","Plain text"].map(f => <div key={f} className="fmt-badge">{f}</div>)}</div>
      </div>
      {files.length>0 && (
        <div style={{marginTop:20}}>
          {Object.entries(groups).map(([proj, pfiles]) => (
            <div key={proj}>
              <div className="pg-hdr"><div className="pg-name">{proj}</div><div className="pg-cnt">— {pfiles.length} file{pfiles.length!==1?"s":""}</div></div>
              {pfiles.map((f,i) => (
                <div key={i} className="fs-card">
                  <div className="fs-top">
                    <div className="fs-icon">{f.name.endsWith(".vtt")?"📋":"📄"}</div>
                    <div className="fs-info">
                      <div className="fs-name">{f.name}</div>
                      <div className="fs-proj">{f.project}{f.date?` · ${f.date}`:""}</div>
                      {f.status==="proc" && <div className="prog-bar"><div className="prog-fill" style={{width:`${f.progress}%`}}/></div>}
                    </div>
                    <div className={`fs-stat st-${f.status}`}>{f.status==="done"?"✓ Indexed":f.status==="proc"?`${f.progress}%`:"Error"}</div>
                    <div className="fs-del" onClick={() => setFiles(p => p.filter(x => x!==f))}>✕</div>
                  </div>
                  {f.status==="done" && (
                    <>
                      <div className="fs-summary">
                        {[{lbl:"File",val:f.name},{lbl:"Date",val:f.date},{lbl:"Speakers",val:f.speakers},{lbl:"Words",val:f.words.toLocaleString()}].map(s => (
                          <div key={s.lbl}><div className="fs-sum-lbl">{s.lbl}</div><div className="fs-sum-val" style={{fontSize:s.lbl==="File"?11:13,fontFamily:s.lbl==="File"?"var(--fm)":"var(--fd)"}}>{s.val}</div></div>
                        ))}
                      </div>
                      <div className="fs-acts">
                        <button className="fs-btn" onClick={() => exportFileCSV(f)}>↓ CSV</button>
                        <div style={{flex:1}}/>
                        <div style={{fontSize:10,color:"var(--text3)",fontFamily:"var(--fm)",alignSelf:"center"}}>{f.size} KB</div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Chatbot() {
  const [messages, setMessages] = useState([{role:"ai", text:"Hello. I've indexed all 5 meeting transcripts — 52,900 words. Every answer includes a cited source.", citation:null}]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef();
  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages, thinking]);
  const SUGGS = Object.keys(GLOBAL_QA);

  const send = (text) => {
    const q = (text||input).trim(); if (!q||thinking) return;
    setInput("");
    setMessages(p => [...p, {role:"user", text:q, citation:null}]);
    setThinking(true);
    setTimeout(() => {
      const resp = GLOBAL_QA[q] || {text:`I searched all 5 transcripts for "${q}". Try one of the suggested queries for a precise cited answer.`, citation:{meeting:"Cross-meeting",date:"All",segment:"RAG synthesis",speakers:[],excerpt:null}};
      setMessages(p => [...p, {role:"ai", text:resp.text, citation:resp.citation}]);
      setThinking(false);
    }, 900 + Math.random()*600);
  };

  return (
    <div className="content page" style={{padding:14,height:"calc(100vh - 54px)"}}>
      <div className="chat-layout">
        <div className="chat-win">
          <div className="chat-hd">
            <div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:400,flex:1,color:"var(--text)",letterSpacing:"-.01em"}}>Cross-Meeting Query</div>
            <div style={{fontSize:11,color:"var(--text3)",fontFamily:"var(--fm)"}}>5 transcripts indexed</div>
          </div>
          <div className="chat-msgs">
            {messages.map((m,i) => (
              <div key={i} className={`msg ${m.role==="user"?"u":"ai"}`}>
                <div className={`msg-av ${m.role==="user"?"u":"ai"}`}>{m.role==="ai"?"AI":"You"}</div>
                <div style={{maxWidth:"78%"}}>
                  <div className="msg-bub">
                    {m.text}
                    {m.citation && (
                      <div className="citation">
                        <div className="cite-hd"><span>📌</span><span className="cite-mtg">{m.citation.meeting}</span></div>
                        <div className="cite-body">
                          {m.citation.date && <div className="cite-row"><span className="cite-k">Date</span><span className="cite-v">{m.citation.date}</span></div>}
                          <div className="cite-row"><span className="cite-k">Segment</span><span className="cite-v">{m.citation.segment}</span></div>
                          {m.citation.speakers?.length>0 && <div className="cite-row"><span className="cite-k">Speakers</span><span className="cite-v">{m.citation.speakers.join(", ")}</span></div>}
                          {m.citation.excerpt && <div className="cite-ex">{m.citation.excerpt}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {thinking && <div className="msg ai"><div className="msg-av ai">AI</div><div className="msg-bub"><div className="typing"><div className="td"/><div className="td"/><div className="td"/></div></div></div>}
            <div ref={bottomRef}/>
          </div>
          <div className="chat-in-row">
            <textarea className="chat-in" placeholder="Ask anything across all 5 transcripts…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => {if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} rows={1}/>
            <button className="send-btn" onClick={() => send()} disabled={thinking||!input.trim()}>→</button>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div className="card" style={{padding:"14px 16px"}}>
            <div className="card-hd" style={{marginBottom:10}}><div className="card-title">Suggested queries</div></div>
            {SUGGS.map(s => <div key={s} className="sug-chip" onClick={() => send(s)}>{s}</div>)}
          </div>
          <div className="card" style={{padding:"14px 16px"}}>
            <div className="card-title" style={{marginBottom:10}}>Scope</div>
            {MEETINGS.map(m => (
              <div key={m.id} style={{display:"flex",alignItems:"center",gap:7,marginBottom:7}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:m.color,flexShrink:0}}/>
                <div style={{fontSize:11,color:"var(--text2)",fontFamily:"var(--fm)",flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.name.split(" ").slice(0,3).join(" ")}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Sentiment() {
  const [sel, setSel] = useState(null);
  return (
    <div className="content page">
      <div className="legend">
        {[{cls:"seg-pos",lbl:"Positive"},{cls:"seg-neg",lbl:"Negative"},{cls:"seg-neu",lbl:"Neutral"},{cls:"seg-conflict",lbl:"Conflict"},{cls:"seg-enthus",lbl:"Enthusiasm"}].map(l => (
          <div key={l.lbl} className="leg-item"><div className={`leg-dot ${l.cls}`}/>{l.lbl}</div>
        ))}
      </div>
      <div className="sent-layout">
        <div>
          <div className="card" style={{marginBottom:14}}>
            <div className="card-hd"><div className="card-title">Speaker Timeline · API Launch · 60 min</div></div>
            {TL_DATA.map((row,i) => (
              <div key={i} className="tl-row">
                <div className="tl-spk"><span>{row.speaker}</span><span style={{fontSize:9,color:"var(--text3)"}}>{row.segs.length} segments</span></div>
                <div className="tl-bar">{row.segs.map((s,si) => <div key={si} className={`seg seg-${s.t}`} style={{width:`${s.w}%`}} onClick={() => setSel({speaker:row.speaker,type:s.t,time:`${si*10}:00 — ${(si+1)*10}:00`})}/>)}</div>
                <div className="tl-ticks">{TIME_TICKS.map(t => <div key={t} className="tl-tick">{t}</div>)}</div>
              </div>
            ))}
          </div>
          {sel ? (
            <div className="card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
                <div className="card-title">{sel.speaker} · {sel.time}</div>
                <span style={{fontSize:10,padding:"2px 8px",borderRadius:4,background:"var(--bg3)",color:"var(--text2)",fontFamily:"var(--fm)",textTransform:"capitalize",border:"1px solid var(--border)"}}>{sel.type}</span>
              </div>
              <div className="tp">{SEG_TEXTS[sel.type]}</div>
            </div>
          ) : (
            <div className="card" style={{textAlign:"center",padding:"28px"}}>
              <div style={{color:"var(--text3)",fontSize:12,fontFamily:"var(--fm)"}}>← click any segment to view excerpt</div>
            </div>
          )}
        </div>
        <div>
          <div style={{marginBottom:10,fontFamily:"var(--fd)",fontSize:14,fontWeight:400,color:"var(--text)",letterSpacing:"-.01em"}}>Per-Speaker</div>
          {SPEAKERS_SENT.map(s => (
            <div key={s.name} className="spk-card">
              <div className="spk-top">
                <div>
                  <div className="spk-name">{s.name}</div>
                  <div style={{fontSize:10,color:"var(--text3)",fontFamily:"var(--fm)",marginTop:2}}>{s.score>=60?"positive":s.score>=45?"mixed":"negative"}</div>
                </div>
                <div className="spk-ring" style={{background:s.ringBg,color:s.ring,border:`1px solid ${s.ring}40`}}>{s.score}%</div>
              </div>
              <div className="mbars">{s.bars.map((b,i) => <div key={i} className="mbar" style={{height:`${b*3}px`,background:b>=7?s.ring:b>=5?"#d1d5db":"#fca5a5"}}/>)}</div>
            </div>
          ))}
          <div className="card" style={{marginTop:10,padding:"13px 16px"}}>
            <div style={{fontSize:11,fontFamily:"var(--fd)",marginBottom:10,color:"var(--text)"}}>Meeting summary</div>
            {[{lbl:"Overall",val:"Mixed → Tense",c:"#dc2626"},{lbl:"Peak conflict",val:"23:40",c:"#dc2626"},{lbl:"Peak consensus",val:"41:00",c:"#16a34a"},{lbl:"Avg sentiment",val:"51%",c:"var(--text)"},{lbl:"Flagged",val:"3 conflict segs",c:"#dc2626"}].map(r => (
              <div key={r.lbl} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid var(--border)",fontSize:12}}>
                <span style={{color:"var(--text3)",fontFamily:"var(--fm)",fontSize:11}}>{r.lbl}</span>
                <span style={{color:r.c,fontFamily:"var(--fm)",fontWeight:500,fontSize:11}}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("landing"); // "landing" | "app"
  const [page, setPage] = useState("dashboard");
  const [detail, setDetail] = useState(null);
  const [actions, setActions] = useState(INIT_ACTIONS);

  const toggleAction = (id) => setActions(p => p.map(a => a.id===id?{...a,done:!a.done}:a));
  const openDetail = (m) => setDetail(m);
  const closeDetail = () => setDetail(null);
  const navTo = (p) => { setDetail(null); setPage(p); };

  if (view === "landing") {
    return (
      <>
        <style>{FONTS}{CSS}</style>
        <Landing onEnter={() => setView("app")}/>
      </>
    );
  }

  const renderContent = () => {
    if (detail) return <MeetingDetail meeting={detail} actions={actions} onToggleAction={toggleAction}/>;
    switch(page) {
      case "dashboard": return <Dashboard setPage={navTo} openDetail={openDetail}/>;
      case "upload":    return <Upload/>;
      case "decisions": return <Decisions/>;
      case "tracker":   return <ActionTracker/>;
      case "chatbot":   return <Chatbot/>;
      case "sentiment": return <Sentiment/>;
      default:          return <Dashboard setPage={navTo} openDetail={openDetail}/>;
    }
  };

  return (
    <>
      <style>{FONTS}{CSS}</style>
      <div className="app-shell">
        <Sidebar active={page} setActive={navTo} onHome={() => setView("landing")}/>
        <div className="main">
          <Topbar page={page} isDetail={!!detail} onBack={closeDetail} meetingName={detail?.name}/>
          {renderContent()}
        </div>
      </div>
    </>
  );
}