const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const PORT = 5000;

const app = express();

app.get("/mma", (req, res) => {
  axios.get("https://www.bestfightodds.com/").then((response) => {
    const html = response.data;
    const $ = cheerio.load(html);
    const eventNameRegex = /event\d{4}/g;

    const events = {};
    const eventsIterator = [...html.matchAll(eventNameRegex)];
    const eventsArray = Array.from(eventsIterator.map((element) => element[0]));

    // get data of all the events
    eventsArray.forEach(event => {
        const eventObj = {};

        eventObj["name"] = $(`#${event} > div.table-header > a > h1`).text();

        eventObj["fights"] = [];

        // get all fighters for an event
        const fighters = [];
        $(
        `#${event} > div.table-inner-wrapper > div.table-scroller > table > tbody > tr > th > a > span`
        ).each((index, element) => {
            fighters.push($(element).text());
        });

        // get all oddsmakers for an event
        const oddsmakers = [];
        $(
        `#${event} > div.table-inner-wrapper > div.table-scroller > table > thead > tr > th > a`
        ).each((index, element) => {
            oddsmakers.push($(element).text());
        });

        // group fighters and event odds
        let fighterIndex = 0;
        let fighterTableRow = 1;

        
        while (fighterIndex < fighters.length) {
            const fightObj = {};
            const fighter1 = fighters[fighterIndex];
            const fighter2 = fighters[fighterIndex + 1];

            fightObj["fighters"] = [fighter1, fighter2];
            fightObj["odds"] = {};
            
            // find the row number for fighter
            while (true) {
                const fighterName = $(`#${event} > div.table-inner-wrapper > div.table-scroller > table > tbody > tr:nth-child(${fighterTableRow}) > th > a > span`).text();
                if (fighterName === fighter1) {
                    fighterTableRow++;
                    break;
                }

                fighterTableRow++;
            }

            oddsmakers.forEach((oddsmaker, oddsMakerIndex) => {
                fightObj["odds"][oddsmaker] = {};
                fightObj["odds"][oddsmaker][fighter1] = $(
                `#${event} > div.table-inner-wrapper > div.table-scroller > table > tbody > tr:nth-child(${fighterTableRow}) > td:nth-child(${oddsMakerIndex + 2})`
                )
                .text()
                .slice(0, 4);
                
                fightObj["odds"][oddsmaker][fighter2] = $(
                `#${event} > div.table-inner-wrapper > div.table-scroller > table > tbody > tr:nth-child(${fighterTableRow + 1}) > td:nth-child(${oddsMakerIndex + 2})`
                )
                .text()
                .slice(0, 4);
            });

            fighterIndex += 2;
            eventObj["fights"].push(fightObj);    
        }

        events[event] = eventObj;
    });

    res.json(events);

  }).catch(err => console.log(err));
});

app.listen(PORT, () => console.log(`server running on ${PORT}`));

// odds maker name selector
// #event2320 > div.table-inner-wrapper > div.table-scroller > table > thead > tr > th:nth-child(2) > a

// odds maker value selector
// #event2320 > div.table-inner-wrapper > div.table-scroller > table > tbody > tr:nth-child(1) > td:nth-child(2)

// fighter name selector
// #event2320 > div.table-inner-wrapper > div.table-scroller > table > tbody > tr:nth-child(1) > th > a > span
