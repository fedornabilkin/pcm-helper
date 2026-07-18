import {computed, ref, type ComputedRef, type Ref} from 'vue'

export type AccessTier = 'basic' | 'premium'
export type FeatureCode = 'aiAnalysis' | 'selectiveImport' | 'customFunctionalCircles' | 'advancedStatistics'
export type LimitCode = 'networks' | 'nodesPerNetwork' | 'tagsPerNetwork'

export type AccessGuardResult =
  | {success: true}
  | {success: false; reason: 'premium_required' | 'limit_reached'; limit?: number}

interface AccessPolicy {
  networks: number;
  nodesPerNetwork: number;
  tagsPerNetwork: number;
  aiAnalysis: boolean;
  selectiveImport: boolean;
  customFunctionalCircles: boolean;
  advancedStatistics: boolean;
}

export const ACCESS_POLICY: Record<AccessTier, AccessPolicy> = {
  basic: {
    networks: 1,
    nodesPerNetwork: 50,
    tagsPerNetwork: 5,
    aiAnalysis: false,
    selectiveImport: false,
    customFunctionalCircles: false,
    advancedStatistics: false,
  },
  premium: {
    networks: 3,
    nodesPerNetwork: 500,
    tagsPerNetwork: 50,
    aiAnalysis: true,
    selectiveImport: true,
    customFunctionalCircles: true,
    advancedStatistics: true,
  },
}

export interface PremiumActivationResult {
  ok: boolean;
  message: string;
}

const SESSION_KEY = 'pcm-premium-access'
const readPremiumSession = (): boolean => {
  try {
    return sessionStorage.getItem(SESSION_KEY) === 'active'
  } catch {
    return false
  }
}

const premiumActive = ref(readPremiumSession())
const tier = computed<AccessTier>(() => premiumActive.value ? 'premium' : 'basic')

export const getAccessPolicy = (): AccessPolicy => ACCESS_POLICY[tier.value]

export const checkFeatureAccess = (feature: FeatureCode): AccessGuardResult => {
  return getAccessPolicy()[feature]
    ? {success: true}
    : {success: false, reason: 'premium_required'}
}

export const checkLimitAccess = (resource: LimitCode, used: number): AccessGuardResult => {
  const limit = getAccessPolicy()[resource]
  return used < limit
    ? {success: true}
    : {success: false, reason: 'limit_reached', limit}
}

export const usePremiumAccess = (): {
  isPremium: Readonly<Ref<boolean>>;
  tier: Readonly<ComputedRef<AccessTier>>;
  activate: (code: string) => PremiumActivationResult;
  deactivate: () => void;
  can: (feature: FeatureCode) => boolean;
  getLimit: (resource: LimitCode) => number;
} => {
  const activate = (code: string): PremiumActivationResult => {
    if (code.trim().toLocaleLowerCase('ru-RU') !== 'premium') {
      return {ok: false, message: 'Промокод не подошёл. Проверьте написание и попробуйте ещё раз.'}
    }

    premiumActive.value = true
    try {
      sessionStorage.setItem(SESSION_KEY, 'active')
    } catch {
      // Состояние всё равно доступно до завершения текущей работы приложения.
    }
    return {ok: true, message: 'Premium активен до конца текущей сессии браузера.'}
  }

  const deactivate = (): void => {
    premiumActive.value = false
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch {
      // Игнорируем недоступное хранилище: реактивное состояние уже обновлено.
    }
  }

  return {
    isPremium: premiumActive,
    tier,
    activate,
    deactivate,
    can: (feature: FeatureCode): boolean => checkFeatureAccess(feature).success,
    getLimit: (resource: LimitCode): number => ACCESS_POLICY[tier.value][resource],
  }
}
