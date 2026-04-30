export interface Child {
  id: string;
  family_id: string;
  name: string;
  birth_date: string;
  photo_url: string | null;
  parental_email: string | null;
  maternity: string | null;
  cpf: string | null;
  created_at: string;
}

export interface VaccineType {
  id: string;
  name: string;
  disease: string;
  dose_number: number;
  total_doses: number;
  recommended_age_months: number;
  min_interval_days: number | null;
  description: string;
  is_custom: boolean;
  custom_child_id: string | null;
}

export type VaccineStatus = 'pending' | 'taken' | 'late' | 'upcoming';

export interface VaccineRecord {
  id: string;
  child_id: string;
  vaccine_type_id: string;
  scheduled_date: string;
  administered_date: string | null;
  status: VaccineStatus;
  notes: string | null;
  vaccine_type?: VaccineType;
}

export interface VaccineWithRecord extends VaccineType {
  record: VaccineRecord | null;
  calculated_status: VaccineStatus;
  calculated_date: string;
}

export const STATUS_COLORS: Record<VaccineStatus, { bg: string; text: string; label: string; icon: string }> = {
  taken: { bg: 'bg-green-100', text: 'text-green-800', label: 'Tomada', icon: '✅' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente', icon: '⚠️' },
  late: { bg: 'bg-red-100', text: 'text-red-800', label: 'Atrasada', icon: '🔴' },
  upcoming: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Próxima', icon: '🔜' },
};