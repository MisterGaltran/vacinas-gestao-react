import { useCallback, useEffect, useState } from 'react';
import type { VaccineRecord, VaccineType, VaccineWithRecord } from '../types';
import { supabase } from '../lib/supabase';
import type { Child } from '../types';
import { addDays, buildVaccineList } from '../lib/vaccineCalendar';

export function useVaccines(child: Child | null) {
  const [vaccines, setVaccines] = useState<VaccineWithRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const buildVaccineCalendar = useCallback(async (childData: Child) => {
    setLoading(true);

    const { data: allTypes } = await supabase
      .from('vaccine_types')
      .select('*')
      .or(`is_custom.eq.false,and(is_custom.eq.true,custom_child_id.eq.${childData.id})`);

    const { data: records } = await supabase
      .from('vaccine_records')
      .select('*')
      .eq('child_id', childData.id);

    const vaccineTypes: VaccineType[] = allTypes || [];
    const vaccineRecords: VaccineRecord[] = records || [];

    setVaccines(buildVaccineList(childData, vaccineTypes, vaccineRecords));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (child) {
      buildVaccineCalendar(child);
    } else {
      setVaccines([]);
      setLoading(false);
    }
  }, [child, buildVaccineCalendar]);

  const markAsTaken = async (
    vaccineTypeId: string,
    administeredDate: string,
    notes?: string
  ) => {
    if (!child) return { error: new Error('Nenhuma criança selecionada') };

    const { data: vtData } = await supabase
      .from('vaccine_types')
      .select('*')
      .eq('id', vaccineTypeId)
      .single();

    const vt = vtData as VaccineType | null;

    const { data: existing } = await supabase
      .from('vaccine_records')
      .select('*')
      .eq('child_id', child.id)
      .eq('vaccine_type_id', vaccineTypeId)
      .maybeSingle();

    let error;
    if (existing) {
      const { error: updateError } = await supabase
        .from('vaccine_records')
        .update({
          administered_date: administeredDate,
          status: 'taken',
          notes: notes || existing.notes,
        })
        .eq('id', existing.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('vaccine_records')
        .insert({
          child_id: child.id,
          vaccine_type_id: vaccineTypeId,
          scheduled_date: administeredDate,
          administered_date: administeredDate,
          status: 'taken',
          notes: notes || null,
        });
      error = insertError;
    }

    if (!error) {
      if (vt && vt.total_doses > 1 && vt.dose_number < vt.total_doses) {
        const nextDoseNumber = vt.dose_number + 1;

        const { data: nextTypeData } = await supabase
          .from('vaccine_types')
          .select('*')
          .eq('name', vt.name)
          .eq('dose_number', nextDoseNumber)
          .eq('is_custom', vt.is_custom)
          .maybeSingle();

        const nextType = nextTypeData as VaccineType | null;

        if (nextType) {
          const nextDate = vt.min_interval_days
            ? addDays(new Date(administeredDate), vt.min_interval_days)
                .toISOString()
                .split('T')[0]
            : administeredDate;

          const { data: existingNext } = await supabase
            .from('vaccine_records')
            .select('*')
            .eq('child_id', child.id)
            .eq('vaccine_type_id', nextType.id)
            .maybeSingle();

          if (existingNext) {
            if (existingNext.status !== 'taken') {
              await supabase
                .from('vaccine_records')
                .update({ scheduled_date: nextDate })
                .eq('id', existingNext.id);
            }
          } else {
            await supabase.from('vaccine_records').insert({
              child_id: child.id,
              vaccine_type_id: nextType.id,
              scheduled_date: nextDate,
              status: 'pending',
            });
          }
        }
      }

      await buildVaccineCalendar(child);
    }

    return { error };
  };

  const unmarkVaccine = async (recordId: string) => {
    if (!child) return { error: new Error('Nenhuma criança selecionada') };

    const { error } = await supabase
      .from('vaccine_records')
      .update({
        administered_date: null,
        status: 'pending',
      })
      .eq('id', recordId);

    if (!error && child) {
      await buildVaccineCalendar(child);
    }

    return { error };
  };

  const addCustomVaccine = async (
    name: string,
    disease: string,
    recommendedAgeMonths: number,
    scheduledDate: string,
    notes?: string
  ) => {
    if (!child) return { data: null, error: new Error('Nenhuma criança selecionada') };

    const { data: vtData, error: vtError } = await supabase
      .from('vaccine_types')
      .insert({
        name,
        disease,
        dose_number: 1,
        total_doses: 1,
        recommended_age_months: recommendedAgeMonths,
        min_interval_days: null,
        description: notes || '',
        is_custom: true,
        custom_child_id: child.id,
      })
      .select()
      .single();

    if (vtError) return { data: null, error: vtError };

    const newType = vtData as VaccineType;

    const { error: recError } = await supabase
      .from('vaccine_records')
      .insert({
        child_id: child.id,
        vaccine_type_id: newType.id,
        scheduled_date: scheduledDate,
        status: 'pending',
      });

    if (!recError) {
      await buildVaccineCalendar(child);
    }

    return { data: newType, error: recError };
  };

  const deleteCustomVaccine = async (vaccineTypeId: string) => {
    if (!child) return { error: new Error('Nenhuma criança selecionada') };

    await supabase
      .from('vaccine_records')
      .delete()
      .eq('vaccine_type_id', vaccineTypeId);

    const { error } = await supabase
      .from('vaccine_types')
      .delete()
      .eq('id', vaccineTypeId);

    if (!error && child) {
      await buildVaccineCalendar(child);
    }

    return { error };
  };

  return {
    vaccines,
    loading,
    markAsTaken,
    unmarkVaccine,
    addCustomVaccine,
    deleteCustomVaccine,
    refresh: () => child && buildVaccineCalendar(child),
  };
}
