const pptxgen = require("pptxgenjs");
const p = new pptxgen();
p.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
p.author = "Sanjana Mishra";
p.title = "No Small Talk";

// High-contrast dark palette. Primary text is near-white on deep navy (~15:1).
const BG = "0C1420", PANEL = "17223A", LINE = "33415E",
      FG = "F2F6FC",        // primary text — bright
      SEC = "C6D2E6",       // secondary text — still high contrast
      DIM = "8A99B5",       // footers only
      GREEN = "5FE0A6", BLUE = "7FB0FF", RED = "FF8086", AMBER = "F0C06A";
const TITLE = "Calibri", BODY = "Calibri", MONO = "Courier New";
const W = 13.3, H = 7.5;

function slide() { const s = p.addSlide(); s.background = { color: BG }; return s; }
function title(s, t) {
  s.addText(t, { x: 0.6, y: 0.4, w: W - 1.2, h: 0.9, fontFace: TITLE, fontSize: 32, bold: true, color: FG, isTextBox: true });
}
function footer(s, n) {
  s.addText("NO SMALL TALK  ·  BSIDES NYC AI VILLAGE", { x: 0.6, y: 7.02, w: 9, h: 0.3, fontFace: MONO, fontSize: 9, color: DIM, charSpacing: 1, isTextBox: true });
  s.addText(String(n), { x: W - 1.0, y: 7.02, w: 0.4, h: 0.3, fontFace: MONO, fontSize: 9, color: DIM, align: "right", isTextBox: true });
}
function box(s, x, y, w, h, label, col, opt = {}) {
  s.addShape(p.ShapeType.roundRect, { x, y, w, h, fill: { color: opt.fill || PANEL }, line: { color: col, width: 1.25 }, rectRadius: 0.07 });
  s.addText(label, { x: x + 0.12, y, w: w - 0.24, h, align: "center", valign: "middle",
    fontFace: opt.mono ? MONO : TITLE, fontSize: opt.fs || 15, bold: opt.bold !== false, color: opt.tc || FG, isTextBox: true, margin: 0 });
}
function arrow(s, x, y, w, col = SEC) {
  s.addShape(p.ShapeType.line, { x, y, w, h: 0, line: { color: col, width: 2.5, endArrowType: "triangle" } });
}
function card(s, x, y, w, h) {
  s.addShape(p.ShapeType.roundRect, { x, y, w, h, fill: { color: PANEL }, line: { color: LINE, width: 1 }, rectRadius: 0.06,
    shadow: { type: "outer", color: "000000", opacity: 0.4, blur: 9, offset: 3, angle: 90 } });
}

/* 1 — Title */
(() => {
  const s = slide();
  s.addText("nst $ route --help", { x: 0.6, y: 0.75, w: 8, h: 0.4, fontFace: MONO, fontSize: 14, color: GREEN, isTextBox: true });
  s.addText("No Small Talk", { x: 0.6, y: 2.2, w: 12, h: 1.4, fontFace: TITLE, fontSize: 68, bold: true, color: FG, isTextBox: true });
  s.addText("Does your security queue need an LLM?", { x: 0.6, y: 3.7, w: 12, h: 0.8, fontFace: TITLE, fontSize: 27, color: BLUE, isTextBox: true });
  s.addText("Routing the same alerts through rules, a decision model, and a generative LLM — and measuring what accuracy hides.",
    { x: 0.6, y: 4.6, w: 11.5, h: 0.8, fontFace: BODY, fontSize: 16, color: SEC, isTextBox: true });
  s.addText("BSIDES NYC  //  AI VILLAGE  //  DEMO LAB", { x: 0.6, y: 6.25, w: 9, h: 0.4, fontFace: MONO, fontSize: 13, color: SEC, charSpacing: 2, isTextBox: true });
  s.addText("Sanjana Mishra", { x: 0.6, y: 6.65, w: 9, h: 0.4, fontFace: BODY, fontSize: 15, bold: true, color: FG, isTextBox: true });
  s.addNotes("Open. We make thousands of small routing calls a day in a SOC. The question isn't 'can an LLM do it' but whether you need one and how you'd tell.");
})();

