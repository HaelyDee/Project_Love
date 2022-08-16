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
app.use(bodyParser.urlencoded({ extended: false }));
app.use(compression());

var head = `
<head>
<link rel="stylesheet" href="http://localhost:5000/css/style.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR&display=swap" rel="stylesheet">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>♥LDVC♥</title>
<meta charset="utf-8">
</head>
`

//수강생 리스트 추출
var studList = '';
db.query('select distinct stud_nm as stud from stud_info;', function(err, result){
  if(err){
    console.log('error');
    throw err;
  }
  studList = `<datalist id="studList">`
  var i = 0
  while(i < result.length){
    studList += `<option value="${result[i].stud}">${result[i].stud}</option>`;
    i += 1;
  };
  studList += `</datalist>`
});

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

// 작품별 넘버 리스트 추출
var numb_list_sql =
`select b.titleid, a.numb
from numb_info a
left outer join
(
select distinct title
, @rownum := @rownum + 1 as titleid
from
(select distinct title as title
from numb_info) a
, (select @rownum := 0) tmp
order by title asc
) b
on a.title = b.title`;
var numbList = db.query(numb_list_sql, function(err, res){
  return res;
});


var yy_query = `select distinct SUBSTR(LESN_YM, 1,4) as yy from lesn_list;`;
var yy_list = new Array();
db.query(yy_query, function(err, result){
  var i = 0;
  while(i < result.length){
    yy_list.push(result[i].yy);
    i += 1;
  }
  return yy_list;
});

var mx_query =
`select SUBSTR(LESN_YM, 1,4) as yy
      , cast(SUBSTR(LESN_YM, 5,2) as unsigned) as mm
      , lesn_num as num
   from lesn_list
  where lesn_id = (select max(lesn_id) + 1 from lesn_info);`;


app.get('/', function (req, res) {

  db.query(yy_query + mx_query, function(err, result){
    if(err){
      console.log('error');
      throw err;
    }
    // [수업 선택]
    // 수업년도값 불러와 선택값에 담기
    var i = 0;
    var sel_yy = `<select name="lesn_yy">`;
    while(i < yy_list.length){
      if(yy_list[i] === result[1][0].yy){
        sel_yy = sel_yy + `<option value="${yy_list[i]}" selected>${yy_list[i]}</option>`
      } else {
        sel_yy = sel_yy + `<option value="${yy_list[i]}">${yy_list[i]}</option>`
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

    // [수업정보]
    var input = `<form>`;
    var i = 0;
    while(i <= 7){
      input = input + `
      <input type="checkbox" id="del_check">
      <input type="text" class="name" id="student" list="studList" placeholder="수강생명">
      <input type="text" class="title" id="musical" list="titleList" placeholder="작품명">
      <input type="text" class="number" id="number" placeholder="넘버">
      <p>
      `;
      i = i + 1;
    }

    var html =
    `<!doctype html>
    <html>
    ${head}
    <body>
    <div><h1> 수업회차 선택 </h1></div>
    <h3>
    <form action="/selected" method="post">
    ${sel_yy}년 ${sel_mm}월 ${sel_num}회차 수업
    <input type="submit"  value="조회">
    </form>
    </h3>
    <p><p>
    <h1> 수업정보 입력 </h1>
    <form action="/save" method="post">
    ${input}
    ${studList}
    ${titleList}
    <input type="button" name="" value="+추가">
    <input type="submit" name="" value="저장">
    <input type="button" name="" value="선택삭제">
    </form>
    </h3>
    </body>
    </html>`

    res.send(html);
  });
});

app.post('/selected', function (req, res) {
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
    db.query(yy_query, function(err, res1){
      if(err){
        console.log('error');
        throw err;
      }

      // [수업 선택]
      // 수업년도값 불러와 선택값에 담기
      var i = 0;
      var sel_yy = `<select name="lesn_yy">`;
      while(i < yy_list.length){
        if(yy_list[i] === post.lesn_yy){
          sel_yy = sel_yy + `<option value="${yy_list[i]}" selected>${yy_list[i]}</option>`
        } else {
          sel_yy = sel_yy + `<option value="${yy_list[i]}">${yy_list[i]}</option>`
        }
        i = i + 1;
      }
      sel_yy = sel_yy + `</select>`

      // 1~12월 배열로 만들어 선택값에 담기
      var j = 1;
      var sel_mm = `<select name="lesn_mm">`;
      while(j <= 12){
        if(j === parseInt(post.lesn_mm)){
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
        if(k ===  parseInt(post.lesn_num)){
          sel_num = sel_num + `<option value="${k}" selected>${k}</option>`;
        } else {
          sel_num = sel_num + `<option value="${k}">${k}</option>`;
        }
        k = k + 1;
      }
      sel_num = sel_num + `</select>`

    db.query(info_select_sql, [post.lesn_yy, post.lesn_mm, post.lesn_num], function(err, res2){
      var input = `<form>`;
      if(res2.length === 0){
        var i = 0;
        while(i <= 7){
          input = input + `
          <input type="checkbox" id="del_check">
          <input type="text" class="name" id="student" list="studList" placeholder="수강생명">
          <input type="text" class="title" id="musical" list="titleList" placeholder="작품명">
          <input type="text" class="number" id="number" placeholder="넘버">
          <p>
          `;
          i = i + 1;
        }
      } else {
        var i = 0;
        while(i < res2.length){
          input = input + `
          <input type="checkbox" id="del_check">
          <input type="text" class="name" id="student" list="studList" value='${res2[i].stud_nm}'>
          <input type="text" class="title" id="musical" list = "titleList" value='${res2[i].title}'>
          <input type="text" class="number" id="number" value='${res2[i].numb}'>
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
      <h1> 수업회차 선택 </h1>
      <h3>
      <form action="/selected" method="post">
      ${sel_yy}년 ${sel_mm}월 ${sel_num}회차 수업
      <input type="submit"  value="조회">
      </form>
      </h3>
      <p><p>
      <h1> 수업정보 입력 </h1>
      <form action="/save" method="post">
      ${input}
      ${titleList}
      ${studList}
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
  });

  app.post('/save', function (req, res) {
    var post = req.body;
    console.log(post.length);
    var html =
    `
    <!doctype html>
    <html>
    ${head}
    <body>
    ${post}
    `;
    res.send(html);
  });


  app.listen(5000);
