import {
  VariableConverter,
  FormatHolder,
  VariableProcessor,
} from "../types.js";
import { TailwindV3FormatHolder } from "./TailwindV3FormatHolder.js";
import { PrimitivesProcessor } from "./processors/PrimitivesProcessor.js";
import { FigmaSyncConfig } from "../../utils/config.js";
import { RadiusProcessor } from "./processors/RadiusProcessor.js";
import { SpacingProcessor } from "./processors/SpacingProcessor.js";
import { WidthsProcessor } from "./processors/WidthsProcessor.js";
import { ContainersProcessor } from "./processors/ContainersProcessor.js";
import { ContainerWidthsProcessor } from "./processors/ContainerWidthsProcessor.js";
import { FontSizeProcessor } from "./processors/FontSizeProcessor.js";
import { FontWeightProcessor } from "./processors/FontWeightProcessor.js";
import { FontFamilyProcessor } from "./processors/FontFamilyProcessor.js";
import { LineHeightProcessor } from "./processors/LineHeightProcessor.js";
import { ColorModesProcessor } from "./processors/ColorModesProcessor.js";
import { RadiusModesProcessor } from "./processors/RadiusModesProcessor.js";
import { FontFamilyModesProcessor } from "./processors/FontFamilyModesProcessor.js";
import { BorderWidthProcessor } from "./processors/BorderWidthProcessor.js";
import { BorderWidthModesProcessor } from "./processors/BorderWidthModesProcessor.js";
import { FontSizeModesProcessor } from "./processors/FontSizeModesProcessor.js";
import { FontWeightModesProcessor } from "./processors/FontWeightModesProcessor.js";
import { LineHeightModesProcessor } from "./processors/LineHeightModesProcessor.js";

export class TailwindV3Converter implements VariableConverter {
  private processors: VariableProcessor[] = [];

  initialize(): FormatHolder {
    return new TailwindV3FormatHolder();
  }

  registerProcessor(processor: VariableProcessor): void {
    this.processors.push(processor);
  }

  async convert(
    variables: any,
    config: FigmaSyncConfig
  ): Promise<{ [key: string]: string }> {
    // Initialize format holder
    const holder = this.initialize() as TailwindV3FormatHolder;

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
