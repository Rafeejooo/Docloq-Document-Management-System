// Validation Middleware — reusable parameter validators

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate that one or more req.params values are valid UUIDs.
 * Returns 400 if any listed param is present but not a valid UUID.
 *
 * Usage:
 *   router.get('/:id', validateUUID('id'), handler);
 *   router.post('/:docId/items/:itemId', validateUUID('docId', 'itemId'), handler);
 */
export const validateUUID = (...paramNames) => (req, res, next) => {
  for (const param of paramNames) {
    const val = req.params[param];
    if (val && !UUID_RE.test(val)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${param} format`,
      });
    }
  }
  next();
};

export default { validateUUID };
