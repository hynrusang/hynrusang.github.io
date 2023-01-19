function permutation(from, to) {
    return factorial(from) / factorial(from - to)
}
function combine(from, to) {
    return permutation(from, to) / factorial(to)
}
function factorial(num) {
    if (num == 0) num = 1;
    else if (num < 0) num = -Infinity;
    return (num <= 1) ? num : num * factorial(num - 1);
}
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
        for (i = to; i <= from; i++) return_value += combine(from, i) * Math.pow(percent, i) * Math.pow(1 - percent, from - i);
    }
    return (return_value *= 100).toFixed(3);
}
function percentCalc() {
    a = parseInt(prompt("몇번 시도하실 겁니까?"))
    b = parseInt(prompt("몇번이상 나오길 원하십니까?"))
    c = parseFloat(prompt("기본적인 확률은 몇%입니까? (숫자만 입력해주십시오)")) / 100
    if (c < 0.0001) {
        alert("기본적인 확률이 너무 작아, 확률을 0.01%로 수정합니다.")
        c = 0.0001
    }
    if (170 < a) {
        let avarage = a * c;
        let deciation = Math.pow(avarage * (1 - c), 0.5);
        let standard = (b - avarage) / deciation;
        scan("#calcout").innerHTML = `${distribution(standard)}%`
    } else scan("#calcout").innerHTML = `${independent(a, b, c)}%`
}
function calcCount() {
    a = parseFloat(prompt("기본적인 확률은 몇%입니까? (숫자만 입력해주십시오)")) / 100
    b = parseFloat(prompt("몇% 이상으로 되길 원하십니까? (숫자만 입력해주시오.)")) / 100
    if (a < 0.0001) {
        alert("기본적인 확률이 너무 작아, 확률을 0.01%로 수정합니다.")
        a = 0.0001
    }
    if (0.95 < b) {
        alert("변화될 확률이 너무 커, 확률을 95%로 수정합니다.")
        b = 0.95;
    } else if ((a <= b) != true) {
        alert("변화될 확률이 잘못됬습니다. a보다 작거나 잘못된 값입니다.")
    }
    let i = 1;
    while (true) {
        if (170 < i) {
            let avarage = i * a;
            let deciation = Math.pow(avarage * (1 - a), 0.5);
            let standard = (1 - avarage) / deciation;
            if (b * 100 <= distribution(standard)) {
                scan("#calcout").innerHTML = `${i} (${a * 100}% -> ${distribution(standard)}%)`
                break;
            }
        } else {
            if (b * 100 <= independent(i, 1, a)) {
                scan("#calcout").innerHTML = `${i} (${a * 100}% -> ${independent(i, 1, a)}%)`
                break;
            }
        }
        i++;
    }
}
function calcAver(array) {
    let avarage = 0;
    for (var i = 0; i < array.length; i++) avarage += parseFloat(array[i]);
    avarage = (avarage / array.length).toFixed(3);
    let deviation = 0;
    for (var i = 0; i < array.length; i++) deviation += Math.pow(parseFloat(array[i]), 2);
    deviation = Math.pow((deviation / array.length) - Math.pow(parseFloat(avarage), 2), 0.5).toFixed(3);
    return [avarage, deviation];
}
function calcAll() {
    let array = JSON.parse(localStorage.getItem("statistics"))[prompt("값을 추출할 통계를 입력해주세요.")]
    if (array == undefined) {
        alert("해당 통계는 잘못된 통계입니다.")
        return;
    } else {
        scan("#calcout").innerHTML = `평균 = ${calcAver(array)[0]}, 분산 = (${calcAver(array)[1]})<sup>2</sup>`
    }
}
function calcNext() {
    let array = JSON.parse(localStorage.getItem("statistics"))[prompt("값을 추출할 통계를 입력해주세요.")]
    if (array == undefined) {
        alert("해당 통계는 잘못된 통계입니다.")
        return;
    } else {
        let over = parseFloat(prompt("무슨 값 이상이 나오길 원하십니까?"))
        let standard = (over - calcAver(array)[0]) / calcAver(array)[1];
        scan("#calcout").innerHTML = `다음 통계량이 ${over} 이상이 될 확률은 ${distribution(standard)}%`
    }
}
function calculator(obj) {
    let num = getIndex(obj.parentElement.parentElement, obj.parentElement)
    if (num == 1) percentCalc();
    if (num == 2) calcCount();
    if (num == 3) calcAll();
    if (num == 4) calcNext();
}
let calculatorButton = scan(["#inner_3_2 td"]);
for (var i = 1; i < calculatorButton.length; i++) calculatorButton[i].onclick = ((e) => {
    calculator(e.target);
});