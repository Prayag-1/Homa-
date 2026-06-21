export const optimizeImage = (url, width = 800) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  if (url.includes('f_auto')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
};

export const getResponsiveImageProps = (url, alt, sizes = '(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 300px') => {
  if (!url || !url.includes('cloudinary.com')) {
    return {
      src: url || '/placeholder.jpg',
      alt,
      loading: 'lazy',
      decoding: 'async',
    };
  }

  const base = url.replace('/upload/', '/upload/f_auto,q_auto/');

  return {
    src: base.replace('/upload/', '/upload/w_400/'),
    srcSet: [
      `${base.replace('/upload/', '/upload/w_300/')} 300w`,
      `${base.replace('/upload/', '/upload/w_400/')} 400w`,
      `${base.replace('/upload/', '/upload/w_600/')} 600w`,
      `${base.replace('/upload/', '/upload/w_800/')} 800w`,
    ].join(', '),
    sizes,
    alt,
    loading: 'lazy',
    decoding: 'async',
  };
};
