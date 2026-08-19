import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FileStorageService } from './file-storage.service';
import { StoredFileEntity } from '../database/entities/stored-file.entity';
import { Role } from '@medlink/shared';

function file(mimetype: string, bytes: number[]): Express.Multer.File {
  return { mimetype, buffer: Buffer.from(bytes) } as Express.Multer.File;
}

describe('FileStorageService', () => {
  let service: FileStorageService;
  let repo: any;

  beforeEach(async () => {
    repo = { save: jest.fn().mockResolvedValue({ filename: 'stored.jpg', ownerUserId: 'user-a', patientId: null, kind: 'avatar', mimeType: 'image/jpeg' }) };
    const module = await Test.createTestingModule({
      providers: [
        FileStorageService,
        { provide: getRepositoryToken(StoredFileEntity), useValue: repo },
      ],
    }).compile();
    service = module.get(FileStorageService);
  });

  it('rejects spoofed image content', async () => {
    await expect(service.store(file('image/jpeg', [0x25, 0x50, 0x44, 0x46]), 'user-a', 'avatar'))
      .rejects.toThrow('does not match');
  });

  it('rejects MIME/content mismatch', async () => {
    await expect(service.store(file('image/png', [0xff, 0xd8, 0xff, 0x00]), 'user-a', 'avatar'))
      .rejects.toThrow('does not match');
  });

  it('authorizes a file for its owner', async () => {
    repo.findOne = jest.fn().mockResolvedValue({ filename: 'stored.jpg', ownerUserId: 'user-a', patientId: null, kind: 'avatar', mimeType: 'image/jpeg' });
    const result = await service.authorizeDownload('stored.jpg', { id: 'user-a', role: Role.PATIENT } as any);
    expect(result.filename).toBe('stored.jpg');
  });

  it('denies an unrelated user from accessing a file', async () => {
    repo.findOne = jest.fn().mockResolvedValue({ filename: 'stored.jpg', ownerUserId: 'user-a', patientId: null, kind: 'avatar', mimeType: 'image/jpeg' });
    await expect(service.authorizeDownload('stored.jpg', { id: 'user-b', role: Role.PATIENT } as any))
      .rejects.toThrow('not authorized');
  });
});
