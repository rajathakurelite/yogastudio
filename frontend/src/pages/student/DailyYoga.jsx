import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api, apiError } from "../../api/client";
import { Badge, Button, Card } from "../../components/ui";

export default function DailyYogaPage() {
  const [data, setData] = useState(null);
  const [joined, setJoined] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/yoga/daily").then((res) => setData(res.data.data));
  }, []);

  const today = data?.today;
  if (!today) {
    return <p className="text-sage">No Daily Yoga class is published yet.</p>;
  }

  async function join() {
    try {
      await api.post(`/yoga/classes/${today.id}/join`);
      setJoined(true);
      toast.success("You're in. Take a comfortable seat.");
    } catch (err) {
      toast.error(apiError(err, "Could not join class."));
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-sage">Today's Class</p>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl md:text-5xl">{today.title}</h1>
      </div>
      <Card className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge>{today.level}</Badge>
            <Badge tone="sand">{today.durationMinutes} min</Badge>
            <Badge tone="clay">{today.styleName}</Badge>
            <Badge>{today.goalName}</Badge>
          </div>
          <p className="text-lg">{today.instructorName}</p>
          <p className="text-sm text-sage">
            {today.participantCount || 0} practicing today
            {today.startTime ? ` · ${new Date(today.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
          </p>
          <p className="leading-relaxed">{today.description}</p>
          {!joined ? (
            <Button className="w-full sm:w-auto" onClick={join}>Join Daily Yoga</Button>
          ) : (
            <Button className="w-full sm:w-auto" onClick={() => navigate(`/classes/${today.id}/play`)}>Begin practice</Button>
          )}
        </div>
        <div className="min-h-[160px] rounded-[1.5rem] bg-sage-mist sm:min-h-[220px] sm:rounded-[2rem]" />
      </Card>

      {joined ? (
        <Card className="space-y-3">
          <h2 className="font-serif text-2xl">Before you begin</h2>
          <p>Find a quiet space. Have a mat or a folded blanket nearby.</p>
          <p>Take three easy breaths. There is nothing to achieve.</p>
          <p>{today.safetyGuidance || "Move within a comfortable range. Stop if you feel pain or dizziness."}</p>
        </Card>
      ) : null}

      {data?.next ? (
        <p className="text-sm text-sage">
          Next scheduled: {data.next.title} · {new Date(data.next.starts_at).toLocaleString()}
        </p>
      ) : null}
    </div>
  );
}
