import { useState, useRef, useEffect } from "react";

const CONDICIONES = [
  { id: "urti", label: "IVRA", full: "Infección de Vías Respiratorias Altas" },
  { id: "gastro", label: "Gastroenteritis", full: "Gastroenteritis Aguda" },
  { id: "dm", label: "Diabetes", full: "Diabetes Mellitus" },
  { id: "hta", label: "Hipertensión", full: "Hipertensión Arterial" },
  { id: "itu", label: "ITU", full: "Infección de Tracto Urinario" },
  { id: "cefalea", label: "Cefalea", full: "Cefalea" },
];

const SYSTEM_PROMPT = `Eres un asistente de apoyo clínico basado en las Guías de Práctica Clínica (GPC) del CENETEC de México. Tu función es ayudar a médicos y estudiantes de medicina a razonar clínicamente sobre diagnósticos diferenciales, estadificación y manejo.

IMPORTANTE: No eres un sustituto del juicio clínico. Siempre indica cuando se requiere evaluación presencial urgente.

Para cada consulta debes estructurar tu respuesta en estas secciones claramente marcadas con encabezados en negrita:

**🔍 RAZONAMIENTO CLÍNICO**
Explica paso a paso tu proceso diagnóstico según el marco clínico correspondiente:
- Para CEFALEA: usa el marco ALICIA (Aparición, Localización, Intensidad, Calidad, Irradiación, Agravantes/aliviantes)
- Para IVRA: patrón de síntomas → severidad/complicaciones
- Para GASTROENTERITIS: severidad de deshidratación (escala OMS) → etiología
- Para DIABETES: manejo agudo vs crónico → estadificación de complicaciones
- Para HIPERTENSIÓN: crisis vs no-crisis → estratificación de riesgo
- Para ITU: complicada vs no complicada → probabilidad de patógeno

**🎯 DIAGNÓSTICOS DIFERENCIALES**
Lista ordenada por probabilidad con justificación clínica breve para cada uno.

**📊 ESTADIFICACIÓN / CLASIFICACIÓN**
Clasificación clínica según GPC CENETEC aplicable.

**💊 MANEJO RECOMENDADO**
Tratamiento según GPC CENETEC México, incluyendo:
- Primera línea farmacológica con dosis
- Medidas no farmacológicas
- Criterios de referencia/hospitalización
- Signos de alarma que el paciente debe conocer

**📋 REFERENCIAS GPC**
Menciona las GPC CENETEC específicas utilizadas.

Usa lenguaje clínico apropiado para médico/estudiante de medicina. Sé conciso pero completo.`;

function buildUserPrompt(condicion, sintomas, tiempo, extras) {
  const condNombre = CONDICIONES.find(c => c.id === condicion)?.full || condicion;
  return `Condición principal de consulta: ${condNombre}

Signos y síntomas referidos:
${sintomas}

${tiempo ? `Tiempo de evolución: ${tiempo}` : ""}
${extras ? `Información adicional: ${extras}` : ""}

Por favor realiza el análisis clínico completo siguiendo el marco correspondiente para ${condNombre}.`;
}

function parseResponse(text) {
  const sections = [];
  const sectionPatterns = [
    { key: "razonamiento", emoji: "🔍", title: "RAZONAMIENTO CLÍNICO" },
    { key: "diferenciales", emoji: "🎯", title: "DIAGNÓSTICOS DIFERENCIALES" },
    { key: "estadificacion", emoji: "📊", title: "ESTADIFICACIÓN / CLASIFICACIÓN" },
    { key: "manejo", emoji: "💊", title: "MANEJO RECOMENDADO" },
    { key: "referencias", emoji: "📋", title: "REFERENCIAS GPC" },
  ];

  const parts = text.split(/\*\*[🔍🎯📊💊📋]/u);
  const headers = [...text.matchAll(/\*\*([🔍🎯📊💊📋][^*]+)\*\*/gu)];

  if (headers.length === 0) {
    return [{ key: "full", title: "Análisis Clínico", content: text, emoji: "📋" }];
  }

  let lastIndex = 0;
  headers.forEach((match, i) => {
    const start = match.index + match[0].length;
    const end = i + 1 < headers.length ? headers[i + 1].index : text.length;
    const content = text.slice(start, end).trim();
    const headerText = match[1].trim();
    const found = sectionPatterns.find(s => headerText.includes(s.title));
    sections.push({
      key: found?.key || `section_${i}`,
      title: found?.title || headerText,
      emoji: found?.emoji || "📌",
      content,
    });
  });

  return sections;
}

