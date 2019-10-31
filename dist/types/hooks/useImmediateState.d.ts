declare type SetStateAction<S> = S | ((prevState: S) => S);
declare type SetState<S> = (action: SetStateAction<S>) => void;
/**
 * This is a drop-in replacement for useState, limited to object-based state.
 * During initial mount it will mutably update the state, instead of scheduling
 * a React update using setState
 */
export declare const useImmediateState: <S extends {}>(init: S) => [S, SetState<S>];
export {};
