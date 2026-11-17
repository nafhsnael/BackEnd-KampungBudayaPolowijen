import { ZodError, ZodType } from 'zod';
import { ValidationError } from '../errors/app.error';

export interface ValidationIssue {
  field: string;
  message: string;
}

export const formatValidationIssues = (error: ZodError): ValidationIssue[] =>
  error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));

export function parseValidatedInput<T>(schema: ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(formatValidationIssues(parsed.error));
  }
  return parsed.data;
}
