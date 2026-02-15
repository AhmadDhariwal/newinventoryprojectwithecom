import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

export interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  intent?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private apiUrl = `${environment.apiUrl}/chat/customer`;
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  messages$ = this.messagesSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {
    this.addBotMessage("Hi there! 👋 I can help you track orders, find products, or answer questions about returns.");
  }

  sendMessage(message: string): void {
    if (!message.trim()) return;

    this.addUserMessage(message);

    const token = this.authService.getToken();
    if (!token) {
      this.addBotMessage("Please log in to chat with me.");
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.post<any>(this.apiUrl, { message }, { headers }).subscribe({
      next: (response) => {
        if (response.success) {
          this.addBotMessage(response.response, response.intent);
        } else {
          this.addBotMessage("I didn't quite catch that. Could you say it again?");
        }
      },
      error: (err) => {
        console.error('Chatbot Error:', err);
        if (err.status === 401 || err.status === 403) {
           this.addBotMessage("Your session has expired. Please log in again.");
        } else {
           this.addBotMessage("I'm having trouble connecting right now. Please try again later.");
        }
      }
    });
  }

  private addUserMessage(text: string) {
    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([
      ...currentMessages,
      { text, sender: 'user', timestamp: new Date() }
    ]);
  }

  private addBotMessage(text: string, intent?: string) {
    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([
      ...currentMessages,
      { text, sender: 'bot', timestamp: new Date(), intent }
    ]);
  }
}
