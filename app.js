const express = require('express');
const app  = express();
const bodyParser = require('body-parser');
const http = require('http').createServer(app);
const fs = require('fs');
const parser = require('ua-parser-js');
const email_validator = require("email-validator");
const uniqid = require('uniqid');
const mailer = require('nodemailer-promise');
const LineByLineReader = require('line-by-line');
const UglifyJS = require("uglify-js");
const {formatToTimeZone} = require('date-fns-timezone');
var Kuroshiro = require('kuroshiro');
const FORMAT1 = 'YYYY/MM/DD';
const FORMAT2 = 'HH:mm:ss';
const TIME_ZONE_TOKYO = 'Asia/Tokyo';

const port = 3000;
//const ANKET_DATA_QUEUE_MAX_THRESHOLD = 100;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('views', 'public');
app.set('view engine', 'html');

let ANKET_DATA_QUEUE = [
];
// check QR_NO,mail_address,and execute mail_function
let run = false;

// ANKET DATA
const holiday = ["月", "火", "水", "木", "金", "土", "日", "祝日", "全日"];
const score = ["75未満", "75位", "80位", "85位", "90位", "95位", "100位", "110以上"];
const play_time = ["早朝", "午前", "午後"];
const participation = ["できる","できない"];
const position = ["経営者","管理職","一般職","その他"];
const play_style = ["男性のみ", "女性のみ", "男女問わず"];

const error_msg = {
  "hiragana_error" : "お名前はひらがなのみ許可",
  "email_error_msg001" : "メールアドレスを正しく入力してください",
  "email_error_msg002" : "スマートフォンのメールアドレスを入力してください",
  "holiday_error_msg001" : "休日をお選びください",
  "score_error_msg001"   : "スコアをお選びください",
  "play_time_error_msg001" : "プレー時間をお選びください",
  "participation_error_msg001" : "参加できる日をお選びください",
  "position_error_msg001" : "役職をお選びください",
  "position_others_error_msg001" : "役職を入力してください",
  "position_others_error_msg002" : "ほかのところで入力してください",
  "play_style_error_msg001" : "プレースタイルをお選びください",
  "anket_data_changed_error" : "【アンケート情報が変わりました】もう一度QRコードを読みとってください。",
  "anket_data_queue_max_error" : "大変混み合っています。しばらくしてから確定ボタン押してください",
  "qr_no_not_implemented_error" : "QRが対応されておりません。しばらくしてから確定ボタン押してください",
  "mail_address_is_already_registered_so_anket_registration_error" : "複数回アンケートに答えることができません",
  "only_smartphone_allowed_error" : "SPのみ対応",
  "qr_error001" : " QRコードが未対応です"
}
// writing purpose database location
const anket_file_location  = "../db/anket_db.txt";
const no_of_anket_users_file_location = "../db/no_of_anket_users.txt";
const queue_threshold_file_location = "../db/queue_threshold.txt";
const global_mail_address_file_location  = "../db/global_mail_address_db.txt";
const employee_position_vs_qr_no_file_location  = "../db/employee_position_vs_qr_no.txt";
const specific_qrno_file_location  = "../db/{QR_NO}_anket_db.txt";
/*
システム再起動するときに、すべてのファイル(*.JS,*.html)内容をメモリにロードします。
*/
const SPAJS        = UglifyJS.minify(fs.readFileSync("public/js/SPA.js", 'utf-8').toString()).code;
const DCMJS        = UglifyJS.minify(fs.readFileSync("public/js/disableContextMenu.js", 'utf-8').toString()).code;
const page_not_found_html = fs.readFileSync("public/page_not_found.html", 'utf-8');
const error_html   = fs.readFileSync("public/error.html", 'utf-8');
const SPAhtml      = fs.readFileSync("public/SPA.html", 'utf-8');

