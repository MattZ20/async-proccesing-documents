export const RESPONSE_CATALOG = {
  // Success codes (1xxx)
  DOCUMENT_QUEUED: { code: 1000, message: 'Documento encolado exitosamente' },
  STATUS_RETRIEVED: { code: 1001, message: 'Estado consultado exitosamente' },
  HEALTHY: { code: 1002, message: 'Servicio saludable' },

  // Validation error codes (2xxx)
  FILE_REQUIRED: { code: 2001, message: 'Archivo requerido' },

  FILE_TYPE_NOT_ALLOWED: {
    code: 2002,
    message: 'Tipo de archivo no permitido. Use: pdf, png, jpg, jpeg',
  },

  FILE_SIZE_EXCEEDED: {
    code: 2003,
    message: 'Archivo excede tamaño máximo de 5MB',
  },

  VALIDATION_ERROR: {
    code: 2004,
    message: 'Error de validación de campos',
  },

  // Auth error codes (3xxx)
  API_KEY_REQUIRED: { code: 3001, message: 'API Key requerida' },
  API_KEY_INVALID: { code: 3002, message: 'API Key inválida' },

  // Business error codes (4xxx)
  DOCUMENT_NOT_FOUND: { code: 4001, message: 'Documento no encontrado' },
  PROCESSING_ERROR: { code: 4002, message: 'Error de procesamiento' },

  // Server error codes (5xxx)
  INTERNAL_ERROR: { code: 5001, message: 'Error interno del servidor' },
  QUEUE_UNAVAILABLE: {
    code: 5002,
    message: 'Servicio de colas no disponible',
  },
} as const;

export type CatalogEntry =
  (typeof RESPONSE_CATALOG)[keyof typeof RESPONSE_CATALOG];
