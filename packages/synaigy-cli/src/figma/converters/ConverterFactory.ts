import { OutputFormat, VariableConverter } from "./types.js";
import { TailwindV3Converter } from "./tailwindv3/TailwindV3Converter.js";
import { TailwindV4Converter } from "./tailwindv4/TailwindV4Converter.js";

export class ConverterFactory {
  static createConverter(format: OutputFormat): VariableConverter {
    switch (format) {
      case OutputFormat.Tailwind3:
        return new TailwindV3Converter();
      case OutputFormat.Tailwind4:
        return new TailwindV4Converter();
      case OutputFormat.PlainCSS:
        throw new Error("Plain CSS converter not implemented yet");
      default:
        throw new Error(`Unknown output format: ${format}`);
    }
  }
}
