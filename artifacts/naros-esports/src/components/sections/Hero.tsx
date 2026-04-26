import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.png";
import { ChevronDown } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-background pt-20" data-testid="section-hero">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-background/80 mix-blend-multiply z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent z-10 mix-blend-screen" />
        <img 
          src={heroBg} 
          alt="Naros Esports Tactical Background" 
          className="w-full h-full object-cover object-center scale-105 animate-[pulse_10s_ease-in-out_infinite]"
        />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 z-10 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

      <div className="container mx-auto px-6 relative z-20 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-6 inline-flex items-center gap-2 px-3 py-1 border border-primary/30 bg-primary/5 text-primary font-mono text-xs uppercase tracking-widest"
        >
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Status: Active Ops
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="font-display font-black text-6xl md:text-8xl lg:text-[10rem] tracking-tighter uppercase text-white mb-6 leading-none glitch-wrapper"
        >
          <span className="glitch-text" data-text="NAROS">NAROS</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-lg md:text-2xl text-muted-foreground font-mono uppercase tracking-widest max-w-2xl mb-12"
        >
          Tactical Precision. <br className="md:hidden" /><span className="text-primary">Controlled Aggression.</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="flex flex-col sm:flex-row items-center gap-6"
        >
          <a
            href="#roster"
            className="px-8 py-4 border border-primary bg-primary/10 text-primary font-display font-bold text-lg tracking-widest uppercase hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-[0_0_20px_rgba(110,255,0,0.15)] hover:shadow-[0_0_30px_rgba(110,255,0,0.4)]"
            data-testid="hero-cta-roster"
          >
            View Roster
          </a>
          <a
            href="#about"
            className="px-8 py-4 border border-border bg-background/50 backdrop-blur text-foreground font-display font-bold text-lg tracking-widest uppercase hover:border-foreground transition-all duration-300"
            data-testid="hero-cta-about"
          >
            Mission Brief
          </a>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-muted-foreground font-mono text-xs uppercase tracking-widest"
      >
        <span>Scroll to breach</span>
        <ChevronDown className="w-5 h-5 animate-bounce text-primary" />
      </motion.div>
    </section>
  );
}
