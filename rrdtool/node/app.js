/**
 * Module dependencies.
 */

"use strict";

const express      = require('express'),
      http         = require('http'),
    //   path         = require('path'),
      bodyParser   = require('body-parser'),
      logger       = require('log4js').getLogger('app.js'),
      helmet       = require('helmet'),
      compression  = require('compression'),
      fs           = require('fs'),
      https        = require('https'),
      cluster      = require('cluster');

process.env.NAME = process.env.NAME || 'docker';
process.env.PASSWORD = process.env.PASSWORD || 'docker';
process.env.EXEC_PATH = process.env.EXEC_PATH || '/opt/rrdtool/bin';
process.env.DATA_PATH = process.env.DATA_PATH || '/opt/rrd-data';
process.env.PORT = process.env.PORT || 3000;
process.env.S_PORT = process.env.S_PORT || 4000;

let app = express();
http.globalAgent.maxSockets = Infinity

// all environments
app.set('port', process.env.PORT);
app.use(require('morgan')('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(require('method-override')());
// app.use('/', express.static(path.join(__dirname, '/public')));

app.use(helmet());
app.use(compression());
app.use('/rest/api/v1/', require('./components/api'));

// development only
if ('development' === app.get('env')) {
    app.use(require('errorhandler')());
}

// https
app.set('s_port', process.env.S_PORT);
let httpsOptions = { key: null, cert: null }
if (!process.env.VCAP_APPLICATION) {
    httpsOptions.key = fs.readFileSync('./cert/server.key')
    httpsOptions.cert = fs.readFileSync('./cert/server.crt')
    https.globalAgent.maxSockets = Infinity
}

//work around intermediate CA issue
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

const numCPUs = require('os').cpus().length;

if (require.main === module) {
    if (cluster.isMaster) {
        for (let i = 0; i < numCPUs; ++i) {
            cluster.fork();
        }

        cluster.on('exit', function(worker) { //, code, signal) {
            console.log(`Worker ${worker.process.pid} died.`);
            cluster.fork();
        });
    } else {
        http.createServer(app).listen(app.get('port'), '0.0.0.0', function() {
            logger.info(`Express server listening on port ${app.get('port')}`);
        });

        if (!process.env.VCAP_APPLICATION) {
            https.createServer(httpsOptions, app).listen(app.get('s_port'), '0.0.0.0', function() {
                logger.info(`Express server listening on port ${app.get('s_port')}`);
            });
        }
    }
}
