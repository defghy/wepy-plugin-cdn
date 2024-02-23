# 功能

发布线上的时候自动将静态资源上传到cdn

项目组内部使用，暂未想到比较好的通用api交互

```
// wepy.config.js
plugins: {
  'assets-cdn': {
    oss: {
      url: '',  // oss-url
      uploadUrl: '',
      ossTag: '',
      ossKey: '',
      uid: '',
      uname: '',
      subPath: 'cdn/'
    },
    limitSize: '50' // kb
  }
}
```