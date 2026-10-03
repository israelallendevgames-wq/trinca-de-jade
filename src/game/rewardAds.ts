export type RewardedPlacement = 'extra-hint' | 'extra-shuffle' | 'background-unlock';
export type RewardedAdResult = 'rewarded' | 'dismissed' | 'unavailable';

interface RewardedAdBridge {
  showRewardedAd: (placement: RewardedPlacement) => Promise<RewardedAdResult>;
}

declare global {
  interface Window {
    RewardedAdBridge?: RewardedAdBridge;
  }
}

export async function showRewardedAd(placement: RewardedPlacement): Promise<RewardedAdResult> {
  if (typeof window === 'undefined' || !window.RewardedAdBridge) return 'unavailable';
  try {
    const result = await window.RewardedAdBridge.showRewardedAd(placement);
    return result === 'rewarded' ? 'rewarded' : 'dismissed';
  } catch {
    return 'unavailable';
  }
}
