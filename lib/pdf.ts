// Lazy import jsPDF & html2canvas to keep bundle slim
export async function exportElementToPdf(el: HTMLElement, filename = 'invoice.pdf') {
  const [{ default: jsPDF }, html2canvas] = await Promise.all([
    import('jspdf'),
    import('html2canvas').then((m) => m.default),
  ]);
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#fff' });
  const img = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const w = pdf.internal.pageSize.getWidth();
  const h = (canvas.height * w) / canvas.width;
  pdf.addImage(img, 'PNG', 0, 0, w, h);
  pdf.save(filename);
}

export async function exportRowsToXlsx(rows: any[], filename = 'report.xlsx', sheetName = 'Report') {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}
