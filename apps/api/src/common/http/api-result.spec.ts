import { ApiResult, ok } from './api-result';

describe('ok', () => {
  it('resolves promise payloads before wrapping the response', async () => {
    await expect(
      ok(
        Promise.resolve({
          access_token: 'token',
          refresh_token: 'refresh',
        }),
      ),
    ).resolves.toEqual(
      new ApiResult({
        access_token: 'token',
        refresh_token: 'refresh',
      }),
    );
  });
});
