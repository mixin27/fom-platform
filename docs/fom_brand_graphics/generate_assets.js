#!/usr/bin/env node

const fs = require("fs")
const path = require("path")

function loadSharp() {
  const pnpmDir = path.resolve(__dirname, "../node_modules/.pnpm")
  if (!fs.existsSync(pnpmDir)) {
    throw new Error("node_modules/.pnpm is missing. Run pnpm install first.")
  }

  const sharpPackageDir = fs
    .readdirSync(pnpmDir)
    .find((entry) => entry.startsWith("sharp@"))

  if (!sharpPackageDir) {
    throw new Error("sharp package was not found under node_modules/.pnpm")
  }

  return require(path.join(pnpmDir, sharpPackageDir, "node_modules", "sharp"))
}

const sharp = loadSharp()

const ROOT = __dirname
const SVG_ROOT = path.join(ROOT, "assets", "svg")
const PNG_ROOT = path.join(ROOT, "assets", "png")
const PREVIEW_ROOT = path.join(ROOT, "preview")
const manifest = []

const COLORS = {
  orange: "#F4622A",
  orangeDark: "#E0521C",
  teal: "#1E9E96",
  ink: "#131A22",
  slate: "#555558",
  cream: "#FAFAF8",
  white: "#FFFFFF",
  blue: "#1877F2",
  telegram: "#2AABEE",
}

const CATEGORY_TITLES = {
  social: "Social Media",
  app: "App & Store",
  web: "Web Branding",
  extras: "Extras",
}

const REQUIRED_TRANSPARENT_FILENAMES = new Set([
  "adaptive-icon-foreground",
  "notification-icon-light",
  "notification-icon-dark",
])

