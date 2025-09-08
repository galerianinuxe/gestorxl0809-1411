import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, QrCode, CheckCircle, AlertCircle } from 'lucide-react';
import { PixPaymentResponse } from '@/types/mercadopago';
import { useToast } from '@/hooks/use-toast';
import { useMercadoPago } from '@/hooks/useMercadoPago';

interface QRCodeDisplayProps {
  paymentData: PixPaymentResponse;
  onPaymentComplete?: () => void;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ paymentData, onPaymentComplete }) => {
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos em segundos
  const { toast } = useToast();
  const { pollPaymentStatus } = useMercadoPago();

  // Timer countdown effect
  useEffect(() => {
    if (paymentStatus !== 'pending') return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          setPaymentStatus('expired');
          toast({
            title: "Pagamento expirado",
            description: "O tempo limite de 5 minutos foi atingido. Gere um novo QR Code.",
            variant: "destructive"
          });
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [toast, paymentStatus]);

  useEffect(() => {
    if (paymentData?.id && paymentStatus === 'pending' && timeLeft > 0) {
      // Iniciar polling do status do pagamento
      pollPaymentStatus(paymentData.id, (status) => {
        setPaymentStatus(status);
        
        if (status === 'approved') {
          toast({
            title: "Pagamento aprovado!",
            description: "Sua assinatura foi ativada com sucesso.",
            variant: "default"
          });
          onPaymentComplete?.();
        } else if (status === 'rejected' || status === 'cancelled') {
          toast({
            title: "Pagamento não aprovado",
            description: "Tente novamente ou use outro método de pagamento.",
            variant: "destructive"
          });
        }
      }).catch(error => {
        console.error('Erro no polling:', error);
      });
    }
  }, [paymentData?.id, pollPaymentStatus, onPaymentComplete, toast, paymentStatus, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(paymentData.qr_code);
      setCopied(true);
      toast({
        title: "Código copiado!",
        description: "Cole no seu app do banco para pagar."
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar código PIX:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <QrCode className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-foreground">QR Code PIX Gerado</CardTitle>
          {timeLeft > 0 && paymentStatus === 'pending' ? (
            <div className="text-lg font-semibold text-red-600">
              Tempo restante: {formatTime(timeLeft)}
            </div>
          ) : timeLeft === 0 ? (
            <div className="text-lg font-semibold text-red-600">
              Pagamento Expirado
            </div>
          ) : null}
          <p className="text-muted-foreground">
            Escaneie o código abaixo ou copie o código PIX
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* QR Code Image */}
          <div className="flex justify-center p-4 bg-white rounded-lg">
            <img 
              src={`data:image/png;base64,${paymentData.qr_code_base64}`}
              alt="QR Code PIX"
              className="w-64 h-64"
            />
          </div>

          {/* Copy PIX Code Button */}
          <Button
            onClick={copyPixCode}
            disabled={timeLeft === 0 || paymentStatus === 'expired'}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            size="lg"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Código Copiado!
              </>
            ) : timeLeft === 0 ? (
              'QR Code Expirado'
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copiar Código PIX
              </>
            )}
          </Button>

          {/* Instructions */}
          <div className="text-center space-y-2 text-sm text-muted-foreground">
            <p>1. Abra o app do seu banco</p>
            <p>2. Escolha pagar com PIX</p>
            <p>3. Escaneie o código ou cole o código copiado</p>
            <p>4. Confirme o pagamento</p>
          </div>

          {/* Payment Status */}
          <div className={`text-center p-4 rounded-lg ${
            paymentStatus === 'approved' ? 'bg-green-50 border border-green-200' :
            paymentStatus === 'rejected' || paymentStatus === 'cancelled' ? 'bg-red-50 border border-red-200' :
            'bg-muted'
          }`}>
            {paymentStatus === 'approved' ? (
              <div className="flex items-center justify-center text-green-700">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">Pagamento Aprovado!</span>
              </div>
            ) : paymentStatus === 'rejected' || paymentStatus === 'cancelled' ? (
              <div className="flex items-center justify-center text-red-700">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">Pagamento não aprovado</span>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Aguardando pagamento...
                </p>
                <div className="flex justify-center mt-2">
                  <div className="animate-pulse w-2 h-2 bg-primary rounded-full mx-1"></div>
                  <div className="animate-pulse w-2 h-2 bg-primary rounded-full mx-1" style={{ animationDelay: '0.2s' }}></div>
                  <div className="animate-pulse w-2 h-2 bg-primary rounded-full mx-1" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRCodeDisplay;