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
    | 'plus';
  fill: 'none' | 'solid' | 'striped' | 'dotted' | 'half';
  color: string;
  rotation?: number;
  scale?: number;
  border?: 'thin' | 'thick' | 'dashed' | 'none';
  innerShape?: RenderShape;
}

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

/** Generate points for a regular polygon centered at (0,0) with given radius. */
function regularPolygonPoints(sides: number, radius: number, startAngle = -Math.PI / 2): string {
  return Array.from({ length: sides })
    .map((_, i) => {
      const angle = startAngle + (2 * Math.PI * i) / sides;
      return `${(Math.cos(angle) * radius).toFixed(2)},${(Math.sin(angle) * radius).toFixed(2)}`;
    })
    .join(' ');
}

/** Generate 5-pointed star centered at (0,0). */
function starPoints(outerR: number, innerR: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (Math.PI * i) / 5;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push(`${(Math.cos(angle) * r).toFixed(2)},${(Math.sin(angle) * r).toFixed(2)}`);
  }
  return pts.join(' ');
}

/** Build the core SVG element for a shape type (centered at 0,0). */
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
      return (
        <polygon points={starPoints(half * 0.9, half * 0.4)} {...common} />
      );

    case 'arrow': {
      const pts = [
        `${half * 0.5},${-half * 0.85}`,  // tip
        `${half * 0.9},0`,                  // right wing
        `${half * 0.35},0`,                 // right notch
        `${half * 0.35},${half * 0.85}`,    // right base
        `${-half * 0.35},${half * 0.85}`,   // left base
        `${-half * 0.35},0`,                // left notch
        `${-half * 0.9},0`,                 // left wing
      ].join(' ');
      return <polygon points={pts} {...common} transform="rotate(180)" />;
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
  const color = shape.color || '#333';
  const rotation = shape.rotation ?? 0;
  const scale = shape.scale ?? 1;

  // Determine stroke properties based on border mode
  let strokeWidth: number;
  let strokeDash: string | undefined;
  switch (shape.border ?? 'thin') {
    case 'none':
      strokeWidth = 0;
      break;
    case 'thick':
      strokeWidth = 3;
      break;
    case 'dashed':
      strokeWidth = 1.8;
      strokeDash = '4 3';
      break;
    case 'thin':
    default:
      strokeWidth = 1.5;
      break;
  }

  const strokeColor = color;

  // Determine fill value (and whether we need a <defs> block for patterns)
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
      // We render two copies: one with no fill for the outline, one clipped to bottom half
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

      {/* Main shape */}
      {buildShapeElement(shape.type, size, fillAttr, strokeColor, strokeWidth, strokeDash)}

      {/* Half-fill: render a second filled copy clipped to the bottom half */}
      {shape.fill === 'half' && (
        <g clipPath={`url(#${clipId})`}>
          {buildShapeElement(shape.type, size, color, strokeColor, strokeWidth, strokeDash)}
        </g>
      )}

      {/* Inner shape (rendered at ~40% of parent size) */}
      {shape.innerShape && renderShape(shape.innerShape, 0, 0, size * 0.4)}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Component: ShapeBox – a single shape in an SVG box
// ---------------------------------------------------------------------------

export function ShapeBox({
  shape,
  size = 60,
}: {
  shape: RenderShape;
  size?: number;
}): React.ReactElement {
  const padding = 6;
  const totalSize = size + padding * 2;

  return (
    <svg
      width={totalSize}
      height={totalSize}
      viewBox={`0 0 ${totalSize} ${totalSize}`}
      style={{
        borderRadius: 10,
        background: '#fafafa',
        border: '1.5px solid #e5e7eb',
        display: 'inline-block',
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
  // Expect at least 3 shapes (A, B, C) and optionally D
  const [shapeA, shapeB, shapeC, shapeD] = shapes;

  const separatorStyle: React.CSSProperties = {
    fontSize: 26,
    fontWeight: 700,
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    padding: '0 6px',
    userSelect: 'none',
  };

  const questionBoxStyle: React.CSSProperties = {
    width: 72,
    height: 72,
    borderRadius: 10,
    background: '#fef3c7',
    border: '2px dashed #f59e0b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    fontWeight: 700,
    color: '#d97706',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        direction: 'ltr',
        flexWrap: 'wrap',
      }}
    >
      {shapeA && <ShapeBox shape={shapeA} />}
      <span style={separatorStyle}>:</span>
      {shapeB && <ShapeBox shape={shapeB} />}
      <span style={separatorStyle}>=</span>
      {shapeC && <ShapeBox shape={shapeC} />}
      <span style={separatorStyle}>:</span>

      {shapeD && !questionMark ? (
        <ShapeBox shape={shapeD} />
      ) : (
        <div style={questionBoxStyle}>?</div>
      )}
    </div>
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
  const questionBoxStyle: React.CSSProperties = {
    width: 72,
    height: 72,
    borderRadius: 10,
    background: '#fef3c7',
    border: '2px dashed #f59e0b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    fontWeight: 700,
    color: '#d97706',
    flexShrink: 0,
  };

  return (
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
          <ShapeBox shape={shape} />
          {i < shapes.length - 1 && (
            <span
              style={{
                fontSize: 20,
                color: '#d1d5db',
                userSelect: 'none',
              }}
            >
              {'\u279C'}
            </span>
          )}
        </React.Fragment>
      ))}
      <span
        style={{
          fontSize: 20,
          color: '#d1d5db',
          userSelect: 'none',
        }}
      >
        {'\u279C'}
      </span>
      <div style={questionBoxStyle}>?</div>
    </div>
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
}: {
  options: RenderShape[][];
  selected?: number;
  onSelect: (index: number) => void;
  disabled?: boolean;
}): React.ReactElement {
  const labels = ['\u05D0', '\u05D1', '\u05D2', '\u05D3']; // Hebrew: aleph, bet, gimel, dalet

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
        maxWidth: 340,
        margin: '0 auto',
      }}
    >
      {options.map((optionShapes, idx) => {
        const isSelected = selected === idx;

        return (
          <button
            key={idx}
            onClick={() => !disabled && onSelect(idx)}
            disabled={disabled}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: 10,
              borderRadius: 14,
              border: isSelected ? '2.5px solid #6366f1' : '2px solid #e5e7eb',
              background: isSelected ? '#eef2ff' : '#ffffff',
              boxShadow: isSelected
                ? '0 0 0 3px rgba(99,102,241,0.18)'
                : '0 1px 3px rgba(0,0,0,0.06)',
              cursor: disabled ? 'default' : 'pointer',
              opacity: disabled && !isSelected ? 0.55 : 1,
              transition: 'all 0.15s ease',
              outline: 'none',
              minHeight: 90,
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
                <ShapeBox key={sIdx} shape={s} size={44} />
              ))}
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: isSelected ? '#4338ca' : '#9ca3af',
                marginTop: 2,
              }}
            >
              {labels[idx] ?? idx + 1}
            </span>
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

  const questionBoxStyle: React.CSSProperties = {
    width: 60,
    height: 60,
    borderRadius: 8,
    background: '#fef3c7',
    border: '2px dashed #f59e0b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    fontWeight: 700,
    color: '#d97706',
  };

  return (
    <div
      style={{
        display: 'inline-grid',
        gridTemplateColumns: `repeat(${cols}, auto)`,
        gap: 6,
        padding: 12,
        background: '#f8fafc',
        borderRadius: 14,
        border: '2px solid #e2e8f0',
        direction: 'ltr',
      }}
    >
      {cells.flat().map((cell, i) =>
        cell ? (
          <ShapeBox key={i} shape={cell} size={52} />
        ) : (
          <div key={i} style={questionBoxStyle}>?</div>
        )
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component: ShapeRow – horizontal row of shapes (for before/after)
// ---------------------------------------------------------------------------

export function ShapeRow({
  shapes,
  separator = '\u2192',
}: {
  shapes: RenderShape[];
  separator?: string;
}): React.ReactElement {
  return (
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
          <ShapeBox shape={shape} />
          {i < shapes.length - 1 && (
            <span style={{ fontSize: 24, color: '#9ca3af', userSelect: 'none' }}>
              {separator}
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
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
  const labels = ['\u05D0', '\u05D1', '\u05D2', '\u05D3'];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
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
          <ShapeBox shape={shape} />
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#6b7280',
            }}
          >
            {labels[i]}
          </span>
        </div>
      ))}
    </div>
  );
}
