// Unidades de medida seguindo o Sistema Internacional de Unidades (SI),
// acrescidas das unidades de contagem/embalagem de uso corrente.
// `value` = código/símbolo padronizado armazenado no backend.

export interface UnidadeMedidaOption {
  value: string;
  label: string;
}

export const UNIDADES_MEDIDA: UnidadeMedidaOption[] = [
  // Contagem / embalagem
  { value: "un", label: "Unidade (un)" },
  { value: "pc", label: "Peça (pç)" },
  { value: "par", label: "Par (par)" },
  { value: "dz", label: "Dúzia (dz)" },
  { value: "cx", label: "Caixa (cx)" },
  { value: "pct", label: "Pacote (pct)" },
  { value: "fd", label: "Fardo (fd)" },
  { value: "rl", label: "Rolo (rl)" },
  { value: "kit", label: "Kit" },
  // Massa
  { value: "mg", label: "Miligrama (mg)" },
  { value: "g", label: "Grama (g)" },
  { value: "kg", label: "Quilograma (kg)" },
  { value: "t", label: "Tonelada (t)" },
  // Volume
  { value: "ml", label: "Mililitro (mL)" },
  { value: "l", label: "Litro (L)" },
  { value: "m3", label: "Metro cúbico (m³)" },
  // Comprimento
  { value: "mm", label: "Milímetro (mm)" },
  { value: "cm", label: "Centímetro (cm)" },
  { value: "m", label: "Metro (m)" },
  { value: "km", label: "Quilômetro (km)" },
  // Área
  { value: "cm2", label: "Centímetro quadrado (cm²)" },
  { value: "m2", label: "Metro quadrado (m²)" },
];

/** Retorna o rótulo legível de uma unidade; cai no próprio valor se não estiver na lista. */
export const unidadeMedidaLabel = (value?: string | null): string => {
  if (!value) return "-";
  return UNIDADES_MEDIDA.find((u) => u.value === value)?.label ?? value;
};
