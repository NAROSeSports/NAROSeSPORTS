import { motion } from "framer-motion";

export function Roster() {
  const founders = [
    {
      name: "ZentionX",
      realName: "Will",
      role: "Co-Founder / IGL",
      desc: "The tactical mastermind. Will reads the map like a chessboard, coordinating breaches with lethal efficiency. Founded Naros to build a team that plays smart, not just fast.",
      image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800"
    },
    {
      name: "Figglebottom",
      realName: "Ben",
      role: "Co-Founder / Entry Fragger",
      desc: "Pure mechanical skill meets unpredictable aggression. Ben breaks lines and opens sites before the defense can react. The tip of the spear for Naros.",
      image: "https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?auto=format&fit=crop&q=80&w=800"
    }
  ];

  return (
    <section id="roster" className="py-24 md:py-32 bg-background relative" data-testid="section-roster">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-4 mb-4"
          >
            <div className="h-[1px] w-8 bg-primary" />
            <h2 className="font-mono text-sm text-primary tracking-widest uppercase">Roster</h2>
            <div className="h-[1px] w-8 bg-primary" />
          </motion.div>
          
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display font-bold text-4xl md:text-5xl tracking-tight uppercase text-foreground mb-4"
          >
            The Team
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="font-mono text-muted-foreground max-w-2xl"
          >
            THE FOUNDERS OF NAROS ESPORTS.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {founders.map((founder, idx) => (
            <motion.div
              key={founder.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + idx * 0.2, duration: 0.6 }}
              className="group relative"
            >
              <div className="relative aspect-[3/4] md:aspect-square overflow-hidden border border-border bg-card">
                <div className="absolute inset-0 bg-primary/20 mix-blend-color z-10 group-hover:opacity-0 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10" />
                
                {/* Decorative UI elements */}
                <div className="absolute top-4 left-4 z-20 font-mono text-xs text-primary border border-primary/30 px-2 py-1 bg-background/50 backdrop-blur">
                  OP_{idx + 1}
                </div>
                <div className="absolute top-4 right-4 z-20 flex gap-1">
                  <div className="w-1 h-4 bg-primary" />
                  <div className="w-1 h-4 bg-primary/50" />
                  <div className="w-1 h-4 bg-primary/20" />
                </div>
                
                <img 
                  src={founder.image} 
                  alt={founder.name}
                  className="w-full h-full object-cover object-center grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                />

                <div className="absolute bottom-0 left-0 right-0 p-8 z-20 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <div className="font-mono text-primary text-sm tracking-widest uppercase mb-2">
                    {founder.role}
                  </div>
                  <h4 className="font-display font-bold text-4xl uppercase text-white mb-1">
                    {founder.name}
                  </h4>
                  <div className="font-mono text-muted-foreground text-sm uppercase tracking-wider mb-4">
                    ID: {founder.realName}
                  </div>
                  <div className="h-0 overflow-hidden group-hover:h-auto group-hover:mt-4 transition-all duration-300 opacity-0 group-hover:opacity-100">
                    <p className="font-mono text-sm text-gray-300 leading-relaxed border-l-2 border-primary pl-4">
                      {founder.desc}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
