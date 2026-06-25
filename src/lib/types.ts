// Central domain model. Every page/chart/table consumes these types only —
// never raw worksheet rows.

export type DatasetKey = "negativos" | "positivos";

export interface Risk {
  id: string;
  numero: number;
  nombre: string;
  tipo: string | null;            // Tipo de Riesgo (negativos only)
  categoria: string | null;
  etapaProyecto: string | null;
  cicloVidaSW: string | null;
  fuente: string | null;          // Fuente / Causa / Condición
  impacta: string | null;         // Impacta a / Consecuencias / Objetivos
  descripcion: string | null;
  probabilidad: string | null;    // Alta / Media / Baja
  valorProbabilidad: number | null;
  impacto: string | null;
  valorImpacto: number | null;
  magnitud: string | null;        // Alto / Medio / Bajo (from workbook)
  magnitudValor: number | null;   // valorProbabilidad * valorImpacto (derived)
  pertCosto: number | null;       // negativos only
  pertTiempo: number | null;      // negativos only (days)
  responsable: string | null;
  clasificacionCosto: string | null;
  costoEvento: number | null;     // Riesgo/Evento de Riesgo ($)
  cuando: string | null;
  planMitigacion: string | null;
  planContingencia: string | null;
  estado: string | null;          // Estado
  respuesta: string | null;       // Respuesta al riesgo / Tipo de estrategia
  justificacion: string | null;
  fechaIdentificacion: string | null;
  fechaCompromiso: string | null;
  fechaTermino: string | null;
}

export interface PertRecord {
  numero: number;
  nombre: string;
  costoOptimista: number | null;
  costoPesimista: number | null;
  costoMasProbable: number | null;
  costoPert: number | null;
  tiempoOptimista: number | null;
  tiempoPesimista: number | null;
  tiempoMasProbable: number | null;
  tiempoPert: number | null;
}

export interface RoleSalary {
  cargo: string;
  sueldoMensual: number | null;
  costoHoraDia: number | null;    // Hora-Hombre por día
  costoHora: number | null;       // valor por hora
}

export interface ProjectMeta {
  idProyecto: string;
  nombreProyecto: string;
  director: string | null;
}

// Standalone summary values that live in loose cells of the workbook
// (typically below the risk tables), scanned by label rather than position.
export interface ProjectTotals {
  pertTotal: number | null;
  riesgoTotal: number | null;
  fondoContingencia: number | null;
  remanente: number | null;
}

export interface RiskDataset {
  meta: ProjectMeta;
  negativos: Risk[];
  positivos: Risk[];
  pert: PertRecord[];
  roles: RoleSalary[];
  totals?: ProjectTotals;
}

export interface CountItem {
  label: string;
  value: number;
}

export interface KpiSet {
  total: number;
  byStatus: CountItem[];        // dynamic — supports any future status
  highMagnitude: number;
  avgProbabilidad: number;
  avgImpacto: number;
  totalExposure: number;        // sum of PERT cost (negativos) / event cost
}
