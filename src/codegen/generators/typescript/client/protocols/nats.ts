/* eslint-disable security/detect-object-injection */
/* eslint-disable sonarjs/no-duplicate-string */
import path from 'node:path';
import {
  ChannelFunctionTypes,
  TypeScriptChannelRenderType
} from '../../channels';
import {TypescriptParametersGeneratorInternal} from '../../parameters';
import {TypeScriptPayloadGeneratorInternal} from '../../payloads';
import {ensureRelativePath} from '../../../../utils';
import {TypeScriptClientContext} from '..';
import {renderCoreSubscribe} from './nats/coreSubscribe';
import {renderCorePublish} from './nats/corePublish';
import {renderJetStreamPublish} from './nats/jetstreamPublish';
import {renderJetStreamPullSubscription} from './nats/jetStreamPullSubscription';
import {renderJetStreamPushSubscription} from './nats/jetstreamPushSubscription';
import {ChannelPayload} from '../../../../types';

export async function generateNatsClient(context: TypeScriptClientContext) {
  const {asyncapiDocument, generator, inputType} = context;
  if (inputType === 'asyncapi' && asyncapiDocument === undefined) {
    throw new Error('Expected AsyncAPI input, was not given');
  }

  if (!context.dependencyOutputs) {
    throw new Error(
      'Internal error, could not determine previous rendered outputs that is required for client typescript generator'
    );
  }
  const channels = context.dependencyOutputs[
    generator.channelsGeneratorId
  ] as TypeScriptChannelRenderType;
  if (!channels) {
    throw new Error(
      'Internal error, could not determine previous rendered channels generator that is required for client TypeScript generator'
    );
  }
  const renderedFunctions = channels.renderedFunctions;
  const renderedNatsFunctions = renderedFunctions['nats'];

  const payloads = channels.payloadRender;
  const parameters = channels.parameterRender;

  const parameterGenerator =
    parameters.generator as TypescriptParametersGeneratorInternal;
  const parameterImports = Object.values(parameters.channelModels)
    .filter((parameter) => parameter !== undefined)
    .map((parameter: any) => {
      const parameterImportPath = path.relative(
        context.generator.outputPath,
        path.resolve(parameterGenerator.outputPath, parameter.modelName)
      );
      return {
        import: `import {${parameter.modelName}} from './${ensureRelativePath(parameterImportPath)}';`,
        export: `export {${parameter.modelName}};`
      };
    });

  const payloadGenerator =
    payloads.generator as TypeScriptPayloadGeneratorInternal;

  const payloadImports = Object.values(payloads.channelModels).map(
    (payload: ChannelPayload) => {
      const payloadImportPath = path.relative(
        context.generator.outputPath,
        path.resolve(
          payloadGenerator.outputPath,
          payload.messageModel.modelName
        )
      );
      return {
        import: `import {${payload.messageModel.modelName}} from './${ensureRelativePath(payloadImportPath)}';`,
        export: `export {${payload.messageModel.modelName}};`
      };
    }
  );
  const channelsImportPath = path.relative(
    context.generator.outputPath,
    path.resolve(channels.generator.outputPath, 'index')
  );
  const natsFunctions: string[] = [];
  for (const func of renderedNatsFunctions) {
    const context = {
      channelName: func.functionName,
      channelParameterType: func.parameterType,
      description: '',
      messageType: func.messageType
    };
    switch (func.functionType) {
      case ChannelFunctionTypes.NATS_CORE_SUBSCRIBE:
        natsFunctions.push(renderCoreSubscribe(context));
        break;
      case ChannelFunctionTypes.NATS_CORE_PUBLISH:
        natsFunctions.push(renderCorePublish(context));
        break;
      case ChannelFunctionTypes.NATS_JETSTREAM_PUBLISH:
        natsFunctions.push(renderJetStreamPublish(context));
        break;
      case ChannelFunctionTypes.NATS_JETSTREAM_PULL_SUBSCRIBE:
        natsFunctions.push(renderJetStreamPullSubscription(context));
        break;
      case ChannelFunctionTypes.NATS_JETSTREAM_PUSH_SUBSCRIBE:
        natsFunctions.push(renderJetStreamPushSubscription(context));
        break;
      default:
        break;
    }
  }

  const payloadImport = [
    ...new Set(payloadImports.map((payload) => payload.import))
  ];
  const payloadExport = [
    ...new Set(payloadImports.map((payload) => payload.export))
  ];

  const parameterImport = [
    ...new Set(parameterImports.map((payload) => payload.import))
  ];
  const parameterExport = [
    ...new Set(parameterImports.map((payload) => payload.export))
  ];

  return `//Import and export payload models
${payloadImport.join('\n')}
${payloadExport.join('\n')}

//Import and export parameter models
${parameterImport.join('\n')}
${parameterExport.join('\n')}

//Import channel functions
import { Protocols } from './${ensureRelativePath(channelsImportPath)}';
const { nats } = Protocols;

import * as Nats from 'nats';

/**
 * @class NatsClient
 */
export class NatsClient {
  public nc?: Nats.NatsConnection;
  public js?: Nats.JetStreamClient;
  public codec?: Nats.Codec<any>;
  public options?: Nats.ConnectionOptions;

  /**
   * Disconnect all clients from the server and drain subscriptions.
   * 
   * This is a gentle disconnect and make take a little.
   */
  async disconnect() {
    if (!this.isClosed() && this.nc !== undefined) {
      await this.nc.drain();
    }
  }
  /**
   * Returns whether or not any of the clients are closed
   */
  isClosed() {
    if (!this.nc || this.nc.isClosed()) {
      return true;
    }
    return false;
  }
  /**
   * Try to connect to the NATS server with user credentials
   *
   * @param userCreds to use
   * @param options to connect with
   */
  async connectWithUserCreds(userCreds: string, options ? : Nats.ConnectionOptions, codec ? : Nats.Codec < any > ) {
    return await this.connect({
      user: userCreds,
      ...options
    }, codec);
  }
  /**
   * Try to connect to the NATS server with user and password
   * 
   * @param user username to use
   * @param pass password to use
   * @param options to connect with
   */
  async connectWithUserPass(user: string, pass: string, options ? : Nats.ConnectionOptions, codec ? : Nats.Codec < any > ) {
    return await this.connect({
      user: user,
      pass: pass,
      ...options
    }, codec);
  }
  /**
   * Try to connect to the NATS server which has no authentication
   
    * @param host to connect to
    * @param options to connect with
    */
  async connectToHost(host: string, options ? : Nats.ConnectionOptions, codec ? : Nats.Codec < any > ) {
    return await this.connect({
      servers: [host],
      ...options
    }, codec);
  }

  /**
   * Try to connect to the NATS server with the different payloads.
   * @param options to use, payload is omitted if sat in the AsyncAPI document.
   */
  connect(options: Nats.ConnectionOptions, codec?: Nats.Codec<any>): Promise<{nc: Nats.NatsConnection, js: Nats.JetStreamClient}> {
    return new Promise(async (resolve, reject: (error: any) => void) => {
      if (!this.isClosed()) {
        return reject('Client is still connected, please close it first.');
      }
      this.options = options;
      if (codec) {
        this.codec = codec;
      } else {
        this.codec = Nats.JSONCodec();
      }
      try {
        this.nc = await Nats.connect(this.options);
        this.js = this.nc.jetstream();
        resolve({nc: this.nc, js: this.js});
      } catch (e: any) {
        reject('Could not connect to NATS server');
      }
    })
  }
  ${natsFunctions.join('\n')}
}`;
}
