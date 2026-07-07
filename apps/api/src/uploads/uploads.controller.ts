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
import { existsSync } from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    return { url: `/api/v1/uploads/files/${file.filename}`, filename: file.filename };
  }

  @Post('prescription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadPrescription(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    return { url: `/api/v1/uploads/files/${file.filename}`, filename: file.filename };
  }

  @Get('files/:filename')
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', filename);
    if (!existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    return res.sendFile(filePath);
  }
}
