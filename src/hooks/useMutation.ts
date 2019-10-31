import { DocumentNode } from 'graphql';
import { useCallback } from 'react';
import { pipe, toPromise } from 'wonka';
import { useClient } from '../context';
import { OperationResult, OperationContext } from '../types';
import { CombinedError, createRequest } from '../utils';
import { useImmediateState } from './useImmediateState';
import { Client } from '../client';

export interface UseMutationState<T> {
  fetching: boolean;
  data?: T;
  error?: CombinedError;
  extensions?: Record<string, any>;
}

export type UseMutationResponse<T, V> = [
  UseMutationState<T>,
  (
    variables?: V,
    context?: Partial<OperationContext>
  ) => Promise<OperationResult<T>>
];

export const useMutation = <T = any, V = object>(
  query: DocumentNode | string,
  client?: Client
): UseMutationResponse<T, V> => {
  const _client = useClient(client);
  const [state, setState] = useImmediateState<UseMutationState<T>>({
    fetching: false,
    error: undefined,
    data: undefined,
    extensions: undefined,
  });

  const executeMutation = useCallback(
    (variables?: V, context?: Partial<OperationContext>) => {
      setState({
        fetching: true,
        error: undefined,
        data: undefined,
        extensions: undefined,
      });

      const request = createRequest(query, variables as any);

      return pipe(
        _client.executeMutation(request, context || {}),
        toPromise
      ).then(result => {
        const { data, error, extensions } = result;
        setState({ fetching: false, data, error, extensions });
        return result;
      });
    },
    [_client, query, setState]
  );

  return [state, executeMutation];
};
