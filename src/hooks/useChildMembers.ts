import { useCallback, useEffect, useState } from 'react';
import type { ChildMember } from '../types';
import { supabase } from '../lib/supabase';

export function useChildMembers(childId: string | undefined) {
  const [members, setMembers] = useState<ChildMember[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!childId) {
      setMembers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('child_members')
      .select('*')
      .eq('child_id', childId)
      .order('created_at', { ascending: true });
    setMembers((data as ChildMember[]) || []);
    setLoading(false);
  }, [childId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addMember = async (email: string) => {
    if (!childId) return { error: new Error('Sem criança selecionada') };
    const normalized = email.trim().toLowerCase();
    if (!normalized) return { error: new Error('E-mail inválido') };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return { error: new Error('E-mail inválido') };
    }

    const { error } = await supabase.from('child_members').insert({
      child_id: childId,
      user_email: normalized,
      role: 'editor',
    });

    if (!error) await refresh();
    return { error };
  };

  const removeMember = async (email: string) => {
    if (!childId) return { error: new Error('Sem criança selecionada') };
    const { error } = await supabase
      .from('child_members')
      .delete()
      .eq('child_id', childId)
      .eq('user_email', email.toLowerCase());

    if (!error) await refresh();
    return { error };
  };

  return { members, loading, addMember, removeMember, refresh };
}
