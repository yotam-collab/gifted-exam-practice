import {
  ShapeAnalogy, ShapeSeries, ShapeGrid, ShapeRow, ShapeOddOneOut,
  DividedCirclePair, NumberPyramid, NumberGrid, NumberFlowChart, NumberTriangle,
  ArrowChain, BidirectionalFlow, NumberWheel,
} from '../utils/shapeRenderer';
import type { VisualConfig } from '../data/shapeVisuals';
import type { NSVisualConfig } from '../data/numberShapeVisuals';

/**
 * Shared stem-visual renderer for shape / numbers-in-shapes questions.
 * Extracted so both the interactive session and the printable worksheet render
 * identical diagrams. (Answer-option shapes are handled by ShapeOptions in the
 * session; the print route renders options separately.)
 */
export function QuestionVisual({
  visual,
  nsVisual,
}: {
  visual?: VisualConfig;
  nsVisual?: NSVisualConfig;
}) {
  if (visual) {
    if (visual.stemLayout === 'analogy' && visual.stemShapes) return <ShapeAnalogy shapes={visual.stemShapes} />;
    if (visual.stemLayout === 'series' && visual.stemShapes) return <ShapeSeries shapes={visual.stemShapes} />;
    if (visual.stemLayout === 'grid' && visual.gridCells) return <ShapeGrid cells={visual.gridCells} />;
    if (visual.stemLayout === 'row' && visual.stemShapes) return <ShapeRow shapes={visual.stemShapes} />;
    if (visual.stemLayout === 'odd_one_out' && visual.stemShapes) return <ShapeOddOneOut shapes={visual.stemShapes} />;
  }
  if (nsVisual) {
    switch (nsVisual.type) {
      case 'divided_circle_pair':
        return <DividedCirclePair circle1={nsVisual.circle1} circle2={nsVisual.circle2} missingCircle={nsVisual.missingCircle} missingIndex={nsVisual.missingIndex} />;
      case 'number_pyramid':
        return <NumberPyramid rows={nsVisual.rows} missingRow={nsVisual.missingRow} missingCol={nsVisual.missingCol} />;
      case 'number_grid':
        return <NumberGrid rows={nsVisual.rows} missingRow={nsVisual.missingRow} missingCol={nsVisual.missingCol} />;
      case 'number_flow':
        return <NumberFlowChart nodes={nsVisual.nodes} operations={nsVisual.operations} missingIndex={nsVisual.missingIndex} />;
      case 'number_triangle':
        return <NumberTriangle top={nsVisual.top} bottomLeft={nsVisual.bottomLeft} bottomRight={nsVisual.bottomRight} center={nsVisual.center} missingPosition={nsVisual.missingPosition} />;
      case 'arrow_chain':
        return <ArrowChain steps={nsVisual.steps} missingIndex={nsVisual.missingIndex} />;
      case 'bidirectional_flow':
        return <BidirectionalFlow rows={nsVisual.rows} missing={nsVisual.missing} />;
      case 'number_wheel':
        return <NumberWheel inner={nsVisual.inner} outer={nsVisual.outer} missingOuterIndex={nsVisual.missingOuterIndex} />;
    }
  }
  return null;
}
