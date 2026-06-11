import { cp, mkdir, rm } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const outputDirectory = new URL('../.site/', import.meta.url);
const projectDirectory = new URL('../', import.meta.url);
const files = [
  'index.html',
  'index.css',
  'index.js',
  'refund-cancellation-policy.html',
  'terms-and-conditions.html',
  'privacy-policy.html',
  'contact.html',
  'robots.txt',
  'sitemap.xml',
  'llm.txt',
  'favicon.ico',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'apple-touch-icon.png',
  'site.webmanifest',
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
];
const directories = ['assets', 'logos'];

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

await Promise.all([
  ...files.map((file) => cp(
    new URL(file, projectDirectory),
    new URL(file, outputDirectory),
  )),
  ...directories.map((directory) => cp(
    new URL(`${directory}/`, projectDirectory),
    new URL(`${directory}/`, outputDirectory),
    { recursive: true },
  )),
]);

console.log('Prepared Cloudflare static assets in .site/');

// Minify assets in-place inside .site/
const outputDirPath = fileURLToPath(outputDirectory);
try {
  console.log('Minifying CSS...');
  execSync(`npx clean-css-cli -o "${outputDirPath}index.css" "${outputDirPath}index.css"`, { stdio: 'inherit' });

  console.log('Minifying JS...');
  execSync(`npx terser "${outputDirPath}index.js" -o "${outputDirPath}index.js"`, { stdio: 'inherit' });

  console.log('Minifying HTML files...');
  const htmlFiles = files.filter(f => f.endsWith('.html'));
  for (const htmlFile of htmlFiles) {
    execSync(`npx html-minifier --collapse-whitespace --remove-comments --minify-css true --minify-js true -o "${outputDirPath}${htmlFile}" "${outputDirPath}${htmlFile}"`, { stdio: 'inherit' });
  }
  console.log('Minification complete!');
} catch (err) {
  console.error('Minification failed:', err.message);
}
