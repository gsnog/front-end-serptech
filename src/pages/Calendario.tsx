import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  X,
  List,
  Grid3X3,
  LayoutGrid
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { usePermissions } from '@/contexts/PermissionsContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
// Calendar types — defined locally (data/calendar-mock was deleted)
type EventType = 'reuniao' | 'prazo' | 'evento' | 'tarefa' | 'feriado' | 'pessoal';
interface CalendarParticipante { id: string; nome: string; confirmado: boolean; }
interface CalendarEvent {
  id: string; titulo: string; descricao?: string; tipo: EventType;
  dataInicio: string; horaInicio: string; dataFim: string; horaFim: string;
  criadorId: string; criadorNome?: string;
  participantes: CalendarParticipante[];
  setorId?: string; local?: string; cor?: string; privado?: boolean;
  // legacy aliases kept for compatibility
  inicio?: string; fim?: string;
}
const eventTypes: { id: EventType; label: string; color: string; value: EventType }[] = [
  { id: 'reuniao', label: 'Reunião', color: 'bg-blue-500', value: 'reuniao' },
  { id: 'prazo', label: 'Prazo', color: 'bg-red-500', value: 'prazo' },
  { id: 'evento', label: 'Evento', color: 'bg-purple-500', value: 'evento' },
  { id: 'tarefa', label: 'Tarefa', color: 'bg-yellow-500', value: 'tarefa' },
  { id: 'feriado', label: 'Feriado', color: 'bg-green-500', value: 'feriado' },
  { id: 'pessoal', label: 'Pessoal', color: 'bg-orange-500', value: 'pessoal' },
];
const getEventosVisiveis = (eventos: CalendarEvent[], _userId: string, _scope?: string) => eventos;
const getEventosPorPeriodo = (eventos: CalendarEvent[], _inicio: Date, _fim: Date) => eventos;
// Stubs for removed setoresMock / getSubordinados (pessoas-mock deleted)
const setoresMock: { id: string; nome: string; status: string }[] = [];
const getSubordinados = (_userId: string): { id: string; nome: string }[] => [];


import { cn } from '@/lib/utils';

type ViewMode = 'dia' | 'semana' | 'mes' | 'agenda';

const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function Calendario() {
  const navigate = useNavigate();
  const { currentUser, getScope, hasPermission } = usePermissions();
  const rawScope = getScope('calendario', 'all');
  // Normalize scope to only valid values for calendar
  const scope: 'self' | 'team' | 'all' = rawScope === 'area' ? 'team' : rawScope;

  const [viewMode, setViewMode] = useState<ViewMode>('mes');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filtros
  const [filterPessoa, setFilterPessoa] = useState('');
  const [filterSetor, setFilterSetor] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEquipe, setFilterEquipe] = useState(false);
  const [participanteSearch, setParticipanteSearch] = useState('');

  // Novo evento
  const [novoEvento, setNovoEvento] = useState({
    titulo: '',
    descricao: '',
    tipo: 'reuniao' as EventType,
    dataInicio: '',
    horaInicio: '09:00',
    dataFim: '',
    horaFim: '10:00',
    local: '',
    privado: false,
    participantes: [] as string[],
  });

  const currentUserId = String(currentUser?.userId || '9');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: rawEvents = [], isLoading } = useQuery({
    queryKey: ['agendaEvents'],
    queryFn: async () => {
      const res = await api.get('/api/agenda/events/');
      return res.data.map((e: any): CalendarEvent => ({
        id: String(e.id),
        titulo: e.titulo,
        descricao: e.descricao || '',
        tipo: e.tipo,
        dataInicio: e.data_inicio,
        horaInicio: e.hora_inicio?.substring(0, 5) || '00:00',
        dataFim: e.data_fim,
        horaFim: e.hora_fim?.substring(0, 5) || '00:00',
        criadorId: String(e.criador),
        criadorNome: e.criador_nome,
        participantes: (e.participantes_rel || []).map((p: any) => ({
          id: String(p.usuario.id),
          nome: p.usuario.first_name ? `${p.usuario.first_name} ${p.usuario.last_name || ''}`.trim() : p.usuario.username,
          confirmado: p.confirmado
        })),
        setorId: e.setor ? String(e.setor) : undefined,
        local: e.local || '',
        cor: e.cor,
        privado: e.privado
      }));
    }
  });

  // Fetch real system users for participant search
  const { data: systemUsers = [] } = useQuery({
    queryKey: ['systemUsers'],
    queryFn: async () => {
      const res = await api.get('/api/pessoas/lookup/');
      const list = Array.isArray(res.data) ? res.data : (res.data.results ?? []);
      return list.map((u: any) => ({
        id: String(u.id),
        nome: u.nome || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
        iniciais: (u.iniciais || (u.nome || u.first_name || u.username || '').slice(0, 2)).toUpperCase(),
        status: 'Ativo',
      }));
    },
  });

  // Eventos base (sem filtro de pessoa) para calcular pessoas disponíveis
  const eventosBase = useMemo(() => {
    let eventos = getEventosVisiveis(rawEvents, currentUserId, scope);

    if (filterEquipe && scope !== 'self') {
      const subordinados = getSubordinados(currentUserId);
      const subordinadosIds = [currentUserId, ...subordinados.map(s => s.id)];
      eventos = eventos.filter(e =>
        subordinadosIds.includes(e.criadorId) ||
        e.participantes.some(p => subordinadosIds.includes(p.id))
      );
    }

    if (filterSetor) {
      eventos = eventos.filter(e => e.setorId === filterSetor);
    }

    if (filterTipo) {
      eventos = eventos.filter(e => e.tipo === filterTipo);
    }

    return eventos;
  }, [rawEvents, scope, filterEquipe, filterSetor, filterTipo, currentUserId]);

  // Eventos visíveis (com filtro de pessoa aplicado)
  const eventosVisiveis = useMemo(() => {
    if (!filterPessoa) return eventosBase;
    return eventosBase.filter(e =>
      e.criadorId === filterPessoa ||
      e.participantes.some(p => p.id === filterPessoa)
    );
  }, [eventosBase, filterPessoa]);

  // Pessoas que possuem eventos no período (baseado nos eventos sem filtro de pessoa)
  const pessoasComEventos = useMemo(() => {
    const pessoaIds = new Set<string>();
    eventosBase.forEach(e => {
      pessoaIds.add(e.criadorId);
      e.participantes.forEach(p => pessoaIds.add(p.id));
    });
    return systemUsers.filter((p: any) => pessoaIds.has(p.id));
  }, [eventosBase]);

  const canCreate = hasPermission('calendario', 'all', 'create');
  const canEdit = hasPermission('calendario', 'all', 'edit');

  // Navegação
  const navigatePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'dia') newDate.setDate(newDate.getDate() - 1);
    else if (viewMode === 'semana') newDate.setDate(newDate.getDate() - 7);
    else newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'dia') newDate.setDate(newDate.getDate() + 1);
    else if (viewMode === 'semana') newDate.setDate(newDate.getDate() + 7);
    else newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Gerar dias do mês
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Dias do mês anterior
    for (let i = 0; i < firstDay.getDay(); i++) {
      const d = new Date(year, month, -firstDay.getDay() + i + 1);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Dias do mês atual
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Dias do próximo mês
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  };

  // Gerar horas do dia
  const getHoursOfDay = () => {
    const hours = [];
    for (let i = 6; i < 22; i++) {
      hours.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return hours;
  };

  // Gerar dias da semana
  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const formatDate = (date: Date) => {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return eventosVisiveis.filter(e => e.dataInicio === dateStr);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/api/agenda/events/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendaEvents'] });
      toast({ title: 'Evento excluído' });
      setShowEventModal(false);
    }
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        titulo: data.titulo,
        descricao: data.descricao,
        tipo: data.tipo,
        data_inicio: data.dataInicio,
        hora_inicio: data.horaInicio,
        data_fim: data.dataFim,
        hora_fim: data.horaFim,
        local: data.local,
        privado: data.privado,
        participantes: data.participantes.map(Number)
      };
      return await api.post('/api/agenda/events/', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendaEvents'] });
      toast({ title: 'Evento criado com sucesso' });
      setShowCreateModal(false);
      setNovoEvento({
        titulo: '',
        descricao: '',
        tipo: 'reuniao',
        dataInicio: '',
        horaInicio: '09:00',
        dataFim: '',
        horaFim: '10:00',
        local: '',
        privado: false,
        participantes: [],
      });
    },
    onError: () => {
      toast({ title: 'Erro ao criar evento', variant: 'destructive' });
    }
  });

  const handleCreateEvent = () => {
    createEventMutation.mutate(novoEvento);
  };

  const getEventTypeLabel = (tipo: EventType) => {
    return eventTypes.find(t => t.value === tipo)?.label || tipo;
  };

  const subordinados = scope === 'team' || scope === 'all' ? getSubordinados(currentUserId) : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoje
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={navigatePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            {viewMode === 'dia' && (
              <>
                {currentDate.getDate()} de {meses[currentDate.getMonth()]} de {currentDate.getFullYear()}
              </>
            )}
            {viewMode === 'semana' && (
              <>
                Semana de {getWeekDays()[0].getDate()} - {getWeekDays()[6].getDate()} de {meses[currentDate.getMonth()]} de {currentDate.getFullYear()}
              </>
            )}
            {(viewMode === 'mes' || viewMode === 'agenda') && (
              <>
                {meses[currentDate.getMonth()]} de {currentDate.getFullYear()}
              </>
            )}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Seletor de visualização */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="dia" className="gap-1">
                <CalendarIcon className="h-4 w-4" />
                Dia
              </TabsTrigger>
              <TabsTrigger value="semana" className="gap-1">
                <Grid3X3 className="h-4 w-4" />
                Semana
              </TabsTrigger>
              <TabsTrigger value="mes" className="gap-1">
                <LayoutGrid className="h-4 w-4" />
                Mês
              </TabsTrigger>
              <TabsTrigger value="agenda" className="gap-1">
                <List className="h-4 w-4" />
                Agenda
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-1" />
            Filtros
          </Button>

          {canCreate && (
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Novo Evento
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <Card className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            {(scope === 'team' || scope === 'all') && (
              <div className="flex flex-col gap-1.5 min-w-[180px]">
                <label className="filter-label">Equipe</label>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    id="filter-equipe"
                    checked={filterEquipe}
                    onCheckedChange={setFilterEquipe}
                  />
                  <Label htmlFor="filter-equipe" className="text-sm">
                    Minha equipe
                  </Label>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5 min-w-[180px]">
              <label className="filter-label">Pessoa</label>
              <Select value={filterPessoa || "__all__"} onValueChange={(v) => setFilterPessoa(v === "__all__" ? "" : v)}>
                <SelectTrigger className="filter-input">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas</SelectItem>
                  {pessoasComEventos.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5 min-w-[180px]">
              <label className="filter-label">Setor/Área</label>
              <Select value={filterSetor || "__all__"} onValueChange={(v) => setFilterSetor(v === "__all__" ? "" : v)}>
                <SelectTrigger className="filter-input">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  {setoresMock.filter(s => s.status === 'Ativo').map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5 min-w-[180px]">
              <label className="filter-label">Tipo de Evento</label>
              <Select value={filterTipo || "__all__"} onValueChange={(v) => setFilterTipo(v === "__all__" ? "" : v)}>
                <SelectTrigger className="filter-input">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  {eventTypes.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2 h-10"
                onClick={() => {
                  setFilterPessoa('');
                  setFilterSetor('');
                  setFilterTipo('');
                  setFilterEquipe(false);
                }}
              >
                <X className="h-4 w-4" />
                Limpar Filtros
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Visualização do Calendário */}
      <Card className="overflow-hidden">
        {/* Visão Mês */}
        {viewMode === 'mes' && (
          <div className="p-4">
            {/* Cabeçalho dias da semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {diasSemana.map(dia => (
                <div key={dia} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {dia}
                </div>
              ))}
            </div>

            {/* Grid de dias */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth().map((day, idx) => {
                const eventos = getEventsForDate(day.date);
                const isToday = formatDate(day.date) === '2026-02-04';

                return (
                  <div
                    key={idx}
                    className={cn(
                      "min-h-[100px] p-1 border border-border dark:border-[hsl(220_6%_15%)] rounded cursor-pointer hover:bg-muted/50 transition-colors",
                      !day.isCurrentMonth && "bg-muted/30 text-muted-foreground",
                      isToday && "border-primary dark:border-primary bg-primary/5"
                    )}
                    onClick={() => {
                      setCurrentDate(day.date);
                      setViewMode('dia');
                    }}
                  >
                    <div className={cn(
                      "text-sm font-medium mb-1",
                      isToday && "text-primary"
                    )}>
                      {day.date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {eventos.slice(0, 3).map(evento => (
                        <div
                          key={evento.id}
                          className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80"
                          style={{ backgroundColor: evento.cor + '20', color: evento.cor }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(evento);
                          }}
                        >
                          {evento.privado && scope !== 'all' ? 'Ocupado' : evento.titulo}
                        </div>
                      ))}
                      {eventos.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{eventos.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Visão Dia */}
        {viewMode === 'dia' && (
          <div className="p-4">
            <div className="grid grid-cols-[60px_1fr] gap-2">
              {getHoursOfDay().map(hour => {
                const eventos = eventosVisiveis.filter(e =>
                  e.dataInicio === formatDate(currentDate) &&
                  e.horaInicio.startsWith(hour.split(':')[0])
                );

                return (
                  <div key={hour} className="contents">
                    <div className="text-xs text-muted-foreground py-3 text-right pr-2">
                      {hour}
                    </div>
                    <div
                      className="border-t border-border dark:border-[hsl(220_6%_15%)] min-h-[48px] py-1 space-y-1 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        if (canCreate) {
                          const hourNum = hour.split(':')[0];
                          const nextHour = String(Number(hourNum) + 1).padStart(2, '0');
                          setNovoEvento(prev => ({
                            ...prev,
                            dataInicio: formatDate(currentDate),
                            dataFim: formatDate(currentDate),
                            horaInicio: hour,
                            horaFim: `${nextHour}:00`,
                          }));
                          setShowCreateModal(true);
                        }
                      }}
                    >
                      {eventos.map(evento => (
                        <div
                          key={evento.id}
                          className="p-2 rounded text-sm cursor-pointer hover:opacity-80"
                          style={{ backgroundColor: evento.cor + '20', borderLeft: `3px solid ${evento.cor}` }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(evento);
                          }}
                        >
                          <div className="font-medium" style={{ color: evento.cor }}>
                            {evento.privado && scope !== 'all' ? 'Ocupado' : evento.titulo}
                          </div>
                          {!evento.privado && (
                            <div className="text-xs text-muted-foreground">
                              {evento.horaInicio} - {evento.horaFim}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Visão Semana */}
        {viewMode === 'semana' && (
          <div className="p-4 overflow-x-auto">
            <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 min-w-[800px]">
              {/* Header */}
              <div className="py-2" />
              {getWeekDays().map((day, idx) => {
                const isToday = formatDate(day) === '2026-02-04';
                return (
                  <div
                    key={idx}
                    className={cn(
                      "text-center py-2 text-sm font-medium",
                      isToday && "text-primary"
                    )}
                  >
                    {diasSemana[idx]}
                    <div className={cn(
                      "text-lg",
                      isToday && "bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mx-auto"
                    )}>
                      {day.getDate()}
                    </div>
                  </div>
                );
              })}

              {/* Grid de horas */}
              {getHoursOfDay().map(hour => (
                <div key={hour} className="contents">
                  <div className="text-xs text-muted-foreground py-2 text-right pr-2">
                    {hour}
                  </div>
                  {getWeekDays().map((day, dayIdx) => {
                    const eventos = eventosVisiveis.filter(e =>
                      e.dataInicio === formatDate(day) &&
                      e.horaInicio.startsWith(hour.split(':')[0])
                    );

                    return (
                      <div
                        key={dayIdx}
                        className="border-t border-l border-border dark:border-[hsl(220_6%_15%)] min-h-[48px] p-0.5"
                      >
                        {eventos.map(evento => (
                          <div
                            key={evento.id}
                            className="p-1 rounded text-xs cursor-pointer hover:opacity-80 mb-0.5"
                            style={{ backgroundColor: evento.cor + '20', borderLeft: `2px solid ${evento.cor}` }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(evento);
                            }}
                          >
                            <div className="font-medium truncate" style={{ color: evento.cor }}>
                              {evento.privado && scope !== 'all' ? 'Ocupado' : evento.titulo}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visão Agenda */}
        {viewMode === 'agenda' && (
          <div className="divide-y">
            {eventosVisiveis
              .sort((a, b) => a.dataInicio.localeCompare(b.dataInicio))
              .map(evento => (
                <div
                  key={evento.id}
                  className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleEventClick(evento)}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-center min-w-[60px]">
                      <div className="text-2xl font-bold text-foreground">
                        {new Date(evento.dataInicio).getDate()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {meses[new Date(evento.dataInicio).getMonth()].slice(0, 3)}
                      </div>
                    </div>
                    <div
                      className="w-1 self-stretch rounded"
                      style={{ backgroundColor: evento.cor }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">
                          {evento.privado && scope !== 'all' ? 'Ocupado' : evento.titulo}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {getEventTypeLabel(evento.tipo)}
                        </Badge>
                      </div>
                      {!evento.privado && (
                        <>
                          <div className="text-sm text-muted-foreground flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {evento.horaInicio} - {evento.horaFim}
                            </span>
                            {evento.local && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {evento.local}
                              </span>
                            )}
                            {evento.participantes.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {evento.participantes.length} participantes
                              </span>
                            )}
                          </div>
                          {evento.descricao && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {evento.descricao}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            {eventosVisiveis.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                Nenhum evento encontrado
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Modal de detalhes do evento */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: selectedEvent?.cor }}
              />
              {selectedEvent?.privado && scope !== 'all'
                ? 'Evento Privado'
                : selectedEvent?.titulo
              }
            </DialogTitle>
          </DialogHeader>

          {selectedEvent && (!selectedEvent.privado || scope === 'all') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary">{getEventTypeLabel(selectedEvent.tipo)}</Badge>
                {selectedEvent.privado && (
                  <Badge variant="outline">Privado</Badge>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  {new Date(selectedEvent.dataInicio).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {selectedEvent.horaInicio} - {selectedEvent.horaFim}
                </div>
                {selectedEvent.local && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {selectedEvent.local}
                  </div>
                )}
              </div>

              {selectedEvent.descricao && (
                <div>
                  <Label className="text-xs text-muted-foreground">Descrição</Label>
                  <p className="text-sm mt-1">{selectedEvent.descricao}</p>
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">Criado por</Label>
                <p className="text-sm mt-1">{selectedEvent.criadorNome}</p>
              </div>

              {selectedEvent.participantes.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Participantes ({selectedEvent.participantes.length})
                  </Label>
                  <div className="mt-2 space-y-1">
                    {selectedEvent.participantes.map(p => (
                      <div key={p.id} className="flex items-center gap-2 text-sm">
                        <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs font-medium">
                          {p.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span>{p.nome}</span>
                        {p.confirmado ? (
                          <Badge variant="secondary" className="text-xs">Confirmado</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Pendente</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedEvent?.privado && scope !== 'all' && (
            <div className="text-center text-muted-foreground py-4">
              Este evento é privado. Você não tem permissão para ver os detalhes.
            </div>
          )}

          <DialogFooter>
            {canEdit && selectedEvent && (selectedEvent.criadorId === currentUserId || scope === 'all') && (
              <>
                <Button variant="outline">Editar</Button>
                <Button variant="destructive" onClick={() => deleteEventMutation.mutate(selectedEvent.id)}>Excluir</Button>
              </>
            )}
            <Button onClick={() => setShowEventModal(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de criar evento */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Novo Evento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto px-1 flex-1">
            <div>
              <Label>Título *</Label>
              <Input
                value={novoEvento.titulo}
                onChange={(e) => setNovoEvento({ ...novoEvento, titulo: e.target.value })}
                placeholder="Nome do evento"
              />
            </div>

            <div>
              <Label>Tipo *</Label>
              <Select
                value={novoEvento.tipo}
                onValueChange={(v) => setNovoEvento({ ...novoEvento, tipo: v as EventType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Início *</Label>
                <Input
                  type="date"
                  value={novoEvento.dataInicio}
                  onChange={(e) => setNovoEvento({ ...novoEvento, dataInicio: e.target.value })}
                />
              </div>
              <div>
                <Label>Hora Início *</Label>
                <Input
                  type="time"
                  value={novoEvento.horaInicio}
                  onChange={(e) => setNovoEvento({ ...novoEvento, horaInicio: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Fim *</Label>
                <Input
                  type="date"
                  value={novoEvento.dataFim}
                  onChange={(e) => setNovoEvento({ ...novoEvento, dataFim: e.target.value })}
                />
              </div>
              <div>
                <Label>Hora Fim *</Label>
                <Input
                  type="time"
                  value={novoEvento.horaFim}
                  onChange={(e) => setNovoEvento({ ...novoEvento, horaFim: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Local</Label>
              <Input
                value={novoEvento.local}
                onChange={(e) => setNovoEvento({ ...novoEvento, local: e.target.value })}
                placeholder="Sala, endereço ou link"
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={novoEvento.descricao}
                onChange={(e) => setNovoEvento({ ...novoEvento, descricao: e.target.value })}
                placeholder="Detalhes do evento"
                rows={3}
              />
            </div>

            <div>
              <Label>Participantes</Label>
              <Input
                placeholder="Buscar participante..."
                value={participanteSearch}
                onChange={(e) => setParticipanteSearch(e.target.value)}
                className="mt-2"
              />
              <div className="mt-2 max-h-40 overflow-y-auto border rounded p-2 space-y-1">
                {systemUsers.filter((p: any) => p.id !== currentUserId && p.nome.toLowerCase().includes(participanteSearch.toLowerCase())).map((p: any) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                    <Checkbox
                      checked={novoEvento.participantes.includes(p.id)}
                      onCheckedChange={(checked) => {
                        setNovoEvento(prev => ({
                          ...prev,
                          participantes: checked
                            ? [...prev.participantes, p.id]
                            : prev.participantes.filter(id => id !== p.id)
                        }));
                      }}
                    />
                    <span>{p.nome}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{p.cargo}</span>
                  </label>
                ))}
              </div>
              {novoEvento.participantes.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {novoEvento.participantes.length} pessoa(s) selecionada(s)
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="privado"
                checked={novoEvento.privado}
                onCheckedChange={(v) => setNovoEvento({ ...novoEvento, privado: v })}
              />
              <Label htmlFor="privado">Evento privado</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateEvent} disabled={!novoEvento.titulo || !novoEvento.dataInicio}>
              Criar Evento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
