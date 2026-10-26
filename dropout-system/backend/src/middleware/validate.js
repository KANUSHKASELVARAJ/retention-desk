export const validate = (schema, source = 'body') => (req, _res, next) => {
  const parsed = schema.safeParse(req[source]);
  if (!parsed.success) return next(parsed.error);
  if (source === 'query') req.validatedQuery = parsed.data;
  else req[source] = parsed.data;
  next();
};
