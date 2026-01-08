import {UserSignedUp} from './../payloads/UserSignedUp';
import * as StringMessageModule from './../payloads/StringMessage';
import * as ArrayMessageModule from './../payloads/ArrayMessage';
import * as UnionMessageModule from './../payloads/UnionMessage';
import {AnonymousSchema_9} from './../payloads/AnonymousSchema_9';
import {UserSignedupParameters} from './../parameters/UserSignedupParameters';
import {UserSignedUpHeaders} from './../headers/UserSignedUpHeaders';
import { NextFunction, Request, Response, Router } from 'express';
import { fetchEventSource, EventStreamContentType, EventSourceMessage } from '@ai-zen/node-fetch-event-source';

function registerSendUserSignedup({
  router, 
  callback
}: {
  router: Router, 
  callback: ((req: Request, res: Response, next: NextFunction, parameters: UserSignedupParameters, sendEvent: (message: UserSignedUp) => void) => void) | ((req: Request, res: Response, next: NextFunction, parameters: UserSignedupParameters, sendEvent: (message: UserSignedUp) => void) => Promise<void>)
}): void {
  const event = '/user/signedup/:my_parameter/:enum_parameter';
  router.get(event, async (req, res, next) => {
    const listenParameters = UserSignedupParameters.createFromChannel(req.originalUrl.startsWith('/') ? req.originalUrl.slice(1) : req.originalUrl, 'user/signedup/{my_parameter}/{enum_parameter}', /^user\/signedup\/([^.]*)\/([^.]*)$/);
    res.writeHead(200, {
      'Cache-Control': 'no-cache, no-transform',
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })
    const sendEventCallback = (message: UserSignedUp) => {
      if (res.closed) {
        return
      }
      res.write(`event: ${event}\n`)
      res.write(`data: ${message.marshal()}\n\n`)
    }
    await callback(req, res, next, listenParameters, sendEventCallback)
  })
}


/**
 * Event source fetch for `user/signedup/{my_parameter}/{enum_parameter}`
 *
  * @param callback to call when receiving events
 * @param parameters for listening
 * @param headers optional headers to include with the EventSource connection
 * @param options additionally used to handle the event source
 * @param skipMessageValidation turn off runtime validation of incoming messages
 * @returns A cleanup function to abort the connection
 */
function listenForReceiveUserSignedup({
  callback, 
  parameters, 
  headers, 
  options, 
  skipMessageValidation = false
}: {
  callback: (params: {error?: Error, messageEvent?: UserSignedUp}) => void, 
  parameters: UserSignedupParameters, 
  headers?: UserSignedUpHeaders, 
  options: {authorization?: string, onClose?: (err?: string) => void, baseUrl: string, headers?: Record<string, string>}, 
  skipMessageValidation?: boolean
}): (() => void) {
	const controller = new AbortController();
	let eventsUrl: string = parameters.getChannelWithParameters('user/signedup/{my_parameter}/{enum_parameter}');
	const url = `${options.baseUrl}/${eventsUrl}`
  const requestHeaders: Record<string, string> = {
	  ...options.headers ?? {},
    Accept: 'text/event-stream'
  }
  if(options.authorization) {
    requestHeaders['authorization'] = `Bearer ${options?.authorization}`;
  }
  // Add headers from AsyncAPI specification if provided
  if (headers) {
    const asyncApiHeaderData = headers.marshal();
    const parsedAsyncApiHeaders = typeof asyncApiHeaderData === 'string' ? JSON.parse(asyncApiHeaderData) : asyncApiHeaderData;
    for (const [key, value] of Object.entries(parsedAsyncApiHeaders)) {
      if (value !== undefined) {
        requestHeaders[key] = String(value);
      }
    }
  }
  const validator = UserSignedUp.createValidator();
	fetchEventSource(`${url}`, {
		method: 'GET',
		headers: requestHeaders,
		signal: controller.signal,
		onmessage: (ev: EventSourceMessage) => {
      const receivedData = ev.data;
      if(!skipMessageValidation) {
    const {valid, errors} = UserSignedUp.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      return callback({error: new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), messageEvent: undefined});
    }
  }
      const callbackData = UserSignedUp.unmarshal(receivedData);
			callback({error: undefined, messageEvent: callbackData});
		},
		onerror: (err) => {
			options.onClose?.(err);
		},
		onclose: () => {
			options.onClose?.();
		},
		async onopen(response: { ok: any; headers: any; status: number }) {
			if (response.ok && response.headers.get('content-type') === EventStreamContentType) {
				return // everything's good
			} else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
				// client-side errors are usually non-retriable:
				callback({error: new Error('Client side error, could not open event connection'), messageEvent: undefined})
			} else {
				callback({error: new Error('Unknown error, could not open event connection'), messageEvent: undefined});
			}
		},
	});
	
	return () => {
		controller.abort();
	};
}


