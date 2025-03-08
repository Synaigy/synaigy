import { FigmaSyncConfig } from "../utils/config.js";
import { FigmaColor } from "../utils/color.js";

// Figma API Types
export interface FigmaMode {
  modeId: string;
  name: string;
}

interface FigmaColorVariable {
  id: string;
  name: string;
  resolvedType: "COLOR";
  valuesByMode: {
    [modeId: string]: FigmaColor;
  };
}

interface FigmaOtherVariable {
  id: string;
  name: string;
  resolvedType: "FLOAT" | "STRING" | "BOOLEAN";
  valuesByMode: {
    [modeId: string]: string;
  };
}

export type FigmaVariable = FigmaColorVariable | FigmaOtherVariable;

export interface FigmaVariableCollection {
  defaultModeId: string;
  id: string;
  name: string;
  remote: boolean;
  modes: FigmaMode[];
  key: string;
  hiddenFromPublishing: boolean;
  variableIds: string[];
}

export interface FigmaVariablesResponse {
  status: number;
  error: boolean;
  meta: {
    variableCollections: {
      [key: string]: FigmaVariableCollection;
    };
    variables: {
      [key: string]: FigmaVariable;
    };
  };
}

// Base interface for format holders
export interface FormatHolder {
  getOutputFiles(): { [key: string]: string };
}

// Interface for variable processors
export interface VariableProcessor {
  process(variables: FigmaVariablesResponse, holder: FormatHolder): void;
}

// Base interface for converters
export interface VariableConverter {
  initialize(): FormatHolder;
  registerProcessor(processor: VariableProcessor): void;
  convert(
    variables: FigmaVariablesResponse,
    config: FigmaSyncConfig
  ): Promise<{ [key: string]: string }>;
}

// Available output formats
export enum OutputFormat {
  Tailwind3 = "Tailwind3",
  Tailwind4 = "Tailwind4",
  PlainCSS = "PlainCSS",
}
