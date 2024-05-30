import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  constructor() {}

  fetchPost(requestData: object): Observable<string> {
    const url = `${environment.apiUrl}/chat/completions`;

    return new Observable((observer) => {
      const fetchData = async () => {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
          });

          if (!response.ok) {
            throw new Error('Network response was not ok');
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                observer.complete();
                break;
              }
              const chunk = decoder.decode(value, { stream: true });
              const json_chunk = JSON.parse(chunk);
              console.log(json_chunk);
              observer.next(json_chunk.word);
            }
          }
        } catch (error) {
          observer.error(error);
        }
      };
      fetchData();
    });
  }
}
