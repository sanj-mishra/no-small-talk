const pptxgen = require("pptxgenjs");
const p = new pptxgen();
p.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
p.author = "Sanjana Mishra";
p.title = "No Small Talk";

const BG = "0E1626", PANEL = "16213A", FG = "EAEFF7", MUT = "93A2BD",
      GREEN = "4FD39B", BLUE = "6EA0FF", RED = "FF6B72", AMBER = "E6B45A", LINE = "26324B";
const TITLE = "Calibri", BODY = "Calibri", MONO = "Courier New";
const W = 13.3;

function slide(dark = true) {
  const s = p.addSlide();
  s.background = { color: dark ? BG : "F4F6FA" };
  return s;
}
function title(s, t, color = FG) {
  s.addText(t, { x: 0.6, y: 0.45, w: W - 1.2, h: 0.9, fontFace: TITLE, fontSize: 34, bold: true, color, align: "left", isTextBox: true });
}
function footer(s, n) {
  s.addText("No Small Talk  ·  BSides NYC AI Village", { x: 0.6, y: 7.0, w: 8, h: 0.3, fontFace: MONO, fontSize: 9, color: MUT, isTextBox: true });
  s.addText(String(n), { x: W - 1.1, y: 7.0, w: 0.5, h: 0.3, fontFace: MONO, fontSize: 9, color: MUT, align: "right", isTextBox: true });
}
function chip(s, x, y, text, col) {
  s.addText(text, { x, y, w: 2.2, h: 0.5, fontFace: MONO, fontSize: 14, bold: true, color: col, align: "center", valign: "middle",
    fill: { color: PANEL }, line: { color: col, width: 1 }, rectRadius: 0.1, shape: p.ShapeType.roundRect, isTextBox: true });
}
function card(s, x, y, w, h) {
  s.addShape(p.ShapeType.roundRect, { x, y, w, h, fill: { color: PANEL }, line: { color: LINE, width: 1 }, rectRadius: 0.08, shadow: { type: "outer", color: "000000", opacity: 0.35, blur: 8, offset: 3, angle: 90 } });
}

/* 1 — Title */
(() => {
  const s = slide();
  s.addText("nst $ route --help", { x: 0.6, y: 0.7, w: 8, h: 0.4, fontFace: MONO, fontSize: 14, color: GREEN, isTextBox: true });
  s.addText("No Small Talk", { x: 0.6, y: 2.2, w: 12, h: 1.4, fontFace: TITLE, fontSize: 66, bold: true, color: FG, isTextBox: true });
  s.addText("Does your security queue need an LLM?", { x: 0.6, y: 3.6, w: 12, h: 0.8, fontFace: TITLE, fontSize: 26, color: BLUE, isTextBox: true });
  s.addText("Routing the same alerts through rules, a decision model, and a generative LLM — and measuring what accuracy hides.",
    { x: 0.6, y: 4.5, w: 11, h: 0.8, fontFace: BODY, fontSize: 15, color: MUT, isTextBox: true });
  s.addText("BSIDES NYC  //  AI VILLAGE  //  DEMO LAB", { x: 0.6, y: 6.2, w: 9, h: 0.4, fontFace: MONO, fontSize: 13, color: MUT, charSpacing: 2, isTextBox: true });
  s.addText("Sanjana Mishra", { x: 0.6, y: 6.6, w: 9, h: 0.4, fontFace: BODY, fontSize: 14, bold: true, color: FG, isTextBox: true });
  s.addNotes("Hook: security teams make thousands of small routing calls a day. The question isn't 'can an LLM do it' — it's whether you need one, and how you'd even tell. We'll route 30 real-shaped alerts and measure the thing that actually bites you.");
})();

