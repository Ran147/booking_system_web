/**
 * Elemento descriptivo de un hito en la trayectoria historica de la empresa.
 */
export interface AboutMilestoneItem {
  description: string;
  id: string;
  title: string;
  year: string;
}

/**
 * Elemento representativo de una solucion o capacidad clave ofrecida por la plataforma.
 */
export interface AboutOfferingItem {
  description: string;
  icon: "analytics" | "booking" | "collaboration" | "reminders";
  id: string;
  title: string;
}

/**
 * Metrica cuantitativa o indicador clave de rendimiento de la plataforma.
 */
export interface AboutStatItem {
  id: string;
  label: string;
  value: string;
}

/**
 * Retorno del hook useAboutViewModel con los datos enriquecidos y localizados.
 */
export interface UseAboutViewModelReturn {
  milestones: AboutMilestoneItem[];
  offerings: AboutOfferingItem[];
  stats: AboutStatItem[];
}
