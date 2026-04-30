import { useEffect, useState } from 'react';
import type { Child } from '../types';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export function useChildren(user: User | null) {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setChildren([]);
      setLoading(false);
      return;
    }

    const fetchChildren = async () => {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data) {
        setChildren(data);
      }
      setLoading(false);
    };

    fetchChildren();
  }, [user]);

  const addChild = async (name: string, birthDate: string) => {
    if (!user) return { data: null, error: new Error('Não autenticado') };

    const { data, error } = await supabase
      .from('children')
      .insert({
        family_id: user.id,
        name,
        birth_date: birthDate,
      })
      .select()
      .single();

    if (!error && data) {
      setChildren((prev) => [...prev, data]);
    }

    return { data, error };
  };

  const removeChild = async (id: string) => {
    const { error } = await supabase
      .from('children')
      .delete()
      .eq('id', id);

    if (!error) {
      setChildren((prev) => prev.filter((c) => c.id !== id));
    }

    return { error };
  };

  return { children, loading, addChild, removeChild };
}