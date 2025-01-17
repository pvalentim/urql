import { Operation, OperationResult } from '../types';
export declare const makeResult: (operation: Operation, result: any, response?: any) => OperationResult<any>;
export declare const makeErrorResult: (operation: Operation, error: Error, response?: any) => OperationResult<any>;
