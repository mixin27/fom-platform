export const jwtConfig = {
  issuer: 'facebook-order-manager-api',
  audience: 'fom-mobile',
  accessTokenTtlSeconds: 60 * 60,
  refreshTokenTtlSeconds: 30 * 24 * 60 * 60,
  accessSecret:
    process.env.JWT_ACCESS_SECRET ??
    'dev_access_secret_change_me_facebook_order_manager',
  refreshSecret:
    process.env.JWT_REFRESH_SECRET ??
    'dev_refresh_secret_change_me_facebook_order_manager',
} as const;
