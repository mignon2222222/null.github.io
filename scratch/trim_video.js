const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting video trim script...');

// Step 1: Install ffmpeg-static locally if not present
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
const ffmpegStaticPath = path.join(nodeModulesPath, 'ffmpeg-static');

if (!fs.existsSync(ffmpegStaticPath)) {
  console.log('ffmpeg-static not found. Installing...');
  execSync('npm install ffmpeg-static', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
}

const ffmpeg = require('ffmpeg-static');
console.log('ffmpeg binary path:', ffmpeg);

const assetsDir = path.join(__dirname, '..', 'assets');
const videosToTrim = ['subject obser.mp4', 'observation mini.mp4'];

videosToTrim.forEach(video => {
  const inputPath = path.join(assetsDir, video);
  const outputPath = path.join(assetsDir, `trimmed_${video}`);

  if (fs.existsSync(inputPath)) {
    console.log(`Trimming 1 second from front of ${video}...`);
    // Trim from 1s to the end of the video
    try {
      execSync(`"${ffmpeg}" -ss 1 -i "${inputPath}" -c:v libx264 -c:a aac "${outputPath}" -y`, { stdio: 'inherit' });
      
      // Replace the original with the trimmed version
      fs.unlinkSync(inputPath);
      fs.renameSync(outputPath, inputPath);
      console.log(`Successfully trimmed and replaced ${video}`);
    } catch (error) {
      console.error(`Error trimming ${video}:`, error);
    }
  } else {
    console.log(`Video file ${video} not found at ${inputPath}`);
  }
});

console.log('Finished.');
