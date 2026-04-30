import { useCallback, useEffect, useState } from 'react';
import type { VaccineRecord, VaccineType, VaccineWithRecord, VaccineStatus } from '../types';
import { supabase } from '../lib/supabase';
import type { Child } from '../types';

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function calculateStatus(scheduledDate: Date, record: VaccineRecord | null): VaccineStatus {
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

export function useVaccines(child: Child | null) {
  const [vaccines, setVaccines] = useState<VaccineWithRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const buildVaccineCalendar = useCallback(
    async (childData: Child) => {
      setLoading(true);
      const birthDate = new Date(childData.birth_date);

      // Buscar todos os tipos de vacina (PNI + customizadas da criança)
      const { data: allTypes } = await supabase
        .from('vaccine_types')
        .select('*')
        .or(`is_custom.eq.false,and(is_custom.eq.true,custom_child_id.eq.${childData.id})`);

      // Buscar registros existentes da criança
      const { data: records } = await supabase
        .from('vaccine_records')
        .select('*')
        .eq('child_id', childData.id);

      const vaccineTypes: VaccineType[] = allTypes || [];
      const vaccineRecords: VaccineRecord[] = records || [];

      // Mapa: "nome_vacina-doseNumber" -> registro tomado (para vincular doses anteriores)
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

      // Processar cada tipo de vacina e calcular data prevista
      for (const vt of vaccineTypes) {
        const record =
          vaccineRecords.find((r) => r.vaccine_type_id === vt.id) || null;

        let calculatedDate: Date;

        if (vt.is_custom) {
          // Vacinas customizadas usam a data agendada do registro ou data de nascimento + idade recomendada
          if (record?.scheduled_date) {
            calculatedDate = new Date(record.scheduled_date);
          } else {
            calculatedDate = addMonths(birthDate, vt.recommended_age_months);
          }
        } else if (vt.dose_number === 1) {
          // Primeira dose: data de nascimento + idade recomendada em meses
          calculatedDate = addMonths(birthDate, vt.recommended_age_months);
        } else {
          // Doses subsequentes: procurar a dose anterior (mesmo nome, dose anterior)
          const prevKey = `${vt.name}-${vt.dose_number - 1}`;
          const prevTaken = takenMap.get(prevKey);

          if (prevTaken && prevTaken.administered_date) {
            // Se dose anterior foi tomada: data da dose anterior + intervalo mínimo
            const prevDate = new Date(prevTaken.administered_date);
            if (vt.min_interval_days) {
              calculatedDate = addDays(prevDate, vt.min_interval_days);
            } else {
              // Se não tem intervalo definido, usa idade recomendada
              calculatedDate = addMonths(birthDate, vt.recommended_age_months);
            }
          } else {
            // Dose anterior ainda não tomada: usar data recomendada pela idade
            calculatedDate = addMonths(birthDate, vt.recommended_age_months);

            // Se a dose anterior NÃO foi tomada e já está em atraso, não recalcular
            // A data permanece a recomendada até que a dose anterior seja registrada
          }
        }

        // Se já tem registro com data agendada específica, respeita
        if (record?.scheduled_date && record.status !== 'taken') {
          // Só sobrescreve se a data calculada for diferente E se for uma dose subsequente
          // Para primeira dose, mantemos a data calculada a menos que o registro tenha data diferente
          if (vt.dose_number > 1) {
            calculatedDate = new Date(record.scheduled_date);
          }
        }

        // Se a vacina já foi tomada, usa a data de administração
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

      // Ordenar por data calculada
      result.sort(
        (a, b) =>
          new Date(a.calculated_date).getTime() -
          new Date(b.calculated_date).getTime()
      );

      setVaccines(result);
      setLoading(false);
    },
    []
  );

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

    // Buscar o tipo de vacina para saber o nome e dose
    const { data: vtData } = await supabase
      .from('vaccine_types')
      .select('*')
      .eq('id', vaccineTypeId)
      .single();

    const vt = vtData as VaccineType | null;

    // Verificar se já existe registro
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
      // Se a vacina tem doses seguintes, atualizar as datas agendadas delas
      if (vt && vt.total_doses > 1 && vt.dose_number < vt.total_doses) {
        const nextDoseNumber = vt.dose_number + 1;

        // Buscar o tipo da próxima dose (mesmo nome, próxima dose)
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

          // Verificar se já existe registro para a próxima dose
          const { data: existingNext } = await supabase
            .from('vaccine_records')
            .select('*')
            .eq('child_id', child.id)
            .eq('vaccine_type_id', nextType.id)
            .maybeSingle();

          if (existingNext) {
            // Se a próxima dose ainda não foi tomada, atualiza a data agendada
            if (existingNext.status !== 'taken') {
              await supabase
                .from('vaccine_records')
                .update({ scheduled_date: nextDate })
                .eq('id', existingNext.id);
            }
          } else {
            // Criar registro pendente com a nova data
            await supabase.from('vaccine_records').insert({
              child_id: child.id,
              vaccine_type_id: nextType.id,
              scheduled_date: nextDate,
              status: 'pending',
            });
          }
        }
      }

      // Recarregar o calendário
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

    // Criar tipo de vacina customizada
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

    // Criar registro agendado
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

    // Deletar registros primeiro
    await supabase
      .from('vaccine_records')
      .delete()
      .eq('vaccine_type_id', vaccineTypeId);

    // Deletar tipo de vacina
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