/* 2 — The problem */
(() => {
  const s = slide(); title(s, "The queue is full of bounded decisions");
  s.addText([
    { text: "Every alert has to go somewhere. Most of the time it's a pick from a short list:", options: { fontSize: 17, color: FG, breakLine: true, paraSpaceAfter: 10 } },
    { text: "which team owns this?", options: { fontSize: 17, color: FG, italic: true, breakLine: true } },
  ], { x: 0.6, y: 1.7, w: 6.1, h: 1.6, fontFace: BODY, isTextBox: true, valign: "top" });
  chip(s, 7.2, 1.8, "SOC", BLUE);
  chip(s, 9.6, 1.8, "Cloud Security", GREEN);
  chip(s, 7.2, 2.5, "ProdSec", AMBER);
  chip(s, 9.6, 2.5, "→ human review", MUT);
  s.addText("30 synthetic alerts", { x: 0.6, y: 3.9, w: 6, h: 0.5, fontFace: TITLE, fontSize: 22, bold: true, color: FG, isTextBox: true });
  s.addText([
    { text: "24 have a clear owning team.", options: { color: FG, breakLine: true, paraSpaceAfter: 8, bullet: { indent: 18 } } },
    { text: "6 genuinely lack the context to route — truncated logs, null fields, “something looks off” tickets. The right answer is escalate to a human.", options: { color: FG, bullet: { indent: 18 } } },
  ], { x: 0.6, y: 4.5, w: 12, h: 1.8, fontFace: BODY, fontSize: 16, isTextBox: true, valign: "top" });
  footer(s, 2);
  s.addNotes("Set the task. Three teams plus a review lane. The six no-context alerts are the crux of the whole talk — hold that thought.");
})();

/* 3 — Three systems */
(() => {
  const s = slide(); title(s, "Three ways to make the call");
  const data = [
    ["rules", "Keyword → team", "Deterministic, free, transparent. Brittle, and blind to what it can't match.", MUT],
    ["JEV", "Decision-native model", "Picks from the options and returns a calibrated probability. Hosted.", GREEN],
    ["Gemini", "Generative LLM", "Prompted for the same options; returns a schema-valid answer + a self-reported confidence. Hosted.", BLUE],
  ];
  const cw = 3.9, gap = 0.3, x0 = 0.6, y0 = 1.8, h = 3.4;
  data.forEach((d, i) => {
    const x = x0 + i * (cw + gap);
    card(s, x, y0, cw, h);
    s.addText(d[0], { x: x + 0.3, y: y0 + 0.35, w: cw - 0.6, h: 0.6, fontFace: MONO, fontSize: 24, bold: true, color: d[3], isTextBox: true });
    s.addText(d[1], { x: x + 0.3, y: y0 + 1.1, w: cw - 0.6, h: 0.5, fontFace: TITLE, fontSize: 15, bold: true, color: FG, isTextBox: true });
    s.addText(d[2], { x: x + 0.3, y: y0 + 1.7, w: cw - 0.6, h: 1.5, fontFace: BODY, fontSize: 14, color: MUT, isTextBox: true, valign: "top" });
  });
  s.addText("JEV vs Gemini is the apples-to-apples pair — both hosted, same interface, same alert, same options. The only thing that differs is the paradigm.",
    { x: 0.6, y: 5.5, w: 12, h: 0.8, fontFace: BODY, fontSize: 15, italic: true, color: AMBER, isTextBox: true });
  footer(s, 3);
  s.addNotes("Rules is the floor. JEV and Gemini are the controlled comparison — hold deployment constant, vary only decision-native vs generative.");
})();

/* 4 — What we measure */
(() => {
  const s = slide(); title(s, "Measure what accuracy hides");
  const rows = [
    ["Misroutes", "sent to the wrong team — the expensive error", RED],
    ["Missed escalations", "auto-routed when it should have asked a human — the dangerous one", AMBER],
    ["Review load", "how much human work the system creates", BLUE],
    ["Latency & cost", "what it takes to run at real queue volume", GREEN],
  ];
  let y = 1.8;
  rows.forEach((r) => {
    s.addShape(p.ShapeType.chord, { x: 0.65, y: y + 0.08, w: 0.28, h: 0.28, fill: { color: r[2] } });
    s.addText(r[0], { x: 1.15, y, w: 3.4, h: 0.5, fontFace: TITLE, fontSize: 18, bold: true, color: FG, isTextBox: true, margin: 0 });
    s.addText(r[1], { x: 4.6, y, w: 8, h: 0.5, fontFace: BODY, fontSize: 16, color: MUT, isTextBox: true, margin: 0, valign: "middle" });
    y += 0.95;
  });
  s.addText("A router can score 100% on accuracy and still be unsafe. These are the numbers that tell you.",
    { x: 0.6, y: 5.9, w: 12, h: 0.6, fontFace: BODY, fontSize: 16, italic: true, color: FG, isTextBox: true });
  footer(s, 4);
  s.addNotes("Accuracy is necessary but not sufficient. The missed-escalation rate is the one people forget to look at.");
})();

