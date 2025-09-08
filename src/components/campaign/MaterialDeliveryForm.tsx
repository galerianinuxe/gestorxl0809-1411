import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Package, Save, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface CampaignClient {
  id: string;
  name: string;
  cpf: string;
}

interface CampaignMaterial {
  id: string;
  name: string;
  price_per_kg: number;
}

interface DeliveryFormData {
  client_id: string;
  material_id: string;
  weight_kg: string;
  delivery_date: Date;
}

export function MaterialDeliveryForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<CampaignClient[]>([]);
  const [materials, setMaterials] = useState<CampaignMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculatedValue, setCalculatedValue] = useState<number>(0);
  
  const [formData, setFormData] = useState<DeliveryFormData>({
    client_id: "",
    material_id: "",
    weight_kg: "",
    delivery_date: new Date()
  });

  const loadClients = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('campaign_clients')
        .select('id, name, cpf')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const loadMaterials = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('campaign_materials')
        .select('id, name, price_per_kg')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Erro ao carregar materiais:', error);
    }
  };

  useEffect(() => {
    loadClients();
    loadMaterials();
  }, [user?.id]);

  useEffect(() => {
    // Calcular valor total quando peso ou material mudarem
    const weight = parseFloat(formData.weight_kg);
    const selectedMaterial = materials.find(m => m.id === formData.material_id);
    
    if (weight > 0 && selectedMaterial) {
      const total = weight * selectedMaterial.price_per_kg;
      setCalculatedValue(total);
    } else {
      setCalculatedValue(0);
    }
  }, [formData.weight_kg, formData.material_id, materials]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    if (calculatedValue <= 0) {
      toast({
        title: "Erro",
        description: "Verifique os dados informados",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const selectedMaterial = materials.find(m => m.id === formData.material_id);
      if (!selectedMaterial) throw new Error("Material não encontrado");

      const weight = parseFloat(formData.weight_kg);
      
      // Inserir entrega
      const { error } = await supabase
        .from('campaign_deliveries')
        .insert({
          user_id: user.id,
          client_id: formData.client_id,
          material_id: formData.material_id,
          weight_kg: weight,
          price_per_kg: selectedMaterial.price_per_kg,
          total_value: calculatedValue,
          delivery_date: format(formData.delivery_date, 'yyyy-MM-dd')
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Entrega registrada: R$ ${calculatedValue.toFixed(2)}`
      });

      // Resetar formulário
      setFormData({
        client_id: "",
        material_id: "",
        weight_kg: "",
        delivery_date: new Date()
      });
      setCalculatedValue(0);
    } catch (error) {
      console.error('Erro ao registrar entrega:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar entrega",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedMaterial = materials.find(m => m.id === formData.material_id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Registrar Nova Entrega
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client">Cliente *</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} - {client.cpf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="material">Material *</Label>
                <Select
                  value={formData.material_id}
                  onValueChange={(value) => setFormData({ ...formData, material_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.name} - R$ {material.price_per_kg.toFixed(2)}/kg
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="weight">Peso (kg) *</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.weight_kg}
                  onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                  placeholder="Ex: 15.5"
                  required
                />
              </div>

              <div>
                <Label>Data da Entrega *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.delivery_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.delivery_date ? (
                        format(formData.delivery_date, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecione a data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.delivery_date}
                      onSelect={(date) => date && setFormData({ ...formData, delivery_date: date })}
                      disabled={(date) => date > new Date() || date < new Date("2024-01-01")}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {selectedMaterial && formData.weight_kg && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-700">Cálculo do Valor</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p>Material: <strong>{selectedMaterial.name}</strong></p>
                    <p>Peso: <strong>{formData.weight_kg} kg</strong></p>
                    <p>Preço por kg: <strong>R$ {selectedMaterial.price_per_kg.toFixed(2)}</strong></p>
                    <hr className="my-2" />
                    <p className="text-lg font-bold text-green-700">
                      Total: R$ {calculatedValue.toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button type="submit" disabled={loading || calculatedValue <= 0} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Registrando..." : "Registrar Entrega"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {materials.length === 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4">
            <p className="text-amber-700">
              <strong>Atenção:</strong> Nenhum material cadastrado. 
              Acesse a aba "Relatórios" para configurar os materiais e preços.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}