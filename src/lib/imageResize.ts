// Redimensiona uma imagem no browser antes do upload.
// Mantém proporção (ratio cap em 1 = nunca aumenta), aplica orientação EXIF
// (createImageBitmap com imageOrientation: 'from-image') e exporta como JPEG
// com qualidade configurável — sai bem menor que a imagem original do celular.

export interface ResizeOptions {
  maxWidth: number;
  maxHeight: number;
  quality?: number; // 0–1
  mimeType?: 'image/jpeg' | 'image/webp';
}

export interface ResizeResult {
  blob: Blob;
  width: number;
  height: number;
  originalSize: number;
  resizedSize: number;
}

export async function resizeImage(file: File, opts: ResizeOptions): Promise<ResizeResult> {
  const { maxWidth, maxHeight, quality = 0.85, mimeType = 'image/jpeg' } = opts;

  // createImageBitmap com imageOrientation respeita o EXIF (foto não fica girada)
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });

  const ratio = Math.min(maxWidth / bitmap.width, maxHeight / bitmap.height, 1);
  const width = Math.max(1, Math.round(bitmap.width * ratio));
  const height = Math.max(1, Math.round(bitmap.height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Canvas 2D não disponível neste navegador');
  }

  // Fundo branco (JPEG não suporta transparência — evita preto em PNGs com alpha)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Falha ao gerar JPEG'))),
      mimeType,
      quality
    );
  });

  return {
    blob,
    width,
    height,
    originalSize: file.size,
    resizedSize: blob.size,
  };
}
