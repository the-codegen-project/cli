import { Args, Flags } from '@oclif/core';
import TheCodegenProject from '../base';
export default class Generate extends TheCodegenProject {
  static description = 'Generate';
  static args = {
    file: Args.string({description: 'Path or URL to the input document', required: true}),
  };

  static flags = {
    help: Flags.help({ char: 'h' }),
    output: Flags.string({
      char: 'o',
      description: 'The output directory where the models should be written to. Omitting this flag will write the models to `stdout`.',
      required: false
    })
  };

  async run() {
    this.log(`Successfully generated the following models`);
  }
}