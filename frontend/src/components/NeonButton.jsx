import { useState } from "react";
import "./NeonButton.css";

export default function NeonButton({ children = "Войти", onClick }) {
  const [isActive, setIsActive] = useState(false);

  const handleClick = (e) => {
    setIsActive(true);
    setTimeout(() => setIsActive(false), 300); // короткий "всплеск"
    if (onClick) onClick(e);
  };

  return (
    <button
      className={`neon-btn ${isActive ? "active" : ""}`}
      onClick={handleClick}
    >
      <span className="neon-text">{children}</span>
      <span className="neon-glow" />
      <span className="neon-pulse" />
    </button>
  );
}
