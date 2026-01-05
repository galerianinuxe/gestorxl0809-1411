import React, { useEffect, useState } from 'react';
import { Customer, Order } from '../types/pdv';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from '@/hooks/use-toast';
import { getRandomMotivationalQuote } from '../utils/motivationalQuotes';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import PaymentOptions, { PaymentData } from './PaymentOptions';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import { X, Save, Printer } from 'lucide-react';
import { useReceiptFormatSettings } from '@/hooks/useReceiptFormatSettings';
import { cleanMaterialName } from '@/utils/materialNameCleaner';

// Import the QZ Tray type definitions
/// <reference path="../types/qz-tray.d.ts" />

interface OrderCompletionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  onPrint: () => void;
  customer: Customer | null;
  order: Order | null;
  formatPeso: (value: string | number) => string;
  isSaleMode?: boolean;
}

const OrderCompletionModal: React.FC<OrderCompletionModalProps> = ({
  open,
  onClose,
  onSave,
  onPrint,
  customer,
  order,
  formatPeso,
  isSaleMode = false
}) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const { getCurrentFormat, getCurrentFormatSettings } = useReceiptFormatSettings();
  
  const [settings, setSettings] = useState<{
    logo: string | null;
    whatsapp1: string;
    whatsapp2: string;
    address: string;
    company: string;
  }>({ logo: null, whatsapp1: "", whatsapp2: "", address: "", company: "" });

  const [paymentData, setPaymentData] = useState<PaymentData>({
    method: ''
  });

  // Get current format and settings
  const receiptFormat = getCurrentFormat();
  const formatSettings = getCurrentFormatSettings();

  // Handle Enter key press for confirmation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (open && e.key === "Enter") {
        e.preventDefault();
        handleSaveOnly();
      }
      if (open && e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onSave, onClose]);

  // Load system settings from Supabase
  const loadSystemSettings = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar configurações:', error);
        return;
      }

      if (data) {
        setSettings({
          logo: data.logo,
          whatsapp1: data.whatsapp1 || "",
          whatsapp2: data.whatsapp2 || "",
          address: data.address || "",
          company: data.company || ""
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  useEffect(() => {
    if (open && user) {
      loadSystemSettings();
      // Reset payment data when modal opens
      setPaymentData({ method: '' });
    }
  }, [open, user]);

  // Save payment information to database
  const savePaymentInfo = async (orderId: string) => {
    if (!user?.id || !paymentData.method) return;

    try {
      const paymentRecord = {
        order_id: orderId,
        user_id: user.id,
        payment_method: paymentData.method,
        pix_key_type: paymentData.pixKeyType || null,
        pix_key_value: paymentData.pixKeyValue || null
      };

      const { error } = await supabase
        .from('order_payments')
        .insert(paymentRecord);

      if (error) {
        console.error('Erro ao salvar informações de pagamento:', error);
        toast({
          title: "Aviso",
          description: "Pedido salvo, mas houve erro ao salvar informações de pagamento.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Erro ao salvar informações de pagamento:', error);
    }
  };

  if (!customer || !order) {
    return null;
  }

  // Calculate total weight of all materials
  const totalWeight = order.items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Calculate total tara of all materials
  const totalTara = order.items.reduce((sum, item) => sum + (item.tara || 0), 0);
  
  // Calculate net weight (peso líquido)
  const netWeight = totalWeight - totalTara;

  // Enhanced direct printing function with dynamic format support using user settings
  const handleDirectPrint = async () => {
    if (!customer || !order) return;

    try {
      await onSave();
      
      // Save payment information if provided
      if (paymentData.method) {
        await savePaymentInfo(order.id);
      }
      
      toast({
        title: "Pedido salvo e impresso",
        description: "Pedido foi finalizado, salvo no banco de dados e enviado para impressão!",
        duration: 3000,
      });
      
      onClose();
      
      // Get random motivational quote
      const motivationalQuote = getRandomMotivationalQuote();
      const { logo, whatsapp1, whatsapp2, address } = settings;
      
      // Store original URL for return navigation
      const originalUrl = window.location.href;
      
      // Create print content with dynamic formatting using user settings
      const printContent = `
        <div style="
          width: ${formatSettings.container_width};
          max-width: ${formatSettings.container_width};
          margin: 0;
          padding: ${formatSettings.padding};
          font-family: 'Roboto', Arial, sans-serif;
          font-size: 12px;
          line-height: 1.3;
          color: #000 !important;
          background: #fff !important;
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        ">
          <!-- Header com logo à esquerda e WhatsApp/Endereço à direita -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: ${formatSettings.margins};">
            ${logo ? `
              <div style="width: 30%; flex: 0 0 30%; margin: 0; padding: 0;">
                <img src="${logo}" alt="Logo" style="
                  max-width: ${formatSettings.logo_max_width};
                  max-height: ${formatSettings.logo_max_height};
                  margin: 0;
                  padding: 0;
                  filter: contrast(200%) brightness(0);
                  -webkit-filter: contrast(200%) brightness(0);
                " />
              </div>
            ` : `<div style="width: 30%; flex: 0 0 30%;"></div>`}
            
            <div style="width: 70%; flex: 0 0 70%; text-align: center;">
              <div style="font-size: ${formatSettings.phone_font_size}; font-weight: bold;">
                ${whatsapp1 ? `<div style="word-wrap: break-word;">${whatsapp1}</div>` : ""}
                ${whatsapp2 ? `<div style="margin-top: 2px; word-wrap: break-word;">${whatsapp2}</div>` : ""}
              </div>
              ${address ? `
                <div style="font-size: ${formatSettings.address_font_size}; margin-top: 3mm; font-weight: bold; text-align: center; word-wrap: break-word; overflow-wrap: break-word;">
                  ${address}
                </div>
              ` : ""}
            </div>
          </div>
          
          <div style="text-align: center; font-weight: bold; font-size: ${formatSettings.title_font_size}; margin-bottom: 1.05mm;">
            ${isSaleMode ? "COMPROVANTE DE VENDA" : "COMPROVANTE DE PEDIDO"}
          </div>
          
          <div style="text-align: center; margin-bottom: 3.6mm; font-size: ${formatSettings.customer_font_size}; font-weight: bold;">
            Cliente: ${customer.name}
          </div>
          
          ${paymentData.method ? `
            <div style="text-align: center; margin-bottom: 3.6mm; font-size: ${receiptFormat === '50mm' ? '8px' : '16px'}; font-weight: bold;">
              Pagamento: ${paymentData.method.toUpperCase()}
              ${paymentData.method === 'pix' && paymentData.pixKeyValue ? `<br/>PIX: ${paymentData.pixKeyValue}` : ''}
            </div>
          ` : ''}
          
          <div style="border-bottom: 2px solid #000; margin: ${formatSettings.margins};"></div>
          
          <table style="
            width: 100%;
            border-collapse: collapse;
            font-size: ${formatSettings.table_font_size};
            margin-bottom: 3mm;
            font-weight: bold;
          ">
            <thead>
              <tr>
                <th style="text-align: left; border-bottom: 1px solid #000; padding: 2mm 0; font-weight: bold;">Material</th>
                <th style="text-align: right; border-bottom: 1px solid #000; padding: 2mm 0; font-weight: bold;">Peso</th>
                <th style="text-align: right; border-bottom: 1px solid #000; padding: 2mm 0; font-weight: bold;">R$/kg</th>
                <th style="text-align: right; border-bottom: 1px solid #000; padding: 2mm 0; font-weight: bold;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => {
                const pesoLiquido = item.quantity - (item.tara || 0);
                const cleanedName = cleanMaterialName(item.materialName);
                return `
                  <tr>
                    <td style="padding: 1mm 0; vertical-align: top; font-weight: bold; word-wrap: break-word;">
                      ${cleanedName}
                      ${item.tara && item.tara > 0 ? `<br/><span style="font-size: ${receiptFormat === '50mm' ? '8px' : '10.8px'}; font-weight: bold;">Tara: ${formatPeso(item.tara).replace('/kg', '')} kg</span>` : ""}
                      ${item.tara && item.tara > 0 ? `<br/><span style="font-size: ${receiptFormat === '50mm' ? '8px' : '10.8px'}; font-weight: bold;">P. Líquido: ${formatPeso(pesoLiquido).replace('/kg', '')} kg</span>` : ""}
                    </td>
                    <td style="text-align: right; padding: 1mm 0; font-weight: bold;">${formatPeso(item.quantity).replace('/kg','')}</td>
                    <td style="text-align: right; padding: 1mm 0; font-weight: bold;">${item.price.toFixed(2)}</td>
                    <td style="text-align: right; padding: 1mm 0; font-weight: bold;">${item.total.toFixed(2)}</td>
                  </tr>
                `}).join("")}
            </tbody>
          </table>
          
          <div style="border-bottom: 2px solid #000; margin: ${formatSettings.margins};"></div>
          
          <div style="display: flex; justify-content: space-between; margin: 1.4mm 0; font-size: ${formatSettings.totals_font_size}; font-weight: bold;">
            <span>Peso Bruto:</span>
            <span>${formatPeso(totalWeight).replace('/kg','')} kg</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin: 1.4mm 0; font-size: ${formatSettings.totals_font_size}; font-weight: bold;">
            <span>Total Tara:</span>
            <span>${formatPeso(totalTara).replace('/kg','')} kg</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin: 1.4mm 0; font-size: ${formatSettings.totals_font_size}; font-weight: bold;">
            <span>Peso Líquido:</span>
            <span>${formatPeso(netWeight).replace('/kg','')} kg</span>
          </div>
          
          <div style="border-bottom: 2px solid #000; margin: ${formatSettings.margins};"></div>
          
          <div style="text-align: right; font-weight: bold; font-size: ${formatSettings.final_total_font_size}; margin: 2.16mm 0;">
            ${isSaleMode ? "Total a Receber: " : "Total: "} R$ ${order.total.toFixed(2)}
          </div>
          
          <div style="text-align: center; font-size: ${formatSettings.datetime_font_size}; margin: ${formatSettings.margins}; font-weight: bold;">
            ${new Date(order.timestamp).toLocaleString('pt-BR')}
          </div>
          
          <div style="text-align: center; font-size: ${formatSettings.quote_font_size}; margin-top: 4mm; font-weight: bold; font-style: italic; word-wrap: break-word;">
            ${motivationalQuote}
          </div>
        </div>
      `;

      // Create complete HTML document for printing with dynamic page size using user settings
      const printDocument = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Comprovante</title>
            <style>
              @page { size: ${formatSettings.container_width} auto; margin: 0; }
              @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
              @media print {
                html, body {
                  width: ${formatSettings.container_width};
                  margin: 0;
                  padding: 0;
                  background: #fff !important;
                  color: #000 !important;
                  -webkit-print-color-adjust: exact;
                  color-adjust: exact;
                  font-family: 'Roboto', Arial, sans-serif;
                }
                * {
                  -webkit-print-color-adjust: exact;
                  color-adjust: exact;
                  font-family: 'Roboto', Arial, sans-serif;
                }
              }
              html, body {
                font-family: 'Roboto', Arial, sans-serif;
                margin: 0;
                padding: 0;
                background: #fff;
                color: #000;
              }
              
              .return-message {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #333;
                color: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                z-index: 9999;
                display: none;
              }
              
              @media print {
                .return-message {
                  display: none !important;
                }
              }
            </style>
          </head>
          <body>
            ${printContent}
            
            <div class="return-message" id="returnMessage">
              <h3>Retornando ao sistema PDV...</h3>
              <p>Aguarde um momento</p>
            </div>
            
            <script>
              let printCompleted = false;
              let returnTimer = null;
              const originalUrl = "${originalUrl}";
              
              function returnToPDV() {
                if (!printCompleted) {
                  printCompleted = true;
                  
                  // Show return message briefly
                  const returnMsg = document.getElementById('returnMessage');
                  if (returnMsg) {
                    returnMsg.style.display = 'block';
                  }
                  
                  // Return to PDV after a short delay
                  setTimeout(() => {
                    // Try multiple navigation methods for better compatibility
                    try {
                      // Method 1: Replace current location
                      window.location.replace(originalUrl);
                    } catch (e) {
                      try {
                        // Method 2: Assign location
                        window.location.href = originalUrl;
                      } catch (e2) {
                        try {
                          // Method 3: Go back in history
                          window.history.back();
                        } catch (e3) {
                          // Method 4: Reload the page
                          window.location.reload();
                        }
                      }
                    }
                  }, 500);
                }
              }
              
              window.onload = function() {
                // Auto-trigger print dialog
                setTimeout(() => {
                  window.print();
                }, 100);
                
                // Set a fallback timer to return after 8 seconds for better UX
                returnTimer = setTimeout(returnToPDV, 8000);
              };
              
              // Detect when printing is complete or canceled
              window.onafterprint = function() {
                if (returnTimer) {
                  clearTimeout(returnTimer);
                }
                returnToPDV();
              };
              
              // Handle beforeprint event
              window.onbeforeprint = function() {
                if (returnTimer) {
                  clearTimeout(returnTimer);
                }
              };
              
              // Handle escape key and other navigation attempts
              window.addEventListener('keydown', function(e) {
                if ((e.key === 'Escape' || e.keyCode === 27) && !printCompleted) {
                  if (returnTimer) {
                    clearTimeout(returnTimer);
                  }
                  returnToPDV();
                }
              });
              
              // Handle browser navigation events
              window.addEventListener('beforeunload', function() {
                if (returnTimer) {
                  clearTimeout(returnTimer);
                }
              });
              
              // Handle focus events (when user clicks back to tab)
              window.addEventListener('focus', function() {
                // If we regain focus after some time, assume print dialog was closed
                setTimeout(() => {
                  if (!printCompleted) {
                    if (returnTimer) {
                      clearTimeout(returnTimer);
                    }
                    returnToPDV();
                  }
                }, 1000);
              });
              
              // Handle visibility change (tab switching)
              document.addEventListener('visibilitychange', function() {
                if (!document.hidden && !printCompleted) {
                  // Tab became visible again, likely print dialog was closed
                  setTimeout(() => {
                    if (!printCompleted) {
                      if (returnTimer) {
                        clearTimeout(returnTimer);
                      }
                      returnToPDV();
                    }
                  }, 500);
                }
              });
            </script>
          </body>
        </html>
      `;

      // Delay the print to allow modal to close first
      setTimeout(() => {
        // Replace current page content with print document
        document.open();
        document.write(printDocument);
        document.close();
      }, 300);
      
    } catch (error) {
      console.error('Error saving order before printing:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar pedido. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleSaveOnly = async () => {
    try {
      await onSave();
      
      // Save payment information if provided
      if (paymentData.method) {
        await savePaymentInfo(order.id);
      }
      
      onClose();
      
      toast({
        title: "Pedido salvo",
        description: "Pedido foi finalizado e salvo no banco de dados com sucesso!",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error saving order:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar pedido. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`bg-pdv-dark border-gray-700 border-t-[7px] border-t-[#4fd683] 
        ${isMobile || isTablet 
          ? 'max-w-[98vw] max-h-[95vh] p-2 m-2' 
          : '!w-[95vw] !max-w-[1300px] !max-h-[95vh]'
        }`}>
        <DialogHeader>
          <DialogTitle className={`text-white 
            ${isMobile || isTablet ? 'text-base px-1' : 'text-xl'}
          `}>
            {isSaleMode ? "Resumo da Venda" : "Resumo do Pedido"} - {customer.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className={`text-white ${isMobile || isTablet ? 'mt-1' : 'mt-4'}`}>
          {/* Layout para Desktop */}
          {!isMobile && !isTablet && (
            <div className="flex gap-6">
              {/* Main content - 75% width */}
              <div className="flex-1">
                <ScrollArea className="h-[35vh]">
                  <Table>
                    <TableHeader className="bg-gray-800">
                      <TableRow>
                        <TableHead className="text-white">Material</TableHead>
                        <TableHead className="text-white text-right">Quantidade</TableHead>
                        <TableHead className="text-white text-right">Preço/kg</TableHead>
                        <TableHead className="text-white text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items.map((item, index) => (
                        <TableRow key={index} className="border-gray-700">
                          <TableCell className="text-white text-[94%]">
                            {cleanMaterialName(item.materialName)}
                            {item.tara && item.tara > 0 && (
                              <div className="text-xs text-yellow-400">
                                Tara: {formatPeso(item.tara).replace('/kg', '')} kg
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-white text-right">{formatPeso(item.quantity).replace('/kg', '')} kg</TableCell>
                          <TableCell className="text-white text-right">R$ {item.price.toFixed(2)}</TableCell>
                          <TableCell className="text-white text-right text-[94%]">R$ {item.total.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>

                {/* Summary section redesigned as a 2x2 grid */}
                <div className="mt-4 px-4 py-3 border-t-2 border-gray-600">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col p-2 border border-gray-700 rounded-md">
                      <span className="text-white font-bold">Peso Bruto:</span>
                      <span className="text-white font-bold text-[28px]">{formatPeso(totalWeight).replace('/kg', '')} kg</span>
                    </div>
                    <div className="flex flex-col p-2 border border-gray-700 rounded-md">
                      <span className="text-white font-bold">
                        {isSaleMode ? "Total a Receber:" : "Total:"}
                      </span>
                      <span className="text-[#40f597] font-bold text-[28px]">R$ {order.total.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col p-2 border border-gray-700 rounded-md">
                      <span className="text-yellow-400 font-bold">Total Tara:</span>
                      <span className="text-white font-bold text-[28px]">{formatPeso(totalTara).replace('/kg', '')} kg</span>
                    </div>
                    <div className="flex flex-col p-2 border border-gray-700 rounded-md">
                      <span className="text-white font-bold">Peso Líquido:</span>
                      <span className="text-white font-bold text-[28px]">{formatPeso(netWeight).replace('/kg', '')} kg</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Options - 25% width */}
              <div className="w-1/4 min-w-[280px]">
                <PaymentOptions 
                  isSaleMode={isSaleMode}
                  onPaymentChange={setPaymentData}
                  paymentData={paymentData}
                />
              </div>
            </div>
          )}

          {/* Layout para Mobile e Tablet - Com tamanhos de fonte aumentados em 10% */}
          {(isMobile || isTablet) && (
            <div className="space-y-1 overflow-hidden">
              {/* Items Table com altura reduzida e scroll - tamanhos aumentados */}
              <ScrollArea className="h-[20vh] border border-gray-700 rounded">
                <Table>
                  <TableHeader className="bg-gray-800">
                    <TableRow>
                      <TableHead className="text-white text-[11px] p-1">Material</TableHead>
                      <TableHead className="text-white text-right text-[11px] p-1">Qtd</TableHead>
                      <TableHead className="text-white text-right text-[11px] p-1">R$/kg</TableHead>
                      <TableHead className="text-white text-right text-[11px] p-1">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item, index) => (
                      <TableRow key={index} className="border-gray-700">
                        <TableCell className="text-white text-[11px] p-1">
                          <div className="truncate max-w-[80px]">{cleanMaterialName(item.materialName)}</div>
                          {item.tara && item.tara > 0 && (
                            <div className="text-[9px] text-yellow-400">
                              Tara: {formatPeso(item.tara).replace('/kg', '')} kg
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-white text-right text-[11px] p-1">{formatPeso(item.quantity).replace('/kg', '')} kg</TableCell>
                        <TableCell className="text-white text-right text-[11px] p-1">R$ {item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-white text-right text-[11px] p-1">R$ {item.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {/* Payment Options com tamanho aumentado e consistente */}
              <div className="py-1">
                <div className="bg-gray-800 p-2 rounded border border-gray-700">
                  <h3 className="text-white font-bold text-sm mb-1">Forma de Pagamento:</h3>
                  <PaymentOptions 
                    isSaleMode={isSaleMode}
                    onPaymentChange={setPaymentData}
                    paymentData={paymentData}
                  />
                </div>
              </div>

              {/* Summary section com grid 2x2 - tamanhos aumentados */}
              <div className="py-1">
                <div className="grid grid-cols-2 gap-1">
                  <div className="flex flex-col p-1 border border-gray-700 rounded-md bg-gray-800">
                    <span className="text-white font-bold text-[11px]">Peso Bruto:</span>
                    <span className="text-white font-bold text-base">{formatPeso(totalWeight).replace('/kg', '')} kg</span>
                  </div>
                  <div className="flex flex-col p-1 border border-gray-700 rounded-md bg-gray-800">
                    <span className="text-white font-bold text-[11px]">
                      {isSaleMode ? "Total:" : "Total:"}
                    </span>
                    <span className="text-[#40f597] font-bold text-base">R$ {order.total.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col p-1 border border-gray-700 rounded-md bg-gray-800">
                    <span className="text-yellow-400 font-bold text-[11px]">Total Tara:</span>
                    <span className="text-white font-bold text-base">{formatPeso(totalTara).replace('/kg', '')} kg</span>
                  </div>
                  <div className="flex flex-col p-1 border border-gray-700 rounded-md bg-gray-800">
                    <span className="text-white font-bold text-[11px]">Peso Líquido:</span>
                    <span className="text-white font-bold text-base">{formatPeso(netWeight).replace('/kg', '')} kg</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Buttons com ordem reorganizada para mobile/tablet e ícones adicionados */}
        <div className={`${
          isMobile || isTablet 
            ? 'mt-1 flex flex-col gap-1' 
            : 'mt-4 grid grid-cols-3 gap-3'
        }`}>
          {/* Desktop layout - ordem original com ícones e altura aumentada */}
          {!isMobile && !isTablet && (
            <>
              <Button 
                variant="outline" 
                className="bg-transparent text-white hover:bg-gray-600 border border-gray-600 h-[90px] text-[18px] gap-2"
                onClick={onClose}
              >
                <X size={20} />
                Cancelar
              </Button>
              <Button 
                className="bg-transparent hover:bg-opacity-20 hover:bg-[#f0cd22]/10 text-[#f0cd22] border border-[#f0cd22] h-[90px] text-[18px] gap-2"
                onClick={handleSaveOnly}
              >
                <Save size={20} />
                Só Salvar
              </Button>
              <Button 
                className="bg-transparent hover:bg-opacity-20 hover:bg-[#22e697]/10 text-[#22e697] border border-[#22e697] h-[90px] text-[18px] gap-2"
                onClick={handleDirectPrint}
              >
                <Printer size={20} />
                Imprimir Recibo
              </Button>
            </>
          )}

          {/* Mobile/Tablet layout - ordem reorganizada: Imprimir, Só Salvar, Cancelar com ícones */}
          {(isMobile || isTablet) && (
            <>
              <Button 
                className="bg-transparent hover:bg-opacity-20 hover:bg-[#22e697]/10 text-[#22e697] border border-[#22e697] h-[40px] text-[16px] gap-2"
                onClick={handleDirectPrint}
              >
                <Printer size={16} />
                Imprimir
              </Button>
              <Button 
                className="bg-transparent hover:bg-opacity-20 hover:bg-[#f0cd22]/10 text-[#f0cd22] border border-[#f0cd22] h-[40px] text-[16px] gap-2"
                onClick={handleSaveOnly}
              >
                <Save size={16} />
                Só Salvar
              </Button>
              <Button 
                variant="outline" 
                className="bg-transparent text-white hover:bg-gray-600 border border-gray-600 h-[40px] text-[16px] gap-2"
                onClick={onClose}
              >
                <X size={16} />
                Cancelar
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderCompletionModal;
