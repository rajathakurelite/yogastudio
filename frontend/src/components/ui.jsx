import clsx from "clsx";

export function Button({
  children,
  variant = "primary",
  className,
  type = "button",
  ...props
}) {
  const styles = {
    primary:
      "bg-sage-deep text-cream hover:bg-[#162e29] shadow-soft",
    secondary:
      "bg-white text-sage-deep border border-sand hover:bg-sage-mist",
    ghost: "text-sage-deep hover:bg-sage-mist",
    clay: "bg-clay text-white hover:bg-[#a8583c]",
  };
  return (
    <button
      type={type}
      className={clsx(
        "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-50",
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ children, className }) {
  return (
    <div
      className={clsx(
        "rounded-2xl bg-white/80 p-4 shadow-soft ring-1 ring-sand/80 sm:rounded-3xl sm:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Badge({ children, tone = "sage" }) {
  const tones = {
    sage: "bg-sage-mist text-sage-deep",
    clay: "bg-orange-50 text-clay",
    sand: "bg-sand/70 text-sage-deep",
  };
  return (
    <span className={clsx("rounded-full px-3 py-1 text-xs font-medium capitalize", tones[tone])}>
      {children}
    </span>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-sage/80">{label}</span>
      {children}
    </label>
  );
}

export function Input(props) {
  return (
    <input
      className="w-full rounded-2xl border border-sand bg-white px-4 py-3 text-sm outline-none ring-sage/20 focus:ring-2"
      {...props}
    />
  );
}

export function Select({ options, ...props }) {
  return (
    <select
      className="w-full rounded-2xl border border-sand bg-white px-4 py-3 text-sm outline-none ring-sage/20 focus:ring-2"
      {...props}
    >
      <option value="">Select</option>
      {options.map((o) => (
        <option key={o.id ?? o.value ?? o} value={o.id ?? o.value ?? o}>
          {o.name ?? o.label ?? o}
        </option>
      ))}
    </select>
  );
}

export function SectionTitle({ eyebrow, title, action }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs uppercase tracking-[0.2em] text-sage">{eyebrow}</p>
        ) : null}
        <h2 className="font-serif text-xl text-sage-deep sm:text-2xl">{title}</h2>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Empty({ children }) {
  return <p className="rounded-2xl bg-sage-mist/60 px-4 py-8 text-center text-sm text-sage">{children}</p>;
}
