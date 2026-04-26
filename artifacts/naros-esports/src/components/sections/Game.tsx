import { motion } from "framer-motion";
import r6Art from "@/assets/r6-art.png";

export function Game() {
  return (
    <section id="game" className="py-24 bg-background relative border-y border-border overflow-hidden" data-testid="section-game">
      <div className="absolute inset-0 z-0 opacity-30">
        <img 
          src={r6Art} 
          alt="Rainbow Six Siege Artwork" 
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-background/80" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="order-2 lg:order-1 border-2 border-primary/20 bg-background/80 backdrop-blur-sm p-2 relative"
          >
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-primary" />
            <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-primary" />
            
            <img 
              src={r6Art} 
              alt="Tactical Gameplay" 
              className="w-full h-auto grayscale contrast-125 border border-border"
            />
            
            <div className="absolute bottom-6 right-6 bg-background/90 border border-primary px-4 py-2 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              <span className="font-mono text-xs uppercase text-primary tracking-widest">Live Feed</span>
            </div>
          </motion.div>

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
              <div className="border border-border p-4 bg-card/50">
                <div className="font-display text-2xl text-foreground mb-1">100%</div>
                <div className="font-mono text-xs text-primary uppercase tracking-wider">Dedication</div>
              </div>
              <div className="border border-border p-4 bg-card/50">
                <div className="font-display text-2xl text-foreground mb-1">TBD</div>
                <div className="font-mono text-xs text-primary uppercase tracking-wider">Trophies</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
