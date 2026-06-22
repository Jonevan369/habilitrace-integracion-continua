const authSecurity = [{ bearerAuth: [] }];

const idParam = (name, description) => ({
  name,
  in: 'path',
  required: true,
  description,
  schema: { type: 'integer', minimum: 1 }
});

const jsonBody = (schemaRef, example) => ({
  required: true,
  content: {
    'application/json': {
      schema: { $ref: schemaRef },
      example
    }
  }
});

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'HabiliTrace API',
    version: '0.4.0',
    description:
      'API REST para evaluar competencias con evidencias, IA OpenRouter/Gemini o fallback local, revision humana ponderada, estadisticas y credenciales JSON. Para endpoints protegidos: ejecuta POST /auth/login, copia el token y en Authorize pega solo el token JWT.'
  },
  servers: [{ url: 'http://localhost:4000/api', description: 'Servidor local' }],
  tags: [
    { name: 'Sistema', description: 'Salud, IA y estadisticas del prototipo.' },
    { name: 'Auth', description: 'Registro, login y usuario autenticado.' },
    { name: 'Evidencias', description: 'Registro, evaluacion IA y revision humana.' },
    { name: 'Perfiles', description: 'Busqueda, mapa competencial, progreso y exportacion.' },
    { name: 'Comunidades', description: 'Areas de practica y revisores.' },
    { name: 'Credenciales', description: 'Badges y credenciales verificables simuladas.' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    },
    schemas: {
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'ana@example.com' },
          password: { type: 'string', example: 'password123' }
        }
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'Demo Revisor' },
          email: { type: 'string', format: 'email', example: 'demo.revisor@example.com' },
          password: { type: 'string', minLength: 6, example: 'password123' },
          headline: { type: 'string', example: 'Revisor de competencias tecnicas' }
        }
      },
      AuthResponse: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          user: { $ref: '#/components/schemas/User' }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Ana Torres' },
          email: { type: 'string', format: 'email', example: 'ana@example.com' },
          headline: { type: 'string' },
          bio: { type: 'string' },
          karma: { type: 'number', example: 128 }
        }
      },
      EvidenceInput: {
        type: 'object',
        required: ['title', 'body'],
        properties: {
          title: { type: 'string', minLength: 4, maxLength: 120, example: 'API Express con JWT y SQLite' },
          body: {
            type: 'string',
            minLength: 20,
            maxLength: 4000,
            example:
              'Implemente una API REST con Node.js, Express, JWT y SQLite. Documente endpoints, rutas protegidas, migraciones, pruebas manuales desde Swagger y manejo de errores con Zod.'
          },
          skillArea: { type: 'string', example: 'software' },
          evidenceType: { type: 'string', example: 'proyecto' },
          assessmentMode: {
            type: 'string',
            enum: ['evidencia_practica', 'conocimiento_autonomo', 'mixta'],
            example: 'mixta'
          },
          learningSources: {
            type: 'string',
            example:
              'Documentacion oficial de Express, JWT, SQLite, Swagger/OpenAPI y bitacora propia de pruebas.'
          },
          challengeAnswers: {
            type: 'string',
            example:
              'Use JWT porque permite proteger rutas sin sesion en servidor. Verifique login, autorizacion Bearer y errores 401. Si cambiara la base de datos, aislaria las consultas en el modulo db.'
          },
          artifactUrl: { type: 'string', format: 'uri', example: 'https://github.com/demo/habilitrace-api' },
          communityId: { type: 'integer', nullable: true, example: 1 },
          fileName: { type: 'string', example: 'bitacora-demo.txt' },
          fileType: { type: 'string', example: 'text/plain' },
          fileDataBase64: {
            type: 'string',
            description: 'Data URL base64 opcional. Ejemplo: data:text/plain;base64,SG9sYQ=='
          }
        }
      },
      VoteRequest: {
        type: 'object',
        required: ['value'],
        properties: {
          value: { type: 'integer', enum: [1, -1], example: 1 },
          comment: { type: 'string', example: 'Revision humana: evidencia coherente con la rubrica.' }
        }
      },
      CommunityInput: {
        type: 'object',
        required: ['name', 'area'],
        properties: {
          name: { type: 'string', example: 'Arquitectura Backend' },
          area: { type: 'string', example: 'Software' },
          description: {
            type: 'string',
            example: 'Comunidad para validar APIs, bases de datos, seguridad y documentacion tecnica.'
          }
        }
      },
      Evaluation: {
        type: 'object',
        properties: {
          overallScore: { type: 'integer', example: 84 },
          status: { type: 'string', enum: ['prevalidated_ai', 'needs_human_review', 'insufficient'] },
          source: { type: 'string', example: 'openrouter' },
          providerModel: { type: 'string', example: 'openrouter/free' },
          humanReviewRequired: { type: 'boolean', example: true },
          rationale: { type: 'string' },
          evidenceHash: { type: 'string' },
          rubric: { type: 'object', additionalProperties: { type: 'integer' } },
          riskFlags: { type: 'array', items: { type: 'string' } }
        }
      },
      Evidence: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          title: { type: 'string' },
          body: { type: 'string' },
          status: { type: 'string' },
          skillArea: { type: 'string' },
          evidenceType: { type: 'string' },
          assessmentMode: { type: 'string' },
          author: { $ref: '#/components/schemas/User' },
          evaluation: { $ref: '#/components/schemas/Evaluation' },
          suggestions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                level: { type: 'string' },
                confidence: { type: 'number' },
                rationale: { type: 'string' },
                source: { type: 'string' }
              }
            }
          },
          voteSummary: {
            type: 'object',
            properties: {
              positive: { type: 'integer' },
              negative: { type: 'integer' },
              total: { type: 'integer' }
            }
          }
        }
      },
      AiStatus: {
        type: 'object',
        properties: {
          provider: { type: 'string', example: 'openrouter' },
          mode: { type: 'string', example: 'external_model' },
          model: { type: 'string', example: 'openrouter/free' },
          configured: { type: 'object' },
          fallbackAvailable: { type: 'boolean' },
          humanReviewPolicy: { type: 'string' }
        }
      },
      Stats: {
        type: 'object',
        properties: {
          totals: { type: 'object' },
          evaluations: { type: 'object' },
          votes: { type: 'object' },
          ai: { $ref: '#/components/schemas/AiStatus' },
          humanReview: { type: 'object' }
        }
      },
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          issues: { type: 'array', items: { type: 'object' } }
        }
      }
    }
  },
  paths: {
    '/': {
      get: {
        tags: ['Sistema'],
        summary: 'Informacion general de la API',
        responses: { 200: { description: 'Metadatos de la API' } }
      }
    },
    '/health': {
      get: {
        tags: ['Sistema'],
        summary: 'Healthcheck',
        responses: { 200: { description: 'API disponible' } }
      }
    },
    '/ai/status': {
      get: {
        tags: ['Sistema'],
        summary: 'Estado del proveedor IA',
        responses: {
          200: {
            description: 'Proveedor activo, modelo y politica de revision humana',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AiStatus' } } }
          }
        }
      }
    },
    '/stats': {
      get: {
        tags: ['Sistema'],
        summary: 'Estadisticas integradas del prototipo',
        responses: {
          200: {
            description: 'Resumen ejecutivo para dashboard y demo',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Stats' } } }
          }
        }
      }
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registrar usuario',
        requestBody: jsonBody('#/components/schemas/RegisterRequest', {
          name: 'Demo Revisor',
          email: 'demo.revisor@example.com',
          password: 'password123',
          headline: 'Revisor de competencias tecnicas'
        }),
        responses: {
          201: {
            description: 'Usuario creado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } }
          },
          409: { description: 'Email ya registrado' }
        }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Iniciar sesion',
        description: 'Usuario demo: ana@example.com / password123. Copia el token de la respuesta y pegalo en Authorize.',
        requestBody: jsonBody('#/components/schemas/LoginRequest', {
          email: 'ana@example.com',
          password: 'password123'
        }),
        responses: {
          200: {
            description: 'Sesion iniciada',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } }
          },
          401: { description: 'Credenciales invalidas' }
        }
      }
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Usuario autenticado',
        security: authSecurity,
        responses: { 200: { description: 'Usuario del token' }, 401: { description: 'Token requerido' } }
      }
    },
    '/users': {
      get: {
        tags: ['Perfiles'],
        summary: 'Buscar perfiles por nombre o competencia',
        parameters: [{ name: 'search', in: 'query', schema: { type: 'string' }, example: 'React' }],
        responses: { 200: { description: 'Lista de usuarios' } }
      },
      post: {
        tags: ['Perfiles'],
        summary: 'Crear perfil simple sin password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: { name: 'Invitado Demo', email: 'invitado.demo@example.com' }
            }
          }
        },
        responses: { 201: { description: 'Perfil creado' } }
      }
    },
    '/users/{userId}/profile': {
      get: {
        tags: ['Perfiles'],
        summary: 'Perfil competencial con evidencias, badges y estadisticas',
        parameters: [idParam('userId', 'ID del usuario')],
        responses: { 200: { description: 'Perfil competencial' }, 404: { description: 'Usuario no encontrado' } }
      }
    },
    '/users/{userId}/follow': {
      post: {
        tags: ['Perfiles'],
        summary: 'Observar perfil competencial',
        security: authSecurity,
        parameters: [idParam('userId', 'ID del perfil a observar')],
        responses: { 200: { description: 'Perfil observado' } }
      },
      delete: {
        tags: ['Perfiles'],
        summary: 'Dejar de observar perfil competencial',
        security: authSecurity,
        parameters: [idParam('userId', 'ID del perfil')],
        responses: { 200: { description: 'Perfil dejado de observar' } }
      }
    },
    '/users/{userId}/export': {
      get: {
        tags: ['Perfiles'],
        summary: 'Exportar perfil JSON propio',
        security: authSecurity,
        parameters: [idParam('userId', 'ID del usuario autenticado')],
        responses: { 200: { description: 'JSON exportable' }, 403: { description: 'Solo perfil propio' } }
      }
    },
    '/users/{userId}/competence-map': {
      get: {
        tags: ['Perfiles'],
        summary: 'Mapa de competencias filtrable',
        parameters: [
          idParam('userId', 'ID del usuario'),
          { name: 'name', in: 'query', schema: { type: 'string' }, example: 'React' },
          { name: 'level', in: 'query', schema: { type: 'string', enum: ['todos', 'principiante', 'intermedio', 'avanzado'] } }
        ],
        responses: { 200: { description: 'Competencias agregadas del usuario' } }
      }
    },
    '/users/{userId}/progress': {
      get: {
        tags: ['Perfiles'],
        summary: 'Linea temporal de una habilidad',
        parameters: [
          idParam('userId', 'ID del usuario'),
          { name: 'skill', in: 'query', required: true, schema: { type: 'string' }, example: 'APIs y servicios backend' }
        ],
        responses: { 200: { description: 'Puntos de progreso' } }
      }
    },
    '/users/{userId}/badges': {
      get: {
        tags: ['Credenciales'],
        summary: 'Listar badges de usuario',
        parameters: [idParam('userId', 'ID del usuario')],
        responses: { 200: { description: 'Badges del usuario' } }
      }
    },
    '/evidences': {
      get: {
        tags: ['Evidencias'],
        summary: 'Listar evidencias recientes',
        responses: {
          200: {
            description: 'Evidencias con evaluacion, sugerencias y votos',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Evidence' } } } }
          }
        }
      },
      post: {
        tags: ['Evidencias'],
        summary: 'Registrar evidencia y ejecutar evaluacion IA',
        description:
          'Usa OpenRouter si OPENROUTER_API_KEY esta configurado; si falla, usa fallback local auditable. Requiere token JWT.',
        security: authSecurity,
        requestBody: jsonBody('#/components/schemas/EvidenceInput', {
          title: 'API Express con JWT y SQLite',
          body:
            'Implemente una API REST con Node.js, Express, JWT y SQLite. Documente endpoints, rutas protegidas, migraciones, pruebas manuales desde Swagger y manejo de errores con Zod.',
          skillArea: 'software',
          evidenceType: 'proyecto',
          assessmentMode: 'mixta',
          learningSources: 'Documentacion oficial de Express, JWT, SQLite, Swagger/OpenAPI y bitacora propia.',
          challengeAnswers:
            'Use JWT porque permite proteger rutas sin sesion. Verifique login, autorizacion Bearer, errores 401 y validaciones. Si cambiara la base de datos, aislaria consultas en db.',
          artifactUrl: 'https://github.com/demo/habilitrace-api',
          communityId: 1
        }),
        responses: {
          201: {
            description: 'Evidencia creada y evaluada',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Evidence' } } }
          },
          401: { description: 'Usuario requerido' },
          400: { description: 'Datos invalidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },
    '/evidences/{id}/votes': {
      post: {
        tags: ['Evidencias'],
        summary: 'Auditar evidencia con revision humana ponderada',
        description: 'El autor no puede auditar su propia evidencia. Usa un usuario distinto al autor de la evidencia.',
        security: authSecurity,
        parameters: [idParam('id', 'ID de la evidencia')],
        requestBody: jsonBody('#/components/schemas/VoteRequest', {
          value: 1,
          comment: 'Revision humana: evidencia coherente con la rubrica.'
        }),
        responses: {
          200: { description: 'Evidencia con voto actualizado' },
          400: { description: 'Autor no puede auditar su propia evidencia' },
          404: { description: 'Evidencia no encontrada' }
        }
      }
    },
    '/feed': {
      get: {
        tags: ['Evidencias'],
        summary: 'Bandeja de evidencias de perfiles y areas observadas',
        security: authSecurity,
        responses: { 200: { description: 'Feed personalizado' } }
      }
    },
    '/communities': {
      get: {
        tags: ['Comunidades'],
        summary: 'Listar areas de practica',
        responses: { 200: { description: 'Areas con numero de revisores y evidencias' } }
      },
      post: {
        tags: ['Comunidades'],
        summary: 'Crear area de practica',
        description:
          'Por defecto esta accion esta reservada al sistema/administracion. Para habilitarla en desarrollo usa ENABLE_PUBLIC_AREA_CREATION=true.',
        security: authSecurity,
        requestBody: jsonBody('#/components/schemas/CommunityInput', {
          name: 'Arquitectura Backend',
          area: 'Software',
          description: 'Comunidad para validar APIs, bases de datos, seguridad y documentacion tecnica.'
        }),
        responses: { 201: { description: 'Area creada' }, 403: { description: 'Creacion publica deshabilitada' } }
      }
    },
    '/communities/{id}': {
      get: {
        tags: ['Comunidades'],
        summary: 'Detalle de area de practica',
        parameters: [idParam('id', 'ID del area')],
        responses: { 200: { description: 'Area con evidencias asociadas' }, 404: { description: 'Comunidad no encontrada' } }
      }
    },
    '/communities/{id}/join': {
      post: {
        tags: ['Comunidades'],
        summary: 'Vincularse a area de practica',
        security: authSecurity,
        parameters: [idParam('id', 'ID del area')],
        responses: { 200: { description: 'Vinculo creado' } }
      },
      delete: {
        tags: ['Comunidades'],
        summary: 'Salir de area de practica',
        security: authSecurity,
        parameters: [idParam('id', 'ID del area')],
        responses: { 200: { description: 'Vinculo eliminado' } }
      }
    },
    '/trends': {
      get: {
        tags: ['Sistema'],
        summary: 'Competencias mas validadas en los ultimos 7 dias',
        responses: { 200: { description: 'Tendencias de competencias' } }
      }
    },
    '/badges/{badgeId}/credential': {
      get: {
        tags: ['Credenciales'],
        summary: 'Emitir credencial JSON simulada con hash SHA-256',
        security: authSecurity,
        parameters: [idParam('badgeId', 'ID del badge')],
        responses: { 200: { description: 'Credencial verificable simulada' }, 404: { description: 'Badge no encontrado' } }
      }
    }
  }
};
