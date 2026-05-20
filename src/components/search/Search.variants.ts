import type { Variants } from 'motion'

export const dropdownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -8,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.18,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.9,
    transition: {
      duration: 0.12,
      ease: 'easeIn',
    },
  },
}

export const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    filter: 'blur(2px)',
    x: -6,
  },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.8 },
  },
}
