const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const PALETTE = [
  ["#171512", "#3a352c"],
  ["#2b2420", "#5a4a34"],
  ["#1f2420", "#3f4a3c"],
  ["#241c1a", "#5c3a2e"],
  ["#20242a", "#3a4552"],
  ["#241e2a", "#4a3a52"],
];

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function coverSvg(seed, w, h) {
  const idx = hashSeed(seed) % PALETTE.length;
  const [c1, c2] = PALETTE[idx];
  const cx = 20 + (hashSeed(seed + "x") % 60);
  const cy = 20 + (hashSeed(seed + "y") % 60);
  const r = 60 + (hashSeed(seed + "r") % 90);
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
      <radialGradient id="r" cx="${cx}%" cy="${cy}%" r="70%">
        <stop offset="0%" stop-color="#C8952C" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#C8952C" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
    <rect width="${w}" height="${h}" fill="url(#r)"/>
    <circle cx="${w * (cx / 100)}" cy="${h * (cy / 100)}" r="${r}" fill="none" stroke="#FAF9F7" stroke-opacity="0.12" stroke-width="1.5"/>
    <circle cx="${w * (cx / 100)}" cy="${h * (cy / 100)}" r="${r * 0.6}" fill="none" stroke="#FAF9F7" stroke-opacity="0.10" stroke-width="1.5"/>
  </svg>`;
}

function logoSvg(letter, seed, size) {
  const idx = hashSeed(seed) % PALETTE.length;
  const [c1, c2] = PALETTE[idx];
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#g)"/>
    <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, serif" font-size="${size * 0.42}" fill="#C8952C" font-weight="600">${letter}</text>
  </svg>`;
}

const AVATAR_COLORS = ["#8a5a3b", "#5c6b57", "#6b5a72", "#4f6272", "#8a6b3b", "#725a5a", "#3f5a52", "#7a6a4a"];

function avatarSvg(seed, size) {
  const idx = hashSeed(String(seed)) % AVATAR_COLORS.length;
  const color = AVATAR_COLORS[idx];
  const cy = size * 0.38;
  const r = size * 0.19;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="${color}"/>
    <circle cx="${size / 2}" cy="${cy}" r="${r}" fill="#FAF9F7" fill-opacity="0.92"/>
    <path d="M ${size * 0.18} ${size * 0.92} Q ${size / 2} ${size * 0.62} ${size * 0.82} ${size * 0.92} Z" fill="#FAF9F7" fill-opacity="0.92"/>
  </svg>`;
}

async function main() {
  const salonsDir = path.join(__dirname, "..", "public", "images", "salons");
  const avatarsDir = path.join(__dirname, "..", "public", "images", "avatars");
  fs.mkdirSync(salonsDir, { recursive: true });
  fs.mkdirSync(avatarsDir, { recursive: true });

  const coverSeeds = [
    "gentry-room", "gentry-1", "gentry-2", "gentry-3", "gentry-4",
    "darios", "darios-1", "darios-2", "darios-3",
    "lumiere", "lumiere-1", "lumiere-2", "lumiere-3", "lumiere-4",
    "uptown-fade", "uptown-1", "uptown-2", "uptown-3",
    "serene", "serene-1", "serene-2", "serene-3",
    "maison", "maison-1", "maison-2", "maison-3", "maison-4",
    "blackout", "blackout-1", "blackout-2", "blackout-3",
    "sato", "sato-1", "sato-2", "sato-3",
  ];

  const logos = [
    ["gentry-logo", "G"],
    ["darios-logo", "D"],
    ["lumiere-logo", "L"],
    ["uptown-logo", "U"],
    ["serene-logo", "S"],
    ["maison-logo", "M"],
    ["blackout-logo", "B"],
    ["sato-logo", "SA"],
  ];

  for (const seed of coverSeeds) {
    await sharp(Buffer.from(coverSvg(seed, 1200, 900)))
      .jpeg({ quality: 82 })
      .toFile(path.join(salonsDir, `${seed}.jpg`));
  }

  for (const [seed, letter] of logos) {
    await sharp(Buffer.from(logoSvg(letter, seed, 400)))
      .png()
      .toFile(path.join(salonsDir, `${seed}.png`));
  }

  const avatarNumbers = [5, 9, 12, 14, 15, 22, 25, 27, 31, 32, 33, 36, 44, 45, 47, 48, 51, 59, 60, 68];
  for (const n of avatarNumbers) {
    await sharp(Buffer.from(avatarSvg(n, 300)))
      .png()
      .toFile(path.join(avatarsDir, `${n}.png`));
  }

  console.log(`Generated ${coverSeeds.length} covers, ${logos.length} logos, ${avatarNumbers.length} avatars.`);
}

main();