/* 5 — The trap */
(() => {
  const s = slide(); title(s, "The trap: a forced choice");
  s.addText("Give each system only the three teams — no way to say “I can't route this.” Accuracy looks fine. Then look at the six no-context alerts:",
    { x: 0.6, y: 1.55, w: 12, h: 0.9, fontFace: BODY, fontSize: 17, color: FG, isTextBox: true });
  const stat = (x, big, who, sub, col) => {
    card(s, x, 2.9, 5.7, 2.6);
    s.addText(big, { x: x + 0.3, y: 3.1, w: 5.1, h: 1.3, fontFace: TITLE, fontSize: 72, bold: true, color: col, isTextBox: true });
    s.addText(who, { x: x + 0.3, y: 4.35, w: 5.1, h: 0.5, fontFace: MONO, fontSize: 18, bold: true, color: FG, isTextBox: true });
    s.addText(sub, { x: x + 0.3, y: 4.8, w: 5.1, h: 0.6, fontFace: BODY, fontSize: 14, color: MUT, isTextBox: true });
  };
  stat(0.6, "6 / 6", "JEV", "no-context alerts silently sent to a team", RED);
  stat(7.0, "4 / 6", "Gemini", "no-context alerts silently sent to a team", RED);
  s.addText("Misroute rate: 0%. It looked perfect — while mishandling every alert that had no answer.",
    { x: 0.6, y: 5.8, w: 12, h: 0.6, fontFace: BODY, fontSize: 16, bold: true, color: AMBER, isTextBox: true });
  footer(s, 5);
  s.addNotes("This is the gut-punch. Both models confidently route the un-routable alerts. Accuracy hid it; missed escalations exposed it.");
})();

/* 6 — The reframe */
(() => {
  const s = slide();
  s.addText("A valid, confident answer\nto the wrong question.", { x: 0.8, y: 2.3, w: 11.7, h: 2.2, fontFace: TITLE, fontSize: 46, bold: true, color: FG, isTextBox: true, align: "left", lineSpacingMultiple: 1.05 });
  s.addText("The model's confidence means “of these options, this one” — not “this is the right call.” We never gave it the option to say the alert had no home.",
    { x: 0.8, y: 4.7, w: 11, h: 1.2, fontFace: BODY, fontSize: 19, color: MUT, isTextBox: true });
  footer(s, 6);
  s.addNotes("The failure isn't hallucination or bad formatting — it's a well-formed, high-confidence answer to a question with no right answer. The calibration was fine; the option set was wrong.");
})();

/* 7 — The fix (before/after table) */
(() => {
  const s = slide(); title(s, "The fix is one option, not a bigger model");
  s.addText("Add an explicit “review” option and re-run. Nothing else changes.", { x: 0.6, y: 1.5, w: 12, h: 0.5, fontFace: BODY, fontSize: 16, color: MUT, isTextBox: true });
  const hdr = (t) => ({ text: t, options: { fontFace: MONO, bold: true, color: FG, fill: { color: PANEL }, align: "center", valign: "middle" } });
  const cell = (t, col) => ({ text: t, options: { fontFace: BODY, fontSize: 16, color: col || FG, align: "center", valign: "middle", fill: { color: "101A2E" } } });
  const lab = (t) => ({ text: t, options: { fontFace: TITLE, fontSize: 16, bold: true, color: FG, align: "left", valign: "middle", fill: { color: "101A2E" } } });
  const rows = [
    [hdr(""), hdr("forced"), hdr("+ review"), hdr("forced"), hdr("+ review")],
    [lab("Accuracy"), cell("80%", RED), cell("93%", GREEN), cell("87%", RED), cell("100%", GREEN)],
    [lab("Missed escalations"), cell("6 / 6", RED), cell("2 / 6", GREEN), cell("4 / 6", RED), cell("0 / 6", GREEN)],
  ];
  // sub-header for which model
  s.addText("JEV", { x: 3.2, y: 2.15, w: 3.4, h: 0.4, fontFace: MONO, fontSize: 15, bold: true, color: GREEN, align: "center", isTextBox: true });
  s.addText("Gemini", { x: 6.9, y: 2.15, w: 3.4, h: 0.4, fontFace: MONO, fontSize: 15, bold: true, color: BLUE, align: "center", isTextBox: true });
  s.addTable(rows, { x: 0.6, y: 2.6, w: 10.1, colW: [2.7, 1.85, 1.85, 1.85, 1.85], rowH: [0.55, 0.9, 0.9], border: { type: "solid", color: LINE, pt: 1 }, valign: "middle" });
  s.addText("The review option lifts every learned system — and the clear alerts pay nothing.",
    { x: 0.6, y: 5.5, w: 12, h: 0.6, fontFace: BODY, fontSize: 17, bold: true, color: AMBER, isTextBox: true });
  footer(s, 7);
  s.addNotes("One design change. JEV 80->93, Gemini 87->100. The lever is the option set, not model size. Clear-cut alerts stay correct.");
})();