/**
 * Event source fetch for `noparameters`
 *
  * @param callback to call when receiving events
 * @param headers optional headers to include with the EventSource connection
 * @param options additionally used to handle the event source
 * @param skipMessageValidation turn off runtime validation of incoming messages
 * @returns A cleanup function to abort the connection
 */
function listenForNoParameter({
  callback, 
  headers, 
  options, 
  skipMessageValidation = false
}: {
  callback: (params: {error?: Error, messageEvent?: UserSignedUp}) => void, 
  headers?: UserSignedUpHeaders, 
  options: {authorization?: string, onClose?: (err?: string) => void, baseUrl: string, headers?: Record<string, string>}, 
  skipMessageValidation?: boolean
}): (() => void) {
	const controller = new AbortController();
	let eventsUrl: string = 'noparameters';
	const url = `${options.baseUrl}/${eventsUrl}`
  const requestHeaders: Record<string, string> = {
	  ...options.headers ?? {},
    Accept: 'text/event-stream'
  }
  if(options.authorization) {
    requestHeaders['authorization'] = `Bearer ${options?.authorization}`;
  }
  // Add headers from AsyncAPI specification if provided
  if (headers) {
    const asyncApiHeaderData = headers.marshal();
    const parsedAsyncApiHeaders = typeof asyncApiHeaderData === 'string' ? JSON.parse(asyncApiHeaderData) : asyncApiHeaderData;
    for (const [key, value] of Object.entries(parsedAsyncApiHeaders)) {
      if (value !== undefined) {
        requestHeaders[key] = String(value);
      }
    }
  }
  const validator = UserSignedUp.createValidator();
	fetchEventSource(`${url}`, {
		method: 'GET',
		headers: requestHeaders,
		signal: controller.signal,
		onmessage: (ev: EventSourceMessage) => {
      const receivedData = ev.data;
      if(!skipMessageValidation) {
    const {valid, errors} = UserSignedUp.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      return callback({error: new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), messageEvent: undefined});
    }
  }
      const callbackData = UserSignedUp.unmarshal(receivedData);
			callback({error: undefined, messageEvent: callbackData});
		},
		onerror: (err) => {
			options.onClose?.(err);
		},
		onclose: () => {
			options.onClose?.();
		},
		async onopen(response: { ok: any; headers: any; status: number }) {
			if (response.ok && response.headers.get('content-type') === EventStreamContentType) {
				return // everything's good
			} else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
				// client-side errors are usually non-retriable:
				callback({error: new Error('Client side error, could not open event connection'), messageEvent: undefined})
			} else {
				callback({error: new Error('Unknown error, could not open event connection'), messageEvent: undefined});
			}
		},
	});
	
	return () => {
		controller.abort();
	};
}


function registerNoParameter({
  router, 
  callback
}: {
  router: Router, 
  callback: ((req: Request, res: Response, next: NextFunction, sendEvent: (message: UserSignedUp) => void) => void) | ((req: Request, res: Response, next: NextFunction, sendEvent: (message: UserSignedUp) => void) => Promise<void>)
}): void {
  const event = '/noparameters';
  router.get(event, async (req, res, next) => {
    
    res.writeHead(200, {
      'Cache-Control': 'no-cache, no-transform',
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })
    const sendEventCallback = (message: UserSignedUp) => {
      if (res.closed) {
        return
      }
      res.write(`event: ${event}\n`)
      res.write(`data: ${message.marshal()}\n\n`)
    }
    await callback(req, res, next,  sendEventCallback)
  })
}


function registerSendStringPayload({
  router, 
  callback
}: {
  router: Router, 
  callback: ((req: Request, res: Response, next: NextFunction, sendEvent: (message: StringMessageModule.StringMessage) => void) => void) | ((req: Request, res: Response, next: NextFunction, sendEvent: (message: StringMessageModule.StringMessage) => void) => Promise<void>)
}): void {
  const event = '/string/payload';
  router.get(event, async (req, res, next) => {
    
    res.writeHead(200, {
      'Cache-Control': 'no-cache, no-transform',
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })
    const sendEventCallback = (message: StringMessageModule.StringMessage) => {
      if (res.closed) {
        return
      }
      res.write(`event: ${event}\n`)
      res.write(`data: ${StringMessageModule.marshal(message)}\n\n`)
    }
    await callback(req, res, next,  sendEventCallback)
  })
}


