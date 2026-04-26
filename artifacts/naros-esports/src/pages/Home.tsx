import { Hero } from "@/components/sections/Hero";
import { Roster } from "@/components/sections/Roster";
import { Game } from "@/components/sections/Game";
import { Join } from "@/components/sections/Join";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Global CRT scanline effect */}
      <div className="crt-overlay" />
      
      <Navbar />
      
      <main>
        <Hero />
        <Roster />
        <Game />
        <Join />
      </main>

      <Footer />
    </div>
  );
}
