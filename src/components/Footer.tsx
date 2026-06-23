import { cn } from "@/lib/utils"
import logoSerpLight from "@/assets/logo-serp-light.png"
import logoSerpDark from "@/assets/logo-serp-dark.png"

interface FooterProps {
  className?: string
}

export function Footer({ className }: FooterProps) {
  const year = new Date().getFullYear()

  return (
    <footer
      className={cn(
        "shrink-0 border-t border-border/60 dark:border-border/40 bg-background",
        "px-6 py-3 flex items-center justify-center gap-1.5",
        "text-xs text-muted-foreground",
        className
      )}
    >
      <span>© {year} • Aplicação desenvolvida pela</span>
      <a
        href="https://serptech.com.br"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center transition-opacity hover:opacity-80"
        aria-label="SerpTech"
      >
        {/* Logo alterna conforme o tema via classe `dark` no <html> */}
        <img
          src={logoSerpLight}
          alt="SerpTech"
          className="h-5 w-auto dark:hidden"
        />
        <img
          src={logoSerpDark}
          alt="SerpTech"
          className="hidden h-5 w-auto dark:block"
        />
      </a>
    </footer>
  )
}

export default Footer
