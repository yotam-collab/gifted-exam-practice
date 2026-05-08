import React from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RenderShape {
  type:
    | 'circle'
    | 'square'
    | 'triangle'
    | 'diamond'
    | 'star'
    | 'hexagon'
    | 'rectangle'
    | 'arrow'
    | 'plus'
    | 'pacman'             // 3/4-disc, as in real Stage B "cut shape" analogies
    | 'semicircle'         // half disc, flat side down
    | 'square_corner_cut'; // square with top-right corner notched out (L-shape)
  fill: 'none' | 'solid' | 'striped' | 'dotted' | 'half';
  color: string;
  rotation?: number;
  scale?: number;
  border?: 'thin' | 'thick' | 'dashed' | 'none';
  innerShape?: RenderShape;
  /** Optional decorative dots placed on the perimeter (for "count-the-dots" hexagon questions). */
  perimeterDots?: number;
  /** Optional smaller shape attached to a side of this shape — used for composite
   *  "shape-with-bump" figures common on real Stage B (e.g. circle + smaller
   *  circle attached at top). */
  attachedShape?: { shape: RenderShape; side: 'top' | 'bottom' | 'left' | 'right'; relSize?: number };
  /** Optional miniature grid drawn over the shape — used for grid-coloring 3×3
   *  matrices on real Stage B. Cells marked true are filled black. */
  gridFill?: { rows: number; cols: number; cells: boolean[][] };
}

// ---------------------------------------------------------------------------
// Theme — kept centralized so the diagrams have an authentic, exam-paper look
// even when the surrounding app is on a dark theme.
// ---------------------------------------------------------------------------

export const DIAGRAM_THEME = {
  paper: '#fbf8f1',          // warm off-white "paper"
  paperBorder: '#d6c8a3',    // soft tan border around paper
  ink: '#1f2937',            // shape ink (near-black)
  inkSoft: '#475569',        // subtle ink for separators
  rule: '#94a3b8',           // grid/rule lines
  missing: '#d97706',        // orange accent for the "?" cell
  missingBg: 'rgba(245, 158, 11, 0.12)',
  hintEliminated: 'rgba(244, 63, 94, 0.55)',
  optionDefault: '#ffffff',
  optionBorder: '#e5e7eb',
  optionLabel: '#9ca3af',
  optionSelected: '#6366f1',
  optionSelectedBg: '#eef2ff',
} as const;

// ---------------------------------------------------------------------------
// Helpers – pattern definitions (stripes & dots)
// ---------------------------------------------------------------------------

let _patternCounter = 0;

function patternDefs(
  patternType: 'striped' | 'dotted',
  color: string,
): { patternId: string; defs: React.ReactElement } {
  const id = `pat-${patternType}-${color.replace('#', '')}-${_patternCounter++}`;

  if (patternType === 'striped') {
    return {
      patternId: id,
      defs: (
        <pattern
          id={id}
          patternUnits="userSpaceOnUse"
          width="6"
          height="6"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="6" stroke={color} strokeWidth="2" />
        </pattern>
      ),
    };
  }

  // dotted
  return {
    patternId: id,
    defs: (
      <pattern id={id} patternUnits="userSpaceOnUse" width="8" height="8">
        <circle cx="4" cy="4" r="1.5" fill={color} />
      </pattern>
    ),
  };
}

// ---------------------------------------------------------------------------
// Helpers – shape path / element builders
// ---------------------------------------------------------------------------

function regularPolygonPoints(sides: number, radius: number, startAngle = -Math.PI / 2): string {
  return Array.from({ length: sides })
    .map((_, i) => {
      const angle = startAngle + (2 * Math.PI * i) / sides;
      return `${(Math.cos(angle) * radius).toFixed(2)},${(Math.sin(angle) * radius).toFixed(2)}`;
    })
    .join(' ');
}

function starPoints(outerR: number, innerR: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (Math.PI * i) / 5;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push(`${(Math.cos(angle) * r).toFixed(2)},${(Math.sin(angle) * r).toFixed(2)}`);
  }
  return pts.join(' ');
}

