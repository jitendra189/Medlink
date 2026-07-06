export interface IHospital {
  id: string;
  userId: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  icuBedsTotal: number;
  icuBedsAvailable: number;
  totalDoctors: number;
  ambulancesTotal: number;
  ambulancesAvailable: number;
  rating: number;
  photoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDoctor {
  id: string;
  hospitalId: string;
  name: string;
  speciality?: string;
  phone?: string;
  isAvailable: boolean;
}
