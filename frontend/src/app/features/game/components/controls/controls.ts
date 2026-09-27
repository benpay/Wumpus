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
    if (this.disabled || this.isTypingTarget(event.target)) return;

    const action = this.actionForKey(event.code);
    if (action === null) return;

    event.preventDefault();
    this.emit(action);
  }

  private isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    return (
      target.isContentEditable ||
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLButtonElement
    );
  }

  private actionForKey(code: string): Action | null {
    switch (code) {
      case 'ArrowUp':
      case 'KeyW':
        return Action.ORIENT_NORTH;
      case 'ArrowDown':
      case 'KeyS':
        return Action.ORIENT_SOUTH;
      case 'ArrowLeft':
      case 'KeyA':
        return Action.ORIENT_WEST;
      case 'ArrowRight':
      case 'KeyD':
        return Action.ORIENT_EAST;
      case 'Space':
        return Action.ADVANCE;
      case 'KeyF':
        return Action.SHOOT;
      case 'KeyE':
        return Action.EXIT;
      default:
        return null;
    }
  }
}
