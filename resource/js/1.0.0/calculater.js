const calculatorMethod = class {
    /**
     * @type {(from: number, to: number) => number}
     */
    static makeBinomial = (attempt, success, percent) => { 
        let temp = 1;
        for (let i = 0; i < success; i++) temp *= (attempt - i) / (i + 1) * percent;
        return temp;
    }
    /**
     * @type {(from: number) => number}
     */
    static calcDistributionOver = from => {
        return (from < 0) ? 100 - this.calcDistributionOver(-from)
          : (4.5 <= from) ? 0
          : (4.25 <= from) ? 0.001
          : (4.1 <= from) ? 0.002
          : (4 <= from) ? 0.003
          : (3.95 <= from) ? 0.004
          : (3.9 <= from) ? 0.005
          : (3.85 <= from) ? 0.006
          : (3.8 <= from) ? 0.007
          : (3.75 <= from) ? 0.009
          : (3.7 <= from) ? 0.011
          : (3.65 <= from) ? 0.013
          : (3.6 <= from) ? 0.016
          : (3.55 <= from) ? 0.019
          : (3.5 <= from) ? 0.023
          : (3.45 <= from) ? 0.028
          : (3.4 <= from) ? 0.034
          : (3.35 <= from) ? 0.04
          : (3.3 <= from) ? 0.048
          : (3.25 <= from) ? 0.058
          : (3.2 <= from) ? 0.069
          : (3.15 <= from) ? 0.082
          : (3.1 <- from) ? 0.097
          : (3.05 <= from) ? 0.114
          : (3 <= from) ? 0.135
          : (2.95 <= from) ? 0.159
          : (2.9 <= from) ? 0.187
          : (2.85 <= from) ? 0.219
          : (2.8 <= from) ? 0.256
          : (2.75 <= from) ? 0.298
          : (2.7 <= from) ? 0.347
          : (2.65 <= from) ? 0.402
          : (2.6 <= from) ? 0.466
          : (2.55 <= from) ? 0.539
          : (2.5 <= from) ? 0.621
          : (2.45 <= from) ? 0.714
          : (2.4 <= from) ? 0.82
          : (2.35 <= from) ? 0.939
          : (2.3 <= from) ? 1.072
          : (2.25 <= from) ? 1.222
          : (2.2 <= from) ? 1.49
          : (2.15 <= from) ? 1.578
          : (2.1 <= from) ? 1.786
          : (2.05 <= from) ? 2.018
          : (2 <= from) ? 2.275
          : (1.95 <= from) ? 2.559
          : (1.9 <= from) ? 2.812
          : (1.85 <= from) ? 3.216
          : (1.8 <= from) ? 3.593
          : (1.75 <= from) ? 4.006
          : (1.7 <= from) ? 4.357
          : (1.65 <= from) ? 4.947
          : (1.6 <= from) ? 5.48
          : (1.55 <= from) ? 6.057
          : (1.5 <= from) ? 6.681
          : (1.45 <= from) ? 7.353
          : (1.4 <= from) ? 8.076
          : (1.35 <= from) ? 8.851
          : (1.3 <= from) ? 9.68
          : (1.25 <= from) ? 10.565
          : (1.2 <= from) ? 11.507
          : (1.15 <= from) ? 12.507
          : (1.1 <= from) ? 13.567
          : (1.05 <= from) ? 14.686
          : (1 <= from) ? 15.866
          : (0.95 <= from) ? 17.106
          : (0.9 <= from) ? 18.406
          : (0.85 <= from) ? 19.764
          : (0.8 <= from) ? 21.186
          : (0.75 <= from) ? 22.663
          : (0.7 <= from) ? 24.196
          : (0.65 <= from) ? 25.785
          : (0.6 <= from) ? 27.425
          : (0.55 <= from) ? 29.116
          : (0.5 <= from) ? 30.854
          : (0.45 <= from) ? 32.636
          : (0.4 <= from) ? 34.458
          : (0.35 <= from) ? 36.317
          : (0.3 <= from) ? 38.209
          : (0.25 <= from) ? 40.129
          : (0.2 <= from) ? 42.074
          : (0.15 <= from) ? 44.038
          : (0.1 <= from) ? 46.017
          : (0.05 <= from) ? 48.006
          : 50
    }
    /**
     * @type {(from: number, to: number, percent: number) => number}
     */
    static independent = (from, to, percent) => {
        let temp = 0;
        if (to <= 0) return 100;
        else for (let i = to; i <= from; i++) temp += this.makeBinomial(from, i, percent) * Math.pow(1 - percent, from - i);
        return (temp * 100).toFixed(3);
    }
}
const calculatorBody = class {
    static MAX_TRIER = 32767;
    /**
     * @type {(dat: number) => dat}
     */
    static #PercentToValify = dat => {
        if (dat < 0.001) {
            alert("확률이 너무 작아, 확률을 0.001%로 수정합니다.");
            return 0.01;
        } else if (99.999 < dat) {
            alert("확률이 너무 커, 확률을 99.999%로 수정합니다.");
            return 99.999;
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
        if (p < 0.001) scan("!td input")[0].value = p = 0.001;
        else if (99.999 < p) scan("!td input")[0].value = p = 99.999;
        if (isNaN(p)) alert("우선 기본 확률을 입력해주세요.");
        else {
            let a = parseInt(prompt("몇번 시도하실 겁니까?")), b;
            if (isNaN(a)) return;
            b = parseInt(prompt("몇번이상 나오길 원하십니까?"));
            if (isNaN(b)) return;
            if (this.MAX_TRIER < a) {
                const avarage =  a * (p / 100);
                const deciation = Math.pow(avarage * (1 - (p / 100)), 0.5);
                const standard = (b - avarage) / deciation;
                scan("!#inner_3_2 td")[0].innerHTML = `${calculatorMethod.calcDistributionOver(standard)}% (근사도(정확도) = ${(avarage / 0.05 <= 100) ? (avarage / 0.05).toFixed(3) : 100}%)`;
            } else scan("!#inner_3_2 td")[0].innerHTML = `${calculatorMethod.independent(a, b, (p / 100))}%`;
        }
    }
    /**
     * @type {() => void}
     */
    static count = () => {
        let p = parseFloat(scan("!td input")[0].value);
        if (p < 0.001) scan("!td input")[0].value = p = 0.001;
        else if (99.999 < p) scan("!td input")[0].value = p = 99.999;
        if (isNaN(p)) alert("우선 기본 확률을 입력해주세요.");
        else {
            const b = this.#PercentToValify(parseFloat(prompt("몇% 이상으로 되길 원하십니까? (숫자만 입력해주시오.)")));
            if (!(p <= b)) {
                alert("변화될 확률이 잘못됬습니다. a보다 작거나 잘못된 값입니다.");
                return;
            }
            let i = 1;
            while (true) {
                if (this.MAX_TRIER < i) {
                    const avarage =  i * (p / 100);
                    const deciation = Math.pow(avarage * (1 - (p / 100)), 0.5);
                    const standard = (1 - avarage) / deciation;
                    if (b <= calculatorMethod.calcDistributionOver(standard)) {
                        scan("!#inner_3_2 td")[0].innerHTML = `${i} (${p}% -> ${calculatorMethod.calcDistributionOver(standard)}%) (근사도(정확도) = ${(avarage / 0.05 <= 100) ? (avarage / 0.05).toFixed(3) : 100}%)`;
                        return;
                    }
                    i++;
                } else {
                    if (b <= calculatorMethod.independent(i, 1, (p / 100))) {
                        scan("!#inner_3_2 td")[0].innerHTML = `${i} (${p}% -> ${calculatorMethod.independent(i, 1, (p / 100))}%)`
                        return;
                    }
                    i = Math.ceil(i * 1.1);
                }
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
            scan("!#inner_3_2 td")[0].innerHTML = `다음 통계량이 ${wantOver} 이상이 될 확률은 ${calculatorMethod.calcDistributionOver((wantOver - this.#aver(array)[0]) / this.#aver(array)[1])}%`;
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