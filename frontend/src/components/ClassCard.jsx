import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "./ui";

/** Soft SVG cover when a class has no THUMBNAIL asset yet. */
function ClassCardPlaceholder({ title, durationMinutes, level }) {
  const label = (title || "Yoga").slice(0, 28);
  return (
    <svg
      viewBox="0 0 640 320"
      className="h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ccg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3E4A38" />
          <stop offset="55%" stopColor="#5B6B52" />
          <stop offset="100%" stopColor="#7A8F6E" />
        </linearGradient>
      </defs>
      <rect width="640" height="320" fill="url(#ccg)" />
      <circle cx="540" cy="60" r="90" fill="#FFFCF7" opacity="0.08" />
      <circle cx="80" cy="260" r="110" fill="#D4C4A8" opacity="0.14" />
      <g
        fill="none"
        stroke="#FFFCF7"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
        transform="translate(380,20) scale(0.38)"
      >
        <circle cx="400" cy="150" r="34" />
        <path d="M400 184 v150" />
        <path d="M400 230 C 280 210 220 170 180 140" />
        <path d="M400 230 C 520 210 560 170 600 140" />
        <path d="M400 334 C 360 430 350 500 340 560" />
        <path d="M400 334 C 480 380 540 420 580 460" />
      </g>
      <text x="28" y="230" fill="#FFFCF7" fontFamily="Georgia, serif" fontSize="28">
        {label}
      </text>
      <text x="28" y="270" fill="#D4C4A8" fontFamily="system-ui, sans-serif" fontSize="16">
        {[durationMinutes ? `${durationMinutes} min` : null, level].filter(Boolean).join(" · ")}
      </text>
    </svg>
  );
}

export default function ClassCard({ item, to }) {
  const href = to || `/classes/${item.id}`;
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = Boolean(item.thumbnailUrl) && !imgFailed;

  return (
    <Link
      to={href}
      className="group overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-sand/80"
    >
      <div className="relative h-40 overflow-hidden bg-sage-mist">
        {showImage ? (
          <img
            src={item.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <ClassCardPlaceholder
            title={item.title}
            durationMinutes={item.durationMinutes}
            level={item.level}
          />
        )}
      </div>
      <div className="space-y-3 p-5">
        <div className="flex flex-wrap gap-2">
          <Badge>{item.level}</Badge>
          <Badge tone="sand">{item.durationMinutes} min</Badge>
          {item.styleName ? <Badge tone="clay">{item.styleName}</Badge> : null}
        </div>
        <h3 className="font-serif text-xl leading-snug group-hover:text-sage">
          {item.title || "Untitled class"}
        </h3>
        <p className="text-sm text-sage">
          {item.instructorName}
          {item.instructorPhone ? ` · ${item.instructorPhone}` : ""}
        </p>
        {item.goalName ? (
          <p className="text-xs uppercase tracking-wider text-sage/70">{item.goalName}</p>
        ) : null}
      </div>
    </Link>
  );
}
