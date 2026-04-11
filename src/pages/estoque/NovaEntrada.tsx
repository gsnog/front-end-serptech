import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FormActionBar } from "@/components/FormActionBar";
import { PackagePlus, Trash2, Upload, FileText, Lock, UserPlus, Factory } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/SearchableSelect";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  fetchFornecedores, fetchItensEstoque, fetchUnidades,
  fornecedoresQueryKey, itensEstoqueQueryKey, unidadesQueryKey,
  createFornecedor,
} from "@/services/estoque";

interface ItemEntrada {
  id: number;
  itemId: string;
  itemNome: string;
  quantidade: string;
  custoUnitario: string;
}

interface ItemInsumo {
  id: number;
  itemId: string;
  itemNome: string;
  quantidade: string;
  estoqueOrigemId: string;
  estoqueOrigemNome: string;
}

export default function NovaEntrada() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  // ── API data ──────────────────────────────────────────────────────────────
  const { data: fornecedoresRaw = [] } = useQuery({ queryKey: fornecedoresQueryKey, queryFn: fetchFornecedores });
  const fornecedores = (Array.isArray(fornecedoresRaw) ? fornecedoresRaw : (fornecedoresRaw as any)?.results ?? []) as any[];

  const { data: itensRaw = [] } = useQuery({ queryKey: itensEstoqueQueryKey, queryFn: fetchItensEstoque });
  const itensEstoque = (Array.isArray(itensRaw) ? itensRaw : (itensRaw as any)?.results ?? []) as any[];

  const { data: unidadesRaw = [] } = useQuery({ queryKey: unidadesQueryKey, queryFn: fetchUnidades });
  const unidades = (Array.isArray(unidadesRaw) ? unidadesRaw : (unidadesRaw as any)?.results ?? []) as any[];

  const fornecedorOptions = fornecedores.map((f: any) => ({ value: String(f.id), label: f.nome }));
  const itemOptions = itensEstoque.map((i: any) => ({ value: String(i.id), label: i.itens_do_estoque }));
  const unidadeOptions = unidades.map((u: any) => ({ value: String(u.id), label: u.unidade }));

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (data: any) => (await api.post('/api/estoque/entradas/', data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entradas_estoque'] });
      toast({ title: "Entrada cadastrada com sucesso!" });
      navigate("/estoque/entradas");
    },
    onError: (error: any) => {
      const errData = error.response?.data;
      const msgs = errData && typeof errData === "object"
        ? Object.entries(errData).map(([k, v]) => `${k}: ${v}`).join(" | ")
        : "Ocorreu um erro ao salvar.";
      toast({ title: "Erro ao salvar", description: msgs, variant: "destructive" });
    },
    onSettled: () => setIsSaving(false),
  });

  const xmlMutation = useMutation({
    mutationFn: async (formData: FormData) =>
      (await api.post('/api/estoque/entradas/importar-xml/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entradas_estoque'] });
      toast({ title: "NF-e importada com sucesso!" });
      navigate("/estoque/entradas");
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail;
      const msgs = detail ?? (
        error.response?.data && typeof error.response.data === "object"
          ? Object.entries(error.response.data).map(([k, v]) => `${k}: ${v}`).join(" | ")
          : "Ocorreu um erro ao importar o XML."
      );
      toast({ title: "Erro ao importar XML", description: msgs, variant: "destructive" });
    },
    onSettled: () => setIsSaving(false),
  });

  // ── Form state ────────────────────────────────────────────────────────────
  const [modoEntrada, setModoEntrada] = useState<"manual" | "xml" | "producao_local">("manual");
  const [fornecedorId, setFornecedorId] = useState("");
  const [fornecedorXml, setFornecedorXml] = useState("");
  const [estoqueDestinoId, setEstoqueDestinoId] = useState("");
  const [nfNumero, setNfNumero] = useState("");
  const [dataEntrada, setDataEntrada] = useState("");
  const [dataEmissao, setDataEmissao] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [observacao, setObservacao] = useState("");
  const [xmlFile, setXmlFile] = useState<File | null>(null);
  const [xmlImported, setXmlImported] = useState(false);
  const [xmlFornecedorNotFound, setXmlFornecedorNotFound] = useState(false);
  const [pdfNf, setPdfNf] = useState<File | null>(null);
  const [pdfBoleto, setPdfBoleto] = useState<File | null>(null);

  // Dialog cadastro de fornecedor (apenas modo XML)
  const [showFornecedorDialog, setShowFornecedorDialog] = useState(false);
  const [fornecedorDialogNome, setFornecedorDialogNome] = useState("");
  const [fornecedorDialogCnpj, setFornecedorDialogCnpj] = useState("");
  const [fornecedorDialogRazaoSocial, setFornecedorDialogRazaoSocial] = useState("");
  const [fornecedorDialogEmail, setFornecedorDialogEmail] = useState("");
  const [fornecedorDialogTelefone, setFornecedorDialogTelefone] = useState("");
  const [isSavingFornecedor, setIsSavingFornecedor] = useState(false);

  // Items (itens produzidos / itens da nota)
  const [itens, setItens] = useState<ItemEntrada[]>([]);
  const [itemSelecionado, setItemSelecionado] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [custoUnitario, setCustoUnitario] = useState("");

  // Insumos (apenas produção local)
  const [insumos, setInsumos] = useState<ItemInsumo[]>([]);
  const [insumoSelecionado, setInsumoSelecionado] = useState("");
  const [insumoQuantidade, setInsumoQuantidade] = useState("");
  const [insumoEstoqueOrigemId, setInsumoEstoqueOrigemId] = useState("");

  // Saldo disponível do insumo selecionado na unidade de origem
  const { data: saldoDisponivel, isFetching: isFetchingSaldo } = useQuery({
    queryKey: ['inventario_insumo', insumoSelecionado, insumoEstoqueOrigemId],
    queryFn: async () => {
      const res = await api.get('/api/estoque/inventario/', {
        params: { item: insumoSelecionado, unidade: insumoEstoqueOrigemId },
      });
      const items: any[] = Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
      return (items[0]?.quantidade_disponivel ?? 0) as number;
    },
    enabled: !!insumoSelecionado && !!insumoEstoqueOrigemId,
    staleTime: 30_000,
  });

  // Quantidade já reservada por insumos já adicionados na mesma combinação item+unidade
  const qtdJaReservada = useMemo(() =>
    insumos
      .filter(i => i.itemId === insumoSelecionado && i.estoqueOrigemId === insumoEstoqueOrigemId)
      .reduce((acc, i) => acc + (parseFloat(i.quantidade) || 0), 0),
    [insumos, insumoSelecionado, insumoEstoqueOrigemId]
  );

  const saldoLivre = saldoDisponivel !== undefined ? saldoDisponivel - qtdJaReservada : undefined;

  // Limpa a quantidade ao trocar item ou unidade para evitar confusão
  useEffect(() => { setInsumoQuantidade(""); }, [insumoSelecionado, insumoEstoqueOrigemId]);

  const isFieldLocked = xmlImported && modoEntrada === "xml";

  const valorTotal = useMemo(() =>
    itens.reduce((acc, i) => acc + (parseFloat(i.quantidade) || 0) * (parseFloat(i.custoUnitario) || 0), 0),
    [itens]
  );

  // ── Item helpers ──────────────────────────────────────────────────────────
  const handleAddItem = () => {
    if (!itemSelecionado || !quantidade) {
      toast({ title: "Selecione o item e informe a quantidade", variant: "destructive" });
      return;
    }
    const found = itensEstoque.find((i: any) => String(i.id) === itemSelecionado);
    setItens(prev => [...prev, {
      id: Date.now(),
      itemId: itemSelecionado,
      itemNome: found?.itens_do_estoque ?? itemSelecionado,
      quantidade,
      custoUnitario: custoUnitario || "0",
    }]);
    setItemSelecionado("");
    setQuantidade("");
    setCustoUnitario("");
  };

  const handleRemoveItem = (id: number) => setItens(prev => prev.filter(i => i.id !== id));

  // ── Insumo helpers ────────────────────────────────────────────────────────
  const handleAddInsumo = () => {
    if (!insumoSelecionado) {
      toast({ title: "Selecione o item insumo", variant: "destructive" });
      return;
    }
    if (!insumoQuantidade) {
      toast({ title: "Informe a quantidade do insumo", variant: "destructive" });
      return;
    }
    if (!insumoEstoqueOrigemId) {
      toast({ title: "Informe o estoque de origem do insumo", variant: "destructive" });
      return;
    }
    const qtdSolicitada = parseFloat(insumoQuantidade) || 0;
    if (qtdSolicitada <= 0) {
      toast({ title: "A quantidade deve ser maior que zero", variant: "destructive" });
      return;
    }
    if (saldoLivre !== undefined && qtdSolicitada > saldoLivre) {
      toast({
        title: "Quantidade insuficiente em estoque",
        description: `Saldo disponível: ${saldoLivre} unidade(s).`,
        variant: "destructive",
      });
      return;
    }
    const foundItem = itensEstoque.find((i: any) => String(i.id) === insumoSelecionado);
    const foundUnidade = unidades.find((u: any) => String(u.id) === insumoEstoqueOrigemId);
    setInsumos(prev => [...prev, {
      id: Date.now(),
      itemId: insumoSelecionado,
      itemNome: foundItem?.itens_do_estoque ?? insumoSelecionado,
      quantidade: insumoQuantidade,
      estoqueOrigemId: insumoEstoqueOrigemId,
      estoqueOrigemNome: foundUnidade?.unidade ?? insumoEstoqueOrigemId,
    }]);
    setInsumoSelecionado("");
    setInsumoQuantidade("");
    setInsumoEstoqueOrigemId("");
  };

  const handleRemoveInsumo = (id: number) => setInsumos(prev => prev.filter(i => i.id !== id));

  // ── Cadastrar fornecedor via dialog (apenas modo XML) ────────────────────────────
  const handleSaveFornecedor = async () => {
    if (!fornecedorDialogNome.trim()) {
      toast({ title: "Nome do fornecedor é obrigatório", variant: "destructive" });
      return;
    }
    setIsSavingFornecedor(true);
    try {
      const novo = await createFornecedor({
        nome: fornecedorDialogNome,
        cnpj: fornecedorDialogCnpj || undefined,
        razao_social: fornecedorDialogRazaoSocial || undefined,
        email: fornecedorDialogEmail || undefined,
        telefone: fornecedorDialogTelefone || undefined,
      });
      setFornecedorId(String(novo.id));
      queryClient.invalidateQueries({ queryKey: fornecedoresQueryKey });
      toast({ title: "Fornecedor cadastrado", description: `"${fornecedorDialogNome}" adicionado com sucesso.` });
      setShowFornecedorDialog(false);
      setXmlFornecedorNotFound(false);
    } catch {
      toast({ title: "Erro ao cadastrar fornecedor", variant: "destructive" });
    } finally {
      setIsSavingFornecedor(false);
    }
  };

  // ── XML import ────────────────────────────────────────────────────────────
  const handleXmlUpload = () => {
    if (!xmlFile) { toast({ title: "Selecione um arquivo XML", variant: "destructive" }); return; }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        if (xmlDoc.querySelector("parsererror")) {
          toast({ title: "XML inválido", variant: "destructive" });
          return;
        }

        const ns = "http://www.portalfiscal.inf.br/nfe";
        const infNFe =
          xmlDoc.getElementsByTagNameNS(ns, "infNFe")[0] ||
          xmlDoc.querySelector("infNFe") ||
          xmlDoc.getElementsByTagName("infNFe")[0];

        if (!infNFe) {
          toast({ title: "XML não reconhecido como NF-e", description: "Elemento infNFe não encontrado.", variant: "destructive" });
          return;
        }

        const getEl = (parent: Element, tag: string) =>
          parent.getElementsByTagNameNS(ns, tag)[0] ||
          parent.querySelector(tag) ||
          parent.getElementsByTagName(tag)[0];

        const ide = getEl(infNFe, "ide");
        const emit = getEl(infNFe, "emit");
        const cobr = getEl(infNFe, "cobr");

        if (ide) {
          const nNF = getEl(ide, "nNF")?.textContent || "";
          const dhEmi = getEl(ide, "dhEmi")?.textContent || "";
          const dEmi = getEl(ide, "dEmi")?.textContent || "";
          if (nNF) setNfNumero(nNF);
          const dataStr = dhEmi ? dhEmi.substring(0, 10) : dEmi.substring(0, 10);
          if (dataStr) { setDataEmissao(dataStr); setDataEntrada(dataStr); }
        }

        if (emit) {
          const xNome = getEl(emit, "xNome")?.textContent?.trim() || "";
          const cnpjRaw = getEl(emit, "CNPJ")?.textContent?.trim() || "";
          if (xNome) {
            setFornecedorXml(xNome);
            const cnpjFmt = cnpjRaw
              ? cnpjRaw.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
              : "";
            const found = fornecedores.find((f: any) => f.nome?.toLowerCase() === xNome.toLowerCase());
            if (found) {
              setFornecedorId(String(found.id));
              setXmlFornecedorNotFound(false);
            } else {
              setFornecedorDialogNome(xNome);
              setFornecedorDialogCnpj(cnpjFmt);
              setFornecedorDialogRazaoSocial(xNome);
              setFornecedorDialogEmail("");
              setFornecedorDialogTelefone("");
              setXmlFornecedorNotFound(true);
            }
          }
        }

        if (cobr) {
          const dup = getEl(cobr, "dup");
          if (dup) {
            const dVenc = getEl(dup, "dVenc")?.textContent || "";
            if (dVenc) setDataVencimento(dVenc);
          }
        }

        const detList = Array.from(
          infNFe.getElementsByTagNameNS(ns, "det").length > 0
            ? infNFe.getElementsByTagNameNS(ns, "det")
            : infNFe.getElementsByTagName("det")
        );

        const parsedItens: ItemEntrada[] = [];
        detList.forEach((det, i) => {
          const prod =
            det.getElementsByTagNameNS(ns, "prod")[0] ||
            det.getElementsByTagName("prod")[0];
          if (!prod) return;
          const v = (tag: string) =>
            (prod.getElementsByTagNameNS(ns, tag)[0] || prod.getElementsByTagName(tag)[0])?.textContent || "";
          const xProd = v("xProd");
          const qCom = v("qCom");
          const vUnCom = v("vUnCom");
          const matched = itensEstoque.find(
            (it: any) => it.itens_do_estoque?.toLowerCase() === xProd.toLowerCase()
          );
          parsedItens.push({
            id: Date.now() + i,
            itemId: matched ? String(matched.id) : "",
            itemNome: xProd,
            quantidade: qCom ? String(parseFloat(qCom)) : "1",
            custoUnitario: vUnCom ? String(parseFloat(vUnCom)) : "0",
          });
        });

        if (parsedItens.length > 0) {
          setItens(parsedItens);
          setXmlImported(true);
          toast({ title: "XML importado com sucesso!", description: `${parsedItens.length} item(ns) extraídos.` });
        } else {
          toast({ title: "Nenhum item encontrado no XML", description: "Verifique se o arquivo é uma NF-e válida.", variant: "destructive" });
        }
      } catch (err) {
        console.error("Erro ao processar XML:", err);
        toast({ title: "Erro ao processar XML", description: "Verifique o arquivo e tente novamente.", variant: "destructive" });
      }
    };

    reader.onerror = () => {
      toast({ title: "Erro ao ler o arquivo", variant: "destructive" });
    };

    reader.readAsText(xmlFile, "UTF-8");
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSalvar = () => {
    if (!estoqueDestinoId) {
      toast({ title: "Selecione o estoque de destino", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    // Modo XML
    if (modoEntrada === "xml") {
      if (!xmlFile) {
        toast({ title: "Selecione e importe um arquivo XML antes de enviar", variant: "destructive" });
        setIsSaving(false);
        return;
      }
      const formData = new FormData();
      formData.append('xml_file', xmlFile);
      formData.append('unidade', estoqueDestinoId);
      if (pdfNf) formData.append('pdf_nf', pdfNf);
      if (pdfBoleto) formData.append('pdf_ticket', pdfBoleto);
      xmlMutation.mutate(formData);
      return;
    }

    // Modo Produção Local
    if (modoEntrada === "producao_local") {
      if (itens.length === 0 || !itens[0].itemId) {
        toast({ title: "Informe o item produzido", variant: "destructive" });
        setIsSaving(false);
        return;
      }
      if (insumos.length === 0) {
        toast({ title: "Adicione ao menos um insumo utilizado na produção", variant: "destructive" });
        setIsSaving(false);
        return;
      }

      const payload = {
        tipo: "producao_local",
        data: dataEntrada || new Date().toISOString().split("T")[0],
        estoque_destino: parseInt(estoqueDestinoId),
        custo_total: 0,
        observacao: observacao || "",
        itens: itens.map(i => ({
          item_id: parseInt(i.itemId),
          quantidade: parseFloat(i.quantidade) || 1,
          custo_unitario: 0,
        })),
        insumos: insumos.map(i => ({
          item_id: parseInt(i.itemId),
          quantidade: parseFloat(i.quantidade) || 1,
          estoque_origem_id: parseInt(i.estoqueOrigemId),
        })),
      };
      createMutation.mutate(payload);
      return;
    }

    // Modo manual
    if (itens.length === 0) {
      toast({ title: "Adicione pelo menos um item", variant: "destructive" });
      setIsSaving(false);
      return;
    }

    const itensCadastrados = itens
      .filter(i => i.itemId)
      .map(i => ({ item_id: parseInt(i.itemId), quantidade: parseFloat(i.quantidade) || 1, custo_unitario: parseFloat(i.custoUnitario) || 0 }));

    const itensNovos = itens
      .filter(i => !i.itemId)
      .map(i => ({ nome_item: i.itemNome, quantidade: parseFloat(i.quantidade) || 1, custo_unitario: parseFloat(i.custoUnitario) || 0 }));

    const payload: any = {
      tipo: "compra",
      data: dataEntrada || new Date().toISOString().split("T")[0],
      estoque_destino: parseInt(estoqueDestinoId),
      custo_total: valorTotal,
      observacao: observacao || "",
      itens: itensCadastrados,
      itens_precadastro: itensNovos,
    };
    if (fornecedorId) payload.fornecedor = parseInt(fornecedorId);
    if (nfNumero) {
      payload.nota_fiscal_numero = nfNumero;
      payload.nota_fiscal_data_emissao = dataEmissao || dataEntrada || new Date().toISOString().split("T")[0];
    }

    createMutation.mutate(payload);
  };

  const handleChangeModo = (modo: "manual" | "xml" | "producao_local") => {
    setModoEntrada(modo);
    setXmlImported(false);
    setItens([]);
    setInsumos([]);
    setFornecedorId("");
    setNfNumero("");
    setDataEmissao("");
    setDataVencimento("");
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SimpleFormWizard title="Nova Entrada">
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8 space-y-6">

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
              <PackagePlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Dados da Entrada</h2>
              <p className="text-sm text-muted-foreground">Preencha os dados da nota e os itens recebidos</p>
            </div>
          </div>

          {/* Modo */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Modo de Cadastro</Label>
            <div className="flex gap-3 flex-wrap">
              <Button type="button" variant={modoEntrada === "manual" ? "default" : "outline"} className="gap-2 flex-1" onClick={() => handleChangeModo("manual")}>
                <FileText className="w-4 h-4" /> Cadastrar Manualmente
              </Button>
              <Button type="button" variant={modoEntrada === "xml" ? "default" : "outline"} className="gap-2 flex-1" onClick={() => handleChangeModo("xml")}>
                <Upload className="w-4 h-4" /> Importar XML
              </Button>
              <Button type="button" variant={modoEntrada === "producao_local" ? "default" : "outline"} className="gap-2 flex-1" onClick={() => handleChangeModo("producao_local")}>
                <Factory className="w-4 h-4" /> Produção Local
              </Button>
            </div>
          </div>

          {/* ── PRODUÇÃO LOCAL ──────────────────────────────────────────── */}
          {modoEntrada === "producao_local" && (
            <div className="p-4 border border-dashed border-border rounded bg-muted/30 space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Registre itens produzidos internamente. Os insumos utilizados serão baixados automaticamente do inventário ao aprovar.
              </p>
              <p className="text-xs text-muted-foreground">Não é necessário nota fiscal nem fornecedor.</p>
            </div>
          )}

          {modoEntrada === "xml" && (
            <div className="p-4 border border-dashed border-border rounded bg-muted/30 space-y-3">
              <Label className="text-sm font-medium">Arquivo XML da Nota Fiscal</Label>
              <div className="flex gap-3 items-end">
                <Input type="file" accept=".xml" onChange={(e) => setXmlFile(e.target.files?.[0] || null)} className="form-input file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
                <Button type="button" onClick={handleXmlUpload} className="gap-2"><Upload className="w-4 h-4" /> Importar</Button>
              </div>
              {fornecedorXml && <p className="text-sm">Fornecedor identificado: <strong>{fornecedorXml}</strong></p>}
              {isFieldLocked && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  <Lock className="w-3.5 h-3.5" /> Campos preenchidos pelo XML estão bloqueados
                </div>
              )}
            </div>
          )}

          {/* Row: Fornecedor + Estoque de Destino */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modoEntrada !== "producao_local" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Fornecedor</Label>
                <SearchableSelect
                  options={fornecedorOptions}
                  value={fornecedorId}
                  onValueChange={setFornecedorId}
                  placeholder="Selecione o fornecedor"
                  searchPlaceholder="Pesquisar fornecedor..."
                />
                {modoEntrada === "xml" && xmlFornecedorNotFound && !fornecedorId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-1 gap-2 text-amber-700 border-amber-400 hover:bg-amber-50"
                    onClick={() => setShowFornecedorDialog(true)}
                  >
                    <UserPlus className="w-4 h-4" />
                    Cadastrar fornecedor do XML
                  </Button>
                )}
              </div>
            )}
            <div className={modoEntrada === "producao_local" ? "md:col-span-2 space-y-2" : "space-y-2"}>
              <Label className="text-sm font-medium">Estoque de Destino <span className="text-destructive">*</span></Label>
              <Select value={estoqueDestinoId} onValueChange={setEstoqueDestinoId}>
                <SelectTrigger className="form-input"><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
                <SelectContent className="bg-popover">
                  {unidades.map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.unidade}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Data de Entrada */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Data de Entrada <span className="text-destructive">*</span></Label>
              <Input type="date" value={dataEntrada} onChange={(e) => setDataEntrada(e.target.value)} className="form-input" disabled={isFieldLocked && !!dataEntrada} />
            </div>

            {/* NF number — oculto em produção local */}
            {modoEntrada !== "producao_local" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Número da NF</Label>
                <Input type="text" value={nfNumero} onChange={(e) => setNfNumero(e.target.value)} placeholder="Ex: 001234" className="form-input" disabled={isFieldLocked && !!nfNumero} />
              </div>
            )}
          </div>

          {/* Emissão + Vencimento — ocultos em produção local */}
          {modoEntrada !== "producao_local" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data de Emissão</Label>
                <Input type="date" value={dataEmissao} onChange={(e) => setDataEmissao(e.target.value)} className="form-input" disabled={isFieldLocked && !!dataEmissao} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data de Vencimento</Label>
                <Input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} className="form-input" disabled={isFieldLocked && !!dataVencimento} />
              </div>
            </div>
          )}

          {/* PDFs — ocultos em produção local */}
          {modoEntrada !== "producao_local" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">PDF da NF</Label>
                <Input type="file" accept=".pdf" onChange={(e) => setPdfNf(e.target.files?.[0] || null)} className="form-input file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">PDF do Boleto</Label>
                <Input type="file" accept=".pdf" onChange={(e) => setPdfBoleto(e.target.files?.[0] || null)} className="form-input file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
              </div>
            </div>
          )}

          {/* Observação */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Observação</Label>
            <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} className="form-input min-h-[80px]" placeholder="Observações sobre a entrada..." />
          </div>

          {/* ── ITEM PRODUZIDO (apenas produção local) ────────────────────── */}
          {modoEntrada === "producao_local" && (
            <div className="border-t pt-6 space-y-4">
              <h3 className="text-lg font-semibold">Item Produzido</h3>
              <p className="text-sm text-muted-foreground">O item deve estar previamente cadastrado no estoque.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-sm font-medium">Item <span className="text-destructive">*</span></Label>
                  <SearchableSelect
                    options={itemOptions}
                    value={itemSelecionado}
                    onValueChange={setItemSelecionado}
                    placeholder="Selecione o item produzido"
                    searchPlaceholder="Pesquisar item..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Quantidade <span className="text-destructive">*</span></Label>
                  <Input type="number" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} placeholder="Qtd" className="form-input" min="1" />
                </div>
                <div className="md:col-span-3">
                  <Button
                    type="button"
                    onClick={() => {
                      if (!itemSelecionado || !quantidade) {
                        toast({ title: "Selecione o item e informe a quantidade", variant: "destructive" });
                        return;
                      }
                      if (itens.length > 0) {
                        toast({ title: "Somente um item produzido por entrada. Remova o atual para alterar.", variant: "destructive" });
                        return;
                      }
                      const found = itensEstoque.find((i: any) => String(i.id) === itemSelecionado);
                      setItens([{
                        id: Date.now(),
                        itemId: itemSelecionado,
                        itemNome: found?.itens_do_estoque ?? itemSelecionado,
                        quantidade,
                        custoUnitario: "0",
                      }]);
                      setItemSelecionado("");
                      setQuantidade("");
                    }}
                  >
                    Definir Item Produzido
                  </Button>
                </div>
              </div>

              {itens.length > 0 && (
                <div className="rounded border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-table-header">
                        <TableHead>Item Produzido</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                        <TableHead className="text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itens.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.itemNome}</TableCell>
                          <TableCell className="text-right">{item.quantidade}</TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item.id)} className="text-destructive hover:text-destructive"><Trash2 size={16} /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          {/* ── INSUMOS (apenas produção local) ─────────────────────────── */}
          {modoEntrada === "producao_local" && (
            <div className="border-t pt-6 space-y-4">
              <h3 className="text-lg font-semibold">Insumos Utilizados</h3>
              <p className="text-sm text-muted-foreground">
                Informe os itens do inventário consumidos na produção. Ao aprovar, eles serão baixados automaticamente.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-sm font-medium">Insumo <span className="text-destructive">*</span></Label>
                  <SearchableSelect
                    options={itemOptions}
                    value={insumoSelecionado}
                    onValueChange={setInsumoSelecionado}
                    placeholder="Selecione o insumo"
                    searchPlaceholder="Pesquisar item..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Qtd <span className="text-destructive">*</span></Label>
                  <Input
                    type="number"
                    value={insumoQuantidade}
                    onChange={(e) => setInsumoQuantidade(e.target.value)}
                    placeholder="Qtd"
                    className={`form-input ${
                      saldoLivre !== undefined && parseFloat(insumoQuantidade) > saldoLivre
                        ? "border-destructive"
                        : ""
                    }`}
                    min="1"
                    max={saldoLivre !== undefined ? saldoLivre : undefined}
                  />
                  {insumoSelecionado && insumoEstoqueOrigemId && (
                    <p className={`text-xs ${
                      isFetchingSaldo
                        ? "text-muted-foreground"
                        : saldoLivre === 0
                          ? "text-destructive font-medium"
                          : saldoLivre !== undefined && parseFloat(insumoQuantidade) > saldoLivre
                            ? "text-destructive"
                            : "text-emerald-600"
                    }`}>
                      {isFetchingSaldo
                        ? "Verificando estoque..."
                        : saldoLivre === undefined
                          ? ""
                          : saldoLivre === 0
                            ? "Sem estoque disponível nesta unidade"
                            : `Disponível: ${saldoLivre} unidade(s)`}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Estoque de Origem <span className="text-destructive">*</span></Label>
                  <Select value={insumoEstoqueOrigemId} onValueChange={setInsumoEstoqueOrigemId}>
                    <SelectTrigger className="form-input"><SelectValue placeholder="Selecione o estoque" /></SelectTrigger>
                    <SelectContent className="bg-popover">
                      {unidades.map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.unidade}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-4">
                  <Button type="button" onClick={handleAddInsumo}>Adicionar Insumo</Button>
                </div>
              </div>

              <div className="rounded border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-table-header">
                      <TableHead>Insumo</TableHead>
                      <TableHead>Estoque de Origem</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {insumos.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Nenhum insumo adicionado</TableCell></TableRow>
                    ) : (
                      insumos.map((insumo) => (
                        <TableRow key={insumo.id}>
                          <TableCell>{insumo.itemNome}</TableCell>
                          <TableCell>{insumo.estoqueOrigemNome}</TableCell>
                          <TableCell className="text-right">{insumo.quantidade}</TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="sm" onClick={() => handleRemoveInsumo(insumo.id)} className="text-destructive hover:text-destructive"><Trash2 size={16} /></Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* ── ITENS DA NOTA (manual / xml) ─────────────────────────────── */}
          {modoEntrada !== "producao_local" && (
            <div className="border-t pt-6 space-y-4">
              <h3 className="text-lg font-semibold">Itens da Nota Fiscal</h3>

              {modoEntrada === "manual" && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-sm font-medium">Item</Label>
                    <SearchableSelect
                      options={itemOptions}
                      value={itemSelecionado}
                      onValueChange={setItemSelecionado}
                      placeholder="Selecione o item"
                      searchPlaceholder="Pesquisar item..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Quantidade</Label>
                    <Input type="number" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} placeholder="Qtd" className="form-input" min="1" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Custo Unitário (R$)</Label>
                    <Input type="number" step="0.01" value={custoUnitario} onChange={(e) => setCustoUnitario(e.target.value)} placeholder="0,00" className="form-input" />
                  </div>
                  <div className="md:col-span-4">
                    <Button type="button" onClick={handleAddItem}>Adicionar Item</Button>
                  </div>
                </div>
              )}

              <div className="rounded border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-table-header">
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead className="text-right">Custo Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      {!isFieldLocked && <TableHead className="text-center">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.length === 0 ? (
                      <TableRow><TableCell colSpan={isFieldLocked ? 4 : 5} className="text-center py-6 text-muted-foreground">Nenhum item adicionado</TableCell></TableRow>
                    ) : (
                      itens.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>{item.itemNome}</div>
                            {!item.itemId && <span className="text-xs text-amber-600">Pré-cadastro (item novo)</span>}
                          </TableCell>
                          <TableCell>{item.quantidade}</TableCell>
                          <TableCell className="text-right">R$ {parseFloat(item.custoUnitario || "0").toFixed(2).replace(".", ",")}</TableCell>
                          <TableCell className="text-right">R$ {((parseFloat(item.quantidade) || 0) * (parseFloat(item.custoUnitario) || 0)).toFixed(2).replace(".", ",")}</TableCell>
                          {!isFieldLocked && (
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item.id)} className="text-destructive hover:text-destructive"><Trash2 size={16} /></Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {valorTotal > 0 && (
                <div className="flex justify-end">
                  <span className="text-sm font-semibold">Valor Total: R$ {valorTotal.toFixed(2).replace(".", ",")}</span>
                </div>
              )}
            </div>
          )}

          {/* Itens XML sem match */}
          {isFieldLocked && itens.some(i => !i.itemId) && (
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm text-amber-700 font-medium">Alguns itens do XML não foram encontrados no estoque. Vincule-os ou deixe como pré-cadastro:</p>
              {itens.filter(i => !i.itemId).map(item => (
                <div key={item.id} className="flex items-center gap-4 p-3 border rounded">
                  <span className="flex-1 text-sm font-medium">{item.itemNome}</span>
                  <div className="w-64">
                    <SearchableSelect
                      options={itemOptions}
                      value={item.itemId}
                      onValueChange={(v) => setItens(prev => prev.map(i => i.id === item.id ? { ...i, itemId: v } : i))}
                      placeholder="Vincular a item existente"
                      searchPlaceholder="Pesquisar..."
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <FormActionBar
            onSave={handleSalvar}
            onCancel={() => navigate("/estoque/entradas")}
            isSaving={isSaving}
            saveLabel="Enviar para Aprovação"
          />
        </CardContent>
      </Card>

      {/* Dialog cadastro de fornecedor — apenas modo XML */}
      <Dialog open={showFornecedorDialog} onOpenChange={setShowFornecedorDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" /> Cadastrar Fornecedor
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            Dados extraídos do XML da NF-e. Revise e complete antes de salvar.
          </p>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Nome <span className="text-destructive">*</span></Label>
              <Input
                value={fornecedorDialogNome}
                onChange={(e) => setFornecedorDialogNome(e.target.value)}
                placeholder="Nome do fornecedor"
                className="form-input"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium">CNPJ</Label>
              <Input
                value={fornecedorDialogCnpj}
                onChange={(e) => setFornecedorDialogCnpj(e.target.value)}
                placeholder="00.000.000/0000-00"
                className="form-input"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium">Razão Social</Label>
              <Input
                value={fornecedorDialogRazaoSocial}
                onChange={(e) => setFornecedorDialogRazaoSocial(e.target.value)}
                placeholder="Razão social"
                className="form-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Email</Label>
                <Input
                  type="email"
                  value={fornecedorDialogEmail}
                  onChange={(e) => setFornecedorDialogEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="form-input"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">Telefone</Label>
                <Input
                  value={fornecedorDialogTelefone}
                  onChange={(e) => setFornecedorDialogTelefone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="form-input"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFornecedorDialog(false)}
              disabled={isSavingFornecedor}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveFornecedor}
              disabled={isSavingFornecedor}
            >
              {isSavingFornecedor ? "Salvando..." : "Salvar Fornecedor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SimpleFormWizard>
  );
}
