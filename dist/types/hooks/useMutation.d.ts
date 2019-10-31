import { DocumentNode } from 'graphql';
import { OperationResult, OperationContext } from '../types';
import { CombinedError } from '../utils';
import { Client } from '../client';
export interface UseMutationState<T> {
    fetching: boolean;
    data?: T;
    error?: CombinedError;
    extensions?: Record<string, any>;
}
export declare type UseMutationResponse<T, V> = [UseMutationState<T>, (variables?: V, context?: Partial<OperationContext>) => Promise<OperationResult<T>>];
export declare const useMutation: <T = any, V = object>(query: string | DocumentNode, client?: Client | undefined) => [UseMutationState<T>, (variables?: V | undefined, context?: Partial<OperationContext> | undefined) => Promise<OperationResult<T>>];
