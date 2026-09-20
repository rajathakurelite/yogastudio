import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import ClassCard from "../../components/ClassCard";
import { Input, Select } from "../../components/ui";
import { DURATIONS, LEVELS, LANGUAGES } from "../../lib/constants";

export default function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const [styles, setStyles] = useState([]);
  const [goals, setGoals] = useState([]);
  const [result, setResult] = useState({ items: [] });

  useEffect(() => {
    api.get("/yoga/styles").then((r) => setStyles(r.data.data));
    api.get("/yoga/goals").then((r) => setGoals(r.data.data));
  }, []);

  useEffect(() => {
    const query = Object.fromEntries(params.entries());
    api.get("/yoga/classes", { params: query }).then((r) => setResult(r.data.data));
  }, [params]);

  function set(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <h1 className="font-serif text-3xl sm:text-4xl">Explore classes</h1>
      <div className="scroll-x-quiet -mx-4 flex gap-3 px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 md:grid-cols-3 lg:grid-cols-6">
        <div className="min-w-[11rem] shrink-0 sm:min-w-0">
          <Input
            placeholder="Search"
            defaultValue={params.get("q") || ""}
            onBlur={(e) => set("q", e.target.value)}
          />
        </div>
        <div className="min-w-[9rem] shrink-0 sm:min-w-0">
          <Select options={DURATIONS.map((d) => ({ id: d, label: `${d} min` }))} value={params.get("duration") || ""} onChange={(e) => set("duration", e.target.value)} />
        </div>
        <div className="min-w-[9rem] shrink-0 sm:min-w-0">
          <Select options={LEVELS} value={params.get("level") || ""} onChange={(e) => set("level", e.target.value)} />
        </div>
        <div className="min-w-[9rem] shrink-0 sm:min-w-0">
          <Select options={styles} value={params.get("styleId") || ""} onChange={(e) => set("styleId", e.target.value)} />
        </div>
        <div className="min-w-[9rem] shrink-0 sm:min-w-0">
          <Select options={goals} value={params.get("goalId") || ""} onChange={(e) => set("goalId", e.target.value)} />
        </div>
        <div className="min-w-[9rem] shrink-0 sm:min-w-0">
          <Select options={LANGUAGES} value={params.get("language") || ""} onChange={(e) => set("language", e.target.value)} />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {(result.items || []).map((c) => (
          <ClassCard key={c.id} item={c} />
        ))}
      </div>
    </div>
  );
}
