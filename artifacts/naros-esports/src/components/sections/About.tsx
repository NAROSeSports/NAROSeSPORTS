import { motion } from "framer-motion";
import { Target, Shield, Zap } from "lucide-react";

export function About() {
  const features = [
    {
      icon: <Target className="w-8 h-8 text-primary" />,
      title: "Deadly Focus",
      desc: "We don't play everything. We play Rainbow Six Siege. Total dedication to mastery of a single domain."
    },
    {
      icon: <Shield className="w-8 h-8 text-primary" />,
      title: "Iron Defense",
      desc: "Built from the ground up by players, for players. A fortress of strategic gameplay and untamable spirit."
    },
    {
      icon: <Zap className="w-8 h-8 text-primary" />,
      title: "Aggressive Action",
      desc: "We dictate the pace. Hunger and passion drive every breach, every hold, every victory."
    }
  ];

  return (
    <section id="about" className="py-24 md:py-32 bg-card relative border-y border-border" data-testid="section-about">
      {/* Decorative side accents */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-primary/50 to-transparent" />
      
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="flex-1"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="h-[1px] w-12 bg-primary" />
              <h2 className="font-mono text-sm text-primary tracking-widest uppercase">Mission Brief</h2>
            </div>
            
            <h3 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl tracking-tight uppercase text-foreground mb-8">
              A New Force <br />
              <span className="text-muted-foreground">Awakens</span>
            </h3>
            
            <div className="space-y-6 font-mono text-muted-foreground leading-relaxed">
              <p>
                Founded in January 2026, NAROS isn't a corporate brand—it's a war room. We emerged from a simple desire: to build an esports organization that cares more about the game than the merchandise.
              </p>
              <p>
                We are scrappy. We are passionate. And we are dead serious about becoming a recognized force in the R6S scene. Our operators don't just play; they study, they adapt, and they execute with military precision.
              </p>
            </div>

            <div className="mt-12 p-6 border border-border bg-background/50 relative">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary" />
              <p className="font-mono text-sm text-foreground uppercase tracking-wider text-center">
                "We don't wait for opportunities. We breach and make our own."
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full"
          >
            {features.map((feature, idx) => (
              <div 
                key={idx} 
                className={`p-6 border border-border bg-background hover:border-primary/50 transition-colors group ${idx === 2 ? 'sm:col-span-2' : ''}`}
              >
                <div className="mb-4 bg-primary/10 w-16 h-16 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  {feature.icon}
                </div>
                <h4 className="font-display text-xl uppercase tracking-wider mb-3 text-foreground group-hover:text-primary transition-colors">
                  {feature.title}
                </h4>
                <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
