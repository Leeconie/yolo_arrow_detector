# 视频播放与帧同步模块开发文档

## 一、模块概述

### 1.1 功能描述

视频播放与帧同步模块负责实现视频播放器、逐帧控制、帧数据同步等功能。支持基础播放控制、逐帧查看、关键帧跳转，以及视频帧与分析数据的同步匹配。

### 1.2 适用场景

- 视频播放控制
- 逐帧查看视频内容
- 关键帧快速跳转
- 视频帧与分析数据同步

### 1.3 技术栈版本

- **Vue**: 3.5.26
- **vue3-video-play**: 2.0.0
- **Pinia**: 3.0.4
- **Canvas API**: 原生API

## 二、目录结构

本模块创建的目录和文件：

```text
src/modules/video/player/
├── components/
│   └── VideoPlayer.vue        # 视频播放器组件
├── composables/
│   ├── useVideoPlay.ts         # 视频播放组合式函数
│   └── useFrameSync.ts         # 帧同步组合式函数
└── api/
    └── videoApi.ts             # 视频相关API接口
```

## 三、技术实现

### 3.1 播放器封装

- 基于vue3-video-play组件扩展
- 暴露currentTime、play、pause等方法
- 支持逐帧控制（前进/后退一帧）

### 3.2 逐帧控制

- 帧间隔计算：1 / 视频帧率
- 帧编号计算：Math.floor(currentTime \* 帧率)
- 实时显示当前帧编号

### 3.3 帧同步逻辑

- 监听timeupdate事件（每100ms触发）
- 匹配analysisStore中frameData列表
- 触发Canvas重绘渲染当前帧分析结果

### 3.4 关键帧处理

- 解析keyFrames数组
- 生成关键帧时间轴
- 点击节点跳转至对应帧

## 四、接口定义

### 4.1 视频信息接口

- **GET** `/api/video/info?videoId=<videoId>`
- 响应：IVideoInfo

### 4.2 帧数据接口

- **GET** `/api/analysis/frameData?videoId=<videoId>`
- 响应：IFrameData[]

### 4.3 关键帧接口

- **GET** `/api/analysis/keyFrames?videoId=<videoId>`
- 响应：IKeyFrame[]

## 五、组件说明

### 5.1 VideoPlayer.vue

**Props**:

- `videoId`: string - 视频ID
- `src`: string - 视频源地址

**Events**:

- `timeupdate`: (currentTime: number) => void - 时间更新事件
- `frame-change`: (frameId: number) => void - 帧变更事件

**Methods**:

- `play()`: 播放
- `pause()`: 暂停
- `seekTo(time: number)`: 跳转到指定时间
- `seekToFrame(frameId: number)`: 跳转到指定帧

## 六、开发要点

1. Canvas尺寸需与视频尺寸同步
2. 帧同步需考虑性能，避免频繁重绘
3. 关键帧时间轴需支持横向滚动

## 七、测试要求

- 单元测试：测试逐帧控制逻辑、帧同步匹配逻辑
- 集成测试：测试播放器与Canvas的协同工作

## 八、依赖关系

- 依赖core模块：使用playStore、analysisStore、request工具函数
- 依赖video-upload模块：使用videoId参数
