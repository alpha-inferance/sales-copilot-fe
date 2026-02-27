import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent }   from './components/sidebar/sidebar.component';
import { WelcomeComponent }   from './components/welcome/welcome.component';
import { ChatComponent }      from './components/chat/chat.component';
import { DealRadarComponent } from './components/deal-radar/deal-radar.component';
import { ChatService }        from './services/chat.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    SidebarComponent, WelcomeComponent, ChatComponent, DealRadarComponent],
  template: `
<div class="app-shell">
  @if (chat.screen() !== 'dealradar') {
    <app-sidebar />
  }
  <main class="app-main">
    @switch (chat.screen()) {
      @case ('welcome')   { <app-welcome />     }
      @case ('chat')      { <app-chat />        }
      @case ('dealradar') { <app-deal-radar />  }
    }
  </main>
</div>
  `,
  styles: [`
    .app-shell {
      display: flex; height: 100vh; overflow: hidden;
      font-family: 'Segoe UI','Inter',sans-serif;
    }
    .app-main { flex: 1; overflow: hidden; min-width: 0; }
  `],
})
export class AppComponent {
  chat = inject(ChatService);
}
