import type { ComponentType, Dispatch, SetStateAction } from "react";
import type { EspecialidadData } from "../../types";

interface SectionProps {
  data: EspecialidadData;
  setData: Dispatch<SetStateAction<EspecialidadData>>;
  onPrev: () => void;
}

const sectionMap: Record<string, () => Promise<{ default: ComponentType<SectionProps> }>> = {
  "Pediatría":                    () => import("./SectionPediatria"),
  "Medicina Interna":             () => import("./SectionMedicinaInterna"),
  "Ginecología":                  () => import("./SectionGinecologia"),
  "Cardiología":                  () => import("./SectionCardiologia"),
  "Oftalmología":                 () => import("./SectionOftalmologia"),
  "Medicina Física y Rehabilitación": () => import("./SectionMedicinaFisica"),
  "Neumología":                   () => import("./SectionNeumologia"),
  "Reumatología":                 () => import("./SectionReumatologia"),
  "Radiología":                   () => import("./SectionRadiologia"),
  "Gastroenterología":            () => import("./SectionGastroenterologia"),
  "Odontología":                  () => import("./SectionOdontologia"),
  "Endocrinología":               () => import("./SectionEndocrinologia"),
  "Traumatología":                () => import("./SectionTraumatologia"),
  "Geriatría":                    () => import("./SectionGeriatria"),
  "Medicina General":             () => import("./SectionMedicina"),
  "Medicina Familiar":            () => import("./SectionMedicinaFamiliar"),
  "Ecografías":                   () => import("./SectionEcografias"),
  "Otorrinolaringología":         () => import("./SectionOtorrino"),
  "Urología":                     () => import("./SectionUrologia"),
  "Cosmiatría":                   () => import("./SectionCosmiatra"),
};

export function getEspecialidadLoader(nombre: string) {
  return sectionMap[nombre] ?? null;
}
