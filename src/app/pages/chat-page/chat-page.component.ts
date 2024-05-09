import { Component, OnInit, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { ChatService } from 'src/app/service/chat.service';

@Component({
  selector: 'app-chat-page',
  templateUrl: './chat-page.component.html',
  styleUrls: ['./chat-page.component.css']
})
export class ChatPageComponent implements OnInit {

  @ViewChild('content', { static: false }) container: ElementRef;

  constructor(private renderer: Renderer2, private chatService: ChatService) { }

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

    // this.chatService.sendChat().subscribe(data => console.log(data));
    
    // this.chatService.readData("").then(data => console.log(data));

    // this.chatService.postTest();

    // this.chatService.fetchPost();

    let firstData: Number = 1;
    this.chatService.readDataII(text).subscribe(
      data => {this.recieve(data, firstData); firstData = 0}, // 接收并处理数据
      error => console.error(error), // 处理错误
      () => console.log('Complete') // 处理完成
    );
  }

  recieve(data, firstData){
    if(firstData){
        let item = this.renderer.createElement('div');
        item.className = 'item item-left';

        // Create bubble element
        let bubble = this.renderer.createElement('div');
        bubble.className = 'bubble bubble-left';
        bubble.textContent = data;

        // Create avatar element
        let avatar = this.renderer.createElement('div');
        avatar.className = 'avatar';
        let img = this.renderer.createElement('img');
        img.src = './assets/profiles/2.jpg';
        avatar.appendChild(img);

        // Append bubble and avatar to item
        this.renderer.appendChild(item, avatar);
        this.renderer.appendChild(item, bubble);
        
        // Append item to content
        this.renderer.appendChild(document.querySelector('.content'), item);
    } else {
        // Get the last bubble-left element
        let allBubbles = document.querySelectorAll('.bubble-left');
        let lastBubble = allBubbles[allBubbles.length - 1];

        
        // console.log(lastBubble.textContent, '--', data);

        // Append new data to the last bubble
        lastBubble.textContent += (data + " ");
    }

    // Scroll to bottom
    let height = document.querySelector('.content').scrollHeight;
    document.querySelector(".content").scrollTop = height;
}


}
