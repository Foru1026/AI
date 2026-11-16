// Scroll order: every project's landing screen first, then its second screen.
// Slugs must match src/data/projects.js, which holds the detail-panel content.
export const PROJECT_SLUGS = Object.freeze(["marqo", "syntheum", "deeplumen", "thankly", "vendifai", "kepler", "sozai", "rubick", "flint", "livedemo", "virtik", "papayo", "eloo", "faux", "charm"]);
export const CARD_PROJECTS = Object.freeze([1, 2].flatMap(() => PROJECT_SLUGS));
export const GLASS_CARD_IMAGES = Object.freeze([1, 2].flatMap(shot =>
  PROJECT_SLUGS.map(slug => `../assets/projects/cards/${slug}-${shot}.jpg`)));
export const PHOTO_ASPECT = 16/9;
const columns = 4, rows = Math.ceil(GLASS_CARD_IMAGES.length/columns);
const tileWidth = 768, tileHeight = 432, gutter = 4;
const cellWidth = tileWidth + gutter*2, cellHeight = tileHeight + gutter*2;
export const PHOTO_ATLAS = Object.freeze({ columns, rows, tileWidth, tileHeight, gutter,
  cellWidth, cellHeight, width: columns*cellWidth, height: rows*cellHeight });

export function photoAtlasRegion(index, aspect = PHOTO_ASPECT) {
  if (!Number.isInteger(index) || index < 0 || index >= GLASS_CARD_IMAGES.length)
    throw new RangeError(`Unknown glass card image: ${index}`);
  if (!Number.isFinite(aspect) || aspect <= 0) throw new RangeError('Invalid card aspect ratio');
  let width = tileWidth, height = tileHeight;
  if (aspect > PHOTO_ASPECT) height *= PHOTO_ASPECT/aspect;
  else width *= aspect/PHOTO_ASPECT;
  const left = index % columns*cellWidth + gutter + (tileWidth - width)/2;
  const bottom = PHOTO_ATLAS.height - (Math.floor(index/columns)*cellHeight + gutter + tileHeight) + (tileHeight - height)/2;
  return { repeat: [width/PHOTO_ATLAS.width, height/PHOTO_ATLAS.height],
    offset: [left/PHOTO_ATLAS.width, bottom/PHOTO_ATLAS.height] };
}

export async function createBluePhotoAtlas() {
  const canvas = document.createElement('canvas');
  canvas.width = PHOTO_ATLAS.width; canvas.height = PHOTO_ATLAS.height;
  const ctx = canvas.getContext('2d');
  // The card set is under a megabyte. Decode together so the first portal
  // crossing is not waiting on thirty pictures in a row.
  const images = await Promise.all(GLASS_CARD_IMAGES.map(async (src) => {
    const image = new Image();
    image.src = new URL(src, import.meta.url).href;
    await image.decode();
    return image;
  }));
  for (let index = 0; index < images.length; index++) {
    const image = images[index];
    const x = index % columns*cellWidth + gutter, y = Math.floor(index/columns)*cellHeight + gutter;
    ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, x, y, tileWidth, tileHeight);
    // Preserve the supplied colour grading; no blue tint or saturation filter.
    // Extrude the original edge pixels into each gutter: distant mipmapped cards
    // must not pick up a strip of the neighbouring picture.
    ctx.drawImage(canvas, x, y, tileWidth, 1, x, y - gutter, tileWidth, gutter);
    ctx.drawImage(canvas, x, y + tileHeight - 1, tileWidth, 1, x, y + tileHeight, tileWidth, gutter);
    ctx.drawImage(canvas, x, y - gutter, 1, cellHeight, x - gutter, y - gutter, gutter, cellHeight);
    ctx.drawImage(canvas, x + tileWidth - 1, y - gutter, 1, cellHeight, x + tileWidth, y - gutter, gutter, cellHeight);
  }
  return canvas;
}
