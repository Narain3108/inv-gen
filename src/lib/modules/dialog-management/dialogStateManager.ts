export interface DialogConfig {
  id: string;
  title?: string;
  content?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  persistent?: boolean; // Cannot be closed by clicking outside
  zIndex?: number;
  onClose?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface DialogState extends DialogConfig {
  isOpen: boolean;
  timestamp: number;
}

export type DialogEventType = 'open' | 'close' | 'confirm' | 'cancel';

export interface DialogEvent {
  type: DialogEventType;
  dialogId: string;
  timestamp: number;
}

export class DialogStateManager {
  private dialogs: Map<string, DialogState> = new Map();
  private listeners: ((event: DialogEvent) => void)[] = [];
  private baseZIndex: number = 1000;

  openDialog(config: DialogConfig): void {
    const dialog: DialogState = {
      ...config,
      isOpen: true,
      timestamp: Date.now(),
      zIndex: config.zIndex || this.calculateZIndex()
    };

    this.dialogs.set(config.id, dialog);
    this.emit({ type: 'open', dialogId: config.id, timestamp: Date.now() });
  }

  closeDialog(id: string): void {
    const dialog = this.dialogs.get(id);
    if (dialog && dialog.isOpen) {
      dialog.isOpen = false;
      dialog.onClose?.();
      this.emit({ type: 'close', dialogId: id, timestamp: Date.now() });
      
      // Remove dialog after a delay to allow for animations
      setTimeout(() => {
        this.dialogs.delete(id);
      }, 300);
    }
  }

  confirmDialog(id: string): void {
    const dialog = this.dialogs.get(id);
    if (dialog && dialog.isOpen) {
      dialog.onConfirm?.();
      this.emit({ type: 'confirm', dialogId: id, timestamp: Date.now() });
      this.closeDialog(id);
    }
  }

  cancelDialog(id: string): void {
    const dialog = this.dialogs.get(id);
    if (dialog && dialog.isOpen) {
      dialog.onCancel?.();
      this.emit({ type: 'cancel', dialogId: id, timestamp: Date.now() });
      this.closeDialog(id);
    }
  }

  getDialog(id: string): DialogState | undefined {
    return this.dialogs.get(id);
  }

  getAllDialogs(): DialogState[] {
    return Array.from(this.dialogs.values()).filter(dialog => dialog.isOpen);
  }

  getOpenDialogs(): DialogState[] {
    return Array.from(this.dialogs.values())
      .filter(dialog => dialog.isOpen)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  isDialogOpen(id: string): boolean {
    const dialog = this.dialogs.get(id);
    return dialog?.isOpen || false;
  }

  hasOpenDialogs(): boolean {
    return Array.from(this.dialogs.values()).some(dialog => dialog.isOpen);
  }

  closeAllDialogs(): void {
    const openDialogs = this.getOpenDialogs();
    openDialogs.forEach(dialog => {
      if (!dialog.persistent) {
        this.closeDialog(dialog.id);
      }
    });
  }

  getTopDialog(): DialogState | undefined {
    const openDialogs = this.getOpenDialogs();
    return openDialogs.length > 0 ? openDialogs[openDialogs.length - 1] : undefined;
  }

  private calculateZIndex(): number {
    const openDialogs = this.getOpenDialogs();
    if (openDialogs.length === 0) {
      return this.baseZIndex;
    }
    
    const maxZIndex = Math.max(...openDialogs.map(d => d.zIndex || this.baseZIndex));
    return maxZIndex + 10;
  }

  addEventListener(listener: (event: DialogEvent) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private emit(event: DialogEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in dialog event listener:', error);
      }
    });
  }

  // Utility methods for common dialog patterns
  static createConfirmDialog(
    id: string,
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ): DialogConfig {
    return {
      id,
      title,
      content: message,
      size: 'sm',
      closable: true,
      persistent: false,
      onConfirm,
      onCancel
    };
  }

  static createAlertDialog(
    id: string,
    title: string,
    message: string,
    onClose?: () => void
  ): DialogConfig {
    return {
      id,
      title,
      content: message,
      size: 'sm',
      closable: true,
      persistent: false,
      onClose
    };
  }

  static createFormDialog(
    id: string,
    title: string,
    content: React.ReactNode,
    onConfirm: () => void,
    onCancel?: () => void
  ): DialogConfig {
    return {
      id,
      title,
      content,
      size: 'md',
      closable: true,
      persistent: false,
      onConfirm,
      onCancel
    };
  }

  static createFullScreenDialog(
    id: string,
    title: string,
    content: React.ReactNode,
    onClose?: () => void
  ): DialogConfig {
    return {
      id,
      title,
      content,
      size: 'full',
      closable: true,
      persistent: false,
      onClose
    };
  }

  // Method to handle escape key press
  handleEscapeKey(): void {
    const topDialog = this.getTopDialog();
    if (topDialog && topDialog.closable && !topDialog.persistent) {
      this.closeDialog(topDialog.id);
    }
  }

  // Method to handle backdrop click
  handleBackdropClick(dialogId: string): void {
    const dialog = this.getDialog(dialogId);
    if (dialog && dialog.closable && !dialog.persistent) {
      this.closeDialog(dialogId);
    }
  }
}