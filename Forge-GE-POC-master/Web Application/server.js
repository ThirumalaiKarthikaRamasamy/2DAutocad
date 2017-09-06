
var api = require('./routes/api');
var ForgeRoute = require('./routes/ForgeRoute'); 
var designauto = require('./routes/design-auto');
var designauto_stg = require('./routes/design-auto-stg');
var express = require('express');
var bodyParser = require("body-parser");

var app = express();
var server = require('http').Server(app);
 
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.use('/', express.static(__dirname+ '/www') );
 
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb'}));

app.use('/api', api);
app.use('/ForgeRoute', ForgeRoute);
app.use('/designauto', designauto);
app.use('/designauto_stg', designauto_stg);
app.use('/items', express.static(__dirname + '/items'));
app.use('/downloads', express.static(__dirname + '/downloads'));
app.use('/json', express.static(__dirname + '/json'));


app.use('/jsontasks', express.static(__dirname + '/jsontasks'));


app.set('port', process.env.PORT || 3006);

server.listen(app.get('port'), function() {
    console.log('Server listening on port ' + server.address().port);
});
