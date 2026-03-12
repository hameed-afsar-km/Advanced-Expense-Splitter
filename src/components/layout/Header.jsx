import { MonitorSmartphone, Undo2, Settings } from 'lucide-react';

export function Header({ 
  onLogoClick, 
  onUndo, 
  onSettingsClick, 
  installPrompt, 
  isInstalled, 
  onInstall 
}) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <h1 className="logo" onClick={onLogoClick}>
          Split<span className="accent gradient-text">Sync</span>
        </h1>
        <div className="header-actions">
          {!isInstalled && installPrompt && (
            <button
              className="pwa-install-btn"
              onClick={onInstall}
              title="Add to Home Screen"
            >
              <MonitorSmartphone size={16} />
              <span className="pwa-install-label">Install App</span>
            </button>
          )}
          <button className="nav-icon-btn" onClick={onUndo} title="Undo last action">
            <Undo2 size={20} />
          </button>
          <button className="nav-icon-btn" onClick={onSettingsClick} title="Settings">
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
