import { cp, mkdir, rm } from 'node:fs/promises';

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
