import { cn } from "@/lib/utils"

type StatusType = "em-aberto" | "vencida" | "recebida" | "em-andamento" | "finalizado" | "pendente" | string

interface StatusBadgeProps {
  status: StatusType
  className?: string
}

const statusStyles: Record<string, { bg: string; text: string }> = {
  "em aberto": { bg: "bg-yellow-500/20", text: "text-yellow-600 dark:text-yellow-500" },
  "em-aberto": { bg: "bg-yellow-500/20", text: "text-yellow-600 dark:text-yellow-500" },
  "aberto": { bg: "bg-yellow-500/20", text: "text-yellow-600 dark:text-yellow-500" },
  "pendente": { bg: "bg-yellow-500/20", text: "text-yellow-600 dark:text-yellow-500" },
  "aguardando": { bg: "bg-yellow-500/20", text: "text-yellow-600 dark:text-yellow-500" },
  "em processamento": { bg: "bg-yellow-500/20", text: "text-yellow-600 dark:text-yellow-500" },
  "processando": { bg: "bg-yellow-500/20", text: "text-yellow-600 dark:text-yellow-500" },
  "análise": { bg: "bg-yellow-500/20", text: "text-yellow-600 dark:text-yellow-500" },
  "analise": { bg: "bg-yellow-500/20", text: "text-yellow-600 dark:text-yellow-500" },
  
  "vencida": { bg: "bg-red-500/20", text: "text-red-600 dark:text-red-500" },
  "vencido": { bg: "bg-red-500/20", text: "text-red-600 dark:text-red-500" },
  "cancelado": { bg: "bg-red-500/20", text: "text-red-600 dark:text-red-500" },
  "cancelada": { bg: "bg-red-500/20", text: "text-red-600 dark:text-red-500" },
  "rejeitada": { bg: "bg-red-500/20", text: "text-red-600 dark:text-red-500" },
  "negado": { bg: "bg-red-500/20", text: "text-red-600 dark:text-red-500" },
  "negada": { bg: "bg-red-500/20", text: "text-red-600 dark:text-red-500" },
  
  "recebida": { bg: "bg-primary/20", text: "text-primary dark:text-primary" },
  "recebido": { bg: "bg-primary/20", text: "text-primary dark:text-primary" },
  "paga": { bg: "bg-primary/20", text: "text-primary dark:text-primary" },
  "pago": { bg: "bg-primary/20", text: "text-primary dark:text-primary" },
  "efetuado": { bg: "bg-primary/20", text: "text-primary dark:text-primary" },
  "finalizado": { bg: "bg-primary/20", text: "text-primary dark:text-primary" },
  "concluido": { bg: "bg-primary/20", text: "text-primary dark:text-primary" },
  "concluído": { bg: "bg-primary/20", text: "text-primary dark:text-primary" },
  "aprovada": { bg: "bg-primary/20", text: "text-primary dark:text-primary" },
  "aprovado": { bg: "bg-primary/20", text: "text-primary dark:text-primary" },
  "processada": { bg: "bg-primary/20", text: "text-primary dark:text-primary" },
  "autorizada": { bg: "bg-primary/20", text: "text-primary dark:text-primary" },
  "entrada": { bg: "bg-primary/20", text: "text-primary dark:text-primary" },
  
  "em-andamento": { bg: "bg-blue-500/20", text: "text-blue-600 dark:text-blue-500" },
  "em andamento": { bg: "bg-blue-500/20", text: "text-blue-600 dark:text-blue-500" },
  "pago parcial": { bg: "bg-blue-500/20", text: "text-blue-600 dark:text-blue-500" },
  "saída": { bg: "bg-orange-500/20", text: "text-orange-600 dark:text-orange-500" },
  "saida": { bg: "bg-orange-500/20", text: "text-orange-600 dark:text-orange-500" },
  
  "normal": { bg: "bg-primary/20", text: "text-primary dark:text-primary" },
  "crítico": { bg: "bg-red-500/20", text: "text-red-600 dark:text-red-500" },
  "critico": { bg: "bg-red-500/20", text: "text-red-600 dark:text-red-500" },
  
  "ativo": { bg: "bg-primary/20", text: "text-primary dark:text-primary" },
  "inativo": { bg: "bg-red-500/20", text: "text-red-600 dark:text-red-500" },
  "afastado": { bg: "bg-yellow-500/20", text: "text-yellow-600 dark:text-yellow-500" },
  "desligado": { bg: "bg-red-500/20", text: "text-red-600 dark:text-red-500" },
  
  "nf-e": { bg: "bg-primary/20", text: "text-primary" },
  "nfs-e": { bg: "bg-blue-500/20", text: "text-blue-600 dark:text-blue-400" },
  "xml": { bg: "bg-primary/20", text: "text-primary dark:text-primary" },
  "ni": { bg: "bg-muted", text: "text-muted-foreground" },
  "rascunho": { bg: "bg-muted", text: "text-muted-foreground" },
  "em validação": { bg: "bg-yellow-500/20", text: "text-yellow-600 dark:text-yellow-500" },
  "enviada": { bg: "bg-blue-500/20", text: "text-blue-600 dark:text-blue-500" },
  "sucesso": { bg: "bg-primary/20", text: "text-primary dark:text-primary" },
  "homologado": { bg: "bg-primary/20", text: "text-primary dark:text-primary" },
  "pré-cadastro": { bg: "bg-purple-500/20", text: "text-purple-600 dark:text-purple-500" },
  "pre-cadastro": { bg: "bg-purple-500/20", text: "text-purple-600 dark:text-purple-500" },
  "aguardando aprovação": { bg: "bg-orange-500/20", text: "text-orange-600 dark:text-orange-500" },
  "entregue": { bg: "bg-primary/20", text: "text-primary dark:text-primary" },
}

const defaultStyle = { bg: "bg-muted", text: "text-muted-foreground" }

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = (status ?? '').toLowerCase()
  const style = statusStyles[normalizedStatus] || defaultStyle

  return (
    <span 
      className={cn(
        "inline-flex items-center justify-center px-3 py-1 rounded text-xs font-semibold min-w-[100px]",
        style.bg,
        style.text,
        className
      )}
    >
      {status}
    </span>
  )
}
