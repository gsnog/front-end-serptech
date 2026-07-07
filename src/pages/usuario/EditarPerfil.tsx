import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import { fetchMe, updateMe, updateMeWithImage } from "@/services/pessoas";
import api from "@/lib/api";

export default function EditarPerfil() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: fetchMe
  });

  const mutation = useMutation({
    mutationFn: (data: any) => data.profile_image ? updateMeWithImage(data) : updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success("Perfil atualizado com sucesso!");
      navigate("/usuario/visualizar");
    },
    onError: () => {
      toast.error("Erro ao atualizar o perfil. Tente novamente.");
    }
  });

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    telefone: "",
    cargo: "",
    setor: "",
    endereco: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const BASE_URL = api.defaults.baseURL || "http://127.0.0.1:8000";

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        telefone: user.telefone || "",
        cargo: user.cargo || "",
        setor: user.setor || "",
        endereco: user.endereco || "",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (imageFile) {
      mutation.mutate({
        ...formData,
        profile_image: imageFile
      } as any);
    } else {
      mutation.mutate({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        telefone: formData.telefone,
        endereco: formData.endereco,
      });
    }
  };

  const getInitials = (first: string, last: string) => {
    return `${first?.[0] || ""}${last?.[0] || ""}`.substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Editar Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar */}
            <div className="flex justify-center">
              <div className="relative">
                <Avatar className="h-32 w-32 rounded">
                  <AvatarImage
                    src={imagePreview || (user?.profile_image ? (user.profile_image.startsWith('http') ? user.profile_image : `${BASE_URL}${user.profile_image}`) : "")}
                    className="object-cover"
                    key={imagePreview || user?.profile_image}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-4xl font-bold rounded">
                    {user?.iniciais || getInitials(formData.first_name, formData.last_name) || "US"}
                  </AvatarFallback>
                </Avatar>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200"
                >
                  <Camera className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Campos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="form-label">Nome</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name" className="form-label">Sobrenome</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="form-label">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone" className="form-label">Telefone</Label>
                <Input
                  id="telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cargo" className="form-label">Cargo (Apenas visualização)</Label>
                <Input
                  id="cargo"
                  name="cargo"
                  value={formData.cargo}
                  disabled
                  className="form-input bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="setor" className="form-label">Setor (Apenas visualização)</Label>
                <Input
                  id="setor"
                  name="setor"
                  value={formData.setor}
                  disabled
                  className="form-input bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco" className="form-label">Endereço</Label>
                <Input
                  id="endereco"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/usuario/visualizar")}
                className="text-destructive border-destructive hover:bg-destructive hover:text-white transition-all duration-200"
              >
                Cancelar
              </Button>
              <Button type="submit" className="btn-action px-6" disabled={mutation.isPending}>
                {mutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
