import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadsController } from './uploads.controller';
import { FileStorageService } from './file-storage.service';
import { StoredFileEntity } from '../database/entities/stored-file.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([StoredFileEntity]),
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  ],
  providers: [FileStorageService],
  controllers: [UploadsController],
  exports: [FileStorageService],
})
export class UploadsModule {}
