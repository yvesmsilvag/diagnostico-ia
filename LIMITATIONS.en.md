# DiagnósticoIA — Limitations

🇪🇸 [Versión en español disponible](./LIMITATIONS.md)

This document honestly describes what this tool **cannot do** and the contexts in which it **should not be used**. Transparency about limitations is a core principle of responsible AI design in medicine.

---

## Clinical limitations

### 1. It evaluates text — not the patient
The model receives a natural language description. It cannot auscultate, palpate, observe facial expression, measure real-time vital signs, or interpret lab results or imaging. All information depends on what the physician enters — if the description is incomplete or imprecise, the analysis will be too.

### 2. Not designed for complex multimorbidity
The tool is optimized for the six most frequent primary care consultation reasons. Patients with multiple interacting comorbidities, atypical presentations, or diagnoses outside these six categories are outside the design scope.

### 3. Not appropriate for emergencies
In the presence of any alarm sign (altered consciousness, severe respiratory distress, shock, meningeal signs, etc.), the correct action is to stabilize and refer. This tool must not be used as a substitute for an emergency protocol.

### 4. No pediatric dosing
Management recommendations are calibrated for adult patients. Do not use for dose calculation in patients under 18.

### 5. No specific pregnancy or lactation adjustments
Although the "additional context" field allows entering this information, the model has no specific instructions to adjust pharmacological recommendations for pregnancy or lactation. Consult obstetric guidelines and drug datasheets directly.

### 6. Guidelines update — the model does not
CENETEC Clinical Practice Guidelines are periodically revised. The model was trained on data up to a certain date and may not reflect recent updates. Always verify at: https://www.cenetec.salud.gob.mx/gpc

### 7. The model may hallucinate references
Although the system prompt instructs citation of specific GPC guidelines, language models can generate incorrect references or mix content from different guidelines. Treat any cited reference as a lead to verify, not a confirmed citation.

---

## Technical limitations

### 8. API key exposed on the client
This demo version makes direct calls to the Anthropic API from the browser, which exposes the API key in the client-side source code. **Do not use with a production key or a high spending limit.** A production version would require a backend proxy keeping the key server-side.

### 9. No data persistence
The app does not save consultation history. Each session starts from scratch. Not suitable for longitudinal patient follow-up.

### 10. No user identity validation
There is no authentication mechanism. Anyone with access to the URL can use the tool. A real deployment with patients would require authentication and access control.

### 11. Latency dependent on the API
Response time depends on Anthropic API availability and load. Under high demand there may be 10–30 second latency. Not suitable for time-critical contexts.

---

## What this tool does well

- **Explicit reasoning:** shows the diagnostic process step by step, allowing the physician to identify gaps or errors in the model's reasoning
- **Condition-specific clinical frameworks:** not a generic chatbot — each condition has its own reasoning flow encoded in the system prompt
- **Mexican guideline anchoring:** the normative context is explicitly Mexican, not adapted from US or European guidelines
- **Probabilistic language:** the model uses "probable," "rule out," "consider" rather than certainties, better reflecting clinical reality

---

## Responsibility

Use of this tool is the responsibility of the healthcare professional using it. The author assumes no responsibility for clinical decisions made based on its outputs.
