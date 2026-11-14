import { ApiError } from '../services/apiClient';

/** Map an ApiError (or anything else) to a translated message. */
export function describeError(error, t) {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'network':
        return t('errors.network');
      case 'http':
        return t('errors.http', { reason: error.message });
      case 'invalid':
        return t('errors.invalid');
      case 'coordinates':
        return t('errors.coordinates');
      case 'aborted':
        return t('errors.aborted');
      default:
        break;
    }
  }
  return t('errors.unknown');
}
