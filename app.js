/**
 * Module dependencies.
 */

var express = require('express');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

var pg = require('pg').native;
var connectionString = "tcp://ユーザID:パスワード@localhost:5432/データベース名";
var action;
var text;
var selected;

// Routes
app.get('/', function(req, res){
  pg.connect(connectionString, function(err, client) {
    var query = client.query('SELECT * FROM test');
    var rows = [];
    query.on('row', function(row) {
      rows.push(row);
    });
    query.on('end', function(row) {
  　　　res.render('index', {
    　　　　title: 'Express',
    　　　　data: rows
  　　　});
    });
  });
});

app.post('/', function(req, res){

  action = req.body.action;
  text = req.body.text;
  selected = req.body.selected;

	var after = function(err) {
	  if(err) {
	    res.writeHead(500, {"Content-Type" : "text/plain"});
	    return res.end("Error! " + sys.inspect(err))
	  }
	  
	　pg.connect(connectionString, function(err, client) {
	    // 検索のときはクエリを変える
	    if(action === "search") {
	      var query = client.query('SELECT * FROM test WHERE NAME = $1', [text]);
	    }
	    else {
	      var query = client.query('SELECT * FROM test');
	    }
	    var rows = [];
	    query.on('row', function(row) {
	      rows.push(row);
	    });
	    query.on('end', function(row) {
	  　  res.render('index', {
	  　    title: 'Express',
	  　    data: rows
	  　  });
	    });
	  });
	}
	  
  // for debug 
  console.log("action::" + action);
  console.log("text::" + text);
  console.log("selected::" + selected);
  
  if(action === "create") {
    pg.connect(connectionString, function(err, client) {
      client.query('INSERT INTO test(name) VALUES($1)', [text], after(err));
    });
  }
  else if(action === "update") {
    pg.connect(connectionString, function(err, client) {
      client.query('UPDATE test SET NAME = $1 WHERE ID = $2', [text, selected], after(err));
    });
  }
  else if(action === "delete") {
    pg.connect(connectionString, function(err, client) {
      client.query('DELETE FROM test WHERE ID = $1', [selected], after(err));
    });
  }
  else {
    pg.connect(connectionString, function(err, client) {
      after(err);
    });
  }
});

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port);
}
