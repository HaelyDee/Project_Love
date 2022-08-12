var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var path = require('path');
var sanitizeHtml = require('sanitize-html');
var mysql = require('mysql');
var db = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'pass12',
  database : 'love_test',
  multipleStatements : true
});
db.connect();

var app = http.createServer(function(request,response){
  var _url = request.url;
  var queryData = url.parse(_url, true).query;
  var pathname = url.parse(_url, true).pathname;
  if(pathname === '/'){
    var yy_query = `select distinct SUBSTR(LESN_YM, 1,4) as yy from lesn_list;`;
    var mx_query = `select SUBSTR(LESN_YM, 1,4) as yy
    , cast(SUBSTR(LESN_YM, 5,2) as unsigned) as mm
    , lesn_num as num
    from lesn_list
    where lesn_id = (select max(lesn_id)+1 from lesn_info);`;
    db.query(yy_query + mx_query, function(err, result){
      if(err){
        console.log('error');
        throw err;
      }
      // 수업년도값 불러와 선택값에 담기
      var i = 0;
      var sel_yy = `<select name="lesn_yy">`;
      while(i < result[0].length){
        if(result[0][i].yy === result[1][0].yy){
          sel_yy = sel_yy + `<option value="${result[0][i].yy}" selected>${result[0][i].yy}</option>`
        } else {
          sel_yy = sel_yy + `<option value="${result[0][i].yy}">${result[0][i].yy}</option>`
        }
        i = i + 1;
      }
      sel_yy = sel_yy + `</select>`

      // 1~12월 배열로 만들어 선택값에 담기
      var j = 1;
      var sel_mm = `<select name="lesn_mm">`;
      while(j <= 12){
        if(j === result[1][0].mm){
          sel_mm = sel_mm + `<option value="${j}" selected>${j}</option>`
        } else {
          sel_mm = sel_mm + `<option value="${j}">${j}</option>`;
        }
        j = j + 1;
      }
      sel_mm = sel_mm + `</select>`

      // 1~4 회차 선택값에 담기
      var k = 1;
      var sel_num = `<select name="lesn_num">`;
      while(k <= 4){
        if(k === result[1][0].num){
          sel_num = sel_num + `<option value="${k}" selected>${k}</option>`;
        } else {
          sel_num = sel_num + `<option value="${k}">${k}</option>`;
        }
        k = k + 1;
      }
      sel_num = sel_num + `</select>`

      var html =
      `<!doctype html>
      <html>
      <head>
      <title>♥LDVC♥</title>
      <meta charset="utf-8">
      </head>
      <body>
      <h1> 수업정보 입력창 </h1>
      <h3>
      <form action="/create_process" method="post">
      <label for="lesson_num">수업 선택 : </label>
      ${sel_yy}년 ${sel_mm}월 ${sel_num}회차 수업
      <input type="submit"  value="조회">
      </form>
      </h3>
      </body>
      </html>`

      response.writeHead(200);
      response.end(html);
    });
  } else if(pathname === '/create_process'){
    var body = '';
    request.on('data', function(data){
      body = body + data;
    });
    request.on('end', function(){
      var post = qs.parse(body);
      var info_select_sql =
      `select stud_nm , title, numb
      from lesn_info
      where LESN_ID  =
      (select lesn_id
      from lesn_list
      where SUBSTR(LESN_YM, 1,4) = ?
      and cast(SUBSTR(LESN_YM, 5,2)as unsigned) = ?
      and lesn_num = ?)
      order by LESN_SEQ
      `
      db.query(info_select_sql, [post.lesn_yy, post.lesn_mm, post.lesn_num], function(err, result){
        var input = `<form>`;
        if(result.length === 0){
          var i = 0;
          while(i <= 7){
            input = input + `
            <input type="checkbox" id="del_check">
            <input type="text" id="student" placeholder="수강생 이름">
            <input type="text" id="musical" placeholder="작품명">
            <input type="text" id="number" placeholder="넘버">
            <p>
            `;
            i = i + 1;
          }
        } else {
          var i = 0;
          while(i < result.length){
            input = input + `
            <input type="checkbox" id="del_check">
            <input type="text" id="student" value='${result[i].stud_nm}'>
            <input type="text" id="musical" value='${result[i].title}'>
            <input type="text" id="number" value='${result[i].numb}'>
            <p>
            `;
            i = i + 1;
          }
        }

        var html =
        `
        <!doctype html>
        <html>
        <head>
        <title>♥LDVC♥</title>
        <meta charset="utf-8">
        </head>
        <body>
        <h1> 수업정보 입력창 </h1>
        ${input}
        <input type="button" name="" value="+추가">
        <input type="submit" name="" value="저장">
        <input type="button" name="" value="선택삭제">
        </form>
        </h3>
        </body>
        </html>
        `
        response.writeHead(200);
      response.end(html);
    });
    });
  }
});
app.listen(5000);
