import { Outlet, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { fetchMedicoMe, portalMedicoKeys } from '@/services/portalMedico'

export default function PortalMedicoWrapper() {
  const { isLoading, isError } = useQuery({
    queryKey: portalMedicoKeys.me,
    queryFn: fetchMedicoMe,
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    )
  }

  if (isError) return <Navigate to="/acesso-negado" replace />

  return <Outlet />
}
