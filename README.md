# Sistema de Procesamiento de Documentos

API Gateway + Worker asíncrono para validar y procesar documentos. El cliente sube un archivo, el sistema lo encola en Redis y un worker lo procesa en segundo plano. El estado se puede consultar en cualquier momento.

**Stack:** NestJS 11 · BullMQ · Redis · Docker

## Requisitos

- Docker Desktop instalado y corriendo

## Levantar el proyecto

```bash
git clone <url-del-repositorio>
cd tarea-practica-nest-basic

cp .env.example .env

docker compose up --build
```

Espera ~20s hasta que los servicios pasen el health check. Verifica con:

```bash
curl http://localhost:3000/health
```

## Uso

Todos los endpoints requieren el header `x-api-key: my-secret-api-key-12345`.

**Subir un documento:**

```bash
curl -X POST http://localhost:3000/documents/upload \
  -H "x-api-key: my-secret-api-key-12345" \
  -F "file=@documento.pdf" \
  -F "documentType=invoice" \
  -F "priority=high"
```

Tipos aceptados: `pdf`, `png`, `jpg`, `jpeg` — máximo 5MB.
Tipos de documento: `invoice`, `contract`, `report`, `other`.
Prioridad: `low`, `normal`, `high` (default: `normal`).

**Consultar estado:**

```bash
curl http://localhost:3000/documents/{request_id}/status \
  -H "x-api-key: my-secret-api-key-12345"
```

El documento pasa por: `PENDING → PROCESSING → COMPLETED` (o `ERROR` si agota los 3 reintentos).

## Herramientas incluidas

| Herramienta | URL |
|-------------|-----|
| Swagger UI  | http://localhost:3000/api/docs |
| BullBoard   | http://localhost:3000/admin/queues |

## Tests

```bash
cd api-gateway && npm install && npm run test
cd ms-processor && npm install && npm run test
```