/* 8 — Where they split */
(() => {
  const s = slide(); title(s, "Where the two paradigms split");
  s.addText("They disagree on exactly the alerts that are genuinely ambiguous (r3, r4):",
    { x: 0.6, y: 1.55, w: 12, h: 0.5, fontFace: BODY, fontSize: 17, color: FG, isTextBox: true });
  card(s, 0.6, 2.3, 5.9, 2.6);
  s.addText("JEV", { x: 0.9, y: 2.5, w: 5, h: 0.5, fontFace: MONO, fontSize: 20, bold: true, color: GREEN, isTextBox: true });
  s.addText([
    { text: "routes them to SOC", options: { color: FG, breakLine: true, paraSpaceAfter: 6 } },
    { text: "confidence ~0.62 — just over the line", options: { color: MUT, breakLine: true, paraSpaceAfter: 6 } },
    { text: "calibrated over the options it was given", options: { color: MUT } },
  ], { x: 0.9, y: 3.1, w: 5.3, h: 1.6, fontFace: BODY, fontSize: 15, isTextBox: true, valign: "top" });
  card(s, 6.8, 2.3, 5.9, 2.6);
  s.addText("Gemini", { x: 7.1, y: 2.5, w: 5, h: 0.5, fontFace: MONO, fontSize: 20, bold: true, color: BLUE, isTextBox: true });
  s.addText([
    { text: "escalates both to review", options: { color: FG, breakLine: true, paraSpaceAfter: 6 } },
    { text: "self-reported confidence wavered", options: { color: MUT, breakLine: true, paraSpaceAfter: 6 } },
    { text: "here, wavering was the right instinct", options: { color: MUT } },
  ], { x: 7.1, y: 3.1, w: 5.3, h: 1.6, fontFace: BODY, fontSize: 15, isTextBox: true, valign: "top" });
  s.addText("Calibrated probability vs. a self-estimate. Neither is strictly better — but you need to know which one your gate is trusting.",
    { x: 0.6, y: 5.3, w: 12, h: 0.8, fontFace: BODY, fontSize: 16, italic: true, color: AMBER, isTextBox: true });
  footer(s, 8);
  s.addNotes("The ambiguous alerts are exactly where you'd want a human. JEV's calibrated confidence sat just over the gate; Gemini's self-estimate dipped and escalated.");
})();

/* 9 — The trade-off */
(() => {
  const s = slide(); title(s, "Same accuracy, opposite profiles");
  const stat = (x, big, lab2, sub, col) => {
    card(s, x, 2.1, 5.7, 2.9);
    s.addText(big, { x: x + 0.3, y: 2.35, w: 5.1, h: 1.3, fontFace: TITLE, fontSize: 66, bold: true, color: col, isTextBox: true });
    s.addText(lab2, { x: x + 0.3, y: 3.65, w: 5.1, h: 0.5, fontFace: TITLE, fontSize: 18, bold: true, color: FG, isTextBox: true });
    s.addText(sub, { x: x + 0.3, y: 4.15, w: 5.1, h: 0.7, fontFace: MONO, fontSize: 13, color: MUT, isTextBox: true });
  };
  stat(0.6, "~14×", "faster", "JEV ~0.2s  vs  Gemini ~2.9s per alert", GREEN);
  stat(7.0, "~9×", "cheaper", "approx., per alert — verify current pricing", GREEN);
  s.addText("The decision model is conservative, fast, and cheap. The LLM is a touch more willing to escalate. At real triage volume, speed and cost are the whole ballgame.",
    { x: 0.6, y: 5.4, w: 12, h: 0.9, fontFace: BODY, fontSize: 16, color: FG, isTextBox: true });
  footer(s, 9);
  s.addNotes("Both land near-perfect on accuracy. The robust, large-magnitude differences are latency and cost. That's what decides it at scale.");
})();

