import { motion } from "framer-motion";
import { SiDiscord, SiX } from "react-icons/si";

export function Join() {
  return (
    <section id="join" className="py-32 bg-background relative overflow-hidden" data-testid="section-join">
      {/* Target Reticle Background */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-primary/5 rounded-full pointer-events-none" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary/10 rounded-full pointer-events-none" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-primary/20 rounded-full pointer-events-none" />
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/10 pointer-events-none" />
      <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/10 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center p-4 bg-primary/10 border border-primary/30 mb-8">
              <span className="font-mono text-sm text-primary tracking-widest uppercase">Recruitment Open</span>
            </div>

            <h2 className="font-display font-bold text-5xl md:text-7xl tracking-tighter uppercase text-foreground mb-6">
              Join The <span className="text-primary">Assault</span>
            </h2>
            
            <p className="font-mono text-lg text-muted-foreground mb-12 leading-relaxed">
              We are actively scouting for raw talent, tactical minds, and individuals who hate losing more than they love winning. If you have what it takes to compete under the NAROS banner, step up.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <a
                href="#"
                className="w-full sm:w-auto px-8 py-5 bg-primary text-primary-foreground font-display font-bold text-lg tracking-widest uppercase hover:bg-white transition-colors duration-300 flex items-center justify-center gap-3 group"
                data-testid="btn-join-discord"
              >
                <SiDiscord className="w-6 h-6 group-hover:scale-110 transition-transform" />
                Join Discord
              </a>
              <a
                href="#"
                className="w-full sm:w-auto px-8 py-5 border-2 border-border bg-background text-foreground font-display font-bold text-lg tracking-widest uppercase hover:border-primary hover:text-primary transition-all duration-300 flex items-center justify-center gap-3 group"
                data-testid="btn-follow-x"
              >
                <SiX className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Follow Comms
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
