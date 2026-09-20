import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api, apiError } from "../../api/client";
import { Button, Card, Field, Input, Select } from "../../components/ui";
import { DURATIONS, LEVELS, LANGUAGES } from "../../lib/constants";

export default function CreateClassPage() {
  const navigate = useNavigate();
  const [styles, setStyles] = useState([]);
  const [goals, setGoals] = useState([]);
  const [form, setForm] = useState({
    instructorName: "",
    title: "",
    durationMinutes: 30,
    level: "beginner",
    styleId: "",
    goalId: "",
    language: "en",
  });

  useEffect(() => {
    api.get("/yoga/styles").then((r) => setStyles(r.data.data)).catch(() => {});
    api.get("/yoga/goals").then((r) => setGoals(r.data.data)).catch(() => {});
    api.get("/auth/me").then((r) =>
      setForm((f) => ({ ...f, instructorName: r.data.data.user.fullName }))
    ).catch(() => {});
  }, []);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.durationMinutes) return toast.error("Choose a duration.");
    if (!form.level) return toast.error("Choose a level.");
    if (!form.styleId) return toast.error("Choose a yoga style.");
    if (!form.goalId) return toast.error("Choose a goal.");
    try {
      const { data } = await api.post("/yoga/classes", {
        ...form,
        durationMinutes: Number(form.durationMinutes),
        styleId: Number(form.styleId),
        goalId: Number(form.goalId),
      });
      navigate(`/instructor/classes/${data.data.id}?generate=1`);
    } catch (err) {
      toast.error(apiError(err, "Could not create class."));
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <p className="text-xs uppercase tracking-[0.3em] text-sage">Step 1</p>
      <h1 className="font-serif text-4xl">Class information</h1>
      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Person / Instructor name">
            <Input value={form.instructorName} onChange={(e) => set("instructorName", e.target.value)} />
          </Field>
          <Field label="Class name (optional — AI can generate this)">
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Duration">
              <Select
                value={form.durationMinutes}
                onChange={(e) => set("durationMinutes", e.target.value)}
                options={DURATIONS.map((d) => ({ id: d, label: `${d} minutes` }))}
              />
            </Field>
            <Field label="Level">
              <Select value={form.level} onChange={(e) => set("level", e.target.value)} options={LEVELS} />
            </Field>
            <Field label="Yoga style">
              <Select value={form.styleId} onChange={(e) => set("styleId", e.target.value)} options={styles} />
            </Field>
            <Field label="Goal">
              <Select value={form.goalId} onChange={(e) => set("goalId", e.target.value)} options={goals} />
            </Field>
            <Field label="Language">
              <Select value={form.language} onChange={(e) => set("language", e.target.value)} options={LANGUAGES} />
            </Field>
          </div>
          <Button type="submit" className="w-full">Continue · Generate Class Plan</Button>
        </form>
      </Card>
    </div>
  );
}
