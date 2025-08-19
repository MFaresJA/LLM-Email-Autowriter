import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  show(message: string, type: 'success' | 'error' | 'info' = 'info') {
    // In a real app, you might use a proper notification library
    // or implement toast notifications
    console.log(`${type}: ${message}`);
    
    // Simple alert for demo purposes
    const alertClass = type === 'error' ? 'alert-danger' : 
                      type === 'success' ? 'alert-success' : 'alert-info';
    
    const alert = document.createElement('div');
    alert.className = `alert ${alertClass}`;
    alert.textContent = message;
    alert.style.position = 'fixed';
    alert.style.bottom = '20px';
    alert.style.right = '20px';
    alert.style.padding = '10px 20px';
    alert.style.borderRadius = '4px';
    alert.style.zIndex = '1000';
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
      alert.remove();
    }, 5000);
  }
}