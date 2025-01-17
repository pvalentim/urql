import { Exchange, ExecutionResult, OperationContext } from '../types';
export interface ObserverLike<T> {
    next: (value: T) => void;
    error: (err: any) => void;
    complete: () => void;
}
/** An abstract observable interface conforming to: https://github.com/tc39/proposal-observable */
export interface ObservableLike<T> {
    subscribe(observer: ObserverLike<T>): {
        unsubscribe: () => void;
    };
}
export interface SubscriptionOperation {
    query: string;
    variables?: object;
    key: string;
    context: OperationContext;
}
export declare type SubscriptionForwarder = (operation: SubscriptionOperation) => ObservableLike<ExecutionResult & {
    extensions?: Record<string, any>;
}>;
/** This is called to create a subscription and needs to be hooked up to a transport client. */
export interface SubscriptionExchangeOpts {
    forwardSubscription: SubscriptionForwarder;
}
export declare const subscriptionExchange: ({ forwardSubscription, }: SubscriptionExchangeOpts) => Exchange;
