import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-chat-page',
  templateUrl: './chat-page.component.html',
  styleUrls: ['./chat-page.component.css']
})
export class ChatPageComponent implements OnInit {

  constructor(private translateHtml:DomSanitizer) { }

  ngOnInit() {
  }

  send() {
    console.log("send");
    let textInput = document.querySelector('#textarea') as HTMLInputElement; // 类型断言为 HTMLInputElement
    let text = textInput.value;
    if (!text) {
        alert('请输入内容');
        return;
    }
    let item = document.createElement('div');
    item.className = 'item item-right';
    item.innerHTML = `<div class="bubble bubble-left">${text}</div><div class="avatar"><img src="./assets/profiles/1.jpg" /></div>`;
    document.querySelector('.content').appendChild(item);
    textInput.value = '';
    textInput.focus();
    //滚动条置底
    let height = document.querySelector('.content').scrollHeight;
    document.querySelector(".content").scrollTop = height;
}


}
