# ChatForStudy

欢迎来到我们的项目！本仓库是一个从零开始，搭建一个基于开源大模型的对话系统。包括基本的对话、与文档对话、智能体等多种功能。

## 技术栈

- **前端**:
  - [Angular 18](https://angular.dev/): 构建动态Web应用的框架。
  - [Daisy UI](https://daisyui.com/): 用于快速UI开发的Tailwind CSS组件。
  - [Tailwind CSS](https://tailwindcss.com/): 以实用程序为优先的CSS框架。
  - [pnpm](https://pnpm.io/): 快速且节省磁盘空间的包管理器。

- **后端**:
  - [FastAPI](https://fastapi.tiangolo.com/): 用于构建API的现代、快速（高性能）Web框架，支持Python 3.6+。
  - [chatglm.cpp](https://github.com/li-plus/chatglm.cpp): ChatGLM的C++实现，与[llama.cpp](https://github.com/ggerganov/llama.cpp)工作方式相同

## 快速开始

在进行以下步骤之前，您需要使用[chatglm.cpp](https://github.com/li-plus/chatglm.cpp)量化模型，并将其放入后端的models文件夹中。

### 安装

1. **克隆仓库:**
    ```sh
    git clone https://github.com/nikoHu/ChatForStudy.git
    cd repo-name
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

### 运行项目

1. **启动后端服务器:**
    ```sh
    cd backend
    uvicorn main:app --reload
    ```

2. **启动前端开发服务器:**
    ```sh
    cd frontend
    ng serve
    ```

3. **访问应用程序:**
    打开浏览器并导航到 `http://localhost:4200`。

### 开发计划

目前，该项目仅支持ChatGLM模型，并且只实现了基本对话功能。后续版本将会加入文档对话、智能体（Agent）等更多功能，并支持接入其它开源模型，可以使用API KEY进行调用。