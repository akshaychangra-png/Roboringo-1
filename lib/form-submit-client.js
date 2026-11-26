import { consumeEnquiryTopic } from './enquiry-navigation';

// FormSubmit's AJAX endpoint returns success as either a boolean or a string.
export async function sendEnquiry(endpoint, payload, fetcher = fetch) {
  const response = await fetcher(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
    // Send only the clean form URL, never its query string or fragment.
    // This keeps the activation identity consistent with the explicit _url.
    ...(payload._url ? { referrer: payload._url, referrerPolicy: 'unsafe-url' } : {}),
    signal: AbortSignal.timeout(25000),
  });
  const result = await response.json();
  if (!response.ok || !(result.success === true || result.success === 'true')) {
    const error = new Error('Submission was not accepted');
    error.activationRequired = /needs activation/i.test(result.message || '');
    throw error;
  }
  return result;
}

export function connectEnquiryForms(endpoint) {
  const cleanups = [];
  document.querySelectorAll('form[data-email-form]').forEach(form => {
    const enquiryTopic = consumeEnquiryTopic();
    let processing = false;
    let disposed = false;
    const status = form.querySelector('[data-form-status]');
    const buttons = [...form.querySelectorAll('[type="submit"]')];
    const labels = buttons.map(button => button.textContent);
    async function submit(event) {
      event.preventDefault();
      if (processing || !form.reportValidity()) return;
      const fields = Object.fromEntries(new FormData(form));
      // Do not forward a bot-filled honeypot to the recipient.
      if (fields._honey) return;
      processing = true;
      form.setAttribute('aria-busy', 'true');
      buttons.forEach(button => { button.disabled = true; button.textContent = 'Sending…'; });
      status.setAttribute('role', 'status');
      status.textContent = 'Sending your enquiry…';
      const name = form.dataset.emailForm;
      try {
        await sendEnquiry(endpoint, {
          ...fields,
          _subject: 'RoboRingo — ' + name,
          _template: 'table',
          _url: location.origin + location.pathname,
          _captcha: 'false',
          _replyto: fields.email,
          'Form name': name,
          'Page URL': location.origin + location.pathname,
          'Submitted at': new Date().toISOString(),
          'Enquiry topic': enquiryTopic || new URLSearchParams(location.search).get('subject') || fields.interest || fields.module || name,
        });
        if (disposed) return;
        form.reset();
        status.textContent = 'Thank you! Your enquiry has been submitted. We’ll be in touch soon.';
      } catch (error) {
        if (disposed) return;
        status.setAttribute('role', 'alert');
        status.textContent = error.activationRequired
          ? 'This form is awaiting activation. Please try again shortly. Your details are still here.'
          : 'We couldn’t send your enquiry. Please try again shortly. Your details are still here.';
      } finally {
        processing = false;
        if (!disposed) {
          form.removeAttribute('aria-busy');
          buttons.forEach((button, index) => { button.disabled = false; button.textContent = labels[index]; });
        }
      }
    }
    form.addEventListener('submit', submit);
    cleanups.push(() => { disposed = true; form.removeEventListener('submit', submit); });
  });
  return () => cleanups.forEach(cleanup => cleanup());
}
