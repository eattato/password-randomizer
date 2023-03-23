// 랜덤 함수들
function cyrb128(str) {
  let h1 = 1779033703,
    h2 = 3144134277,
    h3 = 1013904242,
    h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [
    (h1 ^ h2 ^ h3 ^ h4) >>> 0,
    (h2 ^ h1) >>> 0,
    (h3 ^ h1) >>> 0,
    (h4 ^ h1) >>> 0,
  ];
}

function sfc32(a, b, c, d) {
  return function () {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    var t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

function getRand(seed) {
  seed = cyrb128(seed);
  return sfc32(seed[0], seed[1], seed[2], seed[3]);
}

function randRange(rand, start, end) {
  return Math.floor(rand() * (end - start + 1) + start);
}

function swapStr(str, first, last) {
  var arr = str.split("");
  let temp = arr[first];
  arr[first] = arr[last];
  arr[last] = temp;
  return arr.join("");
}

// 메인
$().ready(() => {
  let inputs = {
    url: $("#url"),
    pw: $("#pw"),
    len: $("#length"),
    special: $("#special"),
  };
  let output = $("#output");
  let sumbit = $("#submit");

  let config = {
    pw: "",
    len: 12,
    special: "~!@#$%^&*",
  };

  const save = (data) => {
    chrome.storage.local.set(data);
  };

  chrome.storage.local.get(["pw", "len", "special"]).then((res) => {
    let data = config;
    if (res.pw != null) {
      data = res;
    } else {
      save(config);
    }

    // 주소 가지고 오기
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      let location = tabs[0].url;
      location = location.split("/")[2];
      inputs.url.val(location);
    });

    // 입력 칸에 로드된 데이터 입력 및 change 이벤트 바인딩
    for (let key in inputs) {
      let input = inputs[key];
      input.val(data[key]);

      if (key != "special") {
        let inputSave = input.val();
        input.on("input", () => {
          let numError = input.hasClass("num") && isNaN(input.val());
          if (input.val().length == 0 || numError) {
            input.addClass("error");
          } else {
            input.removeClass("error");
            inputSave = input.val();
          }

          if (numError) {
            if (input.val().length == 0) {
              inputSave = "0";
              input.val("0");
            } else {
              input.val(inputSave);
            }
          }
        });
      }
    }
  });

  sumbit.click(() => {
    let error = false;
    for (let key in inputs) {
      let input = inputs[key];
      if (input.hasClass("error")) {
        error = true;
        break;
      }
    }

    if (!error) {
      // 입력값 저장
      let data = {};
      for (let key in inputs) {
        if (key != "url") {
          data[key] = inputs[key].val();
        }
      }
      save(data);

      // 데이터 가져오기
      let rand = getRand(inputs.url.val());
      let pw = inputs.pw.val();
      let length = Number(inputs.len.val());

      // 길이 부족하면 늘리기
      let filler = length - pw.length;
      if (filler > 0) {
        for (let i = 1; i <= filler; i++) {
          pw += pw.charAt(randRange(rand, 0, pw.length - 1));
        }
      }

      // 글자 위치 바꿔치기
      let pos = [];
      for (let i = 0; i < pw.length; i++) {
        pos.push(i);
      }
      while (pos.length > 1) {
        let swap = [];
        for (let i = 1; i <= 2; i++) {
          let sInd = randRange(rand, 0, pos.length - 1);
          swap.push(pos[sInd]);
          pos.splice(sInd, 1);
        }
        pw = swapStr(pw, swap[0], swap[1]);
      }

      output.val(pw);
    }
  });
});
