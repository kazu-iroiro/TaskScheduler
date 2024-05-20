window.onload = async function() {
    check_num = await env_check();
    if (check_num >= 5) {
        document.getElementById("All_result").innerHTML = "問題ありません";
    } else if (check_num == 3) {
        document.getElementById("All_result").innerHTML = "音声認識使用不可";
    } else if (check_num == 2) {
        document.getElementById("All_result").innerHTML = "インストールをおすすめします";
    } else {
    }
}

function env_check() {
    var check_num = 0;
    document.getElementById("JavaScript_result").innerHTML = "JavaScript:OK";

    if ("speechSynthesis" in window) {
        document.getElementById("WebSpeechAPI_result").innerHTML = "WebSpeechAPI:OK";
        check_num += 2;
    }

    if (window.matchMedia('(display-mode: standalone)').matches) {
        document.getElementById("PWA_result").innerHTML = "Installed as PWA";
        check_num += 3;
    }

    return check_num;
}