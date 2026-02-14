#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const DATA_PATH = path.join(ROOT, "data.js");
const OUT_DIR = path.join(ROOT, "assets", "presidents");

const MODEL = process.env.NANOBANANA_MODEL || "gemini-3-pro-image-preview";
const API_KEY = process.env.NANOBANANA_API_KEY || process.env.GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

if (!API_KEY) {
  console.error("API key missing. Set NANOBANANA_API_KEY or GEMINI_API_KEY.");
  process.exit(1);
}

if (!fs.existsSync(DATA_PATH)) {
  console.error(`Missing data file: ${DATA_PATH}`);
  process.exit(1);
}

function loadPresidentsById() {
  const src = fs.readFileSync(DATA_PATH, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: "data.js" });
  const map = new Map();
  for (const p of sandbox.window.PRESIDENTS || []) {
    map.set(p.id, p);
  }
  return map;
}

function slugifyName(name) {
  return String(name)
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
}

function buildPrompt(presidentName) {
  const forcedItemByName = {
    "John Adams": "a balance scale",
    "Thomas Jefferson": "a rolled Louisiana Purchase map",
    "James Madison": "a bound U.S. Constitution booklet",
    "John Quincy Adams": "a brass telescope"
  };
  const forcedItem = forcedItemByName[presidentName] || null;
  return [
    `Create a 1200x1200px square pop manga-style illustration of ${presidentName} as a super-deformed two-head-tall character.`,
    "",
    "Style requirements:",
    "- Simple bold black outlines",
    "- Flat colors with minimal shading",
    "- Clean vector-like finish",
    "- Consistent chibi proportions",
    "- Same line thickness as previous illustrations",
    "- No gradient background unless historically necessary",
    "- Fill the entire square canvas with background elements",
    "- Keep visual unity across the full presidential series",
    "",
    "Character design:",
    "- Exaggerate facial features unique to this president",
    "- Unique pose (not straight standing unless historically meaningful)",
    "- Distinct facial expression reflecting personality",
    "- Clothing accurate to era but simplified",
    "- Include exactly ONE symbolic object strongly associated with this president",
    ...(forcedItem
      ? [`- The single symbolic object MUST be ${forcedItem} (no substitutions)`]
      : []),
    "",
    "Background:",
    "- Era-appropriate setting",
    "- Use color palette reflecting historical mood",
    "- No repeated fireworks motif",
    "- Keep composition balanced and readable",
    "",
    "Hard constraints:",
    "- Full-bleed composition to all four corners",
    "- No blank/white margins in any corner",
    "- Do NOT draw any decorative outer frame, border, vignette, or panel edge",
    "- No text, no logo, no watermark, no signature",
    "- Single character only, full body visible",
    "",
    "Ensure visual variation from previous presidents while maintaining strict stylistic consistency."
  ].join("\n");
}

function validatePrompt(prompt) {
  const required = [
    "1200x1200px square",
    "Fill the entire square canvas with background elements",
    "Include exactly ONE symbolic object",
    "No blank/white margins in any corner",
    "Do NOT draw any decorative outer frame, border, vignette, or panel edge"
  ];
  return required.every((item) => prompt.includes(item));
}

async function generateImage(prompt) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] }
    })
  });
  if (!response.ok) {
    const t = await response.text();
    throw new Error(`API ${response.status}: ${t}`);
  }
  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p) => p.inlineData?.data);
  if (!imagePart) throw new Error("No image data returned.");
  return imagePart.inlineData.data;
}

function writePng(base64, outPath) {
  fs.writeFileSync(outPath, Buffer.from(base64, "base64"));
  try {
    execFileSync("sips", ["-z", "1200", "1200", outPath], { stdio: "ignore" });
  } catch {
    // Best effort only.
  }
}

function findNumberedCopies(slug) {
  if (!fs.existsSync(OUT_DIR)) return [];
  return fs
    .readdirSync(OUT_DIR)
    .filter((name) => name.endsWith(`-${slug}.png`) && /^\d{2}-/.test(name))
    .map((name) => path.join(OUT_DIR, name));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const ids = process.argv
    .slice(2)
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v));
  if (!ids.length) {
    console.error("Usage: node scripts/regenerate_selected_president_images.mjs <id> <id> ...");
    process.exit(1);
  }

  const byId = loadPresidentsById();
  for (const id of ids) {
    const president = byId.get(id);
    if (!president) {
      console.error(`[skip] id ${id} not found`);
      continue;
    }
    const slug = slugifyName(president.name);
    const slugPath = path.join(OUT_DIR, `${slug}.png`);
    const numberedPaths = findNumberedCopies(slug);
    const prompt = buildPrompt(president.name);
    if (!validatePrompt(prompt)) {
      throw new Error(`Prompt validation failed for id ${id} (${president.name})`);
    }

    console.log(`[id:${id}] regenerate ${president.name}`);
    let done = false;
    for (let attempt = 1; attempt <= 3 && !done; attempt += 1) {
      try {
        const base64 = await generateImage(prompt);
        writePng(base64, slugPath);
        for (const p of numberedPaths) {
          fs.copyFileSync(slugPath, p);
        }
        done = true;
      } catch (error) {
        console.error(`  attempt ${attempt} failed: ${error.message}`);
        if (attempt === 3) throw error;
        await sleep(1500);
      }
    }
    await sleep(700);
  }
  console.log("Selected image regeneration completed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
