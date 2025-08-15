"use strict";

(async () => {

    const API_KEY = 'dab64beddf0b0eb28835141a18654de41cca1a50e950d60876c6d419b46fa709'
    // const CACHE_AGE_IN_SECONDS = 30
    const CACHE_AGE_IN_SECONDS = 9999999

    const getCoinsData = async (url, apiKey) => {
        let data = localStorage.getItem(url)
        if (data) {
            data = JSON.parse(data)
            const { createdAt } = data
            console.log(new Date(createdAt).getTime() + CACHE_AGE_IN_SECONDS * 1000)
            console.log(new Date())
            if ((new Date(createdAt).getTime() + CACHE_AGE_IN_SECONDS * 1000) > new Date().getTime()) {
                console.log('cache hit')
                return data
            }
        }
        data = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } }).then(response => response.json())
        localStorage.setItem(url, JSON.stringify({ data: JSON.stringify(data), createdAt: new Date() }))
        console.log('cache miss')
        console.log(data)
        return data
    }
    const getNumOfCoinsData = (tokenData, num) => {
        if (!Array.isArray(tokenData) || tokenData.length === 0) {
            return [];
        }
        const numInArray = Math.min(num, tokenData.length);
        return tokenData.slice(0, numInArray);
    }
    const generateCoinsHTML = ({ data }, coinSearchValue) => {
        const coinsHtml = ``;
        if (!coinSearchValue) {  //generate all coins
            let coinCounter = 0;
            coinsHtml = data.map(({ name, symbol }) => {
                coinCounter++;
                if (coinCounter < 100) {
                    htmlCoinCard = `
                        <div class="col-12 col-sm-4 col-md-3 box" id="${coinCounter}">
                            <div class="card w-100 h-100">
                                <div class="card-header d-flex align-items-center justify-content-between">
                                    <h5 class="card-title mb-0">${symbol}</h5>
                                    <div class="form-check form-switch ms-2">
                                        <input class="form-check-input" type="checkbox" id="flexSwitchCheckDefault-${coinCounter}">
                                        <label class="form-check-label" for="flexSwitchCheckDefault-${coinCounter}"></label>
                                    </div>
                                </div>
                                <div class="card-body">
                                    <h6 class="card-subtitle">${name}</h6>
                                    <br>
                                    <a href="#" class="btn btn-primary">More info</a>
                                </div>
                            </div>
                        </div>
                        `}
                return htmlCoinCard;
            }).join(``);
            return coinsHtml;
        }
        else {
            foundCoin = data.find(() => { });
            if (foundCoin) {

            }
            else {
                return `<h1> No coin's were found, you can try again or 
                    <span id="show-all-coins" style="color:blue; cursor:pointer;"> press here </span>
                    to see all coins</h1>`
            }
        }

    }

    const coinsContainer = document.getElementById("coin-cards");

    const renderCoinsHTML = html => {
        coinsContainer.innerHTML = html;
    }

    // all coins data for home tab
    const getAllCoins = async () => {
        try {
            const tokens = await getCoinsData('https://rest.coincap.io/v3/assets', API_KEY)
            const reducedTokens = getNumOfCoinsData(tokens, 100);
            let html = generateCoinsHTML(reducedTokens)
            renderCoinsHTML(html)
        }
        catch (error) {
            alert(`Woops, something's wrong.. looks like there's a problem with the coins API ${error.message}`)
            // document.getElementById('countries-container').innerHTML = `<h5> Woops, something's wrong.. looks like there's a problem with the coins API ${error.message}</h5>`
        }
    }

    const searchInput = document.getElementById("search-input");
    const searchForm = document.getElementById("search-form");
    const allCoinsBtn = document.getElementById("show-all-coins");
    searchForm.addEventListener("submit", async event => {
        event.preventDefault();
        const coinSearchId = searchInput.value.trim();
        if (coinSearchId !== "") {
            if (!tokens.find(() => { })) {nothing's found}
                else {
                    const html = generateCoinsHTML(tokens);
                    renderCoinsHTML(html);
                }
            }

        })
    searchInput.addEventListener("input", () => {
        if (searchInput.value === "") {
            coinsContainer.innerHTML = getAllCoins();
        }
        allCoinsBtn.addEventListener("click", () => coinsContainer.innerHTML = getAllCoins());

        getAllCoins();

    })()