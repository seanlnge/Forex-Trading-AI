const { getData, interpret } = require('./data');
const deepCopy = (obj) => { return JSON.parse(JSON.stringify(obj)); }

let parentCurr = 'USD'
let childCurr = 'EUR'
let comp;
let budget = 1000;
let botCount = 100;

async function main(){
    while(true){
        let week = await getData(parentCurr, childCurr, false);
        comp = interpret(week);
        console.log('Starting Evolution');

        for(let i=0; i<3; i++) bot = evolve(bot, 100, i).slice(-1)[0];
        console.log(bot);

        let evmoney = test(bot) - budget;

        console.log("In evolving this bot made " + evmoney + " profit.");
        
        let testing = await getData(parentCurr, childCurr, true);
        comp = interpret(testing);
        let money = test(bot);
        let profit = money - budget;

        console.log("In testing this bot made " + profit + " profit.");

        console.log("\n\n\nRunning Bot");
        
        // Loop Over Function
        budget = await runRealTime(budget);
    }
}

let bot = {
    buyAbvBlng: [1, 0],
    buyBlwBlng: [1, 0],
    buyAbvMean: [1, 0],
    buyBlwMean: [1, 0],
    buyAbvEma: [1, 0],
    buyBlwEma: [1, 0],
    buySmaEma: [1, 0],
    buyEmaSma: [1, 0],
    buyStcGood: [1, 0],
    buyStcBad: [1, 0],
    buyCci: [1, 0],
    buyConsAbv: [1, 0],
    buyConsBlw: [1, 0],

    sellAbvBlng: [1, 0],
    sellBlwBlng: [1, 0],
    sellAbvMean: [1, 0],
    sellBlwMean: [1, 0],
    sellAbvEma: [1, 0],
    sellBlwEma: [1, 0],
    sellSmaEma: [1, 0],
    sellEmaSma: [1, 0],
    sellStcGood: [1, 0],
    sellStcBad: [1, 0],
    sellCci: [1, 0],
    sellConsAbv: [1, 0],
    sellConsBlw: [1, 0],
}

function evolve(bot, generations, curr){
    let bots = [];
    for(let i=0; i<botCount; i++) bots.push(deepCopy(bot));

    for(let i=1; i<=generations; i++){
        if(i % 10 == 0){
            console.log('Running Generation ' + (i + curr*generations));
        }
        bots.forEach(bot => bot.money = test(bot));
        bots.sort((a, b) => a.money - b.money);
        bots.splice(0, Math.floor(bots.length/2));

        let next = [];
        bots.forEach(bot => {
            let nbot = deepCopy(bot);
            let nbot2 = deepCopy(bot);
            
            Object.keys(bot).forEach(val => {
                if(val !== 'money'){
                    nbot[val][0] += (Math.random()-0.5) * 5 / i;
                    nbot[val][1] += (Math.random()-0.5) * 5 / i;
                    nbot2[val][0] += (Math.random()-0.5) * 5 / i;
                    nbot2[val][1] += (Math.random()-0.5) * 5 / i;
                }
                nbot.money = budget;
                nbot2.money = budget;
            });

            next.push(nbot, nbot2);
        });

        bots = next;
    }

    return bots;
}

function test(data){
    let money = budget;
    let units = 0;
    
    for(let span of comp){
        let buy = 0;
        let sell = 0;

        buy += data.buyBlwBlng[0] * span.blwlower + data.buyBlwBlng[1];
        buy += data.buyAbvBlng[0] * span.abvupper + data.buyAbvBlng[1];
        buy += data.buyBlwMean[0] * span.blwmean + data.buyBlwMean[1];
        buy += data.buyAbvMean[0] * span.abvmean + data.buyAbvMean[1];
        buy += data.buyBlwEma[0] * span.blwema + data.buyBlwEma[1];
        buy += data.buyAbvEma[0] * span.abvema + data.buyAbvEma[1];
        buy += data.buySmaEma[0] * span.smaema + data.buySmaEma[1];
        buy += data.buyEmaSma[0] * span.emasma + data.buyEmaSma[1];
        buy += data.buyStcGood[0] * span.stcgood + data.buyStcGood[1];
        buy += data.buyStcBad[0] * span.stcbad + data.buyStcBad[1];
        buy += data.buyCci[0] * span.cci + data.buyCci[1];
        buy += data.buyConsAbv[0] * span.consabv + data.buyConsAbv[1];
        buy += data.buyConsBlw[0] * span.consblw + data.buyConsBlw[1];

        sell += data.sellBlwBlng[0] * span.blwlower + data.sellBlwBlng[1];
        sell += data.sellAbvBlng[0] * span.abvupper + data.sellAbvBlng[1];
        sell += data.sellBlwMean[0] * span.blwmean + data.sellBlwMean[1];
        sell += data.sellAbvMean[0] * span.abvmean + data.sellAbvMean[1];
        sell += data.sellBlwEma[0] * span.blwema + data.sellBlwEma[1];
        sell += data.sellAbvEma[0] * span.abvema + data.sellAbvEma[1];
        sell += data.sellSmaEma[0] * span.smaema + data.sellSmaEma[1];
        sell += data.sellEmaSma[0] * span.emasma + data.sellEmaSma[1];
        sell += data.sellStcGood[0] * span.stcgood + data.sellStcGood[1];
        sell += data.sellStcBad[0] * span.stcbad + data.sellStcBad[1];
        sell += data.sellCci[0] * span.cci + data.sellCci[1];
        sell += data.sellConsAbv[0] * span.consabv + data.sellConsAbv[1];
        sell += data.sellConsBlw[0] * span.consblw + data.sellConsBlw[1];

        if(buy > sell){
            if(money > span.price){
                let amount = Math.floor(money / span.price);
                money %= span.price;
                units = amount;
            }
        } else {
            if(units > 0){
                money += units * span.price;
                units = 0;
            }
        }
    }

    money += units * comp.slice(-1)[0].price;

    return money;
}

