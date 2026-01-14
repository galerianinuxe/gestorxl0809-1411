import { ArrowRight, CheckCircle } from 'lucide-react';
import { LandingCTAFinal as CTAType } from '@/hooks/useLandingData';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface LandingCTAFinalProps {
  data: CTAType | null;
  onStartTrial: () => void;
}

export function LandingCTAFinal({ data, onStartTrial }: LandingCTAFinalProps) {
  const navigate = useNavigate();
  
  if (!data) return null;

  const handleClick = () => {
    if (data.button_url?.startsWith('http')) {
      window.open(data.button_url, '_blank');
    } else if (data.button_url) {
      navigate(data.button_url);
    } else {
      onStartTrial();
    }
  };

  // Parse notes into array (split by ✓ or newline)
  const notes = data.notes?.split(/[✓\n]/).filter(n => n.trim()) || [];

  return (
    <section className="py-24 bg-gradient-to-b from-slate-900 via-emerald-950/30 to-slate-900">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Main Text */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            {data.main_text}
          </h2>
          
          {/* Sub Text */}
          {data.sub_text && (
            <p className="text-xl text-slate-300 mb-8">
              {data.sub_text}
            </p>
          )}
          
          {/* CTA Button */}
          <Button 
            size="lg" 
            onClick={handleClick}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-7 text-xl font-semibold shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:scale-105 mb-8"
          >
            {data.button_text}
            <ArrowRight className="ml-2 h-6 w-6" />
          </Button>
          
          {/* Notes */}
          {notes.length > 0 && (
            <div className="flex flex-wrap justify-center gap-6 text-slate-400">
              {notes.map((note, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span>{note.trim()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
