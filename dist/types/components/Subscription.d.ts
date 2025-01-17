import { ReactElement } from 'react';
import { OperationContext } from '../types';
import { UseSubscriptionArgs, UseSubscriptionState, SubscriptionHandler } from '../hooks';
export interface SubscriptionProps<T, R, V> extends UseSubscriptionArgs<V> {
    handler?: SubscriptionHandler<T, R>;
    children: (arg: SubscriptionState<R>) => ReactElement<any>;
}
export interface SubscriptionState<T> extends UseSubscriptionState<T> {
    executeSubscription: (opts?: Partial<OperationContext>) => void;
}
export declare function Subscription<T = any, R = T, V = any>(props: SubscriptionProps<T, R, V>): ReactElement<any>;
