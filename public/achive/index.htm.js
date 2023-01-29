snipe("#inner_4_1").reset(
    $("fieldset").add(
        $("legend", "$<<Version Selector"),
        $("h3", "$<<어느 버전의 문서를 보시겠습니까?"),
        $("ul").add(
            $("li").add(
                $("a", "$<<1.0.0", "href<<javascript:loading('achive/1/index')"),
                $("a", "$<<2.0.0", "href<<javascript:loading('achive/1/index')"),
                $("a", "$<<3.0.0", "href<<javascript:loading('achive/1/index')"),
            )
        )
    ),
)
