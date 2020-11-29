const fetch = require('node-fetch');
const fs = require('fs');

// Get data from past week
async function getData(base, currency, testing){

    if(testing){
        let url = `https://api.twelvedata.com/time_series?symbol=${currency}/${base}&interval=1min&outputsize=2880&apikey=${process.env.TOKEN}&source=docs`;

        let forex = {};
        await fetch(url)
        .then(res => res.json())
        .then(data => {
            if(Object.keys(data).length == 1) return;
        
            let spans = Object.keys(data[Object.keys(data)[1]]).reverse();
            
            let opens = [];
            let highs = [];
            let lows = [];
            let closes = [];

            spans.forEach((a) => {
                let c = data[Object.keys(data)[1]][a];
                opens.push(parseFloat(c["open"]));
                highs.push(parseFloat(c["high"]));
                lows.push(parseFloat(c["low"]));
                closes.push(parseFloat(c["close"]));
            });

            forex.o = opens;
            forex.h = highs;
            forex.l = lows;
            forex.c = closes;
        });

        let realtimeURL = `https://webrates.truefx.com/rates/connect.html?f=html`;
        await fetch(realtimeURL)
        .then(res => res.text())
        .then(data => {
            let money = data.slice(78, 82) + data.slice(91, 94);

            forex.o.push(parseFloat(money));
            forex.h.push(parseFloat(money));
            forex.l.push(parseFloat(money));
            forex.c.push(parseFloat(money));
        });

        return forex;

    } else {
        let jsonData = await JSON.parse(fs.readFileSync(`data/${currency}${base}.json`));
        let forex = {};
        
        forex.o = jsonData.open;
        forex.h = jsonData.high;
        forex.l = jsonData.low;
        forex.c = jsonData.close;

        return forex;
    }
}

// Exponential Moving Average

// data is left to right, past to present
function ema(data, sma){
    if(data.length == 1) return sma;
    let m = 2 / (data.length + 1);
    return data.slice(-1)[0] * m + ema(data.slice(0, -1), sma) * (1-m);
}

// Interpret data into complex data
function interpret(data){
    let comp = [];

    for(let time in data.c.slice(1440)){
        time = time * 1 + 1440;
        let price = data.c[time];
        let span = { price };

        let day = data.c.slice(time-1440, time);
        let mean = day.reduce((a, c) => a + c, 0) / 1440;
        let high = day.reduce((a, c) => Math.max(a, c), 0);
        let low = day.reduce((a, c) => Math.min(a, c), 0);
        let deviation = Math.sqrt(day.reduce((a, c) => a + (c - mean) ** 2, 0) / 1440);
        
        let consabv = day.slice(-5).reduce((a, c) => a && c > mean, true);
        let consblw = day.slice(-5).reduce((a, c) => a && c < mean, true);

        let stochastic = (price - low) / (high - low);
        let cci = ((high + low + price) / 3 - mean) / (0.015 * deviation);
        let upper = mean + deviation * 2;
        let lower = mean - deviation * 2;

        let expmean = ema(day.slice(-26), day.slice(-52, -26).reduce((a, c) => a + c, 0) / 26);
        let macd = ema(day.slice(-12), day.slice(-24, -12).reduce((a, c) => a + c, 0) / 12) - expmean;

        let atr = Math.max(high-low, day[0]-low, (day[0]-high)*-1);
        let donchian = (high + low) / 2;
        
        let zcm = ((data.c[time] - data.l[time]) - (data.h[time] - data.c[time])) / Math.abs(data.o[time] - data.c[time]);
        if(zcm > 1 || zcm < -1) zcm = 1/zcm;

        // Above and below bollinger bands
        span.abvupper = price - upper > 0 ? 1 : 0;
        span.blwlower = lower - price > 0 ? 1 : 0;

        // Above and below mean values
        span.abvmean = price - mean > 0 ? 1 : 0;
        span.blwmean = mean - price > 0 ? 1 : 0;
        span.abvema = price - expmean > 0 ? 1 : 0;
        span.blwema = expmean - price > 0 ? 1 : 0;
        span.emasma = expmean - mean > 0 ? 1 : 0;
        span.smaema = mean - expmean > 0 ? 1 : 0;

        // Other stuff
        span.macd = macd;
        span.stcgood = stochastic > 0.75 ? 1 : 0;
        span.stcbad = stochastic < 0.25 ? 1 : 0;
        span.cci = (cci < 100 && cci > -100) ? 1 : 0;
        span.consabv = consabv ? 1 : 0;
        span.consblw = consblw ? 1 : 0;

        comp.push(span);
    }
    
    return comp;
}

// Send a Buy Order
async function buy(amt){
    await fetch('https://api.tdameritrade.com/v1/accounts/skrrrrt', {
        method: 'POST',
        headers: {
            'Authorization': 'candys12',
        },
        form: {
            quantity: amt
        }
    }).then(res => res.json())
    .then(data => {

    });
}

module.exports = { getData, interpret };