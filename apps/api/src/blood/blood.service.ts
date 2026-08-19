import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BloodDonorEntity } from '../database/entities/blood-donor.entity';
import { BloodRequestEntity } from '../database/entities/blood-request.entity';
import { CreateBloodRequestDto } from './dto/create-blood-request.dto';
import { SearchDonorsDto } from './dto/search-donors.dto';
import { BloodGroup, BloodRequestStatus, PaginatedResult } from '@medlink/shared';

const COMPATIBLE_DONORS: Record<BloodGroup, readonly BloodGroup[]> = {
  [BloodGroup.A_POS]: [BloodGroup.A_POS, BloodGroup.A_NEG, BloodGroup.O_POS, BloodGroup.O_NEG],
  [BloodGroup.A_NEG]: [BloodGroup.A_NEG, BloodGroup.O_NEG],
  [BloodGroup.B_POS]: [BloodGroup.B_POS, BloodGroup.B_NEG, BloodGroup.O_POS, BloodGroup.O_NEG],
  [BloodGroup.B_NEG]: [BloodGroup.B_NEG, BloodGroup.O_NEG],
  [BloodGroup.AB_POS]: Object.values(BloodGroup),
  [BloodGroup.AB_NEG]: [BloodGroup.A_NEG, BloodGroup.B_NEG, BloodGroup.AB_NEG, BloodGroup.O_NEG],
  [BloodGroup.O_POS]: [BloodGroup.O_POS, BloodGroup.O_NEG],
  [BloodGroup.O_NEG]: [BloodGroup.O_NEG],
};

@Injectable()
export class BloodService {
  constructor(
    @InjectRepository(BloodDonorEntity)
    private readonly donorRepo: Repository<BloodDonorEntity>,
    @InjectRepository(BloodRequestEntity)
    private readonly requestRepo: Repository<BloodRequestEntity>,
  ) {}

  async searchDonors(filters: SearchDonorsDto): Promise<PaginatedResult<BloodDonorEntity>> {
    const { bloodGroup, city, page = 1, limit = 10 } = filters;
    const qb = this.donorRepo.createQueryBuilder('d').leftJoinAndSelect('d.user', 'u').where('d.is_available = true');
    if (bloodGroup) qb.andWhere('d.blood_group = :bg', { bg: bloodGroup });
    if (city) qb.andWhere('LOWER(d.city) LIKE LOWER(:city)', { city: `%${city}%` });

    const total = await qb.getCount();
    const data = await qb.skip((page - 1) * limit).take(limit).getMany();
    const totalPages = Math.ceil(total / limit);
    return {
      data,
      meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    };
  }

  createRequest(patientId: string, dto: CreateBloodRequestDto): Promise<BloodRequestEntity> {
    return this.requestRepo.save({ patientId, ...dto, status: BloodRequestStatus.PENDING });
  }

  findPatientRequests(patientId: string): Promise<BloodRequestEntity[]> {
    return this.requestRepo.find({ where: { patientId }, order: { createdAt: 'DESC' } });
  }

  findPendingRequests(): Promise<BloodRequestEntity[]> {
    return this.requestRepo.find({ where: { status: BloodRequestStatus.PENDING }, relations: ['patient'] });
  }

  async fulfill(id: string, donorUserId: string): Promise<BloodRequestEntity> {
    return this.requestRepo.manager.transaction(async (manager) => {
      const donor = await manager.findOne(BloodDonorEntity, { where: { userId: donorUserId } });
      if (!donor) throw new NotFoundException('Donor profile not found');
      if (!donor.isAvailable) throw new ConflictException('Donor is not currently available');

      const request = await manager.findOne(BloodRequestEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!request) throw new NotFoundException(`Blood request ${id} not found`);
      if (request.status !== BloodRequestStatus.PENDING) {
        throw new ConflictException('Blood request is no longer pending');
      }

      const compatible = COMPATIBLE_DONORS[request.bloodGroup].includes(donor.bloodGroup);
      if (!compatible) {
        throw new ForbiddenException(`Donor blood group ${donor.bloodGroup} is not compatible with ${request.bloodGroup}`);
      }

      request.status = BloodRequestStatus.FULFILLED;
      request.donorId = donor.id;
      donor.totalDonations += 1;
      donor.lastDonatedAt = new Date();
      donor.isAvailable = false;

      await manager.save(donor);
      return manager.save(request);
    });
  }

  async cancel(id: string, patientId: string): Promise<BloodRequestEntity> {
    const result = await this.requestRepo.update(
      { id, patientId, status: BloodRequestStatus.PENDING },
      { status: BloodRequestStatus.CANCELLED },
    );
    if (!result.affected) {
      const request = await this.requestRepo.findOne({ where: { id } });
      if (!request) throw new NotFoundException(`Blood request ${id} not found`);
      if (request.patientId !== patientId) throw new ForbiddenException('You are not authorized to cancel this request');
      throw new ConflictException(`Blood request cannot be cancelled from status ${request.status}`);
    }
    return this.requestRepo.findOneOrFail({ where: { id } });
  }

  async getDonorDashboard(userId: string) {
    const donor = await this.donorRepo.findOne({ where: { userId } });
    if (!donor) throw new NotFoundException('Donor profile not found');
    const pendingRequests = await this.findPendingRequests();
    return {
      bloodGroup: donor.bloodGroup,
      isAvailable: donor.isAvailable,
      totalDonations: donor.totalDonations,
      livesSaved: donor.totalDonations * 3,
      lastDonatedAt: donor.lastDonatedAt,
      pendingRequests: pendingRequests.filter((r) => COMPATIBLE_DONORS[r.bloodGroup].includes(donor.bloodGroup)),
    };
  }

  async toggleAvailability(userId: string): Promise<BloodDonorEntity> {
    const donor = await this.donorRepo.findOne({ where: { userId } });
    if (!donor) throw new NotFoundException('Donor profile not found');
    donor.isAvailable = !donor.isAvailable;
    return this.donorRepo.save(donor);
  }
}
