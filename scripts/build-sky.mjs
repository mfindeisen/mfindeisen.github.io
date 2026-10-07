/**
 * Builds the night sky assets used by public/src/earth/Starfield.ts:
 *
 *  - public/static/textures/sky/stars.bin      Yale Bright Star Catalog, ~9,100 stars down to V 6.5
 *  - public/static/textures/sky/milkyway.webp  ESO/S. Brunier all-sky Milky Way photograph, reprojected from galactic
 *                                       to J2000 equatorial coordinates (equirectangular, RA 0h at the centre)
 *
 * Sources:
 *  - Yale Bright Star Catalog, 5th rev. (Hoffleit & Warren), JSON by Bretton Wade
 *    https://github.com/brettonw/YaleBrightStarCatalog
 *  - ESO/S. Brunier, "The Milky Way panorama" (eso0932a), CC BY 4.0. https://www.eso.org/public/images/eso0932a/
 *
 * Usage: node scripts/build-sky.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import sharp from 'sharp';

const CATALOG_URL = 'https://raw.githubusercontent.com/brettonw/YaleBrightStarCatalog/master/bsc5-short.json';
const MILKY_WAY_URL = 'https://cdn.eso.org/images/original/eso0932a.tif';

const OUT_DIR = join(process.cwd(), 'public', 'static', 'textures', 'sky');
const CACHE_DIR = join(tmpdir(), 'sky-build');

const MILKY_WAY_WIDTH = 6144;

// J2000 equatorial to galactic rotation (IAU 1958 definition, Hipparcos values)
const EQUATORIAL_TO_GALACTIC = [
    [-0.0548755604, -0.8734370902, -0.4838350155],
    [0.4941094279, -0.4448296300, 0.7469822445],
    [-0.8676661490, -0.1980763734, 0.4559837762]
];

// The panorama is a hand-assembled mosaic and sits a few degrees off true galactic coordinates. These rotations
// (degrees about the galactic x, y and z axes) were fitted so its stars land on the ~170 catalogue stars brighter
// than V 3; isolated bright stars then match to within ~0.2°.
const PANORAMA_CORRECTION = [-0.96, -1.76, -3.19].map(deg => deg * Math.PI / 180);

// Bright emission nebulae (RA, Dec, radius in degrees) whose embedded stars stay in the photo: painting those out
// would take the nebula with them
const PROTECTED_NEBULAE = [
    [83.82, -5.39, 0.7], // Orion Nebula, M42
    [161.27, -59.87, 1.2], // Carina Nebula
    [270.92, -24.38, 0.6] // Lagoon Nebula, M8
];

async function download(url) {
    mkdirSync(CACHE_DIR, { recursive: true });
    const file = join(CACHE_DIR, url.split('/').pop());
    if (!existsSync(file)) {
        console.log(`Downloading ${url}`);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
        writeFileSync(file, Buffer.from(await response.arrayBuffer()));
    }
    return readFileSync(file);
}

/** "12h 34m 56.7s" or "+12° 34′ 56″" to degrees */
function parseSexagesimal(text, scale) {
    const match = text.match(/([+-])?(\d+)\D+(\d+)\D+(\d+(?:\.\d+)?)/);
    if (!match) return null;
    const sign = match[1] === '-' ? -1 : 1;
    return sign * scale * (Number(match[2]) + Number(match[3]) / 60 + Number(match[4]) / 3600);
}

/** Unit vector in the sky frame: +Y = north celestial pole, +X = RA 0h, RA increasing towards -Z */
function equatorialToVector(raDeg, decDeg) {
    const ra = raDeg * Math.PI / 180;
    const dec = decDeg * Math.PI / 180;
    return [Math.cos(dec) * Math.cos(ra), Math.sin(dec), -Math.cos(dec) * Math.sin(ra)];
}

// CIE 1931 colour matching functions, multi-lobe fit by Wyman, Sloan & Shirley (2013)
function cieXYZ(nm) {
    const g = (x, mu, s1, s2) => {
        const t = (x - mu) / (x < mu ? s1 : s2);
        return Math.exp(-0.5 * t * t);
    };
    return [
        1.056 * g(nm, 599.8, 37.9, 31.0) + 0.362 * g(nm, 442.0, 16.0, 26.7) - 0.065 * g(nm, 501.1, 20.4, 26.2),
        0.821 * g(nm, 568.8, 46.9, 40.5) + 0.286 * g(nm, 530.9, 16.3, 31.1),
        1.217 * g(nm, 437.0, 11.8, 36.0) + 0.681 * g(nm, 459.0, 26.0, 13.8)
    ];
}

