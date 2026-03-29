export default function Landing({ onEnter }) {
  return (
    <div className="land">

      {/* Spline — true fullscreen, mouse events live for cursor/hover tracking */}
      <div className="land-spline">
        <iframe
          src="https://my.spline.design/chromaticcopycopy-irSgUQ3O37WdeNx98ea2fQH2-YKJ/"
          frameBorder="0"
          title="Spline Background"
        />
      </div>

      {/* Full Navbar */}
      <div className="land-nav">
        <div className="land-nav-logo">
          meetric<div className="land-nav-logo-dot"/>
        </div>
        <div className="land-nav-links">
          <a>Platform</a>
          <a>Security</a>
          <a>Pricing</a>
          <a>Customers</a>
        </div>
        <div className="land-nav-actions">
          <div className="land-nav-login">Sign in</div>
          <button className="land-btn-cta" onClick={onEnter}>Open App →</button>
        </div>
      </div>

    </div>
  );
}
