// Visual configurations for numbers-in-shapes questions (ns_001 - ns_020)
// Maps each question to its SVG component type and props

export type NSVisualConfig =
  | {
      type: 'divided_circle_pair';
      circle1: (number | string)[];
      circle2: (number | string)[];
      missingCircle: 1 | 2;
      missingIndex: number;
    }
  | {
      type: 'number_pyramid';
      rows: (number | string)[][];
      missingRow: number;
      missingCol: number;
    }
  | {
      type: 'number_grid';
      rows: (number | string)[][];
      missingRow: number;
      missingCol: number;
    }
  | {
      type: 'number_flow';
      nodes: (number | string)[];
      operations: string[];
      missingIndex: number;
    }
  | {
      type: 'number_triangle';
      top: number | string;
      bottomLeft: number | string;
      bottomRight: number | string;
      center: number | string;
      missingPosition: 'top' | 'bottomLeft' | 'bottomRight' | 'center';
    };

export const numberShapeVisuals: Record<string, NSVisualConfig> = {
  // --- divided_circle (ns_001 - ns_005) ---

  ns_001: {
    type: 'divided_circle_pair',
    circle1: [12, 4, 3],
    circle2: [20, 5, '?'],
    missingCircle: 2,
    missingIndex: 2,
  },
  ns_002: {
    type: 'divided_circle_pair',
    circle1: [3, 5, 15],
    circle2: [4, 6, '?'],
    missingCircle: 2,
    missingIndex: 2,
  },
  ns_003: {
    type: 'divided_circle_pair',
    circle1: [48, 8, 6],
    circle2: [36, 4, '?'],
    missingCircle: 2,
    missingIndex: 2,
  },
  ns_004: {
    type: 'divided_circle_pair',
    circle1: [2, 3, 5, 6],
    circle2: [4, 5, 9, '?'],
    missingCircle: 2,
    missingIndex: 3,
  },
  ns_005: {
    type: 'divided_circle_pair',
    circle1: [2, 3, 6],
    circle2: [3, 7, '?'],
    missingCircle: 2,
    missingIndex: 2,
  },

  // --- number_pyramid (ns_006 - ns_009) ---

  ns_006: {
    type: 'number_pyramid',
    rows: [['?'], [8, 7], [3, 5, 2]],
    missingRow: 0,
    missingCol: 0,
  },
  ns_007: {
    type: 'number_pyramid',
    rows: [[20], [12, 8], [7, '?', 3]],
    missingRow: 2,
    missingCol: 1,
  },
  ns_008: {
    type: 'number_pyramid',
    rows: [['?'], [10, 13], [6, 4, 9], [5, 1, 3, 6]],
    missingRow: 0,
    missingCol: 0,
  },
  ns_009: {
    type: 'number_pyramid',
    rows: [[30], [18, 12], ['?', 8, 4]],
    missingRow: 2,
    missingCol: 0,
  },

  // --- number_flow (ns_010 - ns_013) ---

  ns_010: {
    type: 'number_flow',
    nodes: [6, '?', 22],
    operations: ['×3', '+4'],
    missingIndex: 1,
  },
  ns_011: {
    type: 'number_flow',
    nodes: ['?', 5],
    operations: ['÷4'],
    missingIndex: 0,
  },
  ns_012: {
    type: 'number_flow',
    nodes: [8, 32, '?'],
    operations: ['×4', '-7'],
    missingIndex: 2,
  },
  ns_013: {
    type: 'number_flow',
    nodes: [5, 20, '?'],
    operations: ['×4', '-5'],
    missingIndex: 2,
  },

  // --- number_grid (ns_014 - ns_017) ---

  ns_014: {
    type: 'number_grid',
    rows: [
      [2, 5, 7],
      [3, 4, '?'],
    ],
    missingRow: 1,
    missingCol: 2,
  },
  ns_015: {
    type: 'number_grid',
    rows: [
      [2, 3, 5],
      [4, 1, 5],
      [6, 3, '?'],
    ],
    missingRow: 2,
    missingCol: 2,
  },
  ns_016: {
    type: 'number_grid',
    rows: [
      [10, 2, 5],
      [18, 3, 6],
      [24, 4, '?'],
    ],
    missingRow: 2,
    missingCol: 2,
  },
  ns_017: {
    type: 'number_grid',
    rows: [
      [3, 6, 18],
      [2, 5, 10],
      [4, 3, '?'],
    ],
    missingRow: 2,
    missingCol: 2,
  },

  // --- number_pattern (ns_018 - ns_020) ---

  ns_018: {
    type: 'number_triangle',
    top: 5,
    bottomLeft: 4,
    bottomRight: 6,
    center: '?',
    missingPosition: 'center',
  },
  ns_019: {
    // Magic square - use grid
    type: 'number_grid',
    rows: [
      [2, 7, 6],
      [9, 5, 1],
      [4, '?', 8],
    ],
    missingRow: 2,
    missingCol: 1,
  },
  ns_020: {
    // Diamond shape - use divided circle with 4 parts (top, right, bottom, left)
    type: 'divided_circle_pair',
    circle1: [5, 4, 12, 3],
    circle2: [6, 5, '?', 2],
    missingCircle: 2,
    missingIndex: 2,
  },
};
