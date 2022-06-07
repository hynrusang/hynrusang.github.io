[**Necronomicon**](https://hynrusang.github.io) 개요
======
# 사이트 설명서
## 사이트의 구성요소 및 기능
### 즐겨찾기
---
### 유튜브 재생목록 플레이어
---
### 계산기
---
### 기타
---
# 자바스크립트로 html을 빠르고 간편하게! Jh.js 라이브러리
  __해당 문서부터는 html, js 파일에 대한 전반적인 이해를 요구하므로,  
  가급적 개발자 분들만 봐 주시기를 부탁드리겠습니다.__  
## Jh.js 개요
### Jh(JsHtml)
  <img src="Effect/img/library_belief.png" style="width: 100%; height: auto">
  
```
  Jh는 자바스크립트로 Html과 Js를 동시에 다룰 수 있게 제작되었습니다.
  
  Jh는 기존의 Html로는 불가능했던, 요소의 style, id, class에 배열 등의 변수를 사용하는 기법을 사용할 수 있고,
  추가적인 페이지의 로딩 없이도 문서의 특정 요소를 새로고침할 수도 있으며,
  반복되는 Html 태그를 손쉽게 반복시켜 출력시킬 수도 있습니다. 
  (원한다면, 반복되는 태그마다 각각 attribute를 다르게 하여 출력시킬 수도 있습니다.)
```
---
### Jh.js 사용법
  우선 __Jh.js__ 를 사용할 __html__ 파일을 다음과 같은 형식으로 작성합니다.  
  (Body 내부요소는 작성하셔도 되고 안하셔도 됩니다.)
```
<!DOCTYPE html>
<html lang="ko">
<head>
    Head 요소
</head>
<body>
    <script src="https://hynrusang.github.io/Effect/js/jh.js">
    </script>
    추가 Body 요소 (있어도 되고 없어도 됨.)
</body>
</html>
```
  그 다음, 실질적인 body 요소가 될 요소들은 __index.htm.js__ 에 작성합니다.
```
$("body", [
    실질적인 Body 요소
])
```
  <img src="Effect/img/icon-warning.png" style="width: 20px; height: auto">(해당 __index.htm.js__ 파일 만큼은 반드시 해당 __html__ 파일과 같은 경로에 있어야 합니다.  
  파일 이름을 틀리지 않게 하세요.)  
  그럼, 본격적으로 __Jh.js__ 를 배워보기 전, 간단한 용어부터 정의하고 가겠습니다.  
  
---
### Jh.js 기본 용어설명
#### [{parameter}]
  해당 __{parameter}__ 에 []가 붙으면, 해당 __{parameter}__ 는 __배열__ 이라는 뜻입니다.  
  
---
#### dataString
  __dataString__ 은 __html 요소의 이름과 attribute, id, class__ 를 담고 있는 __데이터 문자열__ 을 의미합니다.  
  __dataString__ 의 구문은 다음과 같습니다. (""이나 ''대신, __템플릿 문자열__ (``)도 가능합니다.)  
  `"{htmlTag_NAME}${attribute1_NAME}<<{attribute1_VALUE}&&{attribute2_NAME}<<{attribute2_VALUE}...#{htmlTag_ID}::{htmlTag_CLASS1}&&{htmlTag_CLASS2}..."`  
  
  이때, __{attribute1_NAME}<<__ 은 생략이 가능한데, 이럴 경우, 자동으로 __attribute1_NANE__ 에 정해진 기본 속성명을 할당받습니다.  
  자동으로 할당받는 기본 속성명은 __htmlTag_NANE__ 에 따라 달라지는데,  
  이때, 달라지는 기본 속성명의 종류로는 다음과 같습니다.  
```
htmlTag_NAME: img, iframe, script -> attribute1_NANE = src

htmlTag_NAME: input -> attribute1_NANE = type

htmlTag_NAME: link -> attribute1_NANE = href

htmlTag_NAME: p, pre -> 자동으로 attribute1_VALUE가 innerText로 넘어감

htmlTag_NAME: 나머지 -> 자동으로 attribute1_VALUE가 innerHTML로 넘어감
```
  예를 들어, __style__ 로 __width: 80%;height: auto__ 를, __id__ 로 __userCheck__ 를, __type__ 로 __text__ 를 가지는 __input__ 을 의미하는 __dataString__ 은 다음과 같이 작성합니다.  
  `"input$text&&style<<width: 80%;height: auto#userCheck"` __or__ `"input$type<<text&&style<<width: 80%;height: auto#userCheck"`  
  
---
#### dataQuery
  __dataQuery__ 는 __dataString__ 에서 __attribute__ 를 지목하는 __$__ 부분이나, __id__ 를 의미하는 __#__, 또는 __class__ 를 의미하는 __::__ 부분을 의미합니다.  
  
  예를 들어 __attribute Query__ 는 __dataString__ 에서  
  __{attribute1_NAME}<<{attribute1_VALUE}&&{attribute2_NAME}<<{attribute2_VALUE}...__ 부분을 의미하고,  
  __id Query__ 는 __dataString__ 에서 __{htmlTag_ID}__ 부분을, (실제로는 잘 사용하지 않습니다.)  
  __class Query__ 는 __dataString__ 에서 __{htmlTag_CLASS1}&&{htmlTag_CLASS2}...__ 부분을 의미합니다.
  
---
### Jh.js 기초
  그럼 본격적으로 Jh.js를 시작해 보겠습니다.
  기본적으로 Jh.js에서는 다음과 같은 함수들을 제공합니다.  
  
#### $(parent, [child]).$()
  __$(parent, [child]).$()__ 는 __parent__ 안에 __[child]__ 의 요소들을 모두 __parent__ 안에 포함시켜서 __htmlObject__ 의 형식으로 반환시켜주는 함수입니다.  
  <img src="Effect/img/icon-warning.png" style="width: 20px; height: auto">__[child]__ 는 필수요소가 아닙니다.  
  
  이때, __parent__ 와 __child__ 각각에 들어갈 수 있는 형식들은 다음과 같습니다.  
  `dataString, htmlObject`  
  추가로, child에는 __[htmlObject]__ 도 들어갈 수 있습니다. (이는 처음에 말했던, __$("body", [child])__ 도 마찬가지입니다.)  
  
  예시로, 다음은 __class가 test__, __width:100%; height: 50vh__ 인, 각종 child 요소를 담고 있는 div 요소를 출력하는 예제입니다.  
```
$("div$style<<width: 100%; height: 50vh::test" //dataString, [
    $("form", [
        "input$text&&placeholder<<ID",
        "input$password&&style<<color: black;background: white",
        "input$submit&&value<<제출하기"
    ]).$(), //htmlObject
    "span$Test Form" //dataString
]).$()
```
  해당 코드의 출력값은 다음과 같습니다.  
```
<div class="test" style="width: 100%; height: 50vh">
    <form>
        <input type="text" placeholder="ID">
        <input type="password" style="color: black;background: white">
        <input type="submit" value="제출하기">
    </form>
    <span>Test Form</span>
</div>
```
---
#### $(parent, [child]).$(for, [dataSet])
  __$(parent, [child]).$(for, [dataSet])__ 은 __$(parent, [child]).$()__ 가 반환하는 __htmlObject__ 를 __for__ 의 개수만큼 복제시켜주는 함수입니다.  
  <img src="Effect/img/icon-warning.png" style="width: 20px; height: auto">__$(parent, [child]).$()__ 와는 다르게 __htmlObject__ 가 아닌, __[htmlObject]__ 를 반환합니다.
  
  이때, __[dataSet]__ 는 __dataString__ 처럼 특정한 구문이 있는 __데이터 배열__ 로,  
  __[dataSet]__ 의 구문은 다음과 같습니다.  
```
{childIndex1}, [dataString],
{childIndex2}, [dataString], ...
```
  이때, __childIndex__ 는 __[child]__ 내의 요소들의 __배열 내에서 차지하고 있는 index 값__ 이며,  
  만약 __[child]__ 내의 __첫번째 요소__ 를 지목하고 싶다면, __childIndex__ 에 0 (배열의 첫번째 요소의 index 값)을 대입하시면 됩니다.  
  
  __[dataSet]__ 역시, __dataString__ 처럼 __{childIndex1}__ 은 생략이 가능한데,  
  이럴 경우, 지목 대상이 __[child]의 내부 요소가 아닌, parent__ 를 지목하게 됩니다.  
  
  __childIndex__ 로 __parent__ 또는 __[child]__ 의 내부 요소를 지목하셨다면,  
  그 뒤에 붙는 __[dataString]__ 이 해당 지목 요소에 dataString을 for만큼 추가로 대입합니다.  
  
  <img src="Effect/img/icon-warning.png" style="width: 20px; height: auto">이때, __[dataString]__ 의 길이는 __반드시 for와 일치해야만 합니다.__  
  만약 __[dataString]__ 의 길이를 for보다 적게 잡아야 한다면, 나머지 __dataString__ 에 "" (빈 문자열)이라도 집어넣어 주세요.  
```
또한 [dataString]에 들어가는 dataString은 반드시 htmlTag_Name을 빼고 작성하며,
해당 dataString에 #, ::, $가 모두 없다면, 자동으로 dataSet은 dataString의 앞에 $를 붙인 후 반환합니다.
그리고, [dataString]에는 0이나 1같은 숫자(index)도 들어갈 수 있는데,
이럴 경우, dataSet은 자동으로 [dataString] 내의 index번 요소를 return 합니다.
```
  예를 들어, __p__ 요소를 담은 __div__ 요소를 4개 생성하고,  
  각각의 __div__ 요소의 style에 __color: red, color: blue, color: blue, color: blue__ 를,  
  각각의 __p__ 요소의 innerText에 __안녕하세요., 반갑습니다., 환영해요, 잘 부탁합니다.__ 를 주고 싶다면,  
```
const dataString = ["안녕하세요.", "반갑습니다.", "환영해요", "잘 부탁합니다."]
$("div", ["p"]).$(dataString.length, [
    ["style<<color: red", "style<<color: blue", 1, 1], // 각각의 dataString의 앞에 자동으로 $이 붙어서 반환됨.
    0, dataString // 각각의 dataString의 앞에 자동으로 $이 붙어서 반환됨.
])
```
  처럼 하시면 되며, 해당 코드가 반환하는 __[htmlObject]__ 는 다음과 같습니다.  
```
[
<div style="color: red">
    <p>안녕하세요.</p>
</div>,
<div style="color: blue">
    <p>반갑습니다.</p>
</div>,
<div style="color: blue">
    <p>환영해요</p>
</div>,
<div style="color: blue">
    <p>잘 부탁합니다.</p>
</div>
]
```
---
#### $scan(selector)
  __$scan(selector)__ 는 __document.querySelector()__ 나 __document.querySelectorAll()__ 을 반환하는 함수입니다.  
  __$scan(selector)__ 는 __selector__ 의 종류에 따라 다음과 같이 3종류로 분류됩니다.  
```
$scan("selector") == return document.querySelector("selector")
$scan(["selector"]) == return document.querySelectorAll("selector")
$scan(["selector", "index"]) == return document.querySelectorAll("selector")[index]
```
---
#### $reload(selector, [child])
  __$reload(selector, [child])__ 는 __$scan(selector)__ 가 반환하는 __htmlObject__ 의 내부요소를,  
  새롭게 __[child]__ 의 요소들로 교체시켜주는 함수입니다.  
  <img src="Effect/img/icon-warning.png" style="width: 20px; height: auto">기존의 __htmlObject__ 가 가지고 있던 내용은 모두 지워집니다.  
  
  예시로, 만약 __class__ 가 __textin__ 인 __htmlObject__ 를 다른 내용으로 대체하고 싶다면,  
  다음과 같이 사용하시면 됩니다.
```
$reload(".textin", [
    $("form", [
        "input$text&&placeholder<<ID",
        "input$password&&style<<color: black;background: white",
        "input$submit&&value<<제출하기"
    ]).$(), //htmlObject,
    "span$Test Form" //dataString
])
```
### Jh.js 고급
#### $set(obj, dataQuery, isAttribute=true)
  __$set(obj, dataQuery, isAttribute=true)__ 은, __obj__ 자리에 넣은 __htmlObject__ 에, __dataQuery__ 를 적용시켜 주는 함수입니다.  
  __dataQuery__ 는 __attribute Query__ 를 사용합니다.  
  
  또한, __attribute Query__ 말고도 __class Query__ 를 쓸 수도 있는데,  
  이럴 경우, __isAttribute__ 를 false로 지정한 후,  
  __dataQuery__ 에 __class Query__ 를 사용하면 됩니다.  
  
---
#### $read()
  __$read()__ 함수는 url에 전달된 ? 부분의 데이터를 __return__시켜주는 함수입니다.  
  예를 들어, 만약  url이 https://hynrusang.github.io/?test=test&test2=sample 이라 한다면,  
  return되는 객체는 __{"test":"test", "test2":"sample"}__ 이가 됩니다.
  
#### loadJH(resource) or gotoJH(resource)
  __loadJH(resource)__ 함수는 __index.htm.js__ 파일 외에 추가로 __htm.js__ 파일을 불러오기 위해 사용됩니다.  
  __resource__ 는 상대 경로로, 만약 __html__ 파일이 위치해 있는 곳을 기준으로 __more/jh/new.htm.js__ 을 추가로 로드하고 싶다면,  
  `loadJH("more/jh/new")` 로 작성해주면 됩니다.  
  <img src="Effect/img/icon-warning.png" style="width: 20px; height: auto">__.htm.js__ 확장자명은 생략하고 작성해야 합니다.  
  
  __gotoJH(resource)__ 도 기능은 같으나, __loadJh(resource)__ 와의 차이점은  
  __loadJH(resource)__ 는 실제로 사이트의 주소가 변하지 않지만, __gotoJH(resource)__ 는 사이트의 주소가 변합니다.  
  (__get__ 과 __post__ 의 차이를 생각해보시면 됩니다.)  
  <img src="Effect/img/icon-warning.png" style="width: 20px; height: auto">두 경우 모두, __실질적인 페이지 리로딩은 이뤄지지 않습니다.__
