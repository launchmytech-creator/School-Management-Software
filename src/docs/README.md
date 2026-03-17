# API Documentation Structure

This directory contains the OpenAPI 3.0 specification for the School Management System API.

## Structure

```
docs/
├── openapi.yaml          # Main OpenAPI file (entry point)
├── modules/              # Module-specific API definitions
│   ├── auth.yaml         # Authentication endpoints
│   ├── schools.yaml      # School management endpoints
│   └── teachers.yaml     # Teacher management endpoints
├── schemas/              # Reusable data schemas
│   └── index.yaml        # All schema definitions
├── responses/            # Reusable response definitions
│   └── index.yaml        # Common responses
└── parameters/           # Reusable parameter definitions
    └── index.yaml        # Common parameters
```

## Modular Approach

The documentation is organized in a modular way:

1. **Main File** (`openapi.yaml`): Contains general API information and references to modules
2. **Modules** (`modules/*.yaml`): Each feature module has its own file with endpoint definitions
3. **Schemas** (`schemas/index.yaml`): Reusable data models
4. **Responses** (`responses/index.yaml`): Common response patterns
5. **Parameters** (`parameters/index.yaml`): Reusable parameters

## Adding New Modules

When adding a new module (e.g., students):

1. Create `modules/students.yaml` with endpoint definitions
2. Add schemas to `schemas/index.yaml` if needed
3. Reference the module in `openapi.yaml`:

```yaml
paths:
  /students:
    $ref: "./modules/students.yaml#/paths/~1students"
```

## Viewing Documentation

The API documentation is available at:

- **Swagger UI**: `http://localhost:3000/api-docs`

## Benefits of This Structure

- ✅ **Modular**: Easy to maintain and extend
- ✅ **Reusable**: Schemas and responses are defined once
- ✅ **Scalable**: Add new modules without touching existing ones
- ✅ **Clean**: Each module is self-contained
- ✅ **Version Control Friendly**: Changes are isolated to specific files

## OpenAPI Tools

You can use various tools with this specification:

- Swagger UI (integrated)
- Redocly
- Postman (import OpenAPI spec)
- Code generators (openapi-generator)
