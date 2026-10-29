import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

export const UPLOADS_DIR = join(process.cwd(), 'uploads');

if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const multerStorage = diskStorage({
  destination: (_req, _file, callback) => {
    if (!existsSync(UPLOADS_DIR)) {
      mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    callback(null, UPLOADS_DIR);
  },
  filename: (_req, file, callback) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = extname(file.originalname) || '.jpg';
    callback(null, `prod-${uniqueSuffix}${ext}`);
  },
});
