import { EffectCallback } from 'react';
/** This is a drop-in replacement for useEffect that will execute the first effect that happens during initial mount synchronously */
export declare const useImmediateEffect: (effect: EffectCallback, changes: readonly any[]) => void;
