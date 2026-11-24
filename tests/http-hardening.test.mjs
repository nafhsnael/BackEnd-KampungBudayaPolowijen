import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

process.env.NODE_ENV = 'production';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.API_RATE_LIMIT_MAX = '100';
process.env.AUTH_RATE_LIMIT_MAX = '2';

const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
};
const loggedLines = [];
console.log = (...values) => loggedLines.push(values.join(' '));
console.warn = (...values) => loggedLines.push(values.join(' '));
console.error = (...values) => loggedLines.push(values.join(' '));

const [
  appModule,
  roleModule,
  errorModule,
  validationModule,
  validationUtilModule,
  eventDtoModule,
  umkmDtoModule,
  packageDtoModule,
  routineScheduleDtoModule,
  zodModule,
] = await Promise.all([
  import('../dist/app.js'),
  import('../dist/middlewares/role.middleware.js'),
  import('../dist/middlewares/error.middleware.js'),
  import('../dist/middlewares/validate.middleware.js'),
  import('../dist/utils/validation.util.js'),
  import('../dist/dtos/event.dto.js'),
  import('../dist/dtos/umkm.dto.js'),
  import('../dist/dtos/package.dto.js'),
  import('../dist/dtos/routine-schedule.dto.js'),
  import('zod'),
]);
const app = appModule.default.default ?? appModule.default;
const { requireAdmin } = roleModule;
const { globalErrorHandler } = errorModule;
const { validateBody } = validationModule;
const { parseValidatedInput } = validationUtilModule;
const { CreateEventSchema } = eventDtoModule;
const { CreateUmkmSchema } = umkmDtoModule;
const { CreatePackageSchema } = packageDtoModule;
const { CreateRoutineScheduleSchema } = routineScheduleDtoModule;
const { z } = zodModule;

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

test('health response includes a validated request ID and security headers', async () => {
  const response = await fetch(`${baseUrl}/health`, {
    headers: { 'X-Request-ID': 'smoke-test-123' },
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-request-id'), 'smoke-test-123');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
});

test('configured frontend origins may read the request ID header', async () => {
  const response = await fetch(`${baseUrl}/health`, {
    headers: { Origin: 'http://localhost:3000' },
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:3000');
  assert.match(response.headers.get('access-control-expose-headers'), /X-Request-ID/i);
});

test('untrusted request IDs are replaced and sensitive headers are not logged', async () => {
  const response = await fetch(`${baseUrl}/health`, {
    headers: {
      'X-Request-ID': 'invalid request id',
      Authorization: 'Bearer do-not-log-this-token',
      Cookie: 'session=do-not-log-this-cookie',
    },
  });

  assert.equal(response.status, 200);
  assert.match(response.headers.get('x-request-id'), /^[0-9a-f-]{36}$/i);
  assert.ok(loggedLines.length > 0);
  assert.ok(loggedLines.every((line) => !line.includes('do-not-log-this')));
});

test('malformed JSON returns 400 and invalid login input returns validation details', async () => {
  const malformedResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"email":',
  });
  assert.equal(malformedResponse.status, 400);

  const invalidResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email', password: '123' }),
  });
  const invalidBody = await invalidResponse.json();
  assert.equal(invalidResponse.status, 400);
  assert.equal(invalidBody.message, 'Validation Error');
  assert.ok(Array.isArray(invalidBody.errors));
});

test('validation middleware accepts and normalizes valid input', async () => {
  const middleware = validateBody(z.object({ name: z.string().trim().min(1) }));
  const req = { body: { name: '  Polowijen  ' } };
  let nextError;

  await new Promise((resolve) => {
    middleware(req, {}, (error) => {
      nextError = error;
      resolve();
    });
  });

  assert.equal(nextError, undefined);
  assert.deepEqual(req.body, { name: 'Polowijen' });
});

test('event and UMKM payloads are normalized and invalid values become validation errors', () => {
  const event = parseValidatedInput(CreateEventSchema, {
    name: '  Festival  ',
    eventDate: '2026-04-04',
    posterUrl: null,
  });
  assert.equal(event.name, 'Festival');

  const umkm = parseValidatedInput(CreateUmkmSchema, {
    name: '  Kerajinan  ',
    category: '  Seni  ',
    price: '12500',
  });
  assert.equal(umkm.name, 'Kerajinan');
  assert.equal(umkm.category, 'Seni');
  assert.equal(umkm.price, 12500);

  assert.throws(
    () => parseValidatedInput(CreateEventSchema, { name: ' ', eventDate: '2026-04-04' }),
    (error) => error.statusCode === 400 && error.errors.some((issue) => issue.field === 'name'),
  );
  assert.throws(
    () => parseValidatedInput(CreateUmkmSchema, { name: 'Item', category: 'Seni', price: '-1' }),
    (error) => error.statusCode === 400 && error.errors.some((issue) => issue.field === 'price'),
  );
});

