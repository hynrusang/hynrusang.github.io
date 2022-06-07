const CLOCK = setInterval(function () {
    const DATA = new Date();
    const MINUTE = String(DATA.getMinutes()).padStart(2, "0");
    const SECOND = String(DATA.getSeconds()).padStart(2, "0");
    try {
        $set($scan("#time"), `${DATA.getFullYear()}년 ${DATA.getMonth() + 1}월 ${DATA.getDate()}일 <br> ${(DATA.getHours() <= 12) ? `오전 ${String(DATA.getHours()).padStart(2, "0")}` : `오후 ${String(DATA.getHours() - 12).padStart(2, "0")}`}시 ${MINUTE}분 ${SECOND}초.`)
        $set($scan(".hour_pin"), `style<<transform:rotate(${DATA.getHours() * 30}deg)`)
        $set($scan(".minute_pin"), `style<<transform:rotate(${MINUTE * 6}deg)`)
        $set($scan(".second_pin"), `style<<transform:rotate(${SECOND * 6}deg)`)
    } catch (e) {
        clearInterval(CLOCK)
    }
}, 1000);