/* 2 — whoami */
(() => {
  const s = slide(); title(s, "whoami");
  s.addText("$ whoami", { x: 0.6, y: 1.4, w: 8, h: 0.5, fontFace: MONO, fontSize: 18, color: GREEN, isTextBox: true });
  s.addText([
    { text: "Sanjana Mishra", options: { fontSize: 24, bold: true, color: FG, breakLine: true, paraSpaceAfter: 10 } },
    { text: "[ your role / team ]", options: { fontSize: 17, color: SEC, breakLine: true, paraSpaceAfter: 10 } },
    { text: "I wrote the explainer on JEV, the decision-native “System One” model — and I build/evaluate ML for security operations.", options: { fontSize: 17, color: SEC } },
  ], { x: 0.6, y: 2.0, w: 11.5, h: 2.6, fontFace: BODY, isTextBox: true, valign: "top" });
  footer(s, 2);
  s.addNotes("Fill in your real role. Lead with the JEV explainer — it earns credibility for the decision-model material without being a pitch.");
})();

/* 3 — Security operations today (diagram) */
(() => {
  const s = slide(); title(s, "Security operations today");
  s.addText("Under the noise, triage is mostly a bounded decision made over and over: which team owns this alert — or does it need a human first?",
    { x: 0.6, y: 1.35, w: 12, h: 0.8, fontFace: BODY, fontSize: 17, color: SEC, isTextBox: true });
  const midY = 3.9;
  box(s, 0.7, midY - 0.45, 2.5, 0.9, "Alert queue", BLUE, { fs: 16 });
  arrow(s, 3.35, midY, 0.75);
  box(s, 4.25, midY - 0.55, 3.2, 1.1, "Triage:\nwhich team owns this?", AMBER, { fs: 15 });
  arrow(s, 7.6, midY, 0.75);
  const outs = [["SOC", BLUE], ["Cloud Security", GREEN], ["ProdSec", AMBER], ["→ human review", SEC]];
  outs.forEach((o, i) => box(s, 8.55, 2.15 + i * 0.95, 3.9, 0.78, o[0], o[1], { mono: true, fs: 15, tc: o[1] }));
  footer(s, 3);
  s.addNotes("Frame the task as routing to one of three teams, with a review lane. The six no-context alerts (coming up) are the crux.");
})();

/* 4 — The reflex: throw an LLM at it */
(() => {
  const s = slide(); title(s, "The reflex: throw an LLM at it");
  s.addText("So you reach for a generative LLM — Gemini, say — to read the alert and pick the team. It works. But for a high-volume bounded decision it brings baggage:",
    { x: 0.6, y: 1.35, w: 12, h: 0.85, fontFace: BODY, fontSize: 17, color: SEC, isTextBox: true });
  const items = [
    ["Latency", "seconds per call — it adds up across a queue", AMBER],
    ["Cost", "you pay per token, on every alert, forever", AMBER],
    ["Confidently wrong", "a perfectly valid answer can still be the wrong team — with no signal it's unsure", RED],
  ];
  let y = 2.55;
  items.forEach((it) => {
    s.addShape(p.ShapeType.chord, { x: 0.7, y: y + 0.07, w: 0.26, h: 0.26, fill: { color: it[2] } });
    s.addText(it[0], { x: 1.15, y, w: 3.1, h: 0.5, fontFace: TITLE, fontSize: 18, bold: true, color: FG, isTextBox: true, margin: 0 });
    s.addText(it[1], { x: 4.3, y, w: 8.3, h: 0.6, fontFace: BODY, fontSize: 16, color: SEC, isTextBox: true, margin: 0, valign: "middle" });
    y += 1.0;
  });
  s.addText("Is a model that writes paragraphs really the right tool to pick one of four options?",
    { x: 0.6, y: 5.75, w: 12, h: 0.6, fontFace: BODY, fontSize: 17, italic: true, color: BLUE, isTextBox: true });
  footer(s, 4);
  s.addNotes("Introduce Gemini here as the generative option. Plant the three costs — especially 'confidently wrong' — which the demo will make concrete.");
})();

