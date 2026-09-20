import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api, apiError } from "../../api/client";
import { Badge, Button, Card } from "../../components/ui";

export default function ClassDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/yoga/classes/${id}`).then((r) => setData(r.data.data));
  }, [id]);

  if (!data) return null;
  const c = data.class;

  async function joinAndStart() {
    try {
      await api.post(`/yoga/classes/${id}/join`);
      navigate(`/classes/${id}/play`);
    } catch (err) {
      toast.error(apiError(err, "Could not join class."));
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1.4fr_1fr]">
      <div>
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge>{c.level}</Badge>
          <Badge tone="sand">{c.durationMinutes} min</Badge>
          <Badge tone="clay">{c.styleName}</Badge>
        </div>
        <h1 className="font-serif text-4xl">{c.title}</h1>
        <p className="mt-2 text-sage">{c.instructorName}</p>
        <p className="mt-6 leading-relaxed">{c.description}</p>
        <h2 className="mt-10 font-serif text-2xl">What you'll practice</h2>
        <ol className="mt-4 space-y-2">
          {(data.sequence || []).map((item, i) => (
            <li key={item.id} className="flex justify-between rounded-2xl bg-white px-4 py-3">
              <span>{i + 1}. {item.name}</span>
              <span className="text-sm text-sage">{Math.round((item.duration_seconds || 0) / 60)} min</span>
            </li>
          ))}
        </ol>
      </div>
      <Card className="h-fit space-y-4">
        <p className="text-sm text-sage">{c.goalName} · {c.language === "hi" ? "Hindi" : "English"}</p>
        <Button className="w-full" onClick={joinAndStart}>Join Class</Button>
        <Link to="/classes" className="block text-center text-sm underline">Back to explore</Link>
      </Card>
    </div>
  );
}
