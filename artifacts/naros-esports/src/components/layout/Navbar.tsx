import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logoImg from "@assets/Profile_Pic_1777204633419.png";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Mssn_Brief", href: "#about" },
    { name: "Op_Roster", href: "#roster" },
    { name: "Intel", href: "#game" },
    { name: "Enlist", href: "#join" },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        scrolled
          ? "bg-background/90 backdrop-blur-md border-primary/20 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.6)]"
          : "bg-transparent border-transparent py-5"
      }`}
      data-testid="navbar"
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <img
            src={logoImg}
            alt="NAROS Esports Logo"
            className="w-10 h-10 object-cover rounded-full border border-primary/40 group-hover:border-primary transition-colors shadow-[0_0_12px_rgba(168,85,247,0.25)] group-hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]"
          />
          <span className="font-display font-bold text-xl tracking-tighter text-foreground group-hover:text-primary transition-colors uppercase">
            NAROS <span className="text-primary font-normal">eSports</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-mono tracking-widest text-muted-foreground hover:text-primary transition-colors uppercase relative group"
              data-testid={`nav-link-${link.name.toLowerCase()}`}
            >
              {link.name}
              <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </a>
          ))}
          <a
            href="#join"
            className="px-6 py-2 border border-primary text-primary font-mono text-sm tracking-widest uppercase hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-[0_0_12px_rgba(168,85,247,0.1)] hover:shadow-[0_0_20px_rgba(168,85,247,0.35)]"
            data-testid="nav-cta-join"
          >
            Deploy
          </a>
        </nav>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-foreground hover:text-primary transition-colors p-2 border border-border bg-background/50"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          data-testid="mobile-menu-toggle"
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-lg border-b border-primary/20 overflow-hidden"
          >
            <nav className="flex flex-col p-6 gap-6">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-lg font-mono tracking-widest text-muted-foreground hover:text-primary transition-colors uppercase border-b border-border pb-4"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <a
                href="#join"
                className="w-full text-center px-6 py-4 border border-primary bg-primary/10 text-primary font-mono text-lg tracking-widest uppercase hover:bg-primary hover:text-primary-foreground transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                Deploy Now
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
