import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  public show(type: 'success' | 'error' | 'info' | 'warning', message: string, title?: string, duration: number = 4000): void {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: ToastMessage = { id, type, title, message, duration };
    
    const current = this.toastsSubject.value;
    this.toastsSubject.next([...current, toast]);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  public success(message: string, title: string = 'Success'): void {
    this.show('success', message, title);
  }

  public error(message: string, title: string = 'Error'): void {
    this.show('error', message, title, 6000);
  }

  public info(message: string, title: string = 'Information'): void {
    this.show('info', message, title);
  }

  public warning(message: string, title: string = 'Notice'): void {
    this.show('warning', message, title, 5000);
  }

  public remove(id: string): void {
    const filtered = this.toastsSubject.value.filter(t => t.id !== id);
    this.toastsSubject.next(filtered);
  }
}
