import { DocumentNode } from 'graphql';
import { CombinedError } from '../utils';
import { OperationContext } from '../types';
import { Client } from '../client';
export interface UseSubscriptionArgs<V> {
    query: DocumentNode | string;
    variables?: V;
    pause?: boolean;
    context?: Partial<OperationContext>;
    client?: Client;
}
export declare type SubscriptionHandler<T, R> = (prev: R | undefined, data: T) => R;
export interface UseSubscriptionState<T> {
    fetching: boolean;
    data?: T;
    error?: CombinedError;
    extensions?: Record<string, any>;
}
export declare type UseSubscriptionResponse<T> = [UseSubscriptionState<T>, (opts?: Partial<OperationContext>) => void];
export declare const useSubscription: <T = any, R = T, V = object>(args: UseSubscriptionArgs<V>, handler?: SubscriptionHandler<T, R> | undefined) => [UseSubscriptionState<R>, (opts?: Partial<OperationContext> | undefined) => void];
