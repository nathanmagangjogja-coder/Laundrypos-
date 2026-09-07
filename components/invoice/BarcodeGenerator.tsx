'use client';
import { useEffect, useRef } from 'react';

export function BarcodeGenerator({ value, height = 40 }: { value: string; height?: number }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let active = true;
    import('jsbarcode').then(({ default: JsBarcode }) => {
      if (active && ref.current) {
        JsBarcode(ref.current, value, {
          format: 'CODE128',
          height,
          width: 1.5,
          displayValue: false,  // ← matikan teks di dalam SVG (sering terpotong)
          margin: 4,
          background: 'transparent',
          lineColor: '#000',
        });
      }
    });
    return () => { active = false; };
  }, [value, height]);

  return (
    <div className="w-full">
      <svg ref={ref} className="max-w-full" />
      {/* Tampilkan invoice no di luar SVG agar tidak terpotong */}
      <div className="mt-0.5 text-center font-mono text-[9px] text-slate-600 break-all leading-tight">
        {value}
      </div>
    </div>
  );
}