/**
 * Event source fetch for `string/payload`
 *
  * @param callback to call when receiving events
 * @param options additionally used to handle the event source
 * @param skipMessageValidation turn off runtime validation of incoming messages
 * @returns A cleanup function to abort the connection
 */
function listenForReceiveStringPayload({
  callback, 
  options, 
  skipMessageValidation = false
}: {
  callback: (params: {error?: Error, messageEvent?: StringMessageModule.StringMessage}) => void, 
  options: {authorization?: string, onClose?: (err?: string) => void, baseUrl: string, headers?: Record<string, string>}, 
  skipMessageValidation?: boolean
}): (() => void) {
	const controller = new AbortController();
	let eventsUrl: string = 'string/payload';
	const url = `${options.baseUrl}/${eventsUrl}`
  const requestHeaders: Record<string, string> = {
	  ...options.headers ?? {},
    Accept: 'text/event-stream'
  }
  if(options.authorization) {
    requestHeaders['authorization'] = `Bearer ${options?.authorization}`;
  }
  
  const validator = StringMessageModule.createValidator();
	fetchEventSource(`${url}`, {
		method: 'GET',
		headers: requestHeaders,
		signal: controller.signal,
		onmessage: (ev: EventSourceMessage) => {
      const receivedData = ev.data;
      if(!skipMessageValidation) {
    const {valid, errors} = StringMessageModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      return callback({error: new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), messageEvent: undefined});
    }
  }
      const callbackData = StringMessageModule.unmarshal(receivedData);
			callback({error: undefined, messageEvent: callbackData});
		},
		onerror: (err) => {
			options.onClose?.(err);
		},
		onclose: () => {
			options.onClose?.();
		},
		async onopen(response: { ok: any; headers: any; status: number }) {
			if (response.ok && response.headers.get('content-type') === EventStreamContentType) {
				return // everything's good
			} else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
				// client-side errors are usually non-retriable:
				callback({error: new Error('Client side error, could not open event connection'), messageEvent: undefined})
			} else {
				callback({error: new Error('Unknown error, could not open event connection'), messageEvent: undefined});
			}
		},
	});
	
	return () => {
		controller.abort();
	};
}


function registerSendArrayPayload({
  router, 
  callback
}: {
  router: Router, 
  callback: ((req: Request, res: Response, next: NextFunction, sendEvent: (message: ArrayMessageModule.ArrayMessage) => void) => void) | ((req: Request, res: Response, next: NextFunction, sendEvent: (message: ArrayMessageModule.ArrayMessage) => void) => Promise<void>)
}): void {
  const event = '/array/payload';
  router.get(event, async (req, res, next) => {
    
    res.writeHead(200, {
      'Cache-Control': 'no-cache, no-transform',
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })
    const sendEventCallback = (message: ArrayMessageModule.ArrayMessage) => {
      if (res.closed) {
        return
      }
      res.write(`event: ${event}\n`)
      res.write(`data: ${ArrayMessageModule.marshal(message)}\n\n`)
    }
    await callback(req, res, next,  sendEventCallback)
  })
}


/**
 * Event source fetch for `array/payload`
 *
  * @param callback to call when receiving events
 * @param options additionally used to handle the event source
 * @param skipMessageValidation turn off runtime validation of incoming messages
 * @returns A cleanup function to abort the connection
 */
