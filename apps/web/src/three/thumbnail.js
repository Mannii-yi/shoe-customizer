// =============================================================================
// apps/web/src/three/thumbnail.js
// Owner: Dev A
// =============================================================================
//
// WHAT THIS FILE IS
// captureThumbnail(): returns a picture of the shoe as a JPEG "data URL" (the
// picture encoded as text, ready to send to the API and store in the database).
//
// WHY IT EXISTS
// Dev D's "Save design" button calls this to attach a preview image to a saved
// design. The contract promises: a Promise that resolves to a JPEG data URL,
// 512x512, assembled pose, under 150 KB.
//
// CURRENT STATE: MOCK
// The real version (render the assembled shoe, then restore the previous
// explode and camera state) is a later task, once the real model is in.
// Until then this returns a plain dark picture with a label, so Dev D can build
// and test the whole save flow against the real function shape.
// =============================================================================

// Size of the picture, in pixels (from the contract).
const THUMBNAIL_SIZE = 512;

// JPEG quality from 0 to 1 (from the blueprint).
const JPEG_QUALITY = 0.8;


/**
 * Returns a thumbnail of the shoe.
 *
 * MOCK: draws a dark square with the text "MOCK THUMBNAIL" instead of the real
 * shoe. Replace with the real render-and-export version later.
 *
 * @returns {Promise<string>} A JPEG data URL, for example
 *   "data:image/jpeg;base64,...". 512x512 and well under 150 KB.
 */
export async function captureThumbnail() {
  // A canvas that exists only in memory (it is never shown on the page).
  const canvas = document.createElement('canvas');
  canvas.width = THUMBNAIL_SIZE;
  canvas.height = THUMBNAIL_SIZE;

  const context = canvas.getContext('2d');

  // Dark background, matching the site's look.
  context.fillStyle = '#0b0b0c';
  context.fillRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);

  // The label, so nobody mistakes this for a real thumbnail.
  context.fillStyle = '#D4AF37';
  context.font = '28px sans-serif';
  context.textAlign = 'center';
  context.fillText('MOCK THUMBNAIL', THUMBNAIL_SIZE / 2, THUMBNAIL_SIZE / 2);

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}