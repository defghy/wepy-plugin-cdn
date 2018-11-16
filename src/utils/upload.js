var colors = require('colors/safe');
var md5 = require('md5');
var base64 = require('base-64');
var fs = require('fs');
var axios = require('axios');
var request = require('request-promise-native');
var FormData = require('form-data');

const req = axios.create({});

const uploadFile = function(file, imgSub, config) {
  let oss = config.oss;
  const expires = Math.floor(new Date().getTime()/1000 + 3600);
  const MD5_VALUE = md5(oss.ossTag + oss.ossKey + expires);
  const BASE64_VALUE = base64.encode('{"tag":"' + oss.ossTag + '","expires":"' + expires + '","token":"' + MD5_VALUE + '"}');

  let req = request({
    method: 'POST',
    uri: oss.uploadUrl,
    formData: {
      uid: oss.uid,
      uname: oss.uname,
      object: oss.subPath + imgSub,
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
    debugger;
  });

  // const fd = req.form()
  // fd.append('uid', oss.uid);
  // fd.append('uname', oss.uname);
  // fd.append('object', oss.subPath + imgSub);
  // fd.append('file', fs.createReadStream(file));

  return req;
}

module.exports = uploadFile;
