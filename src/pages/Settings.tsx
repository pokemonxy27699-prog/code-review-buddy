import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getApiBaseUrl, setApiBaseUrl, testConnection } from "@/services/api";
import { useTags, useUpdateTags } from "@/store/trades";
import { Wifi, WifiOff, Loader2, CheckCircle2, XCircle, Server, Tags, Plus, Pencil, Trash2, X, Check } from "lucide-react";

export default function Settings() {
  const [url, setUrl] = useState(getApiBaseUrl);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleSave = () => { setApiBaseUrl(url); setResult(null); };

  const handleTest = async () => {
    if (!url.trim()) { setResult({ ok: false, message: "Enter a URL first" }); return; }
    setApiBaseUrl(url);
    setTesting(true);
    setResult(null);
    try {
      const res = await testConnection();
      setResult({ ok: true, message: `Connected — ${JSON.stringify(res)}` });
    } catch (e: any) {
      setResult({ ok: false, message: e.message || "Connection failed" });
    } finally {
      setTesting(false);
    }
  };

  const isConfigured = !!getApiBaseUrl();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-lg font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your CryptoJournal backend connection.</p>
      </div>

      {/* API Connection */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">API Connection</h2>
          <Badge variant={isConfigured ? "default" : "outline"} className="text-[10px] ml-auto">
            {isConfigured ? <><Wifi className="h-3 w-3 mr-1" /> Connected</> : <><WifiOff className="h-3 w-3 mr-1" /> Mock Mode</>}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          Enter your API base URL. When empty, the app uses local mock data.
          The API should expose <code className="text-primary">/health</code>, <code className="text-primary">/trades</code>, and <code className="text-primary">/tags</code> endpoints.
        </p>

        <div className="flex gap-2">
          <Input value={url} onChange={(e) => { setUrl(e.target.value); setResult(null); }} placeholder="https://your-api.example.com/v1" className="h-9 text-sm bg-background border-border/50 font-mono" />
          <Button variant="outline" size="sm" className="h-9 text-xs gap-1 shrink-0" onClick={handleSave}>Save</Button>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" className="h-8 text-xs gap-1" onClick={handleTest} disabled={testing}>
            {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wifi className="h-3 w-3" />}
            Test Connection
          </Button>
          {result && (
            <div className={`flex items-center gap-1.5 text-xs ${result.ok ? "text-success" : "text-destructive"}`}>
              {result.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              <span className="truncate max-w-xs">{result.message}</span>
            </div>
          )}
        </div>

        {!isConfigured && (
          <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Mock Mode Active</p>
            <p>All data is stored in localStorage. Set an API URL above to connect to a real backend.</p>
          </div>
        )}

        {url && (
          <div className="text-[10px] text-muted-foreground font-mono space-y-0.5">
            <p>Expected endpoints:</p>
            <p>GET  /health</p>
            <p>GET  /trades?search=&side=&setup=...</p>
            <p>GET  /trades/:id</p>
            <p>POST /trades</p>
            <p>PATCH /trades/:id</p>
            <p>DELETE /trades/:id</p>
            <p>GET  /tags</p>
            <p>PUT  /tags</p>
          </div>
        )}
      </div>

      {/* Tag Manager */}
      <TagManager />
    </div>
  );
}

function TagManager() {
  const { data: tags } = useTags();
  const updateTags = useUpdateTags();

  if (!tags) return null;

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Tags className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Tag Manager</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Manage your setup, emotion, and mistake categories. Changes apply globally to filters and trade details.
      </p>

      <div className="grid gap-6 lg:grid-cols-3">
        <TagColumn
          title="Setups"
          items={tags.setups}
          onUpdate={(items) => updateTags.mutate({ ...tags, setups: items })}
        />
        <TagColumn
          title="Emotions"
          items={tags.emotions}
          onUpdate={(items) => updateTags.mutate({ ...tags, emotions: items })}
        />
        <TagColumn
          title="Mistakes"
          items={tags.mistakes}
          onUpdate={(items) => updateTags.mutate({ ...tags, mistakes: items })}
        />
      </div>
    </div>
  );
}

function TagColumn({ title, items, onUpdate }: { title: string; items: string[]; onUpdate: (items: string[]) => void }) {
  const [newItem, setNewItem] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleAdd = () => {
    const val = newItem.trim();
    if (val && !items.includes(val)) {
      onUpdate([...items, val]);
      setNewItem("");
    }
  };

  const handleRename = (idx: number) => {
    const val = editValue.trim();
    if (val && !items.includes(val)) {
      const next = [...items];
      next[idx] = val;
      onUpdate(next);
    }
    setEditingIdx(null);
  };

  const handleDelete = (idx: number) => {
    onUpdate(items.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground mb-2">{title}</p>
      <div className="space-y-1 mb-2 max-h-48 overflow-y-auto">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1 group">
            {editingIdx === i ? (
              <>
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRename(i)}
                  className="h-7 text-xs bg-background flex-1"
                  autoFocus
                />
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleRename(i)}>
                  <Check className="h-3 w-3 text-[hsl(var(--success))]" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingIdx(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-xs py-1.5 px-2 rounded bg-muted/20">{item}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => { setEditingIdx(i); setEditValue(item); }}
                >
                  <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(i)}
                >
                  <Trash2 className="h-2.5 w-2.5 text-destructive" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-1">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={`Add ${title.toLowerCase().slice(0, -1)}...`}
          className="h-7 text-xs bg-background"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button size="sm" variant="outline" className="h-7 w-7 p-0 shrink-0" onClick={handleAdd}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
