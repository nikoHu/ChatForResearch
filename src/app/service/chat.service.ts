import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  // 可用于http测试的链接： https://dummyjson.com/docs/products

  private headers = new Headers({'Content-Type': 'application/json'});

  constructor(private http: HttpClient) { }

  // 这个方法整体接收数据
  sendChat(): Observable<String>{
    return this.http.get("http://localhost:8888/getstream?prompt=hi", {responseType: 'text'});
    // .subscribe((data) => console.log(JSON.stringify(data)));
  }

  // 这个方法以流的方式接收数据
  // 参考：https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_readable_streams
  async readData(url: string): Promise<void> {
    const response = await fetch("http://localhost:8888/getstream?prompt=hi");
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      // 在这里处理每个 "chunk"
      const chunkString = new TextDecoder().decode(value);
      console.log(chunkString);
    }
    // 完成后退出
  }

// readData 函数，返回一个 Observable 对象，返回流式对象
 readDataII(content: string): Observable<string> {
  return new Observable((observer: Observer<string>) => {
    fetch("http://localhost:8888/getstream?prompt=" + content)
      .then(response => {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const readChunk = () => {
          reader.read().then(({ done, value }) => {
            if (done) {
              observer.complete();
              return;
            }
            const chunkString = decoder.decode(value);
            observer.next(chunkString); // 将数据发送给观察者
            readChunk();
          });
        };
        readChunk();
      })
      .catch(error => {
        observer.error(error); // 发送错误给观察者
      });
  });
}

  fetchPost(){
    const url = 'http://localhost:8888/poststream'; // 替换为实际的 API 端点 URL
    const requestData = {
      prompt: 'thanks'
    }; // 替换为要发送的实际数据

    fetch(url, {
      method: 'POST', // 设置请求方法为 POST
      headers: {
        'Content-Type': 'application/json' // 设置请求头 Content-Type 为 JSON 格式
      },
      body: JSON.stringify(requestData) // 将数据对象转换为 JSON 字符串并作为请求体发送
    }).then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.text(); // 解析响应体为 text 格式, 在本应用中设为json 格式，会导致报错
      })
      .then(data => {
        console.log('Response data:', data); // 输出响应数据
      })
      .catch(error => {
        console.error('There was a problem with the fetch operation:', error); // 处理错误
      });
  }

  postTest() {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
  
    this.http.post('http://localhost:8888/poststream', JSON.stringify({
      prompt: 'thanks',
      /* other product data */
    }), { headers: headers, responseType: 'text' }).subscribe(data => {
      console.log(data);
    }, error => {
      console.error('There was a problem with the HTTP request:', error);
    });
  }
  
  
  
}
