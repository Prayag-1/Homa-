export const MAX_IMAGE_SIZE_BYTES = 500 * 1024;
export const MAX_IMAGE_SIZE_LABEL = '500 KB';
export const IMAGE_UPLOAD_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const QUALITY_STEPS = [0.92, 0.82, 0.72, 0.62, 0.52, 0.45];
const MAX_DIMENSION_STEPS = [1600, 1400, 1200, 1000, 850];

const getBaseName = (name = 'image') => {
  const lastDot = name.lastIndexOf('.');
  return lastDot > 0 ? name.slice(0, lastDot) : name;
};

const getExtension = (mimeType) => {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/png') return 'png';
  return 'webp';
};

const loadImage = (file) => new Promise((resolve, reject) => {
  const imageUrl = URL.createObjectURL(file);
  const image = new Image();

  image.onload = () => {
    URL.revokeObjectURL(imageUrl);
    resolve(image);
  };
  image.onerror = () => {
    URL.revokeObjectURL(imageUrl);
    reject(new Error('Unable to read the selected image'));
  };

  image.src = imageUrl;
});

const canvasToBlob = (canvas, mimeType, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error(`Canvas export failed for ${mimeType}`));
        return;
      }
      resolve(blob);
    }, mimeType, quality);
  });

const blobToFile = (blob, originalFile, mimeType) => new File(
  [blob],
  `${getBaseName(originalFile.name)}.${getExtension(mimeType)}`,
  {
    type: mimeType,
    lastModified: originalFile.lastModified || Date.now(),
  },
);

const fitWithinBounds = (width, height, maxDimension) => {
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

export const compressImageFile = async (file, options = {}) => {
  if (!(file instanceof File)) return file;
  if (!file.type?.startsWith('image/')) return file;

  const maxBytes = options.maxBytes || MAX_IMAGE_SIZE_BYTES;
  if (file.size <= maxBytes) return file;

  const supportedMimeTypes = options.mimeTypes || ['image/webp', 'image/jpeg'];
  const qualitySteps = options.qualitySteps || QUALITY_STEPS;
  const maxDimensionSteps = options.maxDimensionSteps || MAX_DIMENSION_STEPS;

  const image = await loadImage(file);
  const naturalWidth = image.naturalWidth || image.width;
  const naturalHeight = image.naturalHeight || image.height;

  let bestBlob = null;
  let bestMimeType = supportedMimeTypes[0];
  let currentWidth = naturalWidth;
  let currentHeight = naturalHeight;

  for (const maxDimension of maxDimensionSteps) {
    const bounded = fitWithinBounds(currentWidth, currentHeight, maxDimension);
    currentWidth = bounded.width;
    currentHeight = bounded.height;

    const canvas = document.createElement('canvas');
    canvas.width = currentWidth;
    canvas.height = currentHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to prepare image compression');
    }

    context.clearRect(0, 0, currentWidth, currentHeight);
    context.drawImage(image, 0, 0, currentWidth, currentHeight);

    for (const mimeType of supportedMimeTypes) {
      for (const quality of qualitySteps) {
        let blob;
        try {
          blob = await canvasToBlob(canvas, mimeType, quality);
        } catch {
          continue;
        }

        if (!bestBlob || blob.size < bestBlob.size) {
          bestBlob = blob;
          bestMimeType = mimeType;
        }

        if (blob.size <= maxBytes) {
          return blobToFile(blob, file, mimeType);
        }
      }
    }

    currentWidth = Math.max(1, Math.round(currentWidth * 0.85));
    currentHeight = Math.max(1, Math.round(currentHeight * 0.85));
  }

  if (bestBlob && bestBlob.size <= maxBytes) {
    return blobToFile(bestBlob, file, bestMimeType);
  }

  throw new Error(`Could not compress ${file.name} below ${MAX_IMAGE_SIZE_LABEL}.`);
};