/*
システム再起動するときに、すべてのDBファイル(*.txt)内容をメモリにロードします。
*/
// reading purpose database
const ANKET_DATA_QUEUE_MAX_THRESHOLD = parseInt(fs.readFileSync(queue_threshold_file_location, 'utf-8').toString());
const sp_domain_list = fs.readFileSync("../db/email_domain_db.txt", 'utf-8').toString().split("\r\n");
const introducers_db_lines_Array = fs.readFileSync("../db/introducers_db.txt", 'utf-8').toString().split("\r\n");
const emailTemplate = fs.readFileSync("../db/email_template.txt", 'utf-8').toString().split("\r\n").join("<br />");
let employee_position = parseInt(fs.readFileSync(no_of_anket_users_file_location, 'utf-8').toString());
// reading purpose database ⇒ email configurations
const email_configuration_db_lines_Array = fs.readFileSync("../db/email_configuration_db.txt", 'utf-8').toString().split("\r\n");

console.log("--------Loaded Into Memory Start----------");
console.log("queue threshold value : " + ANKET_DATA_QUEUE_MAX_THRESHOLD);
console.log("Email Domainの情報：");
console.log(sp_domain_list);
console.log("担当者の情報：");
console.log(introducers_db_lines_Array);
console.log("emailTemplate：");
console.log(emailTemplate);
console.log("employee_position : " + employee_position);
console.log("email_configuration_db_lines_Array : ");
console.log(email_configuration_db_lines_Array);
console.log("--------Loaded Into Memory End----------");

let emailConfig = mailer.config({
  pool: true,
  host: email_configuration_db_lines_Array[0],
  port: email_configuration_db_lines_Array[1],
  secure: email_configuration_db_lines_Array[2] == "true" ? true : false,
  use_authentication: false // 認証しない
  /*
  auth: {
    user: email_configuration_db_lines_Array[3],
    pass: email_configuration_db_lines_Array[4]
  }*/  
});
const from_email = email_configuration_db_lines_Array[5];
const subject = email_configuration_db_lines_Array[6];

const Modified_SPAhtml = 
  SPAhtml
  .replace(/{holiday0}/g, holiday[0])
  .replace(/{holiday1}/g, holiday[1])
  .replace(/{holiday2}/g, holiday[2])
  .replace(/{holiday3}/g, holiday[3])
  .replace(/{holiday4}/g, holiday[4])
  .replace(/{holiday5}/g, holiday[5])
  .replace(/{holiday6}/g, holiday[6])
  .replace(/{holiday7}/g, holiday[7])
  .replace(/{holiday8}/g, holiday[8])
  .replace(/{score0}/g, score[0])
  .replace(/{score1}/g, score[1])
  .replace(/{score2}/g, score[2])
  .replace(/{score3}/g, score[3])
  .replace(/{score4}/g, score[4])
  .replace(/{score5}/g, score[5])
  .replace(/{score6}/g, score[6])
  .replace(/{score7}/g, score[7])
  .replace(/{play_time0}/g, play_time[0])
  .replace(/{play_time1}/g, play_time[1])
  .replace(/{play_time2}/g, play_time[2])
  .replace(/{participation0}/g, participation[0])
  .replace(/{participation1}/g, participation[1])
  .replace(/{position0}/g, position[0])
  .replace(/{position1}/g, position[1])
  .replace(/{position2}/g, position[2])
  .replace(/{position3}/g, position[3])
  .replace(/{play_style0}/g, play_style[0])
  .replace(/{play_style1}/g, play_style[1])
  .replace(/{play_style2}/g, play_style[2]);
/*
  端末判別(ios/androidのみ対応、PC、日本古い端末未対応)
  iphone/ipad/android　の場合は：md.os() ⇒ ios/Android
  以外場合は：　null
*/
const ios_or_android = function(req) {
  let p = new Promise(function (resolve, reject) {
    const agent = parser(req.headers['user-agent']);
    //console.log("os name : " + agent.os.name);
    //console.log("device name : " + agent.device.model);
    //console.log("-------------------------");
    const osname = agent.os.name;
    const devicename = agent.device.model;
    // mobile or tablet
    const deviceType = agent.device.type;
    if(osname == "iOS" && devicename == "iPhone") {
      //iphone
      resolve("Yes");
    } else if(osname == "iOS" && devicename == "iPad") {
      // ipad
      reject(error_msg.only_smartphone_allowed_error);
    } else if(osname == "Mac OS" && devicename == undefined) {
      // new ipad
      reject(error_msg.only_smartphone_allowed_error);
    } else if(osname == "Android" && deviceType == "mobile") {
      // All Android Mobile
      resolve("Yes");
    } else {
      // 上の以外の場合は。
      reject(error_msg.only_smartphone_allowed_error);
    }
    /*
    if(osname == "iOS" && devicename == "iPhone") {
      //iphone
      resolve("Yes");
    } else if(osname == "iOS" && devicename == "iPad") {
      // ipad
      reject(error_msg.only_smartphone_allowed_error);
    } else if(osname == "Mac OS" && devicename == undefined) {
      // new ipad
      reject(error_msg.only_smartphone_allowed_error);
    } else if(osname == "Android" && devicename == "MediaPad") {
      // Android Tablet Yahoo Mobile Tablet
      reject(error_msg.only_smartphone_allowed_error);
    } else if(osname == "Android" && devicename == undefined) {
      // Androidのガラ携帯
      reject(error_msg.only_smartphone_allowed_error);
    } else if(osname == "Android" && devicename != "") {
      // 普通のAndroid携帯
      resolve("Yes");
    } else {
      // 上の以外の場合は。
      reject(error_msg.only_smartphone_allowed_error);
    }
    */    
  });
  return p;
}

