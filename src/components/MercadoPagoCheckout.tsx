import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PaymentFormData, PlanData } from '@/types/mercadopago';
import { useMercadoPago } from '@/hooks/useMercadoPago';
import QRCodeDisplay from './QRCodeDisplay';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  phone: z.string()
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .max(11, 'Telefone deve ter no máximo 11 dígitos')
    .regex(/^\d+$/, 'Telefone deve conter apenas números'),
  email: z.string()
    .email('Email inválido')
    .max(100, 'Email muito longo'),
  cpf: z.string()
    .length(11, 'CPF deve ter exatamente 11 dígitos')
    .regex(/^\d+$/, 'CPF deve conter apenas números')
});

interface MercadoPagoCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: PlanData;
}

const MercadoPagoCheckout: React.FC<MercadoPagoCheckoutProps> = ({
  isOpen,
  onClose,
  selectedPlan
}) => {
  const [step, setStep] = useState<'form' | 'qrcode'>('form');
  const { toast } = useToast();
  const { loading, paymentData, createPixPayment, reset } = useMercadoPago();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<PaymentFormData>({
    resolver: zodResolver(formSchema)
  });


  const onSubmit = async (data: PaymentFormData) => {
    try {
      await createPixPayment(data, selectedPlan);
      setStep('qrcode');
      toast({
        title: "QR Code gerado!",
        description: "Escaneie o código para efetuar o pagamento."
      });
    } catch (error) {
      console.error('Erro no checkout:', error);
    }
  };

  const handleClose = () => {
    setStep('form');
    reset();
    onClose();
  };

  const handleBack = () => {
    setStep('form');
    reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[85vw] max-w-sm sm:max-w-md p-6 mx-auto bg-background border-border rounded-xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-foreground text-xl font-semibold">
            {step === 'qrcode' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-2 h-auto hover:bg-muted rounded-lg"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <CreditCard className="h-5 w-5 text-primary" />
            {step === 'form' ? 'Finalizar Assinatura' : 'Pagamento PIX'}
          </DialogTitle>
        </DialogHeader>

        {step === 'form' ? (
          <div className="space-y-6 px-1">
            {/* Plan Summary */}
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-foreground font-medium">{selectedPlan.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Valor:</span>
                  <span className="text-2xl font-bold text-primary">{selectedPlan.price}</span>
                </div>
              </CardContent>
            </Card>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground font-medium text-sm">
                  Nome Completo *
                </Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Digite seu nome completo"
                  className="h-12 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
                />
                {errors.name && (
                  <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground font-medium text-sm">
                  Telefone (WhatsApp) *
                </Label>
                 <Input
                   id="phone"
                   {...register('phone')}
                   placeholder="11999999999"
                   type="tel"
                   maxLength={11}
                   className="h-12 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
                 />
                {errors.phone && (
                  <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium text-sm">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="seu@email.com"
                  className="h-12 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
                />
                {errors.email && (
                  <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf" className="text-foreground font-medium text-sm">
                  CPF *
                </Label>
                 <Input
                   id="cpf"
                   {...register('cpf')}
                   placeholder="12345678901"
                   type="text"
                   maxLength={11}
                   className="h-12 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
                 />
                {errors.cpf && (
                  <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                    {errors.cpf.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-base rounded-lg transition-all duration-200 hover:scale-[1.02] disabled:scale-100"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Gerando QR Code...
                  </>
                ) : (
                  'Gerar QR Code PIX'
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-3">
                Seus dados estão protegidos e são usados apenas para processar o pagamento
              </p>
            </form>
          </div>
        ) : (
          paymentData && (
            <QRCodeDisplay
              paymentData={paymentData}
              onPaymentComplete={() => {
                toast({
                  title: "Pagamento aprovado!",
                  description: "Sua assinatura foi ativada com sucesso."
                });
                handleClose();
              }}
            />
          )
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MercadoPagoCheckout;