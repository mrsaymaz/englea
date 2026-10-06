/* Additional contextual practice; teacher-editable in the game. */
(function(root){
const pack=(words,gaps,questions)=>({words,gaps,questions});
root.RunnerVariety=root.RunnerVariety||{};
root.RunnerVariety[7]=[
pack(`sociable|sosyal|liking to be with other people
sensitive|hassas|easily upset by what people say
bald|kel|with no hair on the head
moustache|bıyık|hair above a man's mouth`,
`Ada is more sociable ___ her quiet cousin.|than|then|that
My uncle has a moustache, but he ___ have a beard.|doesn't|don't|isn't
She always keeps her promises. She is ___.|reliable|selfish|rude
The twins ___ similar, but they are very different.|look|looks|looking
Ali is ___ than Efe. He is 170 cm.|taller|tallest|tall
___ is your new classmate like? Friendly and patient.|What|Where|Whose
She is sensitive ___ loud noise.|to|under|between
Mina is ___ than Ada. She never gets angry.|more patient|most patient|patiently`,
`Can shares his lunch. Efe doesn't share. Who is generous?|Can.|Efe.|Both of them.
Ece loves parties. Ada likes quiet days. Who is sociable?|Ece.|Ada.|Neither of them.
My uncle is bald. What about his hair?|He has no hair.|He has long hair.|He has curly hair.
“What is your friend like?” Which answer fits?|She is honest and helpful.|She has green eyes.|She is 165 cm tall.
Heights: Ali 160, Can 170, Efe 165. Who is tallest?|Can.|Ali.|Efe.
Reliable Deniz promised to come at 4. What happens?|She comes at 4.|She forgets to come.|She comes the next day.
Mina listens to her sad friend. What is Mina like?|Kind and caring.|Impatient and rude.|Selfish and lazy.
Which sentence compares personality?|Ada is kinder than Ece.|Ada is taller than Ece.|Ada's hair is shorter.`),
pack(`stamina|dayanıklılık|the energy to exercise for a long time
warm-up|ısınma egzersizi|light exercise before sport
athlete|sporcu|a person trained in sports
court|kort|a place to play tennis or basketball`,
`Our team ___ twice a week.|trains|train|training
You should ___ up before a match.|warm|warms|warming
She hardly ___ misses training.|ever|never|always
How ___ do you play tennis?|often|many|longer
There are six ___ waiting by the court.|athletes|athlete|athletic
He prefers running ___ watching sport.|to|than|from
We don't ___ football on Mondays.|play|plays|playing
The match begins ___ 3:30.|at|in|on`,
`Ada swims on Monday, Wednesday and Friday. How often?|Three times a week.|Twice a week.|Every day.
Efe never misses Sunday practice. What does that mean?|He always goes.|He never goes.|He goes once a year.
You want to play tennis. Where do you go?|To a court.|To a swimming pool.|To an ice rink.
Ela runs for hours without getting tired. She has ___.|Stamina.|A court.|A ticket.
Training: 17:00. Warm-up: 15 minutes earlier. When is warm-up?|16:45.|17:15.|16:15.
Can runs daily. Ali runs on Sundays. Who runs more?|Can.|Ali.|They run the same.
Which sentence shows what you like more?|I prefer cycling to running.|I cycled yesterday.|The bike is blue.
You feel ill before training. What should you do?|Tell the coach.|Train even harder.|Take a friend's medicine.`),
pack(`milestone|dönüm noktası|a very important event in your life
scholarship|burs|money to help a student study
publish|yayımlamak|to print a book for people to buy
researcher|araştırmacı|a scientist who studies to find new facts`,
`The writer ___ her first book in 1998.|published|publish|publishing
He was born ___ Ankara.|in|on|at
They ___ university in 2010.|finished|finish|finishing
Did the researcher ___ an award?|win|won|winning
She didn't ___ abroad as a child.|move|moved|moving
Her parents ___ teachers.|were|was|is
He got a scholarship ___ helped him study.|that|who|where
___ did she graduate? In 2005.|When|Who|Where`,
`Born: 1980. Graduated: 2002. How old was she then?|About 22.|About 32.|About 12.
First book: 1999. Award: 2008. What came first?|The first book.|The award.|Both came together.
Ela got money for her studies. What is it?|A scholarship.|A passport.|A sports trophy.
2012: moved to İzmir. 2018: moved to Ankara. First city?|İzmir.|Ankara.|Neither city.
She published a novel in 2020. What does this mean?|It was printed for readers.|She lost it.|She never wrote it.
Which question asks about a past achievement?|What did she discover?|What will she do tomorrow?|What is she wearing?
What do we find in a biography?|Important life events.|Tomorrow's weather.|A restaurant menu.
Her great discovery was a big ___ in her life.|Milestone.|Timetable.|Receipt.`),
pack(`shelter|barınak|a safe place that protects from danger
migration|göç|when animals travel far each season
conservation|doğayı koruma|protecting nature and wild animals
nocturnal|gece aktif olan|active mostly at night`,
`We should ___ wild animals' habitats.|protect|protects|protecting
Owls are often active ___ night.|at|on|in
Many birds ___ to warmer places in winter.|migrate|migrates|migrating
A tiger is ___ than a domestic cat.|larger|largest|largely
People ___ the animals' forest last year.|destroyed|destroy|destroying
We mustn't ___ endangered animals.|hunt|hunts|hunting
These animals need food and ___.|shelter|schedule|subtitle
___ do birds migrate? To find suitable conditions.|Why|Who|Whose`,
`Bats are awake at night. What word describes them?|Nocturnal.|Domestic.|Extinct.
Birds fly south every winter. What is this called?|Migration.|Pollution.|Recycling.
People cut down a forest. What do animals lose?|Their habitat.|Their stripes.|Their claws.
Which action helps wild animals?|Protecting their habitats.|Buying animal skins.|Leaving plastic in rivers.
Last year: 100 nests. This year: 80 nests. What happened?|The number went down.|The number went up.|Nothing changed.
Why does an animal need a shelter?|To stay safe and dry.|To watch television.|To buy a ticket.
Sign: Don't go near the animals. What do you do?|Watch from far away.|Try to touch them.|Chase them for photos.
Where do polar bears live?|In the Arctic.|In a rainforest.|In a hot desert.`),
pack(`broadcast|yayın|a programme sent out on TV or radio
subtitle|altyazı|words on screen showing what people say
schedule|yayın akışı|a list of times when programmes are on
live|canlı yayınlanan|shown at the same time it happens`,
`I prefer documentaries ___ quiz shows.|to|than|from
The news ___ at eight every evening.|starts|start|starting
She enjoys ___ films with subtitles.|watching|watch|watches
How ___ episodes do you watch each week?|many|much|little
We don't ___ television during dinner.|watch|watches|watching
We watch the match ___; it is happening now.|live|last week|yesterday
The film was interesting, ___ the adverts were too long.|but|because|under
___ programme is about animals?|Which|Who|Whose`,
`News 18:00, documentary 18:30, quiz 19:30. What's after the news?|The documentary.|The quiz.|More news.
You want to learn about fish. What do you watch?|A nature documentary.|A shopping advert.|A football show.
We watch a match as it happens. It is ___.|Live.|A repeat.|An advert.
You can't hear the actors well. What can help?|Subtitles.|Turning the TV off.|A louder advert.
“I can't stand reality shows.” What does this mean?|I really hate them.|I love them.|I watch them standing.
Film: 20:00 to 21:30. How long is it?|Ninety minutes.|Thirty minutes.|Two hours.
Ada loves answering questions. Which programme is best for her?|A quiz show.|A weather report.|A nature documentary.
Why do you like documentaries?|Because I learn new things.|It starts at seven.|The remote is here.`),
pack(`venue|etkinlik yeri|the place where an event happens
RSVP|katılım yanıtı|please answer this invitation
confetti|konfeti|small pieces of coloured paper thrown at parties
caterer|yemek hizmeti sağlayan kişi|a company that cooks food for parties`,
`We need ___ balloons for the celebration.|some|much|a
How ___ juice should we buy?|much|many|few
There are twelve ___ on the guest list.|people|person|peoples
Please reply ___ Friday.|by|under|between
Let's ___ the venue first.|choose|chooses|choosing
We haven't got ___ cups for everyone.|enough|much|a
The caterer ___ bringing the food tomorrow.|is|are|am
Would you like tea ___ fruit juice?|or|because|under`,
`8 guests but only 5 cups. How many more?|Three.|Five.|Eight.
The card says “RSVP by Friday.” What do you do?|Answer before Friday.|Come on Friday.|Do nothing.
Party place: the town hall. What is the venue?|The town hall.|The guest list.|The menu.
We need 12 pizzas. We have 10. How many more?|Two.|Ten.|Twenty-two.
A guest can't eat nuts. What should you do?|Make food without nuts.|Hide nuts in food.|Ignore the guest.
Decorate at 14:00. Guests come at 16:00. What is first?|Decorating.|Welcoming the guests.|Serving the cake.
Invitation: Saturday, 5 p.m. What time is the party?|5 p.m.|5 a.m.|Saturday.
Which sentence is a polite offer?|Would you like some juice?|Bring me juice now.|You never like juice.`),
pack(`optimistic|iyimser|thinking good things will happen
pessimistic|kötümser|thinking bad things will happen
opportunity|fırsat|a chance to do something good
qualification|yeterlilik belgesi|an official paper that shows your training`,
`I think I ___ become a scientist one day.|will|was|did
She won't ___ her dream easily.|give up|gives up|gave up
We hope the future ___ brighter.|will be|were|did
He is optimistic ___ his future.|about|under|through
Perhaps people ___ use cleaner energy.|will|was|has
___ will you do after school? I may study engineering.|What|Who|Whose
My sister wants ___ abroad one day.|to study|studies|studied
They will need useful ___ for their jobs.|skills|skill|skilling`,
`Ela says, “Things will get better!” She is ___.|Optimistic.|Hopeless.|Bored.
Ada wants to be a doctor. What should she do?|Study science hard.|Stop all learning.|Miss every lesson.
“I will probably live near the sea.” What is it?|A prediction.|A past event.|An order.
What can a job course give you?|A qualification.|A birthday.|A train delay.
Efe thinks every plan will fail. He is ___.|Pessimistic.|Optimistic.|Sociable.
Which sentence shows a hope?|I hope to travel.|I travelled last year.|I am on a bus.
A scholarship opens next month. What is this?|An opportunity.|A problem.|A holiday.
Ali wants to win the race. Which plan is best?|Practise every day.|Never practise.|Hope for luck.`),
pack(`reception|danışma|the front desk where visitors ask questions
queue|sıra|a line of people waiting
opening hours|çalışma saatleri|the times when you can visit a place
receipt|fiş|a paper that shows you paid`,
`I went to the library ___ borrow a book.|to|for|at
We should wait ___ the queue.|in|on|under
The museum ___ at nine on weekdays.|opens|open|opening
Can you ___ me where reception is?|tell|tells|telling
There are two ___ near the hospital.|pharmacies|pharmacys|pharmacy
You need a receipt ___ return this item.|to|under|between
___ do people go to a bank? To get money.|Why|Who|Whose
The post office is next ___ the town hall.|to|in|at`,
`Open 09:00–17:00. You come at 18:00. Is it open?|No, it is closed.|Yes, for one more hour.|Yes, it opens at 18:00.
You need to send a parcel. Where should you go?|A post office.|A swimming pool.|A theatre.
You are lost in a hospital. Where can you ask?|At reception.|In a cupboard.|On the roof.
Four people are waiting in line. What do you do?|Join the queue.|Push to the front.|Pretend nobody is there.
When do you need a receipt?|When you return something.|When you name a planet.|When you describe an animal.
Library closes at 6:00. It's 5:30. How long is left?|Thirty minutes.|Ninety minutes.|Two hours.
Why do people go to a pharmacy?|To get medicine.|To buy bread.|To watch a film.
Where can you see very old objects?|A museum.|A bakery.|A car wash.`),
pack(`habitat loss|yaşam alanı kaybı|when animals lose the places where they live
insulation|yalıtım|material that keeps heat inside a house
carbon footprint|karbon ayak izi|how much CO2 your lifestyle makes
compost|kompost|old food and leaves turned into soil`,
`We should ___ energy whenever possible.|save|saves|saving
People mustn't ___ rubbish into rivers.|throw|throws|throwing
Using buses can reduce the number ___ cars.|of|at|under
There is too ___ plastic in this river.|much|many|few
Better insulation keeps homes ___ in winter.|warmer|warmest|warmly
Let's ___ these old vegetables.|compost|composts|composting
___ can we reduce waste? Repair and reuse things.|How|Whose|How old
If we protect forests, many animals ___ keep their homes.|will|was|did`,
`Our house is cold in winter. What helps?|Better insulation.|Opening all the windows.|Removing the walls.
Builders cut a forest for houses. What's the problem?|Habitat loss.|More forests.|More animal homes.
Your chair is broken. How can you reduce waste?|Repair it.|Throw it away.|Buy three new ones.
Four friends go to the same place. What is best?|Share one car.|Take four cars.|Take four taxis.
Old food and leaves become soil. What is it called?|Compost.|Glass.|Metal.
Our class stopped using plastic cups. What is better now?|Less waste.|More waste.|More plastic.
Which advice helps protect a river?|Keep litter out of it.|Pour paint into it.|Leave plastic by it.
How can you reduce your carbon footprint?|Walk or cycle more.|Use more petrol.|Leave the engine on.`),
pack(`axis|eksen|an imaginary line a planet spins on
crater|krater|a big round hole on a moon
launch|fırlatmak|to send a rocket into space
probe|uzay sondası|a spacecraft with no people that collects information`,
`Earth ___ around the Sun.|orbits|orbit|orbiting
The Sun is much ___ than Earth.|larger|largest|largely
Mercury is closer ___ the Sun than Neptune is.|to|from|at
A probe ___ not have people inside.|does|do|is
The spacecraft was ___ last year.|launched|launch|launching
Earth spins on its ___.|axis|receipt|venue
___ planet has big rings? Saturn.|Which|Who|Whose
There are many ___ on the Moon's surface.|craters|crater|cratering`,
`A spacecraft with no people sends information. What is it?|A probe.|A passenger plane.|A telescope.
Earth turns on its axis. What does this cause?|Day and night.|Rain and snow.|Earthquakes.
Earth is bigger than Mercury. Which planet is smaller?|Mercury.|Earth.|They are the same.
What do we call a round hole on the Moon?|A crater.|A forest.|A river.
What happens when a rocket launches?|It goes up into space.|It comes back home.|It lands on Earth.
Which object produces its own light?|The Sun.|The Moon.|Earth.
What can you do with a telescope?|Look at planets.|Measure flour.|Print a ticket.
A probe sends information to scientists. Why is it useful?|They learn about space.|They stop studying space.|They lose their jobs.`)
];
})(typeof globalThis!=='undefined'?globalThis:this);
