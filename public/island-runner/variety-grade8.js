/* Additional contextual practice; teacher-editable in the game. */
(function(root){
const pack=(words,gaps,questions)=>({words,gaps,questions});
root.RunnerVariety=root.RunnerVariety||{};
root.RunnerVariety[8]=[
pack(`thoughtful|düşünceli|showing care for other people's needs
reunion|yeniden buluşma|a meeting of people after time apart
understanding|anlayışlı|showing sympathy for another person's situation
mutual|karşılıklı|shared or felt by both people`,
`Would you like ___ us for lunch?|to join|joins|joined
I'd love to, ___ I have another appointment.|but|because|under
Thank you ___ inviting me.|for|at|from
A good friend listens ___ you have a problem.|when|whose|which
We enjoy ___ time together.|spending|spend|spent
Can you count ___ your closest friend?|on|under|between
She is thoughtful; she always ___ others' needs.|considers|consider|considering
Our friendship is based on ___ respect.|mutual|mutually|mutuality`,
`“Would you like to come on Saturday?” Which answer accepts the invitation?|I'd love to. What time?|Sorry, I can't make it.|Thanks, but I'm busy.
You cannot attend because of a family visit. Which reply is polite and gives a reason?|Thanks, but I'm visiting my family.|No. Stop asking.|Maybe the sky is blue.
A friend is upset after missing an event. Which response shows understanding?|I'm sorry. Shall we plan another time?|You always ruin everything.|I don't care how you feel.
Friends meet again after several years. What is this gathering?|A reunion.|A daily lesson.|A rehearsal before every show.
Ali keeps Efe's private story to himself. What quality does this show?|Trustworthiness.|Dishonesty.|Impatience.
Invitation: picnic Sunday at 12, bring water. Which detail tells what to bring?|Water.|Sunday.|Twelve o'clock.
A thoughtful friend notices you have no pen. Which action fits?|Offers to lend one.|Laughs and hides every pen.|Changes the subject deliberately.
Two friends respect each other's opinions. What does “mutual” mean here?|It works both ways.|Only one person does it.|Neither person does it.`),
pack(`non-fiction|kurgu dışı eser|writing about facts and real events
performance|performans|an act of presenting music or drama to an audience
rehearsal|prova|practice before a performance
subscription|abonelik|regular access paid for over a period of time`,
`I prefer reading books ___ watching videos.|to|than|from
I am keen ___ learning guitar.|on|in|at
We practise ___ the performance.|before|because|whose
My brother can't stand ___ for hours.|waiting|wait|waits
How ___ do you visit the library?|often|many|much
He would rather read ___ play video games tonight.|than|to|from
There are three ___ this week.|rehearsals|rehearsal|rehearsing
I read non-fiction ___ I enjoy learning real facts.|because|but|or`,
`Ada enjoys true accounts of nature. Which book would suit her?|A non-fiction book about forests.|A fantasy about a magic kingdom.|A fictional detective story.
Efe practises guitar on Tuesday and Thursday. How often is that?|Twice a week.|Every day.|Once a month.
“I'm keen on photography.” What does this mean?|I am interested in it.|I cannot stand it.|I have never heard of it.
A performance is on Friday; practice is on Wednesday. What is the Wednesday activity?|A rehearsal.|The final performance.|A holiday after the show.
A service costs 30 lira per month. What is a three-month total?|90 lira.|60 lira.|30 lira.
Can prefers quiet activities; Ali loves concerts. Which activity is more likely to suit Can?|Reading at home.|A loud music festival.|A crowded live concert.
Which reply explains a personal preference?|I enjoy biographies because I learn from real lives.|The book is on the table.|The library closes at six.
“I rarely watch TV.” Which description matches?|Not very often.|Every evening without fail.|All day, every day.`),
pack(`knead|yoğurmak|to work dough by pressing and folding it
simmer|kısık ateşte pişirmek|to cook gently just below boiling
drain|süzmek|to remove liquid from food
preheat|önceden ısıtmak|to heat an oven before putting food in it`,
`First, ___ the oven to the required temperature.|preheat|preheats|preheating
After boiling the pasta, ___ the water.|drain|drains|draining
There isn't ___ butter left for the cake.|much|many|few
Cut the onion into thin ___.|slices|slice|slicing
Let the soup ___ gently for ten minutes.|simmer|simmers|simmered
___ the dough until it is smooth.|Knead|Kneads|Kneading
We need a knife ___ chop the onions.|to|for|at
Don't add too ___ salt.|much|many|few`,
`Recipe: mix, knead, bake. What happens immediately before baking?|Kneading.|Serving.|Washing the plate.
The pasta is cooked but still in water. What should you do next?|Drain it.|Add raw flour.|Freeze the pot immediately.
A recipe for two uses one egg. You double the recipe. How many eggs?|Two.|One.|Four.
“Preheat the oven.” When should you heat it?|Before putting the food in.|Only after serving the food.|After switching it off.
The soup should cook gently, not boil strongly. Which action fits?|Simmer it.|Freeze it.|Chop it.
You need thin pieces of carrot. Which instruction fits?|Slice the carrot.|Pour the carrot.|Whisk the whole carrot without cutting.
A guest cannot eat eggs. What should you do before choosing a recipe?|Check ingredients and suitable alternatives.|Hide the eggs in the mixture.|Assume baking removes the problem.
Which sequence makes sense for a salad?|Wash, chop, mix.|Serve, wash, chop.|Mix, serve, wash.`),
pack(`signal|sinyal|a connection that allows a phone to send or receive
operator|telefon operatörü|a person who connects or helps with calls
mute|sessize almak|to switch off a microphone's sound
speakerphone|hoparlör modu|a mode that plays a call aloud`,
`Could I ___ to Ms Kaya, please?|speak|speaks|speaking
I'm afraid she ___ available at the moment.|isn't|aren't|don't
I'm calling ___ ask about the meeting.|to|for|at
Please hold ___ while I connect you.|on|under|from
I can't hear you. The signal is ___.|weak|weakly|weakness
Could you ___ that more slowly?|repeat|repeats|repeated
He asked me ___ call again later.|to|at|under
The microphone is muted, ___ nobody can hear me.|so|but|although`,
`“May I speak to Deniz?” “He is out.” Which reply keeps the conversation useful?|Could I leave a message?|Yes, I am a sandwich.|The weather is blue.
The voice keeps breaking up. What might be wrong?|The signal is weak.|The battery is definitely new.|The contact's name is too short.
You didn't understand a phone number. What should you say?|Could you repeat it, please?|Never use numbers again.|I know it even though I missed it.
A caller asks you to tell Mina the meeting is at four. What should you record?|The caller's message and relevant details.|A different time from memory.|Only today's weather.
Your microphone is muted. What happens?|Others cannot hear your microphone.|Your camera must be on.|Your screen must be broken.
The operator says, “I'll put you through.” What will they do?|Connect your call.|End every phone service.|Send you a parcel.
You want privacy for a call in a shared room. Which choice is considerate?|Use a private spot and avoid speakerphone.|Turn speakerphone up loudly.|Read the message to everyone.
“I'll call you back in ten minutes.” What is the speaker promising?|Another call shortly.|A visit last week.|No further contact.`),
pack(`notification|bildirim|an alert about a new message or event
update|güncelleme|a newer version that changes or improves software
bookmark|yer imi|a saved link for finding a page again
digital footprint|dijital ayak izi|the traces left by your online activities`,
`Remember ___ out when you finish on a shared computer.|to log|logs|logged
You should ___ your private password to yourself.|keep|keeps|keeping
I saved a ___ so I can find the page again.|bookmark|keyboard|headphone
Don't click ___ links you do not trust.|on|under|between
She uses the internet ___ research her project.|to|for|at
How ___ time do you spend online each day?|much|many|few
An update can ___ known software problems.|fix|fixes|fixing
Think carefully ___ sharing personal information.|before|because|whose`,
`You need to return to a useful webpage tomorrow. What can you save?|A bookmark.|A spoon.|A phone's volume setting.
A message asks for your password urgently. What is the safest response?|Do not share it; verify through a trusted route.|Reply with the password.|Post the password publicly.
You finish using a shared school computer. What should you do?|Log out of your account.|Leave the account open.|Save your password for strangers.
An alert appears for a new message. What is it?|A notification.|A printer cartridge.|A paper notebook.
Your public posts can remain part of your online history. What is this called?|A digital footprint.|A shoe size.|An offline timetable.
A search result makes an unusual claim. What should you do before sharing it?|Check reliable sources.|Assume every headline is correct.|Change a word and repost it.
A class website needs a username, not your password in a public comment. What should you avoid posting?|Your password.|The title of the class project.|A general greeting.
You receive many alerts while studying. Which action may help concentration?|Silence unnecessary notifications.|Open every alert instantly.|Add more distracting feeds.`),
pack(`summit|zirve|the highest point of a mountain
altitude|rakım|height above sea level
trail|patika|a path used for walking in the countryside
life jacket|can yeleği|a safety vest that helps a person float`,
`I would rather hike ___ go rafting today.|than|to|from
Climbing can be more demanding ___ walking on flat ground.|than|then|that
We need ___ a guide before choosing a difficult route.|to consult|consults|consulted
Wear a life jacket ___ you go rafting.|when|whose|which
This trail is ___ than the short route: 12 km instead of 4 km.|longer|longest|long
How ___ is the summit above sea level?|high|many|often
The hikers checked their equipment ___ leaving.|before|because|whose
She prefers ___ to extreme sports.|hiking|hike|hiked`,
`Route A is 4 km on flat ground; Route B is 12 km uphill. Which is generally less demanding?|Route A.|Route B.|They require exactly the same effort.
You are preparing for rafting. Which safety equipment belongs on you?|A life jacket.|A wool scarf only.|A desk lamp.
A climber reaches the mountain's highest point. Where are they?|The summit.|The valley floor.|The departure lounge.
The trail is closed due to dangerous weather. What should you do?|Choose a safe alternative and follow the closure.|Ignore the sign.|Go faster through the danger.
Ada prefers calm walks; Can enjoys high-adrenaline activities. Which suits Ada?|An easy nature trail.|A difficult cliff climb.|An extreme rafting route.
A route rises from 500 m to 800 m above sea level. How much altitude is gained?|300 m.|500 m.|1,300 m.
Which sentence gives a reason for a preference?|I prefer hiking because I enjoy quiet scenery.|The trail is 6 km long.|The bus leaves at eight.
Your group is unsure about the route. What should you do before starting?|Check a reliable map and seek qualified guidance.|Separate without a plan.|Hide the map from everyone.`),
pack(`itinerary|gezi programı|a plan listing the places and times of a trip
check-in|giriş işlemi|the process of registering on arrival
scenic|manzaralı|having attractive natural views
heritage|kültürel miras|important traditions and places passed down from the past`,
`We ___ the old castle last summer.|visited|visit|visiting
I'd rather explore the town ___ stay indoors all day.|than|to|from
This route is famous ___ its coastal views.|for|under|between
Did you ___ a room in advance?|book|booked|booking
The guide asked us ___ stay together.|to|at|on
There are many historical ___ in the city.|buildings|building|build
The hotel is ___ than the hostel: 900 lira instead of 400.|more expensive|most expensive|expensively
___ did you stay? At a small guesthouse.|Where|Who|Whose`,
`Itinerary: museum at 10, lunch at 12, castle at 14. What follows lunch?|The castle visit.|The museum visit.|The trip home at 9.
You arrive at a hotel with a reservation. Which process comes first?|Check-in.|Check-out after the stay.|Buying the building.
A route is described as scenic. What should you expect?|Attractive views.|No scenery at all.|Only underground corridors.
A town protects an ancient bridge as part of its heritage. Why?|It has historical and cultural value.|It was built yesterday for a game.|All old objects are worthless.
Two nights cost 600 lira each. What is the room total before any extras?|1,200 lira.|600 lira.|1,800 lira.
You prefer history to beach activities. Which destination suits you best?|A city with museums and historic sites.|A beach resort with no historic visits.|A water park only.
A sign says “Please do not touch the exhibits.” What should you do?|Look without touching.|Move the objects for a photo.|Take one home.
“Was the trip enjoyable?” Which reply describes an experience?|Yes, the views were wonderful.|It will start next year.|The ticket is in my pocket.`),
pack(`schedule|görev çizelgesi|a plan showing when different tasks should be done
detergent|deterjan|a cleaning substance used for clothes or dishes
rinse|durulamak|to wash away soap with clean water
clutter|dağınıklık|things left around in an untidy way`,
`I have ___ tidy my room before going out.|to|at|for
She ___ to take out the rubbish today.|has|have|having
We must ___ the instructions on cleaning products.|read|reads|reading
My brother is responsible ___ feeding the cat.|for|at|under
After washing, ___ the dishes with clean water.|rinse|rinses|rinsed
There is too ___ clutter on the desk.|much|many|few
They don't have to ___ the car today.|wash|washes|washed
___ turn is it to set the table? Mine.|Whose|Who|Where`,
`Chore chart: Ece—dishes; Ali—rubbish; Can—table. Who should take out the rubbish?|Ali.|Ece.|Can.
“You must tidy your room.” What does this express?|An obligation.|A past event.|An optional prediction.
The dishes are soapy after washing. What should you do next?|Rinse them.|Put more dirty food on them.|Hide them under the bed.
A desk is covered with unused items. What would reduce the clutter?|Put items in their proper places.|Add more piles.|Close your eyes.
Efe is responsible for feeding the cat, but he will be away. What is a responsible plan?|Arrange with someone to cover the task.|Leave without telling anyone.|Assume the cat does not need food.
A cleaning product has safety instructions. What should you do?|Read them and ask an adult if unsure.|Mix it with random products.|Use it without checking.
You set the table Monday, Wednesday and Friday. How many times is that?|Three.|Two.|Five.
Which statement shows sharing chores fairly?|We agree on tasks and help when needed.|One person must do everything.|Nobody ever takes responsibility.`),
pack(`hypothesis|hipotez|a testable possible explanation
sample|örnek|a small amount selected for examination
variable|değişken|a factor that can change in an experiment
conclusion|sonuç çıkarımı|an interpretation drawn from evidence`,
`The researcher ___ the results yesterday.|recorded|record|recording
They didn't ___ the experiment without checking the equipment.|start|started|starting
A hypothesis should be ___.|testable|testably|testing
We changed one ___ and kept the others the same.|variable|conclusion|biography
Did the scientist ___ the samples carefully?|label|labelled|labelling
The conclusion was based ___ the evidence.|on|under|between
There were three ___ in each group.|samples|sample|sampling
___ did they repeat the test? To check the result.|Why|Who|Whose`,
`Two plants get equal water but different light. Which factor is being changed?|Light.|Water.|The number of pots, if both have one.
A scientist predicts that more light may help growth. Before testing, what is this idea?|A hypothesis.|A guaranteed fact.|A final award.
A sample is selected for examination. Which example fits?|A small water sample from a lake.|Every lake on Earth.|A guess with no material or data.
The result was surprising. What helps check whether it is reliable?|Repeat the test carefully.|Hide the result.|Change the numbers to match the guess.
A report must explain what the data suggest. Which part does this?|The conclusion.|The shopping list.|The invitation.
A researcher measured 5 cm, then 8 cm of growth. What is the increase?|3 cm.|5 cm.|13 cm.
Which statement distinguishes evidence from a guess?|Measurements support the conclusion.|The conclusion is true because I like it.|No observations are needed.
A new result does not support the first hypothesis. What should a scientist do?|Review the evidence and revise the explanation.|Ignore all the measurements.|Declare every experiment useless.`),
pack(`aftershock|artçı sarsıntı|a smaller earthquake after a larger one
shelter|sığınak|a protected place to stay during danger
relief|afet yardımı|help given to people affected by a disaster
forecast|tahmin|a statement about what is expected to happen`,
`The forecast says there ___ be heavy rain tonight.|will|was|did
People should ___ official warnings.|follow|follows|following
The rescue team ___ supplies yesterday.|delivered|deliver|delivering
There were ___ homes without power after the storm.|many|much|a little
A smaller quake after the main one is an ___.|aftershock|itinerary|invention
We mustn't ___ flooded roads.|cross|crosses|crossing
Emergency supplies should be kept ___ an accessible place.|in|under|through
___ did the river overflow? Because of very heavy rain.|Why|Who|Whose`,
`A weather warning predicts heavy rain. Which action is sensible?|Follow local safety advice and prepare.|Ignore every official warning.|Camp in a riverbed.
A smaller earthquake follows the main one. What is it called?|An aftershock.|A rehearsal.|A tide by definition.
Relief workers deliver food, water and blankets. What are they providing?|Disaster assistance.|A holiday itinerary.|A sports competition.
A road is covered by floodwater. What should you do?|Avoid crossing and follow official directions.|Walk through to test the depth.|Drive faster into it.
A family is told to move to an official shelter. Why?|To stay in a designated safer place.|To collect souvenirs.|To watch a concert.
There were 20 supply boxes; 12 were distributed. How many remain?|Eight.|Twelve.|Thirty-two.
Which sentence is a prediction about weather?|There may be strong winds tomorrow.|The storm ended yesterday.|The rain gauge is blue.
An emergency message names a meeting point and a safe route. What should you check?|Both the location and the route.|Only the font colour.|Only who shared the message first.`)
];
})(typeof globalThis!=='undefined'?globalThis:this);
