import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { User } from '../interfaces/interfaces';


@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Simuler un utilisateur connecté (à remplacer par une vraie logique d'authentification)
    this.setCurrentUser({
      id: 'user123',
      username: 'john_doe',
      role: 'user',
    });
  }

  // Simuler une connexion (à remplacer par une API ou Firebase, par exemple)
  login(username: string): Observable<boolean> {
    const user: User = {
      id: 'user123',
      username,
      role: 'user',
    };
    this.setCurrentUser(user);
    return of(true);
  }

  // Définir l'utilisateur connecté
  setCurrentUser(user: User | null) {
    this.currentUserSubject.next(user);
  }

  // Obtenir l'utilisateur connecté
  getCurrentUser(): User | null {
    return this.currentUserSubject.getValue();
  }

  // Vérifier si l'utilisateur a le rôle "user"
  isUser(): boolean {
    const user = this.getCurrentUser();
    return user !== null && user.role === 'user';
  }

}