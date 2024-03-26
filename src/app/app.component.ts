import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'ChatForStudy';

  constructor() {

  }

   toggleSidebar() {
    console.log("toggleSidebar");
    const sidebar = document.getElementById('sidebar');
    const chatWindow = document.getElementById('chatWindow');
      console.log(sidebar.style.width);
      
    if (sidebar.style.width === '0px') {
      sidebar.style.width = '200px';
      chatWindow.style.flexGrow = '1';
    } else {
      sidebar.style.width = '0px';
      chatWindow.style.flexGrow = '2';
    }
  }

  toChatPage(){
    console.log("toChat");
  }
}
