var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
// var node_acl = require('acl');

var indexRouter = require('./routes/index');
var analyticsRouter = require('./routes/analytics');

var mongoose = require('mongoose');

var app = express();

const DATABASE = 'mongodb://localhost:27017/ethBlockchainExplorer'

mongoose.connect(DATABASE,{useNewUrlParser: true});

mongoose.connection.on('connected', function () {
  console.log('Connected to database...');
  // var mongoBackend = new node_acl.mongodbBackend(mongoose.connection.db /*, {String} prefix */ );

  // Create a new access control list by providing the mongo backend
  //  Also inject a simple logger to provide meaningful output
  // acl = new node_acl(mongoBackend, logger());

  // module.exports.acl = acl;

  setRoles();

  initApp();
});

function setRoles() {

}


function initApp() {
  // view engine setup
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');

  app.use(logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded({
    extended: false
  }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));

  app.use('/', indexRouter);
  app.use('/analytics', analyticsRouter);

  // catch 404 and forward to error handler
  app.use(function (req, res, next) {
    next(createError(404));
  });

  // error handler
  app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
  });
}

module.exports = app;
