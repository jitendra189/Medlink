import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Get,
  Param,
  Res,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserEntity } from '../database/entities/user.entity';
import { Role } from '@medlink/shared';
import { FileStorageService } from './file-storage.service';

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly fileStorage: FileStorageService) {}

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(@CurrentUser() user: UserEntity, @UploadedFile() file: Express.Multer.File) {
    return this.fileStorage.store(file, user.id, 'avatar').then((stored) => ({
      url: `/api/v1/uploads/files/${stored.filename}`,
      filename: stored.filename,
    }));
  }

  @Post('prescription')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.HOSPITAL)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadPrescription(
    @CurrentUser() user: UserEntity,
    @UploadedFile() file: Express.Multer.File,
    @Body('patientId') patientId: string,
  ) {
    return this.fileStorage.store(file, user.id, 'prescription', patientId).then((stored) => ({
      url: `/api/v1/uploads/files/${stored.filename}`,
      filename: stored.filename,
    }));
  }

  @Get('files/:filename')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async serveFile(@CurrentUser() user: UserEntity, @Param('filename') filename: string, @Res() res: Response) {
    const stored = await this.fileStorage.authorizeDownload(filename, user);
    return res.sendFile(this.fileStorage.getPath(stored.filename), {
      headers: { 'Content-Type': stored.mimeType, 'Content-Disposition': 'inline' },
    });
  }
}
