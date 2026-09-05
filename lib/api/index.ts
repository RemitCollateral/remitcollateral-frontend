/**
 * The API entry point. Swaps between the mock and the live backend on
 * NEXT_PUBLIC_API_MODE, so every screen imports the same `api` object.
 */

import { API_MODE } from '@/lib/config';
import { mockApi } from './mock';
import { httpApi } from './http';
import type { RemitCollateralApi } from './types';

export const api: RemitCollateralApi = API_MODE === 'live' ? httpApi : mockApi;

export { ApiError } from './types';
export type { RemitCollateralApi } from './types';
export { buildLoanQuote } from './quote';
