# Risk Office · Sistema SGB

Plataforma de gestión de riesgos empresariales construida sobre el registro de
riesgos del proyecto **Sistema SGB** (Sistema de Gestión de Biblioteca).

Next.js (App Router) · React · TypeScript · Tailwind CSS · Recharts · SheetJS · jsPDF.

---

## Puesta en marcha

```bash
npm install
npm run dev      # http://localhost:3000
```

Build de producción:

```bash
npm run build
npm start
```

## Despliegue en Vercel

1. Sube este repositorio a GitHub.
2. En Vercel: **New Project → Import** el repo.
3. Framework: *Next.js* (autodetectado). No requiere variables de entorno.
4. Deploy.

La app es totalmente client-side para los datos (no necesita backend), por lo que
funciona en el plan gratuito de Vercel sin configuración adicional.

---

## Páginas

| Ruta         | Contenido |
|--------------|-----------|
| `/`          | Resumen ejecutivo · KPIs · **Matriz de Riesgo** · distribuciones |
| `/analysis`  | Distribuciones por categoría/etapa/ciclo/responsable · ranking por magnitud |
| `/response`  | Estrategias de respuesta · análisis de estado · tabla resumen |
| `/pert`      | Exposición económica · costos PERT · **justificación de cada monto** |
| `/explorer`  | Ficha completa de cualquier riesgo · exportación a PDF |
| `/admin`     | Importar un nuevo workbook (validación + preview + confirmación) |

El **selector de dataset** (arriba a la derecha) alterna entre *Riesgos Negativos*
y *Riesgos Positivos*; todas las páginas, KPIs, gráficos y tablas se recalculan.

---

## Arquitectura de datos

```
Excel  →  parser.ts  →  RiskDataset (JSON)  →  store.tsx (contexto + persistencia)
                                                   │
                                  riskService.ts (KPIs, agregaciones, PERT)
                                                   │
                          páginas · gráficos · tablas · explorador · PDF
```

- `src/lib/types.ts` — modelo de dominio.
- `src/lib/parser.ts` — lee el workbook con SheetJS. **Detecta la fila de
  encabezado y mapea columnas por su texto**, así tolera cambios de layout entre
  versiones del Excel.
- `src/lib/riskService.ts` — toda la lógica derivada (matriz, bandas de magnitud,
  conteos, rankings, distribuciones, justificación económica). Ningún gráfico lee
  el Excel directamente.
- `src/lib/store.tsx` — contexto de React; carga la semilla y persiste importaciones.
- `src/lib/pdf.ts` — informe PDF por riesgo (jsPDF + autotable).

### Datos semilla

`public/seed-data.json` contiene los datos reales del proyecto SGB ya parseados
(44 riesgos negativos, 22 positivos, 44 registros PERT, 21 roles). La app arranca
con estos datos sin necesidad de subir nada.

---

## Persistencia (nota honesta)

El prompt original priorizaba **Vercel Blob → JSON en servidor → localStorage**.

Esta entrega usa **localStorage** como estrategia principal porque:

- Vercel Blob requiere un token (`BLOB_READ_WRITE_TOKEN`) y una cuenta/almacén que
  no puedo aprovisionar por ti; añadirlo sin configurarlo dejaría la app rota al
  desplegar.
- localStorage cumple el requisito funcional declarado: *"el tablero debe seguir
  funcionando tras recargar"*. Los datos importados sobreviven al refresh.

**Limitación real:** localStorage es por navegador/dispositivo. Si abres la app en
otro equipo no verás un workbook importado en el primero (sí verás los datos
semilla).

### Cómo migrar a Vercel Blob (si lo necesitas)

1. `npm i @vercel/blob`.
2. Crea una ruta `app/api/dataset/route.ts` con `PUT` (guardar) y `GET` (leer)
   usando `put()` / `list()` de `@vercel/blob`.
3. En `store.tsx`, reemplaza la lectura/escritura de `localStorage` por `fetch`
   a esa ruta. La forma de `RiskDataset` no cambia, así que el resto de la app
   sigue igual.
4. Añade `BLOB_READ_WRITE_TOKEN` en las variables de entorno de Vercel.

---

## Formato de workbook esperado

- **Obligatoria:** hoja `Riesgos Negativos`.
- **Opcionales:** `Riesgos Positivos`, `PERT`, `SUELDOS por ROLES`.
- Los encabezados pueden estar en distintas filas; el parser los localiza por
  texto (p. ej. `Nro.`, `Riesgo/Evento de Riesgo`, `Magnitud`, `Pert (Costo)`).
- Filas de totales (`PERT TOTAL`) se ignoran automáticamente.

---

## Notas sobre los cálculos

- **PERT** se muestra con la fórmula `(O + 4·M + P) / 6` y se marca *coincide* /
  *verificar* comparando con el valor del workbook (tolerancia 1%).
- Las **"horas implícitas"** del explorador y de la página PERT son **derivadas**
  (costo ÷ tarifa del rol) y están rotuladas como *estimado*: no son un dato del
  workbook, sino una ilustración de la relación costo/tarifa.
- El resto de KPIs (promedios, conteos, exposición total) se calculan en vivo a
  partir de los datos cargados.
