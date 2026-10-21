# Sistema de Procesamiento de Documentos

API Gateway + Worker asíncrono para validar y procesar documentos, construido como práctica de arquitectura de microservicios con NestJS. El cliente sube un archivo, el sistema lo encola en Redis y un worker independiente lo procesa en segundo plano. El estado se puede consultar en cualquier momento mediante polling.

**Stack:** NestJS 11 · BullMQ · Redis · Docker · Jest

## Arquitectura

```
Cliente → [api-gateway] → Redis (cola BullMQ) → [ms-processor] → Redis (estado)
              ↑                                        ↓
         Swagger UI                              Dead Letter Queue
         BullBoard
```

- **api-gateway**: recibe el archivo, lo valida (tipo, tamaño), genera un `request_id` y encola el job. No procesa nada por sí mismo.
- **ms-processor**: worker separado que consume la cola, simula el procesamiento del documento y actualiza el estado. Si un job falla tras 3 reintentos (backoff exponencial), se envía a una **Dead Letter Queue** para no perderlo silenciosamente.
- **Redis**: backend de BullMQ y almacén de metadata compartido entre ambos servicios (vía volumen Docker).

Ambos servicios son NestJS independientes, cada uno con su propio `package.json`, Dockerfile y suite de tests — se despliegan y escalan por separado.

## Decisiones técnicas y por qué

- **Colas en vez de procesamiento síncrono**: el endpoint de upload responde en milisegundos (`202 Accepted`) sin esperar el procesamiento, que puede tardar segundos. El cliente hace polling del estado por separado.
- **Reintentos + Dead Letter Queue**: los jobs fallidos se reintentan automáticamente (backoff exponencial) y, tras agotar los intentos, se mueven a una cola separada en vez de perderse — patrón estándar en sistemas de mensajería para no bloquear la cola principal con jobs "envenenados".
- **Guards y pipes personalizados**: autenticación por API key y validación de archivos (tipo/tamaño) implementadas como guards/pipes de NestJS en vez de lógica inline en el controller, siguiendo la separación de responsabilidades del framework.
- **Respuestas estandarizadas**: todas las respuestas siguen un formato único (`code`, `message`, `data`, `timestamp`, `traceId`) vía un interceptor global, facilitando el consumo desde un frontend o la depuración con logs correlacionados.

## Limitaciones conocidas (conscientes, por ser proyecto de práctica)

- El **procesamiento del documento es simulado**: no se extrae contenido real ni se persiste el archivo binario; el worker genera metadata aleatoria (número de páginas, tiempo de proceso) tras un delay artificial. El foco del ejercicio es la arquitectura de colas, no un parser de documentos real.
- El **almacenamiento de estado es un archivo JSON** en disco (compartido por volumen Docker), no una base de datos. Es suficiente para la demo pero no soporta escrituras concurrentes a gran escala; en producción sería Postgres/MongoDB con índices por `request_id`.
- La **API key es única y fija** (sin rotación, sin múltiples clientes/scopes) — adecuado para un ejercicio, no para multi-tenant real.

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

Todos los endpoints requieren el header `x-api-key` (configurado en tu `.env`).

**Subir un documento:**

```bash
curl -X POST http://localhost:3000/documents/upload \
  -H "x-api-key: <tu-api-key>" \
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
  -H "x-api-key: <tu-api-key>"
```

El documento pasa por: `PENDING → PROCESSING → COMPLETED` (o `ERROR` si agota los 3 reintentos y cae a la DLQ).

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

Cobertura de tests unitarios en guards, pipes, interceptors, filters, servicios y processors de ambos servicios.

## Posibles mejoras futuras

- Persistencia real en base de datos en vez de archivo JSON.
- Procesamiento real de documentos (OCR / extracción de texto).
- Autenticación con JWT y múltiples API keys/scopes por cliente.
- Métricas de cola (Prometheus) y alertado sobre la DLQ.

## Licencia

[MIT](LICENSE)
