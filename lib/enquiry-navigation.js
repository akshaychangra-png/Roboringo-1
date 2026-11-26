const storageKey = 'roboringo-enquiry-topic';
export function connectEnquiryNavigation() {
  function remember(event) {
    const link = event.target.closest?.('a[data-enquiry-subject]');
    if (!link) return;
    try { sessionStorage.setItem(storageKey, link.dataset.enquirySubject); } catch {}
  }
  document.addEventListener('click', remember, true);
  return () => document.removeEventListener('click', remember, true);
}
export function consumeEnquiryTopic() {
  let topic = '';
  const cookie = document.cookie.split('; ').find(value => value.startsWith('rr-enquiry-topic='));
  if (cookie) {
    try { topic = decodeURIComponent(cookie.slice('rr-enquiry-topic='.length)); } catch {}
    document.cookie = 'rr-enquiry-topic=; Path=/; Max-Age=0; SameSite=Lax';
  }
  try {
    topic ||= sessionStorage.getItem(storageKey) || '';
    sessionStorage.removeItem(storageKey);
  } catch {}
  return topic.slice(0, 200);
}
