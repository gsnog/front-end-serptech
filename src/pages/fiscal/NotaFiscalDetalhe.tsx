import { useParams, useNavigate } from "react-router-dom";
import { fmtDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { ArrowLeft, FileDown, RotateCcw, Send, XCircle, CheckCircle, AlertTriangle, Clock, FileText, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
// Fiscal-mock removed — stub until /api/fiscal/ endpoints exist
const mockNotasFiscais: any[] = [];

export default function NotaFiscalDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const nota = mockNotasFiscais.find(n => n.id === Number(id));

  if (!nota) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">Nota fiscal não encontrada.</p>
        <Button variant="outline" onClick={() => navigate("/fiscal/notas")}>Voltar</Button>
      </div>
    );
  }

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const statusIcon = () => {
    switch (nota.status) {
      case "Autorizada": return <CheckCircle className="h-5 w-5 text-primary" />;
      case "Rejeitada": return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case "Cancelada": return <XCircle className="h-5 w-5 text-destructive" />;
      case "Enviada": case "Em validação": return <Clock className="h-5 w-5 text-yellow-500" />;
      default: return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => navigate("/fiscal/notas")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          {statusIcon()}
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {nota.tipo} #{nota.numero} <span className="text-base font-normal text-muted-foreground">Série {nota.serie}</span>
            </h1>
            <p className="text-sm text-muted-foreground">{nota.cliente} — {nota.dataEmissao}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={nota.status} />
          {nota.status === "Rejeitada" && (
            <Button size="sm" variant="outline" className="gap-1" onClick={() => toast({ title: "Reenviando...", description: `Nota #${nota.numero}` })}>
              <RotateCcw className="h-4 w-4" />Reenviar
            </Button>
          )}
          {nota.status === "Autorizada" && (
            <Button size="sm" variant="outline" className="gap-1 text-destructive" onClick={() => toast({ title: "Cancelamento solicitado" })}>
              <XCircle className="h-4 w-4" />Cancelar
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="resumo">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="itens">Itens / Serviços</TabsTrigger>
          <TabsTrigger value="tributos">Tributos</TabsTrigger>
          <TabsTrigger value="eventos">Eventos API</TabsTrigger>
          <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
        </TabsList>

        {/* Resumo */}
        <TabsContent value="resumo">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Dados da Nota</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Tipo" value={nota.tipo} />
                <Row label="Número" value={`${nota.numero}`} />
                <Row label="Série" value={nota.serie} />
                <Row label="Data Emissão" value={nota.dataEmissao} />
                <Row label="Natureza" value={nota.naturezaOperacao} />
                <Row label="Status" value={nota.status} />
                <Row label="Último Retorno" value={nota.ultimoRetorno} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Cliente</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Nome/Razão" value={nota.cliente} />
                <Row label="CPF/CNPJ" value={nota.clienteCpfCnpj} />
                <Row label="Endereço" value={nota.clienteEndereco} />
                <Row label="Município/UF" value={`${nota.clienteMunicipio} / ${nota.clienteUf}`} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Totais</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Subtotal" value={fmt(nota.subtotal)} />
                <Row label="Descontos" value={fmt(nota.descontos)} />
                <Row label="Outras Despesas" value={fmt(nota.outrasDespesas)} />
                <div className="border-t border-border pt-2 flex justify-between font-bold">
                  <span>Total Final</span><span className="text-primary">{fmt(nota.totalFinal)}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Revisão</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Revisado pelo Contador" value={nota.revisadoContador ? "Sim" : "Não"} />
                {nota.revisadoContadorPor && <Row label="Revisor" value={nota.revisadoContadorPor} />}
                {nota.revisadoContadorEm && <Row label="Data Revisão" value={nota.revisadoContadorEm} />}
                {nota.observacoesFiscais && <Row label="Observações" value={nota.observacoesFiscais} />}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Itens */}
        <TabsContent value="itens">
          <Card>
            <CardContent className="pt-6">
              <div className="rounded border border-border overflow-hidden">
                <Table>
                  <TableHeader><TableRow className="bg-table-header">
                    <TableHead className="font-semibold">Código</TableHead>
                    <TableHead className="font-semibold">Descrição</TableHead>
                    <TableHead className="font-semibold">NCM</TableHead>
                    <TableHead className="font-semibold">CST</TableHead>
                    <TableHead className="text-right font-semibold">Qtd</TableHead>
                    <TableHead className="font-semibold">Vlr Unit.</TableHead>
                    <TableHead className="text-right font-semibold">Desconto</TableHead>
                    <TableHead className="text-right font-semibold">Total</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {nota.itens.map(item => (
                      <TableRow key={item.id} className="hover:bg-table-hover">
                        <TableCell className="font-mono text-xs">{item.itemCadastro}</TableCell>
                        <TableCell className="font-medium">{item.descricao}</TableCell>
                        <TableCell className="text-xs">{item.ncm || "—"}</TableCell>
                        <TableCell className="text-xs">{item.cst || "—"}</TableCell>
                        <TableCell >{item.quantidade}</TableCell>
                        <TableCell >{fmt(item.valorUnitario)}</TableCell>
                        <TableCell >{fmt(item.desconto)}</TableCell>
                        <TableCell className="font-semibold">{fmt(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tributos */}
        <TabsContent value="tributos">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="rounded border border-border overflow-hidden">
                <Table>
                  <TableHeader><TableRow className="bg-table-header">
                    <TableHead className="font-semibold">Imposto</TableHead>
                    <TableHead className="font-semibold">Base Cálculo</TableHead>
                    <TableHead className="font-semibold">Alíquota</TableHead>
                    <TableHead className="font-semibold">Calculado</TableHead>
                    <TableHead className="text-right font-semibold">Valor Final</TableHead>
                    <TableHead className="font-semibold">Ajustado por</TableHead>
                    <TableHead className="font-semibold">Justificativa</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {nota.tributos.map(t => {
                      const wasAdjusted = t.valorFinal !== t.valorCalculado;
                      return (
                        <TableRow key={t.imposto} className="hover:bg-table-hover">
                          <TableCell className="font-semibold">{t.imposto}</TableCell>
                          <TableCell >{fmt(t.baseCalculo)}</TableCell>
                          <TableCell >{t.aliquota}%</TableCell>
                          <TableCell className="text-muted-foreground">{fmt(t.valorCalculado)}</TableCell>
                          <TableCell className={`text-right font-semibold ${wasAdjusted ? "text-yellow-600 dark:text-yellow-400" : ""}`}>
                            {fmt(t.valorFinal)}
                            {wasAdjusted && <span className="ml-1 text-[10px]">✎</span>}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{t.ajustadoPor ? `${t.ajustadoPor} (${t.ajustadoEm})` : "—"}</TableCell>
                          <TableCell className="text-xs">{t.justificativa || "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Auditoria section */}
              {nota.auditoria.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Histórico de Alterações (Auditoria)</h3>
                  <div className="rounded border border-border overflow-hidden">
                    <Table>
                      <TableHeader><TableRow className="bg-table-header">
                        <TableHead className="font-semibold">Campo</TableHead>
                        <TableHead className="text-right font-semibold">Valor Anterior</TableHead>
                        <TableHead className="text-right font-semibold">Valor Novo</TableHead>
                        <TableHead className="font-semibold">Usuário</TableHead>
                        <TableHead className="text-center font-semibold">Data</TableHead>
                        <TableHead className="font-semibold">Justificativa</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {nota.auditoria.map(a => (
                          <TableRow key={a.id} className="hover:bg-table-hover">
                            <TableCell className="font-medium text-sm">{a.campo}</TableCell>
                            <TableCell className="text-sm text-destructive">{a.valorAnterior}</TableCell>
                            <TableCell className="text-sm text-primary">{a.valorNovo}</TableCell>
                            <TableCell className="text-sm">{a.usuario}</TableCell>
                            <TableCell className="text-center text-sm">{fmtDate(a.data)}</TableCell>
                            <TableCell className="text-xs">{a.justificativa || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Eventos API */}
        <TabsContent value="eventos">
          <Card>
            <CardContent className="pt-6">
              {nota.eventos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum evento registrado.</p>
              ) : (
                <div className="space-y-3">
                  {nota.eventos.map(ev => (
                    <div key={ev.id} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-muted/30">
                      <div className={`mt-0.5 flex-shrink-0 w-2 h-2 rounded-full ${ev.status === "Sucesso" || ev.status === "Autorizada" || ev.status === "Homologado" ? "bg-primary" :
                          ev.status === "Rejeitada" ? "bg-destructive" : "bg-yellow-500"
                        }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">{ev.tipo}</span>
                          <StatusBadge status={ev.status} className="text-[10px] min-w-0 px-2 py-0.5" />
                          <span className="text-xs text-muted-foreground ml-auto">{fmtDate(ev.data)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{ev.mensagem}</p>
                        {ev.protocolo && <p className="text-xs text-muted-foreground mt-0.5">Protocolo: <span className="font-mono">{ev.protocolo}</span></p>}
                        <p className="text-xs text-muted-foreground">Tentativa #{ev.tentativa}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Arquivos */}
        <TabsContent value="arquivos">
          <Card>
            <CardContent className="pt-6">
              {nota.arquivos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum arquivo disponível.</p>
              ) : (
                <div className="space-y-2">
                  {nota.arquivos.map(arq => (
                    <div key={arq.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${arq.tipo === "XML" ? "bg-blue-500/20 text-blue-600 dark:text-blue-400" : "bg-red-500/20 text-red-600 dark:text-red-400"}`}>
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{arq.nome}</p>
                          <p className="text-xs text-muted-foreground">{arq.tipo} • {arq.tamanho} • {arq.data}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-1" onClick={() => toast({ title: "Download", description: `Baixando ${arq.nome}...` })}>
                        <Download className="h-4 w-4" />Baixar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
