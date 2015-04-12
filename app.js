var io = require('socket.io').listen(3000);
console.log('Server on port 3000.');

//创建 databases 目录
var fs = require("fs");
if(!fs.existsSync("databases"))
{
  fs.mkdirSync("databases",function(err)
    {
      if(err)
      {
        console.log(err);
        return;
      }
    });
}

var sqlite3 = require('sqlite3');
//初始化数据库
var db = new sqlite3.Database('databases/NoteDB.sqlite3');
db.run("CREATE TABLE IF NOT EXISTS Note (cdate TEXT PRIMARY KEY , content TEXT)");
db.close();

io.sockets.on('connection',function(socket)
{
  console.log("Connection " + socket.id + " accepted.");

  //向客户端发送信息
  socket.send('Hello Cocos2d-x');
  //注册message事件
  socket.on('message',function(data)
  {
    console.log(data);
  });

  //注册callServerEvent事件，便于客户端调用
  socket.on('callServerEvent',function(data)
  {
    console.log(data);
    //向客户端发送消息，触发客户端的callClientEvent事件
    socket.emit('callClientEvent',{'message':'Hello Client.'});
  });

  //CRUD
  socket.on('findAll',function(data)
    {
      var db = new sqlite3.Database('databases/NoteDB.sqlite3');
      db.all("SELECT cdate,content FROM Note",function(err,res){
        if(!err){
          var jsonObj = {
              ResultCode : 0 , Record : res
          };
          socket.emit('findAllCallBack',jsonObj);
        }
      });
    });

  socket.on('create',function(data)
    {
      var db = new sqlite3.Database('databases/NoteDB.sqlite3');
      var stmt = db.prepare("INSERT OR REPLACE INTO note(cdate , content) VALUES(?,?)");
      stmt.run(data.cdate , data.content);
      stmt.finalize();
      db.close();
      socket.emit('createCallBack',{
        ResultCode : 0
      });
    });

  socket.on('remove',function(data)
    {
      console.log(data.cdate);
      var db = new sqlite3.Database('databases/NoteDB.sqlite3');
      var stmt = db.prepare("DELETE FROM note where cdate = ?");
      stmt.run(data.cdate);
      stmt.finalize();
      db.close();
      socket.emit('removeCallBack',{
        ResultCode : 0
      });
    });

  socket.on('modify',function(data)
    {
      console.log("call modify. "+data.cdate);
      console.log("call modify.content " + data.content);
      var db = new sqlite3.Database('databases/NoteDB.sqlite3');
      var stmt = db.prepare("UPDATE note set content = ? where cdate = ?");
      stmt.run(data.content , data.cdate);
      stmt.finalize();
      db.close();
      socket.emit('modifyCallBack',{
        ResultCode : 0
      });
    });
});