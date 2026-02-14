#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "assets", "icons");
const MASTER_PATH = path.join(OUT_DIR, "icon-master.png");
const MODEL = process.env.NANOBANANA_MODEL || "gemini-3-pro-image-preview";
const API_KEY = process.env.NANOBANANA_API_KEY || process.env.GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

if (!API_KEY) {
  console.error("API key is missing. Set NANOBANANA_API_KEY or GEMINI_API_KEY.");
  process.exit(1);
}

const prompt = [
  "Create a 1200x1200px square pop manga-style app icon for a U.S. presidents learning app.",
  "",
  "Style requirements:",
  "- Simple bold black outlines",
  "- Flat colors with minimal shading",
  "- Clean vector-like finish",
  "- Same line thickness and chibi taste as the existing presidential illustrations",
  "- No text, no letters, no numbers, no watermark",
  "- Fill the full square canvas edge-to-edge",
  "- Strong readability at small sizes",
  "",
  "Design:",
  "- Single iconic chibi bust inspired by U.S. presidents (not a specific real person)",
  "- One symbolic object only: a small U.S. flag pin",
  "- Background motif inspired by civic emblem shapes in matching style",
  "- Keep the look friendly, bold, and consistent with the app's existing art style"
].join("\n");

async function generateImage() {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"]
      }
    })
  });

  if (!response.ok) {
    throw new Error(`API ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((part) => part.inlineData?.data);
  if (!imagePart?.inlineData?.data) {
    throw new Error(`No image found in response: ${JSON.stringify(data).slice(0, 400)}...`);
  }
  return Buffer.from(imagePart.inlineData.data, "base64");
}

function runSipsResize(input, output, size) {
  execFileSync("sips", ["-s", "format", "png", "-z", String(size), String(size), input, "--out", output], {
    stdio: "ignore"
  });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const image = await generateImage();
  fs.writeFileSync(MASTER_PATH, image);

  runSipsResize(MASTER_PATH, path.join(OUT_DIR, "icon-192.png"), 192);
  runSipsResize(MASTER_PATH, path.join(OUT_DIR, "icon-512.png"), 512);
  runSipsResize(MASTER_PATH, path.join(OUT_DIR, "maskable-512.png"), 512);
  runSipsResize(MASTER_PATH, path.join(OUT_DIR, "apple-touch-icon.png"), 180);

  console.log(`Generated icons in: ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
