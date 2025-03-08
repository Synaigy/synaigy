import {
  VariableConverter,
  FormatHolder,
  VariableProcessor,
} from "../types.js";
import { TailwindV4FormatHolder } from "./TailwindV4FormatHolder.js";
import { PrimitivesProcessor } from "../tailwindv3/processors/PrimitivesProcessor.js";
import { FigmaSyncConfig } from "../../utils/config.js";
import { RadiusProcessor } from "../tailwindv3/processors/RadiusProcessor.js";
import { SpacingProcessor } from "../tailwindv3/processors/SpacingProcessor.js";
import { WidthsProcessor } from "../tailwindv3/processors/WidthsProcessor.js";
import { ContainersProcessor } from "../tailwindv3/processors/ContainersProcessor.js";
import { FontSizeProcessor } from "../tailwindv3/processors/FontSizeProcessor.js";
import { FontWeightProcessor } from "../tailwindv3/processors/FontWeightProcessor.js";
import { FontFamilyProcessor } from "../tailwindv3/processors/FontFamilyProcessor.js";
import { LineHeightProcessor } from "../tailwindv3/processors/LineHeightProcessor.js";
import { ColorModesProcessor } from "../tailwindv3/processors/ColorModesProcessor.js";
import { BorderWidthProcessor } from "../tailwindv3/processors/BorderWidthProcessor.js";
import { ContainerWidthsProcessor } from "../tailwindv3/processors/ContainerWidthsProcessor.js";
import { RadiusModesProcessor } from "../tailwindv3/processors/RadiusModesProcessor.js";
import { BorderWidthModesProcessor } from "../tailwindv3/processors/BorderWidthModesProcessor.js";
import { FontFamilyModesProcessor } from "../tailwindv3/processors/FontFamilyModesProcessor.js";
import { FontSizeModesProcessor } from "../tailwindv3/processors/FontSizeModesProcessor.js";
import { FontWeightModesProcessor } from "../tailwindv3/processors/FontWeightModesProcessor.js";
import { LineHeightModesProcessor } from "../tailwindv3/processors/LineHeightModesProcessor.js";

export class TailwindV4Converter implements VariableConverter {
  private processors: VariableProcessor[] = [];

  initialize(): FormatHolder {
    return new TailwindV4FormatHolder();
  }

  registerProcessor(processor: VariableProcessor): void {
    this.processors.push(processor);
  }

  async convert(
    variables: any,
    config: FigmaSyncConfig
  ): Promise<{ [key: string]: string }> {
    // Initialize format holder
    const holder = this.initialize() as TailwindV4FormatHolder;

    // Register default processors if none registered
    if (this.processors.length === 0) {
      this.registerProcessor(new PrimitivesProcessor());
      this.registerProcessor(new RadiusProcessor());
      this.registerProcessor(new SpacingProcessor());
      this.registerProcessor(new WidthsProcessor());
      this.registerProcessor(new BorderWidthProcessor());
      this.registerProcessor(new ContainersProcessor());
      this.registerProcessor(new ContainerWidthsProcessor());
      this.registerProcessor(new FontSizeProcessor());
      this.registerProcessor(new FontWeightProcessor());
      this.registerProcessor(new FontFamilyProcessor());
      this.registerProcessor(new LineHeightProcessor());
      // Modes
      this.registerProcessor(new ColorModesProcessor());
      this.registerProcessor(new RadiusModesProcessor());
      this.registerProcessor(new BorderWidthModesProcessor());
      this.registerProcessor(new FontFamilyModesProcessor());
      this.registerProcessor(new FontSizeModesProcessor());
      this.registerProcessor(new FontWeightModesProcessor());
      this.registerProcessor(new LineHeightModesProcessor());
    }

    // Run all processors
    for (const processor of this.processors) {
      processor.process(variables, holder);
    }

    return holder.getOutputFiles();
  }
}
