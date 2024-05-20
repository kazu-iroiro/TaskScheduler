const DICT_PATH = "./dict";

// Web Speech APIにブラウザが対応しているか
if (!("speechSynthesis" in window)) {
    console.log("このブラウザには対応していません")
}

// Execute loadVoices.
loadVoices();

// 音声のリストを取得
function loadVoices() {
    let voices = speechSynthesis.getVoices();
    $("#voice-names").empty();
    voices.forEach(function (voice, i) {
        const $option = $("<option>");
        try {
            $option.val(voice.name);
            $option.text(voice.name + " (" + voice.lang + ")");

            $option.prop("selected", voice.name === "Google 日本語");
        } catch (e) { }
        $("#voice-names").append($option);
    });
}

// Chrome loads voices asynchronously.
window.speechSynthesis.onvoiceschanged = function (e) {
    loadVoices();
};

const uttr = new SpeechSynthesisUtterance();

// Set up an event listener for when the 'speak' button is clicked.
// Create a new utterance for the specified text and add it to the queue.
$("#speak-btn").click(async function () {
    uttr.text = $("#speech_text").val();
    uttr.rate = parseFloat(1.25);
    // If a voice has been selected, find the voice and set the
    // utterance instance's voice attribute.
    if ($("#voice-names").val()) {
        uttr.voice = speechSynthesis
            .getVoices()
            .filter(voice => voice.name == $("#voice-names").val())[0];
    }
    speechSynthesis.speak(uttr);
    uttr.onend = async function () {
        console.log("お話しください");
        await rec_voice();
    };
});

$("#submit_button").click(async function () {

    console.log("データを取得します");
    text_data = $("#text_box").val();
    if (text_data != "") {
        await kuromoji_kaiseki(text_data);
    }
    $("#text_box").val('');
});

window.onload = async function () {
    display_data();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('serviceWorker.js')
            .then(
                function (registration) {
                    if (typeof registration.update == 'function') {
                        registration.update();
                    }
                })
            .catch(function (error) {
                console.log("Error Log: " + error);
            });
    }
}

async function rec_voice() {
    const ids = [];
    const names = [];

    const SpeechRecognition_common = window.webkitSpeechRecognition || window.SpeechRecognition;

    const recognition = new SpeechRecognition_common();

    try {
        // 日本語の数字を単語として登録する
        const grammar =
            '#JSGF V1.0 JIS ja; grammar numbers; public <numbers> =  10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100 ;';
        const SpeechGrammarList =
            window.webkitSpeechGrammarList || window.SpeechGrammarList;
        const speechRecognitionList = new SpeechGrammarList();

        speechRecognitionList.addFromString(grammar, 1);
        recognition.grammars = speechRecognitionList;
    } catch (e) { }

    recognition.continuous = false;
    recognition.lang = 'ja-JP';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;




    recognition.onresult = async (event) => {
        recognition.abort();
        text_data = await suuji(event.results[0][0].transcript);
        console.log(text_data);

        await kuromoji_kaiseki(text_data);
    }

    recognition.start();
}

