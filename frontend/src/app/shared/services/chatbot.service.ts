import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, catchError, of } from 'rxjs';
export interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  intent?: string;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  intent?: string;
  suggestions?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private baseUrl = 'http://localhost:3000/api/chat'; 
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  messages$ = this.messagesSubject.asObservable();

  constructor(private http: HttpClient) {
    // Initial greeting
    this.addBotMessage("Hello! I'm your inventory assistant. You can ask me about stock levels, low stock alerts, or sales summaries.");
  }

  // Send message to internal (Inventory App) endpoint
  sendInternalMessage(message: string, token: string): void {
    if (!message.trim()) return;

    this.addUserMessage(message);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    this.http.post<ChatResponse>(`${this.baseUrl}/internal`, { message }, { headers })
      .pipe(
        catchError(this.handleError<ChatResponse>('sendInternalMessage'))
      )
      .subscribe({
        next: (response) => {
          if (response && response.success) {
            this.addBotMessage(response.response, response.intent);
          } else {
            this.addBotMessage("Sorry, I couldn't process your request.");
          }
        },
        error: (err) => {
          console.error('Chatbot Error:', err);
          this.addBotMessage("Sorry, I'm having trouble connecting to the server. Please try again later.");
        }
      });
  }

  // Helper methods for state management
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

  // Keep compatibility if needed, but primarily use state above
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }
}
