// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                              Chapter 4
//
//                             Highscores
//
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const GameHighscores = (function(){
// __________________________________________________________________
//      Scoreboard Viewer
// ==================================================================
const ScoreboardViewer = (function(){

    const q = document.querySelector.bind(document);
    const SCOREBOARD_BACKGROUND  = q("#scoreboard_background")
    const SCOREBOARD_ELEMENT     = q("#scoreboard_body")
    const SCOREBOARD_TITLE       = q("#scoreboard_title")
    const SCOREBOARD_HIDE_BUTTON = q("#scoreboard_button_hide")

    function init() {
        SCOREBOARD_HIDE_BUTTON.addEventListener('click', hide)
    }

    function addEntry(name, score, time) {
        time = (new Date(time)).toLocaleTimeString() + ', ' + (new Date(time)).toDateString()
        let col_score = document.createElement('td');
        let col_name  = document.createElement('td');
        let col_time  = document.createElement('td');
        col_score.innerText = score;
        col_name.innerText  = name;
        col_time.innerText  = time;
        let row = document.createElement('tr');
        row.appendChild(col_name)
        row.appendChild(col_score)
        row.appendChild(col_time)
        SCOREBOARD_ELEMENT.appendChild(row)
    }

    function clear() {
        SCOREBOARD_ELEMENT.innerHTML = '';
    }

    function refresh(data) {
        if (!data) {
            return
        }
        clear()
        SCOREBOARD_TITLE.innerText = data.Title
        if (!data.Entries || data.Entries == null) {
            return
        }
        for (entry of data.Entries) {
            addEntry(entry.Name, entry.Score, entry.Time)
        }
    }

    function hide() {
        SCOREBOARD_BACKGROUND.classList.add('hidden')
    }

    function show() {
        SCOREBOARD_BACKGROUND.classList.remove('hidden')
    }

    return {
        init,    // initialize event listeners.
        refresh, // fn(dataCache) : updates the board with new data.
        hide,    // hides the board from view.
        show,    // displays the board.
    }
}())



// __________________________________________________________________
//      Highscores Client
// ==================================================================
const GameHighscoresClient = (function(){

    const SERVER_LOCATION = "https://thebachend.com/scoreboard"
    let dataCache = {};     // saved data from a GET request goes here.
    let cacheOkay = false;  // true if the values in dataCache are valid.

    function init() {
        ScoreboardViewer.init();
        update()
    }

    // refetch scoreboard data and save it into the cache if successful.
    function update(fn) {
        getBoardData(SERVER_LOCATION, function(incomingData){
            dataCache = incomingData.Scoreboard;
            cacheOkay = true;
            ScoreboardViewer.refresh(dataCache)
            if (fn !== undefined) {
                fn()
            }
        })
    }

    // Returns true if the score is high enough to be added to the scoreboard.
    // Returns false if there are any problems connecting to server, or if the
    // score is not high enough to be added.
    function checkScore(score) {
        if (cacheOkay !== true) {
            return false
        }
        if (dataCache.Entries === null || dataCache.Entries.length < dataCache.MaxEntries){
            return true
        }
        for (entry of dataCache.Entries) {
            if (score > entry.Score) {
                return true
            }
        }
        return false
    }

    function isConnected() {
        return server_status
    }

    function submitScore(name, score, fn) {
        postScore(SERVER_LOCATION, name, score, fn)
    }

    /**
     * getBoardData
     * Send a GET request to the scoreboard server, retrieving the current scores.
     * @param  {String} address                URL of scoreboard.
     * @param  {Function} processDataFunction  fn(Object) called on success.
     */
    function getBoardData(address, processDataFunction) {
        fetch(address, {
            method: "GET",
        })
        .then(response => {
            return response.json();
        })
        .then(myJson => {
            // console.log(JSON.stringify(myJson));
            if (processDataFunction !== undefined) {
                processDataFunction(myJson);
            }
        });
    }

    /**
     * postScore
     * sends a POST request to the scoreboard, adding a new entry to the highscores,
     * The server may decide not to add the score if it's not high enough compared
     * to the others.
     * @param  {String} address URL of scoreboard
     * @param  {String} name    part of score entry: username of player
     * @param  {Number} score   part of score entry: Integer score of player
     * @param  {Function} fn    (Reponse) calls after POST request finishes.
     */
    function postScore(address, name, score, fn) {
        fetch(address, {
            method: "POST",
            mode: "cors",
            body: JSON.stringify({name, score}),
            headers: { 'Content-Type': 'application/json;charset=UTF-8' }
        })
        .then(r => {
            console.log("Request complete! response:", r);
            if (fn !== undefined) {
                fn(r);
            }
        });
    }

    init();

    return {
        isConnected, // returns true if the highscores server can be reached.
        checkScore,  // returns true if your score is good enough.
        submitScore, // send a score to the server.
        update,      // fetches scores and updates the score displayer
    }
}())



// __________________________________________________________________
//      Score Prompt
// ==================================================================
// the thing that says "congrats! add your name to the highscores".
//
const ScorePrompt = (function() {
    const q = document.querySelector.bind(document);
    const PROMPT_BACKGROUND = q("#score_prompt_background");
    const PROMPT_TEXT       = q("#score_prompt_text");
    const PROMPT_SUBMIT     = q("#score_prompt_submit");
    const PROMPT_CLOSE      = q("#score_prompt_close");

    let prompt_ready = false;
    let saved_score = -1;

    function init() {
        PROMPT_CLOSE.addEventListener('click', hide)
        PROMPT_SUBMIT.addEventListener('click', submit)
    }

    function open(score) {
        if (Number.isInteger(score) !== true) {
            hide()
            return
        }
        prompt_ready = true;
        saved_score = score;
        show()
    }

    function submit() {
        if (prompt_ready !== true) {
            hide()
            return
        }
        prompt_ready = false
        hide()
        let name = PROMPT_TEXT.value
        let score = saved_score
        PROMPT_TEXT.value = ""
        saved_score = -1
        GameHighscoresClient.submitScore(name, score, function(){
            GameHighscoresClient.update()
            ScoreboardViewer.show()
        })
    }

    function hide() {
        PROMPT_BACKGROUND.classList.add('hidden')
    }

    function show() {
        PROMPT_BACKGROUND.classList.remove('hidden')
    }

    init()

    return {
        init,    // initialize event listeners.
        open,    // fn(score) the prompt after confirming you have a winning score.
        hide,    // hide the prompt from view (shouldn't need to call this)
    }
}());

// called when you win a game: checks the highscores to see if you deserve
// a spot on the scoreboard.  If you deserve a place on the board & assuming
// the server is working, the provided function, fn, is called.
function handle(score) {
    GameHighscoresClient.update(function() {
        if (GameHighscoresClient.checkScore(score) === true) {
            console.log(`${score} is a winning score! opening prompt`)
            ScorePrompt.open(score)
        }
    })
}

return {
    handle
}

}()); // END GameHighscores
