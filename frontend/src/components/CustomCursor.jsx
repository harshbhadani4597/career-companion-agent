import React, { useEffect, useState } from "react";

export function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [trailingPos, setTrailingPos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Check if device is touch-enabled
    if (window.matchMedia("(pointer: coarse)").matches) {
      setIsTouchDevice(true);
      return;
    }

    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      // Check if target or parent is interactive
      const target = e.target;
      const isInteractive = target.closest(
        'button, a, input, textarea, select, [role="button"], .cursor-pointer, .hover-target, label, summary'
      );
      setIsHovered(!!isInteractive);
    };

    const handleMouseDown = () => setIsMouseDown(true);
    const handleMouseUp = () => setIsMouseDown(false);

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [isVisible]);

  // Smooth lag animation for outer trailing ring
  useEffect(() => {
    if (isTouchDevice) return;
    let animationFrameId;

    const animateTrailing = () => {
      setTrailingPos((prev) => ({
        x: prev.x + (position.x - prev.x) * 0.22,
        y: prev.y + (position.y - prev.y) * 0.22,
      }));
      animationFrameId = requestAnimationFrame(animateTrailing);
    };

    animationFrameId = requestAnimationFrame(animateTrailing);
    return () => cancelAnimationFrame(animationFrameId);
  }, [position, isTouchDevice]);

  if (isTouchDevice || !isVisible) return null;

  return (
    <>
      {/* Compact Golden Arrowhead & Rotating Globe Cursor Pointer */}
      <div
        className="fixed top-0 left-0 pointer-events-none z-[9999] transition-transform duration-75 ease-out select-none"
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${
            isMouseDown ? 0.85 : isHovered ? 1.25 : 1
          })`,
          transformOrigin: "2px 2px",
        }}
      >
        <div className="relative flex items-start">
          {/* Main Compact Composite Container */}
          <div className="relative w-8 h-8 filter drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]">
            
            {/* Compact SVG Golden Arrowhead Pointer Tip */}
            <svg
              className="absolute top-0 left-0 w-5 h-5 z-20 overflow-visible"
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="goldGradientSmall" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FDE68A" />
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#B45309" />
                </linearGradient>
                <filter id="goldGlowSmall" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Arrowhead Pointer Sharp Tip */}
              <path
                d="M 2 2 L 18 10 L 10 14 L 14 26 L 10 28 L 6 16 L 2 18 Z"
                fill="url(#goldGradientSmall)"
                stroke="#FFFBEB"
                strokeWidth="1.5"
                filter="url(#goldGlowSmall)"
              />
              {/* Inner Metallic Specular Highlight */}
              <path
                d="M 3 4 L 15 10.5 L 9.5 13.5 Z"
                fill="#FEF3C7"
                opacity="0.8"
              />
            </svg>

            {/* Compact Attached Golden Ring & Rotating Blue Earth Globe */}
            <div className="absolute top-1.5 left-2.5 z-10 w-5.5 h-5.5 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 p-[1.2px] shadow-[0_0_8px_rgba(245,158,11,0.7)] flex items-center justify-center">
              {/* Inner Ring Base */}
              <div className="w-full h-full rounded-full bg-slate-950 overflow-hidden relative border border-amber-300/70 flex items-center justify-center">
                
                {/* Rotating Earth Globe Image */}
                <img
                  src="/cursor-globe.png"
                  alt="Globe Cursor"
                  className={`w-full h-full object-cover rounded-full ${
                    isHovered ? "animate-spin-globe-fast scale-110" : "animate-spin-globe"
                  }`}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />

                {/* Vector Globe Fallback */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600 via-sky-500 to-indigo-900 animate-spin-globe flex items-center justify-center opacity-90 pointer-events-none">
                  <div className="w-full h-full rounded-full border border-sky-300/40 relative">
                    <div className="absolute inset-0.5 rounded-full border border-dashed border-cyan-200/50" />
                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-sky-200/40" />
                  </div>
                </div>

                {/* Atmospheric Specular Ring Glow */}
                <div className="absolute inset-0 rounded-full shadow-[inset_0_0_4px_rgba(59,130,246,0.9)] pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-full pointer-events-none" />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Compact Trailing Golden Orbit Halo */}
      <div
        className="fixed top-0 left-0 pointer-events-none z-[9998] transition-transform duration-100 ease-out select-none"
        style={{
          transform: `translate3d(${trailingPos.x}px, ${trailingPos.y}px, 0) translate(-15%, -15%) scale(${
            isMouseDown ? 0.9 : isHovered ? 1.5 : 1
          })`,
        }}
      >
        <div
          className={`w-8 h-8 rounded-full border transition-all duration-300 ${
            isHovered
              ? "border-amber-400 bg-amber-400/20 shadow-[0_0_15px_rgba(245,158,11,0.7)] backdrop-blur-[1px]"
              : "border-amber-500/40 bg-amber-500/5 shadow-[0_0_10px_rgba(245,158,11,0.25)]"
          }`}
        />
      </div>
    </>
  );
}
