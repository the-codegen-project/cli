import express, { Router, Express } from 'express';
import bodyParser from 'body-parser';
import { Server } from 'http';

/**
 * Generate a random port between min and max (inclusive)
 */
function getRandomPort(min = 5779, max = 9875): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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
  const port = getRandomPort();

  return { app, router, port };
}

/**
 * Start an Express server and run the test function
 * This handles proper server cleanup after the test
 * Automatically retries with a different port on EADDRINUSE errors
 */
export function runWithServer(
  server: Express,
  port: number,
  testFn: (server: Server) => Promise<void>,
  maxRetries = 5
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let retries = 0;
    let currentPort = port;

    const tryListen = () => {
      const httpServer = server.listen(currentPort);

      httpServer.on('listening', async () => {
        try {
          await testFn(httpServer);
          resolve();
        } catch (error) {
          reject(error);
        } finally {
          httpServer.close();
        }
      });

      httpServer.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE' && retries < maxRetries) {
          retries++;
          currentPort = getRandomPort();
          httpServer.close();
          tryListen();
        } else {
          reject(error);
        }
      });
    };

    tryListen();
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