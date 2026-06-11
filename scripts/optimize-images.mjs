#!/usr/bin/env node
/**
 * Image Optimization Script for Codju AI Creator Camp
 * Converts PNG/JPEG to WebP with resize using sharp-cli.
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
  'day1.png':          { maxWidth: 512, quality: 75 },
  'day2.png':          { maxWidth: 512, quality: 75 },
  'day3.png':          { maxWidth: 512, quality: 75 },
  'day4.png':          { maxWidth: 512, quality: 75 },
  'day5.png':          { maxWidth: 512, quality: 75 },
  'day6.png':          { maxWidth: 512, quality: 75 },
  'day7.png':          { maxWidth: 512, quality: 75 },
  'image.png':         { maxWidth: 512, quality: 75 },

  // Certificate & support images (displayed at ~500px max)
  'codju_certificate.png':     { maxWidth: 600, quality: 75 },
  'codju_support_update.png':  { maxWidth: 600, quality: 75 },
  'codju_support_cohort.png':  { maxWidth: 600, quality: 75 },
  'codju_support_mentor.png':  { maxWidth: 600, quality: 75 },

  // Logo and profile
  'logo.png':             { maxWidth: 200, quality: 80 },
  'rohit_profile.jpeg':   { maxWidth: 400, quality: 75 },
};

console.log('=== Image Optimization ===\n');

let totalOriginal = 0;
let totalWebP = 0;

for (const [filename, config] of Object.entries(CONFIGS)) {
  const inputPath = join(ASSETS_DIR, filename);
  const webpName = filename.replace(/\.(png|jpe?g)$/i, '.webp');
  const outputDir = ASSETS_DIR;

  try {
    const inputStat = await stat(inputPath);
    const origSize = inputStat.size;

    // sharp-cli: -i input -o outputDir -f webp -q quality resize width
    const cmd = `npx -y sharp-cli -i "${inputPath}" -o "${outputDir}" -f webp -q ${config.quality} resize ${config.maxWidth}`;
    execSync(cmd, { stdio: 'pipe' });

    const outputPath = join(ASSETS_DIR, webpName);
    const outputStat = await stat(outputPath);
    const webpSize = outputStat.size;

    totalOriginal += origSize;
    totalWebP += webpSize;

    const pct = Math.round((webpSize / origSize) * 100);
    console.log(`  ${filename.padEnd(30)} ${Math.round(origSize/1024).toString().padStart(5)} KB → ${Math.round(webpSize/1024).toString().padStart(5)} KB (${pct}%)`);
  } catch (err) {
    console.log(`  ${filename.padEnd(30)} ERROR: ${err.stderr?.toString().split('\n')[0] || err.message}`);
  }
}

console.log(`\n=== Summary ===`);
console.log(`  Original total: ${Math.round(totalOriginal / 1024)} KB`);
console.log(`  WebP total:     ${Math.round(totalWebP / 1024)} KB`);
console.log(`  Savings:        ${Math.round((totalOriginal - totalWebP) / 1024)} KB (${Math.round((1 - totalWebP / totalOriginal) * 100)}%)`);
