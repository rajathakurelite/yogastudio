import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import ClassCard from "../../components/ClassCard";
import { Button, Card, SectionTitle } from "../../components/ui";

export default function StudentHome() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/yoga/student/home").then((res) => setData(res.data.data));
  }, []);

  const today = data?.daily?.today;

  return (
    <div className="space-y-12">
      <section className="overflow-hidden rounded-[2.5rem] bg-sage-deep px-8 py-14 text-cream md:px-14">
        <p className="text-xs uppercase tracking-[0.35em] text-sand">Daily Yoga</p>
        <h1 className="mt-4 max-w-2xl font-serif text-4xl leading-tight md:text-6xl">
          Start your day with movement, breath and balance.
        </h1>
        <p className="mt-4 max-w-lg text-sand">
          A simple daily practice. Open, join, and follow along — no complicated setup.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/daily-yoga">
            <Button className="bg-cream text-sage-deep hover:bg-white">Join Today's Yoga</Button>
          </Link>
          <Link to="/classes">
            <Button variant="secondary">Explore Classes</Button>
          </Link>
        </div>
      </section>

      {today ? (
        <Card>
          <SectionTitle eyebrow="Today" title={today.title || "Today's class"} />
          <p className="text-sage">{today.instructorName} · {today.durationMinutes} min · {today.level}</p>
          <div className="mt-5">
            <Link to="/daily-yoga"><Button>Join Daily Yoga</Button></Link>
          </div>
        </Card>
      ) : null}

      {data?.continueWatching ? (
        <section>
          <SectionTitle title="Continue watching" />
          <Card>
            <p className="font-serif text-2xl">{data.continueWatching.title}</p>
            <Link to={`/classes/${data.continueWatching.class_id}/play`} className="mt-3 inline-block text-sm underline">Resume</Link>
          </Card>
        </section>
      ) : null}

      <section>
        <SectionTitle title="Recommended" />
        <div className="grid gap-5 md:grid-cols-3">
          {(data?.recommended || []).map((c) => <ClassCard key={c.id} item={c} />)}
        </div>
      </section>

      <section>
        <SectionTitle title="Popular classes" />
        <div className="grid gap-5 md:grid-cols-4">
          {(data?.popular || []).map((c) => <ClassCard key={c.id} item={c} />)}
        </div>
      </section>

      <section>
        <SectionTitle title="Recently completed" />
        {(data?.recentlyCompleted || []).length ? (
          <div className="grid gap-3">
            {data.recentlyCompleted.map((h) => (
              <Card key={h.id} className="flex items-center justify-between">
                <div>
                  <p className="font-serif text-xl">{h.title}</p>
                  <p className="text-sm text-sage">{h.instructor_display_name}</p>
                </div>
                <p className="text-sm">{h.duration_minutes} min</p>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sage">Complete a class to see it here.</p>
        )}
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Card>
          <SectionTitle title="By goal" />
          <div className="flex flex-wrap gap-2">
            {(data?.byGoal || []).map((g) => (
              <Link key={g.id} to={`/classes?goalId=${g.id}`} className="rounded-full bg-sage-mist px-3 py-1 text-sm">
                {g.name}
              </Link>
            ))}
          </div>
        </Card>
        <Card>
          <SectionTitle title="By duration" />
          <div className="flex flex-wrap gap-2">
            {[15, 30, 45, 60].map((d) => (
              <Link key={d} to={`/classes?duration=${d}`} className="rounded-full bg-sage-mist px-3 py-1 text-sm">
                {d} min
              </Link>
            ))}
          </div>
        </Card>
        <Card>
          <SectionTitle title="By level" />
          <div className="flex flex-wrap gap-2">
            {["beginner", "intermediate", "advanced"].map((l) => (
              <Link key={l} to={`/classes?level=${l}`} className="rounded-full bg-sage-mist px-3 py-1 text-sm capitalize">
                {l}
              </Link>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
