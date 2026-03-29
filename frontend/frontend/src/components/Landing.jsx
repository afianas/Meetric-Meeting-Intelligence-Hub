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

      {/* Open App button only — top right */}
      <div className="land-nav">
        <div className="land-nav-cta">
          <button onClick={onEnter}>Open App →</button>
        </div>
      </div>

    </div>
  );
}
