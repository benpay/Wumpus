import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';

@Component({
  selector: 'app-log',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './log.html',
  styleUrls: ['./log.css'],
})
export class LogComponent implements OnChanges {
  @Input() message: string = '';

  logs: string[] = [];

  @ViewChild('logContainer') private logContainer!: ElementRef;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message'] && this.message) {
      if (this.logs[this.logs.length - 1] !== this.message) {
        this.logs.push(this.message);
        setTimeout(() => this.scrollToBottom(), 50);
      }
    }
  }

  private scrollToBottom(): void {
    if (this.logContainer) {
      this.logContainer.nativeElement.scrollTop = this.logContainer.nativeElement.scrollHeight;
    }
  }
}
