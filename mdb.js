/**
 * Created by haojing on 15/11/27.
 */
/**
 * Created by haojing on 15/11/9.
 */
var _ = require('lodash');
var mongoose = require('mongoose');
var db = mongoose.createConnection('mongodb://localhost:27017/haodf');

db.on('error', function (error) {
    console.log('连接数据库失败'+ error);
})
db.on('open', function () {
    console.log('----数据库连接成功----');
})

var hdfSchema = new mongoose.Schema({
    name: {type: String},
    lastMonthNumber: {type: Number},
    lastWeekNumber: {type: Number},
});

var haodfSchema = new mongoose.Schema({
    name: {type: String},
    urls: [String]
});

var errorSchema = new mongoose.Schema({
    errorname: {type: String},
    errorurls: [String]
});


var haodfModel2 =db.model('hdf1', haodfSchema);//1
var hdfModel = db.model('hdf2', hdfSchema);//2
var errorModel = db.model('hdf3', errorSchema);

exports.hdfModel = hdfModel;
exports.haodfModel2 = haodfModel2;
exports.errorModel = errorMode