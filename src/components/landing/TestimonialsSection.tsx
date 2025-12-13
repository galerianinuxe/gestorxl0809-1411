import React from 'react';
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Rocket, Award, TrendingUp, Target, User2, MessageSquare } from 'lucide-react';

interface Testimonial {
  id?: string;
  name: string;
  company: string;
  location: string;
  rating: number;
  text: string;
  revenue: string;
  icon: string;
  profileImage?: string;
}

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ testimonials }) => {
  if (!testimonials || testimonials.length === 0) return null;

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, React.ElementType> = {
      Rocket, Award, TrendingUp, Star, Target, User2, MessageSquare
    };
    return icons[iconName] || Star;
  };

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-b from-gray-900 to-gray-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-900/10 via-transparent to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <Badge className="mb-4 bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 px-4 py-1.5 text-sm font-medium">
            <Star className="h-4 w-4 mr-2 fill-yellow-400" />
            O QUE NOSSOS CLIENTES DIZEM
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4">
            Mais de 130 donos de depósito aprovam
          </h2>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
            Veja o que nossos clientes têm a dizer sobre o XLata.site
          </p>
        </div>
        
        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {testimonials.map((testimonial, index) => {
            const IconComponent = getIconComponent(testimonial.icon);
            
            return (
              <Card key={testimonial.id || index} className="bg-gray-900/60 border-gray-800 hover:border-yellow-500/30 transition-all duration-300">
                <CardHeader className="space-y-4">
                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  
                  {/* Profile */}
                  <div className="flex items-center gap-3">
                    {testimonial.profileImage ? (
                      <img 
                        src={testimonial.profileImage} 
                        alt={`Foto de ${testimonial.name}`}
                        className="w-12 h-12 rounded-full object-cover border-2 border-yellow-500/40"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-white text-sm sm:text-base">{testimonial.name}</p>
                      <p className="text-xs sm:text-sm text-gray-400">{testimonial.company}</p>
                      <p className="text-xs text-yellow-500">{testimonial.location}</p>
                    </div>
                  </div>
                  
                  {/* Revenue Badge */}
                  <Badge className="w-fit bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                    {testimonial.revenue}
                  </Badge>
                  
                  {/* Quote */}
                  <blockquote className="text-gray-300 text-sm sm:text-base italic leading-relaxed">
                    "{testimonial.text}"
                  </blockquote>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;