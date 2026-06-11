#!/usr/bin/env node
/**
 * Image Optimization Script for Codju AI Creator Camp
 * Converts PNG/JPEG to WebP and AVIF with resize using sharp-cli.
 * 
 * Usage: node scripts/optimize-images.mjs
 */

import { stat } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ASSETS_DIR = join(__dirname, '..', 'assets');

const CONFIGS = {
  // Tool logos (displayed at ~48px, serve 96px for 2x retina)
  'chatgpt.png':       { maxWidth: 96,  quality: 80 },
  'elevenlabs.png':    { maxWidth: 96,  quality: 80 },
  'canva.png':         { maxWidth: 96,  quality: 80 },
  'notebooklm.png':    { maxWidth: 96,  quality: 80 },
  'suno.png':          { maxWidth: 96,  quality: 80 },
  'lovable.png':       { maxWidth: 96,  quality: 80 },
  'make.png':          { maxWidth: 96,  quality: 80 },
  'ideogram.png':      { maxWidth: 96,  quality: 80 },
  'perplexity.png':    { maxWidth: 96,  quality: 80 },
  'google_labs.png':   { maxWidth: 96,  quality: 80 },
  'capcut.png':        { maxWidth: 96,  quality: 80 },
  'gemini.png':        { maxWidth: 96,  quality: 80 },
  'pika.png':          { maxWidth: 96,  quality: 80 },

  // Day curriculum images (displayed at ~400px max)
  'day1.png':          { maxWidth: 512, maxWidthSm: 350, quality: 75 },
  'day2.png':          { maxWidth: 512, maxWidthSm: 350, quality: 75 },
  'day3.png':          { maxWidth: 512, maxWidthSm: 350, quality: 75 },
  'day4.png':          { maxWidth: 512, maxWidthSm: 350, quality: 75 },
  'day5.png':          { maxWidth: 512, maxWidthSm: 350, quality: 75 },
  'day6.png':          { maxWidth: 512, maxWidthSm: 350, quality: 75 },
  'day7.png':          { maxWidth: 512, maxWidthSm: 350, quality: 75 },
  'image.png':         { maxWidth: 512, maxWidthSm: 350, quality: 75 },

  // Certificate & support images (displayed at ~500px max)
  'codju_certificate.png':     { maxWidth: 600, maxWidthSm: 350, quality: 75 },
  'codju_support_update.png':  { maxWidth: 600, maxWidthSm: 350, quality: 75 },
  'codju_support_cohort.png':  { maxWidth: 600, maxWidthSm: 350, quality: 75 },
  'codju_support_mentor.png':  { maxWidth: 600, maxWidthSm: 350, quality: 75 },

  // Logo and profile
  'logo.png':             { maxWidth: 200, quality: 80 },
  'rohit_profile.jpeg':   { maxWidth: 400, maxWidthSm: 300, quality: 75 },

  // Video Facade Thumbnail
  'hero_video_thumbnail.jpg': { maxWidth: 640, maxWidthSm: 350, quality: 75 },
};

console.log('=== Image Optimization (WebP + AVIF) ===\n');

let totalOriginal = 0;
let totalWebP = 0;
let totalAVIF = 0;

for (const [filename, config] of Object.entries(CONFIGS)) {
  const inputPath = join(ASSETS_DIR, filename);
  const baseName = filename.replace(/\.(png|jpe?g)$/i, '');

  try {
    const inputStat = await stat(inputPath);
    const origSize = inputStat.size;
    totalOriginal += origSize;

    console.log(`Processing: ${filename} (Original: ${Math.round(origSize/1024)} KB)`);

    // Define formats to build
    const formats = [
      { ext: '.webp', format: 'webp', q: config.quality, sizeTracker: (s) => totalWebP += s },
      { ext: '.avif', format: 'avif', q: Math.max(30, config.quality - 15), sizeTracker: (s) => totalAVIF += s }
    ];

    for (const fmt of formats) {
      // 1. Large variant
      const outName = `${baseName}${fmt.ext}`;
      const outPath = join(ASSETS_DIR, outName);
      const cmd = `npx -y sharp-cli -i "${inputPath}" -o "${outPath}" -f ${fmt.format} -q ${fmt.q} resize ${config.maxWidth}`;
      execSync(cmd, { stdio: 'pipe' });
      const outStat = await stat(outPath);
      fmt.sizeTracker(outStat.size);
      console.log(`  -> Generated: ${outName} (${Math.round(outStat.size/1024)} KB)`);

      // 2. Small variant (if specified)
      if (config.maxWidthSm) {
        const outNameSm = `${baseName}-sm${fmt.ext}`;
        const outPathSm = join(ASSETS_DIR, outNameSm);
        const cmdSm = `npx -y sharp-cli -i "${inputPath}" -o "${outPathSm}" -f ${fmt.format} -q ${fmt.q} resize ${config.maxWidthSm}`;
        execSync(cmdSm, { stdio: 'pipe' });
        const outStatSm = await stat(outPathSm);
        fmt.sizeTracker(outStatSm.size);
        console.log(`  -> Generated: ${outNameSm} (${Math.round(outStatSm.size/1024)} KB)`);
      }
    }
  } catch (err) {
    console.log(`  ERROR on ${filename}: ${err.stderr?.toString().split('\n')[0] || err.message}`);
  }
}

console.log(`\n=== Summary ===`);
console.log(`  Original total: ${Math.round(totalOriginal / 1024)} KB`);
console.log(`  WebP total:     ${Math.round(totalWebP / 1024)} KB`);
console.log(`  AVIF total:     ${Math.round(totalAVIF / 1024)} KB`);
console.log(`  Combined saved: ${Math.round((totalOriginal * 2 - (totalWebP + totalAVIF)) / 1024)} KB`);

