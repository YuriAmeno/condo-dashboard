import { useState, useEffect, useCallback, useRef } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Camera,
  QrCode,
  Package,
  Loader2,
  X,
  Clock,
  Building2,
  User,
  CalendarClock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { useQRCodeScanner } from '@/hooks/use-qr-code-scanner'
import { usePackageByQR } from '@/hooks/use-package-by-qr'
import { usePackageDelivery } from '@/hooks/use-package-delivery'
import { useRecentDeliveries } from '@/hooks/use-recent-deliveries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { packageConfirm } from '../core/_requests'
import SignatureCanvas from 'react-signature-canvas'
import { useTheme } from '@/components/theme-provider'

export function PackageScan() {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [manualCode, setManualCode] = useState('')
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const { toast } = useToast()

  const { theme } = useTheme()

  const { data: package_, isLoading: isLoadingPackage } = usePackageByQR(qrCode)
  const { data: recentDeliveries } = useRecentDeliveries()
  const deliveryMutation = usePackageDelivery()
  const [signature, setSignature] = useState<string | undefined>()

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

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualCode) {
      setQrCode(manualCode)
      setManualCode('')
    }
  }

  const handleDeliveryConfirm = async () => {
    if (!package_) return

    try {
      await deliveryMutation.mutateAsync({
        packageId: package_.id,
        notes: deliveryNotes,
      })

      const dataSendWebHook = {
        delivery_company: package_.delivery_company,
        store_name: package_.store_name,
        resident_id: String(package_.resident_id),
        package_id: String(package_.id),
      }

      await packageConfirm(dataSendWebHook)
      toast({
        title: 'Encomenda entregue com sucesso!',
        description: 'A baixa foi registrada no sistema.',
      })

      setShowDeliveryDialog(false)
      setDeliveryNotes('')
      setQrCode(null)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao registrar entrega',
        description: 'Tente novamente em alguns instantes.',
      })
    }
  }

  const playSuccessSound = () => {
    const audio = new Audio('/sounds/beep.mp3')
    audio.play().catch(() => {
      // Ignore audio play errors
    })
  }

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'KeyQ' && e.ctrlKey) {
        toggleScanner('qr-reader')
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [toggleScanner])

  const sigCanvas = useRef<SignatureCanvas | null>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  const handleCleanSignature = () => {
    sigCanvas.current?.clear()
    setSignature('')
    setIsEmpty(true)
  }

  const handleSaveSignature = () => {
    if (!sigCanvas.current?.isEmpty) {
      const dataSignature = sigCanvas?.current?.getTrimmedCanvas().toDataURL('image/png')
      setSignature(String(dataSignature))
      setIsEmpty(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-2">
        <QrCode className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Scanner QR Code</h1>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Dica</AlertTitle>
        <AlertDescription>
          Pressione Ctrl + Q para ligar/desligar o scanner de QR Code.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Scanner Card */}
        <Card>
          <CardHeader>
            <CardTitle>Scanner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
              <div id="qr-reader" className="w-full h-full"></div>
              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                  <div className="text-center">
                    <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">Scanner desligado</p>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={() => toggleScanner('qr-reader')}
              className="w-full"
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

            <Separator />

            <form onSubmit={handleManualSubmit} className="space-y-2">
              <p className="text-sm text-muted-foreground">Ou insira o código manualmente:</p>
              <div className="flex space-x-2">
                <Input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Digite o código QR..."
                />
                <Button type="submit">Buscar</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Package Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Encomenda</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingPackage ? (
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : package_ ? (
              <div className="space-y-6">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Torre/Apartamento</span>
                  </div>
                  <p className="font-medium">
                    {package_?.apartment?.building?.name} - Apto {package_?.apartment?.number}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Recebido em</span>
                  </div>
                  <p className="font-medium">
                    {format(new Date(package_.received_at), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(package_.received_at), {
                      locale: ptBR,
                      addSuffix: true,
                    })}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Porteiro</span>
                  </div>
                  <p className="font-medium">{package_.doorman_name}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Status</span>
                  </div>
                  <Badge variant={package_.status === 'delivered' ? 'default' : 'secondary'}>
                    {package_.status === 'delivered' ? 'Entregue' : 'Pendente'}
                  </Badge>
                </div>

                {package_.status === 'pending' && (
                  <Button className="w-full" onClick={() => setShowDeliveryDialog(true)}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Registrar Entrega
                  </Button>
                )}
              </div>
            ) : qrCode ? (
              <div className="flex flex-col items-center justify-center h-[300px] space-y-4">
                <AlertCircle className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium">Encomenda não encontrada</p>
                  <p className="text-sm text-muted-foreground">
                    Verifique o código e tente novamente
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] space-y-4">
                <QrCode className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium">Nenhuma encomenda escaneada</p>
                  <p className="text-sm text-muted-foreground">
                    Use o scanner ou digite o código manualmente
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Últimas Entregas</CardTitle>
            <Button variant="outline" onClick={() => setShowHistory(true)}>
              Ver Histórico
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentDeliveries?.length ? (
            <div className="space-y-4">
              {recentDeliveries.map((delivery) => (
                <div key={delivery.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {delivery?.apartment?.building?.name} - Apto {delivery?.apartment?.number}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(delivery.delivered_at!), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <Badge>Entregue</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Clock className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">Nenhuma entrega recente</p>
                <p className="text-sm text-muted-foreground">As últimas entregas aparecerão aqui</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDeliveryDialog} onOpenChange={setShowDeliveryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Entrega de Encomenda</DialogTitle>
            <DialogDescription>
              Confirme os dados e adicione observações se necessário.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {package_ && (
              <>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Torre/Apartamento</p>
                  <p className="text-sm text-muted-foreground">
                    {package_?.apartment?.building?.name} - Apto {package_?.apartment?.number}
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="notes"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Observações (opcional)
                  </label>
                  <Textarea
                    id="notes"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Adicione observações sobre a entrega..."
                  />
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <SignatureCanvas
              ref={sigCanvas}
              canvasProps={{ width: 450, height: 200, className: 'border' }}
              penColor={theme == 'light' ? 'white' : 'black'}
            />
            <div>
              <Button onClick={handleCleanSignature} variant="outline">
                Limpar
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeliveryDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleDeliveryConfirm}
              disabled={deliveryMutation.isPending || isEmpty}
            >
              {deliveryMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Entrega
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={showHistory} onOpenChange={setShowHistory}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Histórico de Entregas</SheetTitle>
            <SheetDescription>Últimas encomendas entregues no sistema.</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {recentDeliveries?.map((delivery) => (
              <div key={delivery.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    {delivery?.apartment?.building?.name} - Apto {delivery?.apartment?.number}
                  </p>
                  <Badge>Entregue</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Entregue em:{' '}
                    {format(new Date(delivery.delivered_at!), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Recebido por: {delivery.doorman_name}
                  </p>
                  {delivery.notes && (
                    <p className="text-sm text-muted-foreground">Obs: {delivery.notes}</p>
                  )}
                </div>
                <Separator />
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
