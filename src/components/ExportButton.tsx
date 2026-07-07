import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, FileSpreadsheet, ChevronDown, FileDown, Loader2 } from "lucide-react";
import { exportData, type ExportFormat } from "@/lib/exportData";

interface ExportButtonProps {
  getData: () => Record<string, unknown>[] | Promise<Record<string, unknown>[]>;
  fileName: string;
  sheetName?: string;
}

export function ExportButton({ getData, fileName, sheetName }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    setLoading(true);
    try {
      const data = await getData();
      exportData(data, fileName, format, sheetName);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 border-border" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Exportar
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-popover border border-border z-50">
          <DropdownMenuItem onClick={() => handleExport('excel')} className="gap-2 cursor-pointer">
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            Exportar Excel (.xlsx)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('csv')} className="gap-2 cursor-pointer">
            <FileDown className="h-4 w-4 text-blue-600" />
            Exportar CSV (.csv)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('pdf')} className="gap-2 cursor-pointer">
            <FileText className="h-4 w-4 text-red-600" />
            Exportar PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  );
}
