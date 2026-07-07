import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BloodDonorEntity } from '../database/entities/blood-donor.entity';
import { BloodRequestEntity } from '../database/entities/blood-request.entity';
import { CreateBloodRequestDto } from './dto/create-blood-request.dto';
import { SearchDonorsDto } from './dto/search-donors.dto';
import { BloodRequestStatus } from '@medlink/shared';

@Injectable()
export class BloodService {
  constructor(
    @InjectRepository(BloodDonorEntity)
    private readonly donorRepo: Repository<BloodDonorEntity>,
    @InjectRepository(BloodRequestEntity)
    private readonly requestRepo: Repository<BloodRequestEntity>,
  ) {}

  searchDonors(filters: SearchDonorsDto): Promise<BloodDonorEntity[]> {
    const qb = this.donorRepo.createQueryBuilder('d').leftJoinAndSelect('d.user', 'u').where('d.is_available = true');
    if (filters.bloodGroup) qb.andWhere('d.blood_group = :bg', { bg: filters.bloodGroup });
    if (filters.city) qb.andWhere('LOWER(d.city) = LOWER(:city)', { city: filters.city });
    return qb.getMany();
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
    const donor = await this.donorRepo.findOne({ where: { userId: donorUserId } });
    if (!donor) throw new NotFoundException('Donor profile not found');
    const request = await this.requestRepo.findOne({ where: { id } });
    if (!request) throw new NotFoundException(`Blood request ${id} not found`);
    request.status = BloodRequestStatus.FULFILLED;
    request.donorId = donor.id;
    donor.totalDonations += 1;
    donor.lastDonatedAt = new Date();
    await this.donorRepo.save(donor);
    return this.requestRepo.save(request);
  }

  async cancel(id: string): Promise<BloodRequestEntity> {
    const request = await this.requestRepo.findOne({ where: { id } });
    if (!request) throw new NotFoundException(`Blood request ${id} not found`);
    request.status = BloodRequestStatus.CANCELLED;
    return this.requestRepo.save(request);
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
      pendingRequests: pendingRequests.filter((r) => r.bloodGroup === donor.bloodGroup),
    };
  }

  async toggleAvailability(userId: string): Promise<BloodDonorEntity> {
    const donor = await this.donorRepo.findOne({ where: { userId } });
    if (!donor) throw new NotFoundException('Donor profile not found');
    donor.isAvailable = !donor.isAvailable;
    return this.donorRepo.save(donor);
  }
}
