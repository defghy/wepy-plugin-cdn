var uploadFile = require('./utils/upload.js');
var colors = require('colors/safe');
var fs = require('fs');
var path = require('path');

class CloudStorage {
  constructor(options = {}) {
    debugger;
    this.opts = options;
  }

  async apply(op) {
    const _this = this;
    const {code, type} = op;

    // 处理特殊文件
    if (!['wxml', 'css', 'page', 'component'].includes(type)) {
      op.next();
      return;
    }

    var reg = /(\"|\'|\()+(\S+)\.(png|jpg|jpeg|gif|bmp|webp)(\"|\'|\))+/gi;
    var cdnPrePath = this.opts.oss.subPath+ 'image/';
    var images = code.match(reg) || [];
    // 数据格式化，并过滤掉无法处理的数据
    images = images.map(image => {
      let [val, prefix, img, ext, postfix] = reg.exec(image) || [];

      // 非可解析
      if(!val || !img) {
        return;
      }

      // 已为cdn图片
      if(img.startsWith('http')) {
        return;
      }

      img = `${img}.${ext}`;

      // 文件不存在 或者 不符合上传标准
      let file = this.getImgFilePath(img, op.file);
      let fstat;
      try {
        fstat = fs.statSync(file);
      } catch(e) {
        return;
      }

      let fileDist = file.replace('src', 'dist');
      let fileName = img.split('/');
      fileName = fileName[fileName.length - 1];

      return {
        val, prefix, img, ext, postfix,
        file, fileDist, fileName, cdnPrePath,
        fileSize: (fstat.size/1024).toFixed(1)
      }
    }).filter(imgData => imgData);
    if(!images.length) {
      op.next();
      return;
    }

    // 上传并删除图片
    for(var i=0, len=images.length; i<len; i++) {
      let imgData = images[i];

      // 上传
      let { furl } = await uploadFile(imgData, this.opts);
      // 修改代码
      op.code = op.code.replace(imgData.img, furl);
      // 删除文件
      fs.unlinkSync(imgData.fileDist);
      console.log(colors.green('[上传&删除]'), colors.magenta(`${imgData.fileSize}KB`), imgData.fileDist);
    }

    // 所有图片处理完后进行下一步
    op.next();
  }

  // 获取图片物理存放地址
  getImgFilePath(imgPath, currFile) {
    let currAlias = Object.keys(this.opts.alias).find(name => imgPath.startsWith(name));
    let file;
    // 使用同名机制
    if(currAlias) {
      file = imgPath.replace(currAlias, this.opts.alias[currAlias]);
    }
    // 绝对路径
    else if(imgPath.startsWith('/')) {
      file = path.join(process.cwd(), 'src', imgPath);
    }
    // 相对路径
    else {
      let currPath = currFile.split('/');
      currPath.splice(-1);
      currPath = currPath.join('/').replace('dist', 'src');
      file = path.join(currPath, imgPath);
    }

    return file;
  }
}

exports.default = CloudStorage;
