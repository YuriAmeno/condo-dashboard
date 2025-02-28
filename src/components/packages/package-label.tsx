import { forwardRef } from 'react'
import { Package } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/supabase'

type PackageData = Database['public']['Tables']['packages']['Row'] & {
  apartment: Database['public']['Tables']['apartments']['Row']
  building: Database['public']['Tables']['buildings']['Row']
}

interface PackageLabelProps {
  data: PackageData
  className?: string
}

export const PackageLabel = forwardRef<HTMLDivElement, PackageLabelProps>(
  ({ data, className = '' }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'w-full sm:w-[400px] p-4 rounded-lg border shadow-sm bg-background text-foreground',
          className,
        )}
      >
        {/* Cabeçalho: empilhado no mobile e em linha no desktop */}
        <div className="flex flex-col sm:flex-row items-center justify-center mb-4">
          <Package className="h-8 w-8 mr-2 text-primary" />
          <span className="text-xl font-bold text-primary">{data.building.name}</span>
        </div>

        {/* QR Code centralizado */}
        <div className="flex justify-center mb-4">
          <QRCodeSVG
            value={data.qr_code}
            size={200}
            bgColor="transparent"
            fgColor="currentColor"
            className="text-foreground"
          />
        </div>

        {/* Informações em layout de lista com espaçamento vertical */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-muted-foreground">Torre:</span>
            <span className="text-foreground">{data.building.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-muted-foreground">Apartamento:</span>
            <span className="text-foreground">{data.apartment.number}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-muted-foreground">Recebido em:</span>
            <span className="text-foreground">{new Date(data.received_at).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-muted-foreground">ID:</span>
            <span className="text-foreground">{data.id}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-muted-foreground">Código QR:</span>
            <span className="text-foreground">{data.qr_code}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-muted-foreground">Porteiro:</span>
            <span className="text-foreground">{data.doorman_name}</span>
          </div>
        </div>
      </div>
    )
  },
)

PackageLabel.displayName = 'PackageLabel'
