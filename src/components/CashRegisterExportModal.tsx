import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, FileText, Download, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CashRegister, CashSummary } from '../types/pdv';
import { PaymentBreakdown } from '../utils/cashRegisterCalculations';

interface CashRegisterExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  cashRegister: CashRegister | null;
  cashSummary: CashSummary | null;
  pendingFinalAmount: number | null;
  purchaseBreakdown: PaymentBreakdown;
  salesBreakdown: PaymentBreakdown;
  purchaseWeight: number;
  salesWeight: number;
  salesCount: number;
  totalTransactions: number;
  totalOpening: number;
  additionsCount: number;
  realTimeDifference: number;
  userWhatsapp: string;
  companyName: string;
}

const CashRegisterExportModal: React.FC<CashRegisterExportModalProps> = ({
  open,
  onOpenChange,
  onComplete,
  cashRegister,
  cashSummary,
  pendingFinalAmount,
  purchaseBreakdown,
  salesBreakdown,
  purchaseWeight,
  salesWeight,
  salesCount,
  totalTransactions,
  totalOpening,
  additionsCount,
  realTimeDifference,
  userWhatsapp,
  companyName
}) => {
  if (!cashRegister || !cashSummary || pendingFinalAmount === null) {
    return null;
  }

  const totalExpenses = cashSummary.expenses 
    ? cashSummary.expenses.reduce((sum, expense) => sum + expense.amount, 0) 
    : 0;

  const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`;
  const formatWeight = (value: number) => `${value.toFixed(3)} kg`;
  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleDateString('pt-BR');
  const formatDateTime = (date: Date) => date.toLocaleString('pt-BR');

  // Gerar texto formatado para WhatsApp
  const generateWhatsAppText = () => {
    const statusText = realTimeDifference === 0 
      ? '✅ CONFERE' 
      : realTimeDifference > 0 
        ? '🔵 SOBRA' 
        : '🔴 FALTA';

    const text = `
📊 *FECHAMENTO DE CAIXA*
${companyName ? `🏢 ${companyName}` : ''}
📅 Data: ${formatDate(cashRegister.openingTimestamp)}
🕐 Fechado em: ${formatDateTime(new Date())}

━━━━━━━━━━━━━━━━━━━━━

💰 *RESUMO FINANCEIRO*

📥 Abertura: ${formatCurrency(totalOpening)}${additionsCount > 0 ? ` (+${additionsCount} adições)` : ''}

💵 *Compras:*
   • Dinheiro: ${formatCurrency(purchaseBreakdown.cashAmount)}
   • PIX: ${formatCurrency(purchaseBreakdown.pixAmount)}
   
💳 *Vendas:*
   • Total: ${formatCurrency(cashSummary.totalSales)}
   • Dinheiro: ${formatCurrency(salesBreakdown.cashAmount)}
   • PIX: ${formatCurrency(salesBreakdown.pixAmount)}

📤 Despesas: ${formatCurrency(totalExpenses)}

━━━━━━━━━━━━━━━━━━━━━

⚖️ *PESO TOTAL*
   • Compras: ${formatWeight(purchaseWeight)}
   • Vendas: ${formatWeight(salesWeight)}

━━━━━━━━━━━━━━━━━━━━━

📈 *RESULTADO*

💼 Saldo Esperado: ${formatCurrency(cashSummary.expectedAmount)}
💵 Saldo Final: ${formatCurrency(pendingFinalAmount)}
${statusText} ${formatCurrency(Math.abs(realTimeDifference))}

🔢 Total de Transações: ${totalTransactions}
🛒 Vendas Realizadas: ${salesCount}

━━━━━━━━━━━━━━━━━━━━━
✨ Relatório gerado automaticamente
`.trim();

    return text;
  };

  // Enviar para WhatsApp
  const handleSendWhatsApp = () => {
    const text = generateWhatsAppText();
    const encodedText = encodeURIComponent(text);
    
    // Limpar número do WhatsApp e garantir código do país
    let cleanNumber = userWhatsapp.replace(/\D/g, '');
    
    // Se o número não começar com 55 (código do Brasil), adicionar
    if (cleanNumber.length >= 10 && !cleanNumber.startsWith('55')) {
      cleanNumber = '55' + cleanNumber;
    }
    
    if (!cleanNumber) {
      toast({
        title: "WhatsApp não configurado",
        description: "Configure seu número de WhatsApp nas configurações do sistema.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "WhatsApp aberto",
      description: "O relatório foi preparado para envio.",
      duration: 2000,
    });
  };

  // Gerar e baixar PDF
  const handleDownloadPDF = async () => {
    try {
      // Importar html2pdf dinamicamente
      const html2pdf = (await import('html2pdf.js')).default;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #333;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .header h1 {
              margin: 0 0 5px 0;
              font-size: 24px;
            }
            .header p {
              margin: 0;
              color: #666;
            }
            .section {
              margin-bottom: 20px;
            }
            .section h2 {
              font-size: 16px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
            }
            th, td {
              padding: 8px;
              text-align: left;
              border-bottom: 1px solid #eee;
            }
            th {
              background: #f5f5f5;
            }
            td:last-child {
              text-align: right;
              font-weight: bold;
            }
            .result {
              background: ${realTimeDifference === 0 ? '#e8f5e9' : realTimeDifference > 0 ? '#e3f2fd' : '#ffebee'};
              padding: 15px;
              border-radius: 8px;
              margin-top: 20px;
            }
            .result-status {
              font-size: 20px;
              font-weight: bold;
              color: ${realTimeDifference === 0 ? '#2e7d32' : realTimeDifference > 0 ? '#1976d2' : '#c62828'};
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #999;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>FECHAMENTO DE CAIXA</h1>
            ${companyName ? `<p><strong>${companyName}</strong></p>` : ''}
            <p>Data: ${formatDate(cashRegister.openingTimestamp)} | Fechado em: ${formatDateTime(new Date())}</p>
          </div>

          <div class="section">
            <h2>💰 Resumo Financeiro</h2>
            <table>
              <tr><th>Descrição</th><th>Valor</th></tr>
              <tr><td>Abertura${additionsCount > 0 ? ` (+${additionsCount} adições)` : ''}</td><td>${formatCurrency(totalOpening)}</td></tr>
              <tr><td>Compras em Dinheiro</td><td>${formatCurrency(purchaseBreakdown.cashAmount)}</td></tr>
              <tr><td>Compras em PIX</td><td>${formatCurrency(purchaseBreakdown.pixAmount)}</td></tr>
              <tr><td>Total de Vendas</td><td>${formatCurrency(cashSummary.totalSales)}</td></tr>
              <tr><td>Vendas em Dinheiro</td><td>${formatCurrency(salesBreakdown.cashAmount)}</td></tr>
              <tr><td>Vendas em PIX</td><td>${formatCurrency(salesBreakdown.pixAmount)}</td></tr>
              <tr><td>Total de Despesas</td><td>${formatCurrency(totalExpenses)}</td></tr>
            </table>
          </div>

          <div class="section">
            <h2>⚖️ Peso Total</h2>
            <table>
              <tr><th>Tipo</th><th>Peso</th></tr>
              <tr><td>Compras</td><td>${formatWeight(purchaseWeight)}</td></tr>
              <tr><td>Vendas</td><td>${formatWeight(salesWeight)}</td></tr>
            </table>
          </div>

          <div class="result">
            <table>
              <tr><td>Saldo Esperado</td><td>${formatCurrency(cashSummary.expectedAmount)}</td></tr>
              <tr><td>Saldo Final</td><td>${formatCurrency(pendingFinalAmount)}</td></tr>
            </table>
            <p class="result-status">
              ${realTimeDifference === 0 ? '✅ CONFERE' : realTimeDifference > 0 ? '🔵 SOBRA' : '🔴 FALTA'} 
              ${formatCurrency(Math.abs(realTimeDifference))}
            </p>
          </div>

          <div class="section">
            <h2>📊 Estatísticas</h2>
            <table>
              <tr><td>Total de Transações</td><td>${totalTransactions}</td></tr>
              <tr><td>Vendas Realizadas</td><td>${salesCount}</td></tr>
            </table>
          </div>

          <div class="footer">
            Relatório gerado automaticamente em ${formatDateTime(new Date())}
          </div>
        </body>
        </html>
      `;

      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      document.body.appendChild(container);

      const options = {
        margin: 10,
        filename: `fechamento-caixa-${formatDate(cashRegister.openingTimestamp).replace(/\//g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().from(container).set(options).save();
      document.body.removeChild(container);

      toast({
        title: "PDF gerado com sucesso",
        description: "O arquivo foi baixado.",
        duration: 2000,
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // Gerar e baixar CSV
  const handleDownloadCSV = () => {
    try {
      const csvRows = [
        ['FECHAMENTO DE CAIXA'],
        [companyName || ''],
        [`Data: ${formatDate(cashRegister.openingTimestamp)}`],
        [`Fechado em: ${formatDateTime(new Date())}`],
        [''],
        ['RESUMO FINANCEIRO'],
        ['Descrição', 'Valor'],
        ['Abertura', totalOpening.toFixed(2)],
        ['Adições de Saldo', additionsCount.toString()],
        ['Compras em Dinheiro', purchaseBreakdown.cashAmount.toFixed(2)],
        ['Compras em PIX', purchaseBreakdown.pixAmount.toFixed(2)],
        ['Total de Vendas', cashSummary.totalSales.toFixed(2)],
        ['Vendas em Dinheiro', salesBreakdown.cashAmount.toFixed(2)],
        ['Vendas em PIX', salesBreakdown.pixAmount.toFixed(2)],
        ['Total de Despesas', totalExpenses.toFixed(2)],
        [''],
        ['PESO TOTAL'],
        ['Tipo', 'Peso (kg)'],
        ['Compras', purchaseWeight.toFixed(3)],
        ['Vendas', salesWeight.toFixed(3)],
        [''],
        ['RESULTADO'],
        ['Saldo Esperado', cashSummary.expectedAmount.toFixed(2)],
        ['Saldo Final', pendingFinalAmount.toFixed(2)],
        ['Diferença', realTimeDifference.toFixed(2)],
        ['Status', realTimeDifference === 0 ? 'CONFERE' : realTimeDifference > 0 ? 'SOBRA' : 'FALTA'],
        [''],
        ['ESTATÍSTICAS'],
        ['Total de Transações', totalTransactions.toString()],
        ['Vendas Realizadas', salesCount.toString()],
      ];

      const csvContent = csvRows.map(row => row.join(';')).join('\n');
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `fechamento-caixa-${formatDate(cashRegister.openingTimestamp).replace(/\//g, '-')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "CSV gerado com sucesso",
        description: "O arquivo foi baixado.",
        duration: 2000,
      });
    } catch (error) {
      console.error('Erro ao gerar CSV:', error);
      toast({
        title: "Erro ao gerar CSV",
        description: "Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 text-white border-gray-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-white text-lg">
            Exportar Relatório
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            Escolha como deseja exportar o resumo do fechamento
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 py-4">
          {/* WhatsApp */}
          <Button 
            onClick={handleSendWhatsApp}
            className="bg-green-600 hover:bg-green-700 text-white h-12 flex items-center justify-center gap-3"
          >
            <MessageCircle className="h-5 w-5" />
            Enviar para WhatsApp
          </Button>
          
          {/* PDF */}
          <Button 
            onClick={handleDownloadPDF}
            className="bg-red-600 hover:bg-red-700 text-white h-12 flex items-center justify-center gap-3"
          >
            <FileText className="h-5 w-5" />
            Baixar PDF
          </Button>
          
          {/* CSV */}
          <Button 
            onClick={handleDownloadCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white h-12 flex items-center justify-center gap-3"
          >
            <Download className="h-5 w-5" />
            Baixar CSV
          </Button>
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline"
            onClick={handleSkip}
            className="w-full bg-transparent hover:bg-gray-700 text-white border-gray-600"
          >
            <X className="h-4 w-4 mr-2" />
            Pular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CashRegisterExportModal;
