/**
 * Created by haojing on 15/11/27.
 */
/**
 * Created by haojing on 15/11/17.
 */
var http = require('http');
var iconv = require('iconv-lite');
var moment = require('moment');



var proxy = [
    {host:"120.198.231.22", port:'8081'},
    {host: '210.21.113.236', port:'80'},
    //{host:"182.18.19.219", port:'3128'},
    {host:"182.18.19.218", port:'3128'},
];

//var url ='http://www.haodf.com/wenda/urologistliu_g_3272173750.htm';

function getRequest (url, cb) {
    var num = Math.floor(Math.random()*3);
    //console.log(num);
    var options = {
        host:proxy[0].host,
        port:proxy[0].port,
        method:'GET',//这里是发送的方法
        path: url,     //这里是访问的路径
        headers:{
            //这里放期望发送出去的请求头
            "cache-control": "no-cache",
        },
        timeout: 20000,
    }
    var req = http.request(options, function (res) {
        var chunks = [];

        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function () {
            var body = Buffer.concat(chunks);
            //console.log(iconv.decode(body,"GBK").toString());
            console.log('reloading url...');
            cb(null, iconv.decode(body,"GBK").toString());
        });
        res.on('error', function () {
            cb(null,'')
        })
    });

    req.end();
}
//getRequest(url, function (err, doc) {
//    //console.log(doc)
//})
exports.getRequest = getRequest;