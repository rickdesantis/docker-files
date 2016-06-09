/**
 * Module dependencies.
 */

var express         = require('express'),
    http            = require('http'),
    bodyParser      = require('body-parser');

var app = express();
app.use('/rest/api/v1/r', require('./router'));

// all environments
app.set('port', process.env.PORT || 3000);
app.use(require('morgan')('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());
app.use(require('method-override')());

// development only
if ('development' === app.get('env')) {
    app.use(require('errorhandler')());
}

http.createServer(app).listen(app.get('port'), '0.0.0.0', function() {
    console.log('Express server listening on port ' + app.get('port'));
});

