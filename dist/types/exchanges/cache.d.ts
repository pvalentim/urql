import { Client } from '../client';
import { Exchange, OperationResult } from '../types';
interface OperationCache {
    [key: string]: Set<number>;
}
export declare const cacheExchange: Exchange;
export declare const afterMutation: (resultCache: Map<number, OperationResult<any>>, operationCache: OperationCache, client: Client) => (response: OperationResult<any>) => void;
export {};
