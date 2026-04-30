import { useEffect, useState } from 'react';
import type { Child, VaccineRecord, VaccineType } from '../types';
import { supabase } from '../lib/supabase';
import { buildVaccineList, computeStats, type VaccineStats } from '../lib/vaccineCalendar';

export function useChildrenStats(children: Child[]) {
  const [statsByChild, setStatsByChild] = useState<Record<string, VaccineStats>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (children.length === 0) {
      setStatsByChild({});
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);

      const childIds = children.map((c) => c.id);

      const { data: typesData } = await supabase
        .from('vaccine_types')
        .select('*')
        .or(
          `is_custom.eq.false,and(is_custom.eq.true,custom_child_id.in.(${childIds.join(',')}))`
        );

      const { data: recordsData } = await supabase
        .from('vaccine_records')
        .select('*')
        .in('child_id', childIds);

      const allTypes: VaccineType[] = typesData || [];
      const allRecords: VaccineRecord[] = recordsData || [];

      const result: Record<string, VaccineStats> = {};

      for (const child of children) {
        const childTypes = allTypes.filter(
          (t) => !t.is_custom || t.custom_child_id === child.id
        );
        const childRecords = allRecords.filter((r) => r.child_id === child.id);
        const list = buildVaccineList(child, childTypes, childRecords);
        result[child.id] = computeStats(list);
      }

      if (!cancelled) {
        setStatsByChild(result);
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [children]);

  return { statsByChild, loading };
}
