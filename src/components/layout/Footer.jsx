export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-canvas">
        <div className="footer-blob"></div>
        <div className="footer-blob footer-blob-2"></div>
      </div>
      <div className="container footer-content">
        <div className="footer-top">
          <div className="footer-brand">
            <h2 className="logo sm">Split<span className="accent gradient-text">Sync</span></h2>
            <p className="footer-motto">Effortless splitting for modern groups.</p>
          </div>
          <div className="footer-ad-section">
            <div className="ad-box-wrapper">
              <ins className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-7299036615171019"
                data-ad-slot="YOUR_AD_SLOT_ID"
                data-ad-format="auto"
                data-full-width-responsive="true"></ins>
              <div className="ad-fallback text-xs text-muted">A D V E R T I S E M E N T</div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-credits">
            <p>© {new Date().getFullYear()} SplitSync</p>
            <span className="separator">•</span>
            <p>Designed with ❤️ for travelers</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
