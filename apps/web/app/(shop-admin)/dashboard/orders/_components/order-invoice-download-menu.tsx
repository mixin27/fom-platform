"use client"

import type { ComponentProps } from "react"
import { useRef, useState } from "react"
import { Download, FileText, ImageIcon } from "lucide-react"
import { toPng } from "html-to-image"
import { jsPDF } from "jspdf"
import { toast } from "sonner"

import type { ShopOrder } from "@/lib/shop/api"
import {
  generateInvoiceFilename,
  generateOrderInvoiceText,
} from "@/lib/shop/invoice"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"
import { OrderInvoiceDocument } from "./order-invoice-document"

type OrderInvoiceDownloadMenuProps = {
  order: ShopOrder
  shopName: string
  className?: string
  buttonLabel?: string
  size?: ComponentProps<typeof Button>["size"]
  variant?: ComponentProps<typeof Button>["variant"]
}

export function OrderInvoiceDownloadMenu({
  order,
  shopName,
  className,
  buttonLabel = "Download Invoice",
  size = "sm",
  variant = "outline",
}: OrderInvoiceDownloadMenuProps) {
  const invoiceRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  function triggerDownload(href: string, filename: string) {
    const link = document.createElement("a")
    link.href = href
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    triggerDownload(url, filename)
    window.setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 0)
  }

  async function renderInvoiceImage() {
    if (!invoiceRef.current) {
      throw new Error("Invoice document is unavailable.")
    }

    return toPng(invoiceRef.current, {
      backgroundColor: "#ffffff",
      pixelRatio: 2,
      cacheBust: true,
    })
  }

  async function handleDownloadText() {
    try {
      const text = generateOrderInvoiceText(order, shopName)
      downloadBlob(
        new Blob([text], { type: "text/plain;charset=utf-8" }),
        generateInvoiceFilename(order, shopName, "txt")
      )
      toast.success("Invoice text downloaded.")
    } catch (error) {
      console.error("Invoice text export failed", error)
      toast.error("Failed to download invoice text.")
    }
  }

  async function handleDownloadImage() {
    setIsExporting(true)

    try {
      const dataUrl = await renderInvoiceImage()
      triggerDownload(dataUrl, generateInvoiceFilename(order, shopName, "png"))
      toast.success("Invoice image downloaded.")
    } catch (error) {
      console.error("Invoice image export failed", error)
      toast.error("Failed to download invoice image.")
    } finally {
      setIsExporting(false)
    }
  }

  async function handleDownloadPdf() {
    setIsExporting(true)

    try {
      const dataUrl = await renderInvoiceImage()
      const rect = invoiceRef.current?.getBoundingClientRect()
      const width = Math.ceil(rect?.width ?? 800)
      const height = Math.ceil(rect?.height ?? 1131)
      const pdf = new jsPDF({
        orientation: width > height ? "landscape" : "portrait",
        unit: "pt",
        format: [width, height],
      })

      pdf.addImage(dataUrl, "PNG", 0, 0, width, height)
      pdf.save(generateInvoiceFilename(order, shopName, "pdf"))
      toast.success("Invoice PDF downloaded.")
    } catch (error) {
      console.error("Invoice PDF export failed", error)
      toast.error("Failed to download invoice PDF.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={cn(className)}
            disabled={isExporting}
          >
            <Download data-icon="inline-start" />
            {isExporting ? "Preparing..." : buttonLabel}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Invoice Downloads</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={isExporting}
            onSelect={() => {
              void handleDownloadText()
            }}
          >
            <FileText className="mr-2 h-4 w-4" />
            Download text
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isExporting}
            onSelect={() => {
              void handleDownloadPdf()
            }}
          >
            <FileText className="mr-2 h-4 w-4" />
            Download PDF
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isExporting}
            onSelect={() => {
              void handleDownloadImage()
            }}
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            Download image
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="pointer-events-none fixed top-[-10000px] left-[-10000px]">
        <OrderInvoiceDocument
          ref={invoiceRef}
          order={order}
          shopName={shopName}
        />
      </div>
    </>
  )
}
