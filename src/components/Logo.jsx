import { motion } from 'motion/react';

/** Site logo (public/logo.svg): tactical badge + reticle over digital camo. Spins in on load, turns on hover. */
export default function Logo({ size = 40, className }) {
  return (
    <motion.img
      src={`${import.meta.env.BASE_URL}logo.svg`}
      alt="MW4 Camo Tracker"
      width={size}
      height={size}
      className={'shrink-0 drop-shadow-[0_0_10px_rgba(163,230,53,0.25)] ' + (className || '')}
      initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
      animate={{ rotate: 0, scale: 1, opacity: 1 }}
      whileHover={{ rotate: 90 }}
      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
    />
  );
}
