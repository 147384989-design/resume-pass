# 简历通 ResumePass - 智能简历生产工具

## 项目概述
面向2026届大学毕业生的免费简历工具，核心价值是AI润色功能。纯网页版，无需审核。

## 技术栈
- 前端：纯HTML/CSS/JS单文件
- PDF导出：html2pdf.js
- AI润色：DeepSeek Flash API（20次免费额度，用完即停）
- 数据存储：localStorage

## 功能
1. 3套模板（简约版/专业版/创意版）
2. 6个表单模块（基本信息/教育背景/实习经历/项目经验/技能证书/自我评价）
3. PDF导出
4. AI润色（20次免费）

## 快速开始
```bash
cd backend
pip install flask flask-cors
python app.py
# 打开 frontend/index.html
```

## 目录结构
```
resume-pass/
├── frontend/
│   └── index.html    # 单文件前端
├── backend/
│   └── app.py        # Flask后端
└── README.md
```