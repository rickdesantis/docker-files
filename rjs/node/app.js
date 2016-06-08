/**
 * Module dependencies.
 */

var express         = require('express'),
    http            = require('http'),
    path            = require('path'),
    fs              = require('fs'),
    bodyParser      = require('body-parser'),
    crypto          = require('crypto'),
    exec            = require('child_process').exec,
    auth            = require('basic-auth');

var app = express();

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

function file_exists(filePath) {
    try {
        var stat = fs.statSync(filePath);
        return stat.isFile() || stat.isDirectory();
    }
    catch (err) {
        return false;
    }
}

function run_command(command) {
    console.log('Running the command...');
    // console.log(command);
    exec(command, function(error, stdout, stderr) {
        if (error) {
            return 'Error while running the script.'; //error.code;
        }
        return 0;
    });
}

function r_execute(file) {
    if (!file || !file_exists(file))
        return 'File not found!';

    console.log('Executing the given R script file...');
    return run_command('Rscript ' + file);
}

function r_execute_body(body) {
    if (!body)
        return 'Empty body!';

    console.log('Executing the given R code...');
    // console.log(body);
    return r_execute(save_script(null, body));
}

var dir = './tmp';
if (!file_exists(dir)) {
    fs.mkdirSync(dir);
}

function save_script(name, body) {
    if (!body)
        return 'Empty body!';

    if (!name) {
        name = crypto.createHash('sha256')
                    .update(body)
                    .digest('hex')
    }

    var tmpfile = get_actual_name(name);

    var file = fs.createWriteStream(tmpfile);
    file.write(body);
    file.end();

    return tmpfile;
}

function delete_script(name) {
    if (!name)
        return 'File not found.';

    var tmpfile = get_actual_name(name);

    if (!file_exists(tmpfile))
        return 'File not found.';

    fs.unlinkSync(tmpfile);
    return 0;
}

function get_actual_name(name) {
    return dir + '/' + name + ".R";
}

var username = 'username';
var password = 'password';
if (process.argv.length > 2) {
    username = process.argv[2];
    if (process.argv.length > 3)
        password = process.argv[3];
}

function secured(request, response) {
    var credentials = auth(request)

    if (!credentials || credentials.name !== username || credentials.pass !== password) {
        response.statusCode = 401
        response.write('Access denied.');
        response.end();
        return false;
    }

    return true;
}

app.put('/rest/api/v1/r/:filename', function(request, response) {
    // console.log(request.query);
    // console.log(request.params);
    // console.log(request.body);

    if (!secured(request, response))
        return;

    var err = null;

    var filename = request.params.filename;

    if (JSON.stringify(request.body) === '{}')
        err = 'Empty body.'
    else {
        filename = save_script(filename, request.body);
    }

    if (err) {
        response.status(500);
        response.setHeader('Content-Type', 'text/plain');
        response.write('Error: ' + err);
        response.end();
        return;
    }

    response.status(200);
    response.setHeader('Content-Type', 'text/plain');
    response.write(filename);
    response.end();
    return;
});

app.get('/rest/api/v1/r/:filename', function(request, response) {
    // console.log(request.query);
    // console.log(request.params);
    // console.log(request.body);

    if (!secured(request, response))
        return;

    var err = null;

    var filename = request.params.filename;

    var res = r_execute(get_actual_name(filename));
    if (res != 0)
        err = res;

    if (err) {
        response.status(500);
        response.setHeader('Content-Type', 'text/plain');
        response.write('Error: ' + err);
        response.end();
        return;
    }

    response.status(200);
    response.setHeader('Content-Type', 'text/plain');
    response.write('OK!');
    response.end();
    return;
});

app.delete('/rest/api/v1/r/:filename', function(request, response) {
    // console.log(request.query);
    // console.log(request.params);
    // console.log(request.body);

    if (!secured(request, response))
        return;

    var err = null;

    var filename = request.params.filename;

    var res = delete_script(filename);
    if (res != 0)
        err = res;

    if (err) {
        response.status(500);
        response.setHeader('Content-Type', 'text/plain');
        response.write('Error: ' + err);
        response.end();
        return;
    }

    response.status(200);
    response.setHeader('Content-Type', 'text/plain');
    response.write('OK!');
    response.end();
    return;
});

http.createServer(app).listen(app.get('port'), '0.0.0.0', function() {
    console.log('Express server listening on port ' + app.get('port'));
});

