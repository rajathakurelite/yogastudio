import { useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button, Input, Select } from "./ui";
const TYPES = ["pose", "breathing", "rest", "transition", "note"];

export default function SequenceEditor({ items, poses, onChange }) {
  const catalog = poses || [];

  function update(index, patch) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function remove(index) {
    onChange(items.filter((_, i) => i !== index));
  }

  function duplicate(index) {
    const copy = { ...items[index], id: undefined };
    const next = [...items];
    next.splice(index + 1, 0, copy);
    onChange(next);
  }

  function add(type = "pose") {
    onChange([
      ...items,
      {
        itemType: type,
        name: type === "rest" ? "Rest" : type === "breathing" ? "Breathing" : "New pose",
        durationSeconds: 60,
        instructions: "",
        breathingGuidance: "",
        transition: "",
        instructorNote: "",
      },
    ]);
  }

  function onDragEnd(result) {
    if (!result.destination) return;
    const next = Array.from(items);
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    onChange(next);
  }

  const totalMin = useMemo(
    () => Math.round(items.reduce((sum, i) => sum + Number(i.durationSeconds || 0), 0) / 60),
    [items]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-sage">Sequence · {items.length} items · ~{totalMin} min</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => add("pose")}>Add pose</Button>
          <Button variant="secondary" onClick={() => add("breathing")}>Add breathing</Button>
          <Button variant="secondary" onClick={() => add("rest")}>Add rest</Button>
          <Button variant="secondary" onClick={() => add("transition")}>Add transition</Button>
          <Button variant="ghost" onClick={() => add("note")}>Add note</Button>
        </div>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="sequence">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
              {items.map((item, index) => (
                <Draggable key={`${item.id || "n"}-${index}`} draggableId={`item-${index}`} index={index}>
                  {(drag) => (
                    <div
                      ref={drag.innerRef}
                      {...drag.draggableProps}
                      className="rounded-3xl bg-white p-4 ring-1 ring-sand"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          className="cursor-grab text-xs uppercase tracking-widest text-sage"
                          {...drag.dragHandleProps}
                        >
                          {index + 1}. {item.itemType}
                        </button>
                        <div className="flex gap-2">
                          <button className="text-xs text-sage" onClick={() => duplicate(index)}>Duplicate</button>
                          <button className="text-xs text-clay" onClick={() => remove(index)}>Remove</button>
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-4">
                        <Input
                          aria-label="Pose name"
                          value={item.name || ""}
                          onChange={(e) => update(index, { name: e.target.value })}
                          placeholder="Pose name"
                        />
                        <Input
                          value={item.sanskritName || ""}
                          onChange={(e) => update(index, { sanskritName: e.target.value })}
                          placeholder="Sanskrit name"
                        />
                        <Input
                          type="number"
                          min="10"
                          value={item.durationSeconds || 60}
                          onChange={(e) =>
                            update(index, { durationSeconds: Number(e.target.value) })
                          }
                          placeholder="Seconds"
                        />
                        <Select
                          value={item.itemType || "pose"}
                          onChange={(e) => update(index, { itemType: e.target.value })}
                          options={TYPES.map((t) => ({ id: t, label: t }))}
                        />
                      </div>
                      {catalog.length ? (
                        <div className="mt-3">
                          <Select
                            value={item.poseId || ""}
                            onChange={(e) => {
                              const pose = catalog.find((p) => String(p.id) === e.target.value);
                              update(index, {
                                poseId: pose?.id,
                                name: pose?.name || item.name,
                                sanskritName: pose?.sanskrit_name || item.sanskritName,
                                instructions: pose?.instructions || item.instructions,
                                breathingGuidance: pose?.breathing_guidance || item.breathingGuidance,
                              });
                            }}
                            options={catalog.map((p) => ({ id: p.id, label: p.name }))}
                          />
                        </div>
                      ) : null}
                      <textarea
                        className="mt-3 w-full rounded-2xl border border-sand px-4 py-3 text-sm"
                        rows={2}
                        placeholder="Instructions"
                        value={item.instructions || ""}
                        onChange={(e) => update(index, { instructions: e.target.value })}
                      />
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <textarea
                          className="w-full rounded-2xl border border-sand px-4 py-3 text-sm"
                          rows={2}
                          placeholder="Breathing guidance"
                          value={item.breathingGuidance || ""}
                          onChange={(e) => update(index, { breathingGuidance: e.target.value })}
                        />
                        <textarea
                          className="w-full rounded-2xl border border-sand px-4 py-3 text-sm"
                          rows={2}
                          placeholder="Transition"
                          value={item.transition || ""}
                          onChange={(e) => update(index, { transition: e.target.value })}
                        />
                      </div>
                      <Input
                        className="mt-3 w-full rounded-2xl border border-sand bg-white px-4 py-3 text-sm"
                        placeholder="Custom instructor note"
                        value={item.instructorNote || ""}
                        onChange={(e) => update(index, { instructorNote: e.target.value })}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