const is_QR_NO_present = function(QR_NO) {
  let p = new Promise(function (resolve, reject) {
    //console.log(introducers_db_lines_Array);
    let introducers_db_lines_Array_length = introducers_db_lines_Array.length;
    let QR_NO_found = false;
    let introducer_name = "";
    for(let lineNo=0; lineNo<introducers_db_lines_Array_length; lineNo++) {
      if(introducers_db_lines_Array[lineNo].split(",")[0] == QR_NO ) {
        QR_NO_found = true;
        // get introducer name from db.
        introducer_name = introducers_db_lines_Array[lineNo].split(",")[1];
        break;
      }
    }

    if(QR_NO_found) {
      resolve(introducer_name);
    } else {
      reject("'" + QR_NO + "'" + error_msg.qr_error001);
    }
  });
  return p;
}

const inputDataAndDeviceCHK = async function(req) {
  let error_flag = false;
  let chkResults = {
    "global_status" : "",
    "device": "",
    "name": "",
    "mail_address": "",
    "holiday": "",
    "score": "",
    "play_time": "",
    "participation": "",
    "position": "",
    "position_others": "",
    "play_style": "",
    "extra_error" : "",
    "ANKET_DATA" : {
      "QR_NO": "",
      "name": "",
      "mail_address": "",
      "holiday": "",
      "score": "",
      "play_time": "",
      "participation": "",
      "position": "",
      "position_others": "",
      "play_style": ""  
    },
    "userinfo" : {
      "registration_date" : "",
      "registration_time" : "",
      "reservation_url" : ""
    }
  };

  // device CHK
  await ios_or_android(req)
  .then(function(successMsg) {
    chkResults.device = "OK";
  })
  .catch(function(errorMsg) {
    chkResults.device = "NG";
    chkResults.extra_error = error_msg.only_smartphone_allowed_error;
    error_flag = true;
  });

  // ANKET DATA CHK
  // QR_NO
  const req_QR_NO = req.body.QR_NO.trim();
  chkResults.ANKET_DATA.QR_NO = req_QR_NO;

  // name CHK
  const req_name = req.body.name.trim();
  chkResults.ANKET_DATA.name = req_name;

  let hiragana = true;
  let length = req_name.length;

  for(let i=0; i<length; i++) {
    if(!Kuroshiro.Util.isHiragana(req_name[i])) {
      hiragana = false;
      break;  
    }
  }

  if(length == 0) {
    hiragana = false;
  }

  if(hiragana) {
    error_flag = false;
  } else {
    chkResults.name = error_msg.hiragana_error;
    error_flag = true;
  }

  // mail_address CHK
  const req_mail_address = req.body.mail_address.trim();
  chkResults.ANKET_DATA.mail_address = req_mail_address;
  if(email_validator.validate(req_mail_address)) {
    if(sp_domain_list.indexOf(req_mail_address.split("@")[1]) != -1) {
    } else {
      chkResults.mail_address = error_msg.email_error_msg002;  
      error_flag = true;
    }
  } else {
    chkResults.mail_address = error_msg.email_error_msg001;
    error_flag = true;
  }

  // holiday CHK
  const req_holiday = req.body.holiday.trim();
  chkResults.ANKET_DATA.holiday = req_holiday;
  if(req_holiday != "") {
    const req_holiday_array = req_holiday.split("-");
    for(let i=0; i<req_holiday_array.length; i++) {
      if(holiday.indexOf(req_holiday_array[i]) == -1) {
        chkResults.extra_error = error_msg.anket_data_changed_error;
        error_flag = true;
        break;
      }
    }
  } else {
    chkResults.holiday = error_msg.holiday_error_msg001;
    error_flag = true;
  }

  // score CHK
  const req_score = req.body.score.trim();
  chkResults.ANKET_DATA.score = req_score;
  if(req_score != "") {
    if(score.indexOf(req_score) == -1) {
      chkResults.extra_error = error_msg.anket_data_changed_error;
      error_flag = true;
    }
  } else {
    chkResults.score = error_msg.score_error_msg001;
    error_flag = true;
  }

  // play_time CHK
  const req_play_time = req.body.play_time.trim();
  chkResults.ANKET_DATA.play_time = req_play_time;
  if(req_play_time != "") {
    const req_play_time_array = req_play_time.split("-");
    for(let i=0; i<req_play_time_array.length; i++) {
      if(play_time.indexOf(req_play_time_array[i]) == -1) {
        chkResults.extra_error = error_msg.anket_data_changed_error;
        error_flag = true;
        break;
      }
    }
  } else {
    chkResults.play_time = error_msg.play_time_error_msg001;
    error_flag = true;
  }

  // participation CHK
  const req_participation = req.body.participation.trim();
  chkResults.ANKET_DATA.participation = req_participation;
  if(req_participation != "") {
    if(participation.indexOf(req_participation) == -1) {
      chkResults.extra_error = error_msg.anket_data_changed_error;
      error_flag = true;
    }
  } else {
    chkResults.participation = error_msg.participation_error_msg001;
    error_flag = true;
  }

  // position CHK
  const req_position = req.body.position.trim();
  chkResults.ANKET_DATA.position = req_position;
  if(req_position != "") {
    if(position.indexOf(req_position) == -1) {
      chkResults.extra_error = error_msg.anket_data_changed_error;
      error_flag = true;
    }
  } else {
    chkResults.position = error_msg.position_error_msg001;
    error_flag = true;
  }
  if(req_position == position[3]) {
    const req_position_others = req.body.position_others.trim();
    chkResults.ANKET_DATA.position_others = req_position_others;
    if(req_position_others == "") {
      chkResults.position_others = error_msg.position_others_error_msg001;
      error_flag = true;
    } else {
      if(position.indexOf(req_position_others) != -1) {
        chkResults.position_others = error_msg.position_others_error_msg002;
        error_flag = true;
      }
    }
  }

  // play_style CHK
  const req_play_style = req.body.play_style;
  chkResults.ANKET_DATA.play_style = req_play_style;
  if(req_play_style != "") {
    if(play_style.indexOf(req_play_style) == -1) {
      chkResults.extra_error = error_msg.anket_data_changed_error;
      error_flag = true;
    }
  } else {
    chkResults.play_style = error_msg.play_style_error_msg001;
    error_flag = true;
  }

  if(error_flag) {
    chkResults.global_status = "NG";
  } else {
    chkResults.global_status = "OK";
  }
  
  return chkResults;
}