/** Linear sRGB colour of a black body, normalised so the brightest channel is 1 */
function blackbodyColor(kelvin) {
    let X = 0, Y = 0, Z = 0;
    for (let nm = 380; nm <= 780; nm += 5) {
        const m = nm * 1e-9;
        const planck = 1 / (Math.pow(m, 5) * (Math.exp(1.4388e-2 / (m * kelvin)) - 1));
        const [x, y, z] = cieXYZ(nm);
        X += planck * x;
        Y += planck * y;
        Z += planck * z;
    }
    const rgb = [
        3.2406 * X - 1.5372 * Y - 0.4986 * Z,
        -0.9689 * X + 1.8758 * Y + 0.0415 * Z,
        0.0557 * X - 0.2040 * Y + 1.0570 * Z
    ].map(c => Math.max(c, 0));
    const max = Math.max(...rgb);
    return rgb.map(c => c / max);
}

function parseCatalog(json) {
    const stars = [];
    for (const entry of JSON.parse(json)) {
        const ra = parseSexagesimal(entry.RA ?? '', 15);
        const dec = parseSexagesimal(entry.Dec ?? '', 1);
        const mag = Number(entry.V);
        if (ra === null || dec === null || !Number.isFinite(mag)) continue;
        stars.push({
            dir: equatorialToVector(ra, dec),
            mag,
            kelvin: Number(entry.K) || 5800
        });
    }
    return stars;
}

function rotateXYZ([x, y, z], [ax, ay, az]) {
    [y, z] = [y * Math.cos(ax) - z * Math.sin(ax), y * Math.sin(ax) + z * Math.cos(ax)];
    [x, z] = [x * Math.cos(ay) + z * Math.sin(ay), -x * Math.sin(ay) + z * Math.cos(ay)];
    [x, y] = [x * Math.cos(az) - y * Math.sin(az), x * Math.sin(az) + y * Math.cos(az)];
    return [x, y, z];
}

/**
 * Paints the catalogue stars out of the panorama, so each exists once, as a rendered point. Otherwise the mouse
 * parallax between the two layers shows bright stars twice.
 *
 * Works on the equatorial sRGB image. For each star: re-centre on the photographed blob, size it from its radial
 * profile, then fill it with a feathered edge: the smooth background interpolated from the surrounding ring
 * (inverse-distance weighted, ignoring neighbouring stars in the ring) plus the grain of a nearby starless patch, so
 * the fill does not read as a blurred disk. Distances are measured on the sky, i.e. corrected for the
 * equirectangular stretch.
 */
