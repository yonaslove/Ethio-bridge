import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-wrapper" *ngIf="(toastService.toasts$ | async) as toasts">
      <div
        *ngFor="let t of toasts"
        class="toast-item"
        [ngClass]="'toast-' + t.type">
        <div class="toast-icon">
          <span *ngIf="t.type === 'success'">✓</span>
          <span *ngIf="t.type === 'error'">✕</span>
          <span *ngIf="t.type === 'warning'">⚠</span>
          <span *ngIf="t.type === 'info'">ℹ</span>
        </div>
        <div class="toast-content">
          <div class="toast-title" *ngIf="t.title">{{ t.title }}</div>
          <div class="toast-msg">{{ t.message }}</div>
        </div>
        <button class="toast-close" (click)="toastService.remove(t.id)">×</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-wrapper {
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 420px;
      width: calc(100% - 3rem);
      pointer-events: none;
    }
    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-radius: 8px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      color: #1A1F2C;
      background: #FFFFFF;
      border-left: 5px solid;
      animation: slideIn 0.25s ease-out;
      font-size: 0.9rem;
    }
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-15px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    .toast-success {
      border-left-color: #2E7D32;
      background: #F1F8F3;
    }
    .toast-error {
      border-left-color: #D32F2F;
      background: #FDF3F3;
    }
    .toast-warning {
      border-left-color: #E65100;
      background: #FFF8E1;
    }
    .toast-info {
      border-left-color: #0E7F8F;
      background: #F0F9FB;
    }
    .toast-icon {
      font-weight: 800;
      font-size: 1.1rem;
      line-height: 1;
      margin-top: 0.1rem;
    }
    .toast-success .toast-icon { color: #2E7D32; }
    .toast-error .toast-icon { color: #D32F2F; }
    .toast-warning .toast-icon { color: #E65100; }
    .toast-info .toast-icon { color: #0E7F8F; }
    .toast-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .toast-title {
      font-weight: 700;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .toast-msg {
      line-height: 1.4;
      word-break: break-word;
    }
    .toast-close {
      background: none;
      border: none;
      font-size: 1.4rem;
      line-height: 1;
      color: #64748B;
      cursor: pointer;
      padding: 0;
    }
    .toast-close:hover {
      color: #1A1F2C;
    }
  `]
})
export class ToastContainerComponent {
  constructor(public toastService: ToastService) {}
}
