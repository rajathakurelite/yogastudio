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
    <div className="space-y-8">
      <h1 className="font-serif text-4xl">Explore classes</h1>
      <div className="grid gap-3 md:grid-cols-6">
        <Input
          placeholder="Search"
          defaultValue={params.get("q") || ""}
          onBlur={(e) => set("q", e.target.value)}
        />
        <Select options={DURATIONS.map((d) => ({ id: d, label: `${d} min` }))} value={params.get("duration") || ""} onChange={(e) => set("duration", e.target.value)} />
        <Select options={LEVELS} value={params.get("level") || ""} onChange={(e) => set("level", e.target.value)} />
        <Select options={styles} value={params.get("styleId") || ""} onChange={(e) => set("styleId", e.target.value)} />
        <Select options={goals} value={params.get("goalId") || ""} onChange={(e) => set("goalId", e.target.value)} />
        <Select options={LANGUAGES} value={params.get("language") || ""} onChange={(e) => set("language", e.target.value)} />
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {(result.items || []).map((c) => (
          <ClassCard key={c.id} item={c} />
        ))}
      </div>
    </div>
  );
}
