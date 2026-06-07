const generateSlug = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const generateUniqueSlug = async (name, ProductModel, excludeId = null) => {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let exists = await ProductModel.findOne({
    slug,
    _id: { $ne: excludeId },
  });
  let counter = 1;

  while (exists) {
    slug = `${baseSlug}-${counter}`;
    exists = await ProductModel.findOne({
      slug,
      _id: { $ne: excludeId },
    });
    counter += 1;
  }

  return slug;
};

module.exports = { generateSlug, generateUniqueSlug };
