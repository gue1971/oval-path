#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const DATA_PATH = path.join(ROOT, "data.js");
const OUT_DIR = path.join(ROOT, "assets", "presidents");
const STATE_PATH = path.join(OUT_DIR, "generation-state.json");

const MODEL = process.env.NANOBANANA_MODEL || "gemini-3-pro-image-preview";
const API_KEY = process.env.NANOBANANA_API_KEY || process.env.GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

if (!API_KEY) {
  console.error("API key is missing. Set NANOBANANA_API_KEY or GEMINI_API_KEY.");
  process.exit(1);
}

if (!fs.existsSync(DATA_PATH)) {
  console.error(`data.js not found: ${DATA_PATH}`);
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

function loadPresidents() {
  const source = fs.readFileSync(DATA_PATH, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "data.js" });
  const records = sandbox.window.PRESIDENTS || [];
  const seen = new Set();
  const unique = [];
  for (const item of records) {
    if (seen.has(item.name)) continue;
    seen.add(item.name);
    unique.push(item);
  }
  return unique;
}

function slugifyName(name) {
  return name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
}

function buildPrompt(presidentName) {
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
    "",
    "Background:",
    "- Era-appropriate setting",
    "- Use color palette reflecting historical mood",
    "- No repeated fireworks motif",
    "- Keep composition balanced and readable",
    "",
    "Additional consistency guards:",
    "- No text, no logo, no watermark, no signature",
    "- Single character only, full body visible",
    "- Keep visual variation from previous presidents while maintaining strict stylistic consistency"
  ].join("\n");
}

function validatePrompt(prompt) {
  const required = [
    "1200x1200px square",
    "Simple bold black outlines",
    "Flat colors with minimal shading",
    "Include exactly ONE symbolic object",
    "No repeated fireworks motif",
    "strict stylistic consistency"
  ];
  return required.every((term) => prompt.includes(term));
}

function loadState() {
  if (!fs.existsSync(STATE_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  } catch {
    return {};
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

async function generateImage(prompt) {
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
    const errText = await response.text();
    throw new Error(`API ${response.status}: ${errText}`);
  }
  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p) => p.inlineData?.data);
  if (!imagePart) {
    throw new Error(`No image returned. Raw response: ${JSON.stringify(data).slice(0, 500)}...`);
  }
  const mimeType = imagePart.inlineData.mimeType || "image/png";
  const base64 = imagePart.inlineData.data;
  return { base64, mimeType };
}

function saveImage(base64, outPath) {
  fs.writeFileSync(outPath, Buffer.from(base64, "base64"));
  try {
    execFileSync("sips", ["-z", "1200", "1200", outPath], { stdio: "ignore" });
  } catch {
    // Keep original size if sips is unavailable.
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const presidents = loadPresidents();
  if (presidents.length !== 45) {
    console.warn(`Expected 45 unique presidents, found ${presidents.length}. Proceeding anyway.`);
  }

  const state = loadState();
  console.log(`Model: ${MODEL}`);
  console.log(`Targets: ${presidents.length} unique presidents`);
  console.log(`Output: ${OUT_DIR}`);

  for (const [index, president] of presidents.entries()) {
    const slug = String(index + 1).padStart(2, "0") + "-" + slugifyName(president.name);
    const outPath = path.join(OUT_DIR, `${slug}.png`);

    if (state[president.name]?.status === "done" && fs.existsSync(outPath)) {
      console.log(`[skip] ${president.name}`);
      continue;
    }

    const prompt = buildPrompt(president.name);
    if (!validatePrompt(prompt)) {
      throw new Error(`Prompt validation failed for ${president.name}`);
    }

    state[president.name] = {
      status: "running",
      output: outPath,
      updatedAt: new Date().toISOString()
    };
    saveState(state);

    console.log(`[${index + 1}/${presidents.length}] generating: ${president.name}`);

    let attempts = 0;
    let done = false;
    while (!done && attempts < 3) {
      attempts += 1;
      try {
        const result = await generateImage(prompt);
        saveImage(result.base64, outPath);
        state[president.name] = {
          status: "done",
          output: outPath,
          mimeType: result.mimeType,
          attempts,
          updatedAt: new Date().toISOString()
        };
        saveState(state);
        done = true;
      } catch (error) {
        console.error(`  attempt ${attempts} failed: ${error.message}`);
        if (attempts >= 3) {
          state[president.name] = {
            status: "failed",
            output: outPath,
            error: String(error.message),
            attempts,
            updatedAt: new Date().toISOString()
          };
          saveState(state);
          throw error;
        }
        await sleep(1500);
      }
    }

    await sleep(700);
  }

  console.log("All image generation tasks completed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
