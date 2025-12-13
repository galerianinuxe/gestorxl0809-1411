import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from 'lucide-react';

const FAQSection: React.FC = () => {
  const faqs = [
    {
      question: "O XLata.site funciona no meu celular?",
      answer: "Sim! O sistema é 100% online e funciona em qualquer dispositivo com internet: celular, tablet, computador ou notebook. Não precisa instalar nada."
    },
    {
      question: "Preciso de balança conectada ao computador?",
      answer: "Não é obrigatório. Você pode digitar os pesos manualmente ou, se preferir mais agilidade, conectar sua balança ao sistema. Funciona dos dois jeitos."
    },
    {
      question: "E se eu tiver dúvida ou o sistema travar?",
      answer: "Nosso suporte funciona 24 horas por dia via WhatsApp. Se travar, deu erro ou você ficou com dúvida, é só chamar que resolvemos rapidinho."
    },
    {
      question: "Meus dados ficam seguros?",
      answer: "Sim! Usamos criptografia de ponta e backup automático na nuvem. Seus dados estão protegidos e você não perde nada, mesmo se seu computador quebrar."
    },
    {
      question: "Como funciona o período de teste grátis?",
      answer: "Você tem 7 dias para testar o sistema completo, sem precisar colocar cartão de crédito. Se gostar, escolhe um plano. Se não gostar, não paga nada."
    },
    {
      question: "Posso cancelar quando quiser?",
      answer: "Sim! Não tem fidelidade. Se quiser cancelar, é só avisar pelo WhatsApp. Sem burocracia, sem pergunta, sem multa."
    },
    {
      question: "O sistema emite nota fiscal?",
      answer: "O XLata.site gera comprovantes de pesagem e relatórios financeiros. Para emissão de NF-e oficial, você precisa de um sistema fiscal à parte (não fazemos emissão de notas fiscais)."
    },
    {
      question: "Quantos materiais/tipos de sucata posso cadastrar?",
      answer: "Quantos você quiser! Não tem limite. Cobre, alumínio, ferro, papelão, plástico, latinha... você cadastra tudo o que trabalha."
    }
  ];

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-b from-gray-900 to-gray-950 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <Badge className="mb-4 bg-gray-800 text-gray-300 border border-gray-700 px-4 py-1.5 text-sm font-medium">
            <HelpCircle className="h-4 w-4 mr-2" />
            PERGUNTAS FREQUENTES
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4">
            Tire suas dúvidas
          </h2>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
            Respostas para as perguntas mais comuns sobre o XLata.site
          </p>
        </div>
        
        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-gray-900/60 border border-gray-800 rounded-xl px-4 sm:px-6 data-[state=open]:border-emerald-500/40"
              >
                <AccordionTrigger className="text-left text-white hover:text-emerald-400 hover:no-underline py-4 sm:py-5 text-sm sm:text-base font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-400 text-sm sm:text-base pb-4 sm:pb-5 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;