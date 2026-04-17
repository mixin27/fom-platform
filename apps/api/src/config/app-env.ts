export function readOptionalEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }

  return null;
}

export function readBooleanEnv(name: string, fallback: boolean) {
  const rawValue = process.env[name]?.trim().toLowerCase();
  if (!rawValue) {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(rawValue);
}

export function readIntegerEnv(name: string, fallback: number, min = 0) {
  const rawValue = process.env[name]?.trim();
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed < min) {
    return fallback;
  }

  return parsed;
}

export function readCsvEnv(name: string) {
  return (process.env[name] ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

export function normalizeBaseUrl(value: string | null | undefined, fallback: string) {
  return (value?.trim() || fallback).replace(/\/+$/, '');
}

export function getNodeEnvironment() {
  return (process.env.NODE_ENV?.trim().toLowerCase() || 'development') as
    | 'development'
    | 'test'
    | 'production';
}

export function isProductionEnvironment() {
  return getNodeEnvironment() === 'production';
}

export function getDatabaseUrl() {
  return (
    readOptionalEnv('DATABASE_URL') ||
    'postgresql://postgres:postgres@localhost:5432/fom_platform_api?schema=public'
  );
}

export function getWebAppBaseUrl() {
  return normalizeBaseUrl(
    readOptionalEnv(
      'WEB_APP_BASE_URL',
      'APP_WEB_BASE_URL',
      'NEXT_PUBLIC_APP_BASE_URL',
    ),
    'http://localhost:3000',
  );
}

export function getPublicApiBaseUrl() {
  return normalizeBaseUrl(
    readOptionalEnv('PUBLIC_API_BASE_URL', 'API_BASE_URL'),
    'http://localhost:4000',
  );
}

export function getConfiguredEmailProvider() {
  return (
    readOptionalEnv('EMAIL_PROVIDER', 'EMAIL_DELIVERY_MODE')?.toLowerCase() ||
    'log'
  );
}
