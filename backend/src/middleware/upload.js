const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sharp = require('sharp');
const { uploadDir } = require('../config/env');
const ApiError = require('../utils/ApiError');

const ROOT = path.resolve(__dirname, '../../', uploadDir);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpe?g|png|webp|gif|heic|heif)$/.test(file.mimetype)) cb(null, true);
    else cb(ApiError.badRequest('Only image files are allowed'));
  },
});

/** Compress an uploaded image buffer to webp and return its public URL path (/uploads/...) */
async function saveImage(buffer, folder = 'misc', { width = 1200, height } = {}) {
  const dir = path.join(ROOT, folder);
  fs.mkdirSync(dir, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.webp`;
  await sharp(buffer)
    .rotate()
    .resize({ width, height, fit: height ? 'cover' : 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(path.join(dir, name));
  return `/uploads/${folder}/${name}`;
}

function deleteImage(url) {
  if (!url || !url.startsWith('/uploads/')) return;
  const file = path.join(ROOT, url.replace('/uploads/', ''));
  if (file.startsWith(ROOT)) fs.promises.unlink(file).catch(() => {});
}

module.exports = { upload, saveImage, deleteImage, UPLOAD_ROOT: ROOT };
