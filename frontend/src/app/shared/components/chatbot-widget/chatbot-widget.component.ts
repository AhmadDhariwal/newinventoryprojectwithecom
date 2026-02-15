import { Component, OnInit, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { ChatbotService } from '../../services/chatbot.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-chatbot-widget',
  templateUrl: './chatbot-widget.component.html',
  styleUrls: ['./chatbot-widget.component.scss']
})
export class ChatbotWidgetComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  
  isOpen = false;
  isMinimized = false;
  isLoading = false;
  messages$;
  userInput = '';

  constructor(
    private chatbotService: ChatbotService,
    private authService: AuthService
  ) {
    this.messages$ = this.chatbotService.messages$;
  }

  ngOnInit(): void {
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.isMinimized = false;
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  minimizeChat() {
    this.isMinimized = !this.isMinimized;
  }

  sendMessage() {
    if (!this.userInput.trim()) return;

    const text = this.userInput;
    this.userInput = '';
    
    // Auth check
    const token = this.authService.getToken(); 
    if (!token) {
      // We can't push directly to observable, but the service handles it. 
      // However, for this specific error case, we might want to handle it here or in service.
      // Let's rely on service validation implicitly or add a local check?
      // Service `sendInternalMessage` requires token.
      // Let's just create a temporary alert or use a service method if we wanted to inject a local error.
      // But simplifying: just don't send if no token.
      console.warn("No token found");
      return; 
    }

    this.chatbotService.sendInternalMessage(text, token);
  }
}
