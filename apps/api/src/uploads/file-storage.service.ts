import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { StoredFileEntity } from '../database/entities/stored-file.entity';
import { UserEntity } from '../database/entities/user.entity';
import { Role } from '@medlink/shared';

export type StoredFileKind = 'avatar' | 'prescription';

@Injectable()
export class FileStorageService {
  constructor(
    @InjectRepository(StoredFileEntity)
    private readonly fileRepo: Repository<StoredFileEntity>,
  ) {}

  private detectType(file: Express.Multer.File): { mimeType: string; extension: string } | null {
    const bytes = file.buffer;
    if (!bytes || bytes.length < 4) return null;

    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { mimeType: 'image/jpeg', extension: '.jpg' };
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return { mimeType: 'image/png', extension: '.png' };
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && (bytes[3] === 0x38 || bytes[3] === 0x37)) return { mimeType: 'image/gif', extension: '.gif' };
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return { mimeType: 'application/pdf', extension: '.pdf' };
    return null;
  }

  async store(file: Express.Multer.File, ownerUserId: string, kind: StoredFileKind, patientId?: string): Promise<StoredFileEntity> {
    if (!file?.buffer) throw new BadRequestException('No file provided');
    const detected = this.detectType(file);
    if (!detected) throw new BadRequestException('File content does not match an allowed file type');

    const allowedMimeTypes = kind === 'avatar'
      ? new Set(['image/jpeg', 'image/png', 'image/gif'])
      : new Set(['image/jpeg', 'image/png', 'image/gif', 'application/pdf']);

    if (!allowedMimeTypes.has(detected.mimeType) || file.mimetype !== detected.mimeType) {
      throw new BadRequestException('File type is invalid or does not match its content');
    }

    const filename = `${randomUUID()}${detected.extension}`;
    const uploadDir = join(process.cwd(), 'uploads');
    mkdirSync(uploadDir, { recursive: true });
    writeFileSync(join(uploadDir, filename), file.buffer, { flag: 'wx', mode: 0o600 });

    try {
      return await this.fileRepo.save({ filename, ownerUserId, patientId: patientId ?? null, kind, mimeType: detected.mimeType });
    } catch (error) {
      try { unlinkSync(join(uploadDir, filename)); } catch { /* best effort cleanup */ }
      throw error;
    }
  }

  async authorizeDownload(filename: string, user: UserEntity): Promise<StoredFileEntity> {
    const file = await this.fileRepo.findOne({ where: { filename } });
    if (!file) throw new NotFoundException('File not found');

    const allowed = file.ownerUserId === user.id || file.patientId === user.id;
    if (!allowed) throw new ForbiddenException('You are not authorized to access this file');

    if (file.kind === 'prescription' && user.role !== Role.PATIENT && user.id !== file.ownerUserId) {
      throw new ForbiddenException('You are not authorized to access this prescription file');
    }

    return file;
  }

  getPath(filename: string): string {
    if (!/^[a-zA-Z0-9._-]+$/.test(filename)) throw new BadRequestException('Invalid filename');
    const filePath = join(process.cwd(), 'uploads', filename);
    if (!existsSync(filePath)) throw new NotFoundException('File not found');
    return filePath;
  }
}