/* 5 — System One models (contrast diagram) */
(() => {
  const s = slide(); title(s, "System One models: built to decide, not write");
  s.addText("A different class of model: instead of generating text, it picks from a fixed set of options and returns a calibrated probability on each.",
    { x: 0.6, y: 1.35, w: 12, h: 0.8, fontFace: BODY, fontSize: 17, color: SEC, isTextBox: true });
  // left: generative
  card(s, 0.7, 2.4, 5.7, 3.4);
  s.addText("Generative LLM", { x: 1.0, y: 2.65, w: 5.1, h: 0.5, fontFace: TITLE, fontSize: 19, bold: true, color: BLUE, isTextBox: true });
  box(s, 1.0, 3.35, 5.1, 0.7, "alert", LINE, { fs: 14, tc: SEC });
  s.addShape(p.ShapeType.line, { x: 3.55, y: 4.15, w: 0, h: 0.35, line: { color: SEC, width: 2.5, endArrowType: "triangle" } });
  box(s, 1.0, 4.55, 5.1, 0.7, "free-form text", BLUE, { fs: 14, mono: true, tc: BLUE });
  s.addText("→ parse it, hope it's valid, no honest confidence", { x: 1.0, y: 5.3, w: 5.1, h: 0.4, fontFace: BODY, fontSize: 13, color: SEC, isTextBox: true });
  // right: decision-native
  card(s, 6.9, 2.4, 5.7, 3.4);
  s.addText("Decision-native (System One)", { x: 7.2, y: 2.65, w: 5.1, h: 0.5, fontFace: TITLE, fontSize: 19, bold: true, color: GREEN, isTextBox: true });
  box(s, 7.2, 3.35, 5.1, 0.7, "alert", LINE, { fs: 14, tc: SEC });
  s.addShape(p.ShapeType.line, { x: 9.75, y: 4.15, w: 0, h: 0.35, line: { color: GREEN, width: 2.5, endArrowType: "triangle" } });
  box(s, 7.2, 4.55, 5.1, 0.7, "pick 1 of N  +  confidence", GREEN, { fs: 14, mono: true, tc: GREEN });
  s.addText("→ type-safe, can't go off-menu, calibrated", { x: 7.2, y: 5.3, w: 5.1, h: 0.4, fontFace: BODY, fontSize: 13, color: SEC, isTextBox: true });
  footer(s, 5);
  s.addNotes("The category, not a product yet. Key contrast: free text you must parse vs a bounded pick with calibrated confidence.");
})();

/* 6 — JEV specifically */
(() => {
  const s = slide(); title(s, "JEV, specifically");
  s.addText("JEV (TypeSafe) is one example of the category. You hand it the alert and the options; it returns the chosen team and a probability for each.",
    { x: 0.6, y: 1.35, w: 12, h: 0.8, fontFace: BODY, fontSize: 17, color: SEC, isTextBox: true });
  card(s, 0.7, 2.4, 11.9, 2.5);
  s.addText("alert  +  { SOC, Cloud, ProdSec, review }", { x: 1.0, y: 2.7, w: 11.3, h: 0.5, fontFace: MONO, fontSize: 15, color: SEC, isTextBox: true });
  s.addText("→  ProdSec", { x: 1.0, y: 3.3, w: 6, h: 0.6, fontFace: MONO, fontSize: 22, bold: true, color: GREEN, isTextBox: true });
  s.addText([
    { text: "prodsec 0.99   ", options: { color: GREEN } },
    { text: "cloud 0.01   soc 0.00   review 0.00", options: { color: SEC } },
  ], { x: 1.0, y: 4.0, w: 11, h: 0.5, fontFace: MONO, fontSize: 15, isTextBox: true });
  s.addText("Can't hallucinate a team that isn't on the list. ~0.2s per call. The confidence is a real distribution, not a vibe.",
    { x: 0.7, y: 5.2, w: 12, h: 0.8, fontFace: BODY, fontSize: 16, italic: true, color: AMBER, isTextBox: true });
  footer(s, 6);
  s.addNotes("Your authored angle. Keep it as 'one example of the category', not the hero — the honest comparison comes next.");
})();

