import type { Child, VaccineRecord, VaccineStatus, VaccineType, VaccineWithRecord } from '../types';

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function calculateStatus(scheduledDate: Date, record: VaccineRecord | null): VaccineStatus {
  if (record?.status === 'taken') return 'taken';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const scheduled = new Date(scheduledDate);
  scheduled.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((scheduled.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'late';
  if (diffDays <= 30) return 'upcoming';
  return 'pending';
}

export function buildVaccineList(
  child: Child,
  vaccineTypes: VaccineType[],
  vaccineRecords: VaccineRecord[]
): VaccineWithRecord[] {
  const birthDate = new Date(child.birth_date);

  const takenMap = new Map<string, VaccineRecord>();
  for (const r of vaccineRecords) {
    if (r.status === 'taken' && r.administered_date) {
      const vt = vaccineTypes.find((t) => t.id === r.vaccine_type_id);
      if (vt) {
        takenMap.set(`${vt.name}-${vt.dose_number}`, r);
      }
    }
  }

  const result: VaccineWithRecord[] = [];

  for (const vt of vaccineTypes) {
    const record = vaccineRecords.find((r) => r.vaccine_type_id === vt.id) || null;

    let calculatedDate: Date;

    if (vt.is_custom) {
      calculatedDate = record?.scheduled_date
        ? new Date(record.scheduled_date)
        : addMonths(birthDate, vt.recommended_age_months);
    } else if (vt.dose_number === 1) {
      calculatedDate = addMonths(birthDate, vt.recommended_age_months);
    } else {
      const prevTaken = takenMap.get(`${vt.name}-${vt.dose_number - 1}`);

      if (prevTaken && prevTaken.administered_date) {
        const prevDate = new Date(prevTaken.administered_date);
        calculatedDate = vt.min_interval_days
          ? addDays(prevDate, vt.min_interval_days)
          : addMonths(birthDate, vt.recommended_age_months);
      } else {
        calculatedDate = addMonths(birthDate, vt.recommended_age_months);
      }
    }

    if (record?.scheduled_date && record.status !== 'taken' && vt.dose_number > 1) {
      calculatedDate = new Date(record.scheduled_date);
    }

    if (record?.status === 'taken' && record.administered_date) {
      calculatedDate = new Date(record.administered_date);
    }

    const status = calculateStatus(calculatedDate, record);

    result.push({
      ...vt,
      record,
      calculated_status: status,
      calculated_date: calculatedDate.toISOString().split('T')[0],
    });
  }

  result.sort(
    (a, b) =>
      new Date(a.calculated_date).getTime() - new Date(b.calculated_date).getTime()
  );

  return result;
}

export interface VaccineStats {
  total: number;
  taken: number;
  late: number;
  upcoming: number;
  pending: number;
}

export function computeStats(vaccines: VaccineWithRecord[]): VaccineStats {
  const stats: VaccineStats = { total: vaccines.length, taken: 0, late: 0, upcoming: 0, pending: 0 };
  for (const v of vaccines) {
    stats[v.calculated_status]++;
  }
  return stats;
}
