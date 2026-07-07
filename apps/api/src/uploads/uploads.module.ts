import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { UploadsController } from './uploads.controller';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|pdf/;
        const ext = allowed.test(extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) cb(null, true);
        else cb(new Error('Only images (JPEG/PNG/GIF) and PDFs are allowed'), false);
      },
    }),
  ],
  controllers: [UploadsController],
})
export class UploadsModule {}
