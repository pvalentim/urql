import { Source } from 'wonka';
import { Exchange, GraphQLRequest, Operation, OperationContext, OperationResult, OperationType, RequestPolicy, PromisifiedSource } from './types';
import { DocumentNode } from 'graphql';
/** Options for configuring the URQL [client]{@link Client}. */
export interface ClientOptions {
    /** Target endpoint URL such as `https://my-target:8080/graphql`. */
    url: string;
    /** Any additional options to pass to fetch. */
    fetchOptions?: RequestInit | (() => RequestInit);
    /** An alternative fetch implementation. */
    fetch?: typeof fetch;
    /** An ordered array of Exchanges. */
    exchanges?: Exchange[];
    /** Activates support for Suspense. */
    suspense?: boolean;
    /** The default request policy for requests. */
    requestPolicy?: RequestPolicy;
}
interface ActiveOperations {
    [operationKey: string]: number;
}
export declare const createClient: (opts: ClientOptions) => Client;
/** The URQL application-wide client library. Each execute method starts a GraphQL request and returns a stream of results. */
export declare class Client {
    url: string;
    fetch?: typeof fetch;
    fetchOptions?: RequestInit | (() => RequestInit);
    exchange: Exchange;
    suspense: boolean;
    requestPolicy: RequestPolicy;
    dispatchOperation: (operation: Operation) => void;
    operations$: Source<Operation>;
    results$: Source<OperationResult>;
    activeOperations: ActiveOperations;
    constructor(opts: ClientOptions);
    private createOperationContext;
    createRequestOperation: (type: OperationType, { key, query, variables }: GraphQLRequest, opts?: Partial<OperationContext> | undefined) => Operation;
    /** Counts up the active operation key and dispatches the operation */
    private onOperationStart;
    /** Deletes an active operation's result observable and sends a teardown signal through the exchange pipeline */
    private onOperationEnd;
    /** Executes an Operation by sending it through the exchange pipeline It returns an observable that emits all related exchange results and keeps track of this observable's subscribers. A teardown signal will be emitted when no subscribers are listening anymore. */
    executeRequestOperation(operation: Operation): Source<OperationResult>;
    reexecuteOperation: (operation: Operation) => void;
    query(query: DocumentNode | string, variables?: object, context?: Partial<OperationContext>): PromisifiedSource<OperationResult>;
    executeQuery: (query: GraphQLRequest, opts?: Partial<OperationContext> | undefined) => Source<OperationResult<any>>;
    executeSubscription: (query: GraphQLRequest, opts?: Partial<OperationContext> | undefined) => Source<OperationResult<any>>;
    mutation(query: DocumentNode | string, variables?: object, context?: Partial<OperationContext>): PromisifiedSource<OperationResult>;
    executeMutation: (query: GraphQLRequest, opts?: Partial<OperationContext> | undefined) => Source<OperationResult<any>>;
}
export {};
