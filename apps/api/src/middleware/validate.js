/**
 * Validates parts of a request with zod schemas. Bad input -> ZodError,
 * which the error handler turns into 400 VALIDATION_ERROR.
 * Parsed values replace the originals, so unknown fields are dropped.
 * @param {{body?: import('zod').ZodTypeAny, params?: import('zod').ZodTypeAny, query?: import('zod').ZodTypeAny}} schemas
 */
export function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.params) Object.assign(req.params, schemas.params.parse(req.params));
      if (schemas.query) req.query = schemas.query.parse(req.query);
      if (schemas.body) req.body = schemas.body.parse(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}