async function display_data() {
    var data = "";
    const collection = Object.keys(localStorage).sort().map(key => {

        var data_tmp = localStorage.getItem(key);
        data = data + '<div class="data_deco" id="' + key + '">' + '<div class="date_deco">' + key + '</div>' + data_tmp + '</div>';

    });
    let element = document.getElementById('display_data');
    element.innerHTML = '<h3>' + data + '</h3>';

    const closeIcons = document.querySelectorAll('.close-icon');
    const items = document.querySelectorAll('.item');

    // 「X」をクリックしたときの処理
    for (let j = 0; j < closeIcons.length; j++) {
        closeIcons[j].addEventListener('click', async () => {
            console.log(items[j].id);
            console.log(items[j]);


            var edit_tmp = String(localStorage.getItem(items[j].id));
            var replace_text = String(items[j].outerHTML + '<span class="close-icon">X</span><br>');
            console.log(replace_text);
            edit_tmp = edit_tmp.replace(replace_text, '');
            console.log(edit_tmp);





            if (edit_tmp == "") {
                document.getElementById(String(items[j].id)).classList.add("data_deco_box_after");
                localStorage.removeItem(items[j].id);
            } else {
                items[j].classList.add("data_deco_after");
                document.getElementById(String(items[j].id)).classList.add("data_deco_box_resize");
                localStorage.setItem(items[j].id, edit_tmp);
            }



            const sleep = waitTime => new Promise(resolve => setTimeout(resolve, waitTime));

            await sleep(300);

            items[j].remove();
            closeIcons[j].remove();
            console.log(j);

            display_data();
        });
    }


    // for (key in localStorage) {
    //    if (localStorage.hasOwnProperty(key)) {
    //        var data_tmp = localStorage.getItem(key);
    //        data = data + key + '<br>' + data_tmp + '<br>';
    //    }
    // }

}

async function save_data(date, text_data) {
    var saved_data = null;
    if (localStorage.getItem(date)) {
        saved_data = localStorage.getItem(date);
    } else {
        saved_data = ""
    }
    try{
    localStorage.setItem(date, saved_data + '<span class="item" id="' + date + '">' + text_data + '</span><span class="close-icon">X</span><br>');
    }catch(e){
        alert("容量オーバーです。保存できませんでした。")
    }
}

