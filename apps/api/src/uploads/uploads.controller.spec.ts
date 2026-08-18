import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadsController } from './uploads.controller';

describe('UploadsController', () => {
  it('requires authentication to serve uploaded files', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      UploadsController.prototype.serveFile,
    );

    expect(guards).toContain(JwtAuthGuard);
  });
});
