/* Additional contextual practice; teacher-editable in the game. */
(function(root){
const pack=(words,gaps,questions)=>({words,gaps,questions});
root.RunnerVariety=root.RunnerVariety||{};
root.RunnerVariety[8]=[
pack(`thoughtful|düşünceli|kind and caring about what others need
reunion|yeniden buluşma|when old friends meet again after years
understanding|anlayışlı|able to see how others feel
mutual|karşılıklı|shared or felt by both people`,
`Would you like ___ us for lunch?|to join|joins|joined
I'd love to, ___ I have another appointment.|but|because|under
Thank you ___ inviting me.|for|at|from
A good friend listens ___ you have a problem.|when|whose|which
We enjoy ___ time together.|spending|spend|spent
Can you count ___ your closest friend?|on|under|between
She is thoughtful. She always ___ about others.|thinks|think|thinking
We have ___ respect for each other.|mutual|mutually|mutuality`,
`“Would you like to come?” Which reply says yes?|I'd love to. What time?|Sorry, I can't make it.|Thanks, but I'm busy.
Which polite reply gives a reason?|Sorry, I'm visiting my family.|No. Stop asking.|I don't care.
Your friend is sad. Which reply is kind?|Sorry. Let's try again soon.|You always ruin everything.|I don't care.
Old friends meet again after years. What is it?|A reunion.|A lesson.|A rehearsal.
Ali keeps Efe's secret. What is Ali like?|Trustworthy.|Dishonest.|Impatient.
Picnic: Sunday at 12. Bring water. What do you bring?|Water.|Juice.|Chairs.
You have no pen. What does a thoughtful friend do?|Lends you one.|Hides your pens.|Laughs at you.
“Mutual respect”: what does “mutual” mean?|Both people do it.|Only one person does it.|Nobody does it.`),
pack(`non-fiction|kurgu dışı eser|writing about facts and real events
performance|performans|a show of music or drama for people
rehearsal|prova|practice before a show
subscription|abonelik|money you pay regularly for a service`,
`I prefer reading books ___ watching videos.|to|than|from
I am keen ___ learning guitar.|on|in|at
We practise ___ the performance.|before|because|whose
My brother can't stand ___ for hours.|waiting|wait|waits
How ___ do you visit the library?|often|many|much
He would rather read ___ play video games tonight.|than|to|from
There are three ___ this week.|rehearsals|rehearsal|rehearsing
I read non-fiction ___ I enjoy learning real facts.|because|but|or`,
`Ada likes true facts about nature. Which book?|A non-fiction nature book.|A magic fantasy story.|A detective story.
Efe plays guitar on Tuesdays and Thursdays. How often?|Twice a week.|Every day.|Once a month.
“I'm keen on photography.” What does this mean?|I like it a lot.|I hate it.|I don't know it.
Show: Friday. Practice: Wednesday. What is Wednesday's practice?|A rehearsal.|A performance.|A holiday.
Subscription: 30 lira a month. Total for three months?|90 lira.|60 lira.|30 lira.
Can likes quiet activities. What will he enjoy?|Reading at home.|A loud music festival.|A busy concert.
Which sentence says why you like something?|I read because it's fun.|The book is green.|The library closes at six.
“I rarely watch TV.” What does “rarely” mean?|Not very often.|Every evening.|All day.`),
pack(`knead|yoğurmak|to press and fold dough with your hands
simmer|kısık ateşte pişirmek|to cook slowly on low heat
drain|süzmek|to take the water away from food
preheat|önceden ısıtmak|to heat the oven before cooking`,
`First, ___ the oven to 180 degrees.|preheat|preheats|preheating
After boiling the pasta, ___ the water.|drain|drains|draining
There isn't ___ butter left for the cake.|much|many|few
Cut the onion into thin ___.|slices|slice|slicing
Let the soup ___ gently for ten minutes.|simmer|simmers|simmered
___ the dough until it is smooth.|Knead|Kneads|Kneading
We need a knife ___ chop the onions.|to|for|at
Don't add too ___ salt.|much|many|few`,
`Recipe: mix, knead, bake. What comes before baking?|Kneading.|Serving.|Washing up.
The pasta is ready but in water. What next?|Drain it.|Add flour.|Freeze it.
A recipe for two needs one egg. For four people?|Two eggs.|One egg.|Four eggs.
“Preheat the oven.” When do you heat it?|Before the food goes in.|After you serve the food.|After you turn it off.
Cook the soup slowly on low heat. Which verb?|Simmer it.|Freeze it.|Chop it.
You want thin pieces of carrot. What do you do?|Slice the carrot.|Pour the carrot.|Whisk the carrot.
Your guest can't eat eggs. What should you do?|Choose a recipe without eggs.|Hide eggs in the food.|Add more eggs.
Which order is right for a salad?|Wash, chop, mix.|Serve, wash, chop.|Mix, serve, wash.`),
pack(`signal|sinyal|the connection a phone needs for calls
operator|telefon operatörü|a person who connects or helps with calls
mute|sessize almak|to turn off the sound of your microphone
speakerphone|hoparlör modu|a setting that plays a call out loud`,
`Could I ___ to Ms Kaya, please?|speak|speaks|speaking
I'm afraid she ___ available at the moment.|isn't|aren't|don't
I'm calling ___ ask about the meeting.|to|for|at
Please hold ___ while I connect you.|on|under|from
I can't hear you. The signal is ___.|weak|weakly|weakness
Could you ___ that more slowly?|repeat|repeats|repeated
He asked me ___ call again later.|to|at|under
The microphone is muted, ___ nobody can hear me.|so|but|although`,
`“Deniz is out.” What can you ask?|Could I leave a message?|Can I buy a phone?|Is it raining?
The call keeps cutting out. Why?|The signal is weak.|The battery is new.|The name is short.
You didn't understand a phone number. What do you say?|Could you repeat it, please?|Never use numbers again.|I know it already.
Tell Mina: meeting at four. What do you write?|The meeting is at four.|The meeting is at two.|Today's weather.
Your microphone is muted. What happens?|Others can't hear you.|Your camera turns on.|Your screen breaks.
The operator says, “I'll put you through.” What happens?|They connect your call.|They end the call.|They send a parcel.
Others are nearby. How do you take a private call?|Go somewhere quiet.|Use speakerphone loudly.|Read it to everyone.
“I'll call you back in ten minutes.” What will happen?|Another call soon.|A visit last week.|No more calls.`),
pack(`notification|bildirim|a small message telling you something new
update|güncelleme|a newer version of an app or program
bookmark|yer imi|a saved link to find a page again
digital footprint|dijital ayak izi|the record of everything you do online`,
`Remember ___ out when you finish on a shared computer.|to log|logs|logged
You should ___ your private password to yourself.|keep|keeps|keeping
I saved a ___ so I can find the page again.|bookmark|keyboard|headphone
Don't click ___ links you do not trust.|on|under|between
She uses the internet ___ research her project.|to|for|at
How ___ time do you spend online each day?|much|many|few
An update can ___ problems in an app.|fix|fixes|fixing
Think ___ you share personal information.|before|because|whose`,
`What do you save to find a page again?|A bookmark.|A comment.|A notification.
A message asks for your password. What do you do?|Don't share it.|Send the password.|Post it online.
You finish using a school computer. What should you do?|Log out of your account.|Leave the account open.|Give your password away.
Your phone says: “1 new message.” What is this?|A notification.|A bookmark.|An update.
Your posts stay online for years. What is this called?|A digital footprint.|A bookmark.|A password.
You see strange news online. What should you do first?|Check other good websites.|Share it right away.|Change it and share.
What should you never post in a comment?|Your password.|Your project title.|Hello, everyone.
Many alerts come while you study. What helps?|Turn off notifications.|Open every alert.|Add more apps.`),
pack(`summit|zirve|the highest point of a mountain
altitude|rakım|height above the sea
trail|patika|a path for walking in nature
life jacket|can yeleği|a safety vest that helps you float`,
`I would rather hike ___ go rafting today.|than|to|from
Climbing is harder ___ walking on flat ground.|than|then|that
We need ___ a map before we start.|to check|checks|checked
Wear a life jacket ___ you go rafting.|when|whose|which
The 12 km trail is ___ than the 4 km trail.|longer|longest|long
How ___ is the summit above sea level?|high|many|often
The hikers checked their equipment ___ leaving.|before|because|whose
She prefers ___ to extreme sports.|hiking|hike|hiked`,
`Which is easier: 4 km flat or 12 km uphill?|4 km flat.|12 km uphill.|Both are the same.
You are going rafting. What should you wear?|A life jacket.|A wool scarf.|A heavy coat.
A climber is at the top of the mountain. Where?|At the summit.|In the valley.|At the airport.
Sign: Trail closed. Bad weather. What do you do?|Choose another safe path.|Ignore the sign.|Walk faster.
Ada likes calm walks. What suits her?|An easy nature trail.|A hard cliff climb.|Extreme rafting.
Altitude: 500 m, then 800 m. How much higher?|300 m.|500 m.|1,300 m.
Which sentence says why you prefer something?|I hike because it's quiet.|The trail is 6 km.|The bus leaves at eight.
You don't know the route. What do you do first?|Check a map or guide.|Split up without a plan.|Hide the map.`),
pack(`itinerary|gezi programı|a trip plan with places and times
check-in|giriş işlemi|signing in when you arrive at a hotel
scenic|manzaralı|with beautiful views of nature
heritage|kültürel miras|old traditions and places from the past`,
`We ___ the old castle last summer.|visited|visit|visiting
I'd rather explore the town ___ stay indoors all day.|than|to|from
This route is famous ___ its sea views.|for|under|between
Did you ___ a room in advance?|book|booked|booking
The guide asked us ___ stay together.|to|at|on
There are many historical ___ in the city.|buildings|building|build
The 900-lira hotel is ___ than the 400-lira hostel.|more expensive|most expensive|expensively
___ did you stay? At a small guesthouse.|Where|Who|Whose`,
`Itinerary: museum 10:00, lunch 12:00, castle 14:00. What's after lunch?|The castle.|The museum.|Going home.
You arrive at your hotel. What do you do first?|Check in.|Check out.|Go to the beach.
The route is scenic. What will you see?|Beautiful views.|Nothing nice.|Only tunnels.
Why does a town protect its old bridge?|It's important history.|It was built yesterday.|Old things are useless.
One night costs 600 lira. How much for two nights?|1,200 lira.|600 lira.|1,800 lira.
You love history. Where should you go?|A city with museums.|A beach resort.|A water park.
Sign: “Do not touch.” What should you do?|Look but don't touch.|Touch it for a photo.|Take one home.
“Did you enjoy the trip?” Which reply fits?|Yes, the views were great.|It starts next year.|My ticket is here.`),
pack(`schedule|görev çizelgesi|a plan that shows when to do tasks
detergent|deterjan|soap for washing clothes or dishes
rinse|durulamak|to wash soap off with clean water
clutter|dağınıklık|many things left around in a messy way`,
`I have ___ tidy my room before going out.|to|at|for
She ___ to take out the rubbish today.|has|have|having
We must ___ the instructions on cleaning products.|read|reads|reading
My brother is responsible ___ feeding the cat.|for|at|under
After washing, ___ the dishes with clean water.|rinse|rinses|rinsed
There is too ___ clutter on the desk.|much|many|few
They don't have to ___ the car today.|wash|washes|washed
___ turn is it to set the table? Mine.|Whose|Who|Where`,
`Chores: Ece—dishes, Ali—rubbish, Can—table. Who takes the rubbish out?|Ali.|Ece.|Can.
“You must tidy your room.” What is this?|An obligation.|A past event.|A prediction.
The dishes are soapy. What do you do next?|Rinse them.|Add more food.|Hide them.
Your desk is full of clutter. What helps?|Put things away.|Add more things.|Close your eyes.
Efe must feed the cat but is away. What now?|Ask someone to help.|Leave and tell nobody.|Forget the cat.
A cleaning product has safety instructions. What should you do?|Read them first.|Mix it with others.|Use it without reading.
Monday, Wednesday, Friday: you set the table. How many times?|Three.|Two.|Five.
Which sentence shows fair sharing of chores?|We all help with tasks.|One person does everything.|Nobody does anything.`),
pack(`hypothesis|hipotez|a possible answer that you can test
sample|örnek|a small amount taken to study
variable|değişken|something you change in an experiment
conclusion|sonuç çıkarımı|what you decide after looking at evidence`,
`The researcher ___ the results yesterday.|recorded|record|recording
They didn't ___ the experiment without checking the equipment.|start|started|starting
A hypothesis should be ___.|testable|testably|testing
We changed one ___ and kept the others the same.|variable|conclusion|biography
Did the scientist ___ the samples carefully?|label|labelled|labelling
The conclusion was based ___ the evidence.|on|under|between
There were three ___ in each group.|samples|sample|sampling
___ did they repeat the test? To check the result.|Why|Who|Whose`,
`Two plants: same water, different light. What is changing?|Light.|Water.|The pots.
“Light helps plants grow.” We’ll test it. What is it?|A hypothesis.|A fact.|A result.
Which is a sample?|A cup of lake water.|Every lake on Earth.|A guess.
The result is surprising. How can you check it?|Repeat the test.|Hide the result.|Change the numbers.
Which part of a report explains the results?|The conclusion.|The title.|The date.
Plant height: 5 cm, then 8 cm. How much growth?|3 cm.|5 cm.|13 cm.
Which sentence uses evidence?|Our measurements show this.|I just feel it's true.|I like this answer.
The result doesn't match the hypothesis. What next?|Check and change the idea.|Ignore the result.|Stop all experiments.`),
pack(`aftershock|artçı sarsıntı|a smaller earthquake after a big one
shelter|sığınak|a safe place to stay during danger
relief|afet yardımı|help given to people after a disaster
forecast|tahmin|a report of the weather to come`,
`The forecast says there ___ be heavy rain tonight.|will|was|did
People should ___ official warnings.|follow|follows|following
The rescue team ___ supplies yesterday.|delivered|deliver|delivering
There were ___ homes without power after the storm.|many|much|a little
A smaller quake after the main one is an ___.|aftershock|itinerary|invention
We mustn't ___ flooded roads.|cross|crosses|crossing
Keep emergency supplies ___ an easy place to reach.|in|under|through
___ did the river overflow? Because of very heavy rain.|Why|Who|Whose`,
`Warning: heavy rain tonight. What should you do?|Follow the safety advice.|Ignore the warning.|Camp by the river.
A smaller earthquake follows the main one. What is it?|An aftershock.|A rehearsal.|A landslide.
After the flood, workers bring food. What is this?|Disaster relief.|A holiday plan.|A sports game.
A road is under floodwater. What should you do?|Don't cross it.|Walk through it.|Drive faster.
Why do families go to a shelter?|To stay safe.|To buy souvenirs.|To watch a concert.
20 boxes. 12 were given out. How many are left?|Eight.|Twelve.|Thirty-two.
Which sentence is a weather forecast?|It will be windy tomorrow.|The storm ended yesterday.|It was windy yesterday.
Message: Go to the school by Park Road. What matters?|The place and the road.|The text colour.|Who sent it first.`)
];
})(typeof globalThis!=='undefined'?globalThis:this);
