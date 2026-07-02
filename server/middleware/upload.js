const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const uploadsRoot = path.join(__dirname, '../../uploads');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

ensureDir(path.join(uploadsRoot, 'avatars'));
ensureDir(path.join(uploadsRoot, 'posts'));

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const folder = req.uploadFolder || 'posts';
    const dir = path.join(uploadsRoot, folder);
    ensureDir(dir);
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const imageFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Only image files (jpg, png, gif, webp) are allowed'));
};

const videoFilter = (req, file, cb) => {
  const allowed = ['.mp4', '.webm', '.mov'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Only video files (mp4, webm, mov) are allowed'));
};

const avatarUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
});

const postMediaUpload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const images = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const videos = ['.mp4', '.webm', '.mov'];
    if (images.includes(ext) || videos.includes(ext)) cb(null, true);
    else cb(new Error('Unsupported media type'));
  },
});

module.exports = { avatarUpload, postMediaUpload };
