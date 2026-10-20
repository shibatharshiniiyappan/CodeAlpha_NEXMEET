import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import {
  Pen,
  Eraser,
  Minus,
  Square,
  Circle,
  Type,
  RotateCcw,
  Trash2,
  Download,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { WhiteboardStroke, User } from '../types';

interface WhiteboardProps {
  roomId: string;
  currentUser: User;
  socket: Socket | null;
  onClose: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const PALETTE = [
  { name: 'Cyan', hex: '#22D3EE' },
  { name: 'Violet', hex: '#A855F7' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Rose', hex: '#F43F5E' },
];

const BRUSH_SIZES = [
  { label: 'Fine', size: 2 },
  { label: 'Medium', size: 4 },
  { label: 'Bold', size: 8 },
  { label: 'Thick', size: 16 },
];

export const Whiteboard: React.FC<WhiteboardProps> = ({
  roomId,
  currentUser,
  socket,
  onClose,
  isExpanded,
  onToggleExpand,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [activeTool, setActiveTool] = useState<'freehand' | 'line' | 'rect' | 'circle' | 'text' | 'eraser'>('freehand');
  const [selectedColor, setSelectedColor] = useState<string>('#22D3EE');
  const [brushWidth, setBrushWidth] = useState<number>(4);
  const [textInput, setTextInput] = useState<string>('');
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);

  // In-memory list of strokes to redraw on canvas resize
  const strokesRef = useRef<WhiteboardStroke[]>([]);
  const isDrawingRef = useRef<boolean>(false);
  const currentPointsRef = useRef<{ x: number; y: number }[]>([]);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Render a single stroke
  const drawStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: WhiteboardStroke) => {
    ctx.save();
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.type === 'eraser') {
      ctx.strokeStyle = '#0B1120'; // background canvas color
      ctx.lineWidth = stroke.width * 2.5;
    } else {
      ctx.strokeStyle = stroke.color;
      ctx.fillStyle = stroke.color;
    }

    if (stroke.type === 'freehand' || stroke.type === 'eraser') {
      if (!stroke.points || stroke.points.length < 2) {
        ctx.restore();
        return;
      }
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    } else if (stroke.type === 'line') {
      if (stroke.startX !== undefined && stroke.startY !== undefined && stroke.endX !== undefined && stroke.endY !== undefined) {
        ctx.beginPath();
        ctx.moveTo(stroke.startX, stroke.startY);
        ctx.lineTo(stroke.endX, stroke.endY);
        ctx.stroke();
      }
    } else if (stroke.type === 'rect') {
      if (stroke.startX !== undefined && stroke.startY !== undefined && stroke.endX !== undefined && stroke.endY !== undefined) {
        const w = stroke.endX - stroke.startX;
        const h = stroke.endY - stroke.startY;
        ctx.beginPath();
        ctx.strokeRect(stroke.startX, stroke.startY, w, h);
      }
    } else if (stroke.type === 'circle') {
      if (stroke.startX !== undefined && stroke.startY !== undefined && stroke.endX !== undefined && stroke.endY !== undefined) {
        const radius = Math.hypot(stroke.endX - stroke.startX, stroke.endY - stroke.startY);
        ctx.beginPath();
        ctx.arc(stroke.startX, stroke.startY, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    } else if (stroke.type === 'text') {
      if (stroke.startX !== undefined && stroke.startY !== undefined && stroke.text) {
        ctx.font = `${Math.max(16, stroke.width * 4)}px 'Plus Jakarta Sans', sans-serif`;
        ctx.fillText(stroke.text, stroke.startX, stroke.startY);
      }
    }

    ctx.restore();
  }, []);

  // Redraw all strokes from memory
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0B1120';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokesRef.current) {
      drawStroke(ctx, stroke);
    }
  }, [drawStroke]);

  // Handle canvas sizing and DPI scaling
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      redrawCanvas();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redrawCanvas]);

  // Socket event listeners for real-time collaboration
  useEffect(() => {
    if (!socket) return;

    const handleInit = (existingStrokes: WhiteboardStroke[]) => {
      strokesRef.current = existingStrokes;
      redrawCanvas();
    };

    const handleRemoteDraw = (stroke: WhiteboardStroke) => {
      strokesRef.current.push(stroke);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawStroke(ctx, stroke);
      }
    };

    const handleCleared = () => {
      strokesRef.current = [];
      redrawCanvas();
    };

    socket.on('whiteboard:init', handleInit);
    socket.on('whiteboard:draw', handleRemoteDraw);
    socket.on('whiteboard:cleared', handleCleared);

    return () => {
      socket.off('whiteboard:init', handleInit);
      socket.off('whiteboard:draw', handleRemoteDraw);
      socket.off('whiteboard:cleared', handleCleared);
    };
  }, [socket, redrawCanvas, drawStroke]);

  // Pointer event coordinate extraction
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Start Drawing
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getCoordinates(e);

    if (activeTool === 'text') {
      setTextPos({ x, y });
      return;
    }

    isDrawingRef.current = true;
    startPosRef.current = { x, y };

    if (activeTool === 'freehand' || activeTool === 'eraser') {
      currentPointsRef.current = [{ x, y }];
    }
  };

  // Drawing in progress
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const { x, y } = getCoordinates(e);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (activeTool === 'freehand' || activeTool === 'eraser') {
      currentPointsRef.current.push({ x, y });

      // Immediate local render of new segment
      const pts = currentPointsRef.current;
      if (pts.length >= 2) {
        ctx.save();
        ctx.lineWidth = activeTool === 'eraser' ? brushWidth * 2.5 : brushWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = activeTool === 'eraser' ? '#0B1120' : selectedColor;
        ctx.beginPath();
        ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.stroke();
        ctx.restore();
      }
    } else {
      // Shape preview (redraw previous strokes + current shape preview)
      redrawCanvas();
      drawStroke(ctx, {
        id: 'preview',
        type: activeTool,
        startX: startPosRef.current.x,
        startY: startPosRef.current.y,
        endX: x,
        endY: y,
        color: selectedColor,
        width: brushWidth,
        userId: currentUser.id,
        timestamp: Date.now(),
      });
    }
  };

  // Finish Drawing and Emit
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const { x, y } = getCoordinates(e);

    let newStroke: WhiteboardStroke | null = null;

    if (activeTool === 'freehand' || activeTool === 'eraser') {
      if (currentPointsRef.current.length > 1) {
        newStroke = {
          id: `stroke-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          type: activeTool,
          points: [...currentPointsRef.current],
          color: selectedColor,
          width: brushWidth,
          userId: currentUser.id,
          timestamp: Date.now(),
        };
      }
      currentPointsRef.current = [];
    } else if (activeTool === 'line' || activeTool === 'rect' || activeTool === 'circle') {
      newStroke = {
        id: `stroke-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        type: activeTool,
        startX: startPosRef.current.x,
        startY: startPosRef.current.y,
        endX: x,
        endY: y,
        color: selectedColor,
        width: brushWidth,
        userId: currentUser.id,
        timestamp: Date.now(),
      };
    }

    if (newStroke) {
      strokesRef.current.push(newStroke);
      redrawCanvas();
      if (socket) {
        socket.emit('whiteboard:draw', newStroke);
      }
    }
  };

  // Submit Text Annotation
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !textPos) return;

    const stroke: WhiteboardStroke = {
      id: `stroke-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type: 'text',
      startX: textPos.x,
      startY: textPos.y,
      color: selectedColor,
      width: brushWidth,
      text: textInput.trim(),
      userId: currentUser.id,
      timestamp: Date.now(),
    };

    strokesRef.current.push(stroke);
    redrawCanvas();
    if (socket) {
      socket.emit('whiteboard:draw', stroke);
    }

    setTextInput('');
    setTextPos(null);
  };

  // Undo Stroke
  const handleUndo = () => {
    if (socket) {
      socket.emit('whiteboard:undo');
    }
  };

  // Clear Whiteboard
  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the collaborative whiteboard for all participants?')) {
      if (socket) {
        socket.emit('whiteboard:clear');
      }
    }
  };

  // Export board as PNG
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexmeet-whiteboard-${roomId}.png`;
    a.click();
  };

  return (
    <div className="relative flex flex-col h-full bg-[#0B1120] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#111827] border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Tool Selector */}
          <div className="flex items-center bg-slate-900/90 rounded-lg p-1 border border-slate-800">
            <button
              onClick={() => setActiveTool('freehand')}
              className={`p-1.5 rounded transition-colors ${
                activeTool === 'freehand' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
              title="Freehand Pen"
            >
              <Pen className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTool('line')}
              className={`p-1.5 rounded transition-colors ${
                activeTool === 'line' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
              title="Straight Line"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTool('rect')}
              className={`p-1.5 rounded transition-colors ${
                activeTool === 'rect' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
              title="Rectangle"
            >
              <Square className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTool('circle')}
              className={`p-1.5 rounded transition-colors ${
                activeTool === 'circle' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
              title="Circle / Ellipse"
            >
              <Circle className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTool('text')}
              className={`p-1.5 rounded transition-colors ${
                activeTool === 'text' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
              title="Add Text"
            >
              <Type className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTool('eraser')}
              className={`p-1.5 rounded transition-colors ${
                activeTool === 'eraser' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
              title="Eraser"
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>

          {/* Color Palette */}
          {activeTool !== 'eraser' && (
            <div className="flex items-center gap-1 bg-slate-900/90 rounded-lg p-1 border border-slate-800 px-2">
              {PALETTE.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setSelectedColor(c.hex)}
                  className={`w-5 h-5 rounded-full border transition-transform ${
                    selectedColor === c.hex ? 'scale-110 border-white ring-2 ring-cyan-400/50' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          )}

          {/* Brush Sizes */}
          <div className="flex items-center gap-1 bg-slate-900/90 rounded-lg p-1 border border-slate-800">
            {BRUSH_SIZES.map((b) => (
              <button
                key={b.size}
                onClick={() => setBrushWidth(b.size)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  brushWidth === b.size ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Undo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleClear}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
            title="Clear Board"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Export as PNG"
          >
            <Download className="w-4 h-4" />
          </button>
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title={isExpanded ? 'Restore Size' : 'Expand Fullscreen'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors ml-1"
            title="Close Whiteboard"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div ref={containerRef} className="relative flex-1 w-full h-full cursor-crosshair overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="absolute inset-0 block w-full h-full"
        />

        {/* Text Tool Floating Prompt */}
        {textPos && (
          <form
            onSubmit={handleTextSubmit}
            className="absolute z-10 bg-slate-900 border border-cyan-500/50 rounded-lg p-2 shadow-xl flex items-center gap-2"
            style={{ left: Math.min(textPos.x, window.innerWidth - 300), top: Math.min(textPos.y, window.innerHeight - 80) }}
          >
            <input
              type="text"
              autoFocus
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type note and hit Enter..."
              className="bg-slate-800 text-sm text-white px-3 py-1.5 rounded border border-slate-700 focus:outline-none focus:border-cyan-400 w-52"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs bg-cyan-500 text-slate-950 font-semibold rounded hover:bg-cyan-400"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setTextPos(null)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
