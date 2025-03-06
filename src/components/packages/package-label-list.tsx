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
          'w-full max-w-[350px] mx-auto p-3 xs:p-4 rounded-lg border shadow-sm',
          'bg-background text-foreground',
          className,
        )}
      >
        <div className="flex items-center justify-center mb-2 xs:mb-4">
          <Package className="h-6 w-6 xs:h-8 xs:w-8 mr-2 text-primary" />
          <span className="text-lg xs:text-xl font-bold text-primary">
            {data.apartment.building.name}
          </span>
        </div>

        <div className="flex justify-center mb-2 xs:mb-4">
          <QRCodeSVG
            value={data.qr_code}
            size={160}
            bgColor="transparent"
            fgColor="currentColor"
            className="text-foreground"
          />
        </div>

        <div className="space-y-2 text-xs xs:text-sm">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-muted-foreground">Torre:</span>
            <span className="text-foreground font-medium">{data.apartment.building.name}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="font-semibold text-muted-foreground">Apartamento:</span>
            <span className="text-foreground font-medium">{data.apartment.number}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="font-semibold text-muted-foreground">Recebido em:</span>
            <span className="text-foreground font-medium">
              {new Date(data.received_at).toLocaleDateString()}
            </span>
          </div>

          {data.delivered_at && (
            <div className="flex justify-between items-center">
              <span className="font-semibold text-muted-foreground">Entregue em:</span>
              <span className="text-foreground font-medium">
                {new Date(data.delivered_at).toLocaleDateString()}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="font-semibold text-muted-foreground">Porteiro:</span>
            <span className="text-foreground font-medium">{data.doorman_name || 'Síndico'}</span>
          </div>
        </div>
      </div>
    )
  },
)

PackageLabelList.displayName = 'PackageLabel'
