// Tests for api/ask.js. Run with `node --test test/` from the repository root.
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');

const HANDLER = path.join(__dirname, '..', 'api', 'ask.js');
const DONE_MARK = '\u0000OK';
const FAIL_MARK = '\u0000ERR';

process.env.ANTHROPIC_API_KEY = 'test-key';

function load(model) {
  if (model) process.env.ANTHROPIC_MODEL = model;
  else delete process.env.ANTHROPIC_MODEL;
  delete require.cache[HANDLER];
  return require(HANDLER);
}

function sse(events) {
  return events.map((e) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join('');
}

function answer(stopReason) {
  return sse([
    { type: 'message_start', message: {} },
    { type: 'content_block_start', index: 0, content_block: { type: 'thinking', thinking: '' } },
    { type: 'content_block_stop', index: 0 },
    { type: 'content_block_start', index: 1, content_block: { type: 'text', text: '' } },
    { type: 'content_block_delta', index: 1, delta: { type: 'text_delta', text: 'He has worked on several projects, including' } },
    { type: 'content_block_stop', index: 1 },
    { type: 'message_delta', delta: { stop_reason: stopReason }, usage: {} },
    { type: 'message_stop' },
  ]);
}

// Serves the profile JSON files and the Messages API stream, and records the Messages API request body.
function stubFetch(stream) {
  const calls = [];
  global.fetch = async (url, opts) => {
    if (String(url).endsWith('/v1/messages')) {
      calls.push(JSON.parse(opts.body));
      return new Response(stream, { status: 200 });
    }
    return new Response('{}', { status: 200 });
  };
  return calls;
}

let ip = 0;
async function ask(handler) {
  const req = { method: 'POST', headers: { 'x-forwarded-for': `10.0.0.${++ip}` }, body: { messages: [{ role: 'user', content: 'What has he built?' }] } };
  let out = '';
  const res = {
    writableEnded: false,
    statusCode: 200,
    on() {},
    status(code) { this.statusCode = code; return this; },
    json(body) { out = JSON.stringify(body); this.writableEnded = true; return this; },
    writeHead(code) { this.statusCode = code; },
    write(chunk) { out += chunk; },
    end(chunk = '') { out += chunk; this.writableEnded = true; },
  };
  await handler(req, res);
  return { status: res.statusCode, body: out };
}

for (const stopReason of ['max_tokens', 'refusal', null]) {
  test(`stop_reason ${stopReason} ends with FAIL_MARK and is logged`, async (t) => {
    const handler = load();
    stubFetch(answer(stopReason));
    const logged = [];
    t.mock.method(console, 'error', (...args) => logged.push(args.map(String).join(' ')));
    const { status, body } = await ask(handler);
    assert.strictEqual(status, 200);
    assert.ok(body.endsWith(FAIL_MARK), JSON.stringify(body));
    assert.ok(logged.some((l) => l.includes(`stop_reason: ${stopReason}`)), logged.join('\n'));
  });
}

for (const stopReason of ['end_turn', 'stop_sequence']) {
  test(`stop_reason ${stopReason} ends with DONE_MARK`, async () => {
    const handler = load();
    stubFetch(answer(stopReason));
    const { body } = await ask(handler);
    assert.strictEqual(body, `He has worked on several projects, including${DONE_MARK}`);
  });
}

test('default model request has a larger max_tokens and low effort', async () => {
  const handler = load();
  const calls = stubFetch(answer('end_turn'));
  await ask(handler);
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].model, 'claude-haiku-5-5');
  assert.ok(calls[0].max_tokens >= 2000, `max_tokens ${calls[0].max_tokens}`);
  assert.strictEqual(calls[0].output_config?.effort, 'low');
});

test('models that reject effort get no output_config.effort', async () => {
  for (const model of ['claude-haiku-4-5', 'claude-sonnet-4-5', 'claude-3-5-haiku-latest']) {
    const handler = load(model);
    const calls = stubFetch(answer('end_turn'));
    await ask(handler);
    assert.strictEqual(calls[0].model, model);
    assert.strictEqual(calls[0].output_config?.effort, undefined, model);
  }
  load();
});
