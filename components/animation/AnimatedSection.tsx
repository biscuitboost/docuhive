"use client"

import { motion, type Variants } from "framer-motion"
import { type HTMLAttributes, type ElementType } from "react"
import { staggerItem, fadeInUp } from "@/lib/animation/variants"

/* ── AnimatedSection — scroll-revealed block ────── */

type AnimatedSectionProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType
  variants?: Variants
  once?: boolean
  amount?: number
}

export function AnimatedSection({
  as: _Tag = "section",
  variants = fadeInUp,
  once = true,
  amount = 0.15,
  className,
  children,
  ...props
}: AnimatedSectionProps) {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      className={className}
      {...(props as any)}
    >
      {children}
    </motion.div>
  )
}

/* ── AnimatedStagger — staggered children container ── */

type AnimatedStaggerProps = HTMLAttributes<HTMLDivElement> & {
  as?: ElementType
  staggerDelay?: number
  once?: boolean
  amount?: number
  className?: string
  childVariants?: Variants
}

export function AnimatedStagger({
  as: _Tag = "div",
  staggerDelay = 0.08,
  once = true,
  amount = 0.1,
  className,
  children,
  childVariants: _childVariants = staggerItem,
  ...props
}: AnimatedStaggerProps) {
  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1,
      },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      className={className}
      {...(props as any)}
    >
      {children}
    </motion.div>
  )
}

/* ── AnimatedChild — single staggered item ─────────── */

export function AnimatedChild({
  variants = staggerItem,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  variants?: Variants
  className?: string
}) {
  return (
    <motion.div variants={variants} className={className} {...(props as any)}>
      {children}
    </motion.div>
  )
}

/* ── AnimatedText — word-by-word or char reveal ────── */

export function AnimatedText({
  text,
  className,
  as: _Tag = "span",
  once = true,
}: {
  text: string
  className?: string
  as?: ElementType
  once?: boolean
}) {
  const words = text.split(" ")

  return (
    <motion.span
      initial="hidden"
      whileInView="visible"
      viewport={{ once }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.04, delayChildren: 0.2 } },
      }}
      className={className}
      aria-label={text}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block"
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
          }}
        >
          {word}{i < words.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </motion.span>
  )
}

/* ── AnimatedNumber — count-up effect ──────────────── */

export function AnimatedNumber({
  value,
  duration: _duration = 1.5,
  className,
}: {
  value: number
  duration?: number
  className?: string
}) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className={className}
    >
      {value}
    </motion.span>
  )
}
