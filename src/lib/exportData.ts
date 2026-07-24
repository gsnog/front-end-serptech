import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from '@/hooks/use-toast';
import logoDlc from '@/assets/logo-dlc.png';
import logoSerp from '@/assets/logo-serp-light.png';

export type ExportFormat = 'excel' | 'csv' | 'pdf';

async function loadImageAsDataUrl(url: string): Promise<{ dataUrl: string; width: number; height: number }> {
  const res = await fetch(url);
  const blob = await res.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = dataUrl;
  });
  return { dataUrl, width, height };
}

/**
 * Exporta dados para Excel (.xlsx), CSV (.csv) ou PDF
 */
export async function exportData(
  data: Record<string, unknown>[],
  fileName: string,
  format: ExportFormat = 'excel',
  sheetName = 'Dados'
) {
  if (data.length === 0) {
    toast({
      title: 'Sem dados',
      description: 'Não há dados para exportar.',
      variant: 'destructive',
    });
    return;
  }

  if (format === 'excel') {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}.xlsx`);
    toast({
      title: 'Exportado com sucesso!',
      description: `Arquivo "${fileName}.xlsx" gerado com ${data.length} registro(s).`,
    });
  } else if (format === 'csv') {
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'Exportado com sucesso!',
      description: `Arquivo "${fileName}.csv" gerado com ${data.length} registro(s).`,
    });
  } else {
    const doc = new jsPDF({ orientation: data.length > 0 && Object.keys(data[0]).length > 5 ? 'landscape' : 'portrait' });
    const columns = Object.keys(data[0]);
    const rows = data.map(row => columns.map(col => String(row[col] ?? '')));
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const [dlcLogo, serpLogo] = await Promise.all([
      loadImageAsDataUrl(logoDlc),
      loadImageAsDataUrl(logoSerp),
    ]);

    // Layout econômico em tinta: sem tarjas ou preenchimentos coloridos, só os símbolos da marca
    const dlcLogoH = 16;
    const dlcLogoW = dlcLogoH * (dlcLogo.width / dlcLogo.height);
    doc.addImage(dlcLogo.dataUrl, 'PNG', pageWidth - 14 - dlcLogoW, 8, dlcLogoW, dlcLogoH);

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(fileName, 14, 18);
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 26);
    doc.setDrawColor(0, 0, 0);
    doc.line(14, 30, pageWidth - 14, 30);

    doc.setTextColor(0, 0, 0);

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 36,
      styles: { fontSize: 8, cellPadding: 3, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1 },
      headStyles: { fillColor: false, textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1 },
      alternateRowStyles: { fillColor: false },
    });

    // Símbolo da SerpTech no rodapé de cada página, como no rodapé da aplicação
    const serpLogoH = 8;
    const serpLogoW = serpLogoH * (serpLogo.width / serpLogo.height);
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.addImage(serpLogo.dataUrl, 'PNG', (pageWidth - serpLogoW) / 2, pageHeight - serpLogoH - 6, serpLogoW, serpLogoH);
    }

    doc.save(`${fileName}.pdf`);
    toast({
      title: 'Exportado com sucesso!',
      description: `Arquivo "${fileName}.pdf" gerado com ${data.length} registro(s).`,
    });
  }
}
