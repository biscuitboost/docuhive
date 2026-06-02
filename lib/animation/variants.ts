/**
 * Reusable Framer Motion variants for DocuHive.
 * Designed for tasteful, fluid, performant animations.
 *
 * Inspired by animate-ui.com principles:
 *  - Subtle shifts, not flashy reveals
 *  - Duration 0.3–0.6s for most entries
 *  - Stagger children in lists
 *  - Hover = 150ms scale/color
 */

/* ── Entry / exit variants ─────────────────────── */

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
}

export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
}

export const fadeInDown = {
  hidden: { opacity: 0, y: -12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
}

export const fadeInLeft = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: "easeOut" } },
}

/* ── Staggered children ─────────────────────────── */

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

export const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
}

/* ── Hover / tap micro-interactions ─────────────── */

export const hoverLift = {
  whileHover: { y: -4, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", transition: { duration: 0.15 } },
  whileTap: { scale: 0.98 },
}

export const hoverGlow = {
  whileHover: {
    scale: 1.03,
    transition: { duration: 0.15 },
  },
}

export const hoverIcon = {
  whileHover: { scale: 1.12, transition: { duration: 0.15 } },
}

/* ── Page / route transitions ───────────────────── */

export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: "easeIn" } },
}

/* ── Slide / accordion ──────────────────────────── */

export const slideDown = {
  hidden: { height: 0, opacity: 0 },
  visible: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
}

export const slideUp = {
  hidden: { height: "auto", opacity: 1 },
  visible: { height: 0, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
}

/* ── Notification / toast slide-in ──────────────── */

export const slideInRight = {
  hidden: { x: 80, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: "spring", damping: 20, stiffness: 260 } },
  exit: { x: 80, opacity: 0, transition: { duration: 0.2 } },
}
