import express, { Router, Express } from 'express';
import bodyParser from 'body-parser';
import { Server, AddressInfo } from 'http';

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

  // Return a placeholder port - actual port will be assigned dynamically
  return { app, router, port: 0 };
}

/**
 * Start an Express server and run the test function
 * This handles proper server cleanup after the test.
 * Uses port 0 to let the OS assign an available port, avoiding EADDRINUSE errors.
 */
export function runWithServer(
  server: Express,
  _port: number,
  testFn: (server: Server, port: number) => Promise<void>
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    // Use port 0 to let the OS assign an available port
    const httpServer = server.listen(0);

    httpServer.on('error', (error) => {
      reject(error);
    });

    httpServer.on('listening', async () => {
      const address = httpServer.address() as AddressInfo;
      const assignedPort = address.port;
      try {
        await testFn(httpServer, assignedPort);
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