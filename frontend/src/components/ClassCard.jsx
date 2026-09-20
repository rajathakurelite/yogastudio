import { Link } from "react-router-dom";
import { Badge } from "./ui";

export default function ClassCard({ item, to }) {
  const href = to || `/classes/${item.id}`;
  return (
    <Link
      to={href}
      className="group overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-sand/80"
    >
      <div className="relative h-40 bg-sage-mist">
        {item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-end p-5 font-serif text-3xl text-sage/40">
            {item.durationMinutes}'
          </div>
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
        <p className="text-sm text-sage">{item.instructorName}</p>
        {item.goalName ? (
          <p className="text-xs uppercase tracking-wider text-sage/70">{item.goalName}</p>
        ) : null}
      </div>
    </Link>
  );
}
