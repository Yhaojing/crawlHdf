/**
 * Created by haojing on 15/11/27.
 */
/**
 * Created by haojing on 15/11/13.
 */
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var iconv = require('iconv-lite');
var _ = require('lodash');
var db = require('./mdb');
var path = require('path');
var moment = require('moment');
var fs = require('fs');
var getRequest = require('./proxy');

var expiredM =moment().subtract(1, 'month').format('YYYY-MM-DD');//1月以前
var expiredW =moment().subtract(7, 'days').format('YYYY-MM-DD');//一周以前
//console.log(expired);

var dResult =[];
//request({
//    encoding:null,
//    url:'http://zixun.haodf.com/dispatched/all.htm'
//}, function (error, response, body) {
//    if(! error && response.statusCode == 200) {
//        //console.log(iconv.decode(body,"GBK").toString());
//        console.log('第一步');
//        crawClass(iconv.decode(body,"GBK").toString())
//    }
//});

//爬取科室
function crawClass(html) {
    var $ = cheerio.load(html);
    var department = $('.izixun-department ul li span a');
    async.mapSeries(department, function (item, callback) {
        var departmentUrl = $(item).attr('href');
        var departmentName = $(item).text();
        dResult.push({name: departmentName, number: 0});
        var urls = _.range(1, 35).map(function (i) {
            return departmentUrl + '?p=' + i;
        });
        var result = {name: departmentName, pageUrls:urls};
        callback(null, result);
    }, function(err, results) {
        //console.log(resul/ts);
        var errorurl = [];
        console.log('科室34页遍历');
        async.mapSeries(results, function (eachDepartment, fn) {
            //eachDepartment = {name: '', pageUrls[]}
            console.log('第一层', eachDepartment.name);
            async.mapLimit(eachDepartment.pageUrls, 3, function (pageUrl, fn1) {
                request({
                    encoding:null,
                    url:pageUrl,
                    timeout: 25000
                }, function (error, response, body) {
                    if(error) {
                        //throw error;
                        console.log('错误URL',pageUrl);
                        fn1(null,'');
                        //errorurl.push(pageUrl);
                        //fn1(null, []);
                    }
                    if(! error && response.statusCode == 200) {
                        $ = cheerio.load(iconv.decode(body,"GBK").toString());
                        var p_dept = $('a.red').text();//科室名称
                        var txtList = $('li.clearfix');
                        console.log('第2层', p_dept);
                        //console.log(txtList);
                        async.mapLimit(txtList,2, function (link, fn2) {
                            var txt = $(link);
                            var t_link = txt.find('span.fl a').last().attr('href');
                            fn2(null, t_link);
                        }, function (err, result3) {
                            fn1(null, result3);
                        })
                    }
                })
            }, function (err, result2) {
                var urls = _.flatten(result2, true);
                db.haodfModel2.create({name: eachDepartment.name, urls:urls}, function (err, docs) {
                    //console.log(err, docs);
                    console.log(eachDepartment.name, '创建成功');
                    if(errorurl.length > 0) {
                        db.errorModel.create({errorname: eachDepartment.name,  errorurls: errorurl}, function (err, doc) {
                        })
                    }
                    fn(null, result2);
                })

            })
        }, function (err, result1){
            //console.log(result1)
            console.log('程序跑完');
            //paiming();
        })

    })
}


//验证每一个URL
function paiming() {

    db.haodfModel2.find({}, function (err, docs) {
        async.mapSeries(docs, function (doc, callback) {
            var name = doc.name;

            if(name !=='普通内科'&& name !=='呼吸'&& name !=='消化') {
                var lastWeek = 0;//前一周
                var count = 0;
                var lastMonth = 0//前一个月
                async.mapLimit(doc.urls, 7, function (url, cb) {
//每一个问题
                    setTimeout(function () {
                        request({
                            encoding:null,
                            url:url,
                            timeout: 25000
                        }, function (error, response, body) {

                            if(! error && response.statusCode == 200) {
                                console.log(name,++count);
                                $ = cheerio.load(iconv.decode(body,"GBK").toString());
                                var publishTime =$('div.yh_l_times').text().substring(0, 10);//提问日期
                                console.log(publishTime);
                                if( publishTime >= expiredW) {
                                    lastWeek++;
                                }
                                if(publishTime >= expiredM ){
                                    lastMonth++;
                                }
                                console.log(lastWeek, lastMonth, url);
                                cb(null,'');
                            } else {
                                //console.log(url);
                                //console.log('the first load fail....');
                                //cb(null, '没加载成功');
                                getRequest.getRequest(url, function (err, result) {
                                    console.log(name,++count);
                                    $ = cheerio.load(result);
                                    var publishTime =$('div.yh_l_times').text().substring(0, 10);//提问日期
                                    console.log(publishTime);
                                    if( publishTime >= expiredW) {
                                        lastWeek++;
                                    }
                                    if(publishTime >= expiredM ){
                                        lastMonth++;
                                    }
                                    cb(null,'');
                                })

                            }
                        })
                    }, 1000)
                }, function (err, result1) {
                    //写入数据库
                    db.hdfModel.create({name: name, lastMonthNumber: lastMonth, lastWeekNumber: lastWeek}, function (err, doc) {
                        console.log(name,'计数成功,共：', lastMonth, lastWeek);
                        callback(null, result1)
                    })
                })
            } else {
                callback(null, '')
            }
        }, function (err, results) {
            console.log('ending....');

        })
    })
}
paiming();