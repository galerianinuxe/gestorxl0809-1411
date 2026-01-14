import { Star, Quote, TrendingUp } from 'lucide-react';
import { LandingTestimonial } from '@/hooks/useLandingData';

interface LandingTestimonialsProps {
  items: LandingTestimonial[];
}

export function LandingTestimonials({ items }: LandingTestimonialsProps) {
  if (!items.length) return null;

  return (
    <section className="py-20 bg-slate-800/50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            O Que Nossos <span className="text-emerald-400">Clientes</span> Dizem
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Donos de depósito de sucata como você que já estão usando o XLata
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {items.map((testimonial) => (
            <div 
              key={testimonial.id}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-300"
            >
              {/* Quote Icon */}
              <Quote className="w-8 h-8 text-emerald-500/30 mb-4" />
              
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i}
                    className={`w-4 h-4 ${
                      i < testimonial.rating 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-slate-600'
                    }`}
                  />
                ))}
              </div>
              
              {/* Text */}
              <p className="text-slate-300 mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>
              
              {/* Revenue Badge */}
              {testimonial.revenue && (
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1 mb-4">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 text-sm font-medium">
                    {testimonial.revenue}
                  </span>
                </div>
              )}
              
              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-700">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  {testimonial.photo_url ? (
                    <img 
                      src={testimonial.photo_url} 
                      alt={testimonial.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-emerald-400 font-bold text-lg">
                      {testimonial.name.charAt(0)}
                    </span>
                  )}
                </div>
                
                <div>
                  <p className="font-semibold text-white">{testimonial.name}</p>
                  <p className="text-slate-400 text-sm">
                    {testimonial.company && `${testimonial.company} • `}
                    {testimonial.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
