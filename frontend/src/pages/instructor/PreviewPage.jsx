import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api, apiError } from "../../api/client";
import ClassPlayer from "../../components/ClassPlayer";
import { Button, Card, Field, Input } from "../../components/ui";

export default function PreviewPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [startsAt, setStartsAt] = useState("");

  useEffect(() => {
    api.get(`/yoga/classes/${id}`).then((r) => setData(r.data.data));
  }, [id]);

  if (!data) return null;

  async function publish() {
    try {
      await api.post(`/yoga/classes/${id}/publish`);
      toast.success("Published");
    } catch (err) {
      toast.error(apiError(err, "An admin must approve this class first."));
    }
  }

  async function schedule(e) {
    e.preventDefault();
    try {
      await api.post(`/yoga/classes/${id}/schedule`, { startsAt });
      toast.success("Scheduled");
    } catch (err) {
      toast.error(apiError(err, "Could not schedule class."));
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-serif text-3xl sm:text-4xl">Preview</h1>
        <Button className="w-full sm:w-auto" onClick={publish}>Approve & Publish</Button>
      </div>
      <ClassPlayer yogaClass={data.class} sequence={data.sequence} assets={data.assets} />
      <Card>
        <h2 className="font-serif text-2xl">Schedule</h2>
        <form onSubmit={schedule} className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <Field label="Start">
            <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
          </Field>
          <Button type="submit" className="w-full sm:w-auto">Schedule class</Button>
        </form>
      </Card>
    </div>
  );
}