async function runRealTime(money){
    let units = 0;

    for(let i=0; i<7200; i++){
        await sleep(12000);

        let span = await getData(parentCurr, childCurr, true);
        span = interpret(span).slice(-1)[0];
        let data = await deepCopy(bot);

        // Check a Sell or Buy
        let buy = 0;
        let sell = 0;

        buy += data.buyBlwBlng[0] * span.blwlower + data.buyBlwBlng[1];
        buy += data.buyAbvBlng[0] * span.abvupper + data.buyAbvBlng[1];
        buy += data.buyBlwMean[0] * span.blwmean + data.buyBlwMean[1];
        buy += data.buyAbvMean[0] * span.abvmean + data.buyAbvMean[1];
        buy += data.buyBlwEma[0] * span.blwema + data.buyBlwEma[1];
        buy += data.buyAbvEma[0] * span.abvema + data.buyAbvEma[1];
        buy += data.buySmaEma[0] * span.smaema + data.buySmaEma[1];
        buy += data.buyEmaSma[0] * span.emasma + data.buyEmaSma[1];
        buy += data.buyStcGood[0] * span.stcgood + data.buyStcGood[1];
        buy += data.buyStcBad[0] * span.stcbad + data.buyStcBad[1];
        buy += data.buyCci[0] * span.cci + data.buyCci[1];
        buy += data.buyConsAbv[0] * span.consabv + data.buyConsAbv[1];
        buy += data.buyConsBlw[0] * span.consblw + data.buyConsBlw[1];

        sell += data.sellBlwBlng[0] * span.blwlower + data.sellBlwBlng[1];
        sell += data.sellAbvBlng[0] * span.abvupper + data.sellAbvBlng[1];
        sell += data.sellBlwMean[0] * span.blwmean + data.sellBlwMean[1];
        sell += data.sellAbvMean[0] * span.abvmean + data.sellAbvMean[1];
        sell += data.sellBlwEma[0] * span.blwema + data.sellBlwEma[1];
        sell += data.sellAbvEma[0] * span.abvema + data.sellAbvEma[1];
        sell += data.sellSmaEma[0] * span.smaema + data.sellSmaEma[1];
        sell += data.sellEmaSma[0] * span.emasma + data.sellEmaSma[1];
        sell += data.sellStcGood[0] * span.stcgood + data.sellStcGood[1];
        sell += data.sellStcBad[0] * span.stcbad + data.sellStcBad[1];
        sell += data.sellCci[0] * span.cci + data.sellCci[1];
        sell += data.sellConsAbv[0] * span.consabv + data.sellConsAbv[1];
        sell += data.sellConsBlw[0] * span.consblw + data.sellConsBlw[1];

        if(buy > sell){
            if(money > span.price){
                let amount = Math.floor(money / span.price);
                money %= span.price;
                units = amount;
            }
        } else {
            if(units > 0){
                money += units * span.price;
                units = 0;
            }
        }
        
        let unitsValue = units * span.price;
        console.log(`\n  €${units} ($${unitsValue.toFixed(2)})    Buy: ${buy.toFixed(2)}  Sell: ${sell.toFixed(2)}  Value: ${(money + unitsValue).toFixed(2)}`);
    }

    return money;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

main();