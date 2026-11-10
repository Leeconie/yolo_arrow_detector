# 音频资源目录

## 目录用途

存放项目中使用的音频文件，如提示音、背景音乐等。

## 支持的文件格式

- **MP3** - 最常用格式，兼容性好
- **OGG** - 开源格式，体积较小
- **WAV** - 无损格式，体积较大

## 命名规范

- 使用 **kebab-case** 命名
- 文件名应描述音频用途（如：`notification-sound.mp3`、`background-music.ogg`）

## 文件大小建议

- 单个音频文件建议不超过 **5MB**
- 提示音建议不超过 **100KB**

## 使用示例

````typescript
import notificationSound from '@/assets/audios/notification-sound.mp3'

export default {
  setup() {
    const playSound = () => {
      const audio = new Audio(notificationSound)
      audio.play()
    }

    return {
      playSound,
    }
  },
}
```

```vue
<template>
  <audio ref="audioPlayer" :src="notificationSound"></audio>
  <button @click="playSound">播放提示音</button>
</template>
```

## 优化建议

1. **音频压缩**：使用工具压缩音频（如：Audacity、FFmpeg）
2. **格式选择**：提示音使用 MP3，背景音乐考虑 OGG
3. **预加载控制**：使用 `preload="none"` 避免自动加载

## 注意事项

1. **文件大小**：大音频文件必须压缩后再使用
2. **版权问题**：确保音频有使用权限
3. **用户体验**：音频播放应提供用户控制（播放/暂停）
````
