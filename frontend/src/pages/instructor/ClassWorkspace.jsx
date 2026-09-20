import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api, apiError } from "../../api/client";
import SequenceEditor from "../../components/SequenceEditor";
import { Button, Card, Field, Input } from "../../components/ui";

function normalizeItems(items) {
  return (items || []).map((i) => ({
    id: i.id,
    poseId: i.pose_id,
    itemType: i.item_type,
    name: i.name,
    sanskritName: i.sanskrit_name,
    durationSeconds: i.duration_seconds,
    instructions: i.instructions,
    breathingGuidance: i.breathing_guidance,
    transition: i.transition,
    instructorNote: i.instructor_note,
    sceneLabel: i.scene_label,
  }));
}

export default function ClassWorkspace() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const [yogaClass, setYogaClass] = useState(null);
  const [items, setItems] = useState([]);
  const [poses, setPoses] = useState([]);
  const [job, setJob] = useState(null);
  const [generating, setGenerating] = useState(false);

  async function load() {
    const { data } = await api.get(`/yoga/classes/${id}`);
    setYogaClass(data.data.class);
    setItems(normalizeItems(data.data.sequence));
  }

  useEffect(() => {
    load();
    api.get("/yoga/poses").then((r) => setPoses(r.data.data));
  }, [id]);

  useEffect(() => {
    if (params.get("generate") === "1" && yogaClass && !items.length && !generating) {
      generatePlan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yogaClass]);

  async function poll(jobId) {
    const started = Date.now();
    while (Date.now() - started < 180000) {
      const { data } = await api.get(`/yoga/generation-jobs/${jobId}`);
      setJob(data.data);
      if (["COMPLETED", "FAILED", "CANCELLED"].includes(data.data.status)) return data.data;
      await new Promise((r) => setTimeout(r, 1500));
    }
    return { status: "PROCESSING" };
  }

  async function generatePlan() {
    setGenerating(true);
    try {
      const { data } = await api.post(`/yoga/classes/${id}/generate-plan`, {});
      const result = await poll(data.data.id);
      if (result.status === "COMPLETED") {
        toast.success("Class plan ready. Review the sequence.");
        await load();
      } else if (result.status === "FAILED") {
        toast.error(result.errorMessage || "Your class plan couldn't be generated. Please try again.");
      } else {
        toast("Generation is still running. You can leave and come back.");
      }
    } catch (err) {
      toast.error(apiError(err, "Your class plan couldn't be generated. Please try again."));
    } finally {
      setGenerating(false);
    }
  }

  async function saveSequence() {
    try {
      await api.put(`/yoga/classes/${id}/sequence`, { items });
      toast.success("Sequence saved");
    } catch (err) {
      toast.error(apiError(err, "Could not save sequence."));
    }
  }

  async function submit() {
    try {
      await saveSequence();
      await api.post(`/yoga/classes/${id}/submit`);
      toast.success("Submitted for approval. Nothing is published automatically.");
    } catch (err) {
      toast.error(apiError(err, "Could not submit class."));
    }
  }

  if (!yogaClass) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.3em] text-sage">Step 2 · AI class plan</p>
          <h1 className="font-serif text-3xl sm:text-4xl">{yogaClass.title || "Untitled class"}</h1>
          <p className="text-sage">{yogaClass.instructorName} · {yogaClass.durationMinutes} min · {yogaClass.level}</p>
        </div>
        <div className="scroll-x-quiet -mx-4 flex gap-2 px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          <Button variant="secondary" className="shrink-0" onClick={generatePlan} disabled={generating}>
            {generating ? "Generating…" : "Generate Class Plan"}
          </Button>
          <Link to={`/instructor/classes/${id}/script`} className="shrink-0"><Button variant="secondary">Script</Button></Link>
          <Link to={`/instructor/classes/${id}/media`} className="shrink-0"><Button variant="secondary">Media</Button></Link>
          <Link to={`/instructor/classes/${id}/preview`} className="shrink-0"><Button variant="ghost">Preview</Button></Link>
        </div>
      </div>

      {job?.status === "PROCESSING" ? (
        <Card>⏳ Creating your class plan. You can leave this page.</Card>
      ) : null}

      <Card className="space-y-3">
        <p>{yogaClass.description}</p>
        <p className="text-sm text-sage">{yogaClass.safetyGuidance}</p>
      </Card>

      <SequenceEditor items={items} poses={poses} onChange={setItems} />
      <div className="flex flex-wrap gap-3">
        <Button onClick={saveSequence}>Save sequence</Button>
        <Button variant="secondary" onClick={submit}>Submit for approval</Button>
      </div>
    </div>
  );
}
