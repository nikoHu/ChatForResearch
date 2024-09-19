# ChatForStudy

欢迎来到我们的项目！本仓库是一个从零开始搭建的基于开源大模型的对话系统。包括基本的对话、与文档对话、知识库管理等多种功能。

## 技术栈

- **前端**:

  - [Angular 18](https://angular.dev/): 构建动态 Web 应用的框架。
  - [Daisy UI](https://daisyui.com/): 用于快速 UI 开发的 Tailwind CSS 组件。
  - [Tailwind CSS](https://tailwindcss.com/): 以实用程序为优先的 CSS 框架。
  - [pnpm](https://pnpm.io/): 快速且节省磁盘空间的包管理器。

- **后端**:
  - [FastAPI](https://fastapi.tiangolo.com/): 用于构建 API 的现代、快速（高性能）Web 框架，支持 Python 3.6+。
  - [Ollama](https://ollama.ai/): 用于运行开源大语言模型的本地服务。
  - [LangChain](https://www.langchain.com/): 用于构建基于语言模型的应用程序的框架。
  - [Qdrant](https://qdrant.tech/): 用于向量相似性搜索的数据库。

## 快速开始

### 安装

1. **克隆仓库:**

   ```sh
   git clone https://github.com/nikoHu/ChatForStudy.git
   cd ChatForStudy
   ```

2. **安装前端依赖:**

   ```sh
   cd frontend
   pnpm install
   ```

3. **安装后端依赖:**

   ```sh
   cd backend
   pip install -r requirements.txt
   ```

4. **安装并运行 Ollama:**
   请参考[Ollama 官方文档](https://github.com/ollama/ollama)进行安装和配置。

5. **安装并运行 Qdrant:**
   - 使用 Docker 安装 Qdrant:
     ```sh
     docker pull qdrant/qdrant
     docker run -p 6333:6333 -p 6334:6334 \
         -v $(pwd)/qdrant_storage:/qdrant/storage:z \
         qdrant/qdrant
     ```
   - 或者参考[Qdrant 官方文档](https://qdrant.tech/documentation/quick-start/)进行其他安装方式。

### 运行项目

1. **启动后端服务器:**

   ```sh
   cd backend
   python main.py
   ```

2. **启动前端开发服务器:**

   ```sh
   cd frontend
   ng serve
   ```

3. **访问应用程序:**
   打开浏览器并导航到 `http://localhost:4200`。

## 功能特性

- 基本对话功能
- 文档对话（支持 PDF 文件）
- 知识库管理（创建、上传文件、分段处理）
- 多模型支持（通过 Ollama）
- 向量数据库集成（使用 Qdrant）

## 开发计划

- 支持更多文档格式
- 添加智能体（Agent）功能
- 优化用户界面和体验
- 增强知识库管理功能
- 添加更多高级设置选项
