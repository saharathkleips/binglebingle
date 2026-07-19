import { useState } from "react";
import styles from "./Logo.module.css";

const LOGO_VARIANTS = ["ㅂㄱㅂㄱ", "ㅂㄴㅂㄱ", "ㅂㄱㅂㄴ", "ㅂㄴㅂㄴ"] as const;
type LogoVariant = (typeof LOGO_VARIANTS)[number];

/** Interactive abbreviated game logo. */
export function Logo() {
  const [logoVariant, setLogoVariant] = useState<LogoVariant>(LOGO_VARIANTS[0]);

  function handleLogoClick() {
    const rotatingIndex = Math.random() < 0.5 ? 1 : 3;

    setLogoVariant((currentLogoVariant) => {
      const nextLogoVariant = [...currentLogoVariant];
      nextLogoVariant[rotatingIndex] = nextLogoVariant[rotatingIndex] === "ㄱ" ? "ㄴ" : "ㄱ";
      return nextLogoVariant.join("") as LogoVariant;
    });
  }

  return (
    <h1 className={styles.logoHeading}>
      <button
        className={styles.logoButton}
        type="button"
        onClick={handleLogoClick}
        aria-label="빙글빙글"
      >
        <span className={styles.logoSurface}>
          <span className={styles.logoText}>{logoVariant}</span>
        </span>
      </button>
    </h1>
  );
}
