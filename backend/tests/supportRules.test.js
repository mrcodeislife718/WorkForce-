const test = require('node:test');
const assert = require('node:assert/strict');
const { isSupportAdmin, parseTicket, parseReply } = require('../services/supportRules');

test('only an explicitly configured account ID can see staff support records', () => {
  assert.equal(isSupportAdmin('account-1', { SUPPORT_ADMIN_USER_IDS: 'account-2, account-1' }), true);
  assert.equal(isSupportAdmin('account-3', { SUPPORT_ADMIN_USER_IDS: 'account-2, account-1' }), false);
  assert.equal(isSupportAdmin('account-1', { SUPPORT_ADMIN_USER_IDS: '' }), false);
});

test('support messages are bounded and categorized', () => {
  assert.deepEqual(parseTicket({
    subject: 'Cannot send email',
    message: 'My employee cannot send messages.',
    category: 'employee',
  }), {
    subject: 'Cannot send email',
    message: 'My employee cannot send messages.',
    category: 'employee',
  });
  assert.throws(() => parseTicket({ subject: 'x', message: 'abcdefghij' }), /subject/);
  assert.throws(() => parseReply({ message: 'x' }), /Reply/);
});
