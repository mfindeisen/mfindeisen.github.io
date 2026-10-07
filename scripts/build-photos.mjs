/**
 * Turns place photos into display-sized WebP and square thumbnails.
 *
 * Drop JPEG or WebP files into public/textures/photos/, then run:
 *   node scripts/build-photos.mjs
 *
 * JPEGs are resized, written as WebP, and removed. Existing WebP files are
 * left as-is and only get fresh thumbnails, so running the script twice
 * does not recompress them.
 */
import { readdir, stat, unlink, writeFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import sharp from 'sharp';

const PHOTO_DIR = join(process.cwd(), 'public', 'textures', 'photos');
const THUMB_DIR = join(PHOTO_DIR, 'thumbnails');

const THUMBS = {
    preview: { size: 150, quality: 70 },
    gallery: { size: 200, quality: 74 },
    medium: { size: 400, quality: 76 }
};

const DISPLAY_EDGE = 2560;
const SPHERE_EDGE = 4096;
const DISPLAY_QUALITY = 80;
const SPHERE_QUALITY = 74;

function isSphere(filename, meta) {
    if (/360|photosphere/i.test(filename)) return true;
    const { width = 0, height = 0 } = meta;
    return width >= 6000 && height > 0 && width >= height * 1.9;
}

async function encodeDisplay(srcPath, webpPath, filename) {
    const meta = await sharp(srcPath).metadata();
    const sphere = isSphere(filename, meta);
    await sharp(srcPath)
        .rotate()
        .resize({
            width: sphere ? SPHERE_EDGE : DISPLAY_EDGE,
            height: sphere ? SPHERE_EDGE : DISPLAY_EDGE,
            fit: 'inside',
            withoutEnlargement: true
        })
        .webp({ quality: sphere ? SPHERE_QUALITY : DISPLAY_QUALITY, effort: 5 })
        .toFile(webpPath);
}

async function writeThumbs(webpPath, stem) {
    const names = [];
    for (const [label, cfg] of Object.entries(THUMBS)) {
        const thumbName = `${stem}_${label}.webp`;
        await sharp(webpPath)
            .resize(cfg.size, cfg.size, { fit: 'cover', position: 'centre' })
            .webp({ quality: cfg.quality, effort: 4 })
            .toFile(join(THUMB_DIR, thumbName));
        names.push(thumbName);
    }
    return names;
}

async function main() {
    const entries = await readdir(PHOTO_DIR, { withFileTypes: true });
    const sources = entries
        .filter((entry) => entry.isFile() && /\.(jpe?g|webp)$/i.test(entry.name))
        .map((entry) => entry.name)
        .sort();

    const converted = new Set();
    const manifestFiles = [];
    let sourceBytes = 0;
    let displayBytes = 0;

    for (const name of sources) {
        const ext = extname(name).toLowerCase();
        const stem = basename(name, ext);
        if (ext === '.webp' && converted.has(stem)) continue;

        const srcPath = join(PHOTO_DIR, name);
        const webpName = `${stem}.webp`;
        const webpPath = join(PHOTO_DIR, webpName);

        if (ext === '.jpg' || ext === '.jpeg') {
            const before = (await stat(srcPath)).size;
            sourceBytes += before;
            await encodeDisplay(srcPath, webpPath, name);
            await unlink(srcPath);
            converted.add(stem);
            const after = (await stat(webpPath)).size;
            displayBytes += after;
            const out = await sharp(webpPath).metadata();
            console.log(
                `${name}  ${(before / 1024 / 1024).toFixed(2)} MB  ->  ${webpName}  ${Math.round(after / 1024)} KB  ${out.width}x${out.height}`
            );
        } else {
            displayBytes += (await stat(srcPath)).size;
        }

        manifestFiles.push({
            original: webpName,
            thumbnails: await writeThumbs(webpPath, stem)
        });
    }

    const thumbEntries = await readdir(THUMB_DIR);
    for (const name of thumbEntries) {
        if (/\.jpe?g$/i.test(name)) await unlink(join(THUMB_DIR, name));
    }

    const manifest = {
        generated: new Date().toISOString(),
        totalPhotos: manifestFiles.length,
        display: {
            maxEdge: DISPLAY_EDGE,
            quality: DISPLAY_QUALITY,
            sphereMaxEdge: SPHERE_EDGE,
            sphereQuality: SPHERE_QUALITY
        },
        thumbnailSizes: {
            preview: { width: 150, height: 150, quality: THUMBS.preview.quality },
            gallery: { width: 200, height: 200, quality: THUMBS.gallery.quality },
            medium: { width: 400, height: 400, quality: THUMBS.medium.quality }
        },
        files: manifestFiles
    };

    await writeFile(join(THUMB_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

    const thumbBytes = (await Promise.all(
        (await readdir(THUMB_DIR))
            .filter((name) => name.endsWith('.webp'))
            .map((name) => stat(join(THUMB_DIR, name)).then((info) => info.size))
    )).reduce((sum, size) => sum + size, 0);

    console.log(
        `\n${manifestFiles.length} photos. JPEG sources ${(sourceBytes / 1024 / 1024).toFixed(1)} MB, ` +
        `WebP display ${(displayBytes / 1024 / 1024).toFixed(1)} MB, ` +
        `thumbnails ${(thumbBytes / 1024).toFixed(0)} KB`
    );
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
