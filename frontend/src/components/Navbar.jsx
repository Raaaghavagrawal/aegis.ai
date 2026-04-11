import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Menu, X, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Analytics', href: '/#analytics' },
    { name: 'Community', href: '/#rider-showcase' },
    { name: 'Plans', href: '/plans', isRoute: true },
    { name: 'Security', href: '/#fraud' },
  ];

  return (
    <>
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`landing-nav ${scrolled ? 'nav-scrolled' : ''}`}
      >
        <div className="nav-brand">
          <motion.div 
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="nav-logo-icon"
          >
            <Shield size={22} color="#fff" />
          </motion.div>
          <span className="nav-logo-text">
            Aegis <span className="nav-logo-highlight">AI</span>
          </span>
        </div>
        
        <div className="landing-nav-links desktop-only">
          {navLinks.map((link, i) => {
            const motionProps = {
              initial: { opacity: 0, y: -10 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: 0.1 + i * 0.1, duration: 0.5 },
              className: "nav-link-item"
            };
            return link.isRoute ? (
              <motion.div key={link.name} {...motionProps} style={{ display: 'flex' }}>
                <Link to={link.href} style={{ color: 'inherit', textDecoration: 'none', width: '100%' }}>
                  {link.name}
                </Link>
              </motion.div>
            ) : (
              <motion.a 
                key={link.name}
                href={link.href}
                {...motionProps}
              >
                {link.name}
              </motion.a>
            );
          })}

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Link to={localStorage.getItem("aegis_token") ? "/dashboard" : "/auth"} className="landing-nav-cta premium-btn">
              {localStorage.getItem("aegis_token") ? "Dashboard" : "Get Started"}
              <ChevronRight size={16} />
            </Link>
          </motion.div>
        </div>

        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            transition={{ duration: 0.2 }}
            className="mobile-menu"
          >
            {navLinks.map((link) => (
              link.isRoute ? (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="mobile-nav-link"
                >
                  {link.name}
                  <ChevronRight size={16} />
                </Link>
              ) : (
                <a 
                  key={link.name} 
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="mobile-nav-link"
                >
                  {link.name}
                  <ChevronRight size={16} />
                </a>
              )
            ))}

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
