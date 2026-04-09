import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FileDown, BarChart3, FileText, FileSpreadsheet, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
// Fiscal-mock removed — stub until /api/fiscal/ endpoints exist
const mockNotasFiscais: any[] = [];
import { exportData } from "@/lib/exportData";

const ExportacoesRelatorios = () => {
  const [xmlDe, setXmlDe] = useState("");
  const [xmlAte, setXmlAte] = useState("");
  const [xmlTipo, setXmlTipo] = useState("todos");
  const [relDe, setRelDe] = useState("");
  const [relAte, setRelAte] = useState("");
  const [relTipo, setRelTipo] = useState("todos");
  const [showResult, setShowResult] = useState(false);

  // Filtered data for XML export
  const getXmlNotas = () => {
    return mockNotasFiscais.filter(n => {
      if (n.arquivos.filter(a => a.tipo === "XML").length === 0) return false;
      if (xmlTipo !== "todos" && n.tipo !== (xmlTipo === "nfe" ? "NF-e" : "NFS-e")) return false;
      return true;
    });
  };

  const handleExportXml = () => {
    const notas = getXmlNotas();
    if (notas.length === 0) {
      toast({ title: "Sem XMLs", description: "Nenhum XML encontrado para os filtros selecionados.", variant: "destructive" });
      return;
    }
    // Simulate XML download as a zip-like summary
    const data = notas.flatMap(n =>
      n.arquivos.filter(a => a.tipo === "XML").map(a => ({
        "Nota": `${n.tipo} #${n.numero}`,
        "Série": n.serie,
        "Cliente": n.cliente,
        "Data": n.dataEmissao,
        "Arquivo": a.nome,
        "Tamanho": a.tamanho,
        "Status": n.status,
      }))
    );
    exportData(data, `xmls-fiscais-${xmlTipo}`, "excel", "XMLs");
  };

  // Report data
  const getReportData = () => {
    let notas = mockNotasFiscais.filter(n => ["Autorizada", "Cancelada"].includes(n.status));
    if (relTipo !== "todos") notas = notas.filter(n => n.tipo === (relTipo === "nfe" ? "NF-e" : "NFS-e"));
    return notas;
  };

  const reportNotas = showResult ? getReportData() : [];
  const totalNotas = reportNotas.length;
  const totalFaturado = reportNotas.reduce((s, n) => s + n.totalFinal, 0);
  const totalTributos = reportNotas.reduce((s, n) => s + n.tributos.reduce((st, t) => st + t.valorFinal, 0), 0);
  const totalAutorizadas = reportNotas.filter(n => n.status === "Autorizada").length;
  const totalCanceladas = reportNotas.filter(n => n.status === "Cancelada").length;

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleGenerateReport = () => {
    if (!relDe && !relAte) {
      // Allow without dates for demo
    }
    setShowResult(true);
  };

  const getExportRows = () => {
    return reportNotas.map(n => ({
      "Tipo": n.tipo,
      "Nº": String(n.numero),
      "Série": n.serie,
      "Cliente": n.cliente,
      "CPF/CNPJ": n.clienteCpfCnpj,
      "Data Emissão": n.dataEmissao,
      "Status": n.status,
      "Subtotal": fmt(n.subtotal),
      "Descontos": fmt(n.descontos),
      "Total Final": fmt(n.totalFinal),
      "Total Tributos": fmt(n.tributos.reduce((s, t) => s + t.valorFinal, 0)),
      ...Object.fromEntries(n.tributos.map(t => [`${t.imposto} (Valor)`, fmt(t.valorFinal)])),
    }));
  };

  const handleExportReport = (format: "excel" | "pdf") => {
    const rows = getExportRows();
    if (rows.length === 0) {
      toast({ title: "Sem dados", description: "Gere o relatório primeiro.", variant: "destructive" });
      return;
    }
    exportData(rows, `relatorio-notas-fiscais`, format, "Notas Emitidas");
  };

  const handleExportCsv = () => {
    const rows = getExportRows();
    if (rows.length === 0) {
      toast({ title: "Sem dados", description: "Gere o relatório primeiro.", variant: "destructive" });
      return;
    }
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(";"),
      ...rows.map(row => headers.map(h => `"${(row as Record<string, string>)[h] || ""}"`).join(";"))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "relatorio-notas-fiscais.csv";
    link.click();
    URL.revokeObjectURL(url);

    toast({ title: "CSV exportado!", description: `Arquivo com ${rows.length} registro(s) gerado.` });
  };

  return (
    <SimpleFormWizard title="Exportações e Relatórios Fiscais">
      <div className="space-y-6">
        {/* Export XMLs */}
        <Card className="border-border shadow-lg">
          <CardContent className="p-6 md:p-8">
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                  <FileDown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Exportar XMLs</h2>
                  <p className="text-sm text-muted-foreground">Baixar arquivos XML por período e tipo de nota</p>
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">De</Label>
                  <Input type="date" className="form-input w-[160px]" value={xmlDe} onChange={(e) => setXmlDe(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Até</Label>
                  <Input type="date" className="form-input w-[160px]" value={xmlAte} onChange={(e) => setXmlAte(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tipo</Label>
                  <Select value={xmlTipo} onValueChange={setXmlTipo}>
                    <SelectTrigger className="form-input w-[130px]"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="nfe">NF-e</SelectItem>
                      <SelectItem value="nfse">NFS-e</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="gap-2" onClick={handleExportXml}>
                  <Download className="h-4 w-4" />Exportar XMLs ({getXmlNotas().flatMap(n => n.arquivos.filter(a => a.tipo === "XML")).length} arquivos)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report */}
        <Card className="border-border shadow-lg">
          <CardContent className="p-6 md:p-8">
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Relatório de Notas Emitidas</h2>
                  <p className="text-sm text-muted-foreground">Resumo com totais de faturamento e tributos</p>
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">De</Label>
                  <Input type="date" className="form-input w-[160px]" value={relDe} onChange={(e) => setRelDe(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Até</Label>
                  <Input type="date" className="form-input w-[160px]" value={relAte} onChange={(e) => setRelAte(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tipo</Label>
                  <Select value={relTipo} onValueChange={setRelTipo}>
                    <SelectTrigger className="form-input w-[130px]"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="nfe">NF-e</SelectItem>
                      <SelectItem value="nfse">NFS-e</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="gap-2" onClick={handleGenerateReport}>
                  <FileText className="h-4 w-4" />Gerar Relatório
                </Button>
              </div>

              {showResult && (
                <div className="mt-6 space-y-5 animate-in fade-in duration-300">
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <SummaryCard label="Total de Notas" value={String(totalNotas)} />
                    <SummaryCard label="Autorizadas" value={String(totalAutorizadas)} valueClass="text-primary" />
                    <SummaryCard label="Canceladas" value={String(totalCanceladas)} valueClass="text-destructive" />
                    <SummaryCard label="Total Faturado" value={fmt(totalFaturado)} valueClass="text-foreground" />
                    <SummaryCard label="Total Tributos" value={fmt(totalTributos)} valueClass="text-foreground" />
                  </div>

                  {/* Detail table */}
                  <div className="rounded border border-border overflow-hidden">
                    <Table>
                      <TableHeader><TableRow className="bg-table-header">
                        <TableHead className="text-center font-semibold">Tipo</TableHead>
                        <TableHead className="font-semibold">Nº</TableHead>
                        <TableHead className="font-semibold">Cliente</TableHead>
                        <TableHead className="text-center font-semibold">Data</TableHead>
                        <TableHead className="text-center font-semibold">Status</TableHead>
                        <TableHead className="text-right font-semibold">Total</TableHead>
                        <TableHead className="font-semibold">Tributos</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {reportNotas.map(n => (
                          <TableRow key={n.id} className="hover:bg-table-hover">
                            <TableCell className="text-sm">{n.tipo}</TableCell>
                            <TableCell className="font-mono font-bold">{n.numero}</TableCell>
                            <TableCell className="font-medium">{n.cliente}</TableCell>
                            <TableCell className="text-sm">{n.dataEmissao}</TableCell>
                            <TableCell className="text-center"><StatusBadge status={n.status} /></TableCell>
                            <TableCell className="font-semibold">{fmt(n.totalFinal)}</TableCell>
                            <TableCell className="text-sm">{fmt(n.tributos.reduce((s, t) => s + t.valorFinal, 0))}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50 font-bold">
                          <TableCell colSpan={5} className="text-right">Totais</TableCell>
                          <TableCell className="text-primary">{fmt(totalFaturado)}</TableCell>
                          <TableCell >{fmt(totalTributos)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Export buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCsv}>
                      <FileDown className="h-4 w-4" />CSV
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => handleExportReport("pdf")}>
                      <FileText className="h-4 w-4 text-red-600" />PDF
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => handleExportReport("excel")}>
                      <FileSpreadsheet className="h-4 w-4 text-green-600" />Excel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </SimpleFormWizard>
  );
};

function SummaryCard({ label, value, valueClass = "text-foreground" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="p-4 rounded bg-card border border-border">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className={`text-xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

// Need to import StatusBadge
import { StatusBadge } from "@/components/StatusBadge";

export default ExportacoesRelatorios;
