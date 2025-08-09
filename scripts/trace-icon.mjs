import fs from 'node:fs';
import path from 'node:path';
import ImageTracer from 'imagetracerjs';

// Usage: node scripts/trace-icon.mjs <input.png> <output.svg>
const [,, inArg, outArg] = process.argv;
if (!inArg || !outArg) {
  console.error('Usage: node scripts/trace-icon.mjs <input.png> <output.svg>');
  process.exit(1);
}

const input = path.resolve(inArg);
const output = path.resolve(outArg);

// Tuning options for crisp line-art vectorization
const options = {
  // Higher means fewer path segments (we want cleaner lines)
  ltres: 1,
  // Quantization resolution (more → fewer colors)
  qtres: 1,
  // Omit short paths
  pathomit: 2,
  roundcoords: 2,
  numberofcolors: 2, // monochrome-ish
  mincolorratio: 0.02,
  blur: 0, // keep edges sharp
  strokewidth: 1,
  linefilter: true,
};

ImageTracer.imageToSVG(input, (svgString) => {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, svgString, 'utf8');
  console.log(`Wrote SVG → ${output}`);
}, options);

