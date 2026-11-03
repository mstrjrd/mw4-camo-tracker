import { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';

/** Number that counts up/down whenever `value` changes (starts from 0 on mount), in French format (16,9). */
export default function AnimatedNumber({ value, decimals = 0, className }) {
  const spring = useSpring(0, { stiffness: 110, damping: 20, mass: 0.8 });
  const text = useTransform(spring, v => v.toLocaleString('fr-FR', { maximumFractionDigits: decimals }));

  useEffect(() => { spring.set(value); }, [spring, value]);

  return <motion.span className={className}>{text}</motion.span>;
}
