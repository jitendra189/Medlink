import 'dotenv/config';
import { AppDataSource } from '../data-source';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from '../entities/user.entity';
import { HospitalEntity } from '../entities/hospital.entity';
import { BloodDonorEntity } from '../entities/blood-donor.entity';
import { AmbulanceDriverEntity } from '../entities/ambulance-driver.entity';
import { DoctorEntity } from '../entities/doctor.entity';
import { EmergencyRequestEntity } from '../entities/emergency-request.entity';
import { BloodRequestEntity } from '../entities/blood-request.entity';
import { BookingEntity } from '../entities/booking.entity';
import {
  Role, BloodGroup, EmergencyType, EmergencyStatus,
  BloodRequestStatus, BloodRequestUrgency, BookingType, BookingStatus,
} from '@medlink/shared';

const BCRYPT_ROUNDS = 10;

async function seed() {
  await AppDataSource.initialize();
  console.log('✓ Connected to database');

  const userRepo      = AppDataSource.getRepository(UserEntity);
  const hospitalRepo  = AppDataSource.getRepository(HospitalEntity);
  const donorRepo     = AppDataSource.getRepository(BloodDonorEntity);
  const driverRepo    = AppDataSource.getRepository(AmbulanceDriverEntity);
  const doctorRepo    = AppDataSource.getRepository(DoctorEntity);
  const emergencyRepo = AppDataSource.getRepository(EmergencyRequestEntity);
  const bloodReqRepo  = AppDataSource.getRepository(BloodRequestEntity);
  const bookingRepo   = AppDataSource.getRepository(BookingEntity);

  const pw = await bcrypt.hash('Test@12345', BCRYPT_ROUNDS);

  async function upsertUser(data: Partial<UserEntity> & { email: string }): Promise<UserEntity> {
    const existing = await userRepo.findOne({ where: { email: data.email } });
    if (existing) return existing;
    return userRepo.save({ ...data, passwordHash: pw, isActive: true });
  }

  // ── Patients ────────────────────────────────────────────────────────────────
  const patients: UserEntity[] = [];
  for (const p of [
    { name: 'Amit Sharma',  email: 'amit@medlink.demo',  phone: '+919876543210', role: Role.PATIENT },
    { name: 'Priya Patel',  email: 'priya@medlink.demo', phone: '+919876543211', role: Role.PATIENT },
    { name: 'Ravi Kumar',   email: 'ravi@medlink.demo',  phone: '+919876543212', role: Role.PATIENT },
  ]) patients.push(await upsertUser(p));
  console.log(`✓ Seeded ${patients.length} patients`);

  // ── Hospitals ────────────────────────────────────────────────────────────────
  const hospitalSeedData = [
    { adminEmail: 'apollo_hospital@medlink.demo',  adminName: 'Apollo Mumbai Admin',    name: 'Apollo Hospital Mumbai',        city: 'Mumbai',    state: 'Maharashtra',  address: 'Sahar Road, Andheri East',         phone: '+912267676767', lat: 19.1136, lng: 72.8697, icuTotal: 50, icuAvail: 12, docs: 120, ambTotal: 10, ambAvail: 4,  rating: 4.8 },
    { adminEmail: 'aiims_delhi@medlink.demo',       adminName: 'AIIMS Delhi Admin',       name: 'AIIMS Delhi',                   city: 'Delhi',     state: 'Delhi',        address: 'Sri Aurobindo Marg, Ansari Nagar', phone: '+911126588500', lat: 28.5672, lng: 77.2100, icuTotal: 80, icuAvail: 5,  docs: 200, ambTotal: 15, ambAvail: 6,  rating: 4.9 },
    { adminEmail: 'manipal_hospital@medlink.demo',  adminName: 'Manipal Bangalore Admin', name: 'Manipal Hospital Bangalore',    city: 'Bangalore', state: 'Karnataka',    address: '98 HAL Airport Road, Kodihalli',   phone: '+918025024444', lat: 12.9716, lng: 77.5946, icuTotal: 60, icuAvail: 20, docs: 150, ambTotal: 8,  ambAvail: 3,  rating: 4.7 },
    { adminEmail: 'fortis_malar@medlink.demo',      adminName: 'Fortis Malar Admin',      name: 'Fortis Malar Hospital Chennai', city: 'Chennai',   state: 'Tamil Nadu',   address: '52 1st Main Road, Gandhi Nagar',   phone: '+914443592222', lat: 13.0827, lng: 80.2707, icuTotal: 40, icuAvail: 8,  docs: 90,  ambTotal: 6,  ambAvail: 2,  rating: 4.6 },
    { adminEmail: 'yashoda@medlink.demo',           adminName: 'Yashoda Hyderabad Admin', name: 'Yashoda Hospitals Hyderabad',   city: 'Hyderabad', state: 'Telangana',    address: 'Raj Bhavan Road, Somajiguda',      phone: '+914066760000', lat: 17.3850, lng: 78.4867, icuTotal: 45, icuAvail: 15, docs: 100, ambTotal: 7,  ambAvail: 4,  rating: 4.5 },
  ];

  const hospitals: HospitalEntity[] = [];
  for (const h of hospitalSeedData) {
    const admin = await upsertUser({ name: h.adminName, email: h.adminEmail, role: Role.HOSPITAL });
    let hospital = await hospitalRepo.findOne({ where: { userId: admin.id } });
    if (!hospital) {
      hospital = await hospitalRepo.save({
        userId: admin.id, name: h.name, city: h.city, state: h.state,
        address: h.address, phone: h.phone, latitude: h.lat, longitude: h.lng,
        icuBedsTotal: h.icuTotal, icuBedsAvailable: h.icuAvail,
        totalDoctors: h.docs, ambulancesTotal: h.ambTotal,
        ambulancesAvailable: h.ambAvail, rating: h.rating,
      });
    }
    hospitals.push(hospital);
  }
  console.log(`✓ Seeded ${hospitals.length} hospitals`);

  // ── Doctors ──────────────────────────────────────────────────────────────────
  const doctorSeedData = [
    { hi: 0, name: 'Dr. Suresh Mehta',      speciality: 'Cardiology',         phone: '+919900001111' },
    { hi: 0, name: 'Dr. Anjali Singh',      speciality: 'Neurology',           phone: '+919900001112' },
    { hi: 0, name: 'Dr. Vikram Rao',        speciality: 'Orthopedics',         phone: '+919900001113' },
    { hi: 1, name: 'Dr. Kavitha Reddy',     speciality: 'Oncology',            phone: '+919900002111' },
    { hi: 1, name: 'Dr. Arjun Nair',        speciality: 'Emergency Medicine',  phone: '+919900002112' },
    { hi: 2, name: 'Dr. Pooja Iyer',        speciality: 'Pediatrics',          phone: '+919900003111' },
    { hi: 2, name: 'Dr. Raj Malhotra',      speciality: 'General Surgery',     phone: '+919900003112' },
    { hi: 3, name: 'Dr. Meena Krishnan',    speciality: 'Obstetrics',          phone: '+919900004111' },
    { hi: 4, name: 'Dr. Sanjay Gupta',      speciality: 'Pulmonology',         phone: '+919900005111' },
    { hi: 4, name: 'Dr. Divya Choudhary',   speciality: 'Dermatology',         phone: '+919900005112' },
  ];
  const doctors: DoctorEntity[] = [];
  for (const d of doctorSeedData) {
    let doc = await doctorRepo.findOne({ where: { name: d.name, hospitalId: hospitals[d.hi].id } });
    if (!doc) doc = await doctorRepo.save({ hospitalId: hospitals[d.hi].id, name: d.name, speciality: d.speciality, phone: d.phone, isAvailable: true });
    doctors.push(doc);
  }
  console.log(`✓ Seeded ${doctors.length} doctors`);

  // ── Blood Donors ─────────────────────────────────────────────────────────────
  const donorSeedData = [
    { name: 'Kiran Desai',    email: 'kiran@medlink.demo',   bloodGroup: BloodGroup.O_POS,  city: 'Mumbai',    lat: 19.0760, lng: 72.8777, donations: 5 },
    { name: 'Neha Joshi',     email: 'neha@medlink.demo',    bloodGroup: BloodGroup.A_POS,  city: 'Delhi',     lat: 28.7041, lng: 77.1025, donations: 3 },
    { name: 'Rahul Verma',    email: 'rahul@medlink.demo',   bloodGroup: BloodGroup.B_POS,  city: 'Bangalore', lat: 12.9141, lng: 74.8560, donations: 7 },
    { name: 'Sneha Pillai',   email: 'sneha@medlink.demo',   bloodGroup: BloodGroup.AB_POS, city: 'Chennai',   lat: 13.0827, lng: 80.2707, donations: 2 },
    { name: 'Mohan Das',      email: 'mohan@medlink.demo',   bloodGroup: BloodGroup.O_NEG,  city: 'Hyderabad', lat: 17.3850, lng: 78.4867, donations: 4 },
    { name: 'Lakshmi Nair',   email: 'lakshmi@medlink.demo', bloodGroup: BloodGroup.A_NEG,  city: 'Mumbai',    lat: 19.2183, lng: 72.9781, donations: 1 },
  ];
  const bloodDonors: BloodDonorEntity[] = [];
  for (const d of donorSeedData) {
    const user = await upsertUser({ name: d.name, email: d.email, role: Role.DONOR });
    let donor = await donorRepo.findOne({ where: { userId: user.id } });
    if (!donor) donor = await donorRepo.save({ userId: user.id, bloodGroup: d.bloodGroup, city: d.city, latitude: d.lat, longitude: d.lng, isAvailable: true, totalDonations: d.donations });
    bloodDonors.push(donor);
  }
  console.log(`✓ Seeded ${bloodDonors.length} blood donors`);

  // ── Ambulance Drivers ────────────────────────────────────────────────────────
  const driverSeedData = [
    { name: 'Rajesh Kumar',  email: 'driver1@medlink.demo', vehicle: 'MH01AB1234', hi: 0, duty: true,  lat: 19.1100, lng: 72.8700 },
    { name: 'Sunil Yadav',   email: 'driver2@medlink.demo', vehicle: 'DL01CD5678', hi: 1, duty: false, lat: 28.5700, lng: 77.2100 },
    { name: 'Deepak Mishra', email: 'driver3@medlink.demo', vehicle: 'KA01EF9012', hi: 2, duty: true,  lat: 12.9700, lng: 77.5900 },
    { name: 'Arun Singh',    email: 'driver4@medlink.demo', vehicle: 'TN01GH3456', hi: 3, duty: false, lat: 13.0800, lng: 80.2700 },
  ];
  for (const d of driverSeedData) {
    const user = await upsertUser({ name: d.name, email: d.email, role: Role.DRIVER });
    const exists = await driverRepo.findOne({ where: { userId: user.id } });
    if (!exists) await driverRepo.save({ userId: user.id, hospitalId: hospitals[d.hi].id, vehicleNumber: d.vehicle, isOnDuty: d.duty, latitude: d.lat, longitude: d.lng });
  }
  console.log('✓ Seeded 4 ambulance drivers');

  // ── Sample Emergency Requests ─────────────────────────────────────────────────
  const existingEmergency = await emergencyRepo.findOne({ where: { patientId: patients[0].id } });
  if (!existingEmergency) {
    await emergencyRepo.save([
      { patientId: patients[0].id, hospitalId: hospitals[0].id, type: EmergencyType.ICU,       status: EmergencyStatus.ACCEPTED, patientLat: 19.0760, patientLng: 72.8777, description: 'Chest pain, needs ICU immediately' },
      { patientId: patients[1].id,                               type: EmergencyType.AMBULANCE, status: EmergencyStatus.PENDING,  patientLat: 28.7041, patientLng: 77.1025, description: 'Road accident on NH-48' },
    ]);
    console.log('✓ Seeded 2 emergency requests');
  }

  // ── Sample Blood Requests ─────────────────────────────────────────────────────
  const existingBloodReq = await bloodReqRepo.findOne({ where: { patientId: patients[0].id } });
  if (!existingBloodReq) {
    await bloodReqRepo.save([
      { patientId: patients[0].id,                              bloodGroup: BloodGroup.O_POS, status: BloodRequestStatus.PENDING,   unitsRequired: 2, urgency: BloodRequestUrgency.CRITICAL },
      { patientId: patients[1].id, donorId: bloodDonors[0].id, bloodGroup: BloodGroup.A_POS, status: BloodRequestStatus.FULFILLED, unitsRequired: 1, urgency: BloodRequestUrgency.MEDIUM  },
    ]);
    console.log('✓ Seeded 2 blood requests');
  }

  // ── Sample Bookings ───────────────────────────────────────────────────────────
  const existingBooking = await bookingRepo.findOne({ where: { patientId: patients[0].id } });
  if (!existingBooking) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await bookingRepo.save([
      { patientId: patients[0].id, doctorId: doctors[0].id, hospitalId: hospitals[0].id, type: BookingType.DOCTOR, status: BookingStatus.CONFIRMED, scheduledAt: tomorrow, notes: 'Follow-up appointment for chest pain' },
      { patientId: patients[1].id, doctorId: doctors[1].id, hospitalId: hospitals[0].id, type: BookingType.DOCTOR, status: BookingStatus.PENDING,   scheduledAt: tomorrow },
    ]);
    console.log('✓ Seeded 2 bookings');
  }

  await AppDataSource.destroy();

  console.log('\n✅ Seed complete!');
  console.log('\nDemo accounts (password: Test@12345):');
  console.log('  Patient:          amit@medlink.demo');
  console.log('  Hospital Admin:   apollo_hospital@medlink.demo');
  console.log('  Blood Donor:      kiran@medlink.demo');
  console.log('  Ambulance Driver: driver1@medlink.demo');
}

seed().catch((e) => { console.error('Seed failed:', e); process.exit(1); });
