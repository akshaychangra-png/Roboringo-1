import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const source = await fs.readFile(new URL('../lib/enquiry-navigation.js', import.meta.url), 'utf8');
const { connectEnquiryNavigation, consumeEnquiryTopic } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

test('every contact CTA has a clean URL and enquiry metadata remains available', async () => {
  let topics = [];
  for (const name of await fs.readdir(new URL('../content/pages/', import.meta.url))) {
    const record = JSON.parse(await fs.readFile(new URL('../content/pages/' + name, import.meta.url), 'utf8'));
    assert.doesNotMatch(record.html, /href="\/contact\/?\?subject=/);
    topics.push(...[...record.html.matchAll(/data-enquiry-subject="([^"]+)"/g)].map(m => m[1]));
  }
  for (const topic of ['Starter business plan', 'Professional business plan', 'Enterprise business plan', 'Personal AI assistant', 'Personal AI assistant setup', 'Personal AI assistant - Personal plan', 'Personal AI assistant - Personal Plus plan', 'Enterprise security', 'Messaging integration', 'Developer API access']) assert.ok(topics.includes(topic), topic);
});
test('internal CTA selection survives navigation without changing its URL', () => {
  const values = new Map(); let click;
  globalThis.sessionStorage = { setItem: (k,v) => values.set(k,v), getItem: k => values.get(k), removeItem: k => values.delete(k) };
  globalThis.document = { cookie: '', addEventListener: (type, fn) => { click=fn; }, removeEventListener() {} };
  const disconnect = connectEnquiryNavigation();
  click({ target: { closest: () => ({ dataset: { enquirySubject: 'Developer API access' } }) } });
  assert.equal(consumeEnquiryTopic(), 'Developer API access');
  assert.equal(consumeEnquiryTopic(), '');
  disconnect();
});
test('legacy redirect cookie preserves topic and is consumed once', () => {
  globalThis.document.cookie = 'rr-enquiry-topic=Personal%20AI%20assistant%20-%20Personal%20Plus%20plan';
  assert.equal(consumeEnquiryTopic(), 'Personal AI assistant - Personal Plus plan');
  assert.match(globalThis.document.cookie, /Max-Age=0/);
});
