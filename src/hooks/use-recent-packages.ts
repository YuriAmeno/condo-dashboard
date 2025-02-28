import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'
import { useUserType } from './queryUser'
import { getDaysPeriod } from '@/helpers/filterDashboard'

type Package = Database['public']['Tables']['packages']['Row'] & {
  apartment: Database['public']['Tables']['apartments']['Row'] & {
    building: Database['public']['Tables']['buildings']['Row']
  }
}

export function useRecentPackages(period: string, building?: any) {
  const userTypeQuery = useUserType()
  const limit = 10

  return useQuery({
    queryKey: ['recent-packages', period, building],
    queryFn: async () => {
      const userType = userTypeQuery.data

      const { start, end } = getDaysPeriod(period)

      let query = supabase
        .from('packages')
        .select(
          `
        *,
        apartment:apartments!inner(
          *,
          building:buildings!inner(
            *,
            manager:managers!inner(apartment_complex_id)
          )
        )
        `,
        )
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit)
        .eq("apartment.building.manager.apartment_complex_id", userType?.apartment_complex_id);


      if (building) {
        query = query.eq("apartment.building.id", building);
      }
    
      const { data: packages, error } = await query

      if (error) throw error
      return packages as Package[]
    },
    refetchInterval: 30 * 1000,
    enabled: !!userTypeQuery.data,
  })
}

export function useRecentPackagesList(limit = 10) {
  const userTypeQuery = useUserType()

  return useQuery({
    queryKey: ['recent-packages'],
    queryFn: async () => {
      const userType = await userTypeQuery.data
      if (!userType) return []

      const { data: packages, error } = await supabase
        .from('packages')
        .select(
          `
        *,
        apartment:apartments!inner(
          *,
          building:buildings(*)
        )
        `,
        )
        .eq('apartment.user_id', userType?.relatedId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return packages as Package[]
    },
    refetchInterval: 30 * 1000,
    enabled: !!userTypeQuery.data?.relatedId,
  })
}
