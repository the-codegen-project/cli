import {APet} from './../payloads/APet';
import * as AddPetResponseModule from './../payloads/AddPetResponse';
import * as UpdatePetResponseModule from './../payloads/UpdatePetResponse';
import * as FindPetsByStatusAndCategoryResponseModule from './../payloads/FindPetsByStatusAndCategoryResponse';
import {PetCategory} from './../payloads/PetCategory';
import {PetTag} from './../payloads/PetTag';
import {Status} from './../payloads/Status';
import {OneOf_0Status} from './../payloads/OneOf_0Status';
import {OneOf_0ItemStatus} from './../payloads/OneOf_0ItemStatus';
import {PetOrder} from './../payloads/PetOrder';
import {AUser} from './../payloads/AUser';
import {AnUploadedResponse} from './../payloads/AnUploadedResponse';
import {FindPetsByStatusAndCategoryParameters} from './../parameters/FindPetsByStatusAndCategoryParameters';
import * as NodeFetch from 'node-fetch';
export const Protocols = {
http_client: {
  async postAddPet(context: {
    server?: 'http://petstore.swagger.io/v2' | string;
    payload: APet;
    path?: string;
    headers?: Record<string, string | string[]>; // header params we want to use on every request
    makeRequestCallback?: ({
      method, body, url, headers
    }: {
      url: string, 
      headers?: Record<string, string | string[]>,
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD',
      body?: any
    }) => Promise<{
      ok: boolean,
      status: number,
      statusText: string,
      json: () => Record<any, any> | Promise<Record<any, any>>,
    }>
  }): Promise<{error?: string, statusCode: number, payload?: AddPetResponseModule.AddPetResponse, rawResponse?: any, rawData?: any}> {
  const parsedContext = {
    ...{
      makeRequestCallback: async ({url, body, method, headers}) => {
        return NodeFetch.default(url, {
          body,
          method,
          headers
        })
      },
      path: '/pet',
      server: 'http://petstore.swagger.io/v2',
    },
    ...context,
  }

  const headers = {
    'Content-Type': 'application/json',
    ...parsedContext.headers
  };
  
  const url = `${parsedContext.server}${parsedContext.path}`;

  let body: any;
  if (parsedContext.payload) {
    body = parsedContext.payload.marshal();
  }

  // Make the API request
  const response = await parsedContext.makeRequestCallback({
    url,
    method: 'POST',
    headers,
    body
  });	
  
  // For multi-status responses, always try to parse JSON and let unmarshalByStatusCode handle it
  try {
    const data = await response.json();
    return {...AddPetResponseModule.unmarshalByStatusCode(data, response.status), rawData: data, rawResponse: response, statusCode: response.status};
  } catch (error) {
    return {error: `Error parsing JSON response: ${error}`, statusCode: response.status, rawResponse: response};
  }
},
async putUpdatePet(context: {
    server?: 'http://petstore.swagger.io/v2' | string;
    payload: APet;
    path?: string;
    headers?: Record<string, string | string[]>; // header params we want to use on every request
    makeRequestCallback?: ({
      method, body, url, headers
    }: {
      url: string, 
      headers?: Record<string, string | string[]>,
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD',
      body?: any
    }) => Promise<{
      ok: boolean,
      status: number,
      statusText: string,
      json: () => Record<any, any> | Promise<Record<any, any>>,
    }>
  }): Promise<{error?: string, statusCode: number, payload?: UpdatePetResponseModule.UpdatePetResponse, rawResponse?: any, rawData?: any}> {
  const parsedContext = {
    ...{
      makeRequestCallback: async ({url, body, method, headers}) => {
        return NodeFetch.default(url, {
          body,
          method,
          headers
        })
      },
      path: '/pet',
      server: 'http://petstore.swagger.io/v2',
    },
    ...context,
  }

  const headers = {
    'Content-Type': 'application/json',
    ...parsedContext.headers
  };
  
  const url = `${parsedContext.server}${parsedContext.path}`;

  let body: any;
  if (parsedContext.payload) {
    body = parsedContext.payload.marshal();
  }

  // Make the API request
  const response = await parsedContext.makeRequestCallback({
    url,
    method: 'PUT',
    headers,
    body
  });	
  
  // For multi-status responses, always try to parse JSON and let unmarshalByStatusCode handle it
  try {
    const data = await response.json();
    return {...UpdatePetResponseModule.unmarshalByStatusCode(data, response.status), rawData: data, rawResponse: response, statusCode: response.status};
  } catch (error) {
    return {error: `Error parsing JSON response: ${error}`, statusCode: response.status, rawResponse: response};
  }
},
async getFindPetsByStatusAndCategory(context: {
    server?: 'http://petstore.swagger.io/v2' | string;
    
    path?: string;
    headers?: Record<string, string | string[]>; // header params we want to use on every request
    makeRequestCallback?: ({
      method, body, url, headers
    }: {
      url: string, 
      headers?: Record<string, string | string[]>,
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD',
      body?: any
    }) => Promise<{
      ok: boolean,
      status: number,
      statusText: string,
      json: () => Record<any, any> | Promise<Record<any, any>>,
    }>
  }): Promise<{error?: string, statusCode: number, payload?: FindPetsByStatusAndCategoryResponseModule.FindPetsByStatusAndCategoryResponse, rawResponse?: any, rawData?: any}> {
  const parsedContext = {
    ...{
      makeRequestCallback: async ({url, body, method, headers}) => {
        return NodeFetch.default(url, {
          body,
          method,
          headers
        })
      },
      path: '/pet/findByStatus/{status}/{categoryId}',
      server: 'http://petstore.swagger.io/v2',
    },
    ...context,
  }

  const headers = {
    'Content-Type': 'application/json',
    ...parsedContext.headers
  };
  
  const url = `${parsedContext.server}${parsedContext.path}`;

  let body: any;
  

  // Make the API request
  const response = await parsedContext.makeRequestCallback({
    url,
    method: 'GET',
    headers,
    body
  });	
  
  // For multi-status responses, always try to parse JSON and let unmarshalByStatusCode handle it
  try {
    const data = await response.json();
    return {...FindPetsByStatusAndCategoryResponseModule.unmarshalByStatusCode(data, response.status), rawData: data, rawResponse: response, statusCode: response.status};
  } catch (error) {
    return {error: `Error parsing JSON response: ${error}`, statusCode: response.status, rawResponse: response};
  }
}
}};