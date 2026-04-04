import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { categoryConfig } from '@/lib/categories';
import type { CategoryConfig } from '@/types';

export interface MergedCategory {
  slug: string;
  config: CategoryConfig;
  isCustom: boolean;
}

export function useCustomCategories() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['custom_categories', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_categories')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useAddCustomCategory() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (cat: { slug: string; label: string; icon: string; color: string }) => {
      const { error } = await supabase
        .from('custom_categories')
        .insert([{ ...cat, user_id: user!.id } as any]);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['custom_categories'] }),
  });
}

export function useDeleteCustomCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('custom_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['custom_categories'] }),
  });
}

/** Returns all categories (default + custom) as a merged map */
export function useAllCategories(): {
  allCategories: Record<string, CategoryConfig>;
  mergedList: MergedCategory[];
  isLoading: boolean;
} {
  const { data: custom = [], isLoading } = useCustomCategories();

  return useMemo(() => {
    const allCategories: Record<string, CategoryConfig> = { ...categoryConfig };
    const mergedList: MergedCategory[] = Object.entries(categoryConfig).map(([slug, config]) => ({
      slug,
      config,
      isCustom: false,
    }));

    for (const c of custom) {
      const cfg: CategoryConfig = { icon: c.icon, color: c.color, label: c.label };
      allCategories[c.slug] = cfg;
      mergedList.push({ slug: c.slug, config: cfg, isCustom: true });
    }

    return { allCategories, mergedList, isLoading };
  }, [custom, isLoading]);
}