/* 7 — Does it help? experiment + what to measure (pipeline) */
(() => {
  const s = slide(); title(s, "But does it actually help your queue?");
  s.addText("Hold deployment constant, vary the paradigm. Same 30 synthetic alerts through three systems — and measure the right things.",
    { x: 0.6, y: 1.35, w: 12, h: 0.8, fontFace: BODY, fontSize: 17, color: SEC, isTextBox: true });
  box(s, 0.7, 3.25, 2.3, 1.0, "30 alerts", BLUE, { fs: 15 });
  const sys = [["rules", SEC], ["JEV", GREEN], ["Gemini", BLUE]];
  sys.forEach((sy, i) => { arrow(s, 3.1, 2.75 + i * 0.95, 0.7); box(s, 3.9, 2.4 + i * 0.95, 2.6, 0.72, sy[0], sy[1], { mono: true, fs: 15, tc: sy[1] }); });
  arrow(s, 6.65, 3.75, 0.7);
  card(s, 7.55, 2.3, 5.1, 2.95);
  s.addText("Measure", { x: 7.8, y: 2.45, w: 4.6, h: 0.4, fontFace: TITLE, fontSize: 15, bold: true, color: FG, isTextBox: true });
  s.addText([
    { text: "misroutes — wrong team", options: { color: RED, breakLine: true, paraSpaceAfter: 5, bullet: { indent: 14 } } },
    { text: "missed escalations — should've asked a human", options: { color: AMBER, breakLine: true, paraSpaceAfter: 5, bullet: { indent: 14 } } },
    { text: "review load", options: { color: SEC, breakLine: true, paraSpaceAfter: 5, bullet: { indent: 14 } } },
    { text: "latency", options: { color: SEC, breakLine: true, paraSpaceAfter: 5, bullet: { indent: 14 } } },
    { text: "cost", options: { color: SEC, bullet: { indent: 14 } } },
  ], { x: 7.8, y: 2.9, w: 4.6, h: 2.2, fontFace: BODY, fontSize: 14, isTextBox: true, valign: "top" });
  s.addText("Not accuracy alone — accuracy hides the failure that actually bites.",
    { x: 0.6, y: 5.7, w: 12, h: 0.5, fontFace: BODY, fontSize: 16, italic: true, color: BLUE, isTextBox: true });
  footer(s, 7);
  s.addNotes("The pivot from 'here's JEV' to 'here's how to judge it honestly'. Introduce the metrics before the demo so the findings have a runway.");
})();

/* 8 — Demo divider */
(() => {
  const s = slide();
  s.addText("Demo", { x: 0.8, y: 1.0, w: 12, h: 1.0, fontFace: TITLE, fontSize: 40, bold: true, color: FG, isTextBox: true });
  card(s, 0.8, 2.2, 11.7, 3.6);
  s.addText("nst ~/no-small-talk $", { x: 1.2, y: 2.55, w: 11, h: 0.4, fontFace: MONO, fontSize: 15, color: GREEN, isTextBox: true });
  s.addText([
    { text: "python -m nst.flow", options: { color: FG, breakLine: true, paraSpaceAfter: 6 } },
    { text: "# forced choice vs. a review option — all three systems, offline", options: { color: SEC, fontSize: 14, breakLine: true, paraSpaceAfter: 16 } },
    { text: "python -m nst.generate --mix soc=6,cloud=6,prodsec=6,review=4", options: { color: FG, breakLine: true, paraSpaceAfter: 6 } },
    { text: "# build a mix like your own queue and route it", options: { color: SEC, fontSize: 14 } },
  ], { x: 1.2, y: 3.05, w: 11, h: 2.5, fontFace: MONO, fontSize: 18, isTextBox: true, valign: "top" });
  s.addText("Runs on any laptop, offline, no keys.", { x: 0.8, y: 6.1, w: 12, h: 0.5, fontFace: BODY, fontSize: 15, italic: true, color: AMBER, isTextBox: true });
  footer(s, 8);
  s.addNotes("Switch to the terminal replay. Narrate the trap -> fix -> split. Then come back to the next slides to lock in what we saw.");
})();

