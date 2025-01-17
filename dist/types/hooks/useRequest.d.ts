import { DocumentNode } from 'graphql';
import { GraphQLRequest } from '../types';
/** Creates a request from a query and variables but preserves reference equality if the key isn't changing */
export declare const useRequest: (query: string | DocumentNode, variables?: any) => GraphQLRequest;