function removeCatalogStars(pixels, width, height, catalog) {
    const offset = (x, y) => ((Math.min(height - 1, Math.max(0, y)) * width) + ((x % width) + width) % width) * 3;
    const lum = o => 0.2126 * pixels[o] + 0.7152 * pixels[o + 1] + 0.0722 * pixels[o + 2];
    let removed = 0;
    const nebulae = PROTECTED_NEBULAE.map(([ra, dec, r]) => ({ dir: equatorialToVector(ra, dec), cos: Math.cos(r * Math.PI / 180) }));
    const inNebula = dir => nebulae.some(n => n.dir[0] * dir[0] + n.dir[1] * dir[1] + n.dir[2] * dir[2] > n.cos);

    // Brightest first, so their wide halos are gone before fainter neighbours sample their rings
    for (const star of [...catalog].sort((a, b) => a.mag - b.mag)) {
        if (inNebula(star.dir)) continue;
        const [sx, sy, sz] = star.dir;
        const dec = Math.asin(sy);
        let u = 0.5 - Math.atan2(-sz, sx) / (2 * Math.PI);
        u -= Math.floor(u);
        let cx = u * width - 0.5;
        let cy = (0.5 - dec / Math.PI) * height - 0.5;
        const stretch = 1 / Math.max(Math.cos(dec), 0.05);
        const maxRadius = Math.min(Math.max(2 + 2.6 * (6.5 - star.mag), 2.5), 22);

        const forDisk = (radius, fn) => {
            const ry = Math.ceil(radius);
            const rx = Math.ceil(radius * stretch);
            for (let y = Math.round(cy) - ry; y <= Math.round(cy) + ry; y++) {
                if (y < 0 || y >= height) continue;
                for (let x = Math.round(cx) - rx; x <= Math.round(cx) + rx; x++) {
                    const d = Math.hypot((x - cx) / stretch, y - cy);
                    if (d <= radius) fn(x, y, d);
                }
            }
        };

        // The reprojection is accurate to ~2 px; lock onto the brightest 3x3 patch nearby
        let best = -1;
        let bx = cx;
        let by = cy;
        forDisk(3, (x, y) => {
            let s = 0;
            for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) s += lum(offset(x + i, y + j));
            if (s > best) {
                best = s;
                bx = x;
                by = y;
            }
        });
        cx = bx;
        cy = by;

        const bins = Math.ceil(maxRadius) + 6;
        const sum = new Float64Array(bins);
        const count = new Uint32Array(bins);
        forDisk(bins - 0.01, (x, y, d) => {
            sum[Math.floor(d)] += lum(offset(x, y));
            count[Math.floor(d)]++;
        });
        const profile = Array.from(sum, (s, k) => (count[k] ? s / count[k] : Infinity));
        const background = Math.min(...profile.slice(-4));
        const peak = profile[0];
        if (peak - background < 4) continue;

        let edge = 0;
        while (edge < bins - 5 && profile[edge] - background > 0.06 * (peak - background) + 1) edge++;
        const radius = Math.min(edge + 1.5, maxRadius);

        const ring = [];
        forDisk(radius + 3.5, (x, y, d) => {
            if (d < radius + 1) return;
            const o = offset(x, y);
            ring.push({ x, y, o, l: lum(o) });
        });
        const sorted = ring.map(s => s.l).sort((a, b) => a - b);
        const median = sorted[sorted.length >> 1];
        const mad = ring.map(s => Math.abs(s.l - median)).sort((a, b) => a - b)[ring.length >> 1];
        const clean = ring.filter(s => s.l <= median + 2 * mad + 3);

        // Donor patch for grain: the starless-most of eight neighbouring disks
        const reach = 2 * radius + 4;
        let donor = null;
        for (let k = 0; k < 8; k++) {
            const a = k * Math.PI / 4;
            const dx = Math.round(Math.cos(a) * reach * stretch);
            const dy = Math.round(Math.sin(a) * reach);
            if (cy + dy - radius - 1 < 0 || cy + dy + radius + 1 >= height) continue;
            const values = [];
            forDisk(radius + 1, (x, y) => values.push(lum(offset(x + dx, y + dy))));
            values.sort((p, q) => p - q);
            const top = values[Math.floor(values.length * 0.95)];
            if (!donor || top < donor.top) donor = { dx, dy, top };
        }
        const donorMean = [0, 0, 0];
        let donorCount = 0;
        if (donor) {
            forDisk(radius + 1, (x, y) => {
                const o = offset(x + donor.dx, y + donor.dy);
                for (let c = 0; c < 3; c++) donorMean[c] += pixels[o + c];
                donorCount++;
            });
            for (let c = 0; c < 3; c++) donorMean[c] /= donorCount;
        }

        const fills = [];
        forDisk(radius + 1, (x, y, d) => {
            const fill = [0, 0, 0];
            let total = 0;
            for (const s of clean) {
                const w = 1 / (((s.x - x) / stretch) ** 2 + (s.y - y) ** 2 + 0.5);
                total += w;
                for (let c = 0; c < 3; c++) fill[c] += w * pixels[s.o + c];
            }
            const o = donor && offset(x + donor.dx, y + donor.dy);
            fills.push({
                o: offset(x, y),
                fill: fill.map((v, c) => v / total + (donor ? pixels[o + c] - donorMean[c] : 0)),
                w: Math.min(1, radius + 1 - d)
            });
        });
        for (const { o, fill, w } of fills) {
            for (let c = 0; c < 3; c++) {
                pixels[o + c] = Math.min(255, Math.max(0, Math.round(pixels[o + c] * (1 - w) + fill[c] * w)));
            }
        }
        removed++;
    }
    console.log(`Removed ${removed} catalogue stars from the panorama`);
}

