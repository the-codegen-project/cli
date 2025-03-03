/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable security/detect-object-injection */

import {ChannelInterface, OperationInterface, OperationReplyInterface} from '@asyncapi/parser';
import {platform} from 'process';
import {pascalCase} from './generators/typescript/utils';

/**
 * Deep partial type that does NOT partial function arguments.
 */
export type DeepPartial<T> = T extends Function
  ? T
  : T extends object
    ? {[P in keyof T]?: DeepPartial<T[P]>}
    : T;

/**
 * Return true or false based on whether the input object is a regular object or a class
 *
 * Taken from: https://stackoverflow.com/a/43197340/6803886
 * @param obj
 */
function isClass(obj: any): boolean {
  const isCtorClass =
    obj.constructor && obj.constructor.toString().substring(0, 5) === 'class';
  if (obj.prototype === undefined) {
    return isCtorClass;
  }
  const isPrototypeCtorClass =
    obj.prototype.constructor &&
    obj.prototype.constructor.toString &&
    obj.prototype.constructor.toString().substring(0, 5) === 'class';
  return isCtorClass || isPrototypeCtorClass;
}

/**
 * Merge a non optional value with custom optional values to form a full value that has all properties sat.
 */
export function mergePartialAndDefault<T extends Record<string, any>>(
  defaultNonOptional: T,
  customOptional?: DeepPartial<T>
): T {
  if (customOptional === undefined) {
    return Object.assign({}, defaultNonOptional);
  }
  // create a new object
  const target = Object.assign({}, defaultNonOptional) as Record<string, any>;

  // deep merge the object into the target object
  for (const [propName, prop] of Object.entries(customOptional)) {
    const isObjectOrClass =
      typeof prop === 'object' && target[propName] !== undefined;
    const isRegularObject = !isClass(prop);
    const isArray = Array.isArray(prop);
    if (isArray) {
      // merge array into target with a new array instance so we dont touch the default value
      target[propName] = ensureUniqueValuesInArray([
        ...(target[propName] ?? []),
        ...(prop ?? [])
      ]);
    } else if (isObjectOrClass && isRegularObject) {
      target[propName] = mergePartialAndDefault(target[propName], prop);
    } else if (prop) {
      target[propName] = prop;
    }
  }

  return target as T;
}

/**
 * Find duplicates in array of objects based on property
 */
export function findDuplicatesInArray(array: any[], property: string) {
  const foundValues = array.map((generator) => {
    return generator[property];
  });
  const duplicates = foundValues.filter(
    (item, index) => foundValues.indexOf(item) !== index
  );
  return Array.from(new Set(duplicates));
}

/**
 * Get OS type, abstracted away from special cases
 */
export function getOSType(): 'windows' | 'unix' | 'macos' {
  if (platform === 'win32') {
    return 'windows';
  }
  if (platform === 'darwin') {
    return 'macos';
  }
  return 'unix';
}

/**
 * Windows renders relative paths weird i.e. '\' instead of '/'
 */
export function ensureRelativePath(pathToCheck: string) {
  if (getOSType() === 'windows') {
    return pathToCheck.replaceAll('\\', '/');
  }
  return pathToCheck;
}

/**
 * Ensure array has unique values only.
 */
export function ensureUniqueValuesInArray(array: any[]) {
  return array.filter((value, index, filteredArray) => {
    return filteredArray.indexOf(value) === index;
  });
}
export function findExtensionObject(parsedObj: any): any {
  return parsedObj?.extensions()?.get('x-the-codegen-project')?.value();
}

export function findNameFromChannel(channel: ChannelInterface): string {
  const channelId = channel.id();
  const userSpecificName = findExtensionObject(channel)
    ? findExtensionObject(channel)['channelName']
    : undefined;
  if (userSpecificName) {
    return userSpecificName;
  }
  return pascalCase(channelId.replace(/\W/g, ' '));
}
export function findOperationId(
  operation: OperationInterface,
  channel: ChannelInterface
) {
  const userSpecificName = findExtensionObject(operation)
    ? findExtensionObject(operation)['channelName']
    : undefined;
  if (userSpecificName) {
    return userSpecificName;
  }
  let operationId = operation.id();
  operationId = operation.hasOperationId()
    ? operation.operationId()
    : operationId;
  return operationId ?? channel.id();
}
export function findNameFromOperation(
  operation: OperationInterface,
  channel: ChannelInterface
): string {
  const operationId = findOperationId(operation, channel);
  return pascalCase(operationId.replace(/\W/g, ' '));
}

export function firstLowercase(name: string) {
  return name.charAt(0).toLowerCase() + name.slice(1);
}

export function findReplyId(
  operation: OperationInterface,
  reply: OperationReplyInterface,
  channel: ChannelInterface
) {
  return `${findOperationId(operation, reply.channel() ?? channel)}_reply`;
}
