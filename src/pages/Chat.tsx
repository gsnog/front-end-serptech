import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Send,
  Paperclip,
  Smile,
  Users,
  Hash,
  User,
  Phone,
  Video,
  Info,
  X,
  ChevronDown,
  MessageSquare,
  UserPlus,
  Network,
  PhoneOff,
  VideoOff,
  Mic,
  MicOff,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWebRTCContext } from '@/contexts/WebRTCContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { usePermissions } from '@/contexts/PermissionsContext';
import { useChatContext } from '@/contexts/ChatContext';

// Utility helper to determine chat display info (robusto para IDs e objetos)
function getChatInfo(conversa: any, currentUserId: string) {
  if (!conversa) return { name: '', avatar: null, iniciais: '', online: false };

  if (conversa.tipo !== 'direto') {
    return {
      name: conversa.nome || 'Grupo',
      avatar: null,
      iniciais: (conversa.nome || 'G')[0],
      online: false
    };
  }

  const other = conversa.participantes?.find((p: any) => String(p?.id || p) !== String(currentUserId));

  const firstName = other?.first_name || other?.nome || '';
  const lastName = other?.last_name || '';
  const fullName = firstName ? `${firstName} ${lastName}`.trim() : (other?.username || 'Usuário');

  return {
    name: fullName,
    avatar: other?.profile_image || other?.avatar,
    iniciais: other?.iniciais || (firstName?.[0] || 'U'),
    online: !!other?.online
  };
}

// Chat types (previously from chat-mock — now defined locally)
interface ChatParticipante { id: string; nome: string; iniciais: string; online?: boolean; cargo?: string; setor?: string; }
interface ChatConversa {
  id: string; tipo: string; nome: string;
  ultimaMensagem?: string; ultimaMensagemData?: string;
  naoLidas?: number; membros?: string[];
  participantes?: ChatParticipante[];
  descricao?: string; criadorId?: string;
}
interface ChatMessage {
  id: string; conversaId: string;
  // aliases used in map from API
  remetenteId?: string; remetenteNome?: string; remetenteIniciais?: string;
  // original interface names
  autorId?: string; autorNome?: string;
  conteudo: string; tipo: string;
  criadoEm?: string; dataHora?: string;
  arquivoNome?: string; lido?: boolean;
}

import { PersonHierarchyPanel } from '@/components/chat/PersonHierarchyPanel';
import { ParticipantPicker } from '@/components/ParticipantPicker';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { chatSocket } from '@/lib/socket';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchLookup, lookupQueryKey } from '@/services/pessoas';

const EMOJI_LIST = ['😀', '😂', '😍', '👍', '👏', '🎉', '🔥', '❤️', '😎', '🤔', '😅', '🙌', '💪', '✅', '⭐', '🚀', '💡', '📌', '👋', '😊'];

export default function Chat() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userContext = usePermissions();
  const { hasPermission } = userContext;
  const authUser = userContext.currentUser as any;

  // XEQUE-MATE: O ID real no context é .userId
  const myId = authUser?.userId || authUser?.id || authUser?.pk || '';
  const currentUserId = String(myId);


  const { unreadCounts, clearUnread, setActiveChatId, lastMessages } = useChatContext();
  const [selectedConversa, setSelectedConversa] = useState<ChatConversa | null>(null);

  useEffect(() => {
    setActiveChatId(selectedConversa?.id || null);
    if (selectedConversa?.id) {
      clearUnread(selectedConversa.id);
    }
  }, [selectedConversa, setActiveChatId, clearUnread]);

  const currentUserObj = useMemo(() => ({
    nome: authUser?.first_name || authUser?.username || 'Eu',
    iniciais: (authUser?.first_name || authUser?.username)?.slice(0, 2).toUpperCase() || 'ME'
  }), [authUser]);

  const [novaMensagem, setNovaMensagem] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showHierarchyPanel, setShowHierarchyPanel] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMemberSelection, setAddMemberSelection] = useState<string[]>([]);
  const [selectedPessoa, setSelectedPessoa] = useState<any | null>(null);
  const [onlineStatus] = useState<Record<string, boolean>>({});

  const {
    localStream,
    remoteStream,
    callStatus,
    startCallTo,
    isMuted,
    isCameraOff,
    toggleMute,
    toggleCamera,
  } = useWebRTCContext();

  // Keep a local state for the UI modal so we can transition nicely,
  // or use the global one.
  const [showCallModal, setShowCallModal] = useState<'audio' | 'video' | null>(null);
  // callMuted/callVideoOff are derived from the real WebRTC state
  const callMuted = isMuted;
  const callVideoOff = isCameraOff;

  // New group modal state
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupSearch, setNewGroupSearch] = useState('');
  const [newGroupMembers, setNewGroupMembers] = useState<string[]>([]);

  // New chat modal search
  const [newChatSearch, setNewChatSearch] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch real users (permission-scoped) for Nova Conversa / Novo Grupo modals
  const { data: pessoasLookup = [] } = useQuery({
    queryKey: lookupQueryKey,
    queryFn: fetchLookup,
  });

  // Fetch chat groups
  const { data: conversas = [] } = useQuery({
    queryKey: ['chat-groups'],
    queryFn: async () => {
      const res = await api.get('/api/chat/groups/');
      return res.data.map((g: any) => ({
        id: String(g.id),
        tipo: g.is_private ? 'direto' : 'grupo',
        nome: g.name || g.members.find((m: any) => String(m.id || m.userId) !== currentUserId)?.first_name || 'Chat Privado',
        participantes: g.members.map((m: any) => ({
          ...m,
          id: String(m.id),
          nome: `${m.first_name} ${m.last_name}`.trim() || m.username,
          iniciais: m.username.slice(0, 2).toUpperCase(),
          online: onlineStatus[String(m.id)] ?? true
        })),
        naoLidas: g.unread_count || 0,
        ultimaMensagem: g.last_message?.content || '',
        ultimaMensagemData: g.last_message?.timestamp || ''
      }));
    }
  });

  // Fetch messages for active group
  const { data: mensagens = [] } = useQuery({
    queryKey: ['chat-messages', selectedConversa?.id],
    queryFn: async () => {
      if (!selectedConversa) return [];
      const res = await api.get(`/api/chat/messages/?group_id=${selectedConversa.id}`);
      return res.data.map((m: any) => ({
        id: String(m.id),
        conversaId: String(m.group),
        remetenteId: String(m.sender.id),
        remetenteNome: m.sender.first_name || m.sender.username,
        remetenteIniciais: m.sender.username.slice(0, 2).toUpperCase(),
        conteudo: m.content,
        tipo: 'texto',
        dataHora: m.timestamp,
        lido: true,
      }));
    },
    enabled: !!selectedConversa
  });

  const canCreateGroup = hasPermission('chat', 'all', 'create');

  // Real-time listener for incoming messages
  useEffect(() => {
    // chatSocket is connected by PermissionsContext on mount — no need to reconnect here
    const unsubscribe = chatSocket.subscribe('chat_message_broadcast', (data) => {
      const groupId = String(data.group_id || data.group || '');

      if (selectedConversa && groupId === String(selectedConversa.id)) {
        // Optimistically append message to current chat
        const newMsg = {
          id: `ws-${Date.now()}`,
          conversaId: groupId,
          remetenteId: String(data.sender_id),
          remetenteNome: data.sender,
          remetenteIniciais: data.sender.slice(0, 2).toUpperCase(),
          conteudo: data.message,
          tipo: 'texto',
          dataHora: data.timestamp,
          lido: true,
        };

        queryClient.setQueryData(['chat-messages', selectedConversa.id], (old: any) => {
          return [...(old || []), newMsg];
        });

        // Invalidate groups to update last message and unread count
        queryClient.invalidateQueries({ queryKey: ['chat-groups'] });

        // Auto scroll
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      } else {
        // Notificação global tratada pelo ChatContext.tsx
        // Apenas invalidamos para atualizar a data da última mensagem na sidebar
        queryClient.invalidateQueries({ queryKey: ['chat-groups'] });
      }
    });

    return () => unsubscribe();
  }, [selectedConversa, queryClient, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const handleSendMessage = () => {
    if (!novaMensagem.trim() || !selectedConversa) return;

    // Envia via WebSocket
    chatSocket.send({
      type: 'chat_message',
      group_id: selectedConversa.id,
      message: novaMensagem.trim()
    });

    setNovaMensagem('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handlePessoaClick = (pessoa: any) => {
    setSelectedPessoa(pessoa);
    setShowHierarchyPanel(true);
    setShowInfoPanel(false);
  };

  const handleConversaHeaderClick = () => {
    if (!selectedConversa || selectedConversa.tipo !== 'direto') return;
    const otherParticipant = selectedConversa.participantes?.find((p: any) => p.id !== currentUserId);
    if (otherParticipant) {
      const pessoa = pessoasLookup.find(p => String(p.id) === otherParticipant.id);
      if (pessoa) handlePessoaClick(pessoa);
    }
  };

  // Mutation: create or get a private chat group with a user via the backend
  const startChatMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.post('/api/chat/groups/get_or_create_private/', { user_id: Number(userId) });
      return res.data;
    },
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: ['chat-groups'] });
      const conversa: ChatConversa = {
        id: String(group.id),
        tipo: 'direto',
        nome: group.name ||
          group.members?.find((m: any) => String(m.id) !== currentUserId)?.first_name ||
          'Chat Privado',
        participantes: (group.members || []).map((m: any) => ({
          id: String(m.id),
          nome: `${m.first_name} ${m.last_name}`.trim() || m.username,
          iniciais: m.username.slice(0, 2).toUpperCase(),
          online: true,
        })),
        naoLidas: 0,
      };
      setSelectedConversa(conversa);
      setShowNewChatModal(false);
    },
    onError: () => {
      toast({ title: 'Erro ao iniciar conversa', variant: 'destructive' });
    },
  });

  const handleStartChat = (pessoaId: string) => {
    // Check if a direct chat with this person already exists in sidebar
    const existingConversa = conversas.find(
      (c: any) => c.tipo === 'direto' && c.participantes?.some((p: any) => p.id === pessoaId)
    );
    if (existingConversa) {
      setSelectedConversa(existingConversa);
      setShowNewChatModal(false);
    } else {
      startChatMutation.mutate(pessoaId);
    }
    setShowHierarchyPanel(false);
  };

  // Mutation: create a group chat via backend
  const createGroupMutation = useMutation({
    mutationFn: async ({ name, memberIds }: { name: string; memberIds: number[] }) => {
      const res = await api.post('/api/chat/groups/', {
        name,
        is_private: false,
        member_ids: memberIds,
      });
      return res.data;
    },
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: ['chat-groups'] });
      const conversa: ChatConversa = {
        id: String(group.id),
        tipo: 'grupo',
        nome: group.name,
        participantes: (group.members || []).map((m: any) => ({
          id: String(m.id),
          nome: `${m.first_name} ${m.last_name}`.trim() || m.username,
          iniciais: m.username.slice(0, 2).toUpperCase(),
          online: true,
        })),
        naoLidas: 0,
      };
      setSelectedConversa(conversa);
      toast({ title: 'Grupo criado', description: `Grupo "${group.name}" criado.` });
      setShowNewGroupModal(false);
    },
    onError: () => {
      toast({ title: 'Erro ao criar grupo', variant: 'destructive' });
    },
  });

  const handleCreateGroupChat = (pessoaIds: string[], groupName: string) => {
    createGroupMutation.mutate({
      name: groupName,
      memberIds: pessoaIds.map(Number),
    });
    setShowHierarchyPanel(false);
  };

  const handleCreateGroupFromModal = () => {
    if (!newGroupName.trim() || newGroupMembers.length === 0) {
      toast({ title: "Atenção", description: "Informe o nome e adicione membros ao grupo." });
      return;
    }
    createGroupMutation.mutate({
      name: newGroupName.trim(),
      memberIds: [Number(currentUserId), ...newGroupMembers.map(Number)],
    });
    setNewGroupName('');
    setNewGroupDesc('');
    setNewGroupMembers([]);
    setNewGroupSearch('');
  };

  // Mutation: add participants to an existing group
  const addMembersMutation = useMutation({
    mutationFn: async ({ groupId, memberIds }: { groupId: string; memberIds: number[] }) => {
      const res = await api.post(`/api/chat/groups/${groupId}/members/`, { member_ids: memberIds });
      return res.data;
    },
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: ['chat-groups'] });
      setSelectedConversa((prev) =>
        prev && String(prev.id) === String(group.id)
          ? {
              ...prev,
              participantes: (group.members || []).map((m: any) => ({
                id: String(m.id),
                nome: `${m.first_name} ${m.last_name}`.trim() || m.username,
                iniciais: m.username.slice(0, 2).toUpperCase(),
                online: onlineStatus[String(m.id)] ?? true,
              })),
            }
          : prev
      );
      toast({ title: 'Participante(s) adicionado(s)' });
      setShowAddMemberModal(false);
      setAddMemberSelection([]);
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || 'Erro ao adicionar participante.';
      toast({ title: msg, variant: 'destructive' });
    },
  });

  const handleAddMembers = () => {
    if (!selectedConversa || addMemberSelection.length === 0) return;
    addMembersMutation.mutate({
      groupId: selectedConversa.id,
      memberIds: addMemberSelection.map(Number),
    });
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleImageAttach = () => {
    imageInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'image') => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversa) return;
    e.target.value = '';

    try {
      const formData = new FormData();
      formData.append('group', String(selectedConversa.id));
      formData.append('message', type === 'image' ? `📷 ${file.name}` : `📎 ${file.name}`);
      formData.append('file', file);

      await api.post('/api/chat/messages/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Invalidate so the messages list refreshes from the server
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedConversa.id] });
      toast({ title: type === 'image' ? "Imagem enviada" : "Arquivo enviado", description: file.name });
    } catch {
      toast({ title: "Erro ao enviar arquivo", description: "Não foi possível enviar o arquivo.", variant: "destructive" });
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNovaMensagem(prev => prev + emoji);
  };

  const handleStartCall = async (type: 'audio' | 'video') => {
    setShowCallModal(type);

    if (selectedConversa && selectedConversa.tipo === 'direto') {
      const targetUser = selectedConversa.participantes.find(p => String(p.id) !== String(currentUserId));
      if (targetUser) {
        await startCallTo(Number(targetUser.id), targetUser.nome || 'Chat', type);
      }
    }
  };

  const handleEndCall = () => {
    setShowCallModal(null);
    toast({ title: "Chamada encerrada" });
  };

  const formatMessageTime = (dataHora: string) => {
    const date = new Date(dataHora);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastMessageDate = (dataHora?: string) => {
    if (!dataHora) return '';
    const date = new Date(dataHora);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return formatMessageTime(dataHora);
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const filteredConversas = conversas.filter(c =>
    c.nome.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const chatsDiretos = filteredConversas.filter(c => c.tipo === 'direto');
  const chatsGrupos = filteredConversas.filter(c => c.tipo === 'grupo');

  // Filter real users for modal searches — exclude self
  const filteredNewChatPessoas = pessoasLookup.filter(p =>
    String(p.id) !== currentUserId &&
    (newChatSearch ? p.nome.toLowerCase().includes(newChatSearch.toLowerCase()) : true)
  );

  const filteredNewGroupPessoas = pessoasLookup.filter(p =>
    String(p.id) !== currentUserId &&
    (newGroupSearch ? p.nome.toLowerCase().includes(newGroupSearch.toLowerCase()) : true)
  );

  const callTarget = selectedConversa?.tipo === 'direto'
    ? selectedConversa.participantes.find(p => p.id !== currentUserId)
    : null;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleFileSelected(e, 'file')} />
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelected(e, 'image')} />

      {/* Sidebar de conversas */}
      <div className="w-80 min-w-[320px] border-r border-border/30 bg-card flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border/30 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground">Chat</h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setShowNewChatModal(true); setNewChatSearch(''); }}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Nova conversa
                </DropdownMenuItem>
                {canCreateGroup && (
                  <DropdownMenuItem onClick={() => { setShowNewGroupModal(true); setNewGroupName(''); setNewGroupDesc(''); setNewGroupMembers([]); setNewGroupSearch(''); }}>
                    <Users className="h-4 w-4 mr-2" />
                    Novo grupo
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas..."
              className="pl-9 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {chatsDiretos.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-medium text-muted-foreground px-2 mb-1">Recentes</div>
                {chatsDiretos.map(conversa => (
                  <ConversaItem
                    key={conversa.id}
                    conversa={conversa}
                    currentUserId={currentUserId}
                    isActive={selectedConversa?.id === conversa.id}
                    localUnreadCount={unreadCounts[conversa.id] || 0}
                    localLastMessage={lastMessages[conversa.id]}
                    onClick={() => {
                      setSelectedConversa(conversa);
                    }}
                    formatLastMessageDate={formatLastMessageDate}
                  />
                ))}
              </div>
            )}

            {chatsGrupos.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-medium text-muted-foreground px-2 mb-1">Grupos</div>
                {chatsGrupos.map(conversa => (
                  <ConversaItem
                    key={conversa.id}
                    conversa={conversa}
                    currentUserId={currentUserId}
                    isActive={selectedConversa?.id === conversa.id}
                    localUnreadCount={unreadCounts[conversa.id] || 0}
                    localLastMessage={lastMessages[conversa.id]}
                    onClick={() => {
                      setSelectedConversa(conversa);
                    }}
                    formatLastMessageDate={formatLastMessageDate}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Área de mensagens */}
      {selectedConversa ? (
        <div className="flex-1 flex flex-col bg-background min-w-0 overflow-hidden">
          {/* Header da conversa */}
          <div className="h-14 px-4 border-b border-border/30 flex items-center justify-between bg-card shrink-0">
            <div
              className={cn("flex items-center gap-3", selectedConversa.tipo === 'direto' && "cursor-pointer")}
              onClick={handleConversaHeaderClick}
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className={cn(
                  selectedConversa.tipo === 'equipe' && "bg-primary text-primary-foreground"
                )}>
                  {selectedConversa.tipo === 'equipe' ? (
                    <Hash className="h-4 w-4" />
                  ) : selectedConversa.tipo === 'grupo' ? (
                    <Users className="h-4 w-4" />
                  ) : (
                    getChatInfo(selectedConversa, String(currentUserId)).iniciais
                  )}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-sm text-foreground">
                  {getChatInfo(selectedConversa, String(currentUserId)).name}
                </h3>
                {selectedConversa.tipo === 'direto' && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      getChatInfo(selectedConversa, String(currentUserId)).online
                        ? "bg-primary"
                        : "bg-muted-foreground"
                    )} />
                    {getChatInfo(selectedConversa, String(currentUserId)).online ? 'Online' : 'Offline'}
                  </span>
                )}
                {(selectedConversa.tipo === 'grupo' || selectedConversa.tipo === 'equipe') && (
                  <span className="text-xs text-muted-foreground">
                    {selectedConversa.participantes.length} membros
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" className="p-2 h-auto w-auto" onClick={() => handleStartCall('audio')}>
                <Phone className="h-5 w-5" />
              </Button>
              <Button variant="ghost" className="p-2 h-auto w-auto" onClick={() => handleStartCall('video')}>
                <Video className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                className="p-2 h-auto w-auto"
                onClick={() => setShowInfoPanel(!showInfoPanel)}
              >
                <Info className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Mensagens - scroll restrito aqui */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {mensagens.map((msg: any, idx) => {
                const senderId = msg.sender?.id || msg.remetente?.id || msg.remetente_id || msg.remetenteId || msg.sender_id || msg.sender;
                const isOwn = String(senderId) === currentUserId;
                const showAvatar = idx === 0 || String(mensagens[idx - 1].sender?.id || mensagens[idx - 1].remetenteId) !== String(senderId);

                return (
                  <div
                    key={msg.id}
                    className={cn("flex gap-3", isOwn ? "justify-end" : "justify-start")}
                  >
                    {showAvatar && !isOwn ? (
                      <Avatar
                        className="h-8 w-8 cursor-pointer shrink-0"
                        onClick={() => {
                          const pessoa = pessoasLookup.find(p => String(p.id) === String(msg.remetenteId));
                          if (pessoa) handlePessoaClick(pessoa);
                        }}
                      >
                        <AvatarFallback className="text-xs">{msg.remetenteIniciais}</AvatarFallback>
                      </Avatar>
                    ) : !isOwn ? (
                      <div className="w-8 shrink-0" />
                    ) : null}

                    <div className={cn("max-w-[70%]", isOwn && "text-right")}>
                      {showAvatar && !isOwn && (
                        <div className="text-xs font-medium text-foreground mb-1">{msg.remetenteNome}</div>
                      )}
                      <div className={cn(
                        "inline-block p-3 rounded-lg text-sm break-words",
                        isOwn
                          ? "bg-blue-600 text-white rounded-br-sm"
                          : "bg-gray-200 text-gray-900 rounded-bl-sm"
                      )}>
                        {msg.conteudo}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{formatMessageTime(msg.dataHora)}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input de mensagem */}
          <div className="p-4 border-t border-border/30 bg-card shrink-0">
            <div className="flex items-end gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={handleFileAttach}>
                    <Paperclip className="h-4 w-4 mr-2" />
                    Anexar arquivo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleImageAttach}>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Enviar imagem
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex-1 relative">
                <Textarea
                  placeholder="Digite uma mensagem..."
                  className="min-h-[40px] max-h-[120px] resize-none pr-10"
                  value={novaMensagem}
                  onChange={(e) => setNovaMensagem(e.target.value)}
                  onKeyDown={handleKeyPress}
                  rows={1}
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 absolute right-1 bottom-1">
                      <Smile className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="end" side="top">
                    <div className="grid grid-cols-5 gap-1">
                      {EMOJI_LIST.map(emoji => (
                        <button
                          key={emoji}
                          className="h-9 w-9 flex items-center justify-center rounded hover:bg-muted text-lg transition-colors"
                          onClick={() => handleEmojiSelect(emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <Button
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={handleSendMessage}
                disabled={!novaMensagem.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-background min-w-0">
          <div className="text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">Selecione uma conversa</p>
            <p className="text-sm">Escolha uma conversa ao lado para começar a conversar</p>
          </div>
        </div>
      )}

      {/* Painel de informações */}
      {showInfoPanel && selectedConversa && (
        <div className="w-72 min-w-[288px] border-l border-border/30 bg-card flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border/30 flex items-center justify-between shrink-0">
            <h3 className="font-medium text-sm">Informações</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowInfoPanel(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4">
              <div className="text-center mb-4">
                <Avatar className="h-16 w-16 mx-auto mb-2">
                  <AvatarFallback className={cn(
                    "text-lg",
                    selectedConversa.tipo === 'equipe' && "bg-primary text-primary-foreground"
                  )}>
                    {selectedConversa.tipo === 'equipe' ? (
                      <Hash className="h-6 w-6" />
                    ) : selectedConversa.tipo === 'grupo' ? (
                      <Users className="h-6 w-6" />
                    ) : (
                      selectedConversa.participantes.find(p => p.id !== currentUserId)?.iniciais
                    )}
                  </AvatarFallback>
                </Avatar>
                <h4 className="font-medium">{selectedConversa.nome}</h4>
                {selectedConversa.descricao && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedConversa.descricao}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    Membros ({selectedConversa.participantes.length})
                  </div>
                  {selectedConversa.tipo !== 'direto' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs gap-1"
                      onClick={() => {
                        setAddMemberSelection([]);
                        setShowAddMemberModal(true);
                      }}
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Adicionar
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {selectedConversa.participantes.map(p => (
                    <button
                      key={p.id}
                      className="flex items-center gap-2 w-full p-2 rounded hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        const pessoa = pessoasLookup.find(pe => String(pe.id) === p.id);
                        if (pessoa) handlePessoaClick(pessoa);
                      }}
                    >
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{p.iniciais}</AvatarFallback>
                        </Avatar>
                        <span className={cn(
                          "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card",
                          p.online ? "bg-primary" : "bg-muted-foreground"
                        )} />
                      </div>
                      <span className="text-sm">{p.nome}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Modal Nova Conversa */}
      <Dialog open={showNewChatModal} onOpenChange={setShowNewChatModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Conversa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pessoa..."
                className="pl-9"
                value={newChatSearch}
                onChange={(e) => setNewChatSearch(e.target.value)}
              />
            </div>
            <ScrollArea className="h-64">
              <div className="space-y-1">
                {filteredNewChatPessoas.map(pessoa => (
                  <button
                    key={pessoa.id}
                    className="flex items-center gap-3 w-full p-2 rounded hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      handleStartChat(String(pessoa.id));
                      setShowNewChatModal(false);
                    }}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{pessoa.iniciais}</AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <div className="text-sm font-medium">{pessoa.nome}</div>
                      <div className="text-xs text-muted-foreground">{pessoa.cargo} • {pessoa.setor}</div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Novo Grupo */}
      <Dialog open={showNewGroupModal} onOpenChange={setShowNewGroupModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Grupo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do grupo</Label>
              <Input
                placeholder="Digite o nome do grupo"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descrição do grupo (opcional)"
                rows={2}
                value={newGroupDesc}
                onChange={(e) => setNewGroupDesc(e.target.value)}
              />
            </div>
            <div>
              <Label>Adicionar membros</Label>
              {newGroupMembers.length > 0 && (
                <div className="flex flex-wrap gap-1 my-2">
                  {newGroupMembers.map(id => {
                    const p = pessoasLookup.find(pe => String(pe.id) === id);
                    return p ? (
                      <Badge key={id} variant="secondary" className="gap-1 pr-1">
                        {p.nome.split(' ')[0]}
                        <button onClick={() => setNewGroupMembers(prev => prev.filter(m => m !== id))} className="ml-1 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar pessoa..."
                  className="pl-9"
                  value={newGroupSearch}
                  onChange={(e) => setNewGroupSearch(e.target.value)}
                />
              </div>
              <ScrollArea className="h-48 mt-2">
                <div className="space-y-1">
                  {filteredNewGroupPessoas.map(pessoa => {
                    const isSelected = newGroupMembers.includes(String(pessoa.id));
                    return (
                      <button
                        key={pessoa.id}
                        className={cn(
                          "flex items-center gap-3 w-full p-2 rounded transition-colors",
                          isSelected ? "bg-primary/10" : "hover:bg-muted/50"
                        )}
                        onClick={() => {
                          const strId = String(pessoa.id);
                          setNewGroupMembers(prev =>
                            isSelected ? prev.filter(m => m !== strId) : [...prev, strId]
                          );
                        }}
                      >
                        <div className={cn(
                          "h-5 w-5 rounded border flex items-center justify-center shrink-0",
                          isSelected ? "bg-primary border-primary" : "border-border"
                        )}>
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{pessoa.iniciais}</AvatarFallback>
                        </Avatar>
                        <div className="text-left min-w-0">
                          <div className="text-sm font-medium truncate">{pessoa.nome}</div>
                          <div className="text-xs text-muted-foreground truncate">{pessoa.cargo}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewGroupModal(false)}>Cancelar</Button>
            <Button onClick={handleCreateGroupFromModal} disabled={!newGroupName.trim() || newGroupMembers.length === 0}>
              Criar Grupo ({newGroupMembers.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Adicionar Participante */}
      <Dialog open={showAddMemberModal} onOpenChange={setShowAddMemberModal}>
        <DialogContent className="max-w-sm sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Participante</DialogTitle>
          </DialogHeader>
          <ParticipantPicker
            allPeople={pessoasLookup}
            selected={addMemberSelection}
            onChange={setAddMemberSelection}
            excludeIds={selectedConversa?.participantes.map(p => p.id) || []}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMemberModal(false)}>Cancelar</Button>
            <Button onClick={handleAddMembers} disabled={addMemberSelection.length === 0 || addMembersMutation.isPending}>
              {addMembersMutation.isPending ? 'Adicionando...' : `Adicionar (${addMemberSelection.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Chamada */}
      <Dialog open={showCallModal !== null} onOpenChange={(open) => !open && setShowCallModal(null)}>
        <DialogContent className="max-w-sm sm:max-w-md">
          <DialogTitle className="sr-only">Chamada de Vídeo</DialogTitle>
          <DialogDescription className="sr-only">Janela de chamada de vídeo em tempo real</DialogDescription>

          <div className="flex flex-col items-center py-8 space-y-6 w-full">
            {showCallModal === 'video' ? (
              <div className="relative w-full aspect-video bg-black rounded overflow-hidden">
                {/* Main video (Remote) */}
                <video
                  ref={(ref) => { if (ref) ref.srcObject = remoteStream }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {/* PIP video (Local) */}
                <video
                  ref={(ref) => { if (ref) ref.srcObject = localStream }}
                  autoPlay
                  playsInline
                  muted
                  className="absolute bottom-4 right-4 w-24 h-32 bg-gray-900 object-cover rounded shadow-lg border-2 border-primary"
                />
              </div>
            ) : (
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {callTarget?.iniciais || (selectedConversa?.tipo === 'grupo' ? <Users className="h-8 w-8" /> : 'U')}
                </AvatarFallback>
              </Avatar>
            )}

            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground">
                {selectedConversa?.nome}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {showCallModal === 'video' ? 'Chamada de vídeo' : 'Chamada de voz'}
              </p>
              <p className="text-xs text-primary mt-2 animate-pulse">{callStatus === 'calling' ? 'Chamando...' : callStatus === 'connected' ? 'Em andamento' : 'Conectando...'}</p>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className={cn("h-12 w-12 rounded-full", callMuted && "bg-destructive/20 border-destructive")}
                onClick={toggleMute}
              >
                {callMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>

              {showCallModal === 'video' && (
                <Button
                  variant="outline"
                  size="icon"
                  className={cn("h-12 w-12 rounded-full", callVideoOff && "bg-destructive/20 border-destructive")}
                  onClick={toggleCamera}
                >
                  {callVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                </Button>
              )}

              <Button
                variant="destructive"
                size="icon"
                className="h-14 w-14 rounded-full"
                onClick={handleEndCall}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Painel de Hierarquia */}
      {showHierarchyPanel && selectedPessoa && (
        <PersonHierarchyPanel
          pessoa={selectedPessoa}
          onClose={() => setShowHierarchyPanel(false)}
          onStartChat={handleStartChat}
          onCreateGroupChat={handleCreateGroupChat}
          currentUserId={currentUserId}
          onlineStatus={onlineStatus}
        />
      )}
    </div>
  );
}

// Componente de item de conversa
interface ConversaItemProps {
  conversa: ChatConversa;
  isActive: boolean;
  onClick: () => void;
  formatLastMessageDate: (date?: string) => string;
  currentUserId: string;
  localUnreadCount?: number;
  localLastMessage?: { content: string; timestamp: string };
}

function ConversaItem({
  conversa,
  isActive,
  onClick,
  formatLastMessageDate,
  currentUserId,
  localUnreadCount = 0,
  localLastMessage
}: ConversaItemProps) {
  const chatInfo = getChatInfo(conversa, String(currentUserId));

  const currentChatId = String(conversa.id);
  const localUnread = Number(localUnreadCount) || 0;
  const apiUnread = Number(conversa.naoLidas) || 0;
  // localUnread is already seeded from apiUnread on mount — avoid double-counting
  const totalUnread = localUnread > 0 ? localUnread : apiUnread;

  const displayMessage = localLastMessage?.content || conversa.ultimaMensagem || 'Nenhuma mensagem';
  const displayDate = localLastMessage?.timestamp || conversa.ultimaMensagemData;


  return (
    <button
      className={cn(
        "flex items-center gap-3 w-full p-2 rounded transition-colors",
        isActive ? "bg-muted" : "hover:bg-muted/50"
      )}
      onClick={onClick}
    >
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarFallback className={cn(
            "text-sm",
            conversa.tipo === 'equipe' && "bg-primary text-primary-foreground"
          )}>
            {conversa.tipo === 'equipe' ? (
              <Hash className="h-4 w-4" />
            ) : conversa.tipo === 'grupo' ? (
              <Users className="h-4 w-4" />
            ) : (
              chatInfo.iniciais
            )}
          </AvatarFallback>
        </Avatar>
        {conversa.tipo === 'direto' && (
          <span className={cn(
            "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card",
            chatInfo.online ? "bg-primary" : "bg-muted-foreground"
          )} />
        )}
      </div>

      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm truncate">
            {chatInfo.name}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatLastMessageDate(displayDate)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground truncate w-40">
            {displayMessage}
          </p>
          {totalUnread > 0 && (
            <Badge className="h-5 min-w-[20px] px-1.5 shrink-0 bg-rose-500 text-white hover:bg-rose-600 border-none">
              {totalUnread}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
