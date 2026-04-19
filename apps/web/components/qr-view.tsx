"use client"

import { useEffect, useRef } from "react"
import QRCode from "qrcode"
import Image from "next/image"

export default function QRView({ payload }: { payload: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (payload && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, payload, {
        width: 320,
        margin: 2,
      })
    }
  }, [payload])

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <Image
          src="/MMQR_Logo.png"
          alt="MMQR Logo"
          width={80}
          height={120}
          className="h-24 w-auto object-contain"
          priority
        />
      </div>
      
      <div className="relative">
        <canvas ref={canvasRef} className="mx-auto" />
      </div>

      <p className="text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase text-center">
        PAYMENT POWERED BY MYANMYANPAY
      </p>
    </div>
  )
}
