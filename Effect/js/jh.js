/*
이 소스코드는 js로 html을 빠르고 간편하게 만들기 위해 작성되었습니다.
절대로 무단으로 가져가지 마시기 바랍니다.
작성자: 김민기
 */
function $set(obj, dataString, isAttribute=true) {
    const DATASET = dataString.split("&&"), LENGTH = DATASET.length
    let i = 0;
    if (isAttribute) {
        if (DATASET[0].split("<<").length == 1) {
            if (obj.localName == "img" || obj.localName == "iframe" || obj.localName == "script") obj.setAttribute("src", DATASET[i++])
            else if (obj.localName == "input") obj.setAttribute("type", DATASET[i++])
            else if (obj.localName == "link") obj.setAttribute("href", DATASET[i++])
            else if (obj.localName == "p" || obj.localName == "pre") obj.innerText = DATASET[i++]
            else obj.innerHTML = DATASET[i++]
        }
        for (; i < LENGTH; i ++) obj.setAttribute(DATASET[i].split("<<")[0].replace(/ /gi, ""), DATASET[i].split("<<")[1])
    } else for (; i < LENGTH; i++) obj.classList.add(DATASET[i]) 
}
function $setData(obj, dataSet) {
    function IN(obj, dataString) {
        if (dataString != null) {
            const DATATAG = dataString.split(/\#|::|\$/)
            if (DATATAG[1] != null) {
                if (dataString.indexOf("$") != -1) $set(obj, DATATAG[1])
                else (dataString.indexOf("\#") != -1) ? obj.id = DATATAG[1] : $set(obj, DATATAG[1], false)
                if (DATATAG[2] != null) {
                    (dataString.indexOf("$") != -1 && dataString.indexOf("\#") != -1) ? obj.id = DATATAG[2] : $set(obj, DATATAG[2], false)
                    if (DATATAG[3] != null) $set(obj, DATATAG[3], false)
                }
            }
        }
    }
    if (Array.isArray(obj)) {
        this.obj = new Array(obj.length)
        const LENGTH = this.obj.length
        for (var i = 0; i < LENGTH; i++) {
            this.obj[i] = obj[i].cloneNode(true)
            if (dataSet != null) {
                for (var j = 0; j < dataSet.length; j += 2) {
                    let objTarget
                    if (Array.isArray(dataSet[j])) {
                        objTarget = this.obj[i]
                        j--
                    } else objTarget = this.obj[i].children[dataSet[j]]
                    if (typeof dataSet[j + 1][i] == "string") (dataSet[j + 1][i].indexOf("\#") == -1 && dataSet[j + 1][i].indexOf("$") == -1 && dataSet[j + 1][i].indexOf("::") == -1) ? IN(objTarget, `$${dataSet[j + 1][i]}`) : IN(objTarget, dataSet[j + 1][i])
                    else (dataSet[j + 1][dataSet[j + 1][i]].indexOf("\#") == -1 && dataSet[j + 1][dataSet[j + 1][i]].indexOf("$") == -1 && dataSet[j + 1][dataSet[j + 1][i]].indexOf("::") == -1) ? IN(objTarget, `$${dataSet[j + 1][dataSet[j + 1][i]]}`) : IN(objTarget, dataSet[j + 1][dataSet[j + 1][i]])
                }
            }
        }
    } else {
        this.obj = document.createElement(obj.split(/\#|::|\$/)[0])
        IN(this.obj, obj)
    }
    return this.obj
}
function $scan(selector) {
    if (Array.isArray(selector)) {
        if (selector[1] == null) return document.querySelectorAll(selector[0])
        else return document.querySelectorAll(selector[0])[selector[1]]
    } else return document.querySelector(selector)
}
class $Dom {
    constructor(parent, children) {
        if (parent == "body") this.parent = $scan("body")
        else (typeof parent == "string") ? this.parent = $setData(parent) : this.parent = parent.cloneNode()
        this.children = children
        if (this.children != null) {
            const LENGTH = this.children.length
            for (var i = 0; i < LENGTH; i++) {
                if (Array.isArray(this.children[i])) for (var j = 0; j < this.children[i].length; j++) this.parent.appendChild(this.children[i][j])
                else {
                    if (typeof children[i] == "string") this.children[i] = $setData(children[i])
                    this.parent.appendChild(this.children[i])
                }
            }
        }
    }
    $(Num, dataSet) {
        if (Num != null) {
            this.Num = new Array(Num)
            for (var i = 0; i < Num; i++) this.Num[i] = this.parent.cloneNode(true)
            return $setData(this.Num, dataSet)
        } else return this.parent
    }
}
function $(parent, child) {
    if (window.top.document.domain === document.domain) return new $Dom(parent, child)
}
function $reload(selector, child) {
    $scan(selector).parentElement.appendChild($($scan(selector), child).$())
    $scan(selector).remove()
}
function $read() {
    try {
        const DATA = location.href.split("#")[0].split("?")[1].split("&"), LENGTH = DATA.length;
        let temp = new Object();
        for (var i = 0; i < LENGTH; i++) {
            temp[`${DATA[i].split("=")[0]}`] = `${DATA[i].split("=")[1]}`
        }
        return temp
    } catch (e) {
        return null
    }
}
function loadJH(resource) {
    if (resource != null) {
        if (origin == 'null') $scan("body").appendChild($(`script$${resource}.htm.js`).$())
        else {
            const REQUEST = new XMLHttpRequest()
            REQUEST.open('GET', `https://${document.domain}/${resource}.htm.js`)
            REQUEST.send()
            REQUEST.onreadystatechange = (e => {
                (e.target.readyState == 4) ? eval(REQUEST.response) : null
            })
        }
    }
}
function gotoJH(resource) {
    if ($read() != null) {
        if ($read()["!DOCURL"] != null && Object.keys($read()).length == 1) {
            history.replaceState(null, "", location.href.replace(/\!DOCURL=(.*)/, `!DOCURL=${resource}`))
        } else if ($read()["!DOCURL"] != null) {
            history.replaceState(null, "", location.href.replace(/\!DOCURL=(.*)\&/, `!DOCURL=${resource}&`))
        } else {
            history.replaceState(null, "", `${location.href}&!DOCURL=${resource}`)
        }
    } else {
        history.replaceState(null, "", `${location.href}?!DOCURL=${resource}`)
    }
    loadJH($read()["!DOCURL"])
}
loadJH("index");
if ($read() != null) {
    loadJH($read()["!DOCURL"])
}