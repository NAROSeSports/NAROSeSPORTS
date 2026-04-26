import { motion } from "framer-motion";
import { User } from "lucide-react";

export function Roster() {
  const founders = [
    {
      name: "ZentionX",
      realName: "Will",
      role: "Co-Founder",
    },
    {
      name: "Figglebottom",
      realName: "Ben",
      role: "Co-Founder",
    },
  ];

  const players = [
    { name: "Robbie", role: "Team Captain / IGL", open: false },
    { name: "Sam", role: "Flex", open: false },
    { name: "Codie", role: "Entry", open: false },
    { name: "Dylan", role: "Support", open: false },
    { name: "Position Open", role: "Entry", open: true },
  ];

  return (
    <section id="roster" className="py-24 md:py-32 bg-background relative" data-testid="section-roster">
      <div className="container mx-auto px-6">

        {/* Section Header */}
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
        </div>

        {/* Founders */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="h-px flex-1 bg-border" />
          <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Founders</span>
          <div className="h-px flex-1 bg-border" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-20">
          {founders.map((founder, idx) => (
            <motion.div
              key={founder.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + idx * 0.15, duration: 0.5 }}
              className="group"
              data-testid={`card-founder-${founder.realName.toLowerCase()}`}
            >
              <div className="border border-border bg-card hover:border-primary/50 transition-colors duration-300 relative">
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-primary" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-primary" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-primary" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-primary" />

                {/* Awaiting picture placeholder */}
                <div className="aspect-square bg-background/60 flex flex-col items-center justify-center border-b border-border relative overflow-hidden">
                  {/* Subtle grid */}
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(168,85,247,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.4) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                  {/* Radial glow */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-20 h-20 border-2 border-primary/30 flex items-center justify-center bg-primary/5">
                      <User className="w-10 h-10 text-primary/40" />
                    </div>
                    <span className="font-mono text-xs text-muted-foreground/60 uppercase tracking-widest">Awaiting Photo</span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-6">
                  <div className="font-mono text-xs text-primary tracking-widest uppercase mb-2">
                    {founder.role}
                  </div>
                  <h4 className="font-display font-bold text-2xl uppercase text-foreground group-hover:text-primary transition-colors mb-1">
                    {founder.name}
                  </h4>
                  <div className="font-mono text-sm text-muted-foreground uppercase tracking-wider">
                    {founder.realName}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Players */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="h-px flex-1 bg-border" />
          <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Players</span>
          <div className="h-px flex-1 bg-border" />
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {players.map((player, idx) => (
            <motion.div
              key={player.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 + idx * 0.08, duration: 0.4 }}
              className="group"
              data-testid={`card-player-${idx}`}
            >
              <div className={`border h-full flex flex-col transition-colors duration-300 relative ${
                player.open
                  ? "border-dashed border-primary/20 bg-background hover:border-primary/40"
                  : "border-border bg-card hover:border-primary/50"
              }`}>
                {/* Corner accents — solid players only */}
                {!player.open && (
                  <>
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/50" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/50" />
                  </>
                )}

                {/* Photo placeholder */}
                <div className={`aspect-square flex flex-col items-center justify-center border-b relative overflow-hidden ${
                  player.open ? "border-primary/10 bg-background/40" : "border-border bg-background/60"
                }`}>
                  <div className="absolute inset-0 opacity-8" style={{ backgroundImage: 'linear-gradient(rgba(168,85,247,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.3) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className={`w-12 h-12 border flex items-center justify-center ${
                      player.open ? "border-primary/20 bg-primary/5" : "border-primary/25 bg-primary/5"
                    }`}>
                      <User className={`w-6 h-6 ${player.open ? "text-primary/25" : "text-primary/35"}`} />
                    </div>
                    {player.open && (
                      <div className="w-4 h-4 border border-primary/30 flex items-center justify-center">
                        <span className="text-primary/50 text-xs font-bold leading-none">+</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className={`font-mono text-xs tracking-widest uppercase mb-1 ${
                    player.open ? "text-primary/40" : "text-primary"
                  }`}>
                    {player.role}
                  </div>
                  <h4 className={`font-display font-bold text-sm uppercase leading-tight transition-colors ${
                    player.open
                      ? "text-muted-foreground/50 italic"
                      : "text-foreground group-hover:text-primary"
                  }`}>
                    {player.name}
                  </h4>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
