import { forwardRef } from 'react'
import { Package } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/supabase'

type PackageData = Database['public']['Tables']['packages']['Row'] & {
  apartment: Database['public']['Tables']['apartments']['Row'] & {
    building: Database['public']['Tables']['buildings']['Row']
  }
}

interface PackageList {
  data: PackageData
  className?: string
}

export const PackageLabelList = forwardRef<HTMLDivElement, PackageList>(
  ({ data, className = '' }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'w-[400px] p-4 rounded-lg border shadow-sm',
          'bg-background text-foreground',
          className,
        )}
      >
        <div className="flex items-center justify-center mb-4">
          <Package className="h-8 w-8 mr-2 text-primary" />
          <span className="text-xl font-bold text-primary">{data.apartment.building.name}</span>
        </div>

        <div className="flex justify-center mb-4">
          <QRCodeSVG
            value={data.qr_code}
            size={200}
            bgColor="transparent"
            fgColor="currentColor"
            className="text-foreground"
          />
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-muted-foreground">Torre:</span>
            <span className="text-foreground">{data.apartment.building.name}</span>
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
            <span className="font-semibold text-muted-foreground">Entregue em:</span>
            <span className="text-foreground">
              {data.delivered_at == '' ? new Date(data.delivered_at).toLocaleString() : ''}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="font-semibold text-muted-foreground">Porteiro:</span>
            <span className="text-foreground">
              {data.doorman_name == '' ? 'Síndico' : data.doorman_name}
            </span>
          </div>
        </div>
      </div>
    )
  },
)

PackageLabelList.displayName = 'PackageLabel'
