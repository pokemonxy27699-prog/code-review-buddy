import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getApiBaseUrl, setApiBaseUrl, testConnection } from "@/services/api";
import { Wifi, WifiOff, Loader2, CheckCircle2, XCircle, Server } from "lucide-react";

export default function Settings() {
  const [url, setUrl] = useState(getApiBaseUrl);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleSave = () => {
    setApiBaseUrl(url);
    setResult(null);
  };

  const handleTest = async () => {
    if (!url.trim()) {
      setResult({ ok: false, message: "Enter a URL first" });
      return;
    }
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

      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">API Connection</h2>
          <Badge variant={isConfigured ? "default" : "outline"} className="text-[10px] ml-auto">
            {isConfigured ? (
              <><Wifi className="h-3 w-3 mr-1" /> Connected</>
            ) : (
              <><WifiOff className="h-3 w-3 mr-1" /> Mock Mode</>
            )}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          Enter your API base URL. When empty, the app uses local mock data.
          The API should expose <code className="text-primary">/health</code>, <code className="text-primary">/trades</code>, and <code className="text-primary">/tags</code> endpoints.
        </p>

        <div className="flex gap-2">
          <Input
            value={url}
            onChange={(e) => { setUrl(e.target.value); setResult(null); }}
            placeholder="https://your-api.example.com/v1"
            className="h-9 text-sm bg-background border-border/50 font-mono"
          />
          <Button variant="outline" size="sm" className="h-9 text-xs gap-1 shrink-0" onClick={handleSave}>
            Save
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={handleTest}
            disabled={testing}
          >
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
    </div>
  );
}
