import { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'

export const SignaturePad = ({ onSave }: { onSave: (signature: string) => void }) => {
  const sigCanvas = useRef<SignatureCanvas | null>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  const handleClear = () => {
    sigCanvas.current?.clear()
    setIsEmpty(true)
  }

  const handleSave = () => {
    if (!sigCanvas.current?.isEmpty()) {
      const signatureData = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png')
      onSave(String(signatureData))
      setIsEmpty(false)
    }
  }

  return (
    <div>
      <SignatureCanvas
        ref={sigCanvas}
        canvasProps={{ width: 400, height: 200, className: 'border' }}
      />
      <div>
        <button onClick={handleClear}>Limpar</button>
        <button onClick={handleSave} disabled={isEmpty}>
          Salvar
        </button>
      </div>
    </div>
  )
}
