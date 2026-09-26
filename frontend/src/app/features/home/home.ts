import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GameRecord } from '../../core/models/game-state.model';
import { GameApiService } from '../../core/services/game-api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class HomeComponent implements OnInit {
  boardSize: number = 4;
  pitCount: number = 2;
  arrows: number = 1;
  history: GameRecord[] = [];
  loadingHistory: boolean = true;

  constructor(
    private readonly gameApiService: GameApiService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.gameApiService.getGameHistory().subscribe({
      next: (records) => {
        this.history = records;
        this.loadingHistory = false;
      },
      error: () => {
        this.loadingHistory = false;
      },
    });
  }

  startGame(): void {
    this.gameApiService
      .createGame({
        boardSize: this.boardSize,
        pitCount: this.pitCount,
        arrows: this.arrows,
      })
      .subscribe((state) => {
        this.router.navigate(['/game', state.gameId]);
      });
  }
}
