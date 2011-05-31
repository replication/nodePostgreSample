/**
 * Module dependencies.
 */
require.paths.push('/usr/local/lib/node_modules');
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

var title = "node.js + PostgreSQL";
var action;
var errorMsg = "";

// Routes
app.get('/', function(req, res){
	pg.connect(connectionString, function(error, client) {
		var rows = [];
		var query = client.query('SELECT * FROM test');
		query.on('error', function(error) {
			console.log("error event stat...");
			errorMsg = sys.inspect(error);
			console.log(errorMsg);
			res.render('index', {
				title: title,
				data: rows,
				message: errorMsg
			});
		});
		query.on('row', function(row) {
			console.log("row event start...");
			rows.push(row);
		});
		query.on('end', function(row, error) {
			console.log("end event start...");
			if(!errorMsg) {
				res.render('index', {
					title: title,
					data: rows,
					message: errorMsg
				});
			}
		});
	});
});

app.post('/', function(req, res){
	action = req.body.action;

	var show = function(error, client) {
		// 検索
		var query;
		if(action === "search") {
			query = client.query('SELECT * FROM test WHERE NAME = $1', [req.body.text]);
		}
		// 上記以外
		else {
			query = client.query('SELECT * FROM test');
		}
		var rows = [];
		query.on('error', function(error) {
			console.log("error event stat...");
			errorMsg = sys.inspect(error);
			console.log(errorMsg);
		});
		query.on('row', function(row) {
			rows.push(row);
		});
		query.on('end', function(row) {
			res.render('index', {
				title: 'node.js + PostgreSQL',
				data: rows,
				message: errorMsg
			});
		});
	}
	
	pg.connect(connectionString, function(error, client) {
		var query;
		switch(action) {
			// 新規登録
			case "create":
				query = client.query('INSERT INTO test(name) VALUES($1)', [req.body.text]);
				break;
			// 更新
			case "update":
				query = client.query('UPDATE test SET NAME = $1 WHERE ID = $2', [req.body.text, req.body.selected]);
				break;
			// 削除
			case "delete":
				query = client.query('DELETE FROM test WHERE ID = $1', [req.body.selected]);
				break;
		}
		show(error, client);
	});
});

// Only listen on $ node app.js
if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port);
}
