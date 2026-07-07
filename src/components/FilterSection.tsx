import { Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ReactNode } from "react"

interface FilterField {
  type: "text" | "date" | "select"
  label: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  options?: { value: string; label: string }[]
  width?: string
}

interface FilterSectionProps {
  fields: FilterField[]
  onFilter?: () => void
  onClear?: () => void
  resultsCount?: number
  children?: ReactNode
}

export function FilterSection({
  fields,
  onFilter,
  onClear,
  resultsCount,
  children
}: FilterSectionProps) {
  const handleClear = () => {
    fields.forEach(field => field.onChange(""))
    onClear?.()
  }

  return (
    <div className="space-y-4">
      <div className="filter-card">
        <div className="flex flex-wrap gap-4 items-end">
          {fields.map((field) => (
            <div key={field.label} className={`flex flex-col gap-1.5 ${field.width || 'min-w-[180px]'}`}>
              <label className="filter-label">{field.label}</label>
              
              {field.type === "text" && (
                <Input
                  type="text"
                  placeholder={field.placeholder}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="filter-input"
                />
              )}

              {field.type === "date" && (
                <Input
                  type="date"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="filter-input"
                />
              )}

              {field.type === "select" && field.options && (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="filter-input">
                    <SelectValue placeholder={field.placeholder} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {field.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
          
          {children}

          <div className="flex gap-2 items-center">
            <Button onClick={onFilter} className="gap-2 h-10">
              <Filter className="h-4 w-4" />
              Filtrar
            </Button>
            <Button variant="outline" onClick={handleClear} className="gap-2 h-10">
              <X className="h-4 w-4" />
              Limpar Filtros
            </Button>
          </div>
        </div>
      </div>

      {resultsCount !== undefined && (
        <p className="text-sm text-muted-foreground">
          {resultsCount} resultado{resultsCount !== 1 ? "s" : ""} encontrado{resultsCount !== 1 ? "s" : ""}.
        </p>
      )}
    </div>
  )
}
