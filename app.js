"use strict";

(async () => {
    console.log(`start of IFFIE ! `)
    const API_KEY = 'dab64beddf0b0eb28835141a18654de41cca1a50e950d60876c6d419b46fa709'
    // const CACHE_AGE_IN_SECONDS = 30
    const CACHE_AGE_IN_SECONDS = 9999999
    const progressBarHTML = () => `
                <div class="spinner-border text-primary" role="status" style="width: 4rem; height: 4rem;">
                    <span class="visually-hidden">Loading...</span>
                </div>
        `;

    const showProgressBar = () => {
        if (document.getElementById('progress-bar')) {
            document.getElementById("progress-bar").innerHTML = progressBarHTML();
            document.getElementById('progress-bar').style.display = 'flex';
        }
    };

    const hideProgressBar = () => {
        const progress = document.getElementById('progress-bar');
        if (progress) progress.style.display = 'none';
    };
    const getCoinsData = async (url, apiKey) => {
        let data = localStorage.getItem(url)
        if (data) {
            data = JSON.parse(data)
            const { data: cachedData, createdAt } = data
            console.log(new Date(createdAt).getTime() + CACHE_AGE_IN_SECONDS * 1000)
            console.log(data)
            if ((new Date(createdAt).getTime() + CACHE_AGE_IN_SECONDS * 1000) > new Date().getTime()) {
                console.log('cache hit, retriveing data from cache')
                console.log(cachedData)
                // console.log(apiData.data)
                return cachedData.data;  //because it's a object with timestamp, and data.
            }
        }
        data = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } }).then(response => response.json())
        data = data.data //.data   ????
        localStorage.setItem(url, JSON.stringify({ data, createdAt: new Date() }))
        console.log('cache miss')
        console.log(data)
        return data.data || data
    }
    const getNumOfCoinsData = (tokenData, num) => {
        console.log(`some one called get num of coins to reduce coins ` + !Array.isArray(tokenData))
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
        console.log(`just before creating HTML, here is the search: ${coinSearchValue}`)
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
                return `<h1> No coin's were found, you can  
                    <span id="show-all-coins" style="color:blue; cursor:pointer;"> press here </span>
                    to see all coins or try again </h1>`
            }
        }

    }

    const renderCoinsHTML = html => {
        const coinsContainer = document.getElementById("coin-cards");
        coinsContainer.innerHTML = html;
        const ShowAllCoinsAgainBtn = document.getElementById("show-all-coins");
        if (ShowAllCoinsAgainBtn) {  //only when search didn't find anything, otherwise it's null because it doesn't exist (in the DOM)
            ShowAllCoinsAgainBtn.addEventListener("click", getAllCoins)
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
                if (infoDiv) {
                    infoDiv.innerHTML = progressBarHTML();
                }

                try {
                    const tokens = await getCoinsData('https://rest.coincap.io/v3/assets', API_KEY);
                    const tokensRates = await getCoinsData('https://rest.coincap.io/v3/rates', API_KEY)
                    const coin = tokens.find(token => token.symbol === symbol);
                    let coinEurRate, coinIlsRate, priceEur, priceIls;
                    if (!Array.isArray(tokensRates)) {
                        console.warn('tokensRates is not an array!', tokensRates);
                    } else {
                        coinEurRate = tokensRates.find(rate => rate.symbol === "EUR");
                        coinIlsRate = tokensRates.find(rate => rate.symbol === "ILS");
                        priceEur = parseFloat(coin.priceUsd) / parseFloat(coinEurRate.rateUsd);
                        priceIls = parseFloat(coin.priceUsd) / parseFloat(coinIlsRate.rateUsd);

                    }
                    console.log(coinEurRate, coinIlsRate)
                    if (coin) {
                        infoDiv.innerHTML = `
                        <strong>Name:</strong> ${coin.name}<br>
                        <strong>Symbol:</strong> ${coin.symbol}<br>
                        <strong>Price USD:</strong> $${Number(parseFloat(coin.priceUsd).toFixed(2)).toLocaleString()}<br>
                        <strong>Price EUR:</strong> ${coinEurRate.currencySymbol}${Number(priceEur.toFixed(2)).toLocaleString()}<br>
                        <strong>Price ILS:</strong> ${Number(priceIls.toFixed(2)).toLocaleString()} ${coinIlsRate.currencySymbol}<br>
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
        console.log(`some one activated get all coins and it's starting to run....`)
        showProgressBar()
        try {
            const tokens = await getCoinsData('https://rest.coincap.io/v3/assets', API_KEY)
            console.log(tokens)
            const reducedTokens = getNumOfCoinsData(tokens, 99);
            console.log(reducedTokens)
            let html = generateCoinsHTML(reducedTokens)
            console.log(`some one activated get all coins and it's almost finished this is html:`);
            renderCoinsHTML(html)
        }
        catch (error) {
            alert(`Woops, something's wrong.. looks like there's a problem with the coins API ${error.message}`)
        }
        finally {
            hideProgressBar();
        }
    }

    const searchInput = document.getElementById("search-input");
    const searchForm = document.getElementById("search-form");
    searchForm.addEventListener("submit", async event => {
        event.preventDefault();
        console.log(`searchhhhhhhhhhhhhhhhhhhhh`)
        const coinSearchId = searchInput.value.trim().toUpperCase();
        if (coinSearchId !== "") {
            showProgressBar()
            try {
                const tokens = await getCoinsData('https://rest.coincap.io/v3/assets', API_KEY)
                const reducedTokens = getNumOfCoinsData(tokens, 99);
                let html = generateCoinsHTML(reducedTokens, coinSearchId)
                console.log(html)
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

    let activeToggles = [];
    document.addEventListener("change", (event) => {
        if (event.target.classList.contains("form-check-input")) {
            const checkbox = event.target;
            const symbol = checkbox.id.replace("flexSwitchCheckDefault-", "");

            if (checkbox.checked) {
                handleToggleOn(symbol, checkbox);
            } else {
                handleToggleOff(symbol);
            }
        }
    });
    function handleToggleOn(symbol, checkbox) {
        if (activeToggles.length >= 5) {
            checkbox.checked = false; // immediately revert
            showLimitModal(symbol);
            return;
        }

        activeToggles.push(symbol);
        updateLiveReports();
    }
    function handleToggleOff(symbol) {
        activeToggles = activeToggles.filter(s => s !== symbol);
        updateLiveReports();
    }
    function showLimitModal(newSymbol) {
        const modalBody = document.getElementById("checked-coins");
        modalBody.innerHTML = activeToggles.map(sym => `
                                                    <tr>
                                            <th> ${sym} &nbsp&nbsp</th>
                                            <th> <button class="btn btn-sm btn-danger remove-toggle" data-symbol="${sym}">Remove</button> </th>
                                                    </tr> ` ).join("");

        const modal = new bootstrap.Modal(document.getElementById("limit-modal"));
        modal.show();

        // add click listeners for "Remove" buttons
        modalBody.querySelectorAll(".remove-toggle").forEach(btn => {
            btn.addEventListener("click", () => {
                handleToggleOff(btn.dataset.symbol);
                document.getElementById(`flexSwitchCheckDefault-${btn.dataset.symbol}`).checked = false;
                document.getElementById(`flexSwitchCheckDefault-${newSymbol}`).checked = true;
                handleToggleOn(newSymbol, document.getElementById(`flexSwitchCheckDefault-${newSymbol}`));
                modal.hide();
            });
        });
    }
    function updateLiveReports() {
        const container = document.getElementById("live-reports-container");
        container.innerHTML = activeToggles.map(s => `<div>${s}</div>`).join("");
    }



    getAllCoins();
    console.log(`last`)
})()