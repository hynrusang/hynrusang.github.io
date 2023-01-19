const CLOCK = setInterval(function () {
    const DATA = new Date();
    const MINUTE = String(DATA.getMinutes()).padStart(2, "0");
    const SECOND = String(DATA.getSeconds()).padStart(2, "0");
    try {
        snipe("#time").set(`$<<${DATA.getFullYear()}년 ${DATA.getMonth() + 1}월 ${DATA.getDate()}일 <br> ${(DATA.getHours() <= 12) ? `오전 ${String(DATA.getHours()).padStart(2, "0")}` : `오후 ${String(DATA.getHours() - 12).padStart(2, "0")}`}시 ${MINUTE}분 ${SECOND}초.`);
        snipe(".hour_pin").set(`style<<transform:rotate(${DATA.getHours() * 30}deg)`)
        snipe(".minute_pin").set(`style<<transform:rotate(${MINUTE * 6}deg)`)
        snipe(".second_pin").set(`style<<transform:rotate(${SECOND * 6}deg)`)
    } catch (e) {
        clearInterval(CLOCK)
    }
}, 1000);
