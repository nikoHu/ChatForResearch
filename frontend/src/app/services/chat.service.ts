import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  fetchPost(requestData: object): Observable<{ content: string; has_context: boolean; source: string }> {
    const url = `${environment.apiUrl}/chat/`;

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

              const lines = chunk.split('\n');
              for (const line of lines) {
                if (line.trim()) {
                  try {
                    const parsedData = JSON.parse(line);
                    observer.next(parsedData);
                  } catch (parseError) {
                    console.error('Error parsing JSON:', parseError);
                  }
                }
              }
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
