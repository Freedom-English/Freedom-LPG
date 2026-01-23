
import { LessonPlan } from "../types";

const PLANS_KEY = 'freedom_plans';

export const getSavedPlans = (): LessonPlan[] => {
  try {
    const saved = localStorage.getItem(PLANS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error("Erro ao carregar planos:", e);
    return [];
  }
};

export const saveLessonPlanSafely = (newPlan: LessonPlan): boolean => {
  let plans = getSavedPlans();
  plans = [newPlan, ...plans];

  try {
    localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
    return true;
  } catch (e: any) {
    // Verifica se é erro de cota (QuotaExceededError)
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22) {
      console.warn("Storage quota exceeded. Attempting auto-pruning...");
      
      // Tenta remover os planos mais antigos um por um até caber
      while (plans.length > 1) {
        plans.pop(); // Remove a aula mais antiga
        try {
          localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
          console.info("Auto-pruning successful. Oldest lesson removed to save space.");
          alert("Sua biblioteca está cheia! Removi automaticamente a aula mais antiga para salvar a nova.");
          return true;
        } catch (innerError) {
          // Continua tentando se ainda não couber
        }
      }
    }
    
    console.error("Critical storage error:", e);
    alert("Erro crítico ao salvar: sua biblioteca está muito cheia e não foi possível liberar espaço automaticamente. Por favor, exclua algumas aulas manualmente.");
    return false;
  }
};

export const deletePlanSafely = (id: string): LessonPlan[] => {
  const plans = getSavedPlans();
  const filtered = plans.filter(p => p.id !== id);
  localStorage.setItem(PLANS_KEY, JSON.stringify(filtered));
  return filtered;
};

export const clearAllPlans = (): void => {
  localStorage.removeItem(PLANS_KEY);
};
