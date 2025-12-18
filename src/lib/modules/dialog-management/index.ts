// Dialog Management Module - Centralized dialog and modal management
export { DialogStateManager } from './dialogStateManager';
export { ModalQueue } from './modalQueue';

export type {
  DialogConfig,
  DialogState,
  DialogEventType,
  DialogEvent,
  QueuedModal,
  ModalQueueConfig
} from './dialogStateManager';

// Main exports - use the classes directly for static methods
// Example usage:
// import { DialogStateManager, ModalQueue } from '@/lib/modules/dialog-management';
// const confirmDialog = DialogStateManager.createConfirmDialog('confirm-1', 'Delete Item', 'Are you sure?', onConfirm);
// const highPriorityModal = ModalQueue.createHighPriorityModal('modal-1', config);