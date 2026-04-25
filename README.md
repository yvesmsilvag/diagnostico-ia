# DiagnósticoIA

**Herramienta de apoyo al razonamiento clínico** para médicos y estudiantes de medicina, basada en las Guías de Práctica Clínica (GPC) del CENETEC México, construida con React y la API de Claude (Anthropic).

> ⚕️ Esta herramienta es exclusivamente para uso por profesionales de la salud. No sustituye el juicio clínico ni la evaluación presencial.

---

## ¿Qué hace?

DiagnósticoIA recibe signos y síntomas de un paciente y genera un análisis clínico estructurado que incluye:

1. **Razonamiento clínico explícito** — el proceso diagnóstico paso a paso, usando el marco clínico correspondiente a cada condición
2. **Diagnósticos diferenciales ordenados** por probabilidad con justificación
3. **Estadificación y clasificación** según GPC CENETEC aplicable
4. **Manejo recomendado** con fármacos de primera línea, dosis, criterios de referencia y signos de alarma
5. **Referencias GPC específicas** utilizadas en el análisis

---

## Condiciones cubiertas

| Condición | Marco de razonamiento | GPC CENETEC |
|---|---|---|
| Infección de Vías Respiratorias Altas (IVRA) | Patrón de síntomas → severidad/complicaciones | GPC IVRAS adulto |
| Gastroenteritis Aguda | Severidad de deshidratación (escala OMS) → etiología | GPC Enfermedad diarreica aguda |
| Diabetes Mellitus | Manejo agudo vs crónico → estadificación de complicaciones | GPC DM tipo 2 |
| Hipertensión Arterial | Crisis vs no-crisis → estratificación de riesgo cardiovascular | GPC HAS |
| Infección de Tracto Urinario (ITU) | Complicada vs no complicada → probabilidad de patógeno | GPC ITU adulto |
| Cefalea | Marco ALICIA → etiología | GPC Cefalea tensional y migraña |

---

## Arquitectura

```
Usuario
  │
  ├─ Selecciona condición principal
  ├─ Ingresa signos y síntomas, tiempo de evolución, contexto
  │
  ▼
React Frontend (single-page, sin backend)
  │
  ├─ Construye prompt clínico estructurado
  │    └─ System prompt: marco clínico por condición + instrucción GPC CENETEC
  │    └─ User prompt: condición + síntomas + contexto del paciente
  │
  ▼
Anthropic Claude API (claude-sonnet-4-20250514)
  │
  ▼
Respuesta estructurada en 5 secciones
  │
  ▼
Parser → renderizado por sección con colapsado
```

### Decisiones de diseño

- **Sin backend propio:** la llamada a la API se hace directamente desde el cliente. Esto es adecuado para una herramienta de demostración/portfolio; una versión de producción requeriría un backend que proteja la API key.
- **System prompt como conocimiento clínico:** el marco de razonamiento de cada condición está codificado en el system prompt, no en la UI. Esto separa la lógica clínica de la presentación y facilita actualizar guías sin tocar el frontend.
- **Parsing de secciones:** la respuesta de Claude se parsea por encabezados con emoji-marcadores, lo que permite renderizado colapsable por sección sin postprocesamiento complejo.
- **Español como idioma único:** diseño deliberado para maximizar utilidad en el contexto LatAm y como demostración de capacidad en Spanish-language medical AI.

---

## Stack técnico

- **React 18** — componentes funcionales, hooks (useState, useRef, useEffect)
- **Anthropic Claude API** — modelo claude-sonnet-4-20250514
- **CSS-in-JS** — estilos inline + clases globales mínimas, sin dependencias de UI externas
- **IBM Plex Sans / IBM Plex Mono / Playfair Display** — tipografía vía Google Fonts

---

## Instalación y uso local

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/diagnostico-ia
cd diagnostico-ia

# Instalar dependencias
npm install

# Configurar API key (ver sección de seguridad abajo)
cp .env.example .env
# Editar .env y agregar: VITE_ANTHROPIC_API_KEY=tu_api_key

# Correr en desarrollo
npm run dev
```

> **Nota de seguridad:** Esta demo hace llamadas directas a la API desde el cliente, lo cual expone la API key en el navegador. Solo usar con una key de desarrollo con límite de gasto bajo. Para producción, implementar un backend proxy.

---

## Evaluación del modelo — criterios utilizados

Este proyecto fue construido con atención explícita a los criterios de evaluación de modelos de lenguaje médico:

| Criterio | Implementación |
|---|---|
| **Precisión clínica** | Respuestas ancladas en GPC CENETEC con referencias explícitas |
| **Razonamiento transparente** | El modelo muestra su proceso paso a paso antes de conclusiones |
| **Apropiación cultural/lingüística** | Español mexicano, nomenclatura NOM, contexto LatAm |
| **Captura de banderas rojas** | El system prompt instruye identificación explícita de signos de alarma |
| **Calibración de incertidumbre** | El modelo usa lenguaje probabilístico ("probable", "descartar") en lugar de certezas |

---

## Limitaciones

Ver [LIMITATIONS.md](./LIMITATIONS.md) para descripción completa.

---

## Contexto clínico del autor

Desarrollado por un médico pasante con experiencia en medicina ocupacional en una clínica minera en Zimapán, Hidalgo — contexto que informó directamente los marcos de razonamiento clínico implementados, particularmente para exposiciones ocupacionales, medicina con recursos limitados y práctica clínica independiente.

---

## Licencia

MIT — uso libre con atribución. Ver [LICENSE](./LICENSE).