/* 9 — The trap (reveal) */
(() => {
  const s = slide(); title(s, "What the demo shows: the trap");
  s.addText("Give each system only the three teams — no way to say “I can't route this.” Accuracy looks fine. Then look at the six no-context alerts:",
    { x: 0.6, y: 1.4, w: 12, h: 0.9, fontFace: BODY, fontSize: 17, color: FG, isTextBox: true });
  const stat = (x, big, who) => {
    card(s, x, 2.95, 5.7, 2.4);
    s.addText(big, { x: x + 0.3, y: 3.1, w: 5.1, h: 1.3, fontFace: TITLE, fontSize: 68, bold: true, color: RED, isTextBox: true });
    s.addText(who, { x: x + 0.3, y: 4.35, w: 5.1, h: 0.4, fontFace: MONO, fontSize: 17, bold: true, color: FG, isTextBox: true });
    s.addText("silently routed to a team", { x: x + 0.3, y: 4.78, w: 5.1, h: 0.4, fontFace: BODY, fontSize: 14, color: SEC, isTextBox: true });
  };
  stat(0.7, "6 / 6", "JEV");
  stat(6.9, "4 / 6", "Gemini");
  s.addText("Misroute rate: 0%. It looked perfect — while burying every alert that had no answer.",
    { x: 0.6, y: 5.6, w: 12, h: 0.6, fontFace: BODY, fontSize: 17, bold: true, color: AMBER, isTextBox: true });
  footer(s, 9);
  s.addNotes("The gut-punch, restated after they've seen it live. Accuracy hid it; missed escalations exposed it.");
})();

/* 10 — The fix (before/after table) */
(() => {
  const s = slide(); title(s, "The fix: one option, not a bigger model");
  s.addText("Add an explicit “review” option and re-run. Nothing else changes.", { x: 0.6, y: 1.4, w: 12, h: 0.5, fontFace: BODY, fontSize: 16, color: SEC, isTextBox: true });
  s.addText("JEV", { x: 3.2, y: 2.15, w: 3.7, h: 0.4, fontFace: MONO, fontSize: 15, bold: true, color: GREEN, align: "center", isTextBox: true });
  s.addText("Gemini", { x: 6.95, y: 2.15, w: 3.7, h: 0.4, fontFace: MONO, fontSize: 15, bold: true, color: BLUE, align: "center", isTextBox: true });
  const hdr = (t) => ({ text: t, options: { fontFace: MONO, bold: true, color: FG, fill: { color: PANEL }, align: "center", valign: "middle", fontSize: 14 } });
  const cell = (t, col) => ({ text: t, options: { fontFace: MONO, fontSize: 17, bold: true, color: col, align: "center", valign: "middle", fill: { color: "0F1A2E" } } });
  const lab = (t) => ({ text: t, options: { fontFace: TITLE, fontSize: 16, bold: true, color: FG, align: "left", valign: "middle", fill: { color: "0F1A2E" } } });
  const rows = [
    [hdr(""), hdr("forced"), hdr("+ review"), hdr("forced"), hdr("+ review")],
    [lab(" Accuracy"), cell("80%", RED), cell("93%", GREEN), cell("87%", RED), cell("100%", GREEN)],
    [lab(" Missed escalations"), cell("6 / 6", RED), cell("2 / 6", GREEN), cell("4 / 6", RED), cell("0 / 6", GREEN)],
  ];
  s.addTable(rows, { x: 0.7, y: 2.6, w: 10.0, colW: [2.8, 1.8, 1.8, 1.8, 1.8], rowH: [0.55, 0.95, 0.95], border: { type: "solid", color: LINE, pt: 1 }, valign: "middle" });
  s.addText("The review option lifts every learned system — and the clear alerts pay nothing.",
    { x: 0.7, y: 5.55, w: 12, h: 0.6, fontFace: BODY, fontSize: 17, bold: true, color: AMBER, isTextBox: true });
  footer(s, 10);
  s.addNotes("One design change: JEV 80->93, Gemini 87->100. The lever is the option set. Clear-cut alerts stay correct.");
})();

/* 11 — Where they split + the trade-off */
(() => {
  const s = slide(); title(s, "Not a winner — a trade-off");
  s.addText("They disagree on exactly the ambiguous alerts: JEV is just confident enough to route them to SOC (~0.62); Gemini escalates them to review. Calibrated probability vs. a self-estimate.",
    { x: 0.6, y: 1.35, w: 12, h: 0.9, fontFace: BODY, fontSize: 16, color: SEC, isTextBox: true });
  const stat = (x, big, lab2, sub) => {
    card(s, x, 2.7, 5.7, 2.7);
    s.addText(big, { x: x + 0.3, y: 2.9, w: 5.1, h: 1.2, fontFace: TITLE, fontSize: 60, bold: true, color: GREEN, isTextBox: true });
    s.addText(lab2, { x: x + 0.3, y: 4.05, w: 5.1, h: 0.5, fontFace: TITLE, fontSize: 18, bold: true, color: FG, isTextBox: true });
    s.addText(sub, { x: x + 0.3, y: 4.55, w: 5.1, h: 0.7, fontFace: MONO, fontSize: 13, color: SEC, isTextBox: true });
  };
  stat(0.7, "~14×", "faster", "JEV ~0.2s  vs  Gemini ~2.9s / alert");
  stat(6.9, "~9×", "cheaper", "approx. per alert — verify pricing");
  s.addText("Same near-perfect accuracy; opposite profiles. At real queue volume, speed and cost decide it.",
    { x: 0.7, y: 5.6, w: 12, h: 0.6, fontFace: BODY, fontSize: 16, italic: true, color: AMBER, isTextBox: true });
  footer(s, 11);
  s.addNotes("The honest landing: both tie on accuracy; Gemini even edged it by catching the ambiguous ones. JEV's win is speed + cost. Not a winner — a trade-off.");
})();

