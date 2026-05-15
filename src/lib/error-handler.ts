export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

import { supabase } from './supabase';

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  // We'll refactor this to handle Supabase errors but keep the signature for compatibility
  const user = supabase.auth.getUser(); // This is async but for logging purposes we can keep it simple
  
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Supabase/Data Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
