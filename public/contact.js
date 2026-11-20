const contactForm = document.querySelector('.contact-form');

contactForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(contactForm);
  const subject = new URLSearchParams(location.search).get('subject') || 'RoboRingo inquiry';
  const body = [
    `Name: ${data.get('first')} ${data.get('last')}`,
    `Work email: ${data.get('email')}`,
    `Phone: ${data.get('phone')}`,
    `Company: ${data.get('company')}`,
    `Interested in: ${data.get('interest')}`,
    '',
    data.get('message'),
  ].join('\r\n');
  location.href = `mailto:sales@roboringo.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});