function listenForReceiveArrayPayload({
  callback, 
  options, 
  skipMessageValidation = false
}: {
  callback: (params: {error?: Error, messageEvent?: ArrayMessageModule.ArrayMessage}) => void, 
  options: {authorization?: string, onClose?: (err?: string) => void, baseUrl: string, headers?: Record<string, string>}, 
  skipMessageValidation?: boolean
}): (() => void) {
	const controller = new AbortController();
	let eventsUrl: string = 'array/payload';
	const url = `${options.baseUrl}/${eventsUrl}`
  const requestHeaders: Record<string, string> = {
	  ...options.headers ?? {},
    Accept: 'text/event-stream'
  }
  if(options.authorization) {
    requestHeaders['authorization'] = `Bearer ${options?.authorization}`;
  }
  
  const validator = ArrayMessageModule.createValidator();
	fetchEventSource(`${url}`, {
		method: 'GET',
		headers: requestHeaders,
		signal: controller.signal,
		onmessage: (ev: EventSourceMessage) => {
      const receivedData = ev.data;
      if(!skipMessageValidation) {
    const {valid, errors} = ArrayMessageModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      return callback({error: new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), messageEvent: undefined});
    }
  }
      const callbackData = ArrayMessageModule.unmarshal(receivedData);
			callback({error: undefined, messageEvent: callbackData});
		},
		onerror: (err) => {
			options.onClose?.(err);
		},
		onclose: () => {
			options.onClose?.();
		},
		async onopen(response: { ok: any; headers: any; status: number }) {
			if (response.ok && response.headers.get('content-type') === EventStreamContentType) {
				return // everything's good
			} else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
				// client-side errors are usually non-retriable:
				callback({error: new Error('Client side error, could not open event connection'), messageEvent: undefined})
			} else {
				callback({error: new Error('Unknown error, could not open event connection'), messageEvent: undefined});
			}
		},
	});
	
	return () => {
		controller.abort();
	};
}


function registerSendUnionPayload({
  router, 
  callback
}: {
  router: Router, 
  callback: ((req: Request, res: Response, next: NextFunction, sendEvent: (message: UnionMessageModule.UnionMessage) => void) => void) | ((req: Request, res: Response, next: NextFunction, sendEvent: (message: UnionMessageModule.UnionMessage) => void) => Promise<void>)
}): void {
  const event = '/union/payload';
  router.get(event, async (req, res, next) => {
    
    res.writeHead(200, {
      'Cache-Control': 'no-cache, no-transform',
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })
    const sendEventCallback = (message: UnionMessageModule.UnionMessage) => {
      if (res.closed) {
        return
      }
      res.write(`event: ${event}\n`)
      res.write(`data: ${UnionMessageModule.marshal(message)}\n\n`)
    }
    await callback(req, res, next,  sendEventCallback)
  })
}


/**
 * Event source fetch for `union/payload`
 *
  * @param callback to call when receiving events
 * @param options additionally used to handle the event source
 * @param skipMessageValidation turn off runtime validation of incoming messages
 * @returns A cleanup function to abort the connection
 */
function listenForReceiveUnionPayload({
  callback, 
  options, 
  skipMessageValidation = false
}: {
  callback: (params: {error?: Error, messageEvent?: UnionMessageModule.UnionMessage}) => void, 
  options: {authorization?: string, onClose?: (err?: string) => void, baseUrl: string, headers?: Record<string, string>}, 
  skipMessageValidation?: boolean
}): (() => void) {
	const controller = new AbortController();
	let eventsUrl: string = 'union/payload';
	const url = `${options.baseUrl}/${eventsUrl}`
  const requestHeaders: Record<string, string> = {
	  ...options.headers ?? {},
    Accept: 'text/event-stream'
  }
  if(options.authorization) {
    requestHeaders['authorization'] = `Bearer ${options?.authorization}`;
  }
  
  const validator = UnionMessageModule.createValidator();
	fetchEventSource(`${url}`, {
		method: 'GET',
		headers: requestHeaders,
		signal: controller.signal,
		onmessage: (ev: EventSourceMessage) => {
      const receivedData = ev.data;
      if(!skipMessageValidation) {
    const {valid, errors} = UnionMessageModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      return callback({error: new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), messageEvent: undefined});
    }
  }
      const callbackData = UnionMessageModule.unmarshal(receivedData);
			callback({error: undefined, messageEvent: callbackData});
		},
		onerror: (err) => {
			options.onClose?.(err);
		},
		onclose: () => {
			options.onClose?.();
		},
		async onopen(response: { ok: any; headers: any; status: number }) {
			if (response.ok && response.headers.get('content-type') === EventStreamContentType) {
				return // everything's good
			} else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
				// client-side errors are usually non-retriable:
				callback({error: new Error('Client side error, could not open event connection'), messageEvent: undefined})
			} else {
				callback({error: new Error('Unknown error, could not open event connection'), messageEvent: undefined});
			}
		},
	});
	
	return () => {
		controller.abort();
	};
}


export { registerSendUserSignedup, listenForReceiveUserSignedup, listenForNoParameter, registerNoParameter, registerSendStringPayload, listenForReceiveStringPayload, registerSendArrayPayload, listenForReceiveArrayPayload, registerSendUnionPayload, listenForReceiveUnionPayload };