const chkQueueLength = function() {
  let p = new Promise(function (resolve, reject) {
    ANKET_DATA_QUEUE.length < ANKET_DATA_QUEUE_MAX_THRESHOLD ? resolve("Yes") : reject(error_msg.anket_data_queue_max_error);
  });
  return p;  
}

function chkEmailExists(file_location, email, index) {
  const lr = new LineByLineReader(file_location);  
  let found = false;
  let p = new Promise(function (resolve, reject) {
    lr.on('line', function (line) {
      if(line.split(",")[index] == email) {
        found = true;
        lr.close();
      }
    });

    lr.on('end', function () {
      if(found) {
        reject(error_msg.mail_address_is_already_registered_so_anket_registration_error);
      } else {
        resolve();
      }  
    });
  });

  return p;
}

function appendRecordToDisk(file_location, record) {
  const stats = fs.statSync(file_location);
  const fileSizeInBytes = stats["size"];
  if(fileSizeInBytes != 0) {
    fs.appendFileSync(file_location, "\r\n");
  }
  fs.appendFileSync(file_location, record);
}

function writeDataToDisk(no_of_anket_users_file_location, employee_position) {
  fs.writeFileSync(no_of_anket_users_file_location, employee_position);
}

function doMail(from, to , subject , html) {
  let message = {
    from: from, // sender address
    to: to, // list of receivers
    subject: subject, // Subject line
    html: html
  };

  let p = new Promise(function (resolve, reject) {
    emailConfig(message)
    .then((info) => {
      //console.log("Mail Sent");
      resolve("Mail Sent");
    })
    .catch((err) => {
      //console.log("Mail Failed");
      resolve("Mail Failed");
    });
  });
  return p;
}

