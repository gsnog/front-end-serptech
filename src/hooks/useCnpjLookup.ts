import { useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";

export const formatCnpj = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

export const useCnpjLookup = (
  setFieldValue: (field: string, value: string) => void
) => {
  const [isSearching, setIsSearching] = useState(false);

  const consultarCnpj = async (cnpjRaw: string) => {
    const digits = cnpjRaw.replace(/\D/g, "");

    if (digits.length !== 14) {
      toast.error("CNPJ inválido", {
        description: "O CNPJ deve conter 14 dígitos.",
      });
      return;
    }

    setIsSearching(true);

    try {
      const response = await api.get(`/api/estoque/consulta-cnpj/${digits}/`);
      const data = response.data;

      if (data.nome) {
        setFieldValue("nome", data.nome);
        setFieldValue("razaoSocial", data.nome);
      }

      const enderecoParts = [
        data.logradouro,
        data.numero,
        data.complemento,
        data.bairro,
        data.municipio,
        data.uf,
        data.cep,
      ].filter(Boolean);
      if (enderecoParts.length > 0) setFieldValue("endereco", enderecoParts.join(", "));

      if (data.telefone) setFieldValue("telefone", data.telefone);
      if (data.email) setFieldValue("email", data.email);

      toast.success("CNPJ encontrado!", { description: data.nome });
    } catch (error: any) {
      const msg = error.response?.data?.error ?? "Verifique o CNPJ e tente novamente.";
      toast.error("Erro ao consultar CNPJ", { description: msg });
    } finally {
      setIsSearching(false);
    }
  };

  return { consultarCnpj, isSearching };
};