/* 10 — Demo */
(() => {
  const s = slide();
  s.addText("Live demo", { x: 0.6, y: 0.5, w: 12, h: 0.9, fontFace: TITLE, fontSize: 34, bold: true, color: FG, isTextBox: true });
  card(s, 0.6, 1.7, 12.1, 4.3);
  s.addText("nst ~/no-small-talk $", { x: 1.0, y: 2.1, w: 11, h: 0.4, fontFace: MONO, fontSize: 15, color: GREEN, isTextBox: true });
  s.addText([
    { text: "python -m nst.flow", options: { color: FG, breakLine: true, paraSpaceAfter: 10 } },
    { text: "# forced vs. review option, all three systems — offline, no keys", options: { color: MUT, breakLine: true, paraSpaceAfter: 16, fontSize: 14 } },
    { text: "python -m nst.generate --mix soc=6,cloud=6,prodsec=6,review=4", options: { color: FG, breakLine: true, paraSpaceAfter: 4 } },
    { text: "python -m nst.run --alerts data/mine.json ...", options: { color: FG, breakLine: true, paraSpaceAfter: 10 } },
    { text: "# build a mix like your own queue and route it", options: { color: MUT, fontSize: 14 } },
  ], { x: 1.0, y: 2.6, w: 11, h: 3.0, fontFace: MONO, fontSize: 17, isTextBox: true, valign: "top" });
  s.addText("Runs on any laptop, offline. Clone it and route your own alerts.", { x: 0.6, y: 6.3, w: 12, h: 0.5, fontFace: BODY, fontSize: 15, italic: true, color: AMBER, isTextBox: true });
  footer(s, 10);
  s.addNotes("Switch to the terminal replay here. Show nst.flow (the trap->fix story), then generate a custom mix and route it. Everything offline.");
})();

/* 11 — Takeaways */
(() => {
  const s = slide(); title(s, "What to take home");
  const items = [
    ["Measure the right failures", "Misroutes and missed escalations, not just accuracy. Accuracy hides the dangerous errors."],
    ["Right-size the option set first", "Most “the model is wrong” problems are really “the options were wrong.” Fix that before reaching for a bigger model."],
    ["Match the paradigm to the job", "A bounded decision wants a decision model — fast, cheap, calibrated. Keep the generative model for the open-ended work."],
    ["Keep a human lane", "Design the escalation path explicitly; don't let confidence on the wrong question stand in for it."],
  ];
  let y = 1.8;
  items.forEach((it, i) => {
    s.addText(String(i + 1), { x: 0.6, y, w: 0.6, h: 0.6, fontFace: MONO, fontSize: 22, bold: true, color: GREEN, isTextBox: true, margin: 0 });
    s.addText(it[0], { x: 1.3, y, w: 11, h: 0.5, fontFace: TITLE, fontSize: 19, bold: true, color: FG, isTextBox: true, margin: 0 });
    s.addText(it[1], { x: 1.3, y: y + 0.45, w: 11.2, h: 0.7, fontFace: BODY, fontSize: 15, color: MUT, isTextBox: true, margin: 0 });
    y += 1.25;
  });
  footer(s, 11);
  s.addNotes("The reusable pattern, not the specific tools. Someone should leave able to run this eval on their own queue.");
})();

/* 12 — Closing */
(() => {
  const s = slide();
  s.addText("Clone it. Route your own alerts.", { x: 0.8, y: 2.5, w: 11.7, h: 1.2, fontFace: TITLE, fontSize: 40, bold: true, color: FG, isTextBox: true });
  s.addText("Open source, MIT. Runs offline — no keys needed. Bring your own teams and alerts.",
    { x: 0.8, y: 3.7, w: 11, h: 0.8, fontFace: BODY, fontSize: 18, color: MUT, isTextBox: true });
  s.addText("github.com/<your-handle>/no-small-talk   ·   @your-handle", { x: 0.8, y: 5.0, w: 11, h: 0.5, fontFace: MONO, fontSize: 15, color: GREEN, isTextBox: true });
  s.addText("Thank you — questions?", { x: 0.8, y: 5.8, w: 11, h: 0.6, fontFace: TITLE, fontSize: 22, bold: true, color: BLUE, isTextBox: true });
  s.addNotes("Make the repo link real before presenting (it's private now — decide if/when to make public). Invite questions; the honest caveats (synthetic, n=30, accuracy gap is one alert) are good Q&A fodder.");
})();

p.writeFile({ fileName: "/Users/sanjanamishra/Desktop/sanjana_sandbox/no-small-talk/submission/no-small-talk-deck.pptx" }).then(f => console.log("wrote", f));
