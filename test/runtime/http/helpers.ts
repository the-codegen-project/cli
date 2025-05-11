
export type Json = any;
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
export type HTTPHeaders = { [key: string]: string };
export type HTTPQuery = { [key: string]: string | number | null | boolean | Array<string | number | null | boolean> | Set<string | number | null | boolean> | HTTPQuery };
export type HTTPBody = Json | FormData | URLSearchParams;
export type HTTPRequestInit = { headers?: HTTPHeaders; method: HTTPMethod; credentials?: RequestCredentials; body?: HTTPBody };
type stringPromise = string | Promise<string>;

interface RequestContext<RequestParams, RequestPayload> {
    requestParams: RequestParams,
    postPayload: RequestPayload,
    basePath?: string | 'http://localhost:3000'; // override base path
    username?: string; // parameter for basic security
    password?: string; // parameter for basic security
    apiKey?: stringPromise | ((name: string) => stringPromise); // parameter for apiKey security
    accessToken?: stringPromise | ((name?: string, scopes?: string[]) => stringPromise); // parameter for oauth2 security
    credentials?: RequestCredentials; //value for the credentials param we want to use on each request
    additionalHeaders?: HTTPHeaders; //header params we want to use on every request
}
type StatusCodes = 400 | 500;
export class FetchError extends Error {
    override name: "FetchError" = "FetchError";
    code: StatusCodes
    constructor(public cause: Error, code: StatusCodes) {
        let msg: string = 'unknown';
        if(code === 400) {
            msg = 'Pet not found'
        }
        super(msg);
        this.code = code
    }
}

async function addPet(context: RequestContext<any, any>): Promise<any> {
    const headers = Object.assign({
        'Content-Type': 'application/json'
    }, context.additionalHeaders);
    let url = context.basePath + '/pet';

    let body: any;
    if(context.postPayload) {
        body = context.postPayload.marshal();
    }
    if (context.accessToken) {
        // oauth required
        headers["Authorization"] = typeof context.accessToken === 'string' ? context.accessToken : await context.accessToken("petstore_auth", ["write:pets", "read:pets"]);
    }

    const response = await fetch('/pet', {
        method: 'POST',
        headers: headers,
        body: '{}',
        credentials: context.credentials,
    })	
    if(response.status === 401) {
        return Promise.reject(new FetchError(response, response.status))
    } else if {

    }
    const { data, errors } = await response.json()
	if (response.ok) {
		return ReplyMessage.marshal(data)
	} else {
		// handle the graphql errors
		const error = new Error(
			errors?.map((e) => e.message).join('\n') ?? 'unknown',
		)
		return Promise.reject(error);
	}
}