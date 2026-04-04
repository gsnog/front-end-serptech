import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FormActionBar } from "@/components/FormActionBar";
import { ClipboardCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  createOrdemServico, updateOrdemServico, fetchOrdemServico,
  ordensServicoQueryKey, fetchSoftware, softwareQueryKey,
  fetchUnidades, unidadesQueryKey,
} from "@/services/estoque";
import api from "@/lib/api";

const TIPOS_ORDEM = [
  { value: "servicos_gerais", label: "Serviços Gerais" },
  { value: "imobilizado", label: "Patrimônio / Imobilizado" },
  { value: "suporte", label: "Suporte de TI" },
];

const TIPOS_SERVICO = [
  { value: "Manutenção Preventiva", label: "Manutenção Preventiva" },
  { value: "Manutenção Emergencial", label: "Manutenção Emergencial" },
  { value: "Conserto", label: "Conserto" },
];

const TIPOS_SUPORTE = [
  { value: "Lentidão de Internet", label: "Lentidão de Internet" },
  { value: "Sem Acesso à Internet", label: "Sem Acesso à Internet" },
  { value: "Problema de Software", label: "Problema de Software" },
  { value: "Problema de Hardware", label: "Problema de Hardware" },
  { value: "Instalação de Software", label: "Instalação de Software" },
  { value: "Configuração de Equipamento", label: "Configuração de Equipamento" },
  { value: "Impressora / Scanner", label: "Impressora / Scanner" },
  { value: "E-mail / Acesso ao Sistema", label: "E-mail / Acesso ao Sistema" },
  { value: "Backup / Recuperação de Dados", label: "Backup / Recuperação de Dados" },
  { value: "Outro", label: "Outro" },
];

