/**
 * Visual shape data for shape and shape-series questions.
 * Maps question IDs to RenderShape arrays for SVG rendering.
 */
import type { RenderShape } from '../utils/shapeRenderer';

export type StemLayout = 'analogy' | 'series' | 'grid' | 'row' | 'odd_one_out';

export interface VisualConfig {
  stemLayout: StemLayout;
  stemShapes?: RenderShape[];
  gridCells?: (RenderShape | null)[][];
  optionShapes?: RenderShape[][];
}

// Helper: create a shape concisely
function s(
  type: RenderShape['type'],
  fill: RenderShape['fill'] = 'none',
  color = '#334155',
  extra?: Partial<Omit<RenderShape, 'type' | 'fill' | 'color'>>
): RenderShape {
  return { type, fill, color, ...extra };
}

// Helper: shape with inner shape
function sIn(
  type: RenderShape['type'],
  fill: RenderShape['fill'],
  color: string,
  inner: RenderShape,
  extra?: Partial<Omit<RenderShape, 'type' | 'fill' | 'color' | 'innerShape'>>
): RenderShape {
  return { type, fill, color, innerShape: inner, ...extra };
}

export const questionVisuals: Record<string, VisualConfig> = {
  // =====================================================================
  // SHAPES (sh_001 - sh_020)
  // =====================================================================

  // sh_001: solid circle : empty circle = solid square : ?
  'sh_001': {
    stemLayout: 'analogy',
    stemShapes: [s('circle', 'solid'), s('circle'), s('square', 'solid')],
    optionShapes: [
      [s('square')],
      [s('triangle', 'solid')],
      [s('circle')],
      [s('square', 'solid')],
    ],
  },

  // sh_002: small triangle : big triangle = small circle : ?
  'sh_002': {
    stemLayout: 'analogy',
    stemShapes: [
      s('triangle', 'solid', '#334155', { scale: 0.55 }),
      s('triangle', 'solid', '#334155', { scale: 1.15 }),
      s('circle', 'solid', '#334155', { scale: 0.55 }),
    ],
    optionShapes: [
      [s('square', 'solid', '#334155', { scale: 1.15 })],
      [s('circle', 'solid', '#334155', { scale: 1.15 })],
      [s('circle', 'solid', '#334155', { scale: 0.55 })],
      [s('triangle', 'solid', '#334155', { scale: 1.15 })],
    ],
  },

  // sh_003: square with dot inside : empty square = circle with dot : ?
  'sh_003': {
    stemLayout: 'analogy',
    stemShapes: [
      sIn('square', 'none', '#334155', s('circle', 'solid', '#334155')),
      s('square'),
      sIn('circle', 'none', '#334155', s('circle', 'solid', '#334155')),
    ],
    optionShapes: [
      [s('circle', 'striped')],
      [s('circle')],
      [s('square')],
      [sIn('circle', 'none', '#334155', s('circle', 'solid', '#334155'))],
    ],
  },

  // sh_004: striped square : striped circle = dotted square : ?
  'sh_004': {
    stemLayout: 'analogy',
    stemShapes: [s('square', 'striped'), s('circle', 'striped'), s('square', 'dotted')],
    optionShapes: [
      [s('circle', 'solid')],
      [s('triangle', 'dotted')],
      [s('circle', 'dotted')],
      [s('square')],
    ],
  },

  // sh_005: arrow right → arrow left (text options about transformation)
  'sh_005': {
    stemLayout: 'row',
    stemShapes: [
      s('arrow', 'solid', '#334155', { rotation: 270 }),
      s('arrow', 'solid', '#334155', { rotation: 90 }),
    ],
  },

  // sh_006: triangle pointing up → triangle pointing down
  'sh_006': {
    stemLayout: 'row',
    stemShapes: [
      s('triangle', 'none', '#334155'),
      s('triangle', 'none', '#334155', { rotation: 180 }),
    ],
  },

  // sh_007: square with inner circle → circle with inner square
  'sh_007': {
    stemLayout: 'row',
    stemShapes: [
      sIn('square', 'none', '#334155', s('circle', 'solid', '#6366f1')),
      sIn('circle', 'none', '#334155', s('square', 'solid', '#6366f1')),
    ],
  },

  // sh_008: 2×2 grid — circle, square / square, ?
  'sh_008': {
    stemLayout: 'grid',
    gridCells: [
      [s('circle'), s('square')],
      [s('square'), null],
    ],
    optionShapes: [
      [s('circle')],
      [s('square')],
      [s('triangle')],
      [s('diamond')],
    ],
  },

  // sh_009: 3×3 grid with shapes & fills
  'sh_009': {
    stemLayout: 'grid',
    gridCells: [
      [s('circle', 'solid'), s('square'), s('triangle')],
      [s('triangle', 'striped'), s('circle', 'striped'), s('square', 'striped')],
      [s('square', 'solid'), s('circle', 'striped'), null],
    ],
    optionShapes: [
      [s('triangle')],
      [s('circle')],
      [s('triangle', 'solid')],
      [s('circle', 'solid')],
    ],
  },

  // sh_010: 3×3 grid with dots (shown as inner circles of different scales)
  'sh_010': {
    stemLayout: 'grid',
    gridCells: [
      [sIn('circle', 'none', '#334155', s('circle', 'solid', '#334155')),
       sIn('square', 'none', '#334155', s('circle', 'solid', '#334155')),
       sIn('triangle', 'none', '#334155', s('circle', 'solid', '#334155'))],
      [sIn('square', 'none', '#334155', s('circle', 'solid', '#334155')),
       sIn('triangle', 'none', '#334155', s('circle', 'solid', '#334155')),
       sIn('circle', 'none', '#334155', s('circle', 'solid', '#334155'))],
      [sIn('circle', 'none', '#334155', s('circle', 'solid', '#334155')),
       sIn('square', 'none', '#334155', s('circle', 'solid', '#334155')),
       null],
    ],
    optionShapes: [
      [sIn('triangle', 'none', '#334155', s('circle', 'solid', '#334155'))],
      [sIn('square', 'none', '#334155', s('circle', 'solid', '#334155'))],
      [s('triangle')],
      [sIn('circle', 'none', '#334155', s('circle', 'solid', '#334155'))],
    ],
  },

  // sh_011: odd one out — solid circle, solid square, empty triangle, solid diamond
  'sh_011': {
    stemLayout: 'odd_one_out',
    stemShapes: [
      s('circle', 'solid'),
      s('square', 'solid'),
      s('triangle'),
      s('diamond', 'solid'),
    ],
  },

  // sh_012: odd one out — shapes with inner shapes
  'sh_012': {
    stemLayout: 'odd_one_out',
    stemShapes: [
      sIn('square', 'none', '#334155', s('circle', 'solid', '#6366f1')),
      sIn('triangle', 'none', '#334155', s('square', 'solid', '#6366f1')),
      sIn('circle', 'none', '#334155', s('triangle', 'solid', '#6366f1')),
      sIn('circle', 'none', '#6366f1', s('square', 'solid', '#334155')),
    ],
  },

  // sh_013: odd one out — shapes with striped patterns (2 vs 3 stripes)
  'sh_013': {
    stemLayout: 'odd_one_out',
    stemShapes: [
      s('square', 'striped'),
      s('circle', 'striped'),
      s('triangle', 'striped'),
      s('diamond', 'dotted'),
    ],
  },

  // sh_014: 2×3 frame — circle, square, triangle / triangle, ?, circle
  'sh_014': {
    stemLayout: 'grid',
    gridCells: [
      [s('circle'), s('square'), s('triangle')],
      [s('triangle'), null, s('circle')],
    ],
    optionShapes: [
      [s('circle')],
      [s('square')],
      [s('triangle')],
      [s('diamond')],
    ],
  },

  // sh_015: 2×2 frame — star, diamond / diamond, ?
  'sh_015': {
    stemLayout: 'grid',
    gridCells: [
      [s('star', 'solid', '#D97706'), s('diamond', 'solid', '#DC2626')],
      [s('diamond', 'solid', '#DC2626'), null],
    ],
    optionShapes: [
      [s('diamond', 'solid', '#DC2626')],
      [s('star', 'solid', '#D97706')],
      [s('circle', 'solid')],
      [s('square', 'solid')],
    ],
  },

  // sh_016: 3×3 grid fill
  'sh_016': {
    stemLayout: 'grid',
    gridCells: [
      [s('circle'), s('square'), s('triangle')],
      [s('square'), s('triangle'), null],
      [null, s('circle'), s('square')],
    ],
    optionShapes: [
      [s('circle')],
      [s('triangle')],
      [s('square')],
      [s('diamond')],
    ],
  },

  // sh_017: analogy — square(striped horizontal) : square(striped vertical) = circle(striped horizontal) : ?
  'sh_017': {
    stemLayout: 'analogy',
    stemShapes: [s('square', 'striped'), s('square', 'dotted'), s('circle', 'striped')],
    optionShapes: [
      [s('circle', 'dotted')],
      [s('square', 'dotted')],
      [s('circle')],
      [s('circle', 'half')],
    ],
  },

  // sh_018: transformation — solid triangle up → empty triangle down
  'sh_018': {
    stemLayout: 'row',
    stemShapes: [
      s('triangle', 'solid', '#1E293B'),
      s('triangle', 'none', '#1E293B', { rotation: 180 }),
    ],
  },

  // sh_019: odd one out — square, rectangle, diamond, circle
  'sh_019': {
    stemLayout: 'odd_one_out',
    stemShapes: [
      s('square'),
      s('rectangle'),
      s('diamond'),
      s('circle'),
    ],
  },

  // sh_020: 3×3 grid with colors
  'sh_020': {
    stemLayout: 'grid',
    gridCells: [
      [s('circle', 'solid', '#DC2626'), s('square', 'solid', '#2563EB'), s('triangle', 'solid', '#059669')],
      [s('square', 'solid', '#059669'), s('triangle', 'solid', '#DC2626'), s('circle', 'solid', '#2563EB')],
      [s('triangle', 'solid', '#2563EB'), s('circle', 'solid', '#059669'), null],
    ],
    optionShapes: [
      [s('square', 'solid', '#DC2626')],
      [s('square', 'solid', '#059669')],
      [s('triangle', 'solid', '#DC2626')],
      [s('circle', 'solid', '#DC2626')],
    ],
  },

  // =====================================================================
  // SHAPE SERIES (ss_001 - ss_020)
  // =====================================================================

  // ss_001: circle, square, triangle, circle, square, ?
  'ss_001': {
    stemLayout: 'series',
    stemShapes: [s('circle'), s('square'), s('triangle'), s('circle'), s('square')],
    optionShapes: [
      [s('circle')],
      [s('square')],
      [s('triangle')],
      [s('diamond')],
    ],
  },

  // ss_002: star, star, diamond, star, star, diamond, star, star, ?
  'ss_002': {
    stemLayout: 'series',
    stemShapes: [
      s('star', 'solid', '#D97706'), s('star', 'solid', '#D97706'), s('diamond', 'solid', '#DC2626'),
      s('star', 'solid', '#D97706'), s('star', 'solid', '#D97706'), s('diamond', 'solid', '#DC2626'),
      s('star', 'solid', '#D97706'), s('star', 'solid', '#D97706'),
    ],
    optionShapes: [
      [s('star', 'solid', '#D97706')],
      [s('diamond', 'solid', '#DC2626')],
      [s('circle', 'solid')],
      [s('square', 'solid')],
    ],
  },

  // ss_003: circle small, circle medium, circle large, square small, square medium, square large, triangle small, triangle medium, ?
  'ss_003': {
    stemLayout: 'series',
    stemShapes: [
      s('circle', 'solid', '#2563EB', { scale: 0.45 }),
      s('circle', 'solid', '#2563EB', { scale: 0.75 }),
      s('circle', 'solid', '#2563EB', { scale: 1.1 }),
      s('square', 'solid', '#059669', { scale: 0.45 }),
      s('square', 'solid', '#059669', { scale: 0.75 }),
      s('square', 'solid', '#059669', { scale: 1.1 }),
      s('triangle', 'solid', '#D97706', { scale: 0.45 }),
      s('triangle', 'solid', '#D97706', { scale: 0.75 }),
    ],
    optionShapes: [
      [s('triangle', 'solid', '#D97706', { scale: 1.1 })],
      [s('circle', 'solid', '#2563EB', { scale: 0.45 })],
      [s('square', 'solid', '#059669', { scale: 0.45 })],
      [s('triangle', 'solid', '#D97706', { scale: 0.45 })],
    ],
  },

  // ss_004: square empty, square with 1 stripe, 2 stripes, 3 stripes → ?
  'ss_004': {
    stemLayout: 'series',
    stemShapes: [
      s('square'),
      s('square', 'striped', '#334155'),
      s('square', 'dotted', '#334155'),
      s('square', 'half', '#334155'),
    ],
    optionShapes: [
      [s('square', 'solid', '#334155')],
      [s('square')],
      [s('square', 'half', '#334155')],
      [s('circle', 'striped')],
    ],
  },

  // ss_006: solid triangle, striped square, empty triangle, solid square, striped triangle, ?
  'ss_006': {
    stemLayout: 'series',
    stemShapes: [
      s('triangle', 'solid'),
      s('square', 'striped'),
      s('triangle'),
      s('square', 'solid'),
      s('triangle', 'striped'),
    ],
    optionShapes: [
      [s('square')],
      [s('triangle', 'solid')],
      [s('square', 'striped')],
      [s('circle')],
    ],
  },

  // ss_007: arrows rotating — up, right, down, left, ?
  'ss_007': {
    stemLayout: 'series',
    stemShapes: [
      s('arrow', 'solid', '#334155', { rotation: 180 }),   // up
      s('arrow', 'solid', '#334155', { rotation: 270 }),   // right
      s('arrow', 'solid', '#334155', { rotation: 0 }),     // down
      s('arrow', 'solid', '#334155', { rotation: 90 }),    // left
    ],
    optionShapes: [
      [s('arrow', 'solid', '#334155', { rotation: 180 })],  // up
      [s('arrow', 'solid', '#334155', { rotation: 270 })],  // right
      [s('arrow', 'solid', '#334155', { rotation: 0 })],    // down
      [s('arrow', 'solid', '#334155', { rotation: 90 })],   // left
    ],
  },

  // ss_008: dot position in square corners (shown as square with inner circle moving)
  'ss_008': {
    stemLayout: 'series',
    stemShapes: [
      sIn('square', 'none', '#334155', s('circle', 'solid', '#DC2626')),
      sIn('square', 'none', '#334155', s('circle', 'solid', '#2563EB')),
      sIn('square', 'none', '#334155', s('circle', 'solid', '#059669')),
    ],
    optionShapes: [
      [sIn('square', 'none', '#334155', s('circle', 'solid', '#D97706'))],
      [s('square')],
      [sIn('square', 'none', '#334155', s('circle', 'solid', '#2563EB'))],
      [sIn('square', 'none', '#334155', s('circle', 'solid', '#DC2626'))],
    ],
  },

  // ss_009: rotating triangle + increasing dots
  'ss_009': {
    stemLayout: 'series',
    stemShapes: [
      sIn('triangle', 'none', '#334155', s('circle', 'solid', '#334155')),
      sIn('triangle', 'none', '#334155', s('circle', 'solid', '#334155'), { rotation: 90 }),
      sIn('triangle', 'none', '#334155', s('circle', 'solid', '#334155'), { rotation: 180 }),
    ],
    optionShapes: [
      [sIn('triangle', 'none', '#334155', s('circle', 'solid', '#334155'), { rotation: 270 })],
      [sIn('triangle', 'none', '#334155', s('circle', 'solid', '#334155'), { rotation: 180 })],
      [sIn('triangle', 'none', '#334155', s('circle', 'solid', '#334155'), { rotation: 90 })],
      [s('square')],
    ],
  },

  // ss_010: filling progression — 1/4, 2/4, 3/4, ?
  'ss_010': {
    stemLayout: 'series',
    stemShapes: [
      s('square', 'none', '#334155'),
      s('square', 'half', '#334155'),
      s('square', 'striped', '#334155'),
    ],
    optionShapes: [
      [s('square', 'solid', '#334155')],
      [s('square', 'half', '#334155')],
      [s('square')],
      [s('square', 'dotted', '#334155')],
    ],
  },

  // ss_011: half-fill alternating circles
  'ss_011': {
    stemLayout: 'series',
    stemShapes: [
      s('circle', 'half', '#334155'),
      s('circle', 'half', '#334155', { rotation: 180 }),
      s('circle', 'half', '#334155'),
    ],
    optionShapes: [
      [s('circle', 'half', '#334155')],
      [s('circle', 'half', '#334155', { rotation: 180 })],
      [s('circle', 'solid')],
      [s('circle')],
    ],
  },

  // ss_012: border progression
  'ss_012': {
    stemLayout: 'series',
    stemShapes: [
      s('square', 'none', '#334155', { border: 'thin' }),
      s('square', 'none', '#334155', { border: 'thick' }),
      s('square', 'none', '#334155', { border: 'dashed' }),
    ],
    optionShapes: [
      [s('square', 'solid', '#334155')],
      [s('square')],
      [s('square', 'none', '#334155', { border: 'thin' })],
      [s('square', 'none', '#334155', { border: 'thick' })],
    ],
  },

  // ss_013: multi-rule — red small circle, blue medium square, green big triangle, red small circle, blue medium square, ?
  'ss_013': {
    stemLayout: 'series',
    stemShapes: [
      s('circle', 'solid', '#DC2626', { scale: 0.5 }),
      s('square', 'solid', '#2563EB', { scale: 0.8 }),
      s('triangle', 'solid', '#059669', { scale: 1.1 }),
      s('circle', 'solid', '#DC2626', { scale: 0.5 }),
      s('square', 'solid', '#2563EB', { scale: 0.8 }),
    ],
    optionShapes: [
      [s('triangle', 'solid', '#059669', { scale: 1.1 })],
      [s('circle', 'solid', '#DC2626', { scale: 1.1 })],
      [s('triangle', 'solid', '#2563EB', { scale: 0.5 })],
      [s('square', 'solid', '#059669', { scale: 0.8 })],
    ],
  },

  // ss_014: alternating — big solid circle, small empty square, repeat
  'ss_014': {
    stemLayout: 'series',
    stemShapes: [
      s('circle', 'solid', '#334155', { scale: 1.1 }),
      s('square', 'none', '#334155', { scale: 0.55 }),
      s('circle', 'solid', '#334155', { scale: 1.1 }),
      s('square', 'none', '#334155', { scale: 0.55 }),
    ],
    optionShapes: [
      [s('triangle', 'solid', '#334155', { scale: 1.1 })],
      [s('circle', 'solid', '#334155', { scale: 1.1 })],
      [s('circle', 'none', '#334155', { scale: 0.55 })],
      [s('square', 'solid', '#334155', { scale: 0.55 })],
    ],
  },

  // ss_016: pattern — circle, square, circle, square,square, circle, square,square,square, ?
  'ss_016': {
    stemLayout: 'series',
    stemShapes: [
      s('circle', 'solid', '#2563EB'),
      s('square', 'solid', '#DC2626'),
      s('circle', 'solid', '#2563EB'),
      s('square', 'solid', '#DC2626'),
      s('square', 'solid', '#DC2626'),
      s('circle', 'solid', '#2563EB'),
      s('square', 'solid', '#DC2626'),
      s('square', 'solid', '#DC2626'),
      s('square', 'solid', '#DC2626'),
    ],
    optionShapes: [
      [s('circle', 'solid', '#2563EB')],
      [s('square', 'solid', '#DC2626')],
      [s('triangle', 'solid')],
      [s('diamond', 'solid')],
    ],
  },

  // ss_018: arrow rotating 45° each step
  'ss_018': {
    stemLayout: 'series',
    stemShapes: [
      s('arrow', 'solid', '#334155', { rotation: 180 }),   // up
      s('arrow', 'solid', '#334155', { rotation: 225 }),   // up-right
      s('arrow', 'solid', '#334155', { rotation: 270 }),   // right
      s('arrow', 'solid', '#334155', { rotation: 315 }),   // down-right
    ],
    optionShapes: [
      [s('arrow', 'solid', '#334155', { rotation: 0 })],    // down
      [s('arrow', 'solid', '#334155', { rotation: 180 })],  // up
      [s('arrow', 'solid', '#334155', { rotation: 90 })],   // left
      [s('arrow', 'solid', '#334155', { rotation: 315 })],  // down-right
    ],
  },

  // ss_019: circle, triangle, square, triangle, circle, triangle, square, triangle, ?
  'ss_019': {
    stemLayout: 'series',
    stemShapes: [
      s('circle', 'solid', '#2563EB'),
      s('triangle', 'solid', '#059669'),
      s('square', 'solid', '#DC2626'),
      s('triangle', 'solid', '#059669'),
      s('circle', 'solid', '#2563EB'),
      s('triangle', 'solid', '#059669'),
      s('square', 'solid', '#DC2626'),
      s('triangle', 'solid', '#059669'),
    ],
    optionShapes: [
      [s('circle', 'solid', '#2563EB')],
      [s('triangle', 'solid', '#059669')],
      [s('square', 'solid', '#DC2626')],
      [s('diamond', 'solid')],
    ],
  },

  // ss_020: alternating — big black square with dot, small white circle with dots, repeat
  'ss_020': {
    stemLayout: 'series',
    stemShapes: [
      sIn('square', 'solid', '#1E293B', s('circle', 'solid', '#ffffff')),
      sIn('circle', 'none', '#1E293B', s('circle', 'solid', '#1E293B')),
      sIn('square', 'solid', '#1E293B', s('circle', 'solid', '#ffffff')),
    ],
    optionShapes: [
      [sIn('circle', 'none', '#1E293B', s('circle', 'solid', '#1E293B'))],
      [sIn('square', 'solid', '#1E293B', s('circle', 'solid', '#ffffff'))],
      [sIn('circle', 'solid', '#1E293B', s('circle', 'solid', '#ffffff'))],
      [sIn('triangle', 'none', '#1E293B', s('circle', 'solid', '#1E293B'))],
    ],
  },
};
