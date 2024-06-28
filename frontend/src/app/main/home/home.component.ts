import { Component } from '@angular/core';
import { Chat } from '../chat/chat.component';

@Component({
  selector: 'home',
  standalone: true,
  imports: [Chat],
  templateUrl: `./home.component.html`,
})
export class Home {

  famousQuotesList: string[] = ['立志当如山，如山般坚定！',
   '简单的事重复做，你就是专家；重复的事用心做，你就是赢家！',
   '说得好，但不去执行。世界上有很多人就是这样失败的。',
   '记住要抬头看星星，而不是低头看脚。',
   '一个最好的计划如果没有实践，也不过是个美好的意愿。',
   '不要让别人的意见淹没你内心的声音。最重要的是，有勇气跟随你的内心和直觉。',
   '人类所有的力量，只是耐心加上时间的混合。',
   '笑声如阳光，驱走人们脸上的冬天。',
   '一个人思虑太多，就会失去做人的乐趣。',
   '一个人越聪明、越善良，他看到别人身上的美德越多。',
   '古之成大事者，不惟有超世之才，亦必有坚韧不拔之志！',
   '如果不用力，即使从芝麻中也榨不出油来。',
   '站在山巅上的小草，以为它比山脚下的大树还高。',
   '天之道，损有余而补不足。',
   '一个人只要能忘我和爱别人，他在心理上就不会失衡，他就是一个幸福的人和完美的人。'
  ];

  famousquotes = this.famousQuotesList[10];

  ngOnInit() {
    setInterval(() => {
    let randomNumber: any = Math.floor(Math.random() * this.famousQuotesList.length);
    this.famousquotes = this.famousQuotesList[randomNumber];
    }, 30000);
  }
}
