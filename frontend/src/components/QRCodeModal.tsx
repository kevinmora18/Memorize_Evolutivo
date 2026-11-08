import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Smartphone, Wifi, Globe, Sparkles } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  url?: string;
  roomCode?: string;
}

export function QRCodeModal({
  isOpen,
  onClose,
  title = 'Juega desde tu Celular',
  subtitle = 'Escanea el código con la cámara de tu teléfono para ingresar',
  url,
  roomCode,
}: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Si no se pasa URL, construir a partir del origin actual
  const targetUrl = url || (() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    // Si estamos en localhost, usar la IP de LAN para que el celular pueda conectarse
    const resolvedOrigin = origin.includes('localhost')
      ? origin.replace('localhost', '192.168.1.151')
      : origin;
    return roomCode ? `${resolvedOrigin}/?join=${roomCode}` : `${resolvedOrigin}/`;
  })();

  const isCloud = !targetUrl.includes('192.168.') && !targetUrl.includes('localhost') && !targetUrl.includes('127.0.0.1');

  const handleCopy = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Fondo oscuro con desenfoque */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 15 }}
          className="relative w-full max-w-md bg-[#0D1119] border border-[#1E2836] rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(53,224,200,0.18)] overflow-hidden select-none"
        >
          {/* Resplandor decorativo */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-40 bg-[#35E0C8]/20 rounded-full blur-[80px] pointer-events-none" />

          {/* Botón Cerrar */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-[#9AA3B2] hover:text-white hover:bg-[#1E2836]/60 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Cabecera */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#35E0C8]/10 border border-[#35E0C8]/30 text-[#35E0C8] font-mono text-[11px] font-bold uppercase tracking-wider mb-2">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Acceso Móvil Instantáneo</span>
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
              {title}
            </h3>
            <p className="font-sans text-xs text-[#9AA3B2] mt-1 max-w-xs mx-auto">
              {subtitle}
            </p>
          </div>

          {/* Marco del Código QR */}
          <div className="relative mx-auto my-3 p-4 bg-white rounded-2xl shadow-xl flex items-center justify-center w-56 h-56 border-4 border-[#35E0C8]/40">
            <QRCodeSVG
              value={targetUrl}
              size={192}
              level="H"
              includeMargin={false}
            />
          </div>

          {/* Badge de Red */}
          <div className="mt-4 flex items-center justify-center gap-2 font-mono text-[11px]">
            {isCloud ? (
              <span className="flex items-center gap-1.5 text-[#2BE08F] bg-[#2BE08F]/10 px-3 py-1 rounded-full border border-[#2BE08F]/30">
                <Globe className="w-3.5 h-3.5" />
                <span>Enlace Global 24/7 (Datos o Wi-Fi)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[#35E0C8] bg-[#35E0C8]/10 px-3 py-1 rounded-full border border-[#35E0C8]/30">
                <Wifi className="w-3.5 h-3.5" />
                <span>Misma Red Wi-Fi (Modo LAN)</span>
              </span>
            )}
          </div>

          {/* Input con enlace copiable */}
          <div className="mt-4 flex items-center gap-2 p-1.5 rounded-xl bg-[#07090F] border border-[#1E2836]">
            <input
              type="text"
              readOnly
              value={targetUrl}
              className="w-full bg-transparent px-3 py-1.5 font-mono text-[11px] text-[#9AA3B2] focus:outline-none truncate select-all"
            />
            <button
              onClick={handleCopy}
              className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                copied
                  ? 'bg-[#2BE08F] text-[#07090F]'
                  : 'bg-[#1E2836] text-[#E8E6DF] hover:bg-[#35E0C8] hover:text-[#07090F]'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>

          {/* Instrucciones 1-2-3 */}
          <div className="mt-5 grid grid-cols-3 gap-2 text-center font-sans text-[10px] text-[#9AA3B2]">
            <div className="p-2 rounded-xl bg-[#131A26]/50 border border-[#1E2836]/50">
              <span className="block font-mono font-bold text-[#35E0C8] mb-0.5">1</span>
              Abre la cámara de tu celular
            </div>
            <div className="p-2 rounded-xl bg-[#131A26]/50 border border-[#1E2836]/50">
              <span className="block font-mono font-bold text-[#35E0C8] mb-0.5">2</span>
              Escanea el código QR
            </div>
            <div className="p-2 rounded-xl bg-[#131A26]/50 border border-[#1E2836]/50">
              <span className="block font-mono font-bold text-[#35E0C8] mb-0.5">3</span>
              ¡Entra a jugar al instante!
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