function buildShapeElement(
  type: RenderShape['type'],
  size: number,
  fillAttr: string,
  strokeColor: string,
  strokeWidth: number,
  strokeDash: string | undefined,
): React.ReactElement {
  const half = size / 2;
  const common = {
    fill: fillAttr,
    stroke: strokeColor,
    strokeWidth,
    strokeDasharray: strokeDash,
    strokeLinejoin: 'round' as const,
    strokeLinecap: 'round' as const,
  };

  switch (type) {
    case 'circle':
      return <circle cx="0" cy="0" r={half * 0.85} {...common} />;

    case 'square':
      return (
        <rect
          x={-half * 0.8}
          y={-half * 0.8}
          width={half * 1.6}
          height={half * 1.6}
          rx={2}
          {...common}
        />
      );

    case 'rectangle':
      return (
        <rect
          x={-half * 0.95}
          y={-half * 0.55}
          width={half * 1.9}
          height={half * 1.1}
          rx={2}
          {...common}
        />
      );

    case 'triangle':
      return <polygon points={regularPolygonPoints(3, half * 0.9)} {...common} />;

    case 'diamond':
      return (
        <polygon
          points={`0,${-half * 0.9} ${half * 0.65},0 0,${half * 0.9} ${-half * 0.65},0`}
          {...common}
        />
      );

    case 'hexagon':
      return <polygon points={regularPolygonPoints(6, half * 0.85)} {...common} />;

    case 'star':
      return <polygon points={starPoints(half * 0.9, half * 0.4)} {...common} />;

    case 'arrow': {
      // Arrow points UP at rotation=0 — clearer/simpler convention than the
      // previous transform="rotate(180)" workaround (which made angles confusing
      // for analogies and series, and broke directional explanations).
      const pts = [
        `0,${-half * 0.85}`,        // tip (up)
        `${half * 0.55},${-half * 0.1}`,  // right wing
        `${half * 0.22},${-half * 0.1}`,  // right notch
        `${half * 0.22},${half * 0.85}`,  // right base
        `${-half * 0.22},${half * 0.85}`, // left base
        `${-half * 0.22},${-half * 0.1}`, // left notch
        `${-half * 0.55},${-half * 0.1}`, // left wing
      ].join(' ');
      return <polygon points={pts} {...common} />;
    }

    case 'pacman': {
      // 3/4 pie — disc with one quadrant removed (like the classic Pacman).
      // Used in real Stage B "cut-shape" analogies: square-with-corner-cut → circle-with-quarter-cut.
      const r = half * 0.85;
      const path = [
        `M 0 0`,                            // start at center
        `L ${r} 0`,                          // out to right
        `A ${r} ${r} 0 1 1 0 ${-r}`,         // arc 270° clockwise to top
        `L 0 0`,                             // back to center → closes the open mouth
        `Z`,
      ].join(' ');
      return <path d={path} {...common} />;
    }

    case 'semicircle': {
      // Half disc — flat side on the bottom.
      const r = half * 0.85;
      const path = `M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0 Z`;
      return <path d={path} {...common} />;
    }

    case 'square_corner_cut': {
      // Square with the top-right corner removed (an L-shape / step-shape).
      // The cut depth scales with size for visual consistency.
      const s2 = half * 0.8;
      const cut = s2 * 0.6;
      const points = [
        `${-s2},${-s2}`,
        `${s2 - cut},${-s2}`,
        `${s2 - cut},${-s2 + cut}`,
        `${s2},${-s2 + cut}`,
        `${s2},${s2}`,
        `${-s2},${s2}`,
      ].join(' ');
      return <polygon points={points} {...common} />;
    }

    case 'plus': {
      const arm = half * 0.3;
      const ext = half * 0.85;
      const d = [
        `M ${-arm} ${-ext}`,
        `L ${arm} ${-ext}`,
        `L ${arm} ${-arm}`,
        `L ${ext} ${-arm}`,
        `L ${ext} ${arm}`,
        `L ${arm} ${arm}`,
        `L ${arm} ${ext}`,
        `L ${-arm} ${ext}`,
        `L ${-arm} ${arm}`,
        `L ${-ext} ${arm}`,
        `L ${-ext} ${-arm}`,
        `L ${-arm} ${-arm}`,
        `Z`,
      ].join(' ');
      return <path d={d} {...common} />;
    }

    default:
      return <circle cx="0" cy="0" r={half * 0.85} {...common} />;
  }
}

// ---------------------------------------------------------------------------
// Core renderer – produces SVG <g> group for a single shape
// ---------------------------------------------------------------------------

