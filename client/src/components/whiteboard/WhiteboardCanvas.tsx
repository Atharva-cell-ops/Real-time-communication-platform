import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Pencil,
  Eraser,
  Square,
  Circle,
  Minus,
  Trash2,
  Download,
  X,
  Undo2,
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { WhiteboardStroke } from '../../types';
import { Button } from '../common/Button';

export interface WhiteboardCanvasProps {
  meetingId: string;
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = [
  '#ffffff', // White
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#0f172a', // Dark
];

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  meetingId,
  isOpen,
  onClose,
}) => {
  const { socket } = useSocket();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [tool, setTool] = useState<'pen' | 'brush' | 'eraser' | 'line' | 'rectangle' | 'circle'>('pen');
  const [color, setColor] = useState<string>('#6366f1');
  const [size, setSize] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [strokes, setStrokes] = useState<WhiteboardStroke[]>([]);

  const currentStrokeRef = useRef<WhiteboardStroke | null>(null);

  // Redraw all strokes on canvas
  const redrawCanvas = useCallback(
    (strokeList: WhiteboardStroke[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dark background for professional whiteboard experience
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw subtle grid pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 25;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw all recorded strokes
      strokeList.forEach((stroke) => {
        ctx.strokeStyle = stroke.tool === 'eraser' ? '#0b0f19' : stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (stroke.tool === 'brush') {
          ctx.globalAlpha = 0.4;
        } else {
          ctx.globalAlpha = 1.0;
        }

        if (stroke.tool === 'line' && stroke.startPoint && stroke.endPoint) {
          ctx.beginPath();
          ctx.moveTo(stroke.startPoint.x, stroke.startPoint.y);
          ctx.lineTo(stroke.endPoint.x, stroke.endPoint.y);
          ctx.stroke();
        } else if (stroke.tool === 'rectangle' && stroke.startPoint && stroke.endPoint) {
          ctx.beginPath();
          ctx.rect(
            stroke.startPoint.x,
            stroke.startPoint.y,
            stroke.endPoint.x - stroke.startPoint.x,
            stroke.endPoint.y - stroke.startPoint.y
          );
          ctx.stroke();
        } else if (stroke.tool === 'circle' && stroke.startPoint && stroke.endPoint) {
          const radius = Math.hypot(
            stroke.endPoint.x - stroke.startPoint.x,
            stroke.endPoint.y - stroke.startPoint.y
          );
          ctx.beginPath();
          ctx.arc(stroke.startPoint.x, stroke.startPoint.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
        } else if (stroke.points && stroke.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
          }
          ctx.stroke();
        }
      });
      ctx.globalAlpha = 1.0;
    },
    []
  );

  // Resize canvas to container
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    redrawCanvas(strokes);
  }, [redrawCanvas, strokes]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(resizeCanvas, 50);
      window.addEventListener('resize', resizeCanvas);
    }
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isOpen, resizeCanvas]);

  // Request initial whiteboard sync upon opening
  useEffect(() => {
    if (!socket || !isOpen) return;

    socket.emit('whiteboard:request-state', { meetingId });

    const handleSyncState = (data: { strokes: WhiteboardStroke[] }) => {
      setStrokes(data.strokes || []);
      redrawCanvas(data.strokes || []);
    };

    const handleStrokeAdded = (data: { stroke: WhiteboardStroke }) => {
      setStrokes((prev) => {
        const next = [...prev, data.stroke];
        redrawCanvas(next);
        return next;
      });
    };

    const handleCleared = () => {
      setStrokes([]);
      redrawCanvas([]);
    };

    socket.on('whiteboard:sync-state', handleSyncState);
    socket.on('whiteboard:stroke-added', handleStrokeAdded);
    socket.on('whiteboard:cleared', handleCleared);

    return () => {
      socket.off('whiteboard:sync-state', handleSyncState);
      socket.off('whiteboard:stroke-added', handleStrokeAdded);
      socket.off('whiteboard:cleared', handleCleared);
    };
  }, [socket, meetingId, isOpen, redrawCanvas]);

  // Drawing event handlers
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const coords = getCoordinates(e);

    const newStroke: WhiteboardStroke = {
      id: `${Date.now()}-${Math.random()}`,
      tool,
      color: tool === 'eraser' ? '#0b0f19' : color,
      size: tool === 'brush' ? size * 4 : tool === 'eraser' ? size * 6 : size,
      points: [coords],
      startPoint: coords,
      endPoint: coords,
    };

    currentStrokeRef.current = newStroke;
  };

  const handleDrawMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStrokeRef.current) return;
    const coords = getCoordinates(e);

    currentStrokeRef.current.endPoint = coords;
    currentStrokeRef.current.points.push(coords);

    // Live preview of active stroke
    redrawCanvas([...strokes, currentStrokeRef.current]);
  };

  const handleEndDraw = () => {
    if (!isDrawing || !currentStrokeRef.current) return;
    setIsDrawing(false);

    const finishedStroke = currentStrokeRef.current;
    currentStrokeRef.current = null;

    setStrokes((prev) => {
      const next = [...prev, finishedStroke];
      redrawCanvas(next);
      return next;
    });

    // Broadcast stroke to room peers via Socket.io
    socket?.emit('whiteboard:draw-stroke', {
      meetingId,
      stroke: finishedStroke,
    });
  };

  const handleClearBoard = () => {
    if (window.confirm('Are you sure you want to clear the collaborative board for everyone?')) {
      setStrokes([]);
      redrawCanvas([]);
      socket?.emit('whiteboard:clear', { meetingId });
    }
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const nextStrokes = strokes.slice(0, -1);
    setStrokes(nextStrokes);
    redrawCanvas(nextStrokes);
  };

  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `connectx-whiteboard-${meetingId}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="flex-1 h-full flex flex-col bg-dark-950 border border-dark-800 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Top Whiteboard Toolbar */}
      <div className="px-4 py-2.5 bg-dark-900 border-b border-dark-800 flex items-center justify-between gap-3 select-none flex-wrap z-10">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Tool selectors */}
          <button
            onClick={() => setTool('pen')}
            className={`p-2 rounded-xl transition-all ${
              tool === 'pen' ? 'bg-brand-600 text-white' : 'bg-dark-950 text-slate-400 hover:text-white'
            }`}
            title="Pen"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-2 rounded-xl transition-all ${
              tool === 'eraser' ? 'bg-brand-600 text-white' : 'bg-dark-950 text-slate-400 hover:text-white'
            }`}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('line')}
            className={`p-2 rounded-xl transition-all ${
              tool === 'line' ? 'bg-brand-600 text-white' : 'bg-dark-950 text-slate-400 hover:text-white'
            }`}
            title="Line"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('rectangle')}
            className={`p-2 rounded-xl transition-all ${
              tool === 'rectangle' ? 'bg-brand-600 text-white' : 'bg-dark-950 text-slate-400 hover:text-white'
            }`}
            title="Rectangle"
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('circle')}
            className={`p-2 rounded-xl transition-all ${
              tool === 'circle' ? 'bg-brand-600 text-white' : 'bg-dark-950 text-slate-400 hover:text-white'
            }`}
            title="Circle"
          >
            <Circle className="w-4 h-4" />
          </button>
        </div>

        {/* Color Palette */}
        <div className="flex items-center gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              className={`w-5 h-5 rounded-full border-2 transition-transform ${
                color === c ? 'scale-125 border-white shadow-md' : 'border-dark-700 hover:scale-110'
              }`}
            />
          ))}
        </div>

        {/* Stroke Size Slider */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="1"
            max="12"
            value={size}
            onChange={(e) => setSize(parseInt(e.target.value, 10))}
            className="w-16 sm:w-24 accent-brand-500 cursor-pointer"
            title={`Size: ${size}px`}
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleUndo}
            disabled={strokes.length === 0}
            className="p-2 rounded-xl bg-dark-950 text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleClearBoard}
            className="p-2 rounded-xl bg-dark-950 text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Clear Whiteboard"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportPNG}
            className="p-2 rounded-xl bg-dark-950 text-slate-400 hover:text-white transition-colors"
            title="Export PNG"
          >
            <Download className="w-4 h-4" />
          </button>
          <Button variant="ghost" size="icon" onClick={onClose} title="Close Whiteboard">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Canvas Container */}
      <div ref={containerRef} className="flex-1 w-full h-full relative cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={handleStartDraw}
          onMouseMove={handleDrawMove}
          onMouseUp={handleEndDraw}
          onMouseLeave={handleEndDraw}
          onTouchStart={handleStartDraw}
          onTouchMove={handleDrawMove}
          onTouchEnd={handleEndDraw}
          className="absolute inset-0 w-full h-full touch-none"
        />
      </div>
    </div>
  );
};
