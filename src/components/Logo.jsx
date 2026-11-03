/** Site logo (public/logo.svg): tactical badge + reticle over digital camo. */
export default function Logo({ size = 40, className }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}logo.svg`}
      alt="MW4 Camo Tracker"
      width={size}
      height={size}
      className={'shrink-0 ' + (className || '')}
    />
  );
}
