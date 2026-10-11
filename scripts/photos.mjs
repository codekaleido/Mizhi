#!/usr/bin/env node
/** Local authoring tool. Never loaded by the website. Node.js, no packages. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = path.join(root, 'photos.js');
const folder = path.join(root, 'assets', 'photos');
const prefix = 'window.MIZHI_PHOTOS = ';
const supported = /\.(jpe?g|png|webp|avif|gif)$/i;
function read() {
  const raw = fs.readFileSync(manifest, 'utf8');
  const start = raw.indexOf(prefix);
  if (start < 0) throw new Error('photos.js must contain window.MIZHI_PHOTOS = followed by a JSON array.');
  return JSON.parse(raw.slice(start + prefix.length).trim().replace(/;$/, ''));
}
function write(photos) {
  fs.writeFileSync(manifest, '// Photo order here is the display order. Local editing only.\n' + prefix + JSON.stringify(photos, null, 2) + ';\n');
}
function slug(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'photo'; }
function record(filename) {
  const title = path.parse(filename).name.replace(/[-_]+/g, ' ').replace(/^\d+\s*/, '') || 'Untitled';
  return { id: slug(path.parse(filename).name), src: `assets/photos/${encodeURIComponent(filename)}`, title: title.charAt(0).toUpperCase() + title.slice(1), alt: title };
}
try {
  const [command, input, ...extra] = process.argv.slice(2);
  const photos = read();
  fs.mkdirSync(folder, { recursive: true });
  if (command === 'add') {
    if (!input || !supported.test(input)) throw new Error('Supply a JPG, PNG, WebP, AVIF or GIF path.');
    if (!fs.statSync(path.resolve(input)).isFile()) throw new Error('Input must be an image file.');
    const title = extra.join(' ') || path.parse(input).name;
    const stem = slug(title), extension = path.extname(input).toLowerCase();
    let id = stem, suffix = 2;
    while (photos.some(p => p.id === id) || fs.existsSync(path.join(folder, id + extension))) id = `${stem}-${suffix++}`;
    const filename = id + extension;
    fs.copyFileSync(path.resolve(input), path.join(folder, filename));
    photos.push({ id, src: `assets/photos/${filename}`, title, alt: title });
    write(photos); console.log(`Added ${id}. Commit the image and photos.js to publish.`);
  } else if (command === 'remove') {
    const index = photos.findIndex(p => p.id === input);
    if (index < 0) throw new Error('Unknown photo ID. Run: node scripts/photos.mjs list');
    // Remove from the collection, preserve original bytes until explicitly deleted.
    photos.splice(index, 1); write(photos);
    console.log('Removed from collection. The image file is preserved; delete it manually if no longer needed.');
  } else if (command === 'sync') {
    const files = fs.readdirSync(folder).filter(f => supported.test(f)).sort((a,b) => a.localeCompare(b, undefined, { numeric:true }));
    const bySrc = new Map(photos.map(p => [p.src, p]));
    const next = files.map(filename => { const item = record(filename); return bySrc.get(item.src) || item; });
    const ids = new Set();
    for (const p of next) { const base=p.id; let i=2; while(ids.has(p.id)) p.id=`${base}-${i++}`; ids.add(p.id); }
    write(next); console.log(`Synced ${next.length} photos in filename order. All images in assets/photos are included.`);
  } else if (command === 'list') {
    for (const photo of photos) console.log(`${photo.id}\t${photo.title}\t${photo.src}`);
  } else {
    console.log('Mizhi — local photo management\n\nnode scripts/photos.mjs add "C:/Pictures/photo.jpg" "Photo title"\nnode scripts/photos.mjs remove photo-id\nnode scripts/photos.mjs list\nnode scripts/photos.mjs sync\n\nsync rebuilds from every image in assets/photos, including previously unlisted files.');
    if (command) process.exitCode = 1;
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
