import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api, apiError } from "../../api/client";
import GenerationBoard from "../../components/GenerationBoard";
import { Button, Card } from "../../components/ui";
import { MEDIA_ACTIONS } from "../../lib/constants";

export default function MediaPage() {
  const { id } = useParams();
  const [jobs, setJobs] = useState([]);
  const [caps, setCaps] = useState([]);
  const [assets, setAssets] = useState([]);
  const [confirmType, setConfirmType] = useState(null);

  async function refresh() {
    const [j, c, klass] = await Promise.all([
      api.get(`/yoga/classes/${id}/generation-jobs`),
      api.get("/yoga/providers/capabilities"),
      api.get(`/yoga/classes/${id}`),
    ]);
    setJobs(j.data.data);
    setCaps(c.data.data.assets);
    setAssets(klass.data.data.assets || []);
  }

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 2500);
    return () => clearInterval(timer);
  }, [id]);

  async function generate(assetType, extra = {}) {
    const cap = caps.find((c) => c.assetType === assetType);
    if (cap && !cap.available && ["VIDEO", "VOICE", "MUSIC", "SOCIAL_VIDEO"].includes(assetType)) {
      toast.error(cap.notes || "This generation type is not available yet.");
      setConfirmType(null);
      return;
    }
    try {
      await api.post(`/yoga/classes/${id}/generate`, {
        assetType,
        force: true,
        input: extra,
      });
      toast.success("Generation queued");
      setConfirmType(null);
      refresh();
    } catch (err) {
      toast.error(apiError(err, "Could not start generation."));
    }
  }

  async function generateEverything() {
    try {
      await api.post(`/yoga/classes/${id}/generate-media`, {
        assetTypes: ["SCRIPT", "POSE_IMAGE", "INSTRUCTOR_IMAGE", "THUMBNAIL", "VIDEO", "VOICE", "MUSIC", "SOCIAL_VIDEO"],
        regenerate: true,
      });
      toast("Queued available steps. Unavailable types will fail honestly.");
    } catch (err) {
      toast.error(apiError(err, "Could not queue generation."));
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-sage">Step 3 · Media</p>
          <h1 className="font-serif text-4xl">Generate class media</h1>
        </div>
        <Link to={`/instructor/classes/${id}/preview`} className="text-sm underline">Preview</Link>
      </div>
      <Card className="flex flex-wrap gap-3">
        <Button onClick={generateEverything}>Generate Everything</Button>
        {MEDIA_ACTIONS.map((a) => (
          <Button key={a.type} variant="secondary" onClick={() => setConfirmType(a.type)}>
            {a.label}
          </Button>
        ))}
      </Card>
      {confirmType ? (
        <Card className="space-y-3">
          <p>Start {confirmType.replace(/_/g, " ").toLowerCase()} generation?</p>
          <p className="text-sm text-sage">Existing assets are kept unless you regenerate.</p>
          <div className="flex gap-2">
            <Button onClick={() => generate(confirmType, { regenerate: true })}>Confirm</Button>
            <Button variant="ghost" onClick={() => setConfirmType(null)}>Cancel</Button>
          </div>
        </Card>
      ) : null}
      <GenerationBoard
        jobs={jobs}
        capabilities={caps}
        onRetry={async (jobId) => {
          await api.post(`/yoga/generation-jobs/${jobId}/retry`);
          refresh();
        }}
        onCancel={async (jobId) => {
          await api.post(`/yoga/generation-jobs/${jobId}/cancel`);
          refresh();
        }}
      />
      <div className="grid gap-4 md:grid-cols-3">
        {assets.map((a) => (
          <Card key={a.id}>
            <p className="text-xs uppercase tracking-wider text-sage">{a.asset_type}</p>
            {a.storage_url?.endsWith(".svg") || a.storage_url?.includes("image") ? (
              <img src={a.storage_url} alt="" className="mt-3 h-40 w-full object-contain" />
            ) : (
              <p className="mt-2 text-sm break-all">{a.storage_url || a.status}</p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
