import { type ValidationError, ValidationPipe } from '@nestjs/common';
import { validationError } from './app-http.exception';

export function createAppValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: false,
    },
    exceptionFactory: (errors) => validationError(mapValidationErrors(errors)),
  });
}

function mapValidationErrors(errors: ValidationError[]) {
  return errors.flatMap((error) => flattenValidationError(error));
}

function flattenValidationError(
  error: ValidationError,
  parentPath?: string,
): Array<{ field: string; errors: string[] }> {
  const field = parentPath ? `${parentPath}.${error.property}` : error.property;
  const details: Array<{ field: string; errors: string[] }> = [];

  if (error.constraints) {
    details.push({
      field,
      errors: Object.values(error.constraints),
    });
  }

  if (error.children && error.children.length > 0) {
    details.push(
      ...error.children.flatMap((child) =>
        flattenValidationError(child, field),
      ),
    );
  }

  return details;
}
