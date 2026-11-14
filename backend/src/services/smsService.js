/**
 * SMS sender. While OTP_MODE=screen the OTP is returned to the client and shown on screen.
 * To go live: set OTP_MODE=sms, SMS_PROVIDER and SMS_API_KEY in .env — that's it.
 */
const { otp } = require('../config/env');

async function postJson(url, body, headers = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`SMS provider error ${res.status}: ${await res.text()}`);
  return res.json().catch(() => ({}));
}

const providers = {
  // https://docs.msg91.com/
  msg91: (phone, code) =>
    postJson(
      'https://control.msg91.com/api/v5/otp',
      { template_id: otp.templateId, mobile: `91${phone}`, otp: code },
      { authkey: otp.apiKey }
    ),
  // https://docs.fast2sms.com/
  fast2sms: (phone, code) =>
    postJson(
      'https://www.fast2sms.com/dev/bulkV2',
      { route: 'otp', variables_values: code, numbers: phone },
      { authorization: otp.apiKey }
    ),
};

exports.sendOtpSms = async (phone, code) => {
  const send = providers[otp.provider];
  if (!send) throw new Error(`Unknown SMS provider "${otp.provider}"`);
  if (!otp.apiKey) throw new Error('SMS_API_KEY is not configured');
  return send(phone, code);
};
