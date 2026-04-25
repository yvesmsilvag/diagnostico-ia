# Limitaciones de DiagnósticoIA

Este documento describe de forma honesta lo que esta herramienta **no puede hacer** y los contextos en los que **no debe usarse**. La transparencia sobre limitaciones es parte fundamental del diseño responsable de herramientas de IA en medicina.

---

## Limitaciones clínicas

### 1. No evalúa al paciente — evalúa texto
El modelo recibe una descripción en lenguaje natural. No puede auscultar, palpar, observar facies, medir signos vitales en tiempo real, ni interpretar resultados de laboratorio o imagen. Toda la información depende de lo que el médico ingrese — si la descripción está incompleta o es imprecisa, el análisis lo será también.

### 2. No cubre multimorbilidad compleja
La herramienta está optimizada para los seis motivos de consulta más frecuentes en primer nivel. Pacientes con múltiples comorbilidades interactuantes, presentaciones atípicas, o diagnósticos fuera de estas seis categorías están fuera del alcance de diseño.

### 3. No es apropiada para emergencias
Ante cualquier signo de alarma (alteración del estado de conciencia, dificultad respiratoria severa, choque, signos meníngeos, etc.), la conducta correcta es estabilizar y referir. Esta herramienta no debe usarse como sustituto de un protocolo de emergencias.

### 4. No incluye dosificación pediátrica
Las recomendaciones de manejo están calibradas para pacientes adultos. No usar para cálculo de dosis en menores de 18 años.

### 5. No considera embarazo ni lactancia de forma específica
Aunque el campo de "contexto adicional" permite ingresar esta información, el modelo no tiene instrucciones específicas para ajustar recomendaciones farmacológicas en embarazo o lactancia. Consultar GPC obstétricas y fichas técnicas de medicamentos directamente.

### 6. Las GPC se actualizan — el modelo no
Las Guías de Práctica Clínica del CENETEC se revisan periódicamente. El modelo fue entrenado con datos hasta cierta fecha y puede no reflejar actualizaciones recientes. Verificar siempre en: https://www.cenetec.salud.gob.mx/gpc

### 7. El modelo puede alucinar referencias
Aunque el system prompt instruye citar GPC específicas, los modelos de lenguaje pueden generar referencias incorrectas o mezclar contenido de distintas guías. Tratar toda referencia citada como una pista a verificar, no como una cita confirmada.

---

## Limitaciones técnicas

### 8. La API key está expuesta en el cliente
Esta versión de demostración realiza llamadas directas a la API de Anthropic desde el navegador. Esto expone la API key en el código fuente del cliente. **No usar con una key de producción o con límite de gasto alto.** Una versión de producción requeriría un backend proxy que mantenga la key en el servidor.

### 9. Sin persistencia de datos
La aplicación no guarda historiales de consulta. Cada sesión empieza desde cero. No es adecuada para seguimiento longitudinal de pacientes.

### 10. Sin validación de identidad del usuario
No existe mecanismo de autenticación. Cualquier persona con acceso al URL puede usar la herramienta. En un despliegue real con pacientes, se requeriría autenticación y control de acceso.

### 11. Latencia dependiente de la API
El tiempo de respuesta depende de la disponibilidad y carga de la API de Anthropic. En condiciones de alta demanda puede haber latencia de 10–30 segundos. No apto para contextos donde la rapidez es crítica.

---

## Lo que esta herramienta sí hace bien

Para equilibrar, estas son las fortalezas de diseño:

- **Razonamiento explícito:** muestra el proceso diagnóstico paso a paso, lo que permite al médico identificar errores o ausencias en el razonamiento del modelo
- **Marcos clínicos específicos por condición:** no es un chatbot genérico — cada condición tiene su propio flujo de razonamiento codificado
- **Anclaje en GPC mexicanas:** el contexto normativo es explícitamente mexicano, no adaptado de guías estadounidenses o europeas
- **Lenguaje probabilístico:** el modelo usa "probable", "descartar", "considerar" en lugar de certezas, lo que refleja mejor la realidad clínica

---

## Responsabilidad

El uso de esta herramienta es responsabilidad del profesional de salud que la utiliza. El autor no se hace responsable de decisiones clínicas tomadas con base en sus salidas.
