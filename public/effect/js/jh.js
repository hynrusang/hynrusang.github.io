/*
이 소스코드는 js로 html을 빠르고 간편하게 만들기 위해 작성되었습니다.
절대로 무단으로 가져가지 마시기 바랍니다.
작성자: 김민기
 */

class DomDefault {
    node;
    /**
     * @type {(num: number) => HTMLElement}
     */
    children = function (num) {
        if (this.node.children[num] == undefined) throw `노드의 ${num + 1}번째 자식노드는 존재하지 않습니다.`;
        else return this.node.children[num];
    };
    /**
     * @type {(...dom: DomExpert | DomExpert[]) => DomDefault}
     */
    add = function (...dom) {
        for (var i = 0; i < dom.length; i++) {
            if (Array.isArray(dom[i])) for (var j = 0; j < dom[i].length; j++) this.node.appendChild(dom[i][j].node);
            else this.node.appendChild(dom[i].node);
        }
        return this;
    };
    /**
     * @type {(num: number) => void}
     */
    remove = function (num) { this.node.removeChild(this.children(num)); }
    constructor(nodeName = "div") { this.node = document.createElement(nodeName); };
}
class DomExpert extends DomDefault {
    /**
     * @type {(count: number) => DomExpert[]}
     */
    copy = function (count) {
        let tempbox = [];
        for (var i = 0; i < count; i++) {
            let temp = new DomExpert();
            temp.node = this.node.cloneNode(true);
            tempbox.push(temp);
        }
        return tempbox;
    }
    /**
     * @type {(...dom?: DomExpert | DomExpert[]) => DomDefault}
     */
    reset = function (...dom) {
        this.node.innerHTML = null;
        this.add(...dom);
    };
    /**
     * @type {(attribute: string) => void}
     */
    set = function (attribute) {
        let attributeParse = attribute.split("<<");
        if (attributeParse[0] == "$") {
            if (this.node.localName == "img" || this.node.localName == "iframe" || this.node.localName == "script") this.node.setAttribute("src", attributeParse[1]);
            else if (this.node.localName == "input") this.node.setAttribute("type", attributeParse[1]);
            else if (this.node.localName == "link") this.node.setAttribute("href", attributeParse[1]);
            else this.node.innerHTML = attributeParse[1];
        } else this.node.setAttribute(attributeParse[0], attributeParse[1]);
    };
    /**
     * @param {string} nodeName
     * @param {...string} attributes
     */
    constructor(nodeName, ...attributes) {
        super(nodeName);
        for (var i = 0; i < attributes.length; i++) this.set(attributes[i]);
    }
}
/**
 * @type {(nodeName: string, ...attributes?: string) => DomExpert}
 */
const $ = (nodeName, ...attributes) => { return new DomExpert(nodeName, ...attributes); };
/**
 * @type {(millisecond: number) => Promise<>}
 */
const wait = millisecond => { return new Promise(code => setTimeout(code, millisecond)); }
/**
 * @type {(array: Array) => boolean}
 */
const isEmpty = array => {
    for (i = 0; i < array.length; i++) if (array[i] != "") return false;
    return true;
}
/**
 * @type {{
 * (parent: any[], child: any) => number | null
 * (parent: HTMLElement, child: HTMLElement) => number | null
 * }}
 */
const getIndex = (parent, child) => {
    if (parent.nodeName != null) {
        for (var i = 0; i < parent.children.length; i++) if (parent.children[i] === child) return i;
        return null;
    } else {
        for (var i = 0; i < parent.length; i++) if (parent[i] === child) return i;
        return null;
    }
}
/** 
 * @type {{
* (selector: "a") => HTMLAnchorElement
* (selector: "animate") => SVGAnimateElement
* (selector: "animateMotion") => SVGAnimateMotionElement
* (selector: "area") => HTMLAreaElement
* (selector: "audio") => HTMLAudioElement
* (selector: "br") => HTMLBRElement
* (selector: "base") => HTMLBaseElement
* (selector: "body") => HTMLBodyElement
* (selector: "button") => HTMLButtonElement
* (selector: "canvas") => HTMLCanvasElement
* (selector: "form") => HTMLFormElement
* (selector: "embed") => HTMLEmbedElement
* (selector: "hr") => HTMLHRElement
* (selector: "head") => HTMLHeadElement
* (selector: "fieldset") => HTMLFieldSetElement
* (selector: "iframe") => HTMLIFrameElement
* (selector: "input") => HTMLInputElement
* (selector: "li") => HTMLLIElement
* (selector: "pre") => HTMLPreElement
* (selector: "script") => HTMLScriptElement
* (selector: "!a") => NodeListOf<HTMLAnchorElement>
* (selector: "!animate") => NodeListOf<SVGAnimateElement>
* (selector: "!animateMotion") => NodeListOf<SVGAnimateMotionElement>
* (selector: "!area") => NodeListOf<HTMLAreaElement>
* (selector: "!audio") => NodeListOf<HTMLAudioElement>
* (selector: "!br") => NodeListOf<HTMLBRElement>
* (selector: "!base") => NodeListOf<HTMLBaseElement>
* (selector: "!body") => NodeListOf<HTMLBodyElement>
* (selector: "!button") => NodeListOf<HTMLButtonElement>
* (selector: "!canvas") => NodeListOf<HTMLCanvasElement>
* (selector: "!form") => NodeListOf<HTMLFormElement>
* (selector: "!embed") => NodeListOf<HTMLEmbedElement>
* (selector: "!hr") => NodeListOf<HTMLHRElement>
* (selector: "!head") => NodeListOf<HTMLHeadElement>
* (selector: "!fieldset") => NodeListOf<HTMLFieldSetElement>
* (selector: "!iframe") => NodeListOf<HTMLIFrameElement>
* (selector: "!input") => NodeListOf<HTMLInputElement>
* (selector: "!li") => NodeListOf<HTMLLIElement>
* (selector: "!pre") => NodeListOf<HTMLPreElement>
* (selector: "!script") => NodeListOf<HTMLScriptElement>
* (selector: `!${string}`) => NodeListOf<Element>
* (selector: String) => Element
* }}
*/
const scan = selector => {
   if (selector.indexOf("!") == 0) return document.querySelectorAll(selector.split("!")[1]);
   else return document.querySelector(selector);
}
/**
 * @type {(selector: string) => DomExpert}
 */
const snipe = selector => {
    let temp = $();
    temp.node = scan(selector);
    return temp;
}
/**
 * @type {(...jhpath: string) => void}
 */
const loading = (...jhpath) => {
    for (var i = 0; i < jhpath.length; i++) {
        const REQUEST = new XMLHttpRequest();
        REQUEST.open('GET', `${jhpath[i]}.htm.js`);
        REQUEST.send();
        REQUEST.onreadystatechange = (e => { (e.target.readyState == 4) ? eval(REQUEST.response) : null});
    }
}