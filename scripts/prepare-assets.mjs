import { cp, mkdir, rm } from "node:fs/promises";

const publicDirectory = new URL("../.public/", import.meta.url);
const projectDirectory = new URL("../", import.meta.url);
const files = [
  "index.html",
  "index.css",
  "index.js",
  "refund-cancellation-policy.html",
  "terms-and-conditions.html",
  "privacy-policy.html",
  "contact.html",
  "robots.txt",
  "sitemap.xml",
  "llm.txt",
  "llms.txt",
  "favicon.ico",
  "favicon-16x16.png",
  "favicon-32x32.png",
  "apple-touch-icon.png",
  "site.webmanifest",
  "android-chrome-192x192.png",
  "android-chrome-512x512.png",
  "_headers",
];
const directories = ["assets", "logos"];

await rm(publicDirectory, { recursive: true, force: true });
await mkdir(publicDirectory, { recursive: true });

await Promise.all([
  ...files.map((file) =>
    cp(new URL(file, projectDirectory), new URL(file, publicDirectory)),
  ),
  ...directories.map((directory) =>
    cp(
      new URL(`${directory}/`, projectDirectory),
      new URL(`${directory}/`, publicDirectory),
      { recursive: true },
    ),
  ),
]);

console.log("Prepared public landing-page assets for Astro.");
