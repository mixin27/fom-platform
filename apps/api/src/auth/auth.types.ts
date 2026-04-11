export type JwtShopAccess = {
  shop_id: string;
  role: string | null;
  roles: string[];
  permissions: string[];
};

export type JwtPlatformAccess = {
  role: string | null;
  roles: string[];
  permissions: string[];
};

export type AccessTokenPayload = {
  type: 'access';
  sub: string;
  sid: string;
  name: string;
  email: string | null;
  phone: string | null;
  locale: string;
  platform: JwtPlatformAccess | null;
  shops: JwtShopAccess[];
};

export type RefreshTokenPayload = {
  type: 'refresh';
  sub: string;
  sid: string;
};
