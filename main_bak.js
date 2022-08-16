const express = require('express'); //express 모듈 가져오기, const는 상수(값 고정)
const app = express(); //express 함수처럼 호출하여 변수 app에 담기
var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var path = require('path');
var sanitizeHtml = require('sanitize-html');
var bodyParser = require('body-parser');
var compression = require('compression');

var mysql = require('mysql');
var db = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'pass12',
  database : 'love_test',
  multipleStatements : true
});
db.connect();

app.use(express.static('file'));
//bodyParser라는 middleware 호출
app.use(bodyParser.urlencoded({ extended: false }));
//compression 미들웨어 호출
app.use(compression());

var head = `
<head>
<link rel="stylesheet" href="http://localhost:5000/css/style.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR&display=swap" rel="stylesheet">
<title>♥LDVC♥</title>
<meta charset="utf-8">
</head>
`

// 작품명 리스트 추출
var titleList = '';
db.query('select distinct title as title from numb_info;', function(err, result){
  if(err){
    console.log('error');
    throw err;
  }
  titleList = `<datalist id="titleList">`
  var i = 0
  while(i < result.length){
    titleList += `<option value="${result[i].title}">${result[i].title}</option>`;
    i += 1;
  };
  titleList += `</datalist>`
});
console.log(titleList);

app.get('/', function (req, res) {
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
    ${head}
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

    res.send(html);
  });
});

app.post('/create_process', function (req, res) {
  var post = req.body;
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
      var get_numb = function(){
        console.log(titleList);
      };
      if(result.length === 0){
        var i = 0;
        while(i <= 7){
          input = input + `
          <input type="checkbox" id="del_check">
          <input type="text" id="student" placeholder="수강생 이름">
          <input type="text" id="musical" list = "titleList" placeholder="작품명" onchange="get_numb()">
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
          <input type="text" id="musical" list = "titleList" value='${result[i].title}' onchange="get_numb()">
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
      ${head}
      <body>
      <h1> 수업정보 입력창 </h1>
      ${input}
      ${titleList}
      <input type="button" name="" value="+추가">
      <input type="submit" name="" value="저장">
      <input type="button" name="" value="선택삭제">
      </form>
      </h3>
      </body>
      </html>
      `
      res.send(html);
    });
  });


  app.listen(5000);
