export interface QueuedModal {
  id: string;
  priority: number; // Higher number = higher priority
  config: any; // Modal configuration
  timestamp: number;
  dependencies?: string[]; // Modal IDs that must be closed first
}

export interface ModalQueueConfig {
  maxConcurrent?: number; // Maximum number of modals that can be open simultaneously
  autoProcess?: boolean; // Automatically process queue when modals are closed
  priorityThreshold?: number; // Minimum priority to interrupt current modals
}

export class ModalQueue {
  private queue: QueuedModal[] = [];
  private activeModals: Set<string> = new Set();
  private config: Required<ModalQueueConfig>;
  private listeners: ((event: { type: string; modalId?: string }) => void)[] = [];

  constructor(config: ModalQueueConfig = {}) {
    this.config = {
      maxConcurrent: 3,
      autoProcess: true,
      priorityThreshold: 100,
      ...config
    };
  }

  enqueue(modal: Omit<QueuedModal, 'timestamp'>): void {
    const queuedModal: QueuedModal = {
      ...modal,
      timestamp: Date.now()
    };

    // Check if modal with same ID already exists
    const existingIndex = this.queue.findIndex(m => m.id === modal.id);
    if (existingIndex !== -1) {
      // Replace existing modal
      this.queue[existingIndex] = queuedModal;
    } else {
      // Add new modal and sort by priority
      this.queue.push(queuedModal);
      this.sortQueue();
    }

    this.emit({ type: 'enqueued', modalId: modal.id });

    if (this.config.autoProcess) {
      this.processQueue();
    }
  }

  dequeue(modalId: string): QueuedModal | null {
    const index = this.queue.findIndex(m => m.id === modalId);
    if (index !== -1) {
      const modal = this.queue.splice(index, 1)[0];
      this.emit({ type: 'dequeued', modalId });
      return modal;
    }
    return null;
  }

  processQueue(): void {
    while (this.canProcessNext()) {
      const nextModal = this.getNextModal();
      if (!nextModal) break;

      // Check dependencies
      if (this.hasPendingDependencies(nextModal)) {
        break;
      }

      // Remove from queue and add to active
      this.dequeue(nextModal.id);
      this.activeModals.add(nextModal.id);
      
      this.emit({ type: 'processing', modalId: nextModal.id });
    }
  }

  markModalClosed(modalId: string): void {
    this.activeModals.delete(modalId);
    this.emit({ type: 'closed', modalId });

    if (this.config.autoProcess) {
      this.processQueue();
    }
  }

  markModalOpened(modalId: string): void {
    this.activeModals.add(modalId);
    this.emit({ type: 'opened', modalId });
  }

  private canProcessNext(): boolean {
    return (
      this.activeModals.size < this.config.maxConcurrent &&
      this.queue.length > 0
    );
  }

  private getNextModal(): QueuedModal | null {
    // Check for high-priority modals that can interrupt
    const highPriorityModal = this.queue.find(
      modal => modal.priority >= this.config.priorityThreshold
    );

    if (highPriorityModal && this.activeModals.size > 0) {
      // High priority modal can interrupt - close lowest priority active modal
      this.closeLowestPriorityModal();
    }

    return this.queue[0] || null;
  }

  private hasPendingDependencies(modal: QueuedModal): boolean {
    if (!modal.dependencies || modal.dependencies.length === 0) {
      return false;
    }

    return modal.dependencies.some(depId => 
      this.activeModals.has(depId) || this.queue.some(m => m.id === depId)
    );
  }

  private closeLowestPriorityModal(): void {
    // This would need to integrate with the actual modal system
    // For now, just emit an event
    this.emit({ type: 'requestClose' });
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => {
      // Sort by priority (descending), then by timestamp (ascending)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.timestamp - b.timestamp;
    });
  }

  // Public methods for queue management
  getQueueLength(): number {
    return this.queue.length;
  }

  getActiveModalCount(): number {
    return this.activeModals.size;
  }

  getQueuedModals(): QueuedModal[] {
    return [...this.queue];
  }

  getActiveModals(): string[] {
    return Array.from(this.activeModals);
  }

  clearQueue(): void {
    const clearedModals = this.queue.map(m => m.id);
    this.queue = [];
    clearedModals.forEach(modalId => {
      this.emit({ type: 'dequeued', modalId });
    });
  }

  hasModal(modalId: string): boolean {
    return this.queue.some(m => m.id === modalId) || this.activeModals.has(modalId);
  }

  getModalPosition(modalId: string): number {
    return this.queue.findIndex(m => m.id === modalId);
  }

  updateModalPriority(modalId: string, newPriority: number): boolean {
    const modal = this.queue.find(m => m.id === modalId);
    if (modal) {
      modal.priority = newPriority;
      this.sortQueue();
      this.emit({ type: 'priorityUpdated', modalId });
      return true;
    }
    return false;
  }

  addEventListener(listener: (event: { type: string; modalId?: string }) => void): () => void {
    this.listeners.push(listener);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private emit(event: { type: string; modalId?: string }): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in modal queue listener:', error);
      }
    });
  }

  // Utility methods for common patterns
  static createHighPriorityModal(id: string, config: any): Omit<QueuedModal, 'timestamp'> {
    return {
      id,
      priority: 200,
      config
    };
  }

  static createNormalPriorityModal(id: string, config: any): Omit<QueuedModal, 'timestamp'> {
    return {
      id,
      priority: 50,
      config
    };
  }

  static createLowPriorityModal(id: string, config: any): Omit<QueuedModal, 'timestamp'> {
    return {
      id,
      priority: 10,
      config
    };
  }

  static createDependentModal(
    id: string, 
    config: any, 
    dependencies: string[]
  ): Omit<QueuedModal, 'timestamp'> {
    return {
      id,
      priority: 50,
      config,
      dependencies
    };
  }
}