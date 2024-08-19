import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { GlobalStateService } from '../../../../services/global-state.service';
import { AuthService } from '../../../../services/auth.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'recall',
  standalone: true,
  imports: [FormsModule, NgClass],
  templateUrl: './recall.component.html',
})
export class Recall {
  searchTypes = [
    {
      type: 'vector',
      title: '向量检索',
      description: '通过生成查询词嵌入并查询与其向量最相似的文本片段',
    },
    {
      type: 'full-text',
      title: '全文检索',
      description: '索引文档中的所有词汇，从而允许用户查询任意词汇，并返回包含这些词汇的文本片段',
    },
    {
      type: 'hybrid',
      title: '混合检索',
      description:
        '同时执行全文检索和向量检索，并应用重排序步骤，从两类查询结果中选择匹配用户问题的最佳结果。需配置 Rerank 模型 API',
    },
  ];
  username = '';
  query = '';
  activeSearchType = 'vector';
  vectorTopK = 3;
  vectorScoreThreshold = 0.3;
  fullTextTopK = 3;
  hybridTopK = 3;
  hybridScoreThreshold = 0.3;
  rerankModelType = 'model1';
  results: any[] = [];

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    public globalStateService: GlobalStateService,
  ) {}

  ngOnInit() {
    this.username = this.authService.getUsername() || '';
  }

  handleSubmit() {
    const formData = new FormData();
    formData.append('selectedKnowledgeName', this.globalStateService.selectedKnowledgeName);
    formData.append('username', this.username);
    formData.append('query', this.query);
    formData.append('index_mode', this.activeSearchType);

    switch (this.activeSearchType) {
      case 'vector':
        formData.append('limit', this.vectorTopK.toString());
        formData.append('certainty', this.vectorScoreThreshold.toString());
        break;
      case 'full-text':
        formData.append('limit', this.fullTextTopK.toString());
        break;
      case 'hybrid':
        formData.append('limit', this.hybridTopK.toString());
        formData.append('certainty', this.hybridScoreThreshold.toString());
        break;
    }

    formData.forEach((value, key) => {
      console.log(key, value);
    });

    this.http.post(`${environment.apiUrl}/knowledge/recall`, formData).subscribe({
      next: (data: any) => {
        console.log('Recall result:', data);
        if (data.search_type !== 'full-text') {
          this.results = data.results.map((o: any) => ({
            text: o.content,
            score: o.score.toFixed(3),
          }));
        } else {
          this.results = data.results.map((o: any) => ({
            text: o.content,
          }));
        }
      },
      error: (error) => {
        console.error('Error during recall:', error);
        // 这里你可以添加错误处理逻辑，比如显示一个错误消息
      },
    });
  }

  setActiveSearchType(type: string) {
    this.activeSearchType = type;
  }
}
