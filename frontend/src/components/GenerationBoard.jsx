import { Button } from "./ui";

const STEPS = [
  { type: "CLASS_PLAN", label: "Class plan created" },
  { type: "SCRIPT", label: "Script created" },
  { type: "POSE_IMAGE", label: "Creating pose visuals" },
  { type: "INSTRUCTOR_IMAGE", label: "Creating instructor visuals" },
  { type: "VIDEO", label: "Creating video" },
  { type: "VOICE", label: "Creating narration" },
  { type: "MUSIC", label: "Creating background music" },
  { type: "THUMBNAIL", label: "Creating thumbnail" },
  { type: "SOCIAL_VIDEO", label: "Creating social promo" },
];

function iconFor(status) {
  if (status === "COMPLETED") return "✓";
  if (status === "PROCESSING" || status === "QUEUED") return "⏳";
  if (status === "FAILED") return "!";
  if (status === "CANCELLED") return "×";
  return "○";
}

export default function GenerationBoard({ jobs, onRetry, onCancel, capabilities }) {
  return (
    <div className="space-y-4">
      <h2 className="font-serif text-3xl">Creating Your Yoga Class</h2>
      <p className="text-sm text-sage">
        Long-running work continues in the background. Leave this page if a step is taking a while.
      </p>
      <ol className="space-y-3">
        {STEPS.map((step) => {
          const job = (jobs || []).find((j) => j.assetType === step.type);
          const cap = (capabilities || []).find((c) => c.assetType === step.type);
          const status = job?.status || (cap && !cap.available ? "UNAVAILABLE" : "PENDING");
          return (
            <li key={step.type} className="flex items-start justify-between gap-4 rounded-2xl bg-white px-4 py-3 ring-1 ring-sand">
              <div>
                <p className="font-medium">
                  <span className="mr-2 text-sage">{iconFor(status)}</span>
                  {step.label}
                </p>
                <p className="text-xs text-sage">
                  {job?.errorMessage ||
                    (status === "UNAVAILABLE"
                      ? cap?.notes
                      : status === "PROCESSING"
                        ? `${job.progress || 0}%`
                        : status.toLowerCase())}
                </p>
              </div>
              <div className="flex gap-2">
                {job?.status === "FAILED" ? (
                  <Button variant="secondary" onClick={() => onRetry(job.id)}>Retry</Button>
                ) : null}
                {job && ["QUEUED", "PROCESSING"].includes(job.status) ? (
                  <Button variant="ghost" onClick={() => onCancel(job.id)}>Cancel</Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