/* 12 — Your turn */
(() => {
  const s = slide(); title(s, "Your turn to practice");
  s.addText("Build a mix that looks like your queue, route it, and see where the models break — all offline.",
    { x: 0.6, y: 1.4, w: 12, h: 0.6, fontFace: BODY, fontSize: 17, color: SEC, isTextBox: true });
  card(s, 0.7, 2.2, 11.9, 2.6);
  s.addText([
    { text: "python -m nst.generate --mix soc=6,cloud=6,prodsec=6,review=4 --seed 7", options: { color: FG, breakLine: true, paraSpaceAfter: 8 } },
    { text: "python -m nst.run --alerts data/mine.json --condition abstain", options: { color: FG, breakLine: true, paraSpaceAfter: 8 } },
    { text: "python -m nst.metrics --raw results/mine.json", options: { color: FG } },
  ], { x: 1.0, y: 2.55, w: 11.3, h: 1.9, fontFace: MONO, fontSize: 17, isTextBox: true, valign: "top" });
  s.addText("Change the mix, change the seed, change the teams. Bring your own alerts (data/SCHEMA.md).",
    { x: 0.7, y: 5.1, w: 12, h: 0.5, fontFace: BODY, fontSize: 16, italic: true, color: BLUE, isTextBox: true });
  footer(s, 12);
  s.addNotes("The hands-on. On a shared laptop this is shown via the replay; the repo is the take-home so they can run it themselves.");
})();

/* 13 — Takeaways + close */
(() => {
  const s = slide(); title(s, "Take home");
  const items = [
    ["Measure the dangerous failures", "misroutes and missed escalations, not just accuracy"],
    ["Right-size the option set first", "most “the model is wrong” is really “the options were wrong”"],
    ["Match the paradigm to the job", "a bounded decision wants a decision model; keep the LLM for open-ended work"],
    ["Keep an explicit human lane", "don't let confidence on the wrong question replace escalation"],
  ];
  let y = 1.7;
  items.forEach((it, i) => {
    s.addText(String(i + 1), { x: 0.6, y, w: 0.6, h: 0.5, fontFace: MONO, fontSize: 20, bold: true, color: GREEN, isTextBox: true, margin: 0 });
    s.addText(it[0], { x: 1.25, y, w: 11, h: 0.45, fontFace: TITLE, fontSize: 18, bold: true, color: FG, isTextBox: true, margin: 0 });
    s.addText(it[1], { x: 1.25, y: y + 0.42, w: 11.2, h: 0.5, fontFace: BODY, fontSize: 15, color: SEC, isTextBox: true, margin: 0 });
    y += 1.0;
  });
  s.addText("Clone it — runs offline, MIT, bring your own alerts.", { x: 0.6, y: 5.9, w: 12, h: 0.45, fontFace: BODY, fontSize: 16, bold: true, color: FG, isTextBox: true });
  s.addText("github.com/<your-handle>/no-small-talk   ·   thank you — questions?", { x: 0.6, y: 6.35, w: 12, h: 0.45, fontFace: MONO, fontSize: 14, color: GREEN, isTextBox: true });
  footer(s, 13);
  s.addNotes("Takeaways are the reusable pattern. Make the repo link real before presenting; decide public + rotate keys first.");
})();

p.writeFile({ fileName: "/Users/sanjanamishra/Desktop/sanjana_sandbox/no-small-talk/submission/no-small-talk-deck.pptx" }).then(f => console.log("wrote", f));
