const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Fix for multer-storage-cloudinary v4 — handle both named and default exports
let CloudinaryStorage;
try {
  const pkg = require('multer-storage-cloudinary');
  CloudinaryStorage = pkg.CloudinaryStorage || pkg;
} catch (e) {
  CloudinaryStorage = require('multer-storage-cloudinary');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const makeStorage = (folder, transformation) =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `fitkicks/${folder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      ...(transformation ? { transformation } : {}),
    },
  });

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPEG, PNG, WebP images allowed'), false);
};

const uploadProduct = multer({
  storage: makeStorage('products', [{ width: 800, height: 800, crop: 'limit', quality: 'auto:best' }]),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadOutfit = multer({
  storage: makeStorage('ai-outfits', [{ width: 1024, height: 1024, crop: 'limit', quality: 'auto:good' }]),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadAvatar = multer({
  storage: makeStorage('avatars', [{ width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' }]),
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

const deleteImage = async (publicId) => {
  try { await cloudinary.uploader.destroy(publicId); }
  catch (e) { console.error('Cloudinary delete error:', e); }
};

module.exports = { cloudinary, uploadProduct, uploadOutfit, uploadAvatar, deleteImage };
