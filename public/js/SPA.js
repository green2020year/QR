var SPA = (function() {
  // private var & functions
  //var　⇒　mail_address,holiday[],score,play_time[],participation,position,position_others,play_style
  var ANKET_DATA = {
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
  };

  showScreen001AndRegisterEvents = function() {
    // show screen001 
    document.querySelector("#screen001").style.display = "block";
    document.querySelector("#screen002").style.display = "none";
    document.querySelector("#screen003").style.display = "none";

    // remove all anket error messages
    screen001_clear_error_messages();

    // register action on click
    document.querySelector("#screen001 .btn01").addEventListener("click", screen001_btn01_action);
    document.querySelector("#screen001 .btn02").addEventListener("click", screen001_btn02_action);
    var positionList = document.querySelectorAll("#screen001 #position_container input[name='position']");
    for(var i=0; i<positionList.length; i++) {
      if(i == 3) {
        positionList[i].addEventListener("click", function(event){
          document.querySelector("#screen001 #position_container input[type='text']").removeAttribute("disabled");
          ANKET_DATA.position_others = document.querySelector("#screen001 #position_container input[type='text']").value;
        });
      } else {
        positionList[i].addEventListener("click", function(event){
          document.querySelector("#screen001 #position_container input[type='text']").setAttribute("disabled", "disabled");
          document.querySelector("#screen001 #position_container input[type='text']").value = "";
          ANKET_DATA.position_others = "";
        });
      }
    }
  }
  
  screen001_clear_error_messages = function() {
    document.querySelector("#screen001 #name_container .error-msg").textContent = "";
    document.querySelector("#screen001 #mail_address_container .error-msg").textContent = "";
    document.querySelector("#screen001 #holiday_container .error-msg").textContent = "";
    document.querySelector("#screen001 #score_container .error-msg").textContent = "";
    document.querySelector("#screen001 #play_time_container .error-msg").textContent = "";
    document.querySelector("#screen001 #participation_container .error-msg").textContent = "";
    document.querySelector("#screen001 #position_container .position").textContent = "";
    document.querySelector("#screen001 #position_container .position_others").textContent = "";
    document.querySelector("#screen001 #play_style_container .error-msg").textContent = "";
    document.querySelector("#screen001 .nav_footer.server-error").style.display = "none";
  }

  screen001_btn01_action = function(event) {
    // remove all anket error messages
    screen001_clear_error_messages();

    // clear name from memory & DOM
    
    ANKET_DATA.name = "";
    document.querySelector("#screen001 #name_container input").value = "";

    // clear mail address from memory & DOM
    
    ANKET_DATA.mail_address = "";
    document.querySelector("#screen001 #mail_address_container input").value = "";
    
    // clear holiday from memory & DOM
    ANKET_DATA.holiday = "";
    var checkedList = document.querySelectorAll("#screen001 #holiday_container input[name^='holiday[']");    
    for(var i=0; i<checkedList.length; i++) {
      checkedList[i].checked  = false;
    }
    // clear score from memory & DOM
    ANKET_DATA.score = "";
    checkedList = document.querySelectorAll("#screen001 #score_container input[name='score']");
    for(var i=0; i<checkedList.length; i++) {
      checkedList[i].checked  = false;
    }
    
    // clear play_time from memory & DOM
    ANKET_DATA.play_time = "";
    checkedList = document.querySelectorAll("#screen001 #play_time_container input[name^='play_time[']");
    for(var i=0; i<checkedList.length; i++) {
      checkedList[i].checked  = false;
    }

    // clear participation from memory & DOM
    ANKET_DATA.participation = "";
    checkedList = document.querySelectorAll("#screen001 #participation_container input[name='participation']");
    for(var i=0; i<checkedList.length; i++) {
      checkedList[i].checked  = false;
    }

    // clear position from memory & DOM
    ANKET_DATA.position = "";
    checkedList = document.querySelectorAll("#screen001 #position_container input[name='position']");
    for(var i=0; i<checkedList.length; i++) {
      checkedList[i].checked  = false;
    }
    ANKET_DATA.position_others = "";
    document.querySelector("#screen001 #position_container input[type='text']").value = "";

    // clear play_style from memory & DOM
    ANKET_DATA.play_style = "";
    checkedList = document.querySelectorAll("#screen001 #play_style_container input[name='play_style']");
    for(var i=0; i<checkedList.length; i++) {
      checkedList[i].checked  = false;
    }

    event.preventDefault();
  }

  screen001_btn02_action = function(event) {
    //var　⇒　mail_address,holiday[],score,play_time[],participation,position,play_style
    // QR_NO value
    ANKET_DATA.QR_NO = document.querySelector("#screen001 input[name='QR_NO']").value;

    // name value
    ANKET_DATA.name = document.querySelector("#screen001 #name_container input").value;

    // mail_address value
    ANKET_DATA.mail_address = document.querySelector("#screen001 #mail_address_container input").value;

    // holiday[]
    var holiday = [];
    var checkedList = document.querySelectorAll("#screen001 #holiday_container input[name^='holiday[']:checked");
    for(var i=0; i<checkedList.length; i++) {
      holiday.push(checkedList[i].value);
    }
    ANKET_DATA.holiday = holiday.join("-");

    // score
    checkedList = document.querySelectorAll("#screen001 #score_container input[name='score']:checked");
    ANKET_DATA.score = checkedList.length != 0 ? checkedList[0].value : "";

    // play_time[]
    var play_time = [];
    checkedList = document.querySelectorAll("#screen001 #play_time_container input[name^='play_time[']:checked");
    for(var i=0; i<checkedList.length; i++) {
      play_time.push(checkedList[i].value);
    }
    ANKET_DATA.play_time = play_time.join("-");

    // participation
    checkedList = document.querySelectorAll("#screen001 #participation_container input[name='participation']:checked");
    ANKET_DATA.participation = checkedList.length != 0 ? checkedList[0].value : "";

    // position
    checkedList = document.querySelectorAll("#screen001 #position_container input[name='position']:checked");
    ANKET_DATA.position = checkedList.length != 0 ? checkedList[0].value : "";
    ANKET_DATA.position_others = document.querySelector("#screen001 #position_container input[type='text']").value;

    // play style
    checkedList = document.querySelectorAll("#screen001 #play_style_container input[name='play_style']:checked");
    ANKET_DATA.play_style = checkedList.length != 0 ? checkedList[0].value : "";

    event.preventDefault();
    // button disabled
    screen001_btn02_disable();
    // input Check
    screen001InputCHK();
  }

  screen001_btn02_enable = function() {
    document.querySelector("#screen001 .btn02").removeAttribute("disabled");
  }

  screen001_btn02_disable = function() {
    document.querySelector("#screen001 .btn02").setAttribute("disabled", "disabled");
  }

  screen001InputCHK = function() {
    axios.post("/QR/ANKET-INPUTCHK", ANKET_DATA).then(function(result){
      var response = result.data;
      if(response.global_status == "OK") {
        // enable button
        screen001_btn02_enable();
        // show Screen002
        showScreen002AndRegisterEvents();
      } else {
        document.querySelector("#screen001 #name_container .error-msg").textContent = response.name;
        document.querySelector("#screen001 #mail_address_container .error-msg").textContent = response.mail_address;
        document.querySelector("#screen001 #holiday_container .error-msg").textContent = response.holiday;
        document.querySelector("#screen001 #score_container .error-msg").textContent = response.score;
        document.querySelector("#screen001 #play_time_container .error-msg").textContent = response.play_time;
        document.querySelector("#screen001 #participation_container .error-msg").textContent = response.participation;
        document.querySelector("#screen001 #position_container .position").textContent = response.position;
        document.querySelector("#screen001 #position_container .position_others").textContent = response.position_others;
        document.querySelector("#screen001 #play_style_container .error-msg").textContent = response.play_style;
  
        if(response.extra_error != "") {
          document.querySelector("#screen001 .nav_footer.server-error").style.display = "block";
          document.querySelector("#screen001 .nav_footer.server-error marquee").textContent = response.extra_error;
        } else {
          document.querySelector("#screen001 .nav_footer.server-error").style.display = "none";
        }

        // enable button
        screen001_btn02_enable();
      }
    }).catch(function(error){
      document.querySelector("#screen001 .nav_footer.server-error").style.display = "block";
      document.querySelector("#screen001 .nav_footer.server-error marquee").textContent = error.message;
      // enable button
      screen001_btn02_enable();
    });
  }

  showScreen002AndRegisterEvents = function() {
    document.querySelector("#screen001").style.display = "none";
    document.querySelector("#screen002").style.display = "block";
    document.querySelector("#screen003").style.display = "none";

    document.querySelector("#screen002 #mail_address_container .error-msg").textContent = "";
    document.querySelector("#screen002 .nav_footer.server-error").style.display = "none";

    //var　⇒　name,mail_address,holiday[],score,play_time[],participation,position,play_style
    // show mail_address
    document.querySelector("#screen002 #name_container .card-content div").textContent = ANKET_DATA.name;
    // show mail_address
    document.querySelector("#screen002 #mail_address_container .card-content div").textContent = ANKET_DATA.mail_address;
    // show holiday
    document.querySelector("#screen002 #holiday_container .card-content div").textContent = ANKET_DATA.holiday;
    // show score
    document.querySelector("#screen002 #score_container .card-content div").textContent = ANKET_DATA.score;
    // show play_time
    document.querySelector("#screen002 #play_time_container .card-content div").textContent = ANKET_DATA.play_time;
    // show participation
    document.querySelector("#screen002 #participation_container .card-content div").textContent = ANKET_DATA.participation;
    // show position
    document.querySelector("#screen002 #position_container .card-content div").textContent = ANKET_DATA.position + "  " + ANKET_DATA.position_others;
    // show play_style
    document.querySelector("#screen002 #play_style_container .card-content div").textContent = ANKET_DATA.play_style;

    // show screen001
    document.querySelector("#screen002 .nav_footer .btn01").addEventListener("click", screen002_btn01_action);
    // show screen003
    document.querySelector("#screen002 .nav_footer .btn02").addEventListener("click", screen002_btn02_action);
  }

  screen002_btn01_action = function() {
    showScreen001AndRegisterEvents();
  }

  screen002_btn02_action = function() {
    // 画面すべてのエラークリアします。
    screen002_clear_error_messages();
    // 確定ボタンを disable
    screen002_btn02_disable();
    // 入力ボタンを disable
    screen002_btn01_disable();

    // send mail & save to DB
    axios.post("/QR/ANKET-REGIST", ANKET_DATA).then(function(result) {
      var response = result.data;
      if(response.global_status == "OK") {
        showScreen003(response.userinfo.registration_date, response.userinfo.registration_time, response.userinfo.reservation_url);
      } else {
        document.querySelector("#screen002 #mail_address_container .error-msg").textContent = response.mail_address;

        if(response.extra_error != "") {
          document.querySelector("#screen002 .nav_footer.server-error").style.display = "block";
          document.querySelector("#screen002 .nav_footer.server-error marquee").textContent = response.extra_error;
        } else {
          document.querySelector("#screen002 .nav_footer.server-error").style.display = "none";
        }

        // 確定ボタンを enable
        screen002_btn02_enable();
        // 入力ボタンを enable
        screen002_btn01_enable();
      }
    }).catch(function(error) {
      document.querySelector("#screen002 .nav_footer.server-error").style.display = "block";
      document.querySelector("#screen002 .nav_footer.server-error marquee").textContent = error.message;

      // 確定ボタンを enable
      screen002_btn02_enable();
      // 入力ボタンを enable
      screen002_btn01_enable();

    });
  }

  screen002_btn01_enable = function() {
    document.querySelector("#screen002 .btn01").removeAttribute("disabled");
  }

  screen002_btn02_enable = function() {
    document.querySelector("#screen002 .btn02").removeAttribute("disabled");
  }

  screen002_btn01_disable = function() {
    document.querySelector("#screen002 .btn01").setAttribute("disabled", "disabled");
  }

  screen002_btn02_disable = function() {
    document.querySelector("#screen002 .btn02").setAttribute("disabled", "disabled");
  }

  screen002_clear_error_messages = function() {
    document.querySelector("#screen002 #mail_address_container .error-msg").textContent = "";
    document.querySelector("#screen002 .nav_footer.server-error").style.display = "none";    
  }

  showScreen003 = function(registration_date, registration_time, reservation_url) {
    document.querySelector("#screen002").style.display = "none";
    document.querySelector("#screen003").style.display = "block";
    document.querySelector("#screen003 #complete_container .card-content .white-space-pre #registration_date").textContent = registration_date;
    document.querySelector("#screen003 #complete_container .card-content .white-space-pre #registration_time").textContent = registration_time;
    document.querySelector("#screen003 #complete_container .card-content .white-space-pre #reservation_url").innerHTML = '<a href="' + reservation_url + '" target="_blank">予約</a>'
  }

  dump_in_console_from_memory = function() {
    console.log(ANKET_DATA);
  }
  
  // public functions
  return {
    init: function() {
      showScreen001AndRegisterEvents();
    }
  }
})();

document.addEventListener('DOMContentLoaded', ready);
function ready() {
  // show First Screen Only
  SPA.init();
}

/*
if (window.readyState !== "loading") {
  ready();
} else {
  window.addEventListener("DOMContentLoaded", ready);
}
*/