/**
 * The panorama is equirectangular in galactic coordinates with the Galactic centre in the middle and longitude
 * increasing to the left. Resampling happens in linear light so the bilinear filter does not darken stars.
 */
async function writeMilkyWay(buffer, catalog) {
    const { data, info } = await sharp(buffer).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const sw = info.width;
    const sh = info.height;
    const width = MILKY_WAY_WIDTH;
    const height = width / 2;

    const toLinear = new Float32Array(256).map((_, i) => {
        const c = i / 255;
        return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    const toSRGB = c => Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055));

    const pixels = Buffer.alloc(width * height * 3);
    for (let py = 0; py < height; py++) {
        const dec = Math.PI * (0.5 - (py + 0.5) / height);
        for (let px = 0; px < width; px++) {
            const ra = 2 * Math.PI * (0.5 - (px + 0.5) / width);
            const eq = [Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec)];
            const gal = rotateXYZ(EQUATORIAL_TO_GALACTIC.map(r => r[0] * eq[0] + r[1] * eq[1] + r[2] * eq[2]), PANORAMA_CORRECTION);
            const l = Math.atan2(gal[1], gal[0]);
            const b = Math.asin(Math.max(-1, Math.min(1, gal[2])));

            let x = 0.5 - l / (2 * Math.PI);
            x = (x - Math.floor(x)) * sw - 0.5;
            const y = (0.5 - b / Math.PI) * sh - 0.5;
            const x0 = Math.floor(x);
            const y0 = Math.max(0, Math.min(sh - 2, Math.floor(y)));
            const fx = x - x0;
            const fy = Math.max(0, Math.min(1, y - y0));
            const xa = (x0 + sw) % sw;
            const xb = (x0 + 1) % sw;

            for (let c = 0; c < 3; c++) {
                const at = (sx, sy) => toLinear[data[(sy * sw + sx) * 3 + c]];
                const top = at(xa, y0) * (1 - fx) + at(xb, y0) * fx;
                const bottom = at(xa, y0 + 1) * (1 - fx) + at(xb, y0 + 1) * fx;
                pixels[(py * width + px) * 3 + c] = toSRGB(top * (1 - fy) + bottom * fy);
            }
        }
    }

    removeCatalogStars(pixels, width, height, catalog);

    const file = join(OUT_DIR, 'milkyway.webp');
    await sharp(pixels, { raw: { width, height, channels: 3 } })
        .webp({ quality: 62, effort: 6 })
        .toFile(file);
    console.log(`Wrote ${file}`);
}

/**
 * Layout: uint32 count | int16[3n] direction (normalised) | uint8[n] magnitude ((V + 2) * 20) | uint8[3n] linear RGB
 */
function writeStars(stars) {
    const n = stars.length;
    const buffer = new ArrayBuffer(4 + n * 6 + n + n * 3);
    new Uint32Array(buffer, 0, 1)[0] = n;
    const dirs = new Int16Array(buffer, 4, n * 3);
    const mags = new Uint8Array(buffer, 4 + n * 6, n);
    const colors = new Uint8Array(buffer, 4 + n * 7, n * 3);

    const colorCache = new Map();
    stars.forEach((star, i) => {
        for (let k = 0; k < 3; k++) dirs[i * 3 + k] = Math.round(star.dir[k] * 32767);
        mags[i] = Math.round(Math.min(Math.max((star.mag + 2) * 20, 0), 255));

        const kelvin = Math.min(Math.max(Math.round(star.kelvin / 100) * 100, 2000), 40000);
        if (!colorCache.has(kelvin)) colorCache.set(kelvin, blackbodyColor(kelvin));
        const color = colorCache.get(kelvin);
        for (let k = 0; k < 3; k++) colors[i * 3 + k] = Math.round(color[k] * 255);
    });

    const file = join(OUT_DIR, 'stars.bin');
    writeFileSync(file, Buffer.from(buffer));
    console.log(`Wrote ${file} (${n} stars)`);
}

mkdirSync(OUT_DIR, { recursive: true });

const catalog = parseCatalog((await download(CATALOG_URL)).toString('utf8'));
console.log(`Parsed ${catalog.length} catalogue stars`);
writeStars(catalog);

await writeMilkyWay(await download(MILKY_WAY_URL), catalog);
