import React from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Bill } from './api/bills';
import { ThermalReceipt } from '@/components/bills/ThermalReceipt';
import { toast } from 'sonner';

export const downloadBillAsPdf = async (bill: Bill) => {
  console.log("[PDF Debug] 1. Download button clicked, Bill object received:", bill);
  const toastId = toast.loading("Generating PDF...");
  
  // Create container behind the main app content with full opacity and exact coordinates
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '0px';
  container.style.top = '0px';
  container.style.width = '80mm';
  container.style.zIndex = '-9999';
  container.style.opacity = '1';
  container.style.pointerEvents = 'none';
  container.style.background = '#ffffff';
  container.style.color = '#000000';
  container.style.border = 'none';
  container.style.boxShadow = 'none';
  document.body.appendChild(container);

  const root = createRoot(container);
  
  try {
    root.render(<ThermalReceipt bill={bill} />);

    // Wait for DOM to completely finish rendering and fonts to load
    await new Promise((resolve) => setTimeout(resolve, 350));

    const element = container.firstChild as HTMLElement;
    if (!element) {
      throw new Error("Receipt element not rendered");
    }
    console.log("[PDF Debug] 2. Receipt element found and rendered:", element);

    // Convert any modern CSS colors (oklch, oklab, color-mix, etc.) into standard rgba
    // so html2canvas v1.4.1 can parse them without throwing an error.
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 1;
    tempCanvas.height = 1;
    const ctx = tempCanvas.getContext('2d');
    const colorCache = new Map<string, string>();

    const convertColorToRgba = (colorStr: string | null | undefined): string => {
      if (!colorStr || typeof colorStr !== 'string') return colorStr || '';
      const trimmed = colorStr.trim();
      if (trimmed === 'transparent' || trimmed === 'none' || trimmed === 'inherit' || trimmed === 'currentColor') return trimmed;
      if (
        !trimmed.includes('oklch') &&
        !trimmed.includes('oklab') &&
        !trimmed.includes('lch(') &&
        !trimmed.includes('lab(') &&
        !trimmed.includes('color(') &&
        !trimmed.includes('color-mix')
      ) {
        return trimmed;
      }
      if (colorCache.has(trimmed)) {
        return colorCache.get(trimmed)!;
      }
      if (!ctx) return 'rgba(0, 0, 0, 0)';
      try {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = trimmed;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        if (a === 0 && !trimmed.includes('0)')) {
          colorCache.set(trimmed, 'rgba(0, 0, 0, 0)');
          return 'rgba(0, 0, 0, 0)';
        }
        const rgba = `rgba(${r}, ${g}, ${b}, ${+(a / 255).toFixed(3)})`;
        colorCache.set(trimmed, rgba);
        return rgba;
      } catch {
        colorCache.set(trimmed, 'rgba(0, 0, 0, 0)');
        return 'rgba(0, 0, 0, 0)';
      }
    };

    const patchGetComputedStyle = (win: Window | null) => {
      if (!win || !win.getComputedStyle) return () => {};
      const origGetComputedStyle = win.getComputedStyle;
      win.getComputedStyle = function (elt: Element, pseudoElt?: string | null) {
        const style = origGetComputedStyle.call(win, elt, pseudoElt);
        if (!style) return style;
        return new Proxy(style, {
          get(target, prop) {
            if (prop === 'getPropertyValue') {
              return function (propertyName: string) {
                const val = target.getPropertyValue(propertyName);
                return convertColorToRgba(val);
              };
            }
            const val = Reflect.get(target, prop);
            if (typeof val === 'function') {
              return val.bind(target);
            }
            if (typeof val === 'string' && typeof prop === 'string' && prop !== 'cssText') {
              return convertColorToRgba(val);
            }
            return val;
          }
        });
      };
      return () => {
        win.getComputedStyle = origGetComputedStyle;
      };
    };

    // Sanitize elements explicitly
    const allElements = [container, element, ...Array.from(element.querySelectorAll('*'))] as (HTMLElement | SVGElement)[];
    const colorProps = [
      'color',
      'backgroundColor',
      'borderTopColor',
      'borderRightColor',
      'borderBottomColor',
      'borderLeftColor',
      'outlineColor',
      'textShadow',
      'textDecorationColor',
      'columnRuleColor',
      'fill',
      'stroke'
    ];
    allElements.forEach((el) => {
      const computed = window.getComputedStyle(el);
      if (el instanceof HTMLElement && computed.boxShadow && computed.boxShadow !== 'none') {
        el.style.boxShadow = 'none';
      }
      colorProps.forEach((prop) => {
        const val = computed[prop as keyof CSSStyleDeclaration] as string;
        if (val && typeof val === 'string' && val.includes('oklch')) {
          (el.style as any)[prop] = convertColorToRgba(val);
        }
      });
    });

    // Patch window.getComputedStyle to intercept pseudo-elements and style queries without Proxy receiver issues
    const restoreMainWindow = patchGetComputedStyle(window);

    console.log("[PDF Debug] 3. html2canvas started...");
    let canvas: HTMLCanvasElement;
    try {
      canvas = await html2canvas(element, {
        scale: 3, // High resolution for thermal crispness
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc: Document, clonedElement: HTMLElement) => {
          const clonedWin = clonedDoc.defaultView || window;
          patchGetComputedStyle(clonedWin);

          const clonedElements = [clonedElement, ...Array.from(clonedElement.querySelectorAll('*'))] as (HTMLElement | SVGElement)[];
          clonedElements.forEach((el) => {
            const comp = clonedWin.getComputedStyle(el);
            if (el instanceof HTMLElement) {
              el.style.boxShadow = 'none';
              // Explicitly inline critical color & border styles with converted rgba
              colorProps.forEach((prop) => {
                const val = comp[prop as keyof CSSStyleDeclaration] as string;
                if (val) {
                  (el.style as any)[prop] = convertColorToRgba(val);
                }
              });
              // Inline typography, layout, and box-model so removing external style sheets does not break geometry
              el.style.fontFamily = comp.fontFamily || 'monospace';
              el.style.fontSize = comp.fontSize || '14px';
              el.style.fontWeight = comp.fontWeight || 'normal';
              el.style.lineHeight = comp.lineHeight || '1.5';
              el.style.textAlign = comp.textAlign || 'left';
              el.style.display = comp.display || 'block';
              if (comp.display === 'flex') {
                el.style.flexDirection = comp.flexDirection;
                el.style.justifyContent = comp.justifyContent;
                el.style.alignItems = comp.alignItems;
                el.style.gap = comp.gap;
              }
              el.style.width = comp.width;
              el.style.height = comp.height;
              el.style.paddingTop = comp.paddingTop;
              el.style.paddingRight = comp.paddingRight;
              el.style.paddingBottom = comp.paddingBottom;
              el.style.paddingLeft = comp.paddingLeft;
              el.style.marginTop = comp.marginTop;
              el.style.marginRight = comp.marginRight;
              el.style.marginBottom = comp.marginBottom;
              el.style.marginLeft = comp.marginLeft;
              el.style.borderTopWidth = comp.borderTopWidth;
              el.style.borderTopStyle = comp.borderTopStyle;
              el.style.borderBottomWidth = comp.borderBottomWidth;
              el.style.borderBottomStyle = comp.borderBottomStyle;
            }
          });

          // Completely remove `<style>` and `<link rel="stylesheet">` tags from clonedDoc
          // so html2canvas's internal CSS parser never attempts to parse `oklch` syntax.
          clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach((sheet) => {
            sheet.remove();
          });
        }
      });
      console.log("[PDF Debug] 4. html2canvas completed successfully. Canvas generated:", canvas);
    } finally {
      restoreMainWindow();
    }

    const imgData = canvas.toDataURL('image/png');
    
    // Thermal receipt standard width: 80mm. Calculate height proportionally.
    const pdfWidth = 80;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    console.log("[PDF Debug] 5. jsPDF initialized with dimensions:", { pdfWidth, pdfHeight });
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight]
    });

    console.log("[PDF Debug] 6. PDF image added to document...");
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    const safeBillNumber = String(bill.billNumber || 'bill').replace(/[\/\\:*?"<>|]/g, '-').trim();
    const safeParty = String(bill.party || 'challan').replace(/[\/\\:*?"<>|]/g, '-').trim();
    const fileName = `${safeBillNumber}_${safeParty}.pdf`;
    console.log("[PDF Debug] 7. Generating explicit PDF blob and downloading:", fileName);
    
    // Explicitly output as application/pdf Blob and trigger download via anchor tag
    // to ensure all browsers respect the exact filename and .pdf extension without modification.
    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    }, 1000);

    console.log("[PDF Debug] 8. Download completed successfully!");
    toast.success(`Downloaded ${fileName}`, { id: toastId });
  } catch (error) {
    console.error("[PDF Debug ERROR] Failed to generate PDF:", error);
    toast.error("Failed to generate PDF. Please try again.", { id: toastId });
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
};
