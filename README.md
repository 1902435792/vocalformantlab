<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Vocal Formant Lab (中文使用指南)

这是一个基于 AI 的声音共振峰分析实验室项目。

如果你是编程新手（小白），请按照以下**保姆级教程**一步步操作，保证你能运行起来！

---

## 第一步：安装必要环境 (Node.js)

要运行这个项目，你的电脑必须安装 **Node.js**。

### 如何检查是否已安装？
1.  按下键盘上的 `Win + R` 键，输入 `cmd`，然后回车打开“命令提示符”。
2.  在黑色的窗口里输入 `node -v` 并回车。
3.  如果出现 `v18.xx.x` 或更高版本的数字（比如 `v24.11.1`），说明你**已经安装好了**，可以直接跳到第二步！
4.  如果提示“'node' 不是内部或外部命令...”，说明你**还没安装**。

### 如何安装 Node.js？
1.  **下载**：访问 Node.js 官网下载页：[https://nodejs.org/zh-cn/download/prebuilt-installer](https://nodejs.org/zh-cn/download/prebuilt-installer)
2.  **选择版本**：通常网站会自动检测你的系统。推荐下载 **LTS (长期支持版)**，点击下载 Windows Installer (`.msi` 文件)。
3.  **安装**：
    - 双击下载好的安装包。
    - 一路点击 **Next (下一步)**。
    - **注意**：看到 "Tools for Native Modules" 界面时，**不需要**勾选那个很长的选项（Installing Chocolatey...），直接点 Next 即可。
    - 点击 **Install** 开始安装，最后点 **Finish**。
4.  **验证**：重复上面的“检查步骤”，再次输入 `node -v`，能看到版本号就成功了！

---

## 第二步：下载本项目代码

有两种方法，选择一种即可：

### 方法 A：下载压缩包 (最简单)
1.  在 GitHub 页面主要区域，点击绿色的 **Code** 按钮。
2.  点击 **Download ZIP**。
3.  下载后，**解压**到你想要存放的文件夹（比如 D盘）。

### 方法 B：使用 Git 命令 (推荐)
如果你懂 Git，直接运行：
```bash
git clone https://github.com/1902435792/vocalformantlab.git
```

---

## 第三步：安装项目依赖

1.  打开你要运行的项目文件夹（如果是解压的，进入解压后的文件夹）。
2.  在该文件夹的空白处，按住 `Shift` 键并点击**鼠标右键**，选择 **“在此处打开 Powershell 窗口”** (或者 "Open in Terminal")。
3.  在蓝色的窗口里，输入以下命令并回车（这会自动下载项目需要的各种工具包）：
    ```bash
    npm install
    ```
    *等待几分钟，直到进度条跑完，出现 "added xxx packages" 字样。*

---

## 第四步：配置 API Key (重要)

由于本项目使用了 Google Gemini AI，你需要配置一个 API Key 才能正常分析声音。

1.  在项目文件夹里，找到一个叫 `.env.local.example` 的文件（如果没有，就新建一个文本文档）。
2.  将其重命名为 `.env.local` (**注意**：前面有个点，后面没有 `.txt` 后缀)。
3.  用记事本 (Notepad) 或 VS Code 打开它。
4.  在里面填入以下内容：
    ```text
    GEMINI_API_KEY=这里填入你在Google申请的API_KEY
    ```
    *(如果没有 Key，你需要去 Google AI Studio 申请一个)*

---

## 第五步：启动项目！

1.  回到刚才那个 Powershell 窗口（或者重新打开）。
2.  输入启动命令：
    ```bash
    npm run dev
    ```
3.  只要看到类似下面的提示：
    ```
    VITE v6.x.x  ready in xxxx ms

    ➜  Local:   http://localhost:5173/
    ```
4.  按住 `Ctrl` 键并点击那个链接 `http://localhost:5173/`，或者手动复制到浏览器打开。
5.  **大功告成！** 你现在可以开始使用声音共振峰实验室了。

---

## 只有开发者才关心的技术栈
- React 19
- Vite 6
- TypeScript
