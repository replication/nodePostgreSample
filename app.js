/**
 * Module dependencies.
 */

var express = require('express');
var sys = require('sys');

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

var pg = require('pg');
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
				title: 'node.js + PostgreSQL',
				data: rows
			});
		});
	});
});

app.post('/', function(req, res){
	action = req.body.action;
	text = req.body.text;
	selected = req.body.selected;

	// callback function
	var callback = function(err, client) {
		if(err) {
			res.writeHead(500, {"Content-Type" : "text/plain"});
			return res.end("Error! " + sys.inspect(err))
		}
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
				title: 'node.js + PostgreSQL',
				data: rows
			});
		});
	}
	
	pg.connect(connectionString, function(err, client) {
		// 新規登録
		var query;
		if(action === "create") {
			query = client.query('INSERT INTO test(name) VALUES($1)', [text], callback(err, client));
		}
		// 更新
		else if(action === "update") {
			query = client.query('UPDATE test SET NAME = $1 WHERE ID = $2', [text, selected], callback(err, client));
		}
		// 削除
		else if(action === "delete") {
			query = client.query('DELETE FROM test WHERE ID = $1', [selected], callback(err, client));
		}
		// 上記以外
		else {
			callback(err, client);
			return true;
		}
	});
});

// Only listen on $ node app.js
if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port);
}
