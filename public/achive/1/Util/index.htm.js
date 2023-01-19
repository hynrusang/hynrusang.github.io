snipe("#inner_4_1").reset(
    $("h3", "style<<color:gold;", "$<<Program Package에 오신 것을 환영합니다."),
    $("p", "$<<원하시는 프로그램 패키지를 선택해주세요."),
    $("hr"),
    $("ul").add(
        $("li").add(
            $("a", "$<<l. c package", "style<<color:gold", "href<<javascript:loading('achive/1/Util/c')")
        ),
        $("li").add(
            $("a", "$<<ll. c++ package", "style<<color:darkred")
        ),
        $("li").add(
            $("a", "$<<lll. java package", "style<<color:gold", "href<<javascript:loading('achive/1/Util/java')")
        ),
        $("li").add(
            $("a", "$<<lV. python package", "style<<color:darkred")
        ),
        $("li").add(
            $("a", "$<<V. javascript module", "style<<color:darkred")
        ),
        $("li").add(
            $("a", "$<<Vl. rust module", "style<<color:darkred")
        )
    ),
    $("a", "$<<Necronomicon으로 돌아가기.", "href<<javascript:loading('achive/index')")
)
