import { SiTwitch, SiX, SiYoutube, SiDiscord } from "react-icons/si";
import logoImg from "@assets/Profile_Pic_1777204633419.png";

export function Footer() {
  return (
    <footer className="bg-background border-t border-border pt-16 pb-8 relative overflow-hidden" data-testid="footer">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img
                src={logoImg}
                alt="NAROS Esports Logo"
                className="w-12 h-12 object-cover rounded-full border border-primary/40 shadow-[0_0_16px_rgba(168,85,247,0.3)]"
              />
              <span className="font-display font-bold text-2xl tracking-tighter text-foreground uppercase">
                NAROS <span className="text-primary font-normal">eSports</span>
              </span>
            </div>
            <p className="text-muted-foreground font-mono text-sm max-w-md leading-relaxed">
              EST. JAN 2026. A NEW FORCE IN RAINBOW SIX SIEGE. FOUNDED BY ZENTIONX & FIGGLEBOTTOM. WE ARE NAROS.
            </p>
          </div>

          <div>
            <h4 className="font-display text-lg tracking-widest uppercase mb-6 text-foreground border-l-2 border-primary pl-3">Comms</h4>
            <div className="flex flex-col gap-4 font-mono text-sm">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-3 group">
                <SiX className="w-4 h-4 group-hover:scale-110 transition-transform" /> @NarosEsports
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-3 group">
                <SiTwitch className="w-4 h-4 group-hover:scale-110 transition-transform" /> NarosGG
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-3 group">
                <SiYoutube className="w-4 h-4 group-hover:scale-110 transition-transform" /> Naros
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-3 group">
                <SiDiscord className="w-4 h-4 group-hover:scale-110 transition-transform" /> Discord Server
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-display text-lg tracking-widest uppercase mb-6 text-foreground border-l-2 border-primary pl-3">Intel</h4>
            <div className="flex flex-col gap-4 font-mono text-sm">
              <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">Mission Brief</a>
              <a href="#roster" className="text-muted-foreground hover:text-foreground transition-colors">Op Roster</a>
              <a href="#game" className="text-muted-foreground hover:text-foreground transition-colors">Game Intel</a>
              <a href="#join" className="text-muted-foreground hover:text-foreground transition-colors">Enlistment</a>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs text-muted-foreground">
          <p>© 2026 NAROS ESPORTS. ALL RIGHTS RESERVED.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-primary transition-colors">PRIVACY_POLICY</a>
            <a href="#" className="hover:text-primary transition-colors">TERMS_OF_SERVICE</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