export default function NovaOrdemServico() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  // ── Dados do formulário pai ─────────────────────────────────────────────────
  const [tipoOrdem, setTipoOrdem] = useState("");
  const [descricao, setDescricao] = useState("");

  // ── Campos filho: Serviços Gerais ──────────────────────────────────────────
  const [sgUnidade, setSgUnidade] = useState("");
  const [sgSetor, setSgSetor] = useState("");
  const [sgTipoServico, setSgTipoServico] = useState("");

  // ── Campos filho: Imobilizado ──────────────────────────────────────────────
  const [imPatrimonio, setImPatrimonio] = useState("");
  const [imTipoServico, setImTipoServico] = useState("");

  // ── Campos filho: Suporte ──────────────────────────────────────────────────
  const [spTipoSuporte, setSpTipoSuporte] = useState("");
  const [spSoftware, setSpSoftware] = useState("none");

  // ── Dados de referência ────────────────────────────────────────────────────
  const { data: unidadesRaw = [] } = useQuery({ queryKey: unidadesQueryKey, queryFn: fetchUnidades });
  const unidades = (Array.isArray(unidadesRaw) ? unidadesRaw : (unidadesRaw as any)?.results ?? []) as any[];

  const { data: setoresRaw = [] } = useQuery({
    queryKey: ['setores-estoque'],
    queryFn: async () => { const r = await api.get('/api/setores-estoque/'); return Array.isArray(r.data) ? r.data : r.data?.results ?? []; },
  });

  const { data: patrimoniosRaw = [] } = useQuery({
    queryKey: ['patrimonio'],
    queryFn: async () => { const r = await api.get('/api/estoque/patrimonio/'); return Array.isArray(r.data) ? r.data : r.data?.results ?? []; },
  });

  const { data: softwares = [] } = useQuery({ queryKey: softwareQueryKey, queryFn: fetchSoftware });

  // ── Carrega para edição ────────────────────────────────────────────────────
  const { data: existingOrder } = useQuery({
    queryKey: ['ordemServico', id],
    queryFn: () => fetchOrdemServico(Number(id)),
    enabled: isEditing,
  });

  useEffect(() => {
    if (!existingOrder) return;
    setTipoOrdem(existingOrder.tipo_de_ordem || "");
    setDescricao(existingOrder.descricao || "");

    const gerais = existingOrder.filho_servicos_gerais?.[0];
    if (gerais) {
      setSgUnidade(String(gerais.unidade));
      setSgSetor(String(gerais.setor));
      setSgTipoServico(gerais.tipo_servico);
    }
    const imob = existingOrder.filho_imobilizado?.[0];
    if (imob) {
      setImPatrimonio(String(imob.patrimonio));
      setImTipoServico(imob.tipo_servico);
    }
    const sup = existingOrder.filho_suporte?.[0];
    if (sup) {
      setSpTipoSuporte(sup.tipo_suporte);
      setSpSoftware(sup.software ? String(sup.software) : "none");
    }
  }, [existingOrder]);

  // ── Mutation ───────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: (payload: any) =>
      isEditing ? updateOrdemServico(Number(id), payload) : createOrdemServico(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordensServicoQueryKey });
      toast({ title: isEditing ? "Ordem de serviço atualizada!" : "Ordem de serviço criada!" });
      navigate("/estoque/ordem-servico");
    },
    onError: (error: any) => {
      const msgs = error.response?.data && typeof error.response.data === "object"
        ? Object.entries(error.response.data).map(([k, v]) => `${k}: ${v}`).join(" | ")
        : "Verifique os dados e tente novamente.";
      toast({ title: "Erro ao salvar", description: msgs, variant: "destructive" });
    },
  });

  const handleSalvar = () => {
    if (!tipoOrdem || !descricao) {
      toast({ title: "Campos obrigatórios", description: "Preencha o tipo de ordem e a descrição.", variant: "destructive" });
      return;
    }

    let filho: Record<string, any> = {};

    if (tipoOrdem === "servicos_gerais") {
      if (!sgUnidade || !sgSetor || !sgTipoServico) {
        toast({ title: "Campos obrigatórios", description: "Preencha unidade, setor e tipo de serviço.", variant: "destructive" });
        return;
      }
      filho = { unidade: parseInt(sgUnidade), setor: parseInt(sgSetor), tipo_servico: sgTipoServico };
    } else if (tipoOrdem === "imobilizado") {
      if (!imPatrimonio || !imTipoServico) {
        toast({ title: "Campos obrigatórios", description: "Preencha o patrimônio e o tipo de serviço.", variant: "destructive" });
        return;
      }
      filho = { patrimonio: parseInt(imPatrimonio), tipo_servico: imTipoServico };
    } else if (tipoOrdem === "suporte") {
      if (!spTipoSuporte) {
        toast({ title: "Campos obrigatórios", description: "Selecione o tipo de suporte.", variant: "destructive" });
        return;
      }
      filho = { tipo_suporte: spTipoSuporte, software: spSoftware && spSoftware !== "none" ? parseInt(spSoftware) : null };
    }

    mutation.mutate({ tipo_de_ordem: tipoOrdem, descricao, filho });
  };

  return (
    <SimpleFormWizard title={isEditing ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}>
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <ClipboardCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Dados da Ordem de Serviço</h2>
                <p className="text-sm text-muted-foreground">Preencha as informações abaixo</p>
              </div>
            </div>

            {/* Tipo de Ordem */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo de Ordem <span className="text-destructive">*</span></Label>
                <Select value={tipoOrdem} onValueChange={setTipoOrdem}>
                  <SelectTrigger className="form-input"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    {TIPOS_ORDEM.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Descrição <span className="text-destructive">*</span></Label>
              <Textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva o problema ou serviço solicitado"
                className="form-input min-h-[100px]"
              />
            </div>

            {/* ── Campos condicionais: Serviços Gerais ── */}
            {tipoOrdem === "servicos_gerais" && (
              <div className="border-t pt-5 space-y-4">
                <p className="text-sm font-semibold text-foreground">Detalhes — Serviços Gerais</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Unidade <span className="text-destructive">*</span></Label>
                    <Select value={sgUnidade} onValueChange={setSgUnidade}>
                      <SelectTrigger className="form-input"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent className="bg-popover">
                        {unidades.map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.unidade}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Setor <span className="text-destructive">*</span></Label>
                    <Select value={sgSetor} onValueChange={setSgSetor}>
                      <SelectTrigger className="form-input"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent className="bg-popover">
                        {setoresRaw.map((s: any) => <SelectItem key={s.id} value={String(s.id)}>{s.setor}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tipo de Serviço <span className="text-destructive">*</span></Label>
                    <Select value={sgTipoServico} onValueChange={setSgTipoServico}>
                      <SelectTrigger className="form-input"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent className="bg-popover">
                        {TIPOS_SERVICO.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* ── Campos condicionais: Imobilizado ── */}
            {tipoOrdem === "imobilizado" && (
              <div className="border-t pt-5 space-y-4">
                <p className="text-sm font-semibold text-foreground">Detalhes — Patrimônio / Imobilizado</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Patrimônio <span className="text-destructive">*</span></Label>
                    <Select value={imPatrimonio} onValueChange={setImPatrimonio}>
                      <SelectTrigger className="form-input"><SelectValue placeholder="Selecione o patrimônio" /></SelectTrigger>
                      <SelectContent className="bg-popover">
                        {patrimoniosRaw.map((p: any) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.codigo} — {p.item_nome || `Item #${p.item}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tipo de Serviço <span className="text-destructive">*</span></Label>
                    <Select value={imTipoServico} onValueChange={setImTipoServico}>
                      <SelectTrigger className="form-input"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent className="bg-popover">
                        {TIPOS_SERVICO.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* ── Campos condicionais: Suporte ── */}
            {tipoOrdem === "suporte" && (
              <div className="border-t pt-5 space-y-4">
                <p className="text-sm font-semibold text-foreground">Detalhes — Suporte de TI</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tipo de Suporte <span className="text-destructive">*</span></Label>
                    <Select value={spTipoSuporte} onValueChange={setSpTipoSuporte}>
                      <SelectTrigger className="form-input"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent className="bg-popover">
                        {TIPOS_SUPORTE.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Software (opcional)</Label>
                    <Select value={spSoftware} onValueChange={setSpSoftware}>
                      <SelectTrigger className="form-input"><SelectValue placeholder="Selecione se aplicável" /></SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="none">Nenhum</SelectItem>
                        {softwares.map((s: any) => <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            <FormActionBar
              onSave={handleSalvar}
              onCancel={() => navigate("/estoque/ordem-servico")}
              isSaving={mutation.isPending}
            />
          </div>
        </CardContent>
      </Card>
    </SimpleFormWizard>
  );
}
