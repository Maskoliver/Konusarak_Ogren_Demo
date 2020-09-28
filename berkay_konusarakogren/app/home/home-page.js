require("nativescript-nodeify");
var observableModule = require("tns-core-modules/data/observable");

var Parser = require("xml2js");

var Feed = [];
var mainTitle = "";

function Fetcher() {
    Feed = [];
    fetch("https://www.wired.com/feed/category/science/latest/rss")
        .then((response) => response.text())
        .then((r) => {
            Parser.parseString(r, function (err, result) {
                //Parse the returned xml data to json
                const allFeed = result.rss.channel;
                mainTitle = allFeed[0].title[0];
                //Select top 5 articles from the fetched data
                for (let i = 0; i < 5; i++) {
                    Feed.push({
                        title: allFeed[0].item[i].title[0],
                        desc: allFeed[0].item[i].description[0],
                        photoUrl:
                            allFeed[0].item[i]["media:thumbnail"][0].$.url,
                        link: allFeed[0].item[i].link[0],
                    });
                }
            });
        })
        .catch((e) => {});
}
exports.Fetcher = Fetcher;

//Navigation method to article page, it passes selected articles data
export function onItemTap(args) {
    const index = args.index;
    const item = args.object;
    const page = item.page;
    const myFrame = page.frame;
    const navEntryWithContext = {
        moduleName: "home/article-page",
        context: {
            Feed: Feed[index],
        },
    };
    myFrame.navigate(navEntryWithContext);
}
export function onNavigatingTo(args) {
    var page = args.object;
    Fetcher(); //Calling the method which fetches the rss feed from wired.com
    setTimeout(function () {
        // Wait 1 second to fetch datas before loading the page
        var home = new observableModule.fromObject({
            barTitle: mainTitle,
            articles: Feed,
        });
        page.bindingContext = home;
    }, 1000);
}
