const $wid = [$("div", ["img", "span"]), $("td$onclick<<calculator(this)")]
const $script = ["Effect/js/background.js", "Effect/js/calculater.js", "Effect/js/swip.js", "Effect/js/clock.js", "Effect/js/position.js", "Effect/js/hyperlink.js", "Effect/js/youtube.js", "Effect/js/special.js"]
$("body", [
    $("main", [
        $("nav::top-1&&widget", $wid[0].$(5, [
            0, ["favicon.ico", "https://www.google.com/s2/favicons?domain=https://youtube.com/", "Effect/img/icon-igo.png", "Effect/img/icon-special.png", "Effect/img/icon-infor.png"],
            1, ["사이트 메인", "유튜브 재생목록 플레이어", "스마트 계산기", "특수문서 열람하기", "도움말"]
        ])).$(),
        $("article#top-1", [
            $("section::top-1-nowselect", [
                $("nav", $wid[0].$(6, [
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
                "ul#hyperlink::option"
            ]).$(),
            $("section::hide", [
                $("nav::top-2&&widget", $wid[0].$(6, [
                    0, ["Effect/img/icon-save.png", 0, 0, 0, 0, 0]
                ])).$(),
                $("article#top-2", $("section", [
                    $("form::youtube", [
                        $("fieldset", [
                            $("legend$유튜브 재생목록 링크").$(),
                            "input$text&&style<<background-image:url(https://www.google.com/s2/favicons?domain=https://youtube.com/)&&placeholder<<Ex) https://www.youtube.com/watch?..."
                        ]).$()
                    ]).$(),
                    "iframe$&&allowfullscreen"
                ]).$(6, [
                    ["::top-2-nowselect", "::hide", 1, 1, 1, 1]
                ])
                ).$()
            ]).$(),
            $("section::hide", [
                $("table$border<<1", [
                    $("tr", ["td$colspan<<7"]).$(),
                    $("tr", $("td").$(2, [
                        ["colspan<<5", "계산&&colspan<<2&&onclick<<calculate(this)"],
                    ])).$(),
                    $("tr", $wid[1].$(7, [
                        ["7", "8", "9", "(", ")", "C", "AC"]
                    ])).$(),
                    $("tr", $wid[1].$(7, [
                        ["4", "5", "6", "+", "-", "×", "/"]
                    ])).$(),
                    $("tr", $wid[1].$(7, [
                        ["1", "2", "3", ".", "a<sup>x</sup>", "P(a,b)", "C(a,b)"]
                    ])).$(),
                    $("tr", $wid[1].$(7, [
                        ["π", "0", "e", "Fac(x)", "Sin(x)", "Cos(x)", "Tan(x)"]
                    ])).$(),
                    $("tr", $wid[1].$(3, [
                        ["Per/a/b/c<br />a번 중 b번 이상 c%인 확률이 걸릴 확률&&colspan<<3", "확률계산", "Con/c<br />c%인 확률을 95%로 확정짓는 횟수 n&&colspan<<3"],
                    ])).$()
                ]).$()
            ]).$(),
            $("section::hide&&secret", [
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