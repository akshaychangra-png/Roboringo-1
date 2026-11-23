import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const source = await fs.readFile(new URL('../lib/form-submit-client.js', import.meta.url), 'utf8');
const { sendEnquiry, connectEnquiryForms } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

test('AJAX sends all details with JSON headers and checks provider acknowledgement', async () => {
  for (const success of [true, 'true']) {
    await sendEnquiry('https://formsubmit.co/ajax/example', { email: 'test@example.com', message: 'Hello' }, async (url, request) => {
      assert.equal(url, 'https://formsubmit.co/ajax/example');
      assert.equal(request.method, 'POST');
      assert.equal(request.headers.Accept, 'application/json');
      assert.deepEqual(JSON.parse(request.body), { email: 'test@example.com', message: 'Hello' });
      return { ok: true, json: async () => ({ success }) };
    });
  }
});
test('HTTP, provider, malformed response, and network errors reject', async () => {
  for (const response of [
    { ok: false, json: async () => ({ success: true }) },
    { ok: true, json: async () => ({ success: 'false' }) },
    { ok: true, json: async () => ({}) },
    { ok: true, json: async () => { throw new Error('HTML response'); } },
  ]) await assert.rejects(sendEnquiry('/endpoint', {}, async () => response));
  await assert.rejects(sendEnquiry('/endpoint', {}, async () => { throw new Error('offline'); }));
});

test('activation-required responses are distinguished from delivery success', async () => {
  await assert.rejects(sendEnquiry('/endpoint', {}, async () => ({
    ok: true, json: async () => ({ success: 'false', message: 'This form needs Activation.' }),
  })), error => error.activationRequired === true);
});

test('both forms have validation, accessible feedback, and a spam trap', async () => {
  for (const name of ['home', 'contact']) {
    const record = JSON.parse(await fs.readFile(new URL('../content/pages/' + name + '.json', import.meta.url), 'utf8'));
    assert.match(record.html, /<form data-email-form="[^"]+"/);
    assert.match(record.html, /name="email"[^>]*required/);
    assert.match(record.html, /name="_honey"/);
    assert.match(record.html, /data-form-status[^>]*aria-live="polite"/);
    assert.doesNotMatch(record.html, /Open email draft|Prepare my enquiry/);
  }
});

test('shared form handler prevents duplicates, reports failures, preserves inputs and recovers', async () => {
  const original = { document: globalThis.document, FormData: globalThis.FormData, location: globalThis.location, fetch: globalThis.fetch };
  let handler, resetCount = 0, requests = 0, resolveRequest;
  const attributes = {};
  const button = { disabled: false, textContent: 'Send enquiry' };
  const status = { textContent: '', setAttribute(key, value) { this[key] = value; } };
  const form = {
    dataset: { emailForm: 'Contact Us enquiry' },
    fields: { first: 'Sample', last: 'Visitor', email: 'test@example.com', phone: '123', company: 'Test', interest: 'AI calling', message: 'Test only', _honey: '' },
    valid: true, reportValidity() { return this.valid; },
    querySelector() { return status; }, querySelectorAll() { return [button]; },
    setAttribute(key, value) { attributes[key] = value; }, removeAttribute(key) { delete attributes[key]; },
    addEventListener(name, callback) { handler = callback; }, removeEventListener() {},
    reset() { resetCount++; },
  };
  try {
    globalThis.document = { querySelectorAll: () => [form] };
    globalThis.FormData = class { constructor(form) { this.fields = form.fields; } *[Symbol.iterator]() { yield* Object.entries(this.fields); } };
    globalThis.location = { origin: 'https://example.com', pathname: '/contact', search: '?subject=Personal%20Plus' };
    let payload;
    globalThis.fetch = async (url, options) => {
      requests++; payload = JSON.parse(options.body);
      return new Promise(resolve => { resolveRequest = resolve; });
    };
    const cleanup = connectEnquiryForms('https://formsubmit.co/ajax/test');
    const event = { preventDefault() {} };
    form.valid = false; await handler(event); assert.equal(requests, 0);
    form.valid = true; form.fields._honey = 'bot'; await handler(event); assert.equal(requests, 0);
    form.fields._honey = '';
    const pending = handler(event);
    assert.equal(button.disabled, true); assert.equal(attributes['aria-busy'], 'true');
    await handler(event); assert.equal(requests, 1);
    assert.equal(payload['Form name'], 'Contact Us enquiry');
    assert.equal(payload['Enquiry topic'], 'Personal Plus');
    assert.equal(payload._replyto, 'test@example.com');
    assert.equal(payload._url, 'https://example.com/contact');
    assert.equal(payload.company, 'Test');
    assert.equal(payload._honey, '');
    resolveRequest({ ok: false, json: async () => ({ success: false }) });
    await pending;
    assert.equal(status.role, 'alert'); assert.equal(resetCount, 0);
    assert.equal(button.disabled, false); assert.equal(button.textContent, 'Send enquiry');
    const retry = handler(event);
    resolveRequest({ ok: true, json: async () => ({ success: 'true' }) });
    await retry;
    assert.equal(resetCount, 1); assert.equal(status.role, 'status');
    assert.match(status.textContent, /Thank you/); assert.equal(button.disabled, false);
    cleanup();
  } finally { Object.assign(globalThis, original); }
});


test('uses the clean explicit form URL as the request referrer', async () => {
  await sendEnquiry('/endpoint', { _url: 'http://127.0.0.1:8830/contact' }, async (url, options) => {
    assert.equal(options.referrer, 'http://127.0.0.1:8830/contact');
    assert.equal(options.referrerPolicy, 'unsafe-url');
    return { ok: true, json: async () => ({ success: 'true' }) };
  });
});
