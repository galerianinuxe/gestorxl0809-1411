import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UserCog, Mail, Phone } from 'lucide-react';
import { DepotEmployee, EmployeeFormData, CreateEmployeeResult } from '@/hooks/useDepotEmployees';
import { EmployeePasswordModal } from '@/components/EmployeePasswordModal';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EmployeeFormData) => Promise<CreateEmployeeResult>;
  onUpdate?: (id: string, data: Partial<EmployeeFormData>) => Promise<boolean>;
  employee?: DepotEmployee | null;
}

export function EmployeeModal({ isOpen, onClose, onSave, onUpdate, employee }: EmployeeModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    email: '',
    phone: '',
    role: 'operador',
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [createdEmployee, setCreatedEmployee] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name,
        email: employee.email,
        phone: employee.phone || '',
        role: employee.role,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'operador',
      });
    }
  }, [employee, isOpen]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      return;
    }

    setLoading(true);
    try {
      if (employee && onUpdate) {
        await onUpdate(employee.id, formData);
        onClose();
      } else {
        const result = await onSave(formData);
        
        if (result.employee && result.generatedPassword) {
          // Show password modal with generated credentials
          setCreatedEmployee({
            name: result.employee.name,
            email: result.employee.email,
            password: result.generatedPassword,
          });
          setShowPasswordModal(true);
        } else {
          onClose();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordModalClose = () => {
    setShowPasswordModal(false);
    setCreatedEmployee(null);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen && !showPasswordModal} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              {employee ? 'Editar Funcionário' : 'Novo Funcionário'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-1">
                  <UserCog className="h-4 w-4" />
                  Nome Completo *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do funcionário"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  required
                  disabled={!!employee} // Email cannot be changed after creation
                />
                {!employee && (
                  <p className="text-xs text-muted-foreground">
                    Este email será usado para o login do funcionário. Uma senha será gerada automaticamente.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  Telefone/WhatsApp
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Cargo</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operador">Operador</SelectItem>
                    <SelectItem value="caixa">Caixa</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !formData.name.trim() || !formData.email.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {employee ? 'Salvando...' : 'Cadastrando...'}
                  </>
                ) : (
                  employee ? 'Salvar Alterações' : 'Cadastrar Funcionário'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {createdEmployee && (
        <EmployeePasswordModal
          isOpen={showPasswordModal}
          onClose={handlePasswordModalClose}
          email={createdEmployee.email}
          password={createdEmployee.password}
          employeeName={createdEmployee.name}
        />
      )}
    </>
  );
}
