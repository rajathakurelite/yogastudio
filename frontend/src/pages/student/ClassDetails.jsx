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
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:gap-8">
      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge>{c.level}</Badge>
          <Badge tone="sand">{c.durationMinutes} min</Badge>
          <Badge tone="clay">{c.styleName}</Badge>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl">{c.title}</h1>
        <p className="mt-2 text-sage">
          {c.instructorName}
          {c.instructorPhone ? ` · ${c.instructorPhone}` : ""}
        </p>
        {c.thumbnailUrl ? (
          <img
            src={c.thumbnailUrl}
            alt=""
            className="mt-6 aspect-video w-full rounded-[1.5rem] object-cover shadow-soft"
          />
        ) : null}
        <p className="mt-6 leading-relaxed">{c.description}</p>
        <h2 className="mt-8 font-serif text-xl sm:mt-10 sm:text-2xl">What you&apos;ll practice</h2>
        <ol className="mt-4 space-y-2">
          {(data.sequence || []).map((item, i) => (
            <li key={item.id} className="flex items-start gap-3 rounded-2xl bg-white px-3 py-3 sm:px-4">
              {item.pose_image_url ? (
                <img
                  src={item.pose_image_url}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-xl object-cover bg-sage-mist"
                />
              ) : null}
              <span className="min-w-0 flex-1 text-sm sm:text-base">{i + 1}. {item.name}</span>
              <span className="shrink-0 text-sm text-sage">{Math.round((item.duration_seconds || 0) / 60)} min</span>
            </li>
          ))}
        </ol>
      </div>
      <Card className="h-fit space-y-4 lg:sticky lg:top-24">
        <p className="text-sm text-sage">{c.goalName} · {c.language === "hi" ? "Hindi" : "English"}</p>
        <Button className="w-full" onClick={joinAndStart}>Join Class</Button>
        <Link to="/classes" className="block text-center text-sm underline">Back to explore</Link>
      </Card>
    </div>
  );
}
