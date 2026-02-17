import { Component, OnInit, ElementRef, ViewChild, AfterViewChecked, Output, EventEmitter } from '@angular/core';
import { ChatbotService, ChatMessage } from '../../services/chatbot.service';

@Component({
  selector: 'app-chatbot-widget',
  templateUrl: './chatbot-widget.component.html',
  styleUrls: ['./chatbot-widget.component.scss']
})
export class ChatbotWidgetComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  @Output() close = new EventEmitter<void>();

  
  isOpen = false;
  isMinimized = false;
  messages$;
  userInput = '';

  constructor(private chatbotService: ChatbotService) {
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
    this.chatbotService.sendMessage(this.userInput);
    this.userInput = '';
  }
}
