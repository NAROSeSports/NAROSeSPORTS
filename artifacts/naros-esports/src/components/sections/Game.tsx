import { motion } from "framer-motion";

export function Game() {
  return (
    <section id="game" className="py-24 bg-background relative border-y border-border overflow-hidden" data-testid="section-game">
      {/* Purple ambient glow background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-64 h-64 bg-purple-500/8 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Visual Side - stylized R6 block */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="order-2 lg:order-1 border-2 border-primary/20 bg-card/80 backdrop-blur-sm p-8 relative"
          >
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-primary" />
            <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-primary" />

            {/* R6S stylized display */}
            <div className="aspect-video bg-background border border-border flex items-center justify-center relative overflow-hidden">
              {/* Circuit pattern background */}
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(168,85,247,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.3) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

              <div className="relative z-10 text-center">
                <div className="font-display font-black text-5xl md:text-6xl tracking-tighter text-white mb-2">R6S</div>
                <div className="font-mono text-primary text-xs tracking-[0.4em] uppercase">Rainbow Six Siege</div>
                <div className="mt-6 flex justify-center gap-3">
                  <div className="w-2 h-2 bg-primary animate-pulse" />
                  <div className="w-2 h-2 bg-primary/60 animate-pulse" style={{ animationDelay: '0.3s' }} />
                  <div className="w-2 h-2 bg-primary/30 animate-pulse" style={{ animationDelay: '0.6s' }} />
                </div>
              </div>

              {/* Corner decorations */}
              <div className="absolute top-3 left-3 border-t border-l border-primary/50 w-6 h-6" />
              <div className="absolute top-3 right-3 border-t border-r border-primary/50 w-6 h-6" />
              <div className="absolute bottom-3 left-3 border-b border-l border-primary/50 w-6 h-6" />
              <div className="absolute bottom-3 right-3 border-b border-r border-primary/50 w-6 h-6" />
            </div>

            <div className="absolute bottom-12 right-10 bg-background/90 border border-primary px-4 py-2 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              <span className="font-mono text-xs uppercase text-primary tracking-widest">Active Title</span>
            </div>
          </motion.div>

          {/* Text Side */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="order-1 lg:order-2"
          >
            <h2 className="font-mono text-sm text-primary tracking-widest uppercase mb-4">Area of Operations</h2>
            <h3 className="font-display font-bold text-5xl md:text-6xl tracking-tight uppercase text-foreground mb-8">
              Rainbow Six <br className="hidden md:block" />
              <span className="text-muted-foreground text-4xl md:text-5xl">Siege</span>
            </h3>

            <div className="space-y-6 font-mono text-muted-foreground leading-relaxed">
              <p>
                We don't scatter our focus. We specialize. Rainbow Six Siege demands a unique blend of strategic depth, environmental awareness, and split-second mechanical execution. It is the ultimate test of a tactical unit.
              </p>
              <p>
                NAROS was built for Siege. From perfecting site setups to orchestrating synchronized executes, every drill, every scrim, every match is about mastering this single, unforgiving environment.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4">
              <div className="border border-border p-4 bg-card/50 relative group hover:border-primary/50 transition-colors">
                <div className="font-display text-2xl text-foreground mb-1">100%</div>
                <div className="font-mono text-xs text-primary uppercase tracking-wider">Dedication</div>
              </div>
              <div className="border border-border p-4 bg-card/50 relative group hover:border-primary/50 transition-colors">
                <div className="font-display text-2xl text-foreground mb-1">EST. '26</div>
                <div className="font-mono text-xs text-primary uppercase tracking-wider">Founded</div>
              </div>
              <div className="border border-border p-4 bg-card/50 col-span-2 relative group hover:border-primary/50 transition-colors">
                <div className="font-display text-2xl text-foreground mb-1">Rising</div>
                <div className="font-mono text-xs text-primary uppercase tracking-wider">Status in R6S Scene</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
