import { DocumentNode } from 'graphql';
import { Source } from 'wonka';
import { Client } from './client';
import { CombinedError } from './utils/error';
export { ExecutionResult } from 'graphql';
/** Utility type to Omit keys from an interface/object type */
export declare type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export declare type PromisifiedSource<T = any> = Source<T> & {
    toPromise: () => Promise<T>;
};
/** The type of GraphQL operation being executed. */
export declare type OperationType = 'subscription' | 'query' | 'mutation' | 'teardown';
/** The strategy that is used to request results from network and/or the cache. */
export declare type RequestPolicy = 'cache-first' | 'cache-only' | 'network-only' | 'cache-and-network';
/** How the operation has */
export declare type CacheOutcome = 'miss' | 'partial' | 'hit';
/** A Graphql query, mutation, or subscription. */
export interface GraphQLRequest {
    /** Unique identifier of the request. */
    key: number;
    query: DocumentNode;
    variables?: object;
}
/** Metadata that is only available in development for devtools. */
export interface OperationDebugMeta {
    source?: string;
    cacheOutcome?: CacheOutcome;
    networkLatency?: number;
    startTime?: number;
}
/** Additional metadata passed to [exchange]{@link Exchange} functions. */
export interface OperationContext {
    [key: string]: any;
    fetchOptions?: RequestInit | (() => RequestInit);
    requestPolicy: RequestPolicy;
    url: string;
    pollInterval?: number;
    meta?: OperationDebugMeta;
    suspense?: boolean;
}
/** A [query]{@link Query} or [mutation]{@link Mutation} with additional metadata for use during transmission. */
export interface Operation extends GraphQLRequest {
    operationName: OperationType;
    context: OperationContext;
}
/** Resulting data from an [operation]{@link Operation}. */
export interface OperationResult<Data = any> {
    /** The [operation]{@link Operation} which has been executed. */
    operation: Operation;
    /** The data returned from the Graphql server. */
    data?: Data;
    /** Any errors resulting from the operation. */
    error?: CombinedError;
    /** Optional extensions return by the Graphql server. */
    extensions?: Record<string, any>;
}
/** Input parameters for to an Exchange factory function. */
export interface ExchangeInput {
    forward: ExchangeIO;
    client: Client;
}
/** Function responsible for listening for streamed [operations]{@link Operation}. */
export declare type Exchange = (input: ExchangeInput) => ExchangeIO;
/** Function responsible for receiving an observable [operation]{@link Operation} and returning a [result]{@link OperationResult}. */
export declare type ExchangeIO = (ops$: Source<Operation>) => Source<OperationResult>;
