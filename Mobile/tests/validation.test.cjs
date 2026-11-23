const test = require('node:test');
const assert = require('node:assert/strict');
const {
  changePasswordSchema,
  loginSchema,
  profileSchema,
  registerSchema,
  umkmQuerySchema,
} = require('../dist/dtos');

test('register validates password confirmation and normalizes email', () => {
  const valid = registerSchema.parse({
    name: 'Sari',
    email: 'SARI@example.com',
    password: 'rahasia1',
    passwordConfirmation: 'rahasia1',
  });
  assert.equal(valid.email, 'sari@example.com');
  assert.equal(registerSchema.safeParse({
    ...valid,
    passwordConfirmation: 'beda',
  }).success, false);
});

test('login requires a valid email and a six-character password', () => {
  assert.equal(loginSchema.safeParse({ email: 'invalid', password: '12345' }).success, false);
  assert.equal(loginSchema.safeParse({ email: 'user@example.com', password: '123456' }).success, true);
});

test('profile update accepts an optional name so photo-only updates can be checked by the route', () => {
  assert.equal(profileSchema.safeParse({}).success, true);
  assert.equal(profileSchema.safeParse({ name: 'Sari' }).success, true);
});

test('password change requires matching confirmation', () => {
  assert.equal(changePasswordSchema.safeParse({
    currentPassword: 'lama123',
    password: 'baru123',
    passwordConfirmation: 'salah',
  }).success, false);
});

test('UMKM query applies default pagination and caps page size', () => {
  assert.deepEqual(umkmQuerySchema.parse({}), { page: 1, per_page: 10 });
  assert.equal(umkmQuerySchema.safeParse({ per_page: 51 }).success, false);
});
