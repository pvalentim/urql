import { DocumentNode } from 'graphql';
import { OperationContext, RequestPolicy } from '../types';
import { CombinedError } from '../utils';
import { Client } from '../client';
export interface UseQueryArgs<V> {
    query: string | DocumentNode;
    variables?: V;
    requestPolicy?: RequestPolicy;
    pollInterval?: number;
    context?: Partial<OperationContext>;
    client?: Client;
    pause?: boolean;
}
export interface UseQueryState<T> {
    fetching: boolean;
    data?: T;
    error?: CombinedError;
    extensions?: Record<string, any>;
}
export declare type UseQueryResponse<T> = [UseQueryState<T>, (opts?: Partial<OperationContext>) => void];
export declare const useQuery: <T = any, V = object>(args: UseQueryArgs<V>) => [UseQueryState<T>, (opts?: Partial<OperationContext> | undefined) => void];
