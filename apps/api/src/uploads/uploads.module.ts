import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadsController } from './uploads.controller';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowedMimeTypes = new Set([
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/pdf',
        ]);
        const allowedExtensions = /\.(jpe?g|png|gif|pdf)$/i;
        if (
          allowedMimeTypes.has(file.mimetype) &&
          allowedExtensions.test(file.originalname)
        ) {
          cb(null, true);
        } else {
          cb(new Error('Only images (JPEG/PNG/GIF) and PDFs are allowed'), false);
        }
      },
    }),
  ],
  controllers: [UploadsController],
})
export class UploadsModule {}