function resolveAlphaPolicy(filename) {
  return REQUIRED_TRANSPARENT_FILENAMES.has(filename)
    ? "required_transparent"
    : "opaque"
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function relFromRoot(absPath) {
  return path.relative(ROOT, absPath).replace(/\\/g, "/")
}

function svgDoc({ width, height, defs = "", body = "" }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" role="img" aria-label="FOM brand asset">
  <defs>
    <linearGradient id="grad-shell" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#313D4D"/>
      <stop offset="100%" stop-color="#0F1722"/>
    </linearGradient>
    <linearGradient id="grad-core" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${COLORS.orange}"/>
      <stop offset="100%" stop-color="${COLORS.orangeDark}"/>
    </linearGradient>
    <linearGradient id="bg-dark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F141B"/>
      <stop offset="100%" stop-color="#242E3B"/>
    </linearGradient>
    <linearGradient id="bg-sunset" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1B222E"/>
      <stop offset="50%" stop-color="#202C3D"/>
      <stop offset="100%" stop-color="#102224"/>
    </linearGradient>
    <linearGradient id="bg-teal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0C5D5D"/>
      <stop offset="100%" stop-color="#1E9E96"/>
    </linearGradient>
    <radialGradient id="glow-orange" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="${COLORS.orange}" stop-opacity="0.70"/>
      <stop offset="100%" stop-color="${COLORS.orange}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow-teal" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="${COLORS.teal}" stop-opacity="0.66"/>
      <stop offset="100%" stop-color="${COLORS.teal}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid-32" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M32 0H0V32" stroke="${COLORS.white}" stroke-opacity="0.08" stroke-width="1"/>
    </pattern>
    <filter id="soft-shadow" x="-30%" y="-30%" width="160%" height="180%">
      <feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#000" flood-opacity="0.35"/>
    </filter>
    ${defs}
  </defs>
  ${body}
</svg>`
}

function fomMark(x, y, size, options = {}) {
  const r = size * 0.24
  const pad = size * 0.12
  const inner = size - pad * 2
  const innerRadius = size * 0.18
  const dotR = size * 0.09
  const letterSize = size * 0.44
  const shellFill = options.shellFill || "url(#grad-shell)"
  const coreFill = options.coreFill || "url(#grad-core)"
  const letter = options.letter || "F"
  const letterColor = options.letterColor || COLORS.white
  const showShell = options.showShell !== false
  const groupFilter = options.shadow ? ' filter="url(#soft-shadow)"' : ""

  const shell = showShell
    ? `<rect x="0" y="0" width="${size}" height="${size}" rx="${r}" fill="${shellFill}"/>`
    : ""

  return `<g transform="translate(${x} ${y})"${groupFilter}>
    ${shell}
    <rect x="${showShell ? pad : 0}" y="${showShell ? pad : 0}" width="${showShell ? inner : size}" height="${showShell ? inner : size}" rx="${showShell ? innerRadius : r}" fill="${coreFill}"/>
    <circle cx="${(showShell ? size : size) - (showShell ? pad : 0) - dotR * 0.8}" cy="${(showShell ? size : size) - (showShell ? pad : 0) - dotR * 0.8}" r="${dotR}" fill="${COLORS.teal}"/>
    <text x="${size / 2}" y="${size * 0.61}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${letterSize}" font-weight="700" fill="${letterColor}" letter-spacing="${Math.max(1, size * 0.02)}">${letter}</text>
  </g>`
}

function infoChip(x, y, width, height, label, value) {
  const centerX = Math.round(width / 2)
  const labelY = Math.round(height * 0.35)
  const valueY = Math.round(height * 0.69)
  const labelSize = Math.max(11, Math.round(height * 0.27))
  const valueSize = Math.max(14, Math.round(height * 0.36))

  return `<g transform="translate(${x} ${y})">
    <rect width="${width}" height="${height}" rx="${height / 2}" fill="#FFFFFF" fill-opacity="0.12"/>
    <text x="${centerX}" y="${labelY}" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-size="${labelSize}" fill="#FFFFFF" fill-opacity="0.84">${label}</text>
    <text x="${centerX}" y="${valueY}" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-size="${valueSize}" font-weight="700" fill="#FFFFFF">${value}</text>
  </g>`
}

function socialProfile({ platform }) {
  const isTelegram = platform === "telegram"
  const bgFill = isTelegram ? "url(#bg-teal)" : "url(#bg-dark)"
  const accent = isTelegram ? COLORS.telegram : COLORS.blue
  const title = isTelegram ? "FOM CHANNEL" : "FOM ORDER MANAGER"
  const subtitle = isTelegram ? "Fast updates for shop teams" : "For Facebook-first shops"

  return svgDoc({
    width: 1080,
    height: 1080,
    body: `
      <rect width="1080" height="1080" fill="${bgFill}"/>
      <rect width="1080" height="1080" fill="url(#grid-32)" opacity="0.5"/>
      <circle cx="220" cy="170" r="260" fill="url(#glow-orange)"/>
      <circle cx="920" cy="930" r="290" fill="url(#glow-teal)"/>
      <circle cx="930" cy="170" r="130" fill="${accent}" fill-opacity="0.22"/>
      ${fomMark(330, 256, 420, { shadow: true })}
      <text x="540" y="790" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="58" font-weight="700" fill="#FFFFFF" letter-spacing="2">${title}</text>
      <text x="540" y="845" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="#FFFFFF" fill-opacity="0.80">${subtitle}</text>
    `,
  })
}

function facebookCover() {
  return svgDoc({
    width: 1640,
    height: 624,
    body: `
      <rect width="1640" height="624" fill="url(#bg-sunset)"/>
      <rect width="1640" height="624" fill="url(#grid-32)" opacity="0.45"/>
      <circle cx="180" cy="90" r="240" fill="url(#glow-orange)"/>
      <circle cx="1500" cy="560" r="260" fill="url(#glow-teal)"/>
      <rect x="88" y="88" width="160" height="42" rx="21" fill="#1877F2" fill-opacity="0.92"/>
      <text x="168" y="115" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700" fill="#FFFFFF" letter-spacing="1.5">FACEBOOK</text>

      <text x="96" y="236" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="700" fill="#FFFFFF">FOM Order Manager</text>
      <text x="96" y="288" font-family="Arial, Helvetica, sans-serif" font-size="33" fill="#FFFFFF" fill-opacity="0.86">Track orders faster, reply sooner, and deliver on time.</text>
      <text x="96" y="334" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#FFFFFF" fill-opacity="0.74">Built for social-commerce teams and support staff.</text>

      ${infoChip(96, 384, 310, 122, "Response Speed", "3x Faster")}
      ${infoChip(426, 384, 302, 122, "Order Flow", "Always Clear")}

      <g transform="translate(1098 104)">
        <rect width="430" height="412" rx="42" fill="#FFFFFF" fill-opacity="0.08"/>
        <rect x="24" y="24" width="382" height="364" rx="34" fill="#FFFFFF" fill-opacity="0.08"/>
      </g>
      ${fomMark(1178, 170, 270, { shadow: true })}
    `,
  })
}

function telegramCover() {
  return svgDoc({
    width: 1280,
    height: 720,
    body: `
      <rect width="1280" height="720" fill="url(#bg-teal)"/>
      <rect width="1280" height="720" fill="url(#grid-32)" opacity="0.42"/>
      <circle cx="140" cy="110" r="240" fill="url(#glow-orange)"/>
      <circle cx="1110" cy="650" r="260" fill="url(#glow-teal)"/>

      <circle cx="105" cy="92" r="42" fill="#2AABEE" fill-opacity="0.95"/>
      <path d="M88 94L120 78L112 112L103 102L91 99Z" fill="#FFFFFF"/>

      <text x="84" y="230" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="700" fill="#FFFFFF">FOM Telegram Channel</text>
      <text x="84" y="282" font-family="Arial, Helvetica, sans-serif" font-size="32" fill="#FFFFFF" fill-opacity="0.86">Broadcast updates and promos for your shop teams.</text>
      <text x="84" y="328" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#FFFFFF" fill-opacity="0.78">Share order alerts with one consistent visual style.</text>

      ${infoChip(84, 398, 286, 124, "Broadcast Ready", "Instant")}
      ${infoChip(388, 398, 286, 124, "Brand Match", "Consistent")}

      <g transform="translate(884 138)">
        <rect width="336" height="434" rx="40" fill="#FFFFFF" fill-opacity="0.10"/>
        <rect x="20" y="20" width="296" height="394" rx="26" fill="#FFFFFF" fill-opacity="0.08"/>
      </g>
      ${fomMark(934, 188, 250, { shadow: true })}
    `,
  })
}

function appIconBase(size, tone = "dark") {
  const isDark = tone === "dark"
  const bg = isDark ? "url(#bg-dark)" : "url(#bg-sunset)"
  const glowOpacity = isDark ? 1 : 0.72
  const corner = Math.round(size * 0.24)

  return svgDoc({
    width: size,
    height: size,
    body: `
      <rect width="${size}" height="${size}" fill="${bg}"/>
      <rect width="${size}" height="${size}" fill="url(#grid-32)" opacity="0.28"/>
      <rect width="${size}" height="${size}" rx="${corner}" fill="#FFFFFF" fill-opacity="0.02"/>
      <circle cx="${Math.round(size * 0.22)}" cy="${Math.round(size * 0.2)}" r="${Math.round(size * 0.25)}" fill="url(#glow-orange)" opacity="${glowOpacity}"/>
      <circle cx="${Math.round(size * 0.83)}" cy="${Math.round(size * 0.84)}" r="${Math.round(size * 0.28)}" fill="url(#glow-teal)" opacity="${glowOpacity}"/>
      ${fomMark(Math.round(size * 0.2), Math.round(size * 0.2), Math.round(size * 0.6), { shadow: true })}
    `,
  })
}

function adaptiveBackground(size) {
  return svgDoc({
    width: size,
    height: size,
    body: `
      <rect width="${size}" height="${size}" fill="url(#bg-sunset)"/>
      <circle cx="${Math.round(size * 0.2)}" cy="${Math.round(size * 0.2)}" r="${Math.round(size * 0.3)}" fill="url(#glow-orange)"/>
      <circle cx="${Math.round(size * 0.9)}" cy="${Math.round(size * 0.95)}" r="${Math.round(size * 0.4)}" fill="url(#glow-teal)"/>
    `,
  })
}

function adaptiveForeground(size) {
  const margin = size * 0.13
  const tile = size - margin * 2

  return svgDoc({
    width: size,
    height: size,
    body: `
      ${fomMark(margin, margin, tile, {
        showShell: false,
        coreFill: "url(#grad-core)",
      })}
    `,
  })
}

function notificationIcon(light = true) {
  const stroke = light ? "#FFFFFF" : "#111827"
  const fill = light ? "#FFFFFF" : "#111827"

  return svgDoc({
    width: 256,
    height: 256,
    body: `
      <g fill="none" stroke="${stroke}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round">
        <rect x="56" y="74" width="144" height="108" rx="22"/>
        <path d="M90 112H164"/>
        <path d="M90 144H146"/>
      </g>
      <circle cx="186" cy="84" r="17" fill="${fill}"/>
    `,
  })
}

function playStoreFeature() {
  return svgDoc({
    width: 1024,
    height: 500,
    body: `
      <rect width="1024" height="500" fill="url(#bg-sunset)"/>
      <rect width="1024" height="500" fill="url(#grid-32)" opacity="0.35"/>
      <circle cx="120" cy="64" r="200" fill="url(#glow-orange)"/>
      <circle cx="940" cy="500" r="200" fill="url(#glow-teal)"/>

      <text x="64" y="156" font-family="Arial, Helvetica, sans-serif" font-size="60" font-weight="700" fill="#FFFFFF">FOM Order Manager</text>
      <text x="64" y="206" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#FFFFFF" fill-opacity="0.86">Manage Facebook and chat orders from one dashboard.</text>
      <text x="64" y="240" font-family="Arial, Helvetica, sans-serif" font-size="23" fill="#FFFFFF" fill-opacity="0.80">Fast replies, clear statuses, and smarter handoff.</text>
      <text x="64" y="272" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#FFFFFF" fill-opacity="0.72">Built for social-commerce teams.</text>

      ${infoChip(64, 314, 252, 108, "Shop Teams", "Built Ready")}
      ${infoChip(330, 314, 252, 108, "Daily Flow", "Always On")}

      <g transform="translate(738 52)">
        <rect width="250" height="392" rx="30" fill="#FFFFFF" fill-opacity="0.08"/>
        <rect x="14" y="14" width="222" height="364" rx="22" fill="#FFFFFF" fill-opacity="0.11"/>
        <rect x="34" y="72" width="174" height="80" rx="18" fill="#FFFFFF" fill-opacity="0.18"/>
        <rect x="34" y="170" width="174" height="52" rx="14" fill="#FFFFFF" fill-opacity="0.14"/>
        <rect x="34" y="238" width="114" height="52" rx="14" fill="#FFFFFF" fill-opacity="0.14"/>
      </g>

      ${fomMark(770, 102, 186, { shadow: true })}
    `,
  })
}

function logoHorizontal(light = false) {
  const textColor = light ? "#FFFFFF" : COLORS.ink
  const subColor = light ? "#FFFFFF" : COLORS.slate
  const bgRect = light
    ? `<rect width="1200" height="320" fill="url(#bg-dark)"/>`
    : `<rect width="1200" height="320" fill="#FFFFFF"/>`

  return svgDoc({
    width: 1200,
    height: 320,
    body: `
      ${bgRect}
      ${light ? `<rect width="1200" height="320" fill="url(#grid-32)" opacity="0.34"/>` : ""}
      ${fomMark(72, 56, 208)}
      <text x="314" y="152" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="700" fill="${textColor}" letter-spacing="1.2">FOM Order Manager</text>
      <text x="314" y="202" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="${subColor}" fill-opacity="${light ? "0.82" : "1"}">For Facebook-first shops</text>
      <rect x="314" y="232" width="236" height="44" rx="22" fill="${COLORS.teal}" fill-opacity="0.16"/>
      <text x="432" y="260" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="700" fill="${light ? "#B7F4EE" : COLORS.teal}" letter-spacing="1">ORDER FLOW SYSTEM</text>
    `,
  })
}

function ogImage() {
  return svgDoc({
    width: 1200,
    height: 630,
    body: `
      <rect width="1200" height="630" fill="url(#bg-sunset)"/>
      <rect width="1200" height="630" fill="url(#grid-32)" opacity="0.32"/>
      <circle cx="80" cy="60" r="220" fill="url(#glow-orange)"/>
      <circle cx="1180" cy="640" r="300" fill="url(#glow-teal)"/>

      <text x="84" y="232" font-family="Arial, Helvetica, sans-serif" font-size="80" font-weight="700" fill="#FFFFFF">FOM Order Manager</text>
      <text x="84" y="294" font-family="Arial, Helvetica, sans-serif" font-size="36" fill="#FFFFFF" fill-opacity="0.86">Track, assign, and deliver orders with confidence.</text>
      <text x="84" y="344" font-family="Arial, Helvetica, sans-serif" font-size="33" fill="#FFFFFF" fill-opacity="0.74">Perfect for Facebook and chat-first businesses.</text>

      ${infoChip(84, 420, 294, 122, "Order Visibility", "End-to-End")}
      ${infoChip(398, 420, 266, 122, "Team Speed", "Responsive")}

      <g transform="translate(834 110)">
        <rect width="308" height="410" rx="38" fill="#FFFFFF" fill-opacity="0.08"/>
        <rect x="20" y="20" width="268" height="370" rx="30" fill="#FFFFFF" fill-opacity="0.10"/>
      </g>
      ${fomMark(882, 166, 212, { shadow: true })}
    `,
  })
}

function favicon(size) {
  return svgDoc({
    width: size,
    height: size,
    body: `
      <rect width="${size}" height="${size}" fill="url(#bg-dark)"/>
      ${fomMark(Math.round(size * 0.14), Math.round(size * 0.14), Math.round(size * 0.72), {
        shadow: false,
      })}
    `,
  })
}

function iconTile(pathMarkup) {
  return svgDoc({
    width: 256,
    height: 256,
    body: `
      <rect width="256" height="256" fill="url(#bg-dark)"/>
      <rect x="22" y="22" width="212" height="212" rx="44" fill="${COLORS.orange}" fill-opacity="0.16"/>
      ${pathMarkup}
    `,
  })
}

function emptyStateIllustration() {
  return svgDoc({
    width: 1200,
    height: 840,
    body: `
      <rect width="1200" height="840" fill="${COLORS.cream}"/>
      <rect width="1200" height="840" fill="url(#grid-32)" opacity="0.36"/>
      <circle cx="1060" cy="96" r="260" fill="url(#glow-teal)"/>
      <circle cx="130" cy="80" r="240" fill="url(#glow-orange)"/>

      <rect x="188" y="130" width="824" height="560" rx="34" fill="#FFFFFF" stroke="#E7E7E3" stroke-width="3"/>
      <rect x="238" y="192" width="730" height="72" rx="16" fill="#F6F7FA"/>
      <rect x="238" y="292" width="330" height="300" rx="24" fill="#F7F0EB"/>
      <rect x="596" y="292" width="372" height="140" rx="24" fill="#ECF7F6"/>
      <rect x="596" y="452" width="372" height="140" rx="24" fill="#F6F7FA"/>

      ${fomMark(334, 358, 144)}
      <text x="744" y="354" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="700" fill="${COLORS.ink}">No Orders Yet</text>
      <text x="744" y="404" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="${COLORS.slate}">Incoming Facebook and chat orders will appear here.</text>
      <text x="744" y="450" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="${COLORS.slate}">Share this visual for onboarding docs and release notes.</text>
    `,
  })
}

function patternBackdrop() {
  return svgDoc({
    width: 1600,
    height: 900,
    body: `
      <rect width="1600" height="900" fill="url(#bg-sunset)"/>
      <rect width="1600" height="900" fill="url(#grid-32)" opacity="0.42"/>
      <circle cx="220" cy="110" r="340" fill="url(#glow-orange)"/>
      <circle cx="1430" cy="880" r="380" fill="url(#glow-teal)"/>
      <circle cx="1200" cy="160" r="160" fill="${COLORS.teal}" fill-opacity="0.18"/>
      <circle cx="430" cy="770" r="180" fill="${COLORS.orange}" fill-opacity="0.16"/>
      <text x="100" y="792" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="700" fill="#FFFFFF" fill-opacity="0.18">FOM BACKDROP</text>
    `,
  })
}

function socialPostTemplate() {
  return svgDoc({
    width: 1080,
    height: 1080,
    body: `
      <rect width="1080" height="1080" fill="url(#bg-sunset)"/>
      <rect width="1080" height="1080" fill="url(#grid-32)" opacity="0.4"/>
      <circle cx="140" cy="140" r="220" fill="url(#glow-orange)"/>
      <circle cx="980" cy="980" r="260" fill="url(#glow-teal)"/>

      ${fomMark(92, 92, 176)}
      <text x="300" y="176" font-family="Arial, Helvetica, sans-serif" font-size="58" font-weight="700" fill="#FFFFFF">FOM Update</text>
      <text x="300" y="226" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#FFFFFF" fill-opacity="0.82">Drop in your campaign or release message.</text>

      <rect x="92" y="278" width="896" height="620" rx="42" fill="#FFFFFF" fill-opacity="0.08"/>
      <rect x="136" y="330" width="808" height="220" rx="24" fill="#FFFFFF" fill-opacity="0.10"/>
      <rect x="136" y="580" width="380" height="250" rx="24" fill="#FFFFFF" fill-opacity="0.12"/>
      <rect x="564" y="580" width="380" height="250" rx="24" fill="#FFFFFF" fill-opacity="0.12"/>
      <text x="170" y="420" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="700" fill="#FFFFFF">Headline / Promo</text>
      <text x="170" y="470" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#FFFFFF" fill-opacity="0.82">Add your offer, event update, or new feature in this panel.</text>
    `,
  })
}

async function createAsset({
  category,
  name,
  filename,
  width,
  height,
  svg,
  alphaPolicy = "opaque",
}) {
  const svgDir = path.join(SVG_ROOT, category)
  const pngDir = path.join(PNG_ROOT, category)
  ensureDir(svgDir)
  ensureDir(pngDir)

  const svgPath = path.join(svgDir, `${filename}.svg`)
  const pngPath = path.join(pngDir, `${filename}.png`)

  fs.writeFileSync(svgPath, svg)
  const rendered = sharp(Buffer.from(svg))
  if (alphaPolicy === "opaque") {
    // For marketing assets, strip alpha to avoid transparent-edge artifacts.
    await rendered
      .flatten({ background: "#101722" })
      .png({ compressionLevel: 9 })
      .toFile(pngPath)
  } else {
    await rendered.png({ compressionLevel: 9 }).toFile(pngPath)
  }

  manifest.push({
    category,
    name,
    width,
    height,
    alphaPolicy,
    svg: relFromRoot(svgPath),
    png: relFromRoot(pngPath),
  })
}

async function getPngBorderAlphaStats(pngAbsPath) {
  const image = sharp(pngAbsPath)
  const meta = await image.metadata()
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  let minBorderAlpha = 255
  const update = (x, y) => {
    const alpha = data[(y * info.width + x) * 4 + 3]
    if (alpha < minBorderAlpha) minBorderAlpha = alpha
  }

  for (let x = 0; x < info.width; x += 1) {
    update(x, 0)
    update(x, info.height - 1)
  }
  for (let y = 0; y < info.height; y += 1) {
    update(0, y)
    update(info.width - 1, y)
  }

  return {
    hasAlpha: !!meta.hasAlpha,
    minBorderAlpha,
  }
}

async function validateAlphaPolicy() {
  const failures = []

  for (const item of manifest) {
    const pngAbsPath = path.join(ROOT, item.png)
    const stats = await getPngBorderAlphaStats(pngAbsPath)
    if (item.alphaPolicy === "opaque" && stats.minBorderAlpha < 255) {
      failures.push(
        `${item.png} expected opaque border, got min alpha ${stats.minBorderAlpha}`
      )
    }
    if (item.alphaPolicy === "required_transparent" && !stats.hasAlpha) {
      failures.push(`${item.png} expected alpha channel but none was found`)
    }
  }

  if (failures.length > 0) {
    throw new Error(`Alpha policy validation failed:\\n${failures.join("\\n")}`)
  }
}

function buildPreviewHtml({ generationToken, generatedDateText }) {
  const grouped = manifest.reduce((acc, item) => {
    const key = item.category
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const sections = Object.keys(CATEGORY_TITLES)
    .map((category) => {
      const items = grouped[category] || []
      const cards = items
        .map(
          (item) => `
        <article class="card">
          <div class="thumb-wrap ${item.alphaPolicy === "required_transparent" ? "is-transparent" : ""}">
            ${item.alphaPolicy === "required_transparent" ? '<span class="alpha-badge">transparent</span>' : ""}
            <img src="../${item.png}?v=${generationToken}" alt="${item.name}" loading="lazy" />
          </div>
          <div class="meta">
            <h3>${item.name}</h3>
            <p>${item.width} × ${item.height} · ${item.alphaPolicy}</p>
            <div class="links">
              <a href="../${item.svg}" download>SVG</a>
              <a href="../${item.png}" download>PNG</a>
            </div>
          </div>
        </article>`
        )
        .join("\n")

      return `
      <section>
        <div class="section-head">
          <h2>${CATEGORY_TITLES[category]}</h2>
          <span>${items.length} assets</span>
        </div>
        <div class="grid">
          ${cards}
        </div>
      </section>`
    })
    .join("\n")

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FOM Brand Graphics Pack</title>
    <style>
      :root {
        --bg: #f6f7fb;
        --ink: #131a22;
        --muted: #5b6168;
        --line: #e4e7ed;
        --card: #ffffff;
        --primary: #f4622a;
        --teal: #1e9e96;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: "Inter", "Segoe UI", Arial, sans-serif;
        background: radial-gradient(circle at 20% -10%, rgba(244, 98, 42, 0.16), transparent 46%),
          radial-gradient(circle at 100% 120%, rgba(30, 158, 150, 0.15), transparent 40%),
          var(--bg);
        color: var(--ink);
      }

      .container {
        max-width: 1300px;
        margin: 0 auto;
        padding: 48px 24px 64px;
      }

      .hero {
        background: #ffffff;
        border: 1px solid var(--line);
        border-radius: 20px;
        padding: 26px 30px;
        box-shadow: 0 20px 40px rgba(19, 26, 34, 0.06);
        margin-bottom: 28px;
      }

      .hero h1 {
        margin: 0;
        font-size: clamp(28px, 4.2vw, 46px);
        line-height: 1.08;
      }

      .hero p {
        margin: 10px 0 0;
        color: var(--muted);
        font-size: 16px;
      }

      .meta-line {
        margin-top: 14px;
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
        color: var(--muted);
        font-size: 14px;
      }

      section {
        margin-top: 28px;
      }

      .section-head {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 14px;
      }

      .section-head h2 {
        margin: 0;
        font-size: clamp(22px, 3vw, 32px);
      }

      .section-head span {
        color: var(--muted);
        font-size: 14px;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 16px;
      }

      .card {
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: 16px;
        overflow: hidden;
      }

      .thumb-wrap {
        background: linear-gradient(145deg, #f2f5fb, #ffffff);
        border-bottom: 1px solid var(--line);
        padding: 14px;
        aspect-ratio: 1.45 / 1;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .thumb-wrap.is-transparent {
        position: relative;
        background-image:
          linear-gradient(45deg, #e9edf3 25%, transparent 25%),
          linear-gradient(-45deg, #e9edf3 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #e9edf3 75%),
          linear-gradient(-45deg, transparent 75%, #e9edf3 75%),
          linear-gradient(145deg, #f8f9fb, #ffffff);
        background-size: 18px 18px, 18px 18px, 18px 18px, 18px 18px, cover;
        background-position: 0 0, 0 9px, 9px -9px, -9px 0px, 0 0;
      }

      .alpha-badge {
        position: absolute;
        top: 10px;
        right: 10px;
        font-size: 11px;
        line-height: 1;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        padding: 6px 8px;
        border-radius: 999px;
        color: #0f1722;
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid #d6dde8;
      }

      .thumb-wrap img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border-radius: 10px;
      }

      .meta {
        padding: 12px 14px 14px;
      }

      .meta h3 {
        margin: 0;
        font-size: 15px;
        line-height: 1.35;
      }

      .meta p {
        margin: 6px 0 10px;
        color: var(--muted);
        font-size: 13px;
      }

      .links {
        display: flex;
        gap: 10px;
      }

      .links a {
        text-decoration: none;
        font-size: 13px;
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 7px 12px;
        color: var(--ink);
        background: #ffffff;
      }

      .links a:hover {
        border-color: var(--primary);
        color: var(--primary);
      }

      @media (max-width: 680px) {
        .container {
          padding: 22px 14px 46px;
        }

        .hero {
          padding: 18px;
        }

        .meta-line {
          font-size: 13px;
        }
      }
    </style>
  </head>
  <body>
    <main class="container">
      <header class="hero">
        <h1>FOM Graphic Design Pack</h1>
        <p>Preview and download ready-to-use brand assets in SVG and PNG.</p>
        <div class="meta-line">
          <span>Total assets: ${manifest.length}</span>
          <span>Generated by: fom_brand_graphics/generate_assets.js</span>
          <span>Date: ${generatedDateText}</span>
          <span>Cache token: ${generationToken}</span>
        </div>
      </header>
      ${sections}
    </main>
  </body>
</html>`
}

function buildReadme() {
  const social = manifest.filter((x) => x.category === "social").length
  const app = manifest.filter((x) => x.category === "app").length
  const web = manifest.filter((x) => x.category === "web").length
  const extras = manifest.filter((x) => x.category === "extras").length
  const opaque = manifest.filter((x) => x.alphaPolicy === "opaque").length
  const transparent = manifest.filter(
    (x) => x.alphaPolicy === "required_transparent"
  ).length

  return `# FOM Brand Graphics Pack

This directory contains generated branding assets for the FOM - Order Manager platform.

## Structure

- assets/svg/ source vector files
- assets/png/ raster exports
- preview/index.html visual preview + download page
- assets/manifest.json machine-readable asset index

## Asset Counts

- Social media: ${social}
- App and store: ${app}
- Web branding: ${web}
- Extras: ${extras}
- Total: ${manifest.length}

## Alpha Policy

- opaque: ${opaque} assets
- required_transparent: ${transparent} assets

Transparent assets are limited to:

- app/adaptive-icon-foreground
- app/notification-icon-light
- app/notification-icon-dark

## Regenerate

Run from repository root:

node fom_brand_graphics/generate_assets.js
`
}

async function run() {
  const generatedAt = new Date()
  const generationToken = generatedAt.getTime().toString(36)
  ensureDir(SVG_ROOT)
  ensureDir(PNG_ROOT)
  ensureDir(PREVIEW_ROOT)

  const assets = [
    {
      category: "social",
      name: "Facebook Profile Image",
      filename: "facebook-profile",
      width: 1080,
      height: 1080,
      svg: socialProfile({ platform: "facebook" }),
    },
    {
      category: "social",
      name: "Facebook Cover Image",
      filename: "facebook-cover",
      width: 1640,
      height: 624,
      svg: facebookCover(),
    },
    {
      category: "social",
      name: "Telegram Profile Image",
      filename: "telegram-profile",
      width: 1080,
      height: 1080,
      svg: socialProfile({ platform: "telegram" }),
    },
    {
      category: "social",
      name: "Telegram Cover Image",
      filename: "telegram-cover",
      width: 1280,
      height: 720,
      svg: telegramCover(),
    },

    {
      category: "app",
      name: "App Icon Master",
      filename: "app-icon-master-1024",
      width: 1024,
      height: 1024,
      svg: appIconBase(1024),
    },
    {
      category: "app",
      name: "Android Icon 512",
      filename: "android-icon-512",
      width: 512,
      height: 512,
      svg: appIconBase(512),
    },
    {
      category: "app",
      name: "Android Icon 192",
      filename: "android-icon-192",
      width: 192,
      height: 192,
      svg: appIconBase(192),
    },
    {
      category: "app",
      name: "iOS App Icon 1024",
      filename: "ios-app-icon-1024",
      width: 1024,
      height: 1024,
      svg: appIconBase(1024, "soft"),
    },
    {
      category: "app",
      name: "Notification Icon (Light)",
      filename: "notification-icon-light",
      width: 256,
      height: 256,
      svg: notificationIcon(true),
    },
    {
      category: "app",
      name: "Notification Icon (Dark)",
      filename: "notification-icon-dark",
      width: 256,
      height: 256,
      svg: notificationIcon(false),
    },
    {
      category: "app",
      name: "Play Store Feature Graphic",
      filename: "playstore-feature-graphic",
      width: 1024,
      height: 500,
      svg: playStoreFeature(),
    },
    {
      category: "app",
      name: "Adaptive Icon Background",
      filename: "adaptive-icon-background",
      width: 432,
      height: 432,
      svg: adaptiveBackground(432),
    },
    {
      category: "app",
      name: "Adaptive Icon Foreground",
      filename: "adaptive-icon-foreground",
      width: 432,
      height: 432,
      svg: adaptiveForeground(432),
    },

    {
      category: "web",
      name: "Web Logo Horizontal",
      filename: "logo-horizontal",
      width: 1200,
      height: 320,
      svg: logoHorizontal(false),
    },
    {
      category: "web",
      name: "Web Logo Horizontal (Light)",
      filename: "logo-horizontal-light",
      width: 1200,
      height: 320,
      svg: logoHorizontal(true),
    },
    {
      category: "web",
      name: "Web Logo Mark",
      filename: "logo-mark",
      width: 512,
      height: 512,
      svg: appIconBase(512),
    },
    {
      category: "web",
      name: "Favicon",
      filename: "favicon",
      width: 64,
      height: 64,
      svg: favicon(64),
    },
    {
      category: "web",
      name: "Favicon 32",
      filename: "favicon-32",
      width: 32,
      height: 32,
      svg: favicon(32),
    },
    {
      category: "web",
      name: "Favicon 16",
      filename: "favicon-16",
      width: 16,
      height: 16,
      svg: favicon(16),
    },
    {
      category: "web",
      name: "Apple Touch Icon",
      filename: "apple-touch-icon-180",
      width: 180,
      height: 180,
      svg: appIconBase(180),
    },
    {
      category: "web",
      name: "Open Graph Image",
      filename: "og-image-1200x630",
      width: 1200,
      height: 630,
      svg: ogImage(),
    },

    {
      category: "extras",
      name: "Icon - Order",
      filename: "icon-order",
      width: 256,
      height: 256,
      svg: iconTile(`
        <rect x="74" y="56" width="108" height="144" rx="18" fill="none" stroke="#FFFFFF" stroke-width="14"/>
        <path d="M96 98H160" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round"/>
        <path d="M96 128H160" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round"/>
        <path d="M96 158H142" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round"/>
      `),
    },
    {
      category: "extras",
      name: "Icon - Customer",
      filename: "icon-customer",
      width: 256,
      height: 256,
      svg: iconTile(`
        <circle cx="112" cy="94" r="30" fill="none" stroke="#FFFFFF" stroke-width="14"/>
        <path d="M62 186C74 154 93 140 112 140C131 140 150 154 162 186" fill="none" stroke="#FFFFFF" stroke-width="14" stroke-linecap="round"/>
        <path d="M158 92H206C212 92 216 96 216 102V146C216 152 212 156 206 156H186L166 176V156H158C152 156 148 152 148 146V102C148 96 152 92 158 92Z" fill="none" stroke="#FFFFFF" stroke-width="12" stroke-linejoin="round"/>
      `),
    },
    {
      category: "extras",
      name: "Icon - Delivery",
      filename: "icon-delivery",
      width: 256,
      height: 256,
      svg: iconTile(`
        <path d="M52 98H148V164H52Z" fill="none" stroke="#FFFFFF" stroke-width="14" stroke-linejoin="round"/>
        <path d="M148 114H184L206 138V164H148Z" fill="none" stroke="#FFFFFF" stroke-width="14" stroke-linejoin="round"/>
        <circle cx="92" cy="182" r="16" fill="none" stroke="#FFFFFF" stroke-width="12"/>
        <circle cx="176" cy="182" r="16" fill="none" stroke="#FFFFFF" stroke-width="12"/>
      `),
    },
    {
      category: "extras",
      name: "Icon - Analytics",
      filename: "icon-analytics",
      width: 256,
      height: 256,
      svg: iconTile(`
        <path d="M62 190H194" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round"/>
        <rect x="74" y="132" width="26" height="58" rx="8" fill="#FFFFFF"/>
        <rect x="116" y="102" width="26" height="88" rx="8" fill="#FFFFFF"/>
        <rect x="158" y="84" width="26" height="106" rx="8" fill="#FFFFFF"/>
        <path d="M70 106L114 82L146 106L188 70" fill="none" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
      `),
    },
    {
      category: "extras",
      name: "Icon - Inventory",
      filename: "icon-inventory",
      width: 256,
      height: 256,
      svg: iconTile(`
        <path d="M128 48L194 82V166L128 206L62 166V82L128 48Z" fill="none" stroke="#FFFFFF" stroke-width="12" stroke-linejoin="round"/>
        <path d="M62 82L128 118L194 82" fill="none" stroke="#FFFFFF" stroke-width="12" stroke-linejoin="round"/>
        <path d="M128 118V206" stroke="#FFFFFF" stroke-width="12"/>
      `),
    },
    {
      category: "extras",
      name: "Icon - Quick Reply",
      filename: "icon-quick-reply",
      width: 256,
      height: 256,
      svg: iconTile(`
        <path d="M58 78H198C208 78 216 86 216 96V146C216 156 208 164 198 164H146L102 196V164H58C48 164 40 156 40 146V96C40 86 48 78 58 78Z" fill="none" stroke="#FFFFFF" stroke-width="12" stroke-linejoin="round"/>
        <path d="M96 110L132 92L122 122L152 116L108 148L118 122L96 110Z" fill="#FFFFFF"/>
      `),
    },
    {
      category: "extras",
      name: "Empty State Illustration",
      filename: "empty-state-illustration",
      width: 1200,
      height: 840,
      svg: emptyStateIllustration(),
    },
    {
      category: "extras",
      name: "Background Pattern",
      filename: "background-pattern-1600x900",
      width: 1600,
      height: 900,
      svg: patternBackdrop(),
    },
    {
      category: "extras",
      name: "Social Post Template",
      filename: "social-post-template-1080",
      width: 1080,
      height: 1080,
      svg: socialPostTemplate(),
    },
  ]

  for (const asset of assets) {
    await createAsset({
      ...asset,
      alphaPolicy: resolveAlphaPolicy(asset.filename),
    })
  }

  await validateAlphaPolicy()

  const manifestPath = path.join(ROOT, "assets", "manifest.json")
  ensureDir(path.dirname(manifestPath))
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

  const previewPath = path.join(PREVIEW_ROOT, "index.html")
  fs.writeFileSync(
    previewPath,
    buildPreviewHtml({
      generationToken,
      generatedDateText: generatedAt.toISOString().slice(0, 10),
    })
  )

  const readmePath = path.join(ROOT, "README.md")
  fs.writeFileSync(readmePath, buildReadme())

  console.log(`Generated ${manifest.length} assets.`)
  console.log(`Preview: ${relFromRoot(previewPath)}`)
  console.log(`Alpha policy validated for ${manifest.length} assets.`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
