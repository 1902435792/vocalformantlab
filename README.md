<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1RnYzVKkcWZ8FgEx9Npg-97s8vD_H4iFp

## Run Locally

**Prerequisites:**
- Node.js (v18.0.0 or higher recommended, tested on v24.11.1)
- npm (comes with Node.js)

## Tech Stack
- [React](https://react.dev/) 19
- [Vite](https://vitejs.dev/) 6
- [TypeScript](https://www.typescriptlang.org/)


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## 使用说明 (Chinese Guide)

如果您（或您的朋友）想运行此项目，请按照以下步骤操作：

1.  **下载代码**
    ```bash
    git clone https://github.com/1902435792/vocalformantlab.git
    cd vocalformantlab
    ```

2.  **安装依赖**
    需要电脑上已安装 Node.js (推荐 v18+)。
    ```bash
    npm install
    ```

3.  **配置环境**
    在项目根目录下创建一个名为 `.env.local` 的文件，填入您的 Gemini API Key：
    ```text
    GEMINI_API_KEY=从Google获取的API_KEY
    ```

4.  **运行项目**
    ```bash
    npm run dev
    ```
    运行后，打开终端显示的本地地址 (通常是 `http://localhost:3000`) 即可使用。
