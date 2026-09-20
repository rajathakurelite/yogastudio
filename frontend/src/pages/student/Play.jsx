import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../../api/client";
import ClassPlayer from "../../components/ClassPlayer";
import { Button, Card, Field } from "../../components/ui";

export default function PlayPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [feedback, setFeedback] = useState("");
  const lastSent = useRef(0);

  useEffect(() => {
    api.post(`/yoga/classes/${id}/join`).catch(() => {});
    api.get(`/yoga/classes/${id}`).then((r) => setData(r.data.data));
  }, [id]);

  const onProgress = useCallback(
    (payload) => {
      const now = Date.now();
      if (now - lastSent.current < 8000) return;
      lastSent.current = now;
      api.post(`/yoga/classes/${id}/progress`, payload).catch(() => {});
    },
    [id]
  );

  async function onComplete(payload) {
    try {
      await api.post(`/yoga/classes/${id}/complete`, { ...payload, feedback });
    } catch {
      toast.error("We couldn't save completion just then. Your practice still counts.");
    }
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <ClassPlayer
        yogaClass={data.class}
        sequence={data.sequence}
        assets={data.assets}
        onProgress={onProgress}
        onComplete={onComplete}
      />
      <Card>
        <Field label="Optional feedback">
          <textarea
            className="w-full rounded-2xl border border-sand px-4 py-3 text-sm"
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </Field>
      </Card>
    </div>
  );
}