/*
JS　をメモリから帰す
*/
app.get("/DCMJS", async function(req, res) {
  res.end(DCMJS);
});

/*
JS　をメモリから帰す
*/
app.get("/SPAJS", async function(req, res) {
  res.end(SPAJS);
});

/*
QRコードを　Scan　する時実行
*/
app.get("/QR/:QR_NO/ANKET-DISPLAY", async function(req, res) {
  await ios_or_android(req)
  .then(async function(successMsg){
    return await is_QR_NO_present(req.params.QR_NO);    
  })
  .then(function(introducer_name){
    res.end(Modified_SPAhtml.replace(/{QR_NO}/, req.params.QR_NO));
  })
  .catch(function(errorMsg){
    res.end(error_html.replace(/{message}/, errorMsg));
  });
});

/*
入力項目チェックおこないます
*/
app.post("/QR/ANKET-INPUTCHK", async function(req, res) {
  let chkResults = await inputDataAndDeviceCHK(req);
  //console.log(chkResults);
  res.json(chkResults);
});

app.post("/QR/ANKET-REGIST", async function(req, res) {
  let chkResults = await inputDataAndDeviceCHK(req);
  //console.log(chkResults);

  if(chkResults.global_status == "OK") {
    await chkQueueLength()
    .then(function(params) {
      let information = {
        "request" : req,
        "response" : res,
        "chkResults" : chkResults
      }  
      ANKET_DATA_QUEUE.push(information);

      // execute loop() function, if Queue is empty then automatically loop ends.no Cpu cycle
      if(!run) {
        run = true;
        loop();
      }

      //console.log(ANKET_DATA_QUEUE);
      //console.log("Queue length : " + ANKET_DATA_QUEUE.length);
    })
    .catch(function(errorMsg) {
      chkResults.global_status = "NG";
      chkResults.extra_error = errorMsg;
      res.json(chkResults);
    });
  } else {
    res.json(chkResults);
  }
});

app.all("*", function(req, res) {
  res.end(page_not_found_html);
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});

function setImmediatePromise() {
  return new Promise((resolve) => {
    setImmediate(() => resolve());
  });
}

