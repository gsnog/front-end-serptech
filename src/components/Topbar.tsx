import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, Calendar, MessageSquare, Columns3, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useChatContext } from "@/contexts/ChatContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMe } from "@/services/pessoas";
import { fetchNotificacoes } from "@/services/notificacoes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { chatSocket } from "@/lib/socket";


interface TopbarProps {
  sidebarCollapsed: boolean;
  pageTitle?: string;
  pageDescription?: string;
}

// Store previous route outside component to persist across renders
let previousRoute: string = "/";

type AppId = "kanban" | "calendario" | "chat" | "notificacoes";

interface AppItem {
  id: AppId;
  icon: typeof Columns3;
  title?: string; // Make title optional to accommodate 'label'
  label?: string; // Add label for new items
  path: string;
  badge?: number;
}

const APPS_ORDER_KEY = "topbar-apps-order";

function getStoredOrder(): AppId[] {
  try {
    const stored = localStorage.getItem(APPS_ORDER_KEY);
    if (stored) return JSON.parse(stored);
  } catch { }
  return ["kanban", "calendario", "chat"];
}

export function Topbar({
  sidebarCollapsed,
  pageTitle = "Dashboard",
  pageDescription = "Visão geral do sistema",
}: TopbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser: authUser, logout, hasPermission } = usePermissions();
  const { totalGlobalUnread } = useChatContext();
  const queryClient = useQueryClient();

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: fetchMe
  });

  const { data: notificacoes, refetch: refetchNotificacoes } = useQuery({
    queryKey: ['notificacoes'],
    queryFn: fetchNotificacoes,
    refetchInterval: 30000 // refresh every 30s
  });

  // Listen to real-time notification events
  useEffect(() => {
    const unsubNotif = chatSocket.subscribe('notification_event', (data) => {
      refetchNotificacoes();
    });

    return () => {
      unsubNotif();
    };
  }, [refetchNotificacoes]);

  const notificationCount = notificacoes?.filter(n => !n.lida).length || 0;
  const kanbanNotifications = 0;

  const hasCalendarAccess = true;
  const hasChatAccess = true;
  const hasKanbanAccess = true;

  const [appsOrder, setAppsOrder] = useState<AppId[]>(getStoredOrder);
  const [draggedApp, setDraggedApp] = useState<AppId | null>(null);
  const [dragOverApp, setDragOverApp] = useState<AppId | null>(null);

  const handleBellClick = () => {
    if (location.pathname === "/notificacoes") {
      navigate(previousRoute);
    } else {
      previousRoute = location.pathname;
      navigate("/notificacoes");
    }
  };

  const appItems: AppItem[] = [
    { id: "kanban", icon: Columns3, title: "Kanban", path: "/kanban", badge: kanbanNotifications },
    { id: "calendario", icon: Calendar, title: "Calendário", path: "/calendario" },
    { id: "chat", icon: MessageSquare, title: "Chat", path: "/chat", badge: totalGlobalUnread },
  ];

  const accessMap: Record<AppId, boolean> = {
    kanban: hasKanbanAccess,
    calendario: hasCalendarAccess,
    chat: hasChatAccess,
    notificacoes: true, // Notifications are always accessible
  };

  const orderedApps = appsOrder
    .map(id => appItems.find(a => a.id === id)!)
    .filter(a => a && accessMap[a.id]);

  const handleDragStart = (appId: AppId) => {
    setDraggedApp(appId);
  };

  const handleDragOver = (e: React.DragEvent, appId: AppId) => {
    e.preventDefault();
    setDragOverApp(appId);
  };

  const handleDrop = (targetId: AppId) => {
    if (!draggedApp || draggedApp === targetId) {
      setDraggedApp(null);
      setDragOverApp(null);
      return;
    }
    const newOrder = [...appsOrder];
    const fromIdx = newOrder.indexOf(draggedApp);
    const toIdx = newOrder.indexOf(targetId);
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, draggedApp);
    setAppsOrder(newOrder);
    localStorage.setItem(APPS_ORDER_KEY, JSON.stringify(newOrder));
    setDraggedApp(null);
    setDragOverApp(null);
  };

  const handleDragEnd = () => {
    setDraggedApp(null);
    setDragOverApp(null);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-20 items-center justify-between px-6 border-b transition-all duration-300 shrink-0",
        "bg-background text-foreground border-border",
        "dark:bg-[hsl(var(--sidebar-bg))] dark:text-white dark:border-[hsl(220_6%_16%)]"
      )}
    >
      {/* Left side - Title and description */}
      <div className="flex flex-col">
        <h1 className="text-lg font-bold">{pageTitle}</h1>
        <p className="text-sm text-muted-foreground dark:text-white/60">{pageDescription}</p>
      </div>

      {/* Right side - Apps (draggable), Notifications, divider, user info */}
      <div className="flex items-center gap-2">
        {/* Draggable Apps */}
        {orderedApps.map((app) => (
          <button
            key={app.id}
            draggable
            onDragStart={() => handleDragStart(app.id)}
            onDragOver={(e) => handleDragOver(e, app.id)}
            onDrop={() => handleDrop(app.id)}
            onDragEnd={handleDragEnd}
            onClick={() => navigate(app.path)}
            className={cn(
              "relative p-2 rounded hover:bg-muted dark:hover:bg-white/10 transition-colors cursor-grab active:cursor-grabbing",
              location.pathname === app.path && "bg-muted dark:bg-white/10",
              dragOverApp === app.id && draggedApp !== app.id && "ring-2 ring-primary/50"
            )}
            title={app.title === "Kanban" ? "Kanban - Gerencie tarefas visualmente" : app.title === "Calendário" ? "Calendário - Veja compromissos e eventos" : "Chat - Comunique-se com a equipe"}
          >
            <app.icon className="h-5 w-5 text-foreground dark:text-white/70" />
            {app.badge !== undefined && app.badge > 0 && (
              <span className={cn(
                "absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white",
                app.id === "chat" ? "bg-rose-500 animate-pulse" : "bg-primary text-primary-foreground"
              )}>
                {app.badge > 9 ? '9+' : app.badge}
              </span>
            )}
          </button>
        ))}

        {/* Notifications */}
        <button
          onClick={handleBellClick}
          className={cn(
            "relative p-2 rounded hover:bg-muted dark:hover:bg-white/10 transition-colors",
            location.pathname === "/notificacoes" && "bg-muted dark:bg-white/10"
          )}
          title="Notificações - Alertas e avisos do sistema"
        >
          <Bell className="h-5 w-5 text-foreground dark:text-white/70" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {notificationCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="h-8 w-px bg-border dark:bg-white/20 ml-2" />

        {/* User info with dropdown */}
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate("/usuario/visualizar")}
        >
          <Avatar className="h-10 w-10 rounded">
            {me?.profile_image && <AvatarImage src={me.profile_image} alt={me.nome} className="object-cover" />}
            <AvatarFallback className="bg-primary text-primary-foreground font-bold rounded">
              {me?.iniciais || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-semibold">{me?.nome || "Carregando..."}</span>
            <span className="text-xs text-muted-foreground dark:text-white/60">{me?.cargo || "Usuário"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}