test('package payloads apply defaults and reject invalid prices', () => {
  const packageData = parseValidatedInput(CreatePackageSchema, {
    name: '  Sambang Kampung  ',
    price: '125000',
  });

  assert.equal(packageData.name, 'Sambang Kampung');
  assert.equal(packageData.price, 125000);
  assert.equal(packageData.isActive, true);

  const multipartPackage = parseValidatedInput(CreatePackageSchema, {
    name: 'Paket Foto',
    price: '125000',
    isActive: 'false',
  });
  assert.equal(multipartPackage.isActive, false);

  assert.throws(
    () => parseValidatedInput(CreatePackageSchema, { name: 'Paket', price: '-1' }),
    (error) => error.statusCode === 400 && error.errors.some((issue) => issue.field === 'price'),
  );
});

test('routine schedule payloads normalize values and reject unsupported weekdays', () => {
  const schedule = parseValidatedInput(CreateRoutineScheduleSchema, {
    name: '  Sarasehan Budaya  ',
    day: 'Jumat',
    capacity: '20 Orang',
    price: 'Rp 50.000',
  });

  assert.equal(schedule.name, 'Sarasehan Budaya');
  assert.equal(schedule.day, 'Jumat');
  assert.throws(
    () => parseValidatedInput(CreateRoutineScheduleSchema, {
      name: 'Sarasehan',
      day: 'Hari Libur',
    }),
    (error) => error.statusCode === 400 && error.errors.some((issue) => issue.field === 'day'),
  );
});

test('protected admin and upload routes return 401 without a token', async () => {
  const adminResponse = await fetch(`${baseUrl}/api/admin/dashboard/stats`);
  const packagesResponse = await fetch(`${baseUrl}/api/admin/packages`);
  const schedulesResponse = await fetch(`${baseUrl}/api/admin/routine-schedules`);
  const uploadResponse = await fetch(`${baseUrl}/api/upload`, { method: 'POST' });

  assert.equal(adminResponse.status, 401);
  assert.equal(packagesResponse.status, 401);
  assert.equal(schedulesResponse.status, 401);
  assert.equal(uploadResponse.status, 401);
});

test('non-admin users are rejected with 403', () => {
  let receivedError;
  requireAdmin({ auth: { role: 'user' } }, {}, (error) => {
    receivedError = error;
  });

  assert.equal(receivedError.statusCode, 403);
});

test('unknown paths return 404 and disallowed origins return 403', async () => {
  const notFoundResponse = await fetch(`${baseUrl}/api/not-a-route`);
  const corsResponse = await fetch(`${baseUrl}/health`, {
    headers: { Origin: 'https://not-allowed.example' },
  });

  assert.equal(notFoundResponse.status, 404);
  assert.equal(corsResponse.status, 403);
});

test('unexpected errors return a sanitized 500 in production', () => {
  const response = {
    headersSent: false,
    statusCode: 0,
    body: undefined,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  globalErrorHandler(
    new Error('private database details'),
    { requestId: 'smoke-test-500' },
    response,
    () => {},
  );

  assert.equal(response.statusCode, 500);
  assert.equal(response.body.message, 'Internal Server Error');
  assert.ok(!JSON.stringify(response.body).includes('private database details'));
  assert.ok(loggedLines.some((line) => line.includes('private database details')));
});

test('sensitive endpoints return 429 after the configured limit', async () => {
  const statuses = [];

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid', password: '123' }),
    });
    statuses.push(response.status);
  }

  assert.ok(statuses.includes(429), `Expected a 429 response, received ${statuses.join(', ')}`);

  const malformedResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"email":',
  });
  assert.equal(malformedResponse.status, 429);
});

test('the general API limiter returns 429 after its configured limit', async () => {
  let finalStatus;

  for (let attempt = 0; attempt < 105; attempt += 1) {
    const response = await fetch(`${baseUrl}/api/not-a-route`);
    finalStatus = response.status;
  }

  assert.equal(finalStatus, 429);

  const malformedResponse = await fetch(`${baseUrl}/api/not-a-route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"invalid":',
  });
  assert.equal(malformedResponse.status, 429);
});
