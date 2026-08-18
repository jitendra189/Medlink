import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
  Get,
  Param,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

function hasValidSignature(file: Express.Multer.File): boolean {
  if (!file.buffer || file.buffer.length < 4) return false;

  const bytes = file.buffer;
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47;
  const isGif =
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    (bytes[3] === 0x38 || bytes[3] === 0x37);
  const isPdf =
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46;

  return isJpeg || isPng || isGif || isPdf;
}

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  private persistValidatedFile(file: Express.Multer.File): string {
    if (!file || !file.buffer) throw new BadRequestException('No file provided');
    if (!hasValidSignature(file)) {
      throw new BadRequestException('File content does not match an allowed file type');
    }

    const extension = file.mimetype === 'application/pdf'
      ? '.pdf'
      : file.mimetype === 'image/png'
        ? '.png'
        : file.mimetype === 'image/gif'
          ? '.gif'
          : '.jpg';
    const filename = `${randomUUID()}${extension}`;
    const uploadDir = join(process.cwd(), 'uploads');
    mkdirSync(uploadDir, { recursive: true });
    writeFileSync(join(uploadDir, filename), file.buffer, { flag: 'wx' });
    return filename;
  }

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    const filename = this.persistValidatedFile(file);
    return { url: `/api/v1/uploads/files/${filename}`, filename };
  }

  @Post('prescription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadPrescription(@UploadedFile() file: Express.Multer.File) {
    const filename = this.persistValidatedFile(file);
    return { url: `/api/v1/uploads/files/${filename}`, filename };
  }

  @Get('files/:filename')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
      return res.status(400).json({ message: 'Invalid filename' });
    }
    const filePath = join(process.cwd(), 'uploads', filename);
    if (!existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    return res.sendFile(filePath);
  }
}
