/* Additional contextual practice; teacher-editable in the game. */
(function(root){
const pack=(words,gaps,questions)=>({words,gaps,questions});
root.RunnerVariety=root.RunnerVariety||{};
root.RunnerVariety[6]=[
pack(`volunteer|gönüllü|a person who helps without pay
committee|komite|a small group that plans or decides things
notice|duyuru yazısı|a written message on a wall or board
cooperate|iş birliği yapmak|to work together`,
`Every member ___ a responsibility in our club.|has|have|having
We must ___ the classroom tidy.|keep|keeps|keeping
The volunteers organise the event ___.|themselves|himself|herself
___ do you check the noticeboard? Every morning.|How often|How old|How much
Our committee meets ___ Wednesdays.|on|at|in
She helps younger students, ___ she?|doesn't|don't|isn't
We need to cooperate ___ finish on time.|to|from|under
Ali and Ece are ___ here today.|both|neither|none`,
`Notice: Helpers meet in the hall. Where do they meet?|The hall.|The canteen.|The gate.
Ece and Ali work together. What are they doing?|Cooperating.|Competing in a race.|Ignoring the task.
Rule: Put books away after reading. What do you do?|Return books to the shelf.|Leave books on the floor.|Hide books under a chair.
Mina checks the noticeboard every school day. How often?|Five days a week.|Once a month.|Only on Sundays.
We need four helpers. We have three. How many more?|One.|Three.|Four.
Ali can't go to the meeting. What should he do?|Tell the leader early.|Say nothing.|Pretend he was there.
The committee chooses the concert date. What does it do?|It makes a decision.|It sells instruments.|It teaches lessons.
“Can you carry these books?” Choose a helpful reply.|Yes, I'll help you.|They are expensive shoes.|No, it is Tuesday.`),
pack(`compare|karşılaştırmak|to see how things are alike or different
underline|altını çizmek|to draw a line below a word
outline|ana hatlar|a short plan of the main ideas
solution|çözüm|an answer to a problem`,
`Let's ___ the two answers before we decide.|compare|compares|comparing
You should underline the ___ words in the text.|important|importantly|importance
Our group ___ working on the project now.|is|am|be
We made this outline ___.|ourselves|myself|himself
Please listen ___ your partner's idea.|to|at|on
___ notes are better: clear or messy?|Which|Who|Whose
Ece usually ___ her notes after class.|reviews|review|reviewing
There are three possible ___ to this problem.|solutions|solution|solving`,
`Ada reads, Efe writes, Can checks. Who writes?|Efe.|Ada.|Can.
When do you make an outline?|Before writing.|After handing in.|During the break.
Your partner has a different answer. What do you do?|Compare your answers.|Copy one at random.|Stop talking to them.
Your notes say: read, discuss, write. What comes second?|Discuss.|Read.|Write.
Task: “Underline the verbs.” What do you mark?|Action words, like run.|Only names.|Every full stop.
12 questions, 3 students. How many questions each?|Four.|Three.|Six.
“I don't understand this step.” What is a good reply?|Let's look at an example.|Then stop learning forever.|It is my blue coat.
Ali studies every day. Ece doesn’t. Who studies daily?|Ali.|Ece.|Neither.`),
pack(`confident|kendine güvenen|sure about what you can do
modest|alçakgönüllü|not talking proudly about your success
freckle|çil|a small brown spot on the skin
shoulder|omuz|where your arm joins your body`,
`My sister is confident. She speaks ___.|clearly|clear|clearness
Efe has short hair, but his brother's hair is ___.|long|tall|high
She doesn't ___ about her success. She is modest.|boast|boasts|boasting
Both students ___ wearing glasses today.|are|is|am
This jacket belongs to him. It is ___.|his|he|him
Ali is ___ than Can. He is 160 cm.|taller|tallest|tall
___ does your cousin look like? She has curly hair.|What|Who|Where
I can introduce ___ to the new group.|myself|himself|ourselves`,
`Ece listens and helps others. What is she like?|Kind and helpful.|Rude and selfish.|Lazy and careless.
Ali has curly hair. Can doesn’t. Can’s hair is ___.|Straight.|Curly.|Tall.
Mina wins a prize but doesn't boast. She is ___.|Modest.|Noisy.|Careless.
“What's she like?” Which answer is about personality?|She is patient.|She has brown eyes.|She is wearing boots.
“What does he look like?” Which answer fits?|He is tall and thin.|He is very generous.|He enjoys chess.
Ada: 155 cm. Ece: 165 cm. Ece is ___ taller.|10 cm.|20 cm.|5 cm.
A confident speaker forgets a word. What can she do?|Try another word.|Shout at people.|Never speak again.
Ada shares her pens. Efe doesn’t. Who is generous?|Ada.|Efe.|Both.`),
pack(`plumber|tesisatçı|a person who repairs water pipes
carpenter|marangoz|a person who makes things from wood
balcony|balkon|a small open space outside an upstairs room
cupboard|dolap|furniture with doors for keeping things`,
`A plumber ___ broken pipes.|repairs|repair|repairing
We are going to ___ a bigger cupboard.|buy|buys|buying
The carpenter made this table ___.|himself|themselves|ourselves
There are two ___ beside the kitchen.|balconies|balconys|balcony
My parents ___ meeting the plumber tomorrow.|are|is|am
Please put the cups ___ the cupboard.|in|through|across
___ is your uncle's job? He is a carpenter.|What|Where|Whose
The new flat has four rooms. That is ___ than three.|more|fewer|less`,
`A water pipe is broken. Who can fix it?|A plumber.|A photographer.|A pilot.
A wooden chair is broken. Who can fix it?|A carpenter.|A dentist.|A singer.
Family plan: shop Saturday, move Sunday. When are they moving?|Sunday.|Saturday.|Friday.
The cups are behind the cupboard doors. Where are they?|Inside the cupboard.|Under the balcony.|On the roof.
Ece has four rooms. Ali has three. Who has more?|Ece.|Ali.|They have the same.
An electrician is coming tomorrow. What needs fixing?|The lights.|A tooth.|The train.
We’re going to paint next week. Is it done?|No, not yet.|Yes, it finished yesterday.|Yes, every morning.
A family: two adults, two children. How many chairs?|Four.|Two.|Six.`),
pack(`rehearsal|prova|a practice before a show
fundraiser|bağış toplama etkinliği|an event to collect money for something
cancellation|iptal|when a planned event will not happen
schedule|program|a list of activities and their times`,
`There ___ a concert in the square yesterday.|was|were|are
The streets ___ crowded last Saturday.|were|was|is
We ___ the fundraiser last week.|organised|organise|organising
Did you ___ the rehearsal yesterday?|watch|watched|watching
The event didn't ___ because of the storm.|happen|happened|happening
___ was the concert? In the town hall.|Where|Who|Whose
They helped at the event ___.|themselves|himself|myself
The rehearsal started ___ six o'clock.|at|on|in`,
`Notice: Saturday's concert is cancelled. What does this mean?|It will not happen.|It starts earlier.|Tickets are free.
Square: full yesterday, empty today. When was it crowded?|Yesterday.|Today.|Tomorrow.
Rehearsal 14:00, concert 18:00. Which is first?|The rehearsal.|The concert.|Both together.
A fundraiser collects money for library books. What's it for?|To help the library.|To close the library.|To buy train tickets.
Ece went to the festival. Ali didn’t. Who went?|Ece.|Ali.|Both of them.
One ticket costs 10 lira. You bought two. How much?|20 lira.|10 lira.|30 lira.
The outdoor show has heavy rain. What's a good idea?|Move it indoors.|Ignore the rain.|Stand in the water.
“Did you enjoy the event?” Which reply fits?|Yes, the music was great.|It is under the desk.|My brother is tall.`),
pack(`platform|peron|the place where you wait for a train
return ticket|gidiş-dönüş bileti|you use it to travel there and back
timetable|hareket çizelgesi|a list of times for buses or trains
junction|kavşak|a place where roads meet`,
`We ___ to İzmir by train last month.|went|go|going
Did she ___ a return ticket?|buy|bought|buying
The bus ___ late yesterday.|was|were|are
We waited ___ platform two.|on|into|under
They didn't ___ the last train.|catch|caught|catching
___ long was the journey? Two hours.|How|What|Who
I carried my bag ___.|myself|herself|themselves
There were many ___ at the station.|passengers|passenger|passing`,
`Timetable: leave 10:00, arrive 12:00. How long is the trip?|Two hours.|One hour.|Three hours.
You want to go there and come back. Which ticket?|A return ticket.|A one-way ticket.|A cinema ticket.
The train leaves from platform 3. Where do you wait?|Platform 3.|Platform 1.|The car park.
Efe: bus. Ada: train. Who travelled by train?|Ada.|Efe.|Both.
The bus left at 9:00. It's 9:10 now. What happened?|You missed the bus.|You are ten minutes early.|The bus leaves tomorrow.
Leave 8:00. Travel 30 minutes. What time do you arrive?|8:30.|8:15.|9:00.
“Did you walk to school yesterday?” Choose the answer.|No, I took the bus.|Yes, I will tomorrow.|It is a large city.
At a junction, what should a driver do?|Look carefully first.|Close their eyes.|Read a book.`),
pack(`custom|geleneksel uygulama|something people in a culture usually do
souvenir|hatıra eşyası|a thing you keep to remember a place
ceremony|tören|a formal event for a special day
portion|porsiyon|the amount of food for one person`,
`We bought two ___ from the market.|souvenirs|souvenir|souveniring
This dish is served ___ rice.|with|between|underneath
How ___ portions do we need?|many|much|a little
Visitors should ___ local customs.|respect|respects|respecting
The ceremony ___ at noon yesterday.|started|start|starting
I made this traditional meal ___.|myself|himself|themselves
___ country is this food from?|Which|Who|Whose
We didn't ___ any food because we ordered enough.|waste|wasted|wasting`,
`Four visitors each want one portion. How many portions?|Four.|Two.|Eight.
A bowl to remember your trip is a ___.|Souvenir.|Platform.|Timetable.
You don't know a local custom. What should you do?|Ask politely.|Laugh at people.|Do whatever you want.
The soup has milk. Ece can't have milk. What now?|Order another dish.|Eat it anyway.|Add more milk.
The ceremony starts at 12:00. Come 15 minutes early. When?|11:45.|12:15.|11:15.
Everyone shares one meal. What is polite?|Take a fair portion.|Take all the food.|Hide the spoon.
Ece liked the new dish. What does she say?|It was delicious.|It was horrible.|I didn't try it.
A museum shows traditional clothes. What can visitors learn about?|Ways of dressing.|Bus times.|Their exam marks.`),
pack(`conserve|korumak (kaynak)|to use something carefully and not waste it
compost|kompost|rotten plants and food used to feed soil
refill|yeniden doldurmak|to fill a container again
emission|salım|gas that goes into the air`,
`We should ___ water when brushing our teeth.|save|saves|saving
Don't ___ bottles on the trail.|leave|leaves|leaving
There is too ___ rubbish beside the river.|much|many|few
We can ___ this bottle instead of buying another.|refill|refills|refilling
The volunteers cleaned the park ___.|themselves|himself|herself
Cycling makes ___ pollution than driving a car.|less|fewer|many
If everyone helps, the park ___ be cleaner.|will|was|did
___ can we save electricity? Turn off lights.|How|Whose|How old`,
`The tap is on, but nobody uses it. What now?|Turn it off.|Open another tap.|Leave it on.
You have a reusable bottle. How can you save plastic?|Refill it.|Buy a new one.|Throw it away.
Vegetable peel can become compost. Where can it go?|A compost bin.|A river.|A glass bin.
You live near school. Which trip makes no pollution?|Walking.|Going by car.|Taking a taxi.
There's litter after the picnic. What do you do?|Pick it up.|Hide it under a tree.|Leave it for animals.
Yesterday: 10 sheets. Today: 6 sheets. How many fewer today?|Four.|Six.|Sixteen.
Sign: Stay on the path. Why is this rule here?|To protect plants.|To step on flowers.|To find a garden.
How can we save electricity?|Turn off unused lights.|Keep lights on all night.|Leave the fridge open.`),
pack(`forecast|hava tahmini|what the weather will be like
observatory|gözlemevi|a building for watching stars and planets
crescent|hilal|the thin curved shape of the moon
cloudy|bulutlu|covered with many clouds`,
`The forecast says it ___ rain tomorrow.|will|was|did
We ___ the Moon through a telescope last night.|saw|see|seeing
The sky is too ___ to see many stars.|cloudy|cloud|clouds
Earth is ___ than Mercury.|larger|largest|largely
___ planet do we live on?|Which|Who|Whose
The students visited the observatory ___.|yesterday|tomorrow|next week
You should stay ___ during a dangerous storm.|indoors|above|underneath
The sky is clearing. There are ___ clouds now.|fewer|less|much`,
`Forecast: heavy rain this afternoon. What do you take?|A raincoat.|A sunhat.|A swimming medal.
Where can you use a big telescope?|An observatory.|A bakery.|A train platform.
Tonight the Moon is a thin curve. What is it?|A crescent.|A full moon.|A square.
Clouds cover the sky. Why can't we see stars?|Clouds are in the way.|The stars disappeared.|The Moon is too big.
It was 10°C. Now it is 4°C. What happened?|It became colder.|It became warmer.|It stayed the same.
Warning: big storm today. What is the safest plan?|Stay inside.|Stand under a tree.|Swim in the sea.
Earth goes around the ___ in one year.|Sun.|Mars.|Moon.
Clear sky yesterday, cloudy today. When could we see stars?|Yesterday.|Today.|Both days.`),
pack(`efficient|verimli|working well without wasting energy
renewable|yenilenebilir|can be made again by nature
automatic|otomatik|working by itself without people
invention|icat|a new thing that someone made`,
`I think future homes ___ use less energy.|will|was|did
Robots won't ___ every problem for us.|solve|solves|solved
Solar energy is ___.|renewable|renew|renewing
This machine works ___.|automatically|automatic|automation
There may be ___ electric buses in the future.|more|much|a little
We will still need ___ how to think for ourselves.|to learn|learns|learned
___ will people travel in the future? Perhaps by train.|How|Whose|How old
Our invention will help people, ___ it?|won't|doesn't|isn't`,
`This lamp uses little electricity. What is it?|Efficient.|Wasteful.|Broken.
Wind never runs out. What kind of energy is it?|Renewable.|Single-use.|Fossil fuel.
“I think people will use cleaner transport.” What is this?|A prediction.|A past event.|An experiment.
A robot waters plants without help. It is ___.|Automatic.|Broken.|Asleep.
A student invents a water filter. How does it help?|It gives cleaner water.|It shows football scores.|It plays TV shows.
Will robots help doctors and teachers?|Yes, I think they will.|Yes, they did yesterday.|Yes, they were.
Which sentence says something won't happen?|Cars won't need petrol.|Cars used petrol yesterday.|Cars are parked outside.
A new machine wastes energy. How can we improve it?|Make it more efficient.|Make it waste more.|Paint it red.`)
];
})(typeof globalThis!=='undefined'?globalThis:this);
