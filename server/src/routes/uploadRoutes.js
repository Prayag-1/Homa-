const router = require('express').Router();
const { getStoredImage } = require('../middleware/upload');

router.get('/:id', async (req, res, next) => {
  try {
    const { file, stream } = await getStoredImage(req.params.id);

    res.set({
      'Content-Type': file.contentType || 'application/octet-stream',
      'Content-Length': file.length,
      'Cache-Control': 'public, max-age=2592000, immutable',
      'X-Content-Type-Options': 'nosniff',
    });

    stream.on('error', next);
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