function MarkdownText({ text }) {
  const lines = text.split("\n");
  return (
    <div style={{ lineHeight: 1.7 }}>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: "0.5em" }} />;
        const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("• ");
        const isNumbered = /^\d+\./.test(line.trim());
        let content = line.replace(/\*\*(.+?)\*\*/g, (_, t) => `<strong>${t}</strong>`);
        content = content.replace(/\*(.+?)\*/g, (_, t) => `<em>${t}</em>`);
        if (isBullet) {
          const txt = content.replace(/^[\s\-•]+/, "");
          return (
            <div key={i} style={{ display: "flex", gap: "0.5em", marginBottom: "0.25em", paddingLeft: "0.5em" }}>
              <span style={{ color: "#4EB8A0", fontWeight: "bold", flexShrink: 0 }}>›</span>
              <span dangerouslySetInnerHTML={{ __html: txt }} />
            </div>
          );
        }
        return <p key={i} style={{ margin: "0.2em 0" }} dangerouslySetInnerHTML={{ __html: content }} />;
      })}
    </div>
  );
}

function SectionCard({ section, index }) {
  const [open, setOpen] = useState(true);
  const colors = {
    razonamiento: { bg: "#0f2419", border: "#1a4a2e", accent: "#4EB8A0" },
    diferenciales: { bg: "#1a1a0f", border: "#3d3a1a", accent: "#D4B44A" },
    estadificacion: { bg: "#0f1a2a", border: "#1a2e4a", accent: "#4A90D4" },
    manejo: { bg: "#1a0f1a", border: "#3a1a3a", accent: "#B44AD4" },
    referencias: { bg: "#1a1a1a", border: "#333", accent: "#888" },
    full: { bg: "#0f1a2a", border: "#1a2e4a", accent: "#4EB8A0" },
  };
  const c = colors[section.key] || colors.full;

  return (
    <div
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderLeft: `3px solid ${c.accent}`,
        borderRadius: "8px",
        marginBottom: "12px",
        overflow: "hidden",
        animation: `fadeSlideIn 0.4s ease ${index * 0.08}s both`,
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          padding: "14px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          color: c.accent,
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "13px",
          fontWeight: "600",
          letterSpacing: "0.05em",
          textAlign: "left",
        }}
      >
        <span>{section.emoji} {section.title}</span>
        <span style={{ opacity: 0.6, fontSize: "16px" }}>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div style={{ padding: "0 18px 16px", color: "#c8d8d0", fontSize: "14px" }}>
          <MarkdownText text={section.content} />
        </div>
      )}
    </div>
  );
}

