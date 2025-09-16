import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

// Mock server for API calls
const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());