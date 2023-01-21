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
    static combine = (from, to) => { return this.permutation(from, to) / factorial(to); }
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
        if (from < 0) return 50 + (50 - this.distribution(-from));
        else if (4.2 <= from) return parseArray[0];
        else return parseArray[42 - from * 10];
    }
    /**
     * @type {(from: number, to: number, percent: number) => number}
     */
    static independent = (from, to, percent) => {
        if (to <= 0) return 100;
        else {
            let temp = 0;
            for (i = to; i <= from; i++) temp += this.combine(from, i) * Math.pow(percent, i) * Math.pow(1 - percent, from - i);
            return (temp *= 100).toFixed(3);
        }
    }
}
const calculatorBody = class {
    /**
     * @type {(dat: number) => dat}
     */
    static #MinPercentApply = dat => {
        if (dat < 0.01) {
            alert("기본적인 확률이 너무 작아, 확률을 0.01%로 수정합니다.");
            return 0.01;
        } else return dat;
    }
    /**
     * @type {(dat: number) => dat}
     */
    static #MaxPercentApply = dat => {
        if (95 < dat) {
            alert("변화될 확률이 너무 커, 확률을 95%로 수정합니다.");
            return 95;
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
     * @type {(array: number[]) => boolean}
     */
    static #checkStatisticsArrayIsValify = array => {
        if (!array) {
            alert("해당 통계는 잘못된 통계입니다.");
            return false;
        } else true;
    }
    /**
     * @type {() => void}
     */
    static percent = () => {
        const a = parseInt(prompt("몇번 시도하실 겁니까?"));
        const b = parseInt(prompt("몇번이상 나오길 원하십니까?"));
        const c = this.#MinPercentApply(parseFloat(prompt("기본적인 확률은 몇%입니까? (숫자만 입력해주십시오)")));
        if (170 < a) {
            const avarage = a * (c / 100);
            const deciation = Math.pow(avarage * (1 - (c / 100)), 0.5);
            const standard = (b - avarage) / deciation;
            scan("#calcout").innerHTML = `${distribution(standard)}%`;
        } else scan("#calcout").innerHTML = `${independent(a, b, c)}%`;
    }
    /**
     * @type {() => void}
     */
    static count = () => {
        const a = this.#MinPercentApply(parseFloat(prompt("기본적인 확률은 몇%입니까? (숫자만 입력해주십시오)")));
        const b = this.#MaxPercentApply(parseFloat(prompt("몇% 이상으로 되길 원하십니까? (숫자만 입력해주시오.)")));
        if (!(a <= b)) {
            alert("변화될 확률이 잘못됬습니다. a보다 작거나 잘못된 값입니다.");
            return;
        }
        let i = 0;
        while (true) {
            if (170 < i) {
                const avarage = i * (a / 100);
                const deciation = Math.pow(avarage * (1 - (a / 100)), 0.5);
                const standard = (1 - avarage) / deciation;
                if (b <= distribution(standard)) {
                    scan("#calcout").innerHTML = `${i} (${a}% -> ${distribution(standard)}%)`
                    return;
                }
            } else {
                if (b <= independent(i, 1, (a / 100))) {
                    scan("#calcout").innerHTML = `${i} (${a}% -> ${independent(i, 1, a)}%)`
                    return;
                }
            }
            i++;
        }
    }
    /**
     * @type {() => void}
     */
    static parsingStatistic = () => {
        const array = db.slist[prompt("값을 추출할 통계를 입력해주세요.")];
        if (!this.#checkStatisticsArrayIsValify(array)) return;
        else scan("#calcout").innerHTML = `평균 = ${this.#aver(array)[0]}, 분산 = (${this.#aver(array)[1]})<sup>2</sup>`;
    }
    /**
     * @type {() => void}
     */
    static getNextPredictIsCorrectPercent = () => {
        const array = db.slist[prompt("값을 추출할 통계를 입력해주세요.")];
        if (!this.#checkStatisticsArrayIsValify(array)) return;
        else scan("#calcout").innerHTML = `다음 통계량이 ${parseFloat(prompt("무슨 값 이상이 나오길 원하십니까?"))} 이상이 될 확률은 ${calculatorMethod.distribution((over - this.#aver(array)[0]) / this.#aver(array)[1])}%`;
    }
}
function calculator(e) {
    let num = getIndex(e.target.parentElement.parentElement, e.target.parentElement)
    if (num == 1) calculatorBody.percent();
    if (num == 2) calculatorBody.count();
    if (num == 3) calculatorBody.parsingStatistic();
    if (num == 4) calculatorBody.getNextPredictIsCorrectPercent();
}
scan("!#inner_3_2 td").forEach(obj => { obj.onclick = calculator; });