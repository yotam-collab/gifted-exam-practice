// Visual configurations for numbers-in-shapes questions (ns_001 - ns_020)
// Maps each question to its SVG component type and props

/** One butterfly: 4 wing values (upper/lower × left/right) + body value.
 *  A '?' string marks the missing cell — the renderer highlights it. */
export interface ButterflyValues {
  upperLeft: number | string;
  lowerLeft: number | string;
  upperRight: number | string;
  lowerRight: number | string;
  body: number | string;
}

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
    }
  | {
      // Real Stage B: a chain of boxes connected by N arrows, where the
      // arrow count encodes the operation strength. E.g. 1 arrow = −1,
      // 2 arrows = −2, 3 arrows = −3. Or 1 arrow = ×2, 2 arrows = ×3.
      type: 'arrow_chain';
      steps: { value: number | string; arrowsToNext?: number }[];
      missingIndex: number;
    }
  | {
      // Real Stage B: A → [box] → B for two rows, where the box performs
      // the same arithmetic operation. The kid figures out the box's role
      // from row 1, applies it to row 2.
      type: 'bidirectional_flow';
      rows: { left: number | string; box: number | string; right: number | string }[];
      missing: { row: number; side: 'left' | 'right' | 'box' };
    }
  | {
      // Sector wheel: a circle divided into N sectors with inner numbers;
      // each OUTER number sits on a boundary spoke and equals the sum of the
      // two inner sectors flanking that boundary. Either one outer number is
      // hidden (classic), or one INNER sector is hidden (missing-center
      // variant — solved by substitution/consistency across both spokes).
      type: 'number_wheel';
      inner: (number | string)[];
      outer: (number | string)[];
      missingOuterIndex?: number;
      missingInnerIndex?: number;
    }
  | {
      // Butterfly pair: a COMPLETE butterfly (discover + verify the rule on
      // both wing pairs) next to an INCOMPLETE one. Rule families:
      // body = upper + lower, or body = upper − lower — same rule on both sides.
      type: 'butterfly_pair';
      butterfly1: ButterflyValues;
      butterfly2: ButterflyValues;
    }
  | {
      // 5-point star: one number at each point, forming a sequence in a fixed
      // direction (clockwise / counter-clockwise) starting at some point.
      // Points are indexed 0..4 CLOCKWISE from the top tip.
      type: 'star_points';
      points: (number | string)[];
      missingIndex: number;
    }
  | {
      // Meta-rule figure: pairs of boxes connected by 1-4 stacked arrows.
      // Each arrow applies the base operation once (arrow = +k → m arrows =
      // +m·k), or m arrows = ×m. The missing box is in one pair.
      type: 'multi_arrow_machine';
      pairs: { from: number | string; to: number | string; arrows: number }[];
      missing: { pair: number; side: 'from' | 'to' };
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
