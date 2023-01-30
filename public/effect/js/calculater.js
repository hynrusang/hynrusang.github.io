const calculatorMethod = class {
    /**
     * @type {(num: number) => number}
     */
    static factorial = num => {
        if (num == 0) return 1;
        else if (num == 0.5) return Math.PI / 2;
        else if (num < 0) return -Infinity;
        else return num * this.factorial(num - 1);
    }
    /**
     * @type {(from: number, to: number) => number}
     */
    static permutation = (from, to) => { return this.factorial(from) / this.factorial(from - to); }
    /**
     * @type {(from: number, to: number) => number}
     */
    static combine = (from, to) => { return this.permutation(from, to) / this.factorial(to); }
    /**
     * @type {(from: number) => number}
     */
    static distribution = from => {
        const parseArray = [
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
        if (from < 0) return 100 - this.distribution(-from);
        else if (4.2 <= from) return parseArray[0];
        else return parseArray[42 - Math.round(from * 10)];
    }
    /**
     * @type {(from: number, to: number, percent: number) => number}
     */
    static independent = (from, to, percent) => {
        let temp = 0;
        if (to <= 0) return 100;
        else for (let i = to; i <= from; i++) temp += this.combine(from, i) * Math.pow(percent, i) * Math.pow(1 - percent, from - i);
        return (temp * 100).toFixed(3);
    }
}
const calculatorBody = class {
    /**
     * @type {(dat: number) => dat}
     */
    static #PercentToValify = dat => {
        if (dat < 0.01) {
            alert("확률이 너무 작아, 확률을 0.01%로 수정합니다.");
            return 0.01;
        } else if (99.99 < dat) {
            alert("확률이 너무 커, 확률을 99.9%로 수정합니다.");
            return 99.99;
        } else return dat;
    }
    /**
     * @type {(array: number[]) => number[]}
     */
    static #aver = array => {
        let avarage = 0;
        for (var i = 0; i < array.length; i++) avarage += parseFloat(array[i]);
        avarage = (avarage / array.length).toFixed(3);
        let deviation = 0;
        for (var i = 0; i < array.length; i++) deviation += Math.pow(parseFloat(array[i]), 2);
        deviation = Math.pow((deviation / array.length) - Math.pow(parseFloat(avarage), 2), 0.5).toFixed(3);
        return [avarage, deviation];
    }
    /**
     * @type {() => void}
     */
    static percent = () => {
        let p = parseFloat(scan("!td input")[0].value);
        if (p < 0.01) scan("!td input")[0].value = p = 0.01;
        else if (99.99 < p) scan("!td input")[0].value = p = 99.99;
        if (isNaN(p)) alert("우선 기본 확률을 입력해주세요.");
        else {
            let a = parseInt(prompt("몇번 시도하실 겁니까?")), b;
            if (isNaN(a)) return;
            b = parseInt(prompt("몇번이상 나오길 원하십니까?"));
            if (isNaN(b)) return;
            if (170 < a) {
                const avarage = a * (p / 100);
                const deciation = Math.pow(avarage * (1 - (p / 100)), 0.5);
                const standard = (b - avarage) / deciation;
                scan("!#inner_3_2 td")[0].innerHTML = `${calculatorMethod.distribution(standard)}%`;
            } else scan("!#inner_3_2 td")[0].innerHTML = `${calculatorMethod.independent(a, b, (p / 100))}%`;
        }
    }
    /**
     * @type {() => void}
     */
    static count = () => {
        let p = parseFloat(scan("!td input")[0].value);
        if (p < 0.01) scan("!td input")[0].value = p = 0.01;
        else if (99.99 < p) scan("!td input")[0].value = p = 99.99;
        if (isNaN(p)) alert("우선 기본 확률을 입력해주세요.");
        else {
            const b = this.#PercentToValify(parseFloat(prompt("몇% 이상으로 되길 원하십니까? (숫자만 입력해주시오.)")));
            if (!(p <= b)) {
                alert("변화될 확률이 잘못됬습니다. a보다 작거나 잘못된 값입니다.");
                return;
            }
            let i = 0;
            while (true) {
                if (170 < i) {
                    const avarage = i * (p / 100);
                    const deciation = Math.pow(avarage * (1 - (p / 100)), 0.5);
                    const standard = (1 - avarage) / deciation;
                    if (b <= calculatorMethod.distribution(standard)) {
                        scan("!#inner_3_2 td")[0].innerHTML = `${i} (${p}% -> ${calculatorMethod.distribution(standard)}%)`;
                        return;
                    }
                } else {
                    if (b <= calculatorMethod.independent(i, 1, (p / 100))) {
                        scan("!#inner_3_2 td")[0].innerHTML = `${i} (${p}% -> ${calculatorMethod.independent(i, 1, (p / 100))}%)`
                        return;
                    }
                }
                i++;
            }
        }
    }
    /**
     * @type {() => void}
     */
    static parsingStatistic = () => {
        const array = db.slist[scan("!td input")[1].value];
        if (!array) alert("먼저 통계를 선택해주세요.");
        else scan("!#inner_3_2 td")[0].innerHTML = `평균 = ${this.#aver(array)[0]}, 분산 = (${this.#aver(array)[1]})<sup>2</sup>`;
    }
    /**
     * @type {() => void}
     */
    static getNextPredictIsCorrectPercent = () => {
        const array = db.slist[scan("!td input")[1].value];
        if (!array) alert("먼저 통계를 선택해주세요.");
        else {
            const wantOver = parseFloat(prompt("무슨 값 이상이 나오길 원하십니까?"));
            scan("!#inner_3_2 td")[0].innerHTML = `다음 통계량이 ${wantOver} 이상이 될 확률은 ${calculatorMethod.distribution((wantOver - this.#aver(array)[0]) / this.#aver(array)[1])}%`;
        }
    }
}
function calculator(e) {
    let num = getIndex(scan("!#inner_3_2 td"), e.target);
    switch (num) {
        case 3:
            calculatorBody.percent();
            break;
        case 4:
            calculatorBody.count();
            break;
        case 5:
            calculatorBody.parsingStatistic();
            break;
        case 6:
            calculatorBody.getNextPredictIsCorrectPercent();
            break;
    }
}
scan("!#inner_3_2 td").forEach(obj => { obj.onclick = calculator; });