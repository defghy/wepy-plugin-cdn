var colors = require('colors/safe');
var md5 = require('md5');
var base64 = require('base-64');
var fs = require('fs');
var request = require('request-promise-native');

// 上传文件名 + md5签名
const createUploadFileName = function(imgData, config) {
  let hash = md5(imgData.img);
  // 使用alias做为子路径
  let prePath = imgData.alias.startsWith('~')? imgData.alias.substring(1): imgData.alias;
  let img = `${prePath}/${hash}_${imgData.fileName}`;

  return img;
};

const uploadFile = function(imgData, config) {
  let oss = config.oss;
  let file = imgData.file;
  const expires = Math.floor(new Date().getTime()/1000 + 3600);
  const MD5_VALUE = md5(oss.ossTag + oss.ossKey + expires);
  const BASE64_VALUE = base64.encode('{"tag":"' + oss.ossTag + '","expires":"' + expires + '","token":"' + MD5_VALUE + '"}');

  let req = request({
    method: 'POST',
    uri: oss.uploadUrl,
    formData: {
      uid: oss.uid,
      uname: oss.uname,
      object: oss.subPath + createUploadFileName(imgData, config),
      file: fs.createReadStream(file)
    },
    headers: {
      'Oss-auth': BASE64_VALUE,
      'Connection': 'alive',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'text/plain; charset=utf-8'
    },
    gzip: true,
    json: true
  }).then(res => {
    if(!res || !res.data || res.data.error) {
      let errmsg = res && res.data && res.data.error && res.data.error.msg;
      console.log(colors.red('[上传失败]'), file, colors.red('[原因]'), errmsg || '未知');
      return Promise.reject(res.data.error);
    }
    let data = res.data;
    console.log(colors.green('[上传成功]'), data.fid);
    return data;
  }).catch(e => {
    console.log(colors.red('[上传失败]'), file, colors.red('[原因]'), e && e.message);
  });

  return req;
}

module.exports = uploadFile;
