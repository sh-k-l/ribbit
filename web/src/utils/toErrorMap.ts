import { FieldError } from '../generated/graphql';

export const toErrorMap = (errors: FieldError[]) => {
  console.log(errors);
  const errorMap: Record<string, string> = {};

  errors.forEach(({ field, message }) => {
    errorMap[field] = message;
  });

  return errorMap;
};
