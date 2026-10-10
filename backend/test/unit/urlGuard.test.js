const { assertSafeWebhookUrl, isBlockedIp } = require('../../src/utils/urlGuard');

describe('urlGuard', () => {
  describe('isBlockedIp', () => {
    it.each([
      ['127.0.0.1', true],
      ['127.255.255.255', true],
      ['0.0.0.0', true],
      ['10.1.2.3', true],
      ['100.64.0.1', true],
      ['169.254.169.254', true],
      ['172.16.5.5', true],
      ['192.168.1.1', true],
      ['8.8.8.8', false],
      ['93.184.216.34', false],
      ['::1', true],
      ['fc00::1', true],
      ['fd12:3456::1', true],
      ['fe80::1', true],
      ['2001:4860:4860::8888', false],
      ['::ffff:127.0.0.1', true],
      ['::ffff:10.0.0.1', true],
    ])('classifies %s as blocked=%s', (ip, blocked) => {
      expect(isBlockedIp(ip)).toBe(blocked);
    });
  });

  describe('assertSafeWebhookUrl', () => {
    it('accepts a public https URL', async () => {
      await expect(assertSafeWebhookUrl('https://93.184.216.34/hooks/ems')).resolves.toContain(
        '93.184.216.34'
      );
    });

    it('accepts a public http URL', async () => {
      await expect(assertSafeWebhookUrl('http://93.184.216.34:80/hook')).resolves.toBeTruthy();
    });

    it.each([
      ['not a url', /invalid/i],
      ['ftp://example.com/hook', /http or https/i],
      ['https://user:pass@93.184.216.34/hook', /credentials/i],
      ['https://93.184.216.34/hook#frag', /fragment/i],
      ['https://93.184.216.34:8080/hook', /custom port/i],
      ['http://localhost/hook', /localhost/i],
      ['http://foo.localhost/hook', /localhost/i],
      ['http://127.0.0.1/hook', /blocked/i],
      ['http://169.254.169.254/latest/meta-data', /blocked/i],
      ['http://10.0.0.5/hook', /blocked/i],
      ['http://192.168.0.10/hook', /blocked/i],
      ['http://[::1]/hook', /blocked/i],
    ])('rejects %s', async (url, message) => {
      await expect(assertSafeWebhookUrl(url)).rejects.toThrow(message);
    });
  });
});
