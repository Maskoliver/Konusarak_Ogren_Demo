require("nativescript-nodeify");
var observableModule = require("tns-core-modules/data/observable");

var article = "Loading page..."; //article text field
var Feed = []; //required data of the article
var trTopFive = ""; // top 5 used words in the article in turkish
var engTopFive = ""; // top 5 used words in the article in english

//Main function
export function onNavigatingTo(args) {
    const page = args.object;
    const navigationContext = page.navigationContext; // Get data passed from the home page
    loadData(navigationContext.Feed.link); // send article link to the loadData function
    setTimeout(function () {
        // Wait 1.5 second to looad data before page loads
        var home = new observableModule.fromObject({
            barTitle: navigationContext.Feed.title,
            imgSrc: navigationContext.Feed.photoUrl,
            article: article,
            trTopFive: trTopFive,
            engTopFive: engTopFive,
        });

        page.bindingContext = home;
    }, 2000);
}

export function goBack(args) {
    const item = args.object;
    const page = item.page;
    const myFrame = page.frame;
    myFrame.goBack();
}

//This function is getting the article from the article link
export function loadData(link) {
    //feches the HTML code of the article page
    fetch(link)
        .then((response) => response.text())
        .then((r) => {
            //Finds the kind of beginning of the article in the HTML code
            var startIndex = r.indexOf(
                '<div class="grid--item body body__container article__body grid-layout__content">'
            );
            //Finds the kind of the end of the article in the HTML code
            var endIndex = r.indexOf("grid--item grid-layout__aside");
            //Slices the wanted piece from the full HTML code
            var strippedInfo = r.slice(startIndex, endIndex);
            //Narrows the unwanted data
            let info = strippedInfo.match(
                /(?<=\<div class="grid--item body body__container article__body grid-layout__content">).*(?=\<\/div>)/
            )[0];
            //Clears the unwanted HTML code from the article and gives the full article text
            article = info.replace(/(<([^>]+)>)/gi, "");

            //Calls the wordCounter method to find 5 top used words in the article text
            wordCounter(article);
        })
        .catch((er) => {
            console.log(er);
        });
}

function wordCounter(txt) {
    //Translates all of the article in to lower case
    txt = txt.toLowerCase();
    var wordsArray = txt.split(/\s+/);
    var wordsMap = {};
    //Transfering the words in to hashmap to find count of each used word
    wordsArray.forEach(function (key) {
        if (wordsMap.hasOwnProperty(key)) {
            wordsMap[key]++;
        } else {
            wordsMap[key] = 1;
        }
    });
    // Translates the hashmap to object array
    var finalWordsArray = [];
    finalWordsArray = Object.keys(wordsMap).map(function (key) {
        return {
            name: key,
            total: wordsMap[key],
        };
    });
    //Sorts the array according to the usage count of the words
    finalWordsArray.sort(function (a, b) {
        return b.total - a.total;
    });
    var topFive = [];
    //Gets the top 5 words in the array and excludes words like 'the','is','and' etc...
    for (let index = 0; index < finalWordsArray.length; index++) {
        var name = finalWordsArray[index].name;
        // Bütün çıkarmam gereken ingilizce sözcükler aklıma gelmedi,eksik varsa Kusura bakmayın :)
        if (
            name == "the" ||
            name == "would" ||
            name == "will" ||
            name == "are" ||
            name == "an" ||
            name == "at" ||
            name == "on" ||
            name == "this" ||
            name == "is" ||
            name == "of" ||
            name == "and" ||
            name == "in" ||
            name == "a" ||
            name == "to" ||
            name == "that" ||
            name == "can" ||
            name == "for" ||
            name == "by" ||
            name == "have" ||
            name == "has" ||
            name == "as" ||
            name == "be" ||
            name == "do" ||
            name == "don't" ||
            name == "wont" ||
            name == "dont" ||
            name == "could"
        ) {
            //Do nothing
        } else {
            topFive.push(finalWordsArray[index]);
            if (topFive.length == 5) {
                break;
            }
        }
    }

    //Creates the api call string
    var translateStr =
        "https://microsoft-azure-translation-v1.p.rapidapi.com/translate?from=en&to=tr&text=";
    //Clears the top 5 string for next usage
    engTopFive = "";

    //Combines the values of the top 5 words in one string
    for (let index = 0; index < topFive.length; index++) {
        translateStr += topFive[index].name + " , ";
        engTopFive += topFive[index].name + " , ";
    }
    //Removes the last ',' at the end
    engTopFive = engTopFive.slice(0, engTopFive.length - 1);

    //Calls the translate method for translating top 5 words to Turkish
    translate(translateStr);
}

function translate(incData) {
    var data = null;
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === this.DONE) {
            //Gets the translation response and clears the unwanted XML code from it
            var myResp = this.responseText.replace(/(<([^>]+)>)/gi, "");
            //Removes the ',' at the end
            trTopFive = myResp.slice(0, myResp.length - 1);
        }
    });

    xhr.open("GET", incData);
    xhr.setRequestHeader(
        "x-rapidapi-host",
        "microsoft-azure-translation-v1.p.rapidapi.com"
    );
    xhr.setRequestHeader(
        "x-rapidapi-key",
        "52cbed4680mshaf698806a386b3dp11af3cjsn78459ae553a4"
    );
    xhr.setRequestHeader("accept", "application/json");

    xhr.send(incData);
}
