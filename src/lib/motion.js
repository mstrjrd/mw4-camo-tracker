// One easing curve for the whole site; springs and overshoot are avoided on purpose.
export const ease = [0.22, 1, 0.36, 1];

/** Short fade and rise for a block entering the page. */
export const riseItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease } },
};
