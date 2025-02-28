import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePackageByQR } from '@/hooks/use-package-by-qr'
import { useQRCodeScanner } from '@/hooks/use-qr-code-scanner'
import { useToast } from '@/hooks/use-toast'
import { Separator } from '@radix-ui/react-separator'
import { AlertCircle, Camera, QrCode, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useLayout } from '../core/useLayout'

interface ScanPackages {
  packagesPending: any
  //   handleVerifyPack: (dta: any) => void
}
export const ScanPackages = () => {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const { data: package_ } = usePackageByQR(qrCode)
  const { toast } = useToast()
  const { setVerifiedPack, packs, showSelect } = useLayout()
  const playSuccessSound = () => {
    const audio = new Audio('/sounds/beep.mp3')
    audio.play().catch(() => {})
  }

  useEffect(() => {
    toggleScanner
  }, [showSelect])

  useEffect(() => {
    if (package_) {
      const hasIdWithPending = packs.some((val: any) => val.id == package_.id)
      if (hasIdWithPending) {
        const newPack = package_.id
        return setVerifiedPack((prevPacks: any) => [...prevPacks, newPack])
      }
      toast({
        variant: 'destructive',
        title: 'Erro ao scanear pacote',
        description: 'O pacote scaneado não faz parte da lista.',
      })
    }
  }, [package_])
  const handleScanResult = useCallback((result: string) => {
    setQrCode(result)
    playSuccessSound()
    if (navigator.vibrate) {
      navigator.vibrate(200)
    }
  }, [])

  const handleScanError = useCallback(
    (error: string) => {
      if (
        error.includes('NotFound') ||
        error.includes('No barcode') ||
        error.includes('MultiFormat')
      ) {
        return
      }
      toast({
        variant: 'destructive',
        title: 'Erro no Scanner',
        description: error,
      })
    },
    [toast],
  )

  const { isScanning, toggleScanner } = useQRCodeScanner({
    onResult: handleScanResult,
    onError: handleScanError,
  })
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <QrCode className="h-5 w-5 text-primary" />
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Scanner QR Code</h1>
      </div>

      <Alert className="text-sm">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Dica</AlertTitle>
        <AlertDescription className="text-xs sm:text-sm">
          Pressione Ctrl + Q para ligar/desligar o scanner de QR Code.
        </AlertDescription>
      </Alert>

      <div className="w-full">
        {/* Scanner Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Scanner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-muted rounded-lg overflow-hidden">
              <div id="qr-reader" className="w-full h-full"></div>
              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                  <div className="text-center">
                    <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-xs text-muted-foreground">Scanner desligado</p>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={() => toggleScanner('qr-reader')}
              className="w-full min-h-touch-target rounded-mobile mt-2"
              variant={isScanning ? 'destructive' : 'default'}
            >
              {isScanning ? (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Desligar Scanner
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Ligar Scanner
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
