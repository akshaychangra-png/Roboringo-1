// Public FormSubmit alias mapped to amit.gupta@metadesignsolutions.com.
// Override with another activated ID or recipient email before rebuilding.
const recipient = process.env.FORMSUBMIT_FORM_ID || process.env.FORMSUBMIT_RECIPIENT || '1c2e9e30d86403cc15a9e475dae1557f';
export const formSubmitEndpoint = 'https://formsubmit.co/ajax/' + encodeURIComponent(recipient);
