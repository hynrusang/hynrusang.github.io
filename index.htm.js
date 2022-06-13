const $wid = $("div", ["img", "span"])
const $script = ["Effect/js/background.js", "Effect/js/calculater.js", "Effect/js/statistics.js", "Effect/js/swip.js", "Effect/js/clock.js", "Effect/js/position.js", "Effect/js/hyperlink.js", "Effect/js/youtube.js", "Effect/js/special.js"]
$("body", [
    $("main", [
        $("nav::top-1&&widget", $wid.$(6, [
            0, ["favicon.ico", "https://www.google.com/s2/favicons?domain=https://youtube.com/", "Effect/img/icon-save.png", "Effect/img/icon-igo.png", "Effect/img/icon-special.png", "Effect/img/icon-infor.png"],
            1, ["사이트 메인", "유튜브 재생목록 플레이어", "통계량 저장기", "스마트 계산기", "특수문서 열람하기", "도움말"]
        ])).$(),
        $("article#top-1", [
            $("section::top-1-nowselect", [
                $("nav", $wid.$(6, [
                    ["onclick<<window.open('https://google.com/')", "onclick<<if(window.innerWidth>450){window.open('https://www.naver.com/')}else{window.open('https://m.naver.com')}", "onclick<<window.open('https://www.daum.net/')", "onclick<<window.open('https://duckduckgo.com/')", "onclick<<window.open('https://youtube.com/')", "onclick<<window.open('https://twitch.tv/')"],
                    0, ["https://www.google.com/s2/favicons?domain=https://google.com/", "https://www.google.com/s2/favicons?domain=https://www.naver.com/", "https://www.google.com/s2/favicons?domain=https://m.daum.net/", "https://www.google.com/s2/favicons?domain=https://duckduckgo.com/", "https://www.google.com/s2/favicons?domain=https://youtube.com/", "https://www.google.com/s2/favicons?domain=https://twitch.tv/"],
                ])).$(),
                $("div::clock", [
                    $("div").$(3, [
                        ["::hour_pin", "::minute_pin", "::second_pin"]
                    ]),
                ]).$(),
                "h1#time",
                $("h1$title<<바탕화면에 드래그하시면 사이트 바로가기가 생성됩니다. (Microsoft Edge)", ["a$necronomicon&&href<<https://hynrusang.github.io/ &&style<<background-image: url('favicon.ico');background-size: 25px;background-position: left center;background-repeat: no-repeat;padding-left: 25px;color: cyan;"]).$(),
                $("div$style<<position:relative;left:calc(50% - 44px);", ["img$https://jigsaw.w3.org/css-validator/images/vcss-blue &&style<<border:0;width:88px;height:31px;cursor:pointer&&onclick<<window.open('https://jigsaw.w3.org/css-validator/validator?uri=https%3A%2F%2Fhynrusang.github.io')"]).$(),
                $("fieldset#versionChange", [
                    $("legend", ["img$favicon.ico&&style<<width:auto;height:25px", "span$css version"]).$(),
                    "input$number&&style<<background-image:url(favicon.ico)&&min<<0&&max<<2&&value<<0&&onchange<<versGet(this.value)"
                ]).$(),
                $("form#hyperlink-input", ["input$text&&style<<background-image:url(Effect/img/icon-favorite.png)&&placeholder<<메모 또는 링크&&required"]).$(),
                "ul#hyperlink"
            ]).$(),
            $("section::hide", [
                $("nav::top-2&&widget", $wid.$(2, [
                    0, ["Effect/img/icon-save.png", "https://www.google.com/s2/favicons?domain=https://youtube.com/"],
                    1, ["유튜브 재생목록 저장기", "유튜브 재생목록 플레이어"]
                ])).$(),
                $("article#top-2", [
                    $("section::top-2-nowselect", [
                        $("form#videosubmit", [$("fieldset", [
                            "legend$유튜브 재생목록 모음으로 쓸 이름을 입력해주세요.",
                            "input$text&&placeholder<<Ex) &&style<<background-image: url(https://www.google.com/s2/favicons?domain=https://youtube.com/)",
                        ]).$(),
                            "div#videolist"
                        ]).$()
                    ]).$(),
                    $("section#video::hide", ["iframe$style<<width: 100%; height: 100%;&&allowfullscreen"]).$()
                ]).$()
            ]).$(),
            $("section::hide", [
                $("form#statisticssave", [$("fieldset", [
                    "legend$저장할 통계의 이름을 입력해주세요.<br />스마트계산기의 (statistics)가 붙은 계산에 쓰입니다.",
                    "input$text&&placeholder<<저장할 통계의 이름(뛰어쓰기 금지)&&style<<background-image: url(Effect/img/icon-save.png)"
                ]).$()
                ]).$(),
                "div#statisticslist"
            ]).$(),
            $("section::hide", [
                $("table$border<<1", [
                    $("tr$style<<height: 120px;", ["td$여기에 계산값이 출력됩니다.#calcout"]).$(),
                    $("tr", ["td$onclick<<calculator(this)"]).$(4, [
                        0, ["a번 중 b번 이상 c%인 확률이 뜰 확률", "a%인 확률이 b% 확률이 될 최소횟수", "(statistics)통계의 평균, 분산, 표준편차 구하기", "(statistics)통계의 다음 값이 a 이상이 될 확률"]
                    ])
                ]).$()
            ]).$(),
            $("section#secret::hide", [
                $("form#osschecker", ["input$text&&style<<background-image:url('Effect/img/icon-setting.png');&&placeholder<<특수문서키 (띄어쓰기로 구분)"]).$()
            ]).$()
        ]).$()
    ]).$(),
    $("footer", [
        "input$button&&value<<배경 바꾸기&&onclick<<backgroundChange()",
        $("div$style<<cursor:pointer#position", ["img$Effect/img/icon-special.png", "span$lock"]).$()
    ]).$(),
    $("script").$($script.length, [
        $script
    ]),
    "div::oss",
])
