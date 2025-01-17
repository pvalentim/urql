import { Exchange } from '../types';
export interface SerializedResult {
    data?: any;
    error?: {
        networkError?: string;
        graphQLErrors: string[];
    };
}
export interface SSRData {
    [key: string]: SerializedResult;
}
export interface SSRExchangeParams {
    isClient?: boolean;
    initialState?: SSRData;
}
export interface SSRExchange extends Exchange {
    /** Rehydrates cached data */
    restoreData(data: SSRData): void;
    /** Extracts cached data */
    extractData(): SSRData;
}
/** The ssrExchange can be created to capture data during SSR and also to rehydrate it on the client */
export declare const ssrExchange: (params?: SSRExchangeParams | undefined) => SSRExchange;
