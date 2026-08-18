import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { app } from './app.ts';
import packageJson from '../package.json' with { type: 'json' };

const withServer = async (run: (baseUrl: string) => Promise<void>) => {
  const server = app.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    await run(`http://localhost:${port}`);
  } finally {
    server.close();
  }
};

test('GET / returns a greeting including the package version', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(baseUrl);

    assert.equal(response.status, 200);
    const body = await response.text();
    assert.equal(body, `Hello World! (v${packageJson.version})`);
  });
});

test('POST /furiganaTransformation returns 400 when the payload is not an array', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/furiganaTransformation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foo: 'bar' }),
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.error, 'Request body must be an array of strings.');
  });
});

test('POST /furiganaTransformation returns 400 when the array contains non-string items', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/furiganaTransformation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(['漢字', 42]),
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.error, 'Request body must be an array of strings.');
  });
});

test('POST /chorusSeparators returns 400 when the payload is not an array', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/chorusSeparators`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foo: 'bar' }),
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.error, 'Request body must be an array of strings.');
  });
});

test('POST /chorusSeparators returns 400 when the array contains non-string items', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/chorusSeparators`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(['漢字', 42]),
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.error, 'Request body must be an array of strings.');
  });
});

test('POST /chorusSeparators wraps the most frequent line with separators above and below', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/chorusSeparators`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(['verse one', 'chorus', 'verse two', 'chorus']),
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(body, [
      'verse one',
      '-----------------------------',
      'chorus',
      '-----------------------------',
      'verse two',
      '-----------------------------',
      'chorus',
      '-----------------------------',
    ]);
  });
});
