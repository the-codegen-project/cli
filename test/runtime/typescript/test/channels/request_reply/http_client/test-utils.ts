import express, { Router, Express } from 'express';
import bodyParser from 'body-parser';
import { Server } from 'http';

/**
 * Helper function to create an Express server for HTTP client tests
 */
export function createTestServer(): {
  app: Express;
  router: Router;
  port: number;
} {
  const router = Router();
  const app = express();
  app.use(express.json({ limit: '3000kb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(router);
  
  // Generate a random port between 5779 and 9875
  const port = Math.floor(Math.random() * (9875 - 5779 + 1)) + 5779;
  
  return { app, router, port };
}

/**
 * Start an Express server and run the test function
 * This handles proper server cleanup after the test
 */
export function runWithServer(
  server: Express,
  port: number,
  testFn: (server: Server) => Promise<void>
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const httpServer = server.listen(port, async () => {
      try {
        await testFn(httpServer);
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        httpServer.close();
      }
    });
  });
}

/**
 * Helper for creating standard OAuth2 token endpoint responses
 */
export function createTokenResponse({
  accessToken,
  refreshToken,
  expiresIn = 3600
}: {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}) {
  const response: {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
  } = {
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: expiresIn
  };
  
  if (refreshToken) {
    response.refresh_token = refreshToken;
  }
  
  return response;
}

/**
 * Mock response data for tests
 */
export class TestResponses {
  static unauthorized(message = 'Unauthorized') {
    return {
      status: 401,
      body: { error: message }
    };
  }
  
  static badRequest(message = 'Bad Request') {
    return {
      status: 400,
      body: { error: message }
    };
  }
  
  static ok(body: any) {
    return {
      status: 200,
      body
    };
  }
} 