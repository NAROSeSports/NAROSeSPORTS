import { motion } from "framer-motion";
import bannerBg from "@assets/Banner_1777204633419.png";
import { ChevronDown } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-background pt-20" data-testid="section-hero">
      {/* Banner Background Image */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-background/70 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent z-10 mix-blend-screen" />
        <img
          src={bannerBg}
          alt="NAROS Esports Banner"
          className="w-full h-full object-cover object-center scale-105"
        />
      </div>

      {/* Circuit grid overlay matching their branding */}
      <div className="absolute inset-0 z-10 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(168,85,247,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.15) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div className="container mx-auto px-6 relative z-20 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-6 inline-flex items-center gap-2 px-3 py-1 border border-primary/40 bg-primary/10 text-primary font-mono text-xs uppercase tracking-widest"
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
          className="text-lg md:text-2xl text-muted-foreground font-mono uppercase tracking-widest max-w-2xl mb-4"
        >
          eSports
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="text-base md:text-lg text-muted-foreground font-mono uppercase tracking-widest max-w-2xl mb-12"
        >
          Tactical Precision. <span className="text-primary">Controlled Aggression.</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="flex flex-col sm:flex-row items-center gap-6"
        >
          <a
            href="#roster"
            className="px-8 py-4 border border-primary bg-primary/10 text-primary font-display font-bold text-lg tracking-widest uppercase hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.15)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]"
            data-testid="hero-cta-roster"
          >
            View Roster
          </a>
          <a
            href="#join"
            className="px-8 py-4 border border-border bg-background/50 backdrop-blur text-foreground font-display font-bold text-lg tracking-widest uppercase hover:border-primary transition-all duration-300"
            data-testid="hero-cta-join"
          >
            Join Us
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
