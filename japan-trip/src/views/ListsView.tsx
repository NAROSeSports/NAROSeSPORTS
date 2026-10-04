import { useState, type FormEvent } from "react";
import { ChevronDown, Circle, CircleCheck, Plus, Sparkles, X } from "lucide-react";
import type { Todo, TodoList } from "../types";
import { useTrip } from "../components/TripContext";
import { Avatar, Button, EditableText, EmptyState, IconButton, Segmented, avatarColor, cx, inputClass } from "../components/ui";
import { SUGGESTED_TODOS, suggestedTodos } from "../data/model";
import { newId } from "../lib/id";

export function ListsView() {
  const { data, backend, me } = useTrip();
  const [list, setList] = useState<TodoList>("todo");
  const [text, setText] = useState("");
  const [showDone, setShowDone] = useState(false);

  const todos = data.todos.filter((t) => t.list === list);
  const open = todos.filter((t) => !t.done).sort((a, b) => a.createdAt - b.createdAt);
  const done = todos.filter((t) => t.done).sort((a, b) => b.createdAt - a.createdAt);
  const counts = {
    todo: data.todos.filter((t) => t.list === "todo" && !t.done).length,
    packing: data.todos.filter((t) => t.list === "packing" && !t.done).length,
  };

  const add = (e: FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    backend.addTodo({ id: newId(), text: value, list, done: false, addedBy: me, createdAt: Date.now() });
    setText("");
  };

  const addSuggestions = () => {
    const existing = new Set(data.todos.map((t) => t.text.toLowerCase()));
    suggestedTodos(me)
      .filter((t) => t.list === list && !existing.has(t.text.toLowerCase()))
      .forEach((t) => backend.addTodo(t));
  };
  const hasUnusedSuggestions = SUGGESTED_TODOS.some(
    (s) => s.list === list && !data.todos.some((t) => t.text.toLowerCase() === s.text.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">Lists</h1>
        <Segmented
          value={list}
          onChange={(v) => {
            setList(v);
            setShowDone(false);
          }}
          options={[
            { value: "todo", label: `To-do${counts.todo ? ` · ${counts.todo}` : ""}` },
            { value: "packing", label: `Packing${counts.packing ? ` · ${counts.packing}` : ""}` },
          ]}
        />
      </div>

      {todos.length > 0 && (
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted">
            <span>
              {done.length} of {todos.length} done
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-sunken">
            <div className="h-full rounded-full bg-matcha transition-all" style={{ width: `${(done.length / todos.length) * 100}%` }} />
          </div>
        </div>
      )}

      <form onSubmit={add} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={list === "todo" ? "Add a to-do…" : "Add something to pack…"}
          aria-label="New list item"
          className={cx(inputClass, "h-11 rounded-full px-5")}
        />
        <Button type="submit" variant="primary" className="shrink-0" disabled={!text.trim()} aria-label="Add">
          <Plus size={20} />
        </Button>
      </form>

      {todos.length === 0 ? (
        <EmptyState emoji={list === "todo" ? "📝" : "🧳"} title={list === "todo" ? "Nothing to do… yet" : "Nothing to pack… yet"}>
          Shared between you, so you can both tick things off.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-card px-2">
          {open.map((t) => (
            <TodoRow key={t.id} todo={t} />
          ))}
          {open.length === 0 && <li className="px-2 py-4 text-center text-sm text-muted">All done! 🎉</li>}
        </ul>
      )}

      {hasUnusedSuggestions && (
        <Button size="sm" variant="ghost" onClick={addSuggestions} className="text-accent">
          <Sparkles size={16} /> Add suggested {list === "todo" ? "Japan trip to-dos" : "packing items"}
        </Button>
      )}

      {done.length > 0 && (
        <div>
          <button type="button" onClick={() => setShowDone(!showDone)} className="flex items-center gap-1 text-sm font-semibold text-muted">
            <ChevronDown size={16} className={cx("transition", showDone && "rotate-180")} /> Done ({done.length})
          </button>
          {showDone && (
            <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-card/60 px-2">
              {done.map((t) => (
                <TodoRow key={t.id} todo={t} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function TodoRow({ todo }: { todo: Todo }) {
  const { backend, me, members, nameOf } = useTrip();
  const who = todo.done ? todo.doneBy : todo.addedBy;
  return (
    <li className="flex items-center gap-1 py-1">
      <button
        type="button"
        onClick={() => backend.updateTodo(todo.id, { done: !todo.done, doneBy: todo.done ? null : me })}
        aria-label={todo.done ? "Mark not done" : "Mark done"}
        className={cx("shrink-0 rounded-full p-2 transition active:scale-90", todo.done ? "text-matcha" : "text-muted")}
      >
        {todo.done ? <CircleCheck size={22} /> : <Circle size={22} />}
      </button>
      <EditableText
        value={todo.text}
        onSave={(text) => (text ? backend.updateTodo(todo.id, { text }) : backend.deleteTodo(todo.id))}
        ariaLabel="List item"
        wrap
        className={cx("min-h-0 border-transparent bg-transparent px-1 py-2 focus:border-line focus:bg-paper", todo.done && "text-muted line-through")}
      />
      {members.length > 1 && who && <Avatar name={nameOf(who)} color={avatarColor(who, members)} size={20} />}
      <IconButton label="Delete" onClick={() => backend.deleteTodo(todo.id)} className="size-9">
        <X size={17} />
      </IconButton>
    </li>
  );
}
