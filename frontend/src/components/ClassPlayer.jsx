import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui";

export default function ClassPlayer({
  yogaClass,
  sequence,
  assets,
  onProgress,
  onComplete,
}) {
  const items = sequence || [];
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(items[0]?.duration_seconds || items[0]?.durationSeconds || 60);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [phase, setPhase] = useState("practice");
  const current = items[index];
  const video = (assets || []).find((a) => a.asset_type === "VIDEO" && a.status === "ready");
  const poseVisual =
    (assets || []).find(
      (a) =>
        a.asset_type === "POSE_IMAGE" &&
        a.status === "ready" &&
        a.sequence_item_id === current?.id
    ) ||
    (assets || []).find(
      (a) => a.asset_type === "POSE_IMAGE" && a.status === "ready" && !a.sequence_item_id
    );
  const poseImageUrl =
    poseVisual?.storage_url ||
    current?.pose_image_url ||
    current?.poseImageUrl ||
    null;
  const total = useMemo(
    () => items.reduce((s, i) => s + Number(i.duration_seconds || i.durationSeconds || 0), 0),
    [items]
  );
  const elapsed = useMemo(() => {
    const before = items
      .slice(0, index)
      .reduce((s, i) => s + Number(i.duration_seconds || i.durationSeconds || 0), 0);
    const cur = Number(current?.duration_seconds || current?.durationSeconds || 0) - remaining;
    return before + Math.max(0, cur);
  }, [items, index, remaining, current]);

  useEffect(() => {
    setRemaining(Number(current?.duration_seconds || current?.durationSeconds || 60));
  }, [index, current]);

  useEffect(() => {
    if (!playing || phase !== "practice" || !current) return undefined;
    const timer = setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          if (index < items.length - 1) setIndex((i) => i + 1);
          else {
            setPlaying(false);
            setPhase("complete");
            onComplete?.({ durationWatchedSeconds: total });
          }
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [playing, phase, current, index, items.length, onComplete, total]);

  useEffect(() => {
    if (!items.length) return;
    const pct = Math.min(100, Math.round((elapsed / Math.max(total, 1)) * 100));
    onProgress?.({
      status: phase === "complete" ? "COMPLETED" : "STARTED",
      completionPercentage: pct,
      durationWatchedSeconds: Math.round(elapsed),
    });
  }, [elapsed, total, phase, items.length, onProgress]);

  if (phase === "complete") {
    return (
      <div className="mx-auto max-w-xl rounded-[1.75rem] bg-white p-6 text-center shadow-soft sm:rounded-[2rem] sm:p-8">
        <p className="text-xs uppercase tracking-[0.25em] text-sage">Class Complete</p>
        <h2 className="mt-3 font-serif text-3xl sm:text-4xl">{yogaClass?.title}</h2>
        <p className="mt-2 text-sage">{yogaClass?.instructorName}</p>
        <p className="mt-6 text-sm">Duration completed · {yogaClass?.durationMinutes} min</p>
        <p className="text-sm text-sage">{new Date().toLocaleDateString()}</p>
        <div className="mt-8 flex justify-center">
          <Button className="w-full sm:w-auto" onClick={() => (window.location.href = "/classes")}>Explore another class</Button>
        </div>
      </div>
    );
  }

  if (!current) {
    return <p className="text-center text-sage">This class does not have a sequence yet.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="overflow-hidden rounded-[2rem] bg-sage-deep text-cream">
        {video?.storage_url ? (
          <video
            className="aspect-video w-full bg-black"
            src={video.storage_url}
            controls
            playsInline
          />
        ) : poseImageUrl ? (
          <img
            src={poseImageUrl}
            alt={current.name || "Pose"}
            className="aspect-square w-full object-contain bg-sage-mist"
          />
        ) : (
          <div className="flex aspect-[4/5] flex-col items-center justify-center p-6 text-center sm:p-8 md:aspect-video">
            <p className="text-xs uppercase tracking-[0.3em] text-sand">Current pose</p>
            <h2 className="mt-4 font-serif text-3xl sm:text-4xl md:text-6xl">{current.name}</h2>
            {current.sanskrit_name || current.sanskritName ? (
              <p className="mt-2 italic text-sand">{current.sanskrit_name || current.sanskritName}</p>
            ) : null}
          </div>
        )}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-sand">
        <div
          className="h-full bg-sage-deep transition-all"
          style={{ width: `${Math.min(100, (elapsed / Math.max(total, 1)) * 100)}%` }}
        />
      </div>
      <div className="flex items-center justify-between gap-3 text-sm text-sage">
        <span className="min-w-0 truncate">{current.scene_label || current.item_type || current.itemType}</span>
        <span className="shrink-0">{remaining}s remaining</span>
      </div>
      <div className="rounded-[1.75rem] bg-white p-4 shadow-soft sm:rounded-[2rem] sm:p-6">
        <h3 className="font-serif text-xl sm:text-2xl">{current.name}</h3>
        <p className="mt-3 text-sm leading-relaxed">{current.instructions}</p>
        {current.breathing_guidance || current.breathingGuidance ? (
          <p className="mt-3 text-sm text-sage">
            Breath: {current.breathing_guidance || current.breathingGuidance}
          </p>
        ) : null}
        <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
          <Button onClick={() => setPlaying((v) => !v)}>{playing ? "Pause" : "Play"}</Button>
          <Button variant="secondary" onClick={() => setMuted((v) => !v)}>
            {muted ? "Unmute" : "Volume"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
          >
            Previous
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (index < items.length - 1) setIndex(index + 1);
              else {
                setPhase("complete");
                onComplete?.({ durationWatchedSeconds: total });
              }
            }}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
