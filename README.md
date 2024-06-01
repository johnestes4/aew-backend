# Elite Power Rankings

This is the backend for the Elite Power Rankings project. The backend is at https://github.com/johnestes4/aew-frontend.

It's an Node.js application built for a MongoDB database that not only handles API calls, but calculates new power levels and heavily processes new data before saving it to the database.

Power levels are determined through science. More specifically, Elo ratings (https://en.wikipedia.org/wiki/Elo_rating_system), modified by win/loss streaks and a decay system that degrades each match's contribution to an overall score over time. As it's currently balanced, the rankings skew heavily towards recent results - as intended - but still allows wrestlers with long histories of winning to more easily maintain a position at the top.

The rankings calc is the most complex part, as it iterates through every show in AEW's history (over 800) and all the contained matches, and for each one calculates what each competitor's rating as of that match was so it can properly determine how many points the match is worth for each side.

The other most complex function is the API call to add new shows to the database, which needs to create and edit objects in every schema the app uses, while nesting them all with references to each other. It's a real rat's nest of code. I'll keep working on streamlining it once I'm happy with the bug situation.

It also has a few utility functions that I manually trigger to clean up specific parts of the database. Eventually more of those functions will be incorporated into the rankings calc so they can all happen at the same time.

The alpha is currently hosted on https://aew-frontend.onrender.com/. I'm not paying Render yet, so it'll probably take a minute to spin up the back and front ends before it actually lets you see anything. Once I get a domain and feel confident everything's working without bugs I'll upgrade the instances and it'll become more usable.
