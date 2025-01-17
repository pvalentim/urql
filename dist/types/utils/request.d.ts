import { DocumentNode } from 'graphql';
import { GraphQLRequest, Operation } from '../types';
export declare const createRequest: (q: string | DocumentNode, vars?: object | undefined) => GraphQLRequest;
/** Spreads the provided metadata to the source operation's meta property in context.  */
export declare const addMetadata: (source: Operation, meta: import("../types").OperationDebugMeta) => {
    context: {
        meta: {
            source?: string | undefined;
            cacheOutcome?: "miss" | "partial" | "hit" | undefined;
            networkLatency?: number | undefined;
            startTime?: number | undefined;
        } | {
            source?: string | undefined;
            cacheOutcome?: "miss" | "partial" | "hit" | undefined;
            networkLatency?: number | undefined;
            startTime?: number | undefined;
        };
        fetchOptions?: RequestInit | (() => RequestInit) | undefined;
        requestPolicy: import("../types").RequestPolicy;
        url: string;
        pollInterval?: number | undefined;
        suspense?: boolean | undefined;
    };
    operationName: import("../types").OperationType;
    key: number;
    query: DocumentNode;
    variables?: object | undefined;
};
