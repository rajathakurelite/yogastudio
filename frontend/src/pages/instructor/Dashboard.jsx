import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { Button, Card, SectionTitle } from "../../components/ui";

export default function InstructorDashboard() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get("/yoga/instructor/dashboard").then((r) => setData(r.data.data));
  }, []);
  const a = data?.analytics || {};
  const cards = [
    ["Total Classes", a.totalClasses],
    ["Published", a.publishedClasses],
    ["Drafts", a.draftClasses],
    ["Scheduled", a.scheduledClasses],
    ["Students", a.students],
    ["Completions", a.totalCompletions],
  ];
  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-sage">Instructor</p>
          <h1 className="font-serif text-4xl">Dashboard</h1>
        </div>
        <Link to="/instructor/classes/create">
          <Button>Create Yoga Class</Button>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <p className="text-xs uppercase tracking-wider text-sage">{label}</p>
            <p className="mt-2 font-serif text-3xl">{value || 0}</p>
          </Card>
        ))}
      </div>
      <section>
        <SectionTitle title="Draft classes" />
        {(data?.drafts || []).map((c) => (
          <Link key={c.id} to={`/instructor/classes/${c.id}`} className="mb-3 block">
            <Card className="flex justify-between">
              <span className="font-serif text-xl">{c.title || "Untitled"}</span>
              <span className="text-sm text-sage">{c.status}</span>
            </Card>
          </Link>
        ))}
      </section>
      <section>
        <SectionTitle title="Generation jobs" />
        {(data?.jobs || []).slice(0, 8).map((j) => (
          <Card key={j.id} className="mb-2 flex justify-between text-sm">
            <span>{j.assetType}</span>
            <span>{j.status}</span>
          </Card>
        ))}
      </section>
      <section>
        <SectionTitle title="Recent classes" />
        {(data?.classes || []).slice(0, 8).map((c) => (
          <Link key={c.id} to={`/instructor/classes/${c.id}`} className="mb-3 block">
            <Card className="flex justify-between">
              <span>{c.title || "Untitled"}</span>
              <span className="text-sm capitalize text-sage">{c.status}</span>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