async function kuromoji_kaiseki(text_data) {
    var today = new Date();

    var rearranged_text_data = "";
    var data_date = null;


    // kuromojiが対応していない日付部分の切り離し(精度が悪くなるため対応している日付語はスルー)

    var year = "";
    var month = "";
    var day = "";

    check_year = text_data.indexOf('年');
    if (check_year != -1) {
        if (text_data.search(/[0-9]/) + 3 == check_year || text_data.search(/[0-9]/) + 4 == check_year) {
            year = text_data.substring(text_data.search(/[0-9]/), check_year);
            text_data = text_data.replace(year + "年", "");
            today.setFullYear(year);
        }
    }
    check_month = text_data.indexOf('月');
    if (check_month != -1) {
        if (text_data.search(/[0-9]/) + 1 == check_month || text_data.search(/[0-9]/) + 2 == check_month) {
            month = text_data.substring(text_data.search(/[0-9]/), check_month);
            text_data = text_data.replace(month + "月", "");
            today.setMonth(month - 1);
        }
    }
    check_day = text_data.indexOf('日');
    if (check_month != -1) {
        if (text_data.search(/[0-9]/) + 1 == check_day || text_data.search(/[0-9]/) + 2 == check_day) {
            day = text_data.substring(text_data.search(/[0-9]/), check_day);
            text_data = text_data.replace(day + "日", "");
            today.setDate(day);
        }
    }
    // 年/月/日のいずれかが存在する場合はdata_dateを設定
    if (year != "" || month != "" || day != "") {
        data_date = String(today.toLocaleDateString("ja-JP", {
            year: "numeric", month: "2-digit",
            day: "2-digit"
        }));
    }

    console.log(year);
    console.log(month);
    console.log(day);

    await kuromoji.builder({ dicPath: DICT_PATH }).build(async (err, tokenizer) => {
        const tokens = await tokenizer.tokenize(text_data);// 解析データの取得
        tokens.forEach(async (token) => {// 解析結果を順番に取得する
            console.log(token);
            console.log(token.surface_form);
            if (String(token.surface_form) == "一昨々日" || String(token.surface_form) == "一昨昨日" || String(token.surface_form) == "さきおととい" || text_data.match(/1昨昨日/)) {
                date_flag = token.word_position;

                today.setDate(today.getDate() - 3);

                data_date = String(today.toLocaleDateString("ja-JP", {
                    year: "numeric", month: "2-digit",
                    day: "2-digit"
                }));

                try {
                    text_data = text_data.replace("1昨昨日", "");
                } catch (e) { }

                console.log("date");
            } else if (String(token.surface_form) == "おととい" || String(token.surface_form) == "一昨日" || text_data.match(/1昨日/)) {
                date_flag = token.word_position;

                today.setDate(today.getDate() - 2);

                data_date = String(today.toLocaleDateString("ja-JP", {
                    year: "numeric", month: "2-digit",
                    day: "2-digit"
                }));

                try {
                    text_data = text_data.replace("1昨日", "");
                } catch (e) { }

                console.log("date");
            } else if (String(token.surface_form) == "昨日") {
                date_flag = token.word_position;

                today.setDate(today.getDate() - 1);

                data_date = String(today.toLocaleDateString("ja-JP", {
                    year: "numeric", month: "2-digit",
                    day: "2-digit"
                }));

                console.log("date");
            } else if (String(token.surface_form) == "今日") {
                date_flag = token.word_position;

                today.setDate(today.getDate() - 0);

                data_date = String(today.toLocaleDateString("ja-JP", {
                    year: "numeric", month: "2-digit",
                    day: "2-digit"
                }));

                console.log("date");
            } else if (String(token.surface_form) == "明日") {
                date_flag = token.word_position;

                today.setDate(today.getDate() + 1);

                data_date = String(today.toLocaleDateString("ja-JP", {
                    year: "numeric", month: "2-digit",
                    day: "2-digit"
                }));

                console.log("date");
            } else if (String(token.surface_form) == "明後日") {
                date_flag = token.word_position;

                today.setDate(today.getDate() + 2);

                data_date = String(today.toLocaleDateString("ja-JP", {
                    year: "numeric", month: "2-digit",
                    day: "2-digit"
                }));

                console.log("date");
            } else if (String(token.surface_form) == "明々後日" || String(token.surface_form) == "明明後日" || text_data.match(/明々後日/)) {
                date_flag = token.word_position;

                today.setDate(today.getDate() + 3);

                data_date = String(today.toLocaleDateString("ja-JP", {
                    year: "numeric", month: "2-digit",
                    day: "2-digit"
                }));

                try {
                    text_data = text_data.replace("明々後日", "");
                } catch (e) { }

                console.log("date");
            } else if (String(token.surface_form) != "*" && String(token.pos) == "名詞" || String(token.pos) == "動詞" || String(token.pos) == "副詞" || String(token.pos) == "形容詞" || String(token.pos) == "感動詞" || String(token.pos_detail_1) == "終助詞" || String(token.pos_detail_1) == "接続助詞") {
                rearranged_text_data = rearranged_text_data + token.surface_form;
            }
        });
        if (data_date == null) {
            data_date = "メモ"
        }
        save_data(data_date, rearranged_text_data);
        display_data();
    });
}

