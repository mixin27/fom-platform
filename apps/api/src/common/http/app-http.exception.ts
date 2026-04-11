import { HttpException, HttpStatus } from '@nestjs/common';

export interface ErrorDetail {
  field: string;
  errors: string[];
}

type AppHttpExceptionPayload = {
  code: string;
  message: string;
  details?: ErrorDetail[];
};

export class AppHttpException extends HttpException {
  constructor(status: number, payload: AppHttpExceptionPayload) {
    super(payload, status);
  }
}

export function validationError(
  details: ErrorDetail[],
  message = 'Invalid request data',
): AppHttpException {
  return new AppHttpException(HttpStatus.UNPROCESSABLE_ENTITY, {
    code: 'VALIDATION_ERROR',
    message,
    details,
  });
}

export function unauthorizedError(
  message = 'Authentication required',
): AppHttpException {
  return new AppHttpException(HttpStatus.UNAUTHORIZED, {
    code: 'UNAUTHORIZED',
    message,
  });
}

export function forbiddenError(
  message = 'You do not have permission to perform this action',
): AppHttpException {
  return new AppHttpException(HttpStatus.FORBIDDEN, {
    code: 'FORBIDDEN',
    message,
  });
}

export function notFoundError(message: string): AppHttpException {
  return new AppHttpException(HttpStatus.NOT_FOUND, {
    code: 'NOT_FOUND',
    message,
  });
}

export function conflictError(message: string): AppHttpException {
  return new AppHttpException(HttpStatus.CONFLICT, {
    code: 'CONFLICT',
    message,
  });
}
