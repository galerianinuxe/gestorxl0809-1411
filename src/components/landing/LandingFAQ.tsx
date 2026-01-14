import { LandingFAQ as FAQType } from '@/hooks/useLandingData';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

interface LandingFAQProps {
  items: FAQType[];
}

export function LandingFAQ({ items }: LandingFAQProps) {
  if (!items.length) return null;

  return (
    <section className="py-20 bg-slate-900">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-2 mb-6">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-sm font-medium">Dúvidas? A gente responde</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Perguntas <span className="text-emerald-400">Frequentes</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            As dúvidas mais comuns de quem está conhecendo o XLata
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {items.map((item, index) => (
              <AccordionItem 
                key={item.id} 
                value={item.id}
                className="bg-slate-800 border border-slate-700 rounded-xl px-6 data-[state=open]:border-emerald-500/50"
              >
                <AccordionTrigger className="text-left text-white hover:text-emerald-400 hover:no-underline py-5">
                  <span className="flex items-start gap-3">
                    <span className="text-emerald-500 font-bold">{String(index + 1).padStart(2, '0')}.</span>
                    {item.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-slate-400 pb-5 pl-8">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Extra CTA */}
        <div className="text-center mt-12">
          <p className="text-slate-500">
            Ainda tem dúvidas?{' '}
            <a 
              href="https://wa.me/5511999999999" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Fale com a gente no WhatsApp
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
