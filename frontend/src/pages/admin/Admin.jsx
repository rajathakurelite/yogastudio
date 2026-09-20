import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api, apiError } from "../../api/client";
import { Button, Card, Field, Input, Select } from "../../components/ui";

export default function AdminPage() {
  const [tab, setTab] = useState("analytics");
  const [analytics, setAnalytics] = useState(null);
  const [classes, setClasses] = useState([]);
  const [users, setUsers] = useState([]);
  const [poses, setPoses] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [caps, setCaps] = useState(null);

  async function load() {
    const [a, c, u, p, j, cap] = await Promise.all([
      api.get("/yoga/admin/analytics"),
      api.get("/yoga/classes", { params: { status: "", pageSize: 50 } }),
      api.get("/yoga/admin/users"),
      api.get("/yoga/poses"),
      api.get("/yoga/admin/generation-jobs"),
      api.get("/yoga/providers/capabilities"),
    ]);
    setAnalytics(a.data.data);
    setClasses(c.data.data.items || []);
    setUsers(u.data.data);
    setPoses(p.data.data);
    setJobs(j.data.data);
    setCaps(cap.data.data);
  }

  useEffect(() => {
    load().catch(() => {});
    api.get("/yoga/classes", { params: { pageSize: 50 } }).then((r) => {
      if (!classes.length) setClasses(r.data.data.items || []);
    });
    api.get("/yoga/instructor/dashboard").catch(() => {});
  }, []);

  async function moderate(id, action) {
    try {
      await api.post(`/yoga/classes/${id}/moderate`, { action });
      toast.success(`Class ${action}d`);
      load();
    } catch (err) {
      toast.error(apiError(err, "Could not update class."));
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-4xl">Admin</h1>
      <div className="flex flex-wrap gap-2">
        {["analytics", "classes", "users", "library", "generation"].map((t) => (
          <Button key={t} variant={tab === t ? "primary" : "secondary"} onClick={() => setTab(t)}>
            {t}
          </Button>
        ))}
      </div>

      {tab === "analytics" && analytics ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(analytics).map(([k, v]) => (
            <Card key={k}>
              <p className="text-xs uppercase tracking-wider text-sage">{k}</p>
              <p className="mt-2 font-serif text-3xl">{v ?? 0}</p>
            </Card>
          ))}
        </div>
      ) : null}

      {tab === "classes" ? (
        <div className="space-y-3">
          {classes.map((c) => (
            <Card key={c.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-serif text-xl">{c.title}</p>
                <p className="text-sm text-sage">{c.status} · {c.instructorName}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => moderate(c.id, "approve")}>Approve</Button>
                <Button variant="secondary" onClick={() => moderate(c.id, "publish")}>Publish</Button>
                <Button variant="ghost" onClick={() => moderate(c.id, "unpublish")}>Unpublish</Button>
                <Button variant="ghost" onClick={() => moderate(c.id, "reject")}>Reject</Button>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {tab === "users" ? (
        <div className="space-y-3">
          {users.map((u) => (
            <Card key={u.id} className="flex justify-between">
              <div>
                <p>{u.full_name}</p>
                <p className="text-sm text-sage">{u.email} · {u.roles}</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => api.patch(`/yoga/admin/users/${u.id}`, { isActive: !u.is_active }).then(load)}
              >
                {u.is_active ? "Disable" : "Enable"}
              </Button>
            </Card>
          ))}
        </div>
      ) : null}

      {tab === "library" ? (
        <Library poses={poses} onChange={load} />
      ) : null}

      {tab === "generation" ? (
        <div className="space-y-4">
          <Card>
            <p className="font-medium">Fable / provider configuration</p>
            <p className="mt-2 text-sm text-sage">
              {caps?.configured
                ? `Configured · model ${caps.model}`
                : "Not configured. Set ANTHROPIC_API_KEY or FABLE_API_KEY on the server. Keys never ship to the browser."}
            </p>
          </Card>
          {jobs.map((j) => (
            <Card key={j.id} className="text-sm">
              <p>{j.asset_type} · {j.status} · {j.provider} · class {j.class_title}</p>
              {j.error_message ? <p className="text-clay">{j.error_message}</p> : null}
              {j.technical_error ? <p className="text-xs text-sage">Admin detail: {j.technical_error}</p> : null}
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Library({ poses, onChange }) {
  const [form, setForm] = useState({
    name: "",
    sanskritName: "",
    category: "Standing",
    difficulty: "beginner",
    description: "",
    cautionNotes: "",
  });
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <h2 className="font-serif text-2xl">Add pose</h2>
        <form
          className="mt-4 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            await api.post("/yoga/admin/poses", form);
            toast.success("Pose added");
            onChange();
          }}
        >
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Sanskrit"><Input value={form.sanskritName} onChange={(e) => setForm({ ...form, sanskritName: e.target.value })} /></Field>
          <Field label="Category">
            <Select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              options={["Standing","Sitting","Lying","Balance","Backbend","Forward Fold","Twist","Inversion","Breathing","Relaxation"].map((c) => ({ id: c, label: c }))}
            />
          </Field>
          <Button type="submit">Save pose</Button>
        </form>
      </Card>
      <div className="space-y-2">
        {poses.map((p) => (
          <Card key={p.id} className="flex justify-between">
            <span>{p.name} <em className="text-sage">{p.sanskrit_name}</em></span>
            <span className="text-xs">{p.category}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
