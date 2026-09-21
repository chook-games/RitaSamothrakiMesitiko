// Client-side image compression before upload.
// Re-encodes to JPEG (photos), optionally downscales the longest side.
// Returns the original blob if compression would make it larger or fails.

async function loadSource(input: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(input)
    } catch {
      // fall through to <img>
    }
  }
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(input)
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = (err) => { URL.revokeObjectURL(url); reject(err) }
    img.src = url
  })
}

export async function compressImage(
  input: Blob,
  maxDimension = 1600,
  quality = 0.8
): Promise<Blob> {
  try {
    if (!input.type || !input.type.startsWith('image/')) return input
    if (input.type === 'image/gif') return input // keep animations

    const source = await loadSource(input)
    const width = (source as ImageBitmap).width || (source as HTMLImageElement).naturalWidth
    const height = (source as ImageBitmap).height || (source as HTMLImageElement).naturalHeight
    if (!width || !height) return input

    const scale = Math.min(1, maxDimension / Math.max(width, height))
    const targetW = Math.max(1, Math.round(width * scale))
    const targetH = Math.max(1, Math.round(height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')
    if (!ctx) return input

    ctx.drawImage(source as CanvasImageSource, 0, 0, targetW, targetH)
    if (typeof (source as ImageBitmap).close === 'function') (source as ImageBitmap).close()

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!blob) return input
    return blob.size < input.size ? blob : input
  } catch {
    return input
  }
}
