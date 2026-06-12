export const optimizeImage = (url, width = 800) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  if (url.includes('f_auto')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
};
