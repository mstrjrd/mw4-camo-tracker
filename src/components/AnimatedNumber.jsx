import { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';

/** Number that counts up/down with a spring whenever `value` changes (starts from 0 on mount). */
export default function AnimatedNumber({ value, decimals = 0, className }) {
  const spring = useSpring(0, { stiffness: 110, damping: 20, mass: 0.8 });
  const text = useTransform(spring, v => {
    const f = 10 ** decimals;
    return String(Math.round(v * f) / f);
  });

  useEffect(() => { spring.set(value); }, [spring, value]);

  return <motion.span className={className}>{text}</motion.span>;
}
