import { useState, useRef, type FC } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Copy, Check, ExternalLink, QrCode, ShoppingCart, Eye, Plus, Minus, Printer } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import toast from 'react-hot-toast'

type QRType = 'menu' | 'order'

const QRGeneratorPage: FC = () => {
  const [baseUrl, setBaseUrl] = useState(window.location.origin)
  const [copied, setCopied] = useState(false)
  const [qrType, setQrType] = useState<QRType>('order')
  const [tableCount, setTableCount] = useState(10)
  const [selectedTable, setSelectedTable] = useState(1)
  const qrRef = useRef<HTMLDivElement>(null)

  const menuUrl = `${baseUrl}/carta`
  const getOrderUrl = (table: number) => `${baseUrl}/pedido/${table}`
  const currentUrl = qrType === 'menu' ? menuUrl : getOrderUrl(selectedTable)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl)
      setCopied(true)
      toast.success('Enlace copiado')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  const handleDownloadQR = () => {
    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return

    // Crear canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const img = new Image()
    
    img.onload = () => {
      canvas.width = 512
      canvas.height = 512
      
      // Fondo blanco
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Dibujar QR
      ctx.drawImage(img, 0, 0, 512, 512)
      
      // Descargar
      const link = document.createElement('a')
      const filename = qrType === 'menu' 
        ? 'projectbar-menu-qr.png' 
        : `projectbar-mesa-${selectedTable}-qr.png`
      link.download = filename
      link.href = canvas.toDataURL('image/png')
      link.click()
      
      toast.success('QR descargado')
    }
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  const handleDownloadQRWithLogo = () => {
    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const img = new Image()
    
    img.onload = () => {
      const size = 600
      const padding = 40
      canvas.width = size
      canvas.height = size + 100
      
      // Fondo con gradiente
      const gradient = ctx.createLinearGradient(0, 0, size, size + 100)
      gradient.addColorStop(0, '#0f172a')
      gradient.addColorStop(1, '#1e293b')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // QR con fondo blanco redondeado
      const qrSize = size - padding * 2
      ctx.fillStyle = 'white'
      ctx.beginPath()
      ctx.roundRect(padding, padding, qrSize, qrSize, 16)
      ctx.fill()
      
      // Dibujar QR
      ctx.drawImage(img, padding + 10, padding + 10, qrSize - 20, qrSize - 20)
      
      // Texto inferior
      ctx.fillStyle = '#10b981'
      ctx.font = 'bold 24px system-ui'
      ctx.textAlign = 'center'
      
      if (qrType === 'menu') {
        ctx.fillText('Escanea para ver el menú', size / 2, size + 50)
      } else {
        ctx.fillText(`Mesa ${selectedTable}`, size / 2, size + 45)
        ctx.font = '18px system-ui'
        ctx.fillStyle = '#94a3b8'
        ctx.fillText('Escanea para hacer tu pedido', size / 2, size + 75)
      }
      
      // Descargar
      const link = document.createElement('a')
      const filename = qrType === 'menu' 
        ? 'projectbar-menu-poster.png' 
        : `projectbar-mesa-${selectedTable}-poster.png`
      link.download = filename
      link.href = canvas.toDataURL('image/png')
      link.click()
      
      toast.success('Poster QR descargado')
    }
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  const handleDownloadAllTables = () => {
    // For MVP: download each table one at a time with a delay
    toast.loading(`Generando QRs para ${tableCount} mesas...`, { id: 'generating' })
    
    let downloaded = 0
    
    const downloadNext = () => {
      if (downloaded >= tableCount) {
        toast.success(`${tableCount} QRs listos! Revisa tu carpeta de descargas`, { id: 'generating' })
        return
      }
      
      const table = downloaded + 1
      setSelectedTable(table)
      
      // Wait for state update and QR render
      setTimeout(() => {
        handleDownloadQRWithLogo()
        downloaded++
        setTimeout(downloadNext, 500)
      }, 200)
    }
    
    downloadNext()
  }

  return (
    <div className="min-h-screen bg-slate-950 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 mb-4">
            <QrCode className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Generador de Códigos QR</h1>
          <p className="text-slate-400">
            Genera códigos QR para que tus clientes vean el menú o hagan pedidos
          </p>
        </div>

        {/* QR Type Selector */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setQrType('menu')}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl border-2 transition-all ${
              qrType === 'menu'
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
            }`}
          >
            <Eye className="w-5 h-5" />
            <div className="text-left">
              <p className="font-semibold">Solo Ver Menú</p>
              <p className="text-xs opacity-70">/carta</p>
            </div>
          </button>
          <button
            onClick={() => setQrType('order')}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl border-2 transition-all ${
              qrType === 'order'
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            <div className="text-left">
              <p className="font-semibold">Hacer Pedido</p>
              <p className="text-xs opacity-70">/pedido/:mesa</p>
            </div>
          </button>
        </div>

        {/* Table Selector (only for order type) */}
        {qrType === 'order' && (
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Número de mesas:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTableCount(Math.max(1, tableCount - 1))}
                      className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg"
                    >
                      <Minus className="w-4 h-4 text-slate-400" />
                    </button>
                    <span className="w-12 text-center text-white font-bold">{tableCount}</span>
                    <button
                      onClick={() => setTableCount(Math.min(100, tableCount + 1))}
                      className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg"
                    >
                      <Plus className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
                <Button
                  onClick={handleDownloadAllTables}
                  variant="secondary"
                  leftIcon={<Printer className="w-4 h-4" />}
                >
                  Descargar QRs de todas las mesas
                </Button>
              </div>
              
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {Array.from({ length: tableCount }, (_, i) => i + 1).map((table) => (
                  <button
                    key={table}
                    onClick={() => setSelectedTable(table)}
                    className={`w-12 h-12 rounded-xl font-bold transition-all ${
                      selectedTable === table
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {table}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        <div className="grid md:grid-cols-2 gap-6">
          {/* QR Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Vista Previa
                {qrType === 'order' && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">
                    Mesa {selectedTable}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                ref={qrRef}
                className="bg-white p-6 rounded-2xl flex items-center justify-center"
              >
                <QRCodeSVG
                  value={currentUrl}
                  size={256}
                  level="H"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                />
              </div>
              
              <div className="mt-4 p-3 bg-slate-800/50 rounded-xl">
                <p className="text-slate-400 text-sm mb-1">
                  URL {qrType === 'menu' ? 'del menú' : 'de pedidos'}:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-emerald-400 text-sm truncate">
                    {currentUrl}
                  </code>
                  <button
                    onClick={handleCopyLink}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Options */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Input
                label="URL Base (para producción)"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://tudominio.com"
                helperText="Cambia esto cuando subas la app a producción"
              />

              <div className="space-y-3">
                <Button
                  onClick={handleDownloadQR}
                  variant="primary"
                  className="w-full"
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Descargar QR Simple
                </Button>

                <Button
                  onClick={handleDownloadQRWithLogo}
                  variant="secondary"
                  className="w-full"
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Descargar Poster con QR
                </Button>

                <a
                  href={currentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl border-2 border-slate-700 text-slate-300 font-medium hover:border-emerald-500 hover:text-emerald-400 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  {qrType === 'menu' ? 'Ver Menú Público' : 'Probar Sistema de Pedidos'}
                </a>
              </div>

              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <h4 className="text-emerald-400 font-medium mb-2">
                  💡 {qrType === 'menu' ? 'Sugerencias de uso' : 'Sistema de Pedidos por Mesa'}
                </h4>
                <ul className="text-slate-400 text-sm space-y-1">
                  {qrType === 'menu' ? (
                    <>
                      <li>• Imprime el QR y colócalo en cada mesa</li>
                      <li>• Agrégalo a tu menú físico</li>
                      <li>• Ponlo en la entrada del bar</li>
                      <li>• Compártelo en redes sociales</li>
                    </>
                  ) : (
                    <>
                      <li>• Cada mesa tiene su propio QR único</li>
                      <li>• El cliente escanea y hace su pedido</li>
                      <li>• Solo necesita ingresar su nombre</li>
                      <li>• El pedido llega al panel de meseros</li>
                      <li>• El pago se hace directamente con el mesero</li>
                    </>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Frame */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              Vista Móvil - {qrType === 'menu' ? 'Menú' : `Mesa ${selectedTable}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="relative">
                {/* Phone Frame */}
                <div className="w-[300px] h-[600px] bg-slate-800 rounded-[40px] p-3 shadow-2xl border-4 border-slate-700">
                  <div className="w-full h-full rounded-[28px] overflow-hidden bg-slate-900">
                    <iframe
                      src={qrType === 'menu' ? '/carta' : `/pedido/${selectedTable}`}
                      className="w-full h-full border-0"
                      title="Preview"
                    />
                  </div>
                  {/* Notch */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-slate-800 rounded-b-xl" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default QRGeneratorPage
