import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { Card } from "../../components/ui";

export default function HistoryPage() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api.get("/yoga/student/history").then((r) => setRows(r.data.data));
  }, []);
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl sm:text-4xl">Class history</h1>
      {rows.map((r) => (
        <Card key={r.id} className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="min-w-0">
            <p className="font-serif text-xl">{r.title}</p>
            <p className="text-sm text-sage">{r.instructor_display_name}</p>
          </div>
          <p className="shrink-0 text-sm">{r.completed_at ? new Date(r.completed_at).toLocaleDateString() : ""}</p>
        </Card>
      ))}
    </div>
  );
}
