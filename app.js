"use strict";

(async () => {

    const API_KEY = 'dab64beddf0b0eb28835141a18654de41cca1a50e950d60876c6d419b46fa709'
    // const CACHE_AGE_IN_SECONDS = 30
    const CACHE_AGE_IN_SECONDS = 9999999
    const progressBarHTML = () => `
            <div id="progress-bar" class="progress-bar-overlay">
                <div class="spinner-border text-primary" role="status" style="width: 4rem; height: 4rem;">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;

    /*        `
                <div class="progress-bar-overlay d-flex justify-content-center align-items-center p-3">
                  <div class="spinner-border text-primary" role="status" style="width: 2rem; height: 2rem;">
                     <span class="visually-hidden">Loading...</span>
                  </div>
                </div>
                `;              */
    const showProgressBar = () => {
        if (!document.getElementById('progress-bar')) {
            document.body.innerHTML += `
            <div id="progress-bar" class="progress-bar-overlay">
                <div class="spinner-border text-primary" role="status" style="width: 4rem; height: 4rem;">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
        } else {
            document.getElementById('progress-bar').style.display = 'flex';
        }
    };

    const hideProgressBar = () => {
        const progress = document.getElementById('progress-bar');
        if (progress) {
            progress.style.display = 'none';
        }
    };
    const getCoinsData = async (url, apiKey) => {
        let data = localStorage.getItem(url)
        if (data) {
            data = JSON.parse(data)
            const { createdAt } = data
            console.log(new Date(createdAt).getTime() + CACHE_AGE_IN_SECONDS * 1000)
            console.log(data)
            if ((new Date(createdAt).getTime() + CACHE_AGE_IN_SECONDS * 1000) > new Date().getTime()) {
                console.log('cache hit')
                console.log(data.data)
                return data.data.data;
            }
        }
        data = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } }).then(response => response.json())
        localStorage.setItem(url, JSON.stringify({ data, createdAt: new Date() }))
        console.log('cache miss')
        console.log(data)
        return data.data
    }
    const getNumOfCoinsData = (tokenData, num) => {
        console.log(!Array.isArray(tokenData))
        if (!Array.isArray(tokenData) || tokenData.length === 0) {
            console.log(`something's wrong, No tokens!!`)
            return [];
        }
        if (num < tokenData.length) {
            return tokenData.slice(0, num);
        }
        else {
            console.log(`there aren't enough tokens in the API, returned max instead`)
            return tokenData
        }
    }
    const drawSingleCoinCardHtml = (name, symbol) => {
        return `
        <div class="col-12 col-sm-4 col-md-3 box" id="${symbol}">
            <div class="card w-100 h-100 position-relative">
                <div class="card-header d-flex align-items-center justify-content-between">
                    <h5 class="card-title mb-0">${symbol}</h5>
                    <div class="form-check form-switch ms-2">
                        <input class="form-check-input" type="checkbox" id="flexSwitchCheckDefault-${symbol}">
                        <label class="form-check-label" for="flexSwitchCheckDefault-${symbol}"></label>
                    </div>
                </div>
                <div class="card-body">
                    <h6 class="card-subtitle">${name}</h6>
                    <br>
                    <a href="#" class="btn btn-primary more-info-btn" data-symbol="${symbol}">More info</a>
                </div>
                <div class="collapse-overlay collapse" id="collapse-${symbol}">
                <button type="button" class="close-collapse-btn" data-symbol="${symbol}">&times;</button>
                    <div class="card card-body p-3" id="info-${symbol}">
                        Loading...
                    </div>
                </div>
            </div>
        </div>
                `
    }
    const generateCoinsHTML = (data, coinSearchValue) => {
        let coinsHtml = ``;
        let htmlSingleCoinCard = ``;
        if (!coinSearchValue) {  //generate all coins in array (already reduced to 100)
            coinsHtml = data.map(({ name, symbol }) => {
                htmlSingleCoinCard = drawSingleCoinCardHtml(name, symbol);
                return htmlSingleCoinCard;
            }).join(``);
            return coinsHtml;
        }
        else {
            const foundCoin = data.find(token => token.symbol == coinSearchValue);
            if (foundCoin !== undefined) {
                return drawSingleCoinCardHtml(foundCoin.name, foundCoin.symbol)
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
        const allCoinsBtn = document.getElementById("show-all-coins");
        if (allCoinsBtn) {  //only when search didn't find anything, otherwise it's null because it doesn't exist (in the DOM)
            allCoinsBtn.addEventListener("click", getAllCoins)
        }
        // Add event listeners for "More info" buttons
        document.querySelectorAll('.more-info-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const symbol = btn.getAttribute('data-symbol');
                const collapseDiv = document.getElementById(`collapse-${symbol}`);
                const infoDiv = document.getElementById(`info-${symbol}`);

                // Toggle collapse
                if (collapseDiv.classList.contains('show')) {
                    collapseDiv.classList.remove('show');
                    return;
                }
                // Hide any other open overlays
                document.querySelectorAll('.collapse-overlay.show').forEach(el => el.classList.remove('show'));

                collapseDiv.classList.add('show');
                // infoDiv.innerHTML = progressBarHTML();
                if (infoDiv) {
                    infoDiv.innerHTML = progressBarHTML();
                }

                try {
                    const tokens = await getCoinsData('https://rest.coincap.io/v3/assets', API_KEY);
                    const coin = tokens.find(token => token.symbol === symbol);
                    if (coin) {
                        infoDiv.innerHTML = `
                        <strong>Name:</strong> ${coin.name}<br>
                        <strong>Symbol:</strong> ${coin.symbol}<br>
                        <strong>Price USD:</strong> $${parseFloat(coin.priceUsd).toFixed(2)}<br>
                        <strong>Market Cap:</strong> $${parseFloat(coin.marketCapUsd).toLocaleString()}<br>
                        <strong>Supply:</strong> ${parseFloat(coin.supply).toLocaleString()}<br>
                    `;
                    } else {
                        infoDiv.innerHTML = "No additional info found.";
                    }
                } catch (err) {
                    infoDiv.innerHTML = "Failed to load info.";
                } finally {
                    hideProgressBar();
                }

            });
        });
        document.querySelectorAll('.close-collapse-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const symbol = btn.getAttribute('data-symbol');
                const collapseDiv = document.getElementById(`collapse-${symbol}`);
                if (collapseDiv) {
                    collapseDiv.classList.remove('show');
                }
            });
        });
    }

    // all coins data for home tab
    const getAllCoins = async () => {
        showProgressBar()
        try {
            const tokens = await getCoinsData('https://rest.coincap.io/v3/assets', API_KEY)
            console.log(tokens)
            const reducedTokens = getNumOfCoinsData(tokens, 100);
            console.log(reducedTokens)
            let html = generateCoinsHTML(reducedTokens)
            renderCoinsHTML(html)
        }
        catch (error) {
            alert(`Woops, something's wrong.. looks like there's a problem with the coins API ${error.message}`)
            // document.getElementById('countries-container').innerHTML = `<h5> Woops, something's wrong.. looks like there's a problem with the coins API ${error.message}</h5>`
        }
        finally {
            hideProgressBar();
        }
    }

    const searchInput = document.getElementById("search-input");
    const searchForm = document.getElementById("search-form");
    console.log("Form element:", document.getElementById("search-form"));


    searchForm.addEventListener("submit", async event => {
        event.preventDefault();
        const coinSearchId = searchInput.value.trim().toUpperCase();
        if (coinSearchId !== "") {
            showProgressBar()
            try {
                const tokens = await getCoinsData('https://rest.coincap.io/v3/assets', API_KEY)
                const reducedTokens = getNumOfCoinsData(tokens, 100);
                let html = generateCoinsHTML(reducedTokens, coinSearchId)
                renderCoinsHTML(html)
            }
            catch (error) {
                alert(`Woops, something's wrong.. looks like there's a problem with the coins API ${error.message}`)
            } finally {
                hideProgressBar();
            }

        }
    })

    searchInput.addEventListener("input", () => {   //if erased the search text input, show all coins again
        if (searchInput.value === "") getAllCoins();
    })

    getAllCoins();
})()