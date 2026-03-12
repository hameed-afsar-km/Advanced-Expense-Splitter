import { Zap } from 'lucide-react';

export function SplashScreen() {
  return (
    <div className="splash-screen">
      <div className="splash-ornaments">
        <div className="blob-container">
          <div className="blob" style={{ opacity: 0.4 }}></div>
          <div className="blob blob-2" style={{ opacity: 0.4 }}></div>
        </div>
        <div className="mesh-grid"></div>
      </div>
      <div className="splash-content">
        <div className="kinetic-logo-container">
          <div className="kinetic-ring"></div>
          <div className="kinetic-ring"></div>
          <div className="kinetic-orb"></div>
          <div className="logo splash-logo-text">
            Split<span className="accent gradient-text">Sync</span>
          </div>
        </div>
        <div className="splash-footer">
          <div className="splash-tagline">Optimizing Group Travel</div>
          <div className="splash-progress-track">
            <div className="splash-progress-bar"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
