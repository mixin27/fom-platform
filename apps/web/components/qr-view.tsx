"use client"

import { useEffect, useRef } from "react"
import QRCode from "qrcode"

export default function QRView({ payload }: { payload: string }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (payload && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, payload, {
        width: 320,
        margin: 2,
      })
    }
  }, [payload])

  return <canvas ref={canvasRef} className="mx-auto" />
}
