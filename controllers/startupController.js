//this code is a gigantic mess but it is only intended to ever be run once, to process the raw data JSON and populate the DB
//once i finish this and use it i will likely never need it again. if it is still in the project it is just for posterity
//the code elsewhere should be much cleaner. please do not hold the content of this controller against me

const fs = require('fs');
const Match = require('./../models/match');
const Show = require('./../models/show');
const Title = require('./../models/title');
const TitleProxy = require('./../models/titleProxy');
const TitleReign = require('./../models/titleReign');
const Wrestler = require('./../models/wrestler');
const APIFeatures = require('./../utils/apiFeatures');

exports.importData = async (req, res) => {
  try {
    const sourceData = JSON.parse(
      fs.readFileSync(`./source/allShows.json`, 'utf-8')
    );

    const limit = sourceData.length;
    // const limit = 50;
    for (let i = 0; i < limit; i++) {
      const wresFound = new Map();
      const source = sourceData[i];
      const matches = source.matches;
      // console.log(source);
      var newShow = {
        name: source.show,
        date: source.date,
        location: source.location,
        ppv: source.ppv,
        matches: [],
        links: [],
      };
      newShow = await Show.create(newShow);
      for (let match of matches) {
        //FIRST: combine the winner and participant lists to get a big list of wrestler names
        const allWrestlers = match.winner.concat(match.participants);
        const wrestlersToCheck = [];
        //check for nested arrays (ie teams)
        for (let wrestler of allWrestlers) {
          if (Array.isArray(wrestler)) {
            for (let w2 of wrestler) {
              wrestlersToCheck.push(w2);
            }
          } else {
            wrestlersToCheck.push(wrestler);
          }
        }
        //run through list of names, check if they're in DB, if not make them
        for (let w of wrestlersToCheck) {
          if (w.includes('(c)')) {
            //make sure the c for champion isn't in this list
            w = w.replace(' (c)', '');
          }
          if (!wresFound.has(w)) {
            var wresIn = await Wrestler.findOne().where('name').equals(w);
            if (!wresIn) {
              wresIn = await Wrestler.create({
                name: w,
                moves: [],
                titles: [],
              });
            }
            //make map of names to IDs so we can add them back in to the match later
            wresFound.set(wresIn.name, wresIn._id);
          }
        }
        //if match has a title, check if it's in DB, if not create it
        var beltProxy = undefined;
        var belts = [];
        var needsChange = undefined;
        var retained = [];
        if (match.title.length > 0) {
          for (let t of match.title) {
            var belt = await Title.findOne().where('name').equals(t.name);
            if (!belt) {
              belt = await Title.create({
                name: t.name,
              });
              //if we're making a new title we can presume it needs a new title reign
              //do some manual checks later for outside belts (ROH, IWGP, etc)
              //create reign object now, don't create it until the end - gonna need MANY IDS
            }
            belts.push(belt);
            if (t.change) {
              needsChange = belt._id;
            } else {
              retained.push(belt._id);
            }
            //also start the creation of a titleProxy, which will also need MANY IDS
            beltProxy = {
              title: belt._id,
            };
          }
        }
        var preshow = false;
        if (match.matchType.includes('pre-show ')) {
          preshow = true;
          match.matchType = match.matchType.replace('pre-show ', '');
        }

        var newMatch = {
          winner: match.winner,
          result: match.result,
          loser: match.participants,
          time: match.time,
          matchType: match.matchType,
          title: [],
          mainEvent: match.mainEvent,
          preshow: preshow,
          show: newShow._id,
        };
        if (belts.length > 0) {
          newMatch.title = belts;
        }

        //NOW. iterate thru match winner, then match participants. find names and replace them with IDs
        //if either one has (c), then there's probably a reign - save ids in winnerC and loserC arrays
        //after that, create the match so we have its ID for reigns and proxies
        // IF LOSERC: check for reign for NEEDSCHANGE with loserC as champion
        // IF WINNERC: check for reigns for each id in RETAINED with winnerC as champion

        //should be arrays of IDs
        var winners = [];
        var losers = [];
        var winnerC = [];
        var loserC = [];
        for (let w of newMatch.winner) {
          if (Array.isArray(w)) {
            var innerWinners = [];
            for (let w2 of w) {
              if (w2.includes('(c)')) {
                innerWinners.push(wresFound.get(w2.replace(' (c)', '')));
                winnerC.push(wresFound.get(w2.replace(' (c)', '')));
              } else {
                innerWinners.push(wresFound.get(w2));
              }
            }
            winners.push(innerWinners);
          } else {
            if (w.includes('(c)')) {
              winners.push(wresFound.get(w.replace(' (c)', '')));
              winnerC.push(wresFound.get(w.replace(' (c)', '')));
            } else {
              winners.push(wresFound.get(w));
            }
          }
        }
        for (let w of newMatch.loser) {
          var innerLosers = [];
          if (Array.isArray(w)) {
            for (let w2 of w) {
              if (w2.includes('(c)')) {
                var wPush = wresFound.get(w2.replace(' (c)', ''));
                if (wPush !== null) {
                  innerLosers.push(wPush);
                  loserC.push(wPush);
                }
              }
              if (wresFound.get(w2) !== null) {
                innerLosers.push(wresFound.get(w2));
              }
            }
            losers.push(innerLosers);
          } else {
            if (w.includes('(c)')) {
              var wPush = wresFound.get(w.replace(' (c)', ''));
              if (wPush !== null) {
                innerLosers.push(wPush);
                loserC.push(wPush);
              }
            }
            innerLosers.push(wresFound.get(w));
            losers.push(innerLosers);
          }
        }

        newMatch.winner = winners;
        //i can't figure out why but some of the loser arrays are getting null as a second value! it shouldnt do that!!!
        for (let l of losers) {
          var nullIndex = l.indexOf(null);
          if (nullIndex > -1) {
            l.splice(nullIndex, 1);
          }
        }
        newMatch.loser = losers;
        //time to create the match so we have its ID
        newMatch = await Match.create(newMatch);
        if (beltProxy) {
          beltProxy.match = newMatch._id;
        }
        if (belts.length > 0) {
          var oldReign = undefined;
          var newReign = undefined;
          //here's where we manage existing and new reigns
          //if loserC or winnerC, then you know someone was champion coming in, and there should be an existing reign
          if (loserC.length > 0 || winnerC.length > 0) {
            //IF winnerC, find open reign for winner
            for (let b of retained) {
              oldReign = await TitleReign.findOne({
                title: b,
                champion: winnerC,
                endShow: { $exists: false },
              });
              if (oldReign) {
                oldReign.defenses.push(newMatch._id);
                oldReign = await TitleReign.findByIdAndUpdate(
                  oldReign._id,
                  oldReign
                );
                beltProxy.reignIn = oldReign._id;
              } else {
                //if no existing reign but it IS retained, just make a reign anyway
                newReign = await TitleReign.create({
                  title: b,
                  champion: winnerC,
                  startShow: newShow._id,
                  defenses: [newMatch._id],
                });
                var belt = await Title.findById(newReign.title);
                belt.reigns.push(newReign._id);
                Title.findByIdAndUpdate(belt._id);
                beltProxy.reignOut = newReign._id;
              }
            }
            if (needsChange) {
              // console.log(`QUERYING ${needsChange} | ${loserC[0]}`);
              //check if there's an existing title reign
              oldReign = await TitleReign.findOne({
                title: needsChange,
                champion: loserC,
                endShow: { $exists: false },
              });
              if (oldReign) {
                oldReign.endShow = newShow._id;
                oldReign.defenses.push(newMatch._id);
                oldReign = await TitleReign.findByIdAndUpdate(
                  oldReign._id,
                  oldReign
                );
                beltProxy.reignIn = oldReign._id;
              }
              var belt = await Title.findById(needsChange);
              if (belt.name.includes('Dynamite Diamond Ring')) {
                newReign = await TitleReign.create({
                  title: needsChange,
                  champion: newMatch.winner,
                  startShow: newShow._id,
                  endShow: newShow._id,
                  defenses: [newMatch._id],
                });
              } else {
                newReign = await TitleReign.create({
                  title: needsChange,
                  champion: newMatch.winner,
                  startShow: newShow._id,
                  defenses: [newMatch._id],
                });
              }
              belt.reigns.push(newReign._id);
              Title.findByIdAndUpdate(belt._id, belt);
              beltProxy.reignOut = newReign._id;
            }
          } else {
            //if NO WINNERC OR LOSERC, then it's the first run, just create a reign
            var belt = await Title.findById(needsChange);
            if (!belt) {
              console.log(`NEEDSCHANGE: ${needsChange}`);
              console.log(`MATCH WINNER: ${newMatch.winner}`);
              console.log(`SHOW: ${newShow.name} ${newShow.date}`);
            }
            if (belt.name.includes('Dynamite Diamond Ring')) {
              newReign = await TitleReign.create({
                title: needsChange,
                champion: newMatch.winner,
                startShow: newShow._id,
                endShow: newShow._id,
                defenses: [newMatch._id],
              });
            } else {
              newReign = await TitleReign.create({
                title: needsChange,
                champion: newMatch.winner,
                startShow: newShow._id,
                defenses: [newMatch._id],
              });
            }
            belt.reigns.push(newReign._id);
            Title.findByIdAndUpdate(belt._id, belt);
            beltProxy.reignOut = newReign._id;
          }
          //NOW we do the titleproxy
          if (beltProxy) {
            beltProxy = await TitleProxy.create(beltProxy);
          }
        }
      }
    }
    res.status(201).json({
      //status 201 means Created
      status: 'success',
      message: 'Check the DB to see how successful it was!',
    });
  } catch (err) {
    console.log(err);
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
