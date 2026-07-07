import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight, Info } from "lucide-react";
import { motion } from "framer-motion";

export interface GradientCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  helpText?: string;
  trend?: {
    value: string;
    positive: boolean;
  };
  variant: "success" | "danger" | "info" | "warning" | "neutral" | "orange";
  delay?: number;
}

interface HeroConfig {
  isHero: true;
  heroBg: string;
  iconBg: string;
  iconColor: string;
  titleColor: string;
  valueColor: string;
  trendColor: string;
  trendBg: string;
  trendMuted: string;
  shadow: string;
}

interface StandardConfig {
  isHero: false;
  iconBg: string;
  iconColor: string;
  trendColor: string;
  accentBar: string;
  shadow: string;
}

type VariantConfig = HeroConfig | StandardConfig;

const variantConfig: Record<string, VariantConfig> = {
  success: {
    isHero: true,
    heroBg: "bg-primary",
    iconBg: "bg-black/10",
    iconColor: "text-primary-foreground",
    titleColor: "text-primary-foreground/80",
    valueColor: "text-primary-foreground",
    trendColor: "text-primary-foreground/90",
    trendBg: "bg-black/10",
    trendMuted: "text-primary-foreground/60",
    shadow: "shadow-primary/20 hover:shadow-primary/30",
  },
  danger: {
    isHero: false,
    iconBg: "bg-rose-400/10 dark:bg-rose-500/15",
    iconColor: "text-rose-600 dark:text-rose-400",
    trendColor: "text-rose-600 dark:text-rose-400",
    accentBar: "from-rose-400 to-rose-300",
    shadow: "hover:shadow-rose-500/5 dark:hover:shadow-rose-400/5",
  },
  info: {
    isHero: false,
    iconBg: "bg-blue-400/10 dark:bg-blue-500/15",
    iconColor: "text-blue-600 dark:text-blue-400",
    trendColor: "text-blue-600 dark:text-blue-400",
    accentBar: "from-blue-400 to-blue-300",
    shadow: "hover:shadow-blue-500/5 dark:hover:shadow-blue-400/5",
  },
  warning: {
    isHero: false,
    iconBg: "bg-amber-400/10 dark:bg-amber-500/15",
    iconColor: "text-amber-600 dark:text-amber-400",
    trendColor: "text-amber-600 dark:text-amber-400",
    accentBar: "from-amber-400 to-amber-300",
    shadow: "hover:shadow-amber-500/5 dark:hover:shadow-amber-400/5",
  },
  neutral: {
    isHero: false,
    iconBg: "bg-slate-400/10 dark:bg-slate-500/15",
    iconColor: "text-slate-600 dark:text-slate-400",
    trendColor: "text-slate-600 dark:text-slate-400",
    accentBar: "from-slate-400 to-slate-300",
    shadow: "hover:shadow-slate-500/5 dark:hover:shadow-slate-400/5",
  },
  orange: {
    isHero: false,
    iconBg: "bg-orange-400/10 dark:bg-orange-500/15",
    iconColor: "text-orange-600 dark:text-orange-400",
    trendColor: "text-orange-600 dark:text-orange-400",
    accentBar: "from-orange-400 to-orange-300",
    shadow: "hover:shadow-orange-500/5 dark:hover:shadow-orange-400/5",
  },
};

export const GradientCard = ({ title, value, icon: Icon, helpText, trend, variant, delay = 0 }: GradientCardProps) => {
  const config = variantConfig[variant];

  if (config.isHero) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: delay * 0.1, ease: "easeOut" }}
        className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 shadow-lg border-2 border-primary/30 dark:border-primary/20 ${config.heroBg} ${config.shadow} hover:-translate-y-1 group`}
      >
        <div className="flex items-start justify-between mb-4">
          <p className={`text-[11px] font-semibold uppercase tracking-widest ${config.titleColor}`}>{title}</p>
          <div className={`p-2.5 rounded-full ${config.iconBg} transition-transform duration-300 group-hover:scale-110`}>
            <Icon className={`h-4 w-4 ${config.iconColor}`} />
          </div>
        </div>
        
        <p className={`text-3xl font-bold tracking-tight leading-none mb-3 ${config.valueColor}`}>{value}</p>

        {helpText && (
          <div className={`flex items-center gap-1 text-[11px] font-normal ${config.trendMuted} mt-1`}>
            <Info className="h-3 w-3 shrink-0" />
            <span>{helpText}</span>
          </div>
        )}

        {trend && (
          <div className={`flex items-center gap-1.5 text-xs font-semibold ${config.trendColor}`}>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${config.trendBg}`}>
              {trend.positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {trend.value}
            </span>
            <span className={`font-normal ml-1 ${config.trendMuted}`}>vs período anterior</span>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1, ease: "easeOut" }}
      className={`relative overflow-hidden bg-card rounded-2xl p-6 transition-all duration-300 shadow-sm shadow-black/[0.04] dark:shadow-black/20 hover:shadow-xl ${config.shadow} hover:-translate-y-1 group`}
    >
      {/* Color dot indicator */}
      <div className={`absolute top-4 right-16 w-2.5 h-2.5 rounded-full bg-gradient-to-r ${'accentBar' in config ? config.accentBar : ''} opacity-80`} />
      
      <div className="flex items-start justify-between mb-4">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">{title}</p>
        <div className={`p-2.5 rounded-full ${config.iconBg} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className={`h-4 w-4 ${config.iconColor}`} />
        </div>
      </div>
      
      <p className="text-3xl font-bold tracking-tight text-foreground leading-none mb-3">{value}</p>

      {helpText && (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-normal mt-1">
          <Info className="h-3 w-3 shrink-0" />
          <span>{helpText}</span>
        </div>
      )}

      {trend && (
        <div className={`flex items-center gap-1.5 text-xs font-semibold ${config.trendColor}`}>
          {trend.positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          <span>{trend.value}</span>
          <span className="text-muted-foreground font-normal ml-1">vs período anterior</span>
        </div>
      )}
    </motion.div>
  );
};

export default GradientCard;
