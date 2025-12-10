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

## 第三步：更优雅地启动 (推荐)

我们为您准备了一个**全自动启动脚本**，它会自动帮您安装依赖、配置环境。

1.  打开项目文件夹。
2.  找到名为 `启动应用.bat` 的文件，**双击运行**。
3.  脚本会自动检查您的环境：
    - 如果是第一次运行，它会自动下载依赖（可能需要几分钟，请耐心等待）。
    - 如果缺少 API Key，它会帮您生成配置文件，并暂停提示您去填 Key。
4.  一切就绪后，它会自动打开浏览器访问页面。

---

## 备用方案：手动启动 (开发者模式)

如果脚本无法运行，您可以尝试手动操作：

1.  在项目目录下打开终端。
2.  安装依赖：`npm install`
3.  配置 `.env.local` 文件（同上文）。
4.  启动服务：`npm run dev`

---

## 只有开发者才关心的技术栈
- React 19
- Vite 6
- TypeScript
