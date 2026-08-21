const markSrc = `${import.meta.env.BASE_URL || "/"}vibedrive-mark.svg`;

export function BrandMark({ large = false }: { large?: boolean }) {
  return (
    <img
      className={large ? "vd-logo vd-logo-lg" : "vd-logo"}
      src={markSrc}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}