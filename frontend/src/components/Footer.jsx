import React from 'react';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <div className="site-footer-logo">Aegis AI</div>
          <p className="site-footer-tagline">
            Parametric income protection for gig workers — powered by real-time
            environmental signals.
          </p>
        </div>

        <div className="site-footer-cols">
          <div className="site-footer-col">
            <div className="site-footer-col-title">Product</div>
            <a href="/#analytics">Ecosystem data</a>
            <a href="/plans">Plans</a>
            <a href="/#fraud">Security</a>
          </div>

          <div className="site-footer-col">
            <div className="site-footer-col-title">For gig workers</div>
            <a href="/#rider-showcase">Community</a>
            <a href="/plans">Weekly premiums</a>
            <a href="/#fraud">Fraud defense</a>
          </div>

          <div className="site-footer-col">
            <div className="site-footer-col-title">Get started</div>
            <a href="/auth">Login / Sign up</a>
            <a href="/dashboard">Dashboard</a>
            <a href="/auth">Analyze my risk</a>
          </div>
        </div>

        <div className="site-footer-bottom">
          <div className="site-footer-legal">
            <div>&copy; 2026 Aegis AI</div>
            <div className="site-footer-disclaimer">
              Demo build. Not a real insurance product.
            </div>
          </div>
          <div className="site-footer-meta">
            <span>Built for India • Weather + AQI triggers • Instant payouts</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
