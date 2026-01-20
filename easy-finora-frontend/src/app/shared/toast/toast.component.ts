import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, NgClass } from '@angular/common';
import { ToastService, Toast } from './toast.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [NgIf, NgClass],
    templateUrl: './toast.component.html',
    styleUrl: './toast.component.scss'
})
export class ToastComponent implements OnInit, OnDestroy {
    toasts: Toast[] = [];
    private subscription?: Subscription;

    constructor(private toastService: ToastService) { }

    ngOnInit() {
        this.subscription = this.toastService.toast$.subscribe(toast => {
            this.toasts.push(toast);
            setTimeout(() => {
                this.removeToast(toast);
            }, toast.duration || 3000);
        });
    }

    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }

    removeToast(toast: Toast) {
        const index = this.toasts.indexOf(toast);
        if (index > -1) {
            this.toasts.splice(index, 1);
        }
    }
}