function renderShape(
  shape: RenderShape,
  cx: number,
  cy: number,
  size: number,
): React.ReactElement {
  const color = shape.color || DIAGRAM_THEME.ink;
  const rotation = shape.rotation ?? 0;
  const scale = shape.scale ?? 1;

  let strokeWidth: number;
  let strokeDash: string | undefined;
  switch (shape.border ?? 'thin') {
    case 'none':
      strokeWidth = 0;
      break;
    case 'thick':
      strokeWidth = 3.2;
      break;
    case 'dashed':
      strokeWidth = 1.8;
      strokeDash = '4 3';
      break;
    case 'thin':
    default:
      strokeWidth = 1.8;
      break;
  }

  const strokeColor = color;

  let fillAttr: string;
  let defsElement: React.ReactElement | null = null;
  let clipElement: React.ReactElement | null = null;
  const clipId = `clip-half-${cx}-${cy}-${_patternCounter++}`;

  switch (shape.fill) {
    case 'solid':
      fillAttr = color;
      break;
    case 'striped': {
      const { patternId, defs } = patternDefs('striped', color);
      fillAttr = `url(#${patternId})`;
      defsElement = defs;
      break;
    }
    case 'dotted': {
      const { patternId, defs } = patternDefs('dotted', color);
      fillAttr = `url(#${patternId})`;
      defsElement = defs;
      break;
    }
    case 'half': {
      fillAttr = 'none';
      clipElement = (
        <clipPath id={clipId}>
          <rect x={-size} y={0} width={size * 2} height={size} />
        </clipPath>
      );
      break;
    }
    case 'none':
    default:
      fillAttr = 'none';
      break;
  }

  const transform = [
    `translate(${cx}, ${cy})`,
    rotation ? `rotate(${rotation})` : '',
    scale !== 1 ? `scale(${scale})` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <g transform={transform}>
      {defsElement && <defs>{defsElement}</defs>}
      {clipElement && <defs>{clipElement}</defs>}

      {buildShapeElement(shape.type, size, fillAttr, strokeColor, strokeWidth, strokeDash)}

      {shape.fill === 'half' && (
        <g clipPath={`url(#${clipId})`}>
          {buildShapeElement(shape.type, size, color, strokeColor, strokeWidth, strokeDash)}
        </g>
      )}

      {shape.innerShape && renderShape(shape.innerShape, 0, 0, size * 0.4)}

      {/* Perimeter dots — used for the "count the dots on the hexagon" Stage B
          question family. Dots are placed at evenly-spaced angles around the
          shape's bounding circle. */}
      {shape.perimeterDots != null && shape.perimeterDots > 0 && (() => {
        const n = shape.perimeterDots;
        const r = size * 0.45;
        return Array.from({ length: n }).map((_, i) => {
          const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
          return (
            <circle
              key={i}
              cx={Math.cos(a) * r}
              cy={Math.sin(a) * r}
              r={Math.max(2, size * 0.04)}
              fill="#2563eb"
              stroke="#1e40af"
              strokeWidth={0.8}
            />
          );
        });
      })()}

      {/* Attached smaller shape — used for composite figures like
          "circle + smaller circle attached at top" (real Stage B). */}
      {shape.attachedShape && (() => {
        const att = shape.attachedShape;
        const relSize = att.relSize ?? 0.45;
        const offset = size * 0.55;
        const offMap = {
          top: { x: 0, y: -offset },
          bottom: { x: 0, y: offset },
          left: { x: -offset, y: 0 },
          right: { x: offset, y: 0 },
        };
        const o = offMap[att.side];
        return renderShape(att.shape, o.x, o.y, size * relSize);
      })()}

      {/* Grid fill — small NxM grid superimposed on the shape, with
          some cells filled. Used for grid-coloring matrix questions. */}
      {shape.gridFill && (() => {
        const g = shape.gridFill;
        const cellSize = size * 0.7 / Math.max(g.rows, g.cols);
        const gridW = cellSize * g.cols;
        const gridH = cellSize * g.rows;
        const startX = -gridW / 2;
        const startY = -gridH / 2;
        return (
          <g>
            {Array.from({ length: g.rows }).map((_, r) =>
              Array.from({ length: g.cols }).map((_, c) => (
                <rect
                  key={`${r}-${c}`}
                  x={startX + c * cellSize}
                  y={startY + r * cellSize}
                  width={cellSize}
                  height={cellSize}
                  fill={g.cells[r]?.[c] ? color : 'none'}
                  stroke={color}
                  strokeWidth={0.7}
                />
              ))
            )}
          </g>
        );
      })()}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Component: DiagramPaper — wraps any diagram in a clean exam-paper card.
// Authentic to the printed Stage B booklet look.
// ---------------------------------------------------------------------------

export function DiagramPaper({
  children,
  padding = 16,
  inline = false,
}: {
  children: React.ReactNode;
  padding?: number;
  inline?: boolean;
}): React.ReactElement {
  return (
    <div
      className="diagram-pop"
      style={{
        background: DIAGRAM_THEME.paper,
        border: `1.5px solid ${DIAGRAM_THEME.paperBorder}`,
        borderRadius: 14,
        padding,
        display: inline ? 'inline-flex' : 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.5)',
        maxWidth: '100%',
        overflowX: 'auto',
      }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component: ShapeBox – a single shape in an SVG box
// ---------------------------------------------------------------------------

export function ShapeBox({
  shape,
  size = 60,
  bare = false,
}: {
  shape: RenderShape;
  size?: number;
  /** When true, omit the box frame (used inside DiagramPaper which already provides one). */
  bare?: boolean;
}): React.ReactElement {
  const padding = bare ? 2 : 6;
  const totalSize = size + padding * 2;

  return (
    <svg
      width={totalSize}
      height={totalSize}
      viewBox={`0 0 ${totalSize} ${totalSize}`}
      style={{
        borderRadius: bare ? 0 : 10,
        background: bare ? 'transparent' : DIAGRAM_THEME.paper,
        border: bare ? 'none' : `1.5px solid ${DIAGRAM_THEME.paperBorder}`,
        display: 'inline-block',
        flexShrink: 0,
      }}
    >
      {renderShape(shape, totalSize / 2, totalSize / 2, size)}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component: ShapeAnalogy – [A] : [B] = [C] : [?]
// ---------------------------------------------------------------------------

export function ShapeAnalogy({
  shapes,
  questionMark = true,
}: {
  shapes: RenderShape[];
  questionMark?: boolean;
}): React.ReactElement {
  const [shapeA, shapeB, shapeC, shapeD] = shapes;
  const boxSize = 68;

  const separatorStyle: React.CSSProperties = {
    fontSize: 28,
    fontWeight: 700,
    color: DIAGRAM_THEME.inkSoft,
    display: 'flex',
    alignItems: 'center',
    padding: '0 6px',
    userSelect: 'none',
  };

  const questionBoxStyle: React.CSSProperties = {
    width: boxSize + 8,
    height: boxSize + 8,
    borderRadius: 10,
    background: DIAGRAM_THEME.missingBg,
    border: `2px dashed ${DIAGRAM_THEME.missing}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 30,
    fontWeight: 700,
    color: DIAGRAM_THEME.missing,
    flexShrink: 0,
  };

  return (
    <DiagramPaper inline>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          direction: 'ltr',
          flexWrap: 'wrap',
        }}
      >
        {shapeA && <ShapeBox shape={shapeA} size={boxSize} bare />}
        <span style={separatorStyle}>:</span>
        {shapeB && <ShapeBox shape={shapeB} size={boxSize} bare />}
        <span style={separatorStyle}>=</span>
        {shapeC && <ShapeBox shape={shapeC} size={boxSize} bare />}
        <span style={separatorStyle}>:</span>

        {shapeD && !questionMark ? (
          <ShapeBox shape={shapeD} size={boxSize} bare />
        ) : (
          <div style={questionBoxStyle}>?</div>
        )}
      </div>
    </DiagramPaper>
  );
}

// ---------------------------------------------------------------------------
// Component: ShapeSeries – a row of shapes with [?] at the end
// ---------------------------------------------------------------------------

export function ShapeSeries({
  shapes,
}: {
  shapes: RenderShape[];
}): React.ReactElement {
  const boxSize = 60;

  const questionBoxStyle: React.CSSProperties = {
    width: boxSize + 8,
    height: boxSize + 8,
    borderRadius: 10,
    background: DIAGRAM_THEME.missingBg,
    border: `2px dashed ${DIAGRAM_THEME.missing}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    fontWeight: 700,
    color: DIAGRAM_THEME.missing,
    flexShrink: 0,
  };

  return (
    <DiagramPaper inline>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          direction: 'ltr',
          flexWrap: 'wrap',
        }}
      >
        {shapes.map((shape, i) => (
          <React.Fragment key={i}>
            <ShapeBox shape={shape} size={boxSize} bare />
            <span
              style={{
                fontSize: 18,
                color: DIAGRAM_THEME.rule,
                userSelect: 'none',
                padding: '0 2px',
              }}
            >
              {'➜'}
            </span>
          </React.Fragment>
        ))}
        <div style={questionBoxStyle}>?</div>
      </div>
    </DiagramPaper>
  );
}

// ---------------------------------------------------------------------------
// Component: ShapeOptions – 2x2 grid of selectable answer options
// ---------------------------------------------------------------------------

export function ShapeOptions({
  options,
  selected,
  onSelect,
  disabled = false,
  eliminated = [],
}: {
  options: RenderShape[][];
  selected?: number;
  onSelect: (index: number) => void;
  disabled?: boolean;
  /** Indices the child has eliminated using the hint/strike-out feature. */
  eliminated?: number[];
}): React.ReactElement {
  const labels = ['א', 'ב', 'ג', 'ד'];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
        maxWidth: 360,
        margin: '0 auto',
      }}
    >
      {options.map((optionShapes, idx) => {
        const isSelected = selected === idx;
        const isEliminated = eliminated.includes(idx);

        return (
          <button
            key={idx}
            onClick={() => !disabled && !isEliminated && onSelect(idx)}
            disabled={disabled || isEliminated}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: 10,
              borderRadius: 14,
              border: isSelected
                ? `2.5px solid ${DIAGRAM_THEME.optionSelected}`
                : `2px solid ${DIAGRAM_THEME.optionBorder}`,
              background: isSelected
                ? DIAGRAM_THEME.optionSelectedBg
                : DIAGRAM_THEME.optionDefault,
              boxShadow: isSelected
                ? '0 0 0 3px rgba(99,102,241,0.18)'
                : '0 1px 3px rgba(0,0,0,0.06)',
              cursor: disabled || isEliminated ? 'default' : 'pointer',
              opacity: isEliminated ? 0.35 : disabled && !isSelected ? 0.55 : 1,
              transition: 'all 0.15s ease',
              outline: 'none',
              minHeight: 96,
              position: 'relative',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                direction: 'ltr',
              }}
            >
              {optionShapes.map((s, sIdx) => (
                <ShapeBox key={sIdx} shape={s} size={46} />
              ))}
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: isSelected ? '#4338ca' : DIAGRAM_THEME.optionLabel,
                marginTop: 2,
              }}
            >
              {labels[idx] ?? idx + 1}
            </span>
            {isEliminated && (
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 56,
                  color: DIAGRAM_THEME.hintEliminated,
                  fontWeight: 900,
                  pointerEvents: 'none',
                  lineHeight: 1,
                }}
              >
                ✕
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component: ShapeGrid – NxM grid of shapes with one missing cell (?)
// ---------------------------------------------------------------------------

export function ShapeGrid({
  cells,
}: {
  cells: (RenderShape | null)[][];
}): React.ReactElement {
  const cols = cells[0]?.length || 0;
  const cellSize = cols >= 3 ? 52 : 60;

  const questionBoxStyle: React.CSSProperties = {
    width: cellSize + 8,
    height: cellSize + 8,
    borderRadius: 8,
    background: DIAGRAM_THEME.missingBg,
    border: `2px dashed ${DIAGRAM_THEME.missing}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    fontWeight: 700,
    color: DIAGRAM_THEME.missing,
  };

  return (
    <DiagramPaper inline padding={12}>
      <div
        style={{
          display: 'inline-grid',
          gridTemplateColumns: `repeat(${cols}, auto)`,
          gap: 8,
          direction: 'ltr',
        }}
      >
        {cells.flat().map((cell, i) =>
          cell ? (
            <ShapeBox key={i} shape={cell} size={cellSize} />
          ) : (
            <div key={i} style={questionBoxStyle}>?</div>
          )
        )}
      </div>
    </DiagramPaper>
  );
}

// ---------------------------------------------------------------------------
// Component: ShapeRow – horizontal row of shapes (for before/after)
// ---------------------------------------------------------------------------

export function ShapeRow({
  shapes,
  separator = '→',
}: {
  shapes: RenderShape[];
  separator?: string;
}): React.ReactElement {
  return (
    <DiagramPaper inline>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          direction: 'ltr',
          flexWrap: 'wrap',
        }}
      >
        {shapes.map((shape, i) => (
          <React.Fragment key={i}>
            <ShapeBox shape={shape} size={64} bare />
            {i < shapes.length - 1 && (
              <span style={{ fontSize: 26, color: DIAGRAM_THEME.inkSoft, userSelect: 'none' }}>
                {separator}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    </DiagramPaper>
  );
}

// ---------------------------------------------------------------------------
// Component: ShapeOddOneOut – 4 labeled shapes in a row
// ---------------------------------------------------------------------------

export function ShapeOddOneOut({
  shapes,
}: {
  shapes: RenderShape[];
}): React.ReactElement {
  const labels = ['א', 'ב', 'ג', 'ד'];

  return (
    <DiagramPaper inline>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          direction: 'ltr',
          flexWrap: 'wrap',
        }}
      >
        {shapes.map((shape, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <ShapeBox shape={shape} size={62} bare />
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: DIAGRAM_THEME.inkSoft,
              }}
            >
              {labels[i]}
            </span>
          </div>
        ))}
      </div>
    </DiagramPaper>
  );
}

// ===========================================================================
// NUMBERS IN SHAPES COMPONENTS
// All on white "paper" with ink-black numbers and a clean Y-shape divider.
// ===========================================================================

// ---------------------------------------------------------------------------
// Component: DividedCircle – circle divided into 3 or 4 segments with numbers
// ---------------------------------------------------------------------------

export function DividedCircle({
  values,
  missingIndex,
  size = 130,
}: {
  values: (number | string)[];
  missingIndex?: number;
  size?: number;
}): React.ReactElement {
  const r = size / 2 - 6;
  const cx = size / 2;
  const cy = size / 2;
  const fontSize = size * 0.2;

  const renderText = (val: number | string, x: number, y: number, i: number) => {
    const isMissing = i === missingIndex;
    return (
      <text
        key={i}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        fontWeight="bold"
        fill={isMissing ? DIAGRAM_THEME.missing : DIAGRAM_THEME.ink}
      >
        {isMissing ? '?' : val}
      </text>
    );
  };

  if (values.length === 3) {
    // Y-shape divider with trunk going DOWN — produces three equal 120° wedges:
    // a single TOP wedge (where "18"-style large value lives) and two BOTTOM
    // wedges (left + right). Lines emanate from center at angles 30°, 150°, 270°.
    // Each text position sits in the center of its 120° wedge so labels never
    // overlap a divider line.
    const cos30 = Math.cos(Math.PI / 6); // 0.866
    const sin30 = Math.sin(Math.PI / 6); // 0.5

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill={DIAGRAM_THEME.paper} stroke={DIAGRAM_THEME.ink} strokeWidth="2.4" />
        {/* Trunk — straight down */}
        <line x1={cx} y1={cy} x2={cx} y2={cy + r} stroke={DIAGRAM_THEME.ink} strokeWidth="1.8" />
        {/* Upper-right diagonal */}
        <line x1={cx} y1={cy} x2={cx + r * cos30} y2={cy - r * sin30} stroke={DIAGRAM_THEME.ink} strokeWidth="1.8" />
        {/* Upper-left diagonal */}
        <line x1={cx} y1={cy} x2={cx - r * cos30} y2={cy - r * sin30} stroke={DIAGRAM_THEME.ink} strokeWidth="1.8" />
        {/* Text positions, one per wedge — centred at radius 0.5r from center */}
        {/* Top wedge center: straight up */}
        {renderText(values[0], cx, cy - r * 0.5, 0)}
        {/* Bottom-left wedge center: angle 210° → (cos210°, -sin210°) = (-0.866, +0.5) scaled by 0.5r */}
        {renderText(values[1], cx - r * 0.43, cy + r * 0.25, 1)}
        {/* Bottom-right wedge center: angle 330° → (cos330°, -sin330°) = (+0.866, +0.5) scaled by 0.5r */}
        {renderText(values[2], cx + r * 0.43, cy + r * 0.25, 2)}
      </svg>
    );
  }

  // 4-part: top, right, bottom, left (cross dividers)
  const textPositions4 = [
    { x: cx, y: cy - r * 0.5 },
    { x: cx + r * 0.5, y: cy },
    { x: cx, y: cy + r * 0.5 },
    { x: cx - r * 0.5, y: cy },
  ];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill={DIAGRAM_THEME.paper} stroke={DIAGRAM_THEME.ink} strokeWidth="2.4" />
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke={DIAGRAM_THEME.ink} strokeWidth="1.8" />
      <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke={DIAGRAM_THEME.ink} strokeWidth="1.8" />
      {values.map((val, i) => renderText(val, textPositions4[i].x, textPositions4[i].y, i))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component: DividedCirclePair – two divided circles side by side (exam style)
// ---------------------------------------------------------------------------

export function DividedCirclePair({
  circle1,
  circle2,
  missingCircle,
  missingIndex,
  size = 130,
}: {
  circle1: (number | string)[];
  circle2: (number | string)[];
  missingCircle: 1 | 2;
  missingIndex: number;
  size?: number;
}): React.ReactElement {
  return (
    <DiagramPaper>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, direction: 'ltr', flexWrap: 'wrap' }}>
        <DividedCircle
          values={circle1}
          missingIndex={missingCircle === 1 ? missingIndex : undefined}
          size={size}
        />
        <DividedCircle
          values={circle2}
          missingIndex={missingCircle === 2 ? missingIndex : undefined}
          size={size}
        />
      </div>
    </DiagramPaper>
  );
}

// ---------------------------------------------------------------------------
// Component: NumberPyramid – pyramid of numbers (each = sum of two below)
// ---------------------------------------------------------------------------

export function NumberPyramid({
  rows,
  missingRow,
  missingCol,
}: {
  rows: (number | string)[][];
  missingRow: number;
  missingCol: number;
}): React.ReactElement {
  const cellSize = 50;
  const gap = 6;

  return (
    <DiagramPaper>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap, direction: 'ltr' }}>
        {rows.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap, justifyContent: 'center' }}>
            {row.map((val, ci) => {
              const isMissing = ri === missingRow && ci === missingCol;
              return (
                <div
                  key={ci}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: isMissing
                      ? `2px dashed ${DIAGRAM_THEME.missing}`
                      : `2px solid ${DIAGRAM_THEME.ink}`,
                    borderRadius: 8,
                    background: isMissing ? DIAGRAM_THEME.missingBg : '#ffffff',
                    fontSize: 20,
                    fontWeight: 700,
                    color: isMissing ? DIAGRAM_THEME.missing : DIAGRAM_THEME.ink,
                  }}
                >
                  {isMissing ? '?' : val}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </DiagramPaper>
  );
}

// ---------------------------------------------------------------------------
// Component: NumberGrid – table/grid of numbers with a missing cell
// ---------------------------------------------------------------------------

export function NumberGrid({
  rows,
  missingRow,
  missingCol,
}: {
  rows: (number | string)[][];
  missingRow: number;
  missingCol: number;
}): React.ReactElement {
  const cellSize = 50;

  return (
    <DiagramPaper padding={12}>
      <div
        style={{
          display: 'inline-grid',
          gridTemplateColumns: `repeat(${rows[0]?.length || 0}, ${cellSize}px)`,
          gap: 4,
          padding: 4,
          background: DIAGRAM_THEME.ink,
          borderRadius: 8,
          direction: 'ltr',
        }}
      >
        {rows.flatMap((row, ri) =>
          row.map((val, ci) => {
            const isMissing = ri === missingRow && ci === missingCol;
            return (
              <div
                key={`${ri}-${ci}`}
                style={{
                  width: cellSize,
                  height: cellSize,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isMissing ? DIAGRAM_THEME.missingBg : '#ffffff',
                  fontSize: 19,
                  fontWeight: 700,
                  color: isMissing ? DIAGRAM_THEME.missing : DIAGRAM_THEME.ink,
                  borderRadius: 4,
                }}
              >
                {isMissing ? '?' : val}
              </div>
            );
          })
        )}
      </div>
    </DiagramPaper>
  );
}

// ---------------------------------------------------------------------------
// Component: NumberFlowChart – flow chart with operations between nodes
// ---------------------------------------------------------------------------

export function NumberFlowChart({
  nodes,
  operations,
  missingIndex,
}: {
  nodes: (number | string)[];
  operations: string[];
  missingIndex: number;
}): React.ReactElement {
  const nodeSize = 52;

  return (
    <DiagramPaper>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, direction: 'ltr', flexWrap: 'wrap' }}>
        {nodes.map((val, i) => (
          <React.Fragment key={i}>
            <div
              style={{
                width: nodeSize,
                height: nodeSize,
                borderRadius: '50%',
                border: i === missingIndex
                  ? `2px dashed ${DIAGRAM_THEME.missing}`
                  : `2px solid ${DIAGRAM_THEME.ink}`,
                background: i === missingIndex ? DIAGRAM_THEME.missingBg : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 700,
                color: i === missingIndex ? DIAGRAM_THEME.missing : DIAGRAM_THEME.ink,
              }}
            >
              {i === missingIndex ? '?' : val}
            </div>
            {i < operations.length && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: 18, color: DIAGRAM_THEME.inkSoft }}>{'→'}</span>
                <span style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#7c3aed',
                  background: 'rgba(167, 139, 250, 0.15)',
                  padding: '2px 7px',
                  borderRadius: 6,
                  border: '1px solid rgba(124, 58, 237, 0.25)',
                }}>
                  {operations[i]}
                </span>
                <span style={{ fontSize: 18, color: DIAGRAM_THEME.inkSoft }}>{'→'}</span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </DiagramPaper>
  );
}

// ---------------------------------------------------------------------------
// Component: ArrowChain – boxes connected by 1+ arrows, where the number of
// arrows encodes the strength/repetition of an operation (e.g. one arrow
// subtracts 1, two arrows subtract 2). Used in real Stage B.
// ---------------------------------------------------------------------------

export function ArrowChain({
  steps,
  missingIndex,
}: {
  steps: { value: number | string; arrowsToNext?: number }[];
  missingIndex: number;
}): React.ReactElement {
  const boxW = 56;
  const boxH = 64;
  return (
    <DiagramPaper>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, direction: 'ltr', flexWrap: 'wrap' }}>
        {steps.map((step, i) => (
          <React.Fragment key={i}>
            <div
              style={{
                width: boxW,
                height: boxH,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: i === missingIndex ? `2px dashed ${DIAGRAM_THEME.missing}` : `2px solid ${DIAGRAM_THEME.ink}`,
                background: i === missingIndex ? DIAGRAM_THEME.missingBg : '#ffffff',
                borderRadius: 6,
                fontSize: 22,
                fontWeight: 700,
                color: i === missingIndex ? DIAGRAM_THEME.missing : DIAGRAM_THEME.ink,
              }}
            >
              {i === missingIndex ? '?' : step.value}
            </div>
            {step.arrowsToNext != null && step.arrowsToNext > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                {Array.from({ length: step.arrowsToNext }).map((_, k) => (
                  <span key={k} style={{ fontSize: 22, color: DIAGRAM_THEME.ink, lineHeight: 0.8, fontWeight: 700 }}>
                    {'➜'}
                  </span>
                ))}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </DiagramPaper>
  );
}

// ---------------------------------------------------------------------------
// Component: BidirectionalFlow – two parallel rows: A → [op] → B, then
// A2 → [op2] → ?. Real Stage B uses this for "the box transforms the input"
// puzzles.
// ---------------------------------------------------------------------------

export function BidirectionalFlow({
  rows,
  missing, // [rowIndex, side: 'left'|'right']
}: {
  rows: { left: number | string; box: number | string; right: number | string }[];
  missing: { row: number; side: 'left' | 'right' | 'box' };
}): React.ReactElement {
  const cellSize = 52;
  const renderCell = (val: number | string, isMissing: boolean, square = false) => (
    <div
      style={{
        width: cellSize,
        height: cellSize,
        borderRadius: square ? 6 : '50%',
        border: isMissing
          ? `2px dashed ${DIAGRAM_THEME.missing}`
          : `2px solid ${DIAGRAM_THEME.ink}`,
        background: isMissing ? DIAGRAM_THEME.missingBg : '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        fontWeight: 700,
        color: isMissing ? DIAGRAM_THEME.missing : DIAGRAM_THEME.ink,
      }}
    >
      {isMissing ? '?' : val}
    </div>
  );
  const arrowChar = '←';

  return (
    <DiagramPaper>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, direction: 'ltr' }}>
        {rows.map((row, ri) => {
          const isMissingLeft = missing.row === ri && missing.side === 'left';
          const isMissingBox = missing.row === ri && missing.side === 'box';
          const isMissingRight = missing.row === ri && missing.side === 'right';
          return (
            <div key={ri} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              {renderCell(row.left, isMissingLeft, false)}
              <span style={{ fontSize: 22, color: DIAGRAM_THEME.ink, fontWeight: 800 }}>{arrowChar}</span>
              {renderCell(row.box, isMissingBox, true)}
              <span style={{ fontSize: 22, color: DIAGRAM_THEME.ink, fontWeight: 800 }}>{arrowChar}</span>
              {renderCell(row.right, isMissingRight, false)}
            </div>
          );
        })}
      </div>
    </DiagramPaper>
  );
}

// ---------------------------------------------------------------------------
// Component: NumberTriangle – triangle with numbers at vertices and center
// ---------------------------------------------------------------------------

export function NumberTriangle({
  top,
  bottomLeft,
  bottomRight,
  center,
  missingPosition,
  hideCenter = false,
}: {
  top: number | string;
  bottomLeft: number | string;
  bottomRight: number | string;
  center?: number | string;
  missingPosition: 'top' | 'bottomLeft' | 'bottomRight' | 'center';
  /** When true, suppress the center label entirely (used for triangles where center is decorative). */
  hideCenter?: boolean;
}): React.ReactElement {
  const w = 170;
  const h = 150;

  const positions = {
    top: { x: w / 2, y: 22 },
    center: { x: w / 2, y: h * 0.5 },
    bottomLeft: { x: 28, y: h - 18 },
    bottomRight: { x: w - 28, y: h - 18 },
  };

  const vals: Record<string, number | string | undefined> = { top, bottomLeft, bottomRight, center };

  const positionsToRender = (Object.keys(positions) as Array<keyof typeof positions>).filter(
    (k) => !(k === 'center' && hideCenter && missingPosition !== 'center'),
  );

  return (
    <DiagramPaper>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <polygon
          points={`${w / 2},10 10,${h - 10} ${w - 10},${h - 10}`}
          fill={DIAGRAM_THEME.paper}
          stroke={DIAGRAM_THEME.ink}
          strokeWidth="2.4"
        />
        {positionsToRender.map((key) => {
          const pos = positions[key];
          const isMissing = key === missingPosition;
          const value = vals[key];
          if (value === undefined) return null;
          return (
            <text
              key={key}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={20}
              fontWeight="bold"
              fontStyle={key === 'center' ? 'italic' : 'normal'}
              fill={isMissing ? DIAGRAM_THEME.missing : DIAGRAM_THEME.ink}
            >
              {isMissing ? '?' : value}
            </text>
          );
        })}
      </svg>
    </DiagramPaper>
  );
}
