import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Icons } from './icons';

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      [innerHTML]="content">
    </svg>
  `,
  styleUrl: 'app-icon.component.css'
})
export class IconComponent {

  @Input() name = '';
  @Input() size = 20;

  constructor(private sanitizer: DomSanitizer) {}

  get content(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      Icons[this.name as keyof typeof Icons] ?? ''
    );
  }
}