let supstance = false;
let inputing = false;
function calculator(obj) {
    const INDEX = getIndex($scan(["td"]), obj)
    const TARGET = obj.parentElement.parentElement.children[0].children[0]
    function distribution(from) {
        let return_value;
        let value_array = [
            0,
            0.001,
            0.003,
            0.005,
            0.007,
            0.011,
            0.016,
            0.023,
            0.034,
            0.048,
            0.069,
            0.097,
            0.135,
            0.187,
            0.256,
            0.347,
            0.466,
            0.621,
            0.82,
            1.072,
            1.39,
            1.786,
            2.275,
            2.872,
            3.593,
            4.457,
            5.48,
            6.681,
            8.076,
            9.68,
            11.507,
            13.567,
            15.866,
            18.406,
            21.186,
            24.196,
            27.425,
            30.854,
            34.458,
            38.209,
            42.074,
            46.017,
            50
        ];
        if (from < 0) return_value = 50 + (50 - distribution(-from));
        else {
            for (i = 42; i >= 0; i--) {
                if (i / 10 <= from) {
                    return_value = value_array[42 - i];
                    break;
                }
            }
        }
        return return_value.toFixed(3);
    }
    function independent(from, to, percent) {
        let return_value = 0;
        if (to <= 0) return_value = 1;
        else {
            for (i = to; i <= from; i++) return_value += C(from, i) * Math.pow(percent, i) * Math.pow(1 - percent, from - i);
        }
        return (return_value *= 100).toFixed(3);
    }
    if (INDEX == 8) {
        (TARGET.innerHTML.substr(-1) == ">") ? TARGET.removeChild(TARGET.children[TARGET.children.length - 1]) : TARGET.innerHTML = TARGET.innerHTML.substr(0, TARGET.innerHTML.length - 1)
    } else if (INDEX == 9) {
        (TARGET.innerHTML == "") ? obj.parentElement.parentElement.children[1].children[0].innerHTML = "" : TARGET.innerHTML = ""
    } else if (INDEX == 21) {
        if (supstance) {
            obj.style.removeProperty("background");
            supstance = false
        } else {
            obj.style.background = "gray";
            supstance = true
        }
    } else if (INDEX == 22 || INDEX == 23) {
        if (inputing) {
            TARGET.innerHTML += ","
            obj.style.removeProperty("background");
            inputing = false
        } else {
            TARGET.innerHTML += `${obj.innerHTML.split("a")[0]}`
            obj.style.background = "gray";
            inputing = true
        }
    } else if (27 <= INDEX && INDEX <= 30) TARGET.innerHTML += obj.innerHTML.split("x")[0]
    else if (INDEX == 31) {
        a = parseInt(prompt("몇번 시도하실 겁니까?"))
        b = parseInt(prompt("몇번이상 나오길 원하십니까?"))
        c = parseFloat(prompt("기본적인 확률은 몇%입니까? (숫자만 입력해주십시오)")) / 100
        if (c < 0.0001) {
            console.log("확률이 너무 작아, 확률을 0.01%로 수정합니다.")
            c = 0.0001
        }
        if (170 < a) {
            let avarage = a * c;
            let deciation = Math.pow(avarage * (1 - c), 0.5);
            let standard = (b - avarage) / deciation;
            TARGET.innerHTML = `${distribution(standard)}%`
        } else TARGET.innerHTML = `${independent(a, b, c)}%`
    } else if (INDEX == 32) alert("확률 c는 0.01 이상이여야 합니다.")
    else if (INDEX == 33) {
        c = parseFloat(prompt("기본적인 확률은 몇%입니까? (숫자만 입력해주십시오)")) / 100
        if (c < 0.0001) {
            console.log("확률이 너무 작아, 확률을 0.01%로 수정합니다.")
            c = 0.0001
        }
        let i = 1;
        while (true) {
            if (170 < i) {
                let avarage = i * c;
                let deciation = Math.pow(avarage * (1 - c), 0.5);
                let standard = (1 - avarage) / deciation;
                if (95 <= distribution(standard)) {
                    TARGET.innerHTML = `${i}번 시도하시면 ${distribution(standard)}%의 확률로 확정됩니다.`
                    break;
                }
            } else {
                if (95 <= independent(i, 1, c)) {
                    TARGET.innerHTML = `${i}번 시도하시면 ${independent(i, 1, c)}%의 확률로 확정됩니다.`
                    break;
                }
            }
            i++;
        }
    } else (supstance) ? TARGET.innerHTML += `<sup>${obj.innerHTML}</sup>` : TARGET.innerHTML += `${obj.innerHTML}`
}
function P(from, to) {
    return Fac(from) / Fac(from - to)
}
function C(from, to) {
    return P(from, to) / Fac(to)
}
function Sin(num) {
    return parseFloat(Math.sin(num).toFixed(12))
}
function Cos(num) {
    return parseFloat(Math.cos(num).toFixed(12))
}
function Tan(num) {
    return parseFloat(Math.tan(num).toFixed(12))
}
function Fac(num) {
    if (Number.isInteger(num)) {
        if (num == 0) num = 1;
        else if (num < 0) num = -Infinity;
        return (num <= 1) ? num : num * Fac(num - 1);
    } else {
        //Suggest by https://stackoverflow.com/questions/15454183/how-to-make-a-function-that-computes-the-factorial-for-numbers-with-decimals#answer-15454866 and alteration by https://hynrusang.github.io
        if (num < 0) return Fac(num + 1) / (num + 1)
        let g = 7;
        let C = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
        let x = C[0];
        for (var i = 1; i < g + 2; i++) x += C[i] / (num + i);
        let t = num + g + 0.5;
        return Math.sqrt(2 * Math.PI) * Math.pow(t, (num + 0.5)) * Math.exp(-t) * x;
    }
}
function calculate(obj) {
    const INPUT = obj.parentElement.parentElement.children[0].children[0].innerHTML
        .replace(/<\/sup><sup>/gi, "")
        .replace(/<\/sub><sub>/gi, "")
        .replace(/×/gi, "*")

        .replace(/(\d+)e/gi, "$1*2.718281828459045")
        .replace(/e\(/gi, "2.718281828459045*(")
        .replace(/\)e/gi, ")*2.718281828459045")
        .replace(/e/gi, "2.718281828459045")

        .replace(/(\d+)π/gi, "$1*3.141592653589793")
        .replace(/π\(/gi, "3.141592653589793*(")
        .replace(/\)π/gi, ")*3.141592653589793")
        .replace(/π/gi, "3.141592653589793")

        .replace(/(\d)Fac/gi, "$1*Fac")
        .replace(/\)Fac/gi, ")*Fac")
        

        .replace(/(\d+)\(/gi, "$1*(")
        .replace(/\)\(/gi, ")*(")
        .replace(/\)(\d+)/gi, ")*$1")

        .replace(/<sup>(.*?)<\/sup>/gi, "**($1)")

        .replace(/(\d)P/gi, "$1*P")
        .replace(/\)P/gi, ")*P")
        .replace(/(\d)C/gi, "$1*C")
        .replace(/\)C/gi, ")*C")

        .replace(/(\d+)Sin/gi, "$1*Sin")
        .replace(/(\d+)Cos/gi, "$1*Cos")
        .replace(/(\d+)Tan/gi, "$1*Tan")
    if (INPUT != "") obj.parentElement.parentElement.children[1].children[0].innerHTML = eval(INPUT)
}
