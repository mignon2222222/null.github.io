const fs = require('fs');
const path = require('path');

const { PNG } = require('pngjs');

const assetsDir = path.join(__dirname, '..', 'assets');
const files = fs.readdirSync(assetsDir).filter(f => f.endsWith('.png') && f !== 'scanline.png');

console.log('Analyzing PNG images in assets:');

files.forEach(file => {
  const filePath = path.join(assetsDir, file);
  const data = fs.readFileSync(filePath);
  try {
    const png = PNG.sync.read(data);
    const { width, height } = png;
    
    // Look at the middle 20% of the image
    const midYStart = Math.floor(height * 0.4);
    const midYEnd = Math.floor(height * 0.6);
    const midXStart = Math.floor(width * 0.4);
    const midXEnd = Math.floor(width * 0.6);

    // Check horizontal lines in the middle
    for (let y = midYStart; y < midYEnd; y++) {
      let isConsistent = true;
      const firstIdx = (width * y) * 4;
      const r0 = png.data[firstIdx];
      const g0 = png.data[firstIdx + 1];
      const b0 = png.data[firstIdx + 2];

      let diffCount = 0;
      for (let x = 1; x < width; x++) {
        const idx = (width * y + x) * 4;
        const r = png.data[idx];
        const g = png.data[idx + 1];
        const b = png.data[idx + 2];
        
        const dist = Math.sqrt((r-r0)**2 + (g-g0)**2 + (b-b0)**2);
        if (dist > 15) {
          diffCount++;
        }
      }
      
      if (diffCount < width * 0.05) {
        console.log(`[Horizontal Solid Line] in ${file} at Y=${y} (color: rgb(${r0},${g0},${b0}))`);
      }
    }

    // Check vertical lines in the middle
    for (let x = midXStart; x < midXEnd; x++) {
      const firstIdx = x * 4;
      const r0 = png.data[firstIdx];
      const g0 = png.data[firstIdx + 1];
      const b0 = png.data[firstIdx + 2];

      let diffCount = 0;
      for (let y = 1; y < height; y++) {
        const idx = (width * y + x) * 4;
        const r = png.data[idx];
        const g = png.data[idx + 1];
        const b = png.data[idx + 2];

        const dist = Math.sqrt((r-r0)**2 + (g-g0)**2 + (b-b0)**2);
        if (dist > 15) {
          diffCount++;
        }
      }

      if (diffCount < height * 0.05) {
        console.log(`[Vertical Solid Line] in ${file} at X=${x} (color: rgb(${r0},${g0},${b0}))`);
      }
    }
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
  }
});

console.log('Analysis completed.');
