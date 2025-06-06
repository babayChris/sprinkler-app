export interface SegmentationMask {
  segmentation: number[][];
  area: number;
  bbox: number[];
  predicted_iou: number;
  stability_score: number;
}

export interface SegmentationResult {
  masks: SegmentationMask[];
  polygons: number[][][];
}

export interface SegmentOverlay {
  id: string;
  polygon: number[][];
  mask: SegmentationMask;
  isVisible: boolean;
  isHovered: boolean;
  isSelected: boolean;
  color: string;
}