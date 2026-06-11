/**
 * image-to-webp.ts
 *
 * Browser-only utility that converts an uploaded JPG/PNG File into a WebP
 * File via the Canvas API, then hands the result back as a new File so the
 * rest of the upload pipeline (`SupabaseService.uploadImage`) is unchanged.
 *
 * Why this exists: every gallery before/after photo and every blog cover
 * image used to ship its original JPG bytes to Supabase Storage. At
 * quality 0.9 the WebP re-encode is **visually identical** for clinical
 * detail (tooth shading, gum colour, lighting on smiles) but typically
 * ~30% smaller. Multiplied across a growing gallery, that's real CDN
 * bandwidth saved + faster `/gallery` LCP.
 *
 * Why NOT a library (squoosh, browser-image-compression, etc):
 *   - Canvas + toBlob handles JPG/PNG → WebP natively in every supported
 *     browser. No 30 kB dependency, no worker setup, no licence to track.
 *   - The whole utility is < 60 lines of code we own.
 *
 * Browser support for `canvas.toBlob(cb, 'image/webp', q)`:
 *   - Chrome / Edge / Opera: 23+ (every desktop since 2013)
 *   - Firefox: 65+ (Jan 2019)
 *   - Safari: 14+ (Big Sur, Sept 2020)
 *   Admin panel users sign in from modern browsers — safe.
 *
 * Inputs we DON'T re-encode (returned as-is):
 *   - `image/webp` — already optimal
 *   - `image/svg+xml` — vector, no rasterisation benefit
 *   - `image/gif` — animation would be flattened to first frame
 *   - Anything where canvas decode fails (corrupted file, > browser max
 *     canvas dimensions ~16384×16384): we fall back to the original File
 *     so the upload still succeeds rather than blocking the admin.
 */

/** WebP encode quality. 0.9 preserves clinical detail; ~30% smaller than JPG. */
const DEFAULT_QUALITY = 0.9;

/** Browser max canvas dimensions vary, but ~16k px is the practical ceiling
 *  even on desktop Safari. Above this, drawImage silently fails. */
const MAX_DIMENSION = 16_384;

/** Mime types we skip — re-encoding would either be wasteful or destructive. */
const SKIP_PATTERN = /^image\/(webp|svg\+xml|gif)/i;

/**
 * Convert a File to a WebP File. On any failure (unsupported mime, decode
 * error, browser without WebP encoder) returns the original File so the
 * upload pipeline never breaks because of a bad input.
 */
export async function toWebpFile(file: File, quality = DEFAULT_QUALITY): Promise<File> {
  if (!file || !file.type) return file;
  if (SKIP_PATTERN.test(file.type)) return file;

  // SSR guard — this should only run in the admin panel (browser-only by
  // design), but defending against accidental server-side invocation is
  // cheap and prevents prerender crashes if the upload service is ever
  // wired into a route resolver.
  if (typeof document === 'undefined') return file;

  try {
    const bitmap = await decodeImage(file);
    if (!bitmap) return file;

    const { width, height } = clampDimensions(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width  = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    // Release the decoder buffer — ImageBitmap retains memory until closed
    // explicitly on some browsers.
    if ('close' in bitmap && typeof (bitmap as any).close === 'function') {
      (bitmap as ImageBitmap).close();
    }

    const blob = await canvasToWebpBlob(canvas, quality);
    if (!blob) return file;

    // Some encoders silently produce a larger file than the input on tiny
    // or already-compressed images. If that happens, keep the original.
    if (blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, '');
    return new File([blob], `${baseName}.webp`, {
      type: 'image/webp',
      lastModified: file.lastModified
    });
  } catch {
    // Any failure → upload the original. The admin shouldn't be blocked
    // by a re-encode glitch on an otherwise valid image.
    return file;
  }
}

/** Decode the File into an ImageBitmap (fast path) or HTMLImageElement
 *  (fallback for browsers without createImageBitmap, mostly old Safari). */
async function decodeImage(file: File): Promise<ImageBitmap | HTMLImageElement | null> {
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(file); } catch { /* fall through */ }
  }
  // HTMLImageElement fallback: load via object URL, wait for decode, revoke.
  return new Promise<HTMLImageElement | null>((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload  = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

/** Clamp dimensions to MAX_DIMENSION while preserving aspect ratio. */
function clampDimensions(w: number, h: number): { width: number; height: number } {
  if (w <= MAX_DIMENSION && h <= MAX_DIMENSION) return { width: w, height: h };
  const scale = Math.min(MAX_DIMENSION / w, MAX_DIMENSION / h);
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

/** Promisified canvas.toBlob('image/webp', q). Resolves null when the
 *  browser refuses to encode WebP (extremely rare on supported targets). */
function canvasToWebpBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/webp', quality);
  });
}
