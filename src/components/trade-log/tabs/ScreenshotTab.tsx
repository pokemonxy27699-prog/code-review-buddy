import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ImagePlus,
  ZoomIn,
  ZoomOut,
  Trash2,
  Replace,
  Pencil,
  ArrowRight,
  Type,
  RotateCcw,
  MousePointer,
} from "lucide-react";

type Tool = "select" | "draw" | "arrow" | "text";

interface Annotation {
  type: "draw" | "arrow" | "text";
  points?: { x: number; y: number }[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  text?: string;
  position?: { x: number; y: number };
}

interface Props {
  screenshot: string | null;
  annotations: Annotation[];
  onScreenshotChange: (img: string | null) => void;
  onAnnotationsChange: (ann: Annotation[]) => void;
}

export default function ScreenshotTab({
  screenshot,
  annotations,
  onScreenshotChange,
  onAnnotationsChange,
}: Props) {
  const [zoom, setZoom] = useState(1);
  const [tool, setTool] = useState<Tool>("select");
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [textInput, setTextInput] = useState("");
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Draw annotations on canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    const allAnnotations = currentAnnotation
      ? [...annotations, currentAnnotation]
      : annotations;

    for (const ann of allAnnotations) {
      ctx.strokeStyle = "hsl(0, 72%, 51%)";
      ctx.fillStyle = "hsl(0, 72%, 51%)";
      ctx.lineWidth = 3;
      ctx.font = "16px 'Space Grotesk', sans-serif";

      if (ann.type === "draw" && ann.points && ann.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(ann.points[0].x, ann.points[0].y);
        for (let i = 1; i < ann.points.length; i++) {
          ctx.lineTo(ann.points[i].x, ann.points[i].y);
        }
        ctx.stroke();
      } else if (ann.type === "arrow" && ann.start && ann.end) {
        const dx = ann.end.x - ann.start.x;
        const dy = ann.end.y - ann.start.y;
        const angle = Math.atan2(dy, dx);
        ctx.beginPath();
        ctx.moveTo(ann.start.x, ann.start.y);
        ctx.lineTo(ann.end.x, ann.end.y);
        ctx.stroke();
        // Arrowhead
        const headLen = 15;
        ctx.beginPath();
        ctx.moveTo(ann.end.x, ann.end.y);
        ctx.lineTo(
          ann.end.x - headLen * Math.cos(angle - Math.PI / 6),
          ann.end.y - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          ann.end.x - headLen * Math.cos(angle + Math.PI / 6),
          ann.end.y - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      } else if (ann.type === "text" && ann.text && ann.position) {
        ctx.fillStyle = "hsl(38, 92%, 50%)";
        ctx.fillText(ann.text, ann.position.x, ann.position.y);
      }
    }
  }, [annotations, currentAnnotation]);

  useEffect(() => {
    if (!screenshot) return;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      redraw();
    };
    img.src = screenshot;
  }, [screenshot]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (imgRef.current) redraw();
  }, [annotations, currentAnnotation, redraw]);

  const getCanvasCoords = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (tool === "select" || !screenshot) return;
    const coords = getCanvasCoords(e);
    setIsDrawing(true);

    if (tool === "draw") {
      setCurrentAnnotation({ type: "draw", points: [coords] });
    } else if (tool === "arrow") {
      setCurrentAnnotation({ type: "arrow", start: coords, end: coords });
    } else if (tool === "text") {
      setTextPosition(coords);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !currentAnnotation) return;
    const coords = getCanvasCoords(e);

    if (currentAnnotation.type === "draw") {
      setCurrentAnnotation({
        ...currentAnnotation,
        points: [...(currentAnnotation.points || []), coords],
      });
    } else if (currentAnnotation.type === "arrow") {
      setCurrentAnnotation({ ...currentAnnotation, end: coords });
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentAnnotation) {
      setIsDrawing(false);
      return;
    }
    setIsDrawing(false);
    if (currentAnnotation.type !== "text") {
      onAnnotationsChange([...annotations, currentAnnotation]);
      setCurrentAnnotation(null);
    }
  };

  const addTextAnnotation = () => {
    if (!textInput.trim() || !textPosition) return;
    onAnnotationsChange([
      ...annotations,
      { type: "text", text: textInput, position: textPosition },
    ]);
    setTextInput("");
    setTextPosition(null);
    setCurrentAnnotation(null);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onScreenshotChange(ev.target?.result as string);
      onAnnotationsChange([]);
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const tools: { tool: Tool; icon: typeof MousePointer; label: string }[] = [
    { tool: "select", icon: MousePointer, label: "Select" },
    { tool: "draw", icon: Pencil, label: "Draw" },
    { tool: "arrow", icon: ArrowRight, label: "Arrow" },
    { tool: "text", icon: Type, label: "Text" },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1">
          {screenshot &&
            tools.map((t) => (
              <Button
                key={t.tool}
                variant={tool === t.tool ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setTool(t.tool)}
              >
                <t.icon className="h-3 w-3" />
                {t.label}
              </Button>
            ))}
        </div>
        <div className="flex items-center gap-1">
          {screenshot && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <span className="text-[10px] font-mono text-muted-foreground w-10 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => {
                  onAnnotationsChange([]);
                }}
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Replace className="h-3 w-3" /> Replace
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                onClick={() => {
                  onScreenshotChange(null);
                  onAnnotationsChange([]);
                }}
              >
                <Trash2 className="h-3 w-3" /> Remove
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Text input overlay */}
      {textPosition && (
        <div className="flex gap-1">
          <Input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type label text..."
            className="h-7 text-xs"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && addTextAnnotation()}
          />
          <Button size="sm" className="h-7 text-xs" onClick={addTextAnnotation}>
            Add
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => {
              setTextPosition(null);
              setTextInput("");
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Canvas / Upload area */}
      <div
        ref={containerRef}
        className="rounded-xl border border-border/30 bg-muted/5 overflow-auto"
        style={{ maxHeight: "60vh" }}
      >
        {screenshot ? (
          <div
            className="relative"
            style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
          >
            <canvas
              ref={canvasRef}
              className="max-w-full cursor-crosshair"
              style={{ display: "block" }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>
        ) : (
          <div className="h-[320px] flex flex-col items-center justify-center gap-3">
            <div className="h-16 w-16 rounded-2xl bg-muted/20 flex items-center justify-center">
              <ImagePlus className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground/60">Upload a trade screenshot</p>
              <p className="text-[10px] text-muted-foreground/30 mt-1">
                PNG, JPG up to 10MB · TradingView integration coming soon
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-3.5 w-3.5" />
              Upload Screenshot
            </Button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  );
}

export type { Annotation };