export default function DiagnosticoIA() {
  const [condicion, setCondicion] = useState("");
  const [sintomas, setSintomas] = useState("");
  const [tiempo, setTiempo] = useState("");
  const [extras, setExtras] = useState("");
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState([]);
  const [error, setError] = useState("");
  const [rawText, setRawText] = useState("");
  const [streamText, setStreamText] = useState("");
  const resultsRef = useRef(null);

  const canSubmit = condicion && sintomas.trim().length > 10 && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setSections([]);
    setRawText("");
    setStreamText("");

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: buildUserPrompt(condicion, sintomas, tiempo, extras),
            },
          ],
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Error en la API");
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || "";
      setRawText(text);
      const parsed = parseResponse(text);
      setSections(parsed);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) {
      setError(e.message || "Error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080e0c",
      fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
      color: "#e0ede8",
      padding: "0",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,700;1,400&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        textarea:focus, select:focus, input:focus {
          outline: none;
          border-color: #4EB8A0 !important;
          box-shadow: 0 0 0 2px rgba(78,184,160,0.15) !important;
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0f1a16; }
        ::-webkit-scrollbar-thumb { background: #1e3d30; border-radius: 3px; }
        .chip-btn {
          background: #0d1e18;
          border: 1px solid #1a3028;
          color: #7ab8a8;
          border-radius: 6px;
          padding: 8px 14px;
          cursor: pointer;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.05em;
          transition: all 0.15s;
        }
        .chip-btn:hover { background: #122519; border-color: #4EB8A0; color: #4EB8A0; }
        .chip-btn.active { background: #0f3025; border-color: #4EB8A0; color: #4EB8A0; box-shadow: 0 0 8px rgba(78,184,160,0.2); }
      `}</style>

      {/* Header */}
      <div style={{
        borderBottom: "1px solid #1a3028",
        padding: "20px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        background: "rgba(8,14,12,0.95)",
        backdropFilter: "blur(8px)",
        zIndex: 10,
      }}>
        <div>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "11px",
            color: "#4EB8A0",
            letterSpacing: "0.15em",
            marginBottom: "4px",
          }}>
            GPC · CENETEC MÉXICO
          </div>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "22px",
            fontWeight: "700",
            color: "#e8f5f0",
            letterSpacing: "-0.01em",
          }}>
            DiagnósticoIA
          </div>
        </div>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "10px",
          color: "#2d5a48",
          textAlign: "right",
          lineHeight: 1.6,
        }}>
          APOYO CLÍNICO<br />
          <span style={{ color: "#4EB8A0" }}>● ACTIVO</span>
        </div>
      </div>

      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* Disclaimer */}
        <div style={{
          background: "#0d1e18",
          border: "1px solid #1a3028",
          borderRadius: "8px",
          padding: "12px 16px",
          marginBottom: "28px",
          display: "flex",
          gap: "10px",
          alignItems: "flex-start",
        }}>
          <span style={{ fontSize: "16px", flexShrink: 0 }}>⚕️</span>
          <p style={{
            margin: 0,
            fontSize: "12px",
            color: "#5a8a7a",
            fontFamily: "'IBM Plex Mono', monospace",
            lineHeight: 1.6,
          }}>
            Herramienta de apoyo clínico basada en GPC CENETEC. No sustituye el juicio clínico ni la evaluación presencial. Uso exclusivo para profesionales de la salud.
          </p>
        </div>

        {/* Condición selector */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{
            display: "block",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "11px",
            color: "#4EB8A0",
            letterSpacing: "0.1em",
            marginBottom: "12px",
          }}>
            MOTIVO DE CONSULTA PRINCIPAL
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {CONDICIONES.map(c => (
              <button
                key={c.id}
                className={`chip-btn${condicion === c.id ? " active" : ""}`}
                onClick={() => setCondicion(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
          {condicion && (
            <div style={{
              marginTop: "8px",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "11px",
              color: "#2d5a48",
            }}>
              → {CONDICIONES.find(c => c.id === condicion)?.full}
            </div>
          )}
        </div>

        {/* Síntomas */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{
            display: "block",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "11px",
            color: "#4EB8A0",
            letterSpacing: "0.1em",
            marginBottom: "10px",
          }}>
            SIGNOS Y SÍNTOMAS *
          </label>
          <textarea
            value={sintomas}
            onChange={e => setSintomas(e.target.value)}
            placeholder="Describe los signos y síntomas del paciente. Ej: fiebre de 38.5°C, odinofagia intensa, adenopatías cervicales dolorosas, sin tos..."
            rows={4}
            style={{
              width: "100%",
              background: "#0d1e18",
              border: "1px solid #1a3028",
              borderRadius: "8px",
              padding: "14px 16px",
              color: "#c8d8d0",
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: "14px",
              lineHeight: 1.6,
              resize: "vertical",
              transition: "border-color 0.2s",
            }}
          />
        </div>

        {/* Tiempo + extras en dos columnas */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "28px" }}>
          <div>
            <label style={{
              display: "block",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "11px",
              color: "#4EB8A0",
              letterSpacing: "0.1em",
              marginBottom: "10px",
            }}>
              TIEMPO DE EVOLUCIÓN
            </label>
            <input
              value={tiempo}
              onChange={e => setTiempo(e.target.value)}
              placeholder="Ej: 3 días, 2 semanas..."
              style={{
                width: "100%",
                background: "#0d1e18",
                border: "1px solid #1a3028",
                borderRadius: "8px",
                padding: "12px 14px",
                color: "#c8d8d0",
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: "14px",
                transition: "border-color 0.2s",
              }}
            />
          </div>
          <div>
            <label style={{
              display: "block",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "11px",
              color: "#4EB8A0",
              letterSpacing: "0.1em",
              marginBottom: "10px",
            }}>
              CONTEXTO ADICIONAL
            </label>
            <input
              value={extras}
              onChange={e => setExtras(e.target.value)}
              placeholder="Comorbilidades, medicamentos, embarazo..."
              style={{
                width: "100%",
                background: "#0d1e18",
                border: "1px solid #1a3028",
                borderRadius: "8px",
                padding: "12px 14px",
                color: "#c8d8d0",
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: "14px",
                transition: "border-color 0.2s",
              }}
            />
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            width: "100%",
            padding: "16px",
            background: canSubmit ? "linear-gradient(135deg, #1a4a35, #0f3025)" : "#0d1e18",
            border: `1px solid ${canSubmit ? "#4EB8A0" : "#1a3028"}`,
            borderRadius: "8px",
            color: canSubmit ? "#4EB8A0" : "#2d5a48",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "13px",
            fontWeight: "600",
            letterSpacing: "0.1em",
            cursor: canSubmit ? "pointer" : "not-allowed",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          {loading ? (
            <>
              <span style={{ animation: "pulse 1s infinite" }}>⬤</span>
              ANALIZANDO...
            </>
          ) : (
            "→ ANALIZAR CASO CLÍNICO"
          )}
        </button>

        {/* Error */}
        {error && (
          <div style={{
            marginTop: "16px",
            background: "#1a0f0f",
            border: "1px solid #4a1a1a",
            borderRadius: "8px",
            padding: "14px 16px",
            color: "#d47a7a",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "12px",
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Results */}
        {sections.length > 0 && (
          <div ref={resultsRef} style={{ marginTop: "40px" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "20px",
              paddingBottom: "16px",
              borderBottom: "1px solid #1a3028",
            }}>
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "11px",
                color: "#4EB8A0",
                letterSpacing: "0.1em",
              }}>
                ANÁLISIS CLÍNICO
              </div>
              <div style={{
                flex: 1,
                height: "1px",
                background: "linear-gradient(to right, #1a3028, transparent)",
              }} />
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "10px",
                color: "#2d5a48",
              }}>
                GPC · CENETEC
              </div>
            </div>
            {sections.map((s, i) => (
              <SectionCard key={s.key} section={s} index={i} />
            ))}
            <div style={{
              marginTop: "16px",
              padding: "12px 16px",
              background: "#0a1510",
              border: "1px solid #1a2820",
              borderRadius: "8px",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "10px",
              color: "#2d5a48",
              lineHeight: 1.7,
            }}>
              Generado con ayuda de Claude · Basado en GPC CENETEC México · Verificar siempre con fuente primaria · No usar en emergencias sin evaluación clínica directa
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