async function loop() {
  while(run) {
    await setImmediatePromise();
    if(ANKET_DATA_QUEUE.length != 0) {
      let introducer_name = "";
      let now = new Date();
      let _date = formatToTimeZone(now, FORMAT1, {timeZone: TIME_ZONE_TOKYO})
      let _time = formatToTimeZone(now, FORMAT2, {timeZone: TIME_ZONE_TOKYO})
      let employee_id = uniqid.time("A-");

      await is_QR_NO_present(ANKET_DATA_QUEUE[0].chkResults.ANKET_DATA.QR_NO)
      .then(async function(introducername) {
        introducer_name = introducername;
        // 6 = index of "mail_address" location in anket_db.txt
        return await chkEmailExists(global_mail_address_file_location, ANKET_DATA_QUEUE[0].chkResults.ANKET_DATA.mail_address, 0);
        //console.log(count.toString() + " Queue length: " + ANKET_DATA_QUEUE.length.toString());
        //ANKET_DATA_QUEUE[0].response.end(count.toString());
        // remove the first item from Array
        //ANKET_DATA_QUEUE.shift();
      })
      .then(async function() {
        //console.log(ANKET_DATA_QUEUE[0].chkResults.ANKET_DATA);
        employee_position++;

        // append (new mail address) to "global_mail_address_file_location" File.
        appendRecordToDisk(global_mail_address_file_location, ANKET_DATA_QUEUE[0].chkResults.ANKET_DATA.mail_address);

        // append (employee_position,QR_NO) to "employee_position_vs_qr_no_file_location" File
        appendRecordToDisk(employee_position_vs_qr_no_file_location, employee_position + "," +  ANKET_DATA_QUEUE[0].chkResults.ANKET_DATA.QR_NO);
        
        let p = ANKET_DATA_QUEUE[0].chkResults.ANKET_DATA.position != "" ?  ANKET_DATA_QUEUE[0].chkResults.ANKET_DATA.position : ANKET_DATA_QUEUE[0].chkResults.ANKET_DATA.position_others;
        //QR_NO関係なくアンケート答えてる人が何番ですか？（Position）、QR_NO、紹介者名、仮会員番号、仮会員登録日、仮会員タイム、chkResults.ANKET_DATA
        let record = 
          employee_position + "," + 
          ANKET_DATA_QUEUE[0].chkResults.ANKET_DATA.QR_NO + "," + 
          introducer_name + "," + 
          employee_id + "," + 
          _date + "," + 
          _time + "," + 
          ANKET_DATA_QUEUE[0].chkResults.ANKET_DATA.mail_address + "," + 
          ANKET_DATA_QUEUE[0].chkResults.ANKET_DATA.holiday + "," + 
          ANKET_DATA_QUEUE[0].chkResults.ANKET_DATA.score + "," + 
          ANKET_DATA_QUEUE[0].chkResults.ANKET_DATA.play_time + "," + 
          ANKET_DATA_QUEUE[0].chkResults.ANKET_DATA.participation + "," + 
          p + "," + 
          ANKET_DATA_QUEUE[0].chkResults.ANKET_DATA.play_style + "," + 
          ANKET_DATA_QUEUE[0].chkResults.ANKET_DATA.name;
          // append record to the database.
          appendRecordToDisk(anket_file_location, record);

          // append record to the specific "specific_qrno_file_location".
          appendRecordToDisk(specific_qrno_file_location.replace(/{QR_NO}/g, ANKET_DATA_QUEUE[0].chkResults.ANKET_DATA.QR_NO), record);
                    
          // sending mail
          let Modified_emailTemplate = 
          emailTemplate
          .replace(/{NAME}/g, ANKET_DATA_QUEUE[0].chkResults.ANKET_DATA.name)
          .replace(/{EMPLOYEE_ID}/g, employee_id)
          .replace(/{REGISTRATION_DATE}/g, _date)
          .replace(/{REGISTRATION_TIME}/g, _time)
          .replace(/{RESERVATION_URL}/g, '<a href="' + "http://34.84.118.250:4000/r/" + employee_id + '" target="_blank">予約</a>');
          return await doMail(from_email, ANKET_DATA_QUEUE[0].chkResults.ANKET_DATA.mail_address , subject , Modified_emailTemplate);
      })
      .then(function(successOrFailureMessage) {
        ANKET_DATA_QUEUE[0].chkResults.userinfo.registration_date = _date;
        ANKET_DATA_QUEUE[0].chkResults.userinfo.registration_time = _time;
        ANKET_DATA_QUEUE[0].chkResults.userinfo.reservation_url = "http://34.84.118.250:4000/r/" + employee_id;
        ANKET_DATA_QUEUE[0].response.json(ANKET_DATA_QUEUE[0].chkResults);

        // save employee_position to Disk
        writeDataToDisk(no_of_anket_users_file_location, employee_position);
        // remove the first item from Array
        ANKET_DATA_QUEUE.shift();
        //console.log("deleted queue length" + ANKET_DATA_QUEUE.length);
      })
      .catch(function(errorMsg) {
        ANKET_DATA_QUEUE[0].chkResults.global_status = "NG";
        ANKET_DATA_QUEUE[0].chkResults.extra_error = errorMsg;
        ANKET_DATA_QUEUE[0].response.json(ANKET_DATA_QUEUE[0].chkResults);
        // remove the first item from Array
        ANKET_DATA_QUEUE.shift();
        //console.log("deleted queue length" + ANKET_DATA_QUEUE.length);
      });
      
    } else {
      run = false;
    }
  }
}
//loop();