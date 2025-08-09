const fs = require('fs');
const path = require('path');
const potrace = require('potrace');

// Usage: node scripts/trace-icon.cjs <input.png> <output.svg>
const [, , inArg, outArg] = process.argv;
if (!inArg || !outArg) {
  console.error('Usage: node scripts/trace-icon.cjs <input.png> <output.svg>');
  process.exit(1);
}

const input = path.resolve(inArg);
const output = path.resolve(outArg);

const options = {
  // Lower threshold → traces darker pixels only (line art)
  threshold: 180,
  turdSize: 2, // omit small specks
  turnPolicy: potrace.Potrace.TURNPOLICY_MINORITY,
  color: '#1E1E24', // match existing icon color
  // optimizeCurve controls smoothing
  optTolerance: 0.4,
};

potrace.trace(input, options, function (err, svg) {
  if (err) throw err;
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, svg, 'utf8');
  console.log(`Wrote SVG → ${output}`);
});
