import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { Card } from "../../components/ui";

export default function SchedulePage() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api.get("/yoga/schedule").then((r) => setRows(r.data.data));
  }, []);
  const today = rows.filter((r) => new Date(r.starts_at).toDateString() === new Date().toDateString());
  const upcoming = rows.filter((r) => new Date(r.starts_at) > new Date());
  return (
    <div className="space-y-8">
      <h1 className="font-serif text-4xl">Schedule</h1>
      <section>
        <h2 className="mb-3 font-serif text-2xl">Today</h2>
        {today.length ? today.map((r) => <Row key={r.id} r={r} />) : <p className="text-sage">No classes listed for today.</p>}
      </section>
      <section>
        <h2 className="mb-3 font-serif text-2xl">Upcoming</h2>
        {upcoming.map((r) => <Row key={r.id} r={r} />)}
      </section>
    </div>
  );
}

function Row({ r }) {
  return (
    <Card className="mb-3 flex items-center justify-between">
      <div>
        <p className="font-serif text-xl">{r.title}</p>
        <p className="text-sm text-sage">{r.instructor_display_name} · {new Date(r.starts_at).toLocaleString()}</p>
      </div>
      <Link to={`/classes/${r.class_id}`} className="text-sm underline">Join</Link>
    </Card>
  );
}
