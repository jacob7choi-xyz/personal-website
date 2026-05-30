// Offline: "Jacob J. Choi" -> one continuous SVG path with cursive connectors
// bridging the word gaps (b->J, .->C), assembled in writing order.
const fs = require("fs");
const opentype = require("opentype.js");

const TEXT = "Jacob J. Choi";
const FONT = require("path").join(__dirname, "GreatVibes.ttf");
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


const ctToSub = (ct) => {
  let s = `M${ct[0].x.toFixed(0)} ${ct[0].y.toFixed(0)}`;
  for (let i=1;i<ct.length;i++) s += `L${ct[i].x.toFixed(0)} ${ct[i].y.toFixed(0)}`;
  return s;
};

// cursive baseline join between words: shallow under-arc
function connector(p1, p2) {
  // nearly straight, gentle downward bow so it reads as a quick handwritten link
  const sag = 9;
  const lerp = (t) => p1.y + (p2.y - p1.y) * t;
  const ax = p1.x + (p2.x - p1.x) * 0.33;
  const bx = p1.x + (p2.x - p1.x) * 0.67;
  return `M${p1.x.toFixed(1)} ${p1.y.toFixed(1)} C${ax.toFixed(1)} ${(lerp(0.33) + sag).toFixed(1)}, ${bx.toFixed(1)} ${(lerp(0.67) + sag).toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
}

// assemble in writing order, inserting a connector across each space gap
let d = "";
let prevLetter = null;
let sawSpace = false;
for (const gl of glyphs) {
  if (gl.ch === " ") { sawSpace = true; continue; }
  if (prevLetter) {
    const involvesPunct = prevLetter.ch === "." || gl.ch === ".";
    if (sawSpace || involvesPunct) d += connector(prevLetter.baseRight, gl.baseLeft);
  }
  for (const ct of gl.contours) d += ctToSub(ct);
  prevLetter = gl;
  sawSpace = false;
}

// flourish: grows out of the final letter's bottom-right ink, sweeps left
const iA = glyphs[glyphs.length - 1].baseRight;
d += `M${iA.x.toFixed(1)} ${iA.y.toFixed(1)} C${(iA.x - 110).toFixed(1)} ${(iA.y + 68).toFixed(1)}, 760 104, 420 102 C220 101, 70 92, 95 48`;
console.log(`i anchor: ${iA.x.toFixed(0)},${iA.y.toFixed(0)}`);

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
`// Auto-generated "Jacob J. Choi" signature: one continuous path with cursive
// connectors bridging the word gaps. Each segment is an SVG subpath.
export const signaturePath = ${JSON.stringify(d)};
export const signatureBox = ${JSON.stringify(box)};
`;
fs.writeFileSync("/Users/choija/Desktop/jacob-choi-website/src/constants/signature.ts", out);
console.log(`wrote signature.ts: box ${box.w}x${box.h}, path ${d.length} chars`);

const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.x} ${box.y} ${box.w} ${box.h}"><rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="#0a0a0c"/><path d="${d}" fill="none" stroke="#54E09C" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
fs.writeFileSync("/tmp/sig_verify.svg", svg);
console.log("wrote /tmp/sig_verify.svg");
