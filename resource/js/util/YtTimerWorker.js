let timer = null;

self.onmessage = function(e) {
    if (e.data === 'start') {
        // 중복 실행 방지
        if (timer) clearInterval(timer);
        
        // 100ms(0.1초) 간격으로 메인 스레드에 신호 전달
        timer = setInterval(() => self.postMessage('tick'), 100);
    } else if (e.data === 'stop') {
        clearInterval(timer);
        timer = null;
    }
};