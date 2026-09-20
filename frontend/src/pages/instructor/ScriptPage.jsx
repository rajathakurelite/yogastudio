import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api, apiError } from "../../api/client";
import { Button, Card, Field } from "../../components/ui";

export default function ScriptPage() {
  const { id } = useParams();
  const [script, setScript] = useState({ sections: [] });
  const [klass, setKlass] = useState(null);

  useEffect(() => {
    api.get(`/yoga/classes/${id}`).then((r) => {
      setKlass(r.data.data.class);
      setScript(r.data.data.class.script || { sections: [] });
    });
  }, [id]);

  function updateSection(index, patch) {
    setScript((s) => ({
      ...s,
      sections: s.sections.map((sec, i) => (i === index ? { ...sec, ...patch } : sec)),
    }));
  }

  async function save() {
    try {
      await api.put(`/yoga/classes/${id}/script`, script);
      toast.success("Script saved. Manual edits are preserved.");
    } catch (err) {
      toast.error(apiError(err, "Could not save script."));
    }
  }

  async function regenerate({ overwriteManual = false } = {}) {
    if (klass?.scriptManuallyEdited && !overwriteManual) {
      const ok = window.confirm("This script was edited. Regenerate and overwrite your edits?");
      if (!ok) return;
      overwriteManual = true;
    }
    try {
      await api.post(`/yoga/classes/${id}/generate-script`, {
        input: { overwriteManual },
        force: true,
      });
      toast("Script generation queued");
    } catch (err) {
      toast.error(apiError(err, "Could not regenerate script."));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="font-serif text-4xl">Script editor</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => regenerate()}>Regenerate entire script</Button>
          <Button onClick={save}>Save</Button>
        </div>
      </div>
      {(script.sections || []).map((section, index) => (
        <Card key={index} className="space-y-3">
          <p className="text-xs uppercase tracking-wider text-sage">{section.scene || section.sequenceItemName}</p>
          <Field label="Instructor narration">
            <textarea
              className="w-full rounded-2xl border border-sand px-4 py-3 text-sm"
              rows={4}
              value={section.instructorNarration || ""}
              onChange={(e) => updateSection(index, { instructorNarration: e.target.value })}
            />
          </Field>
          <div className="grid gap-3 md:grid-cols-2">
            <textarea className="rounded-2xl border border-sand px-4 py-3 text-sm" rows={2} placeholder="Instruction" value={section.instruction || ""} onChange={(e) => updateSection(index, { instruction: e.target.value })} />
            <textarea className="rounded-2xl border border-sand px-4 py-3 text-sm" rows={2} placeholder="Breathing" value={section.breathingInstruction || ""} onChange={(e) => updateSection(index, { breathingInstruction: e.target.value })} />
          </div>
          <Button variant="ghost" onClick={() => regenerate({ overwriteManual: true })}>Regenerate section (full script)</Button>
        </Card>
      ))}
    </div>
  );
}
