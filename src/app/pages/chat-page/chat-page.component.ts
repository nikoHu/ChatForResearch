import { Component, OnInit, ViewChild, ElementRef, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-chat-page',
  templateUrl: './chat-page.component.html',
  styleUrls: ['./chat-page.component.css']
})
export class ChatPageComponent implements OnInit {

  @ViewChild('content', { static: false }) container: ElementRef;

  constructor(private renderer: Renderer2) { }

  ngOnInit() {
  }

  send() {
    console.log("send");
    let textInput = document.querySelector('#textarea') as HTMLInputElement;
    let text = textInput.value;
    if (!text) {
      alert('请输入内容');
      return;
    }
    let item = this.renderer.createElement('div');
    item.className = 'item item-right';

    // Create bubble element
    let bubble = this.renderer.createElement('div');
    bubble.className = 'bubble bubble-left';
    bubble.textContent = text;

    // Create avatar element
    let avatar = this.renderer.createElement('div');
    avatar.className = 'avatar';
    let img = this.renderer.createElement('img');
    img.src = './assets/profiles/1.jpg';
    avatar.appendChild(img);

    // Append bubble and avatar to item
    this.renderer.appendChild(item, bubble);
    this.renderer.appendChild(item, avatar);

    // Append item to content
    this.renderer.appendChild(document.querySelector('.content'), item);

    textInput.value = '';
    textInput.focus();
    // Scroll to bottom
    let height = document.querySelector('.content').scrollHeight;
    document.querySelector(".content").scrollTop = height;
  }
}
