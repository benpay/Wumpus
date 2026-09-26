import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { Action } from '../../../../core/models/enums';

@Component({
  selector: 'app-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './controls.html',
  styleUrls: ['./controls.css'],
})
export class ControlsComponent {
  @Input() disabled: boolean = false;
  @Output() actionSelected = new EventEmitter<Action>();

  readonly Action = Action;

  emit(action: Action): void {
    if (!this.disabled) {
      this.actionSelected.emit(action);
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (this.disabled) return;

    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.emit(Action.ADVANCE);
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.emit(Action.ROTATE_LEFT);
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.emit(Action.ROTATE_RIGHT);
        break;
      case 'Space':
      case 'KeyS':
        this.emit(Action.SHOOT);
        break;
      case 'KeyE':
        this.emit(Action.EXIT);
        break;
    }
  }
}
