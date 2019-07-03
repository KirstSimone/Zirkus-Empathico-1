

const emotion = {
    ANGRY: "angry",
    ANXIOUS: "anxious",
    JOYFUL: "joyful",
    NEUTRAL: "neutral",
    SAD: "sad",
    SURPRISED: "surprised"
}

var eArray = [[emotion.ANGRY, 3200], [emotion.ANXIOUS, 3400], [emotion.JOYFUL, 3650], 
    [emotion.NEUTRAL, 3100], [emotion.SAD, 3200], [emotion.SURPRISED, 3300]];
let elo = Math.round(eArray.reduce((x, y) => x+y[1], 0) / eArray.length);
const DISTRIBUTE_WEIGHT = [0.2, 0.4, 0.58, 0.74, 0.88, 1];
const DELTA_N = 0.1;
const WANTED_CHANCE = 0.75;
const WANTED_BASE_CHANCES = [2, 3, 4, 5, 6].map(n => (WANTED_CHANCE*n-1)/(n-1));
const LAMBDA = 1/3;
const TIME_MIDDLE = 20;
const TIME_ADJUST = 0;
const ELO_SCALE = 9000;
const ELO_STEEPNESS = 0.003;
const NEEDED_SCORES = WANTED_BASE_CHANCES.map(x => 1/ELO_STEEPNESS * Math.log((ELO_SCALE*x)/(1-x)))
const MAX_TIME = 20;

//simple example
let chosen_emotion = chooseEmotion(eArray);
let task = generateTask(chosen_emotion[0], chosen_emotion[1], elo);
console.log(updateScores(1, task[2], 0));


/**
 * Get the target emotion
 * @author Dan - finished implementing and preliminary testing
 * @todo Unit Testing
 * @param {Array} EmotionScores 
 * @returns {Array} [emotion, emotion score]
 */
function chooseEmotion(eArray) {

    eArray.sort(function(a, b) { //Sort the emotions
        return a[1] - b[1];
      });

    var chosenEmotion = function(emotionArray) {    //Use random and the distribution table to determine the emotion
        rand = Math.random();
        for (i = 0; i < DISTRIBUTE_WEIGHT.length; i++) {
            if(rand < DISTRIBUTE_WEIGHT[i]) {
                return eArray[i];
            }
        }
    }
    return chosenEmotion(eArray);
}

/**
 * determine number of choices, amount of time based on the scores
 * @author Dan, Leonid - finished implementing
 * @todo getTimeConstraint
 * @param {emotion} emotion 
 * @param {Number} emotionScore 
 * @param {Number} userScore 
 * @returns {Array} [number of choices, time constraint, and expected success rate]
 */
function generateTask(emotion, emotionScore, userScore) {

    var result = [];

    // get number of choices based on the userScore
    var computeBaseChoice = function(userScore) {
        if (userScore < NEEDED_SCORES[1]) {
            return 2;
        }
        else if (userScore < NEEDED_SCORES[2]) {
            return 3;
        }
        else if (userScore < NEEDED_SCORES[3]) {
            return 4;
        }
        else if (userScore < NEEDED_SCORES[4]) {
            return 5;
        }
        else {
            return 6;
        }
    }

    // get base success rate using predetermined model/formula with respect to user score
    var computeBaseSuccessRate = (score) => 1 / (1 + ELO_SCALE * Math.exp(-ELO_STEEPNESS * score)); // formula for calculating success rate
    var computeExpectedChoice = (baseChoice, timeConstraint) => (baseChoice - 1) * Math.exp(-1 * DELTA_N * timeConstraint) + 1; // Formula for calculating expected choice
    var computeExpectedSuccessRate = (baseSuccessRate, expectedChoice) => baseSuccessRate + (1 - baseSuccessRate) / expectedChoice; //Formuala for calculating expected success rate
    var baseSuccessRate = computeBaseSuccessRate(userScore);

    result[0] = computeBaseChoice(userScore);
    result[1] = getTimeConstraint(result[0], baseSuccessRate);
    result[2] = getExpectedSuccessRate(emotionScore);
    
    /**
     * get expected success rate using predetermined model/formula with respect to the emotion score
     * @param {Number} emotionScore 
     * @returns {Number} expected success rate
     */    
    function getExpectedSuccessRate(emotionScore) {
        var baseSuccessRate = computeBaseSuccessRate(emotionScore);
        var expectedChoice = computeExpectedChoice(result[0], result[1]);
        var expectedSuccessRate = computeExpectedSuccessRate(baseSuccessRate, expectedChoice);
        return expectedSuccessRate;
    }

    /**   
     * //TODO: This
     * get time constraint
     * @param {Number} NumberOfChoices 
     * @param {Number} baseSuccessRate 
     */
    function getTimeConstraint(NumberOfChoices, baseSuccessRate) {
        let wanted_base_chance = WANTED_BASE_CHANCES[NumberOfChoices-2];
        let timeConstraint = 0;
        if(baseSuccessRate < wanted_base_chance+0.001) {
            timeConstraint = MAX_TIME;
        } else {
            timeConstraint = -TIME_ADJUST + 1/LAMBDA * 
                Math.log(wanted_base_chance * Math.exp(LAMBDA*TIME_MIDDLE) / (baseSuccessRate - wanted_base_chance));
        }
        return timeConstraint;
    }
    
    return result;
}

/**
 * @author Dan - finished implementing and preliminary testing
 * @todo Unit Testing
 * @param {Number} gamesPlayed 
 * @param {Number} expectedSuccessRate 
 * @param {boolean} result  //User result, 0 for incorrect, 1 for correct
 * @returns {Number} change in emotion score
 */
function updateScores(gamesPlayed, expectedSuccessRate, result) {

    //Compute k value
    var computeK = (gamesPlayed) => 10 + 40 * Math.exp(-0.05 * gamesPlayed);
    var k_value = computeK(gamesPlayed);

    
    //Compute the change of emotion score
    var computeChange = (result, successRate) => 
        (result ? 
            k_value * ( 1 - successRate) : 
            -1 * k_value * successRate);
    var change = computeChange(result, expectedSuccessRate);
    
    return change;
}