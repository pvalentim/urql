import { ReactElement } from 'react';
import { OperationContext } from '../types';
import { UseQueryArgs, UseQueryState } from '../hooks';
export interface QueryProps<T, V> extends UseQueryArgs<V> {
    children: (arg: QueryState<T>) => ReactElement<any>;
}
export interface QueryState<T> extends UseQueryState<T> {
    executeQuery: (opts?: Partial<OperationContext>) => void;
}
export declare function Query<T = any, V = any>(props: QueryProps<T, V>): ReactElement<any>;
