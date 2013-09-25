var fs = require('fs');

var cheerio = require('cheerio');
var _ = require('underscore');
_.mixin( require('underscore.deferred') );
var Twit = require('twit');
var T = new Twit({
  consumer_key:         process.env['CONSUMER_KEY'],
  consumer_secret:      process.env['CONSUMER_SECRET'],
  access_token:         process.env['ACCESS_TOKEN'],
  access_token_secret:  process.env['ACCESS_TOKEN_SECRET']
});

var paragraphObject = null;

Array.prototype.pick = function() {
  return this[Math.floor(Math.random()*this.length)];
};

Array.prototype.pickRemove = function() {
  var index = Math.floor(Math.random()*this.length);
  return this.splice(index,1)[0];
};

// ### `getRandomBetween`
// Generates a random integer between two numbers
// @param min <number> - the minimum number to return
// @param max <number> - the maximum number to return
// @returns <number> the integer pseudo-randomly generated >= min and <= max
function getRandomBetween( min, max ) {

  return Math.floor( ( Math.random() * ( max - min + 1 ) ) + min );

}

function getSentenceArray( paragraph$Obj ) {

  var objLength = paragraph$Obj.length;


  return paragraph$Obj.eq( getRandomBetween(0, objLength - 1) ).text().split('.');

}

function getRandomSentence( paragraphArray ) {

  var arrLength = paragraphArray.length;

  var sentence = paragraphArray[ getRandomBetween(0, arrLength - 1)];
  var sentenceLength = sentence.length;

  if ( sentenceLength >= 20 && sentenceLength < 140 ) {

    // If the sentence does NOT end in a non-word character, add a period
    if ( !/\W$/.test( sentence ) ) {
      sentence += '.';
    }

    return sentence;
  }

  return getRandomSentence(getSentenceArray(paragraphObject));
}

function generate() {
  var dfd = new _.Deferred();
  var filePath = 'TheYoungerEdda.html';

  fs.readFile( filePath, 'utf8', function(error, data) {
    if (!error) {
      var result = '';
      var $ = cheerio.load(data);

      // parse stuff and resolve
      // Remove extra elements
      $('a').remove();
      $('span' ).remove();

      paragraphObject = $('p');

      result = getRandomSentence( getSentenceArray( paragraphObject ) );

      dfd.resolve(result);
    }
    else {
      dfd.reject();
    }
  });

  return dfd.promise();
}

function tweet() {
  generate().then(function(myTweet) {
    T.post('statuses/update', { status: myTweet }, function(err, reply) {
      if (err) {
        console.log('error:', err);
      }
      else {
        console.log('reply:', reply);
      }
    });
  });
}

// Tweet every 180 minutes
setInterval(function () {
  try {
    tweet();
  }
  catch (e) {
    console.log(e);
  }
}, 1000 * 60 * 60 * 3);

// Tweet once on initialization
tweet();
