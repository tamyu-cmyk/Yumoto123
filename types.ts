
export enum ToleranceClass {
  F = 'f', // Fine
  M = 'm', // Medium
  C = 'c', // Coarse
  V = 'v'  // Extra Coarse
}

export interface RangeTolerance {
  min: number;
  max: number;
  [ToleranceClass.F]?: number;
  [ToleranceClass.M]?: number;
  [ToleranceClass.C]?: number;
  [ToleranceClass.V]?: number;
}

export type FitCategory = 'hole' | 'shaft';

export interface FitDeviation {
  upper: number; // in microns
  lower: number; // in microns
}

export interface FitData {
  ranges: { min: number; max: number }[];
  classes: Record<string, FitDeviation[]>;
}
