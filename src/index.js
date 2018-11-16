var uploadFile = require('./utils/upload.js');
var colors = require('colors/safe');
var fs = require('fs');

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
    var images = code.match(reg) || [];
    // 数据格式化，并过滤掉无法处理的数据
    images = images.map(image => {
      let [val, prefix, img, ext, postfix] = reg.exec(image) || [];

      // 非可解析
      if(!val || !img) {
        return;
      }

      // 非规定格式
      let currAlias = Object.keys(this.opts.alias).find(name => img.startsWith(name));
      if(!currAlias) {
        return;
      }

      img = `${img}.${ext}`;
      let file = img.replace(currAlias, this.opts.alias[currAlias]);
      let fileDist = file.replace('src', 'dist');

      let fileName = img.split('/');
      fileName = fileName[fileName.length - 1];

      // 文件不存在 或者 不符合上传标准
      let fstat;
      try {
        fstat = fs.statSync(file);
      } catch(e) {
        return;
      }

      return {
        val, prefix, img, ext, postfix,
        file, fileDist, fileName, alias: currAlias,
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
      console.log(colors.green('[删除]'), colors.magenta(`${imgData.fileSize}KB`), imgData.fileDist);
    }

    // 所有图片处理完后进行下一步
    op.next();
  }
}

exports.default = CloudStorage;