// I get this program from Qiita! (https://qiita.com/t-yama-3/items/9819600cec53723472d3) Thank you!
async function suuji(text_data) {
    //定数の設定
    const suuji1 = new Set('一二三四五六七八九十百千１２３４５６７８９123456789');  // 数字と判定する文字集合
    const suuji2 = new Set('〇万億兆０0,');  // 直前の文字が数字の場合に数字と判定する文字集合
    const kans = '〇一二三四五六七八九';
    const nums = '０１２３４５６７８９';
    const tais1 = '千百十';  // 大数1
    const tais2 = '兆億万';  // 大数2

    // ●関数(1) '五六七八'または'５６７８'(全角)を'5678'(半角)に単純変換する関数
    function Kan2Num(str) {
        let tmp;  // 定数kansまたはnumsを1文字ずつ格納する変数
        for (let i = 0; i < kans.length; i++) {
            tmp = new RegExp(kans[i], "g");  // RegExpオブジェクトを使用（該当文字を全て変換するため）
            str = str.replace(tmp, i);  // replaceメソッドで変換
        }
        for (let i = 0; i < nums.length; i++) {
            tmp = new RegExp(nums[i], "g");  // RegExpオブジェクトを使用（該当文字を全て変換するため）
            str = str.replace(tmp, i);  // replaceメソッドで変換
        }
        return str;
    }

    // ●関数(2) '九億八千七百六十五万四千三百'を'987654300'に変換する関数（n=1: ４桁まで計算、n=4: 16桁まで計算）
    function Kan2NumCnv(str, n) {
        // 変数の宣言（[let ans = poss = 0, pos, block, tais, tmpstr;]とまとめても良い）
        let ans = 0;  // 計算結果を格納する変数（数値型）
        let poss = 0;  // 引数strにおける処理開始位置（数値型）
        let pos;  // 引数strにおける大数（'十','百','千','万'など）の検索結果位置（数値型）
        let block;  // 各桁の数値を格納する変数（数値型）
        let tais;  // 大数を格納（文字列型）
        let tmpstr;  // 引数strの処理対象部分を一時格納する変数（文字列型）

        if (n === 1) {  // n == 1 の場合は４桁まで計算
            tais = tais1;
        } else {  // n == 4 (n != 1) の場合は16桁まで計算（16桁では誤差が生じる）
            n = 4;
            tais = tais2;
        }

        for (let i = 0; i < tais.length; i++) {
            pos = str.indexOf(tais[i]);  // indexOf関数は文字の検索位置を返す
            if (pos === -1) {  // 検索した大数が存在しない場合
                continue;  // 何もしないで次のループに
            } else if (pos === poss) {  // 検索した大数が数字を持たない場合（'千'など）
                block = 1;  // '千'は'一千'なので'1'を入れておく
            } else {  // 検索した大数が数字を持つ場合（'五千'など）
                tmpstr = str.slice(poss, pos);  // sliceメソッドは文字列の指定範囲を抽出する
                if (n === 1) {
                    block = Number(Kan2Num(tmpstr));  // 1桁の数字を単純変換（上で作成したKan2Num関数を使用）
                } else {
                    block = Kan2NumCnv(tmpstr, 1);  // 4桁の数字を変換（本関数を再帰的に使用）
                }
            }
            ans += block * (10 ** (n * (tais.length - i)));  // ans に演算結果を加算
            poss = pos + 1;  // 処理開始位置を次の文字に移す
        }

        // 最後の桁は別途計算して加算
        if (poss !== str.length) {
            tmpstr = str.slice(poss, str.length);
            if (n === 1) {
                ans += Number(Kan2Num(tmpstr));
            } else {
                ans += Kan2NumCnv(tmpstr, 1);
            }
        }
        return ans;
    }

    // ●関数(3) '平成三十一年十二月三十日'を'平成31年12月30日'に変換
    function TextKan2Num(text) {
        let ans = '';  // 変換結果を格納する変数（文字列型）
        let tmpstr = '';  // 文字列中の数字部分を一時格納する変数（文字列型）
        for (let i = 0; i < text.length + 1; i++) {
            // 次のif文で文字が数字であるかを識別（Setオブジェクトのhasメソッドで判定）
            if (i !== text.length && (suuji1.has(text[i]) || (tmpstr !== '' && suuji2.has(text[i])))) {
                tmpstr += text[i]; // 数字が続く限りtmpstrに格納
            } else {  // 文字が数字でない場合
                if (tmpstr !== '') {  // tmpstrに数字が格納されている場合
                    ans += Kan2NumCnv(tmpstr, 4);  // 上で作成したKan2NumCnv関数で数字に変換してansに結合
                    tmpstr = '';  // tmpstrを初期化
                }
                if (i !== text.length) {  // 最後のループでない場合
                    ans += text[i];  // 数字でない文字はそのまま結合
                }
            }
        }
        return ans;
    }

    return TextKan2Num(text_data);
}