// Offline: "Jacob J. Choi" -> the signature's pieces as SVG paths, with cursive
// connectors bridging the word gaps (b->J, .->C), assembled in writing order.
const fs = require("fs");
const path = require("path");
const opentype = require("opentype.js");

const TEXT = "Jacob J. Choi";
const FONT = path.join(__dirname, "GreatVibes.ttf");
/* Relative to this file, never an absolute machine path: the generator has to work
   in any clone, and a hardcoded path silently wrote into one checkout while a test
   believed it was verifying another. */
const OUT = path.join(__dirname, "..", "src", "constants", "signature.ts");
const CHECK = process.argv.includes("--check");
/* Reject anything else, so a typo cannot silently run the mutating path. */
{
  const unknown = process.argv.slice(2).filter((a) => a !== "--check");
  if (unknown.length) {
    console.error(`generate-signature: unrecognised argument "${unknown[0]}"`);
    process.exit(1);
  }
}
/* In --check mode the only output that should reach CI logs is the verdict. */
const log = (...a) => { if (!CHECK) console.log(...a); };
const STEPS = 8;
const FS = 220;

const _buf = fs.readFileSync(FONT);
const font = opentype.parse(_buf.buffer.slice(_buf.byteOffset, _buf.byteOffset + _buf.byteLength));
const scale = FS / font.unitsPerEm;

function cubic(p0,p1,p2,p3,t){const u=1-t;return{x:u*u*u*p0.x+3*u*u*t*p1.x+3*u*t*t*p2.x+t*t*t*p3.x,y:u*u*u*p0.y+3*u*u*t*p1.y+3*u*t*t*p2.y+t*t*t*p3.y};}
function quad(p0,p1,p2,t){const u=1-t;return{x:u*u*p0.x+2*u*t*p1.x+t*t*p2.x,y:u*u*p0.y+2*u*t*p1.y+t*t*p2.y};}

function flatten(commands) {
  const contours=[]; let cur=null,start=null,pt=null;
  for (const c of commands) {
    if (c.type==="M"){cur=[];contours.push(cur);pt={x:c.x,y:c.y};start=pt;cur.push(pt);}
    else if (c.type==="L"){pt={x:c.x,y:c.y};cur.push(pt);}
    else if (c.type==="C"){const p0=pt,p1={x:c.x1,y:c.y1},p2={x:c.x2,y:c.y2},p3={x:c.x,y:c.y};for(let i=1;i<=STEPS;i++)cur.push(cubic(p0,p1,p2,p3,i/STEPS));pt=p3;}
    else if (c.type==="Q"){const p0=pt,p1={x:c.x1,y:c.y1},p2={x:c.x,y:c.y};for(let i=1;i<=STEPS;i++)cur.push(quad(p0,p1,p2,i/STEPS));pt=p2;}
    else if (c.type==="Z"){if(start)cur.push({x:start.x,y:start.y});pt=start;}
  }
  return contours;
}

// per-glyph contours + x positions
const glyphs = [];
let penX = 0, prev = null;
for (const ch of TEXT) {
  const g = font.charToGlyph(ch);
  if (prev) penX += font.getKerningValue(prev, g) * scale;
  const xStart = penX;
  const contours = flatten(g.getPath(penX, 0, FS).commands);
  penX += (g.advanceWidth || font.unitsPerEm * 0.3) * scale;
  // bottom-left / bottom-right ink anchors near the baseline
  let bl = { x: Infinity, y: 0 }, br = { x: -Infinity, y: 0 };
  for (const ct of contours) for (const p of ct) if (p.y > -15 && p.y < 60) {
    if (p.x < bl.x) bl = { x: p.x, y: p.y };
    if (p.x > br.x) br = { x: p.x, y: p.y };
  }
  if (!isFinite(bl.x)) { bl = { x: xStart, y: 0 }; br = { x: penX, y: 0 }; }
  glyphs.push({ ch, xStart, xEnd: penX, contours, baseLeft: bl, baseRight: br });
  prev = g;
}


/* Connectors and the flourish are drawn here rather than taken from the font,
   so they are sampled densely and left to rdp() below. STEPS alone left the
   long flourish up to ~2 units off its curve. The glyphs keep STEPS: the box
   is computed from their points. */
const CURVE_STEPS = 64;

// cursive baseline join between words: shallow under-arc
function connector(p1, p2) {
  // nearly straight, gentle downward bow so it reads as a quick handwritten link
  const sag = 9;
  const lerp = (t) => p1.y + (p2.y - p1.y) * t;
  const a = { x: p1.x + (p2.x - p1.x) * 0.33, y: lerp(0.33) + sag };
  const b = { x: p1.x + (p2.x - p1.x) * 0.67, y: lerp(0.67) + sag };
  const pts = [p1];
  for (let i = 1; i <= CURVE_STEPS; i++) pts.push(cubic(p1, a, b, p2, i / CURVE_STEPS));
  return pts;
}

// assemble the pieces in writing order, inserting a connector across each space gap
const pieces = [];
let prevLetter = null;
let sawSpace = false;
for (const gl of glyphs) {
  if (gl.ch === " ") { sawSpace = true; continue; }
  if (prevLetter) {
    const involvesPunct = prevLetter.ch === "." || gl.ch === ".";
    if (sawSpace || involvesPunct) pieces.push(connector(prevLetter.baseRight, gl.baseLeft));
  }
  for (const ct of gl.contours) pieces.push(ct);
  prevLetter = gl;
  sawSpace = false;
}

// flourish: grows out of the final letter's bottom-right ink, sweeps left
const iA = glyphs[glyphs.length - 1].baseRight;
{
  const flourish = [iA];
  const c1 = [iA, { x: iA.x - 110, y: iA.y + 68 }, { x: 760, y: 104 }, { x: 420, y: 102 }];
  const c2 = [c1[3], { x: 220, y: 101 }, { x: 70, y: 92 }, { x: 95, y: 48 }];
  for (const c of [c1, c2]) for (let i = 1; i <= CURVE_STEPS; i++) flourish.push(cubic(...c, i / CURVE_STEPS));
  pieces.push(flourish);
}
log(`i anchor: ${iA.x.toFixed(0)},${iA.y.toFixed(0)}`);

/* Ramer-Douglas-Peucker: drop points that sit within TOLERANCE units of the
   line through their neighbours. The signature renders 32px tall, about 0.1
   CSS px per unit, so most of the sampled points are closer together than a
   pixel. Iterative, so a long contour cannot hit the recursion limit. */
const TOLERANCE = 0.4;
function rdp(pts) {
  if (pts.length < 3) return pts;
  const keep = new Array(pts.length).fill(false);
  keep[0] = keep[pts.length - 1] = true;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const A = pts[a], B = pts[b];
    const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy);
    let best = -1, bestI = -1;
    for (let i = a + 1; i < b; i++) {
      const P = pts[i];
      const dist = len ? Math.abs(dx * (A.y - P.y) - dy * (A.x - P.x)) / len : Math.hypot(P.x - A.x, P.y - A.y);
      if (dist > best) { best = dist; bestI = i; }
    }
    if (best > TOLERANCE) { keep[bestI] = true; stack.push([a, bestI], [bestI, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

/* Each piece becomes its own absolute M/L path with integer coordinates.
   Absolute so the pieces join back into one valid path by concatenation.
   `length` drives the constant pen speed; `closed` marks the letter contours,
   which are also the fill. */
const strokes = pieces.map((raw) => {
  const pts = rdp(raw).map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) }))
    .filter((p, i, a) => i === 0 || p.x !== a[i - 1].x || p.y !== a[i - 1].y);
  let length = 0;
  for (let i = 1; i < pts.length; i++) length += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  const first = pts[0], last = pts[pts.length - 1];
  return {
    d: `M${first.x} ${first.y}` + pts.slice(1).map((p) => `L${p.x} ${p.y}`).join(""),
    length: Math.round(length),
    closed: first.x === last.x && first.y === last.y,
  };
});
const points = strokes.reduce((n, s) => n + s.d.split(/[ML]/).length - 1, 0);

// bbox over all letter points (+ room for connectors/flourish below)
let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
for (const gl of glyphs) for (const ct of gl.contours) for (const p of ct){minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);}
const pad = 10;
const box = {
  x:+(minX-pad).toFixed(1),
  y:+(minY-pad).toFixed(1),
  w:+(maxX-minX+2*pad).toFixed(1),
  h:+(maxY-minY+2*pad+26).toFixed(1), // extra bottom room for flourish belly (y~104)
};

const out =
`// Auto-generated "Jacob J. Choi" signature, one entry per piece in writing
// order: letter contours, cursive connectors bridging the word gaps, and the
// flourish. Do not hand-edit; regenerate with scripts/generate-signature.cjs.
export const signatureStrokes: readonly { d: string; length: number; closed: boolean }[] = [
${strokes.map((s) => `  ${JSON.stringify(s)},`).join("\n")}
];
export const signatureBox = ${JSON.stringify(box)};
`;
if (CHECK) {
  /* Non-mutating verification for CI: regenerate in memory and compare against the
     committed artifact. Nothing is written, so a failure cannot be masked by the
     file having just been overwritten. */
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : null;
  if (current === null) {
    console.error(`signature check: FAIL, ${OUT} does not exist`);
    process.exit(1);
  }
  if (current !== out) {
    console.error("signature check: FAIL, regenerated output differs from the committed signature.");
    console.error(`  committed:   ${current.length} chars`);
    console.error(`  regenerated: ${out.length} chars`);
    console.error("  The font, opentype.js version, or generator parameters changed.");
    console.error("  Re-run without --check to accept the new output, and review the rendered signature.");
    process.exit(1);
  }
  console.log(`signature check: PASS (reproduces committed signature, box ${box.w}x${box.h}, ${strokes.length} pieces, ${points} points)`);
  process.exit(0);
}

fs.writeFileSync(OUT, out);
console.log(`wrote signature.ts: box ${box.w}x${box.h}, ${strokes.length} pieces, ${points} points`);

const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.x} ${box.y} ${box.w} ${box.h}"><rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="#0a0a0c"/><path d="${strokes.map((s) => s.d).join("")}" fill="none" stroke="#54E09C" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const svgOut = path.join(require("os").tmpdir(), "sig_verify.svg");
fs.writeFileSync(svgOut, svg);
console.log(`wrote ${svgOut}`);
