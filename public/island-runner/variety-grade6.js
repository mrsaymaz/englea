/* Additional contextual practice; teacher-editable in the game. */
(function(root){
const pack=(words,gaps,questions)=>({words,gaps,questions});
root.RunnerVariety=root.RunnerVariety||{};
root.RunnerVariety[6]=[
pack(`volunteer|gönüllü|a person who offers to help without payment
committee|komite|a group chosen to organise or decide something
notice|duyuru yazısı|a written announcement
cooperate|iş birliği yapmak|to work together towards a shared goal`,
`Every member ___ a responsibility in our club.|has|have|having
We must ___ the classroom tidy.|keep|keeps|keeping
The volunteers organise the event ___.|themselves|himself|herself
___ do you check the noticeboard? Every morning.|How often|How old|How much
Our committee meets ___ Wednesdays.|on|at|in
She helps younger students, ___ she?|doesn't|don't|isn't
We need to cooperate ___ finish on time.|to|from|under
Neither student is late. They are ___ here.|both|neither|none`,
`Notice: Volunteers meet at 13:00 in the hall. Where should helpers go?|The hall.|The canteen.|The gate.
Ece collects books; Ali sorts them. What are they doing together?|Cooperating.|Competing in a race.|Ignoring the task.
The classroom rule says to put books away after reading. Which action follows it?|Return books to the shelf.|Leave books on the floor.|Hide books under a chair.
Mina checks the noticeboard every school day. How often does she check it?|Five days a week.|Once a month.|Only on Sundays.
The event needs four helpers. Three students volunteer. How many more are needed?|One.|Three.|Four.
Ali cannot attend the meeting. What is the responsible thing to do?|Tell the organiser in advance.|Say nothing until next month.|Pretend he attended.
The committee chooses the concert date. What is its role here?|Making a shared decision.|Selling all the instruments.|Teaching every lesson.
“Can you carry these books?” Choose a helpful reply.|Yes, I'll help you.|They are expensive shoes.|No, it is Tuesday.`),
pack(`compare|karşılaştırmak|to examine similarities and differences
underline|altını çizmek|to draw a line below a word
outline|ana hatlar|a short plan of the main ideas
solution|çözüm|an answer to a problem`,
`Let's ___ the two answers before we decide.|compare|compares|comparing
You should underline the ___ words in the text.|important|importantly|importance
Our group ___ working on the project now.|is|am|be
We made this outline ___.|ourselves|myself|himself
Please listen ___ your partner's idea.|to|at|on
___ notes help you revise: clear or messy ones?|Which|Who|Whose
Ece usually ___ her notes after class.|reviews|review|reviewing
There are three possible ___ to this problem.|solutions|solution|solving`,
`Group roles: Ada reads, Efe writes, Can checks. Who should write the answer?|Efe.|Ada.|Can.
An outline lists the main ideas before writing. When is it most useful?|Before the first draft.|After deleting the whole text.|Only after handing it in.
You and a partner have different answers. What should you do first?|Compare your reasons.|Copy at random.|Refuse to discuss them.
Your notes say: read, discuss, write. What comes second?|Discuss.|Read.|Write.
The instruction says “Underline the verbs.” What do you mark?|Action words such as run.|Only people's names.|Every punctuation mark.
A group has 12 questions and 3 members. If shared equally, how many each?|Four.|Three.|Six.
“I don't understand this step.” Choose a useful response.|Let's look at an example.|Then stop learning forever.|It is my blue coat.
Ali studies a little each day. Ece studies only before tests. Who has a daily study routine?|Ali.|Ece.|Neither student.`),
pack(`confident|kendine güvenen|feeling sure of your abilities
modest|alçakgönüllü|not boasting about your achievements
freckle|çil|a small brown spot on the skin
shoulder|omuz|the body part where an arm joins the body`,
`My sister is confident. She speaks ___.|clearly|clear|clearness
Efe has short hair, but his brother's hair is ___.|long|tall|high
She doesn't ___ about her success. She is modest.|boast|boasts|boasting
Both students ___ wearing glasses today.|are|is|am
This jacket belongs to him. It is ___.|his|he|him
Ali is ___ than Can; he is 160 cm and Can is 150 cm.|taller|tallest|tall
___ does your cousin look like? She has curly hair.|What|Who|Where
I can introduce ___ to the new group.|myself|himself|ourselves`,
`Ece listens carefully and helps others. Which description fits best?|Kind and thoughtful.|Rude and selfish.|Careless and unhelpful.
Ali has curly hair; Can has straight hair. What is different?|Their hair.|Their school year.|Their nationality.
Mina wins a prize but does not boast. Which word describes her?|Modest.|Noisy.|Careless.
“What's she like?” Which answer describes personality?|She is patient.|She has brown eyes.|She is wearing boots.
“What does he look like?” Which answer fits?|He is tall with short hair.|He is very generous.|He enjoys chess.
One student is 155 cm; another is 165 cm. How much taller is the second?|10 cm.|20 cm.|30 cm.
A confident speaker forgets a word. What is a sensible response?|Pause and try another phrase.|Insult the audience.|Never speak again.
Ada shares her pens. Efe refuses to lend anything. Who is more generous in this situation?|Ada.|Efe.|They act the same way.`),
pack(`plumber|tesisatçı|a person who repairs water pipes
carpenter|marangoz|a person who makes or repairs wooden things
balcony|balkon|a platform outside an upper floor
cupboard|dolap|furniture with doors for storing things`,
`A plumber ___ broken pipes.|repairs|repair|repairing
We are going to ___ a bigger cupboard.|buy|buys|buying
The carpenter made this table ___.|himself|themselves|ourselves
There are two ___ beside the kitchen.|balconies|balconys|balcony
My parents ___ meeting the plumber tomorrow.|are|is|am
Please put the cups ___ the cupboard.|in|through|across
___ is your uncle's job? He is a carpenter.|What|Where|Whose
The new flat has ___ rooms than the old one: four instead of three.|more|fewer|less`,
`Water is leaking from a pipe. Who should repair it?|A plumber.|A photographer.|A pilot.
A wooden chair has a broken leg. Whose skills are most useful?|A carpenter's.|A dentist's.|A singer's.
Family plan: shop Saturday, move Sunday. When are they moving?|Sunday.|Saturday.|Friday.
The cups are behind the cupboard doors. Where are they?|Inside the cupboard.|Under the balcony.|On the roof.
Ece's flat has four rooms; Ali's has three. Which statement is true?|Ece's flat has more rooms.|Ali's flat has more rooms.|Both have five rooms.
“Who is coming tomorrow?” “The electrician.” What might they need help with?|An electrical fault.|A toothache.|A train reservation.
They are going to paint the walls next week. Is the work finished?|No, it is a future plan.|Yes, it finished yesterday.|Yes, it happens every morning.
A family has two adults and two children. How many chairs do they need for everyone?|Four.|Two.|Six.`),
pack(`rehearsal|prova|a practice before a public performance
fundraiser|bağış toplama etkinliği|an event held to collect money for a cause
cancellation|iptal|a decision that a planned event will not happen
schedule|program|a list of activities and their times`,
`There ___ a concert in the square yesterday.|was|were|are
The streets ___ crowded last Saturday.|were|was|is
We ___ the fundraiser last week.|organised|organise|organising
Did you ___ the rehearsal yesterday?|watch|watched|watching
The event didn't ___ because of the storm.|happen|happened|happening
___ was the concert? In the town hall.|Where|Who|Whose
They helped at the event ___.|themselves|himself|myself
The rehearsal started ___ six o'clock.|at|on|in`,
`Notice: Saturday's concert is cancelled. What does this mean?|It will not take place as planned.|It starts one hour earlier.|Tickets are free for everyone.
Yesterday the square was crowded; today it is empty. When were more people there?|Yesterday.|Today.|The numbers are equal.
Schedule: rehearsal 14:00, concert 18:00. Which happens first?|The rehearsal.|The concert.|They happen together.
The fundraiser collected money for new library books. What was its purpose?|To support the library.|To close the library.|To sell train tickets.
Ece: I was at the festival. Ali: I stayed at home. Who attended the festival?|Ece.|Ali.|Both of them.
Tickets cost 10 lira each. You bought two. How much did you pay?|20 lira.|10 lira.|30 lira.
The show was outdoors, but heavy rain began. Which change is sensible?|Move it to a safe indoor hall.|Ignore the dangerous weather.|Ask everyone to stand in water.
“Did you enjoy the event?” Which reply fits?|Yes, the music was great.|It is under the desk.|My brother is tall.`),
pack(`platform|peron|a place beside railway tracks where passengers wait
return ticket|gidiş-dönüş bileti|a ticket for travelling to a place and back
timetable|hareket çizelgesi|a list of departure and arrival times
junction|kavşak|a place where roads meet`,
`We ___ to İzmir by train last month.|went|go|going
Did she ___ a return ticket?|buy|bought|buying
The bus ___ late yesterday.|was|were|are
We waited ___ platform two.|on|into|under
They didn't ___ the last train.|catch|caught|catching
___ long was the journey? Two hours.|How|What|Who
I carried my bag ___.|myself|herself|themselves
There were many ___ at the station.|passengers|passenger|passing`,
`Timetable: departure 10:00; arrival 12:00. How long is the journey?|Two hours.|One hour.|Three hours.
You want to travel there and back. Which ticket should you ask for?|A return ticket.|A one-way ticket only.|A museum ticket.
Announcement: The train leaves from platform 3. Where should you wait?|Platform 3.|Platform 1.|The car park.
Efe travelled by bus; Ada travelled by train. Who used the railway?|Ada.|Efe.|Both.
The 09:00 bus left. It is now 09:10. What happened?|You missed the bus.|You are ten minutes early.|The bus leaves tomorrow.
A journey takes 30 minutes. You leave at 8:00. When do you arrive?|8:30.|8:15.|9:00.
“Did you walk to school yesterday?” Choose the matching answer.|No, I took the bus.|Yes, I will tomorrow.|It is a large city.
At a junction, two roads meet. What should a driver do?|Check carefully before proceeding.|Close their eyes.|Read a book while driving.`),
pack(`custom|geleneksel uygulama|a usual way of doing something in a culture
souvenir|hatıra eşyası|an object kept to remember a place
ceremony|tören|a formal event for a special occasion
portion|porsiyon|an amount of food served to one person`,
`We bought two ___ from the market.|souvenirs|souvenir|souveniring
This dish is served ___ rice.|with|between|underneath
How ___ portions do we need?|many|much|a little
Visitors should ___ local customs.|respect|respects|respecting
The ceremony ___ at noon yesterday.|started|start|starting
I made this traditional meal ___.|myself|himself|themselves
___ country is this food from?|Which|Who|Whose
We didn't ___ any food because we ordered enough.|waste|wasted|wasting`,
`Four visitors each want one portion. How many portions should you order?|Four.|Two.|Eight.
You buy a small handmade bowl to remember a trip. What is it?|A souvenir.|A platform.|A timetable.
A guest is unsure about a local custom. What should they do?|Ask politely.|Laugh at everyone.|Assume all customs are identical.
The menu says the soup contains milk. A guest cannot drink milk. What should they do?|Ask for a suitable alternative.|Order it without asking.|Add more milk.
The ceremony starts at 12:00. Arrive 15 minutes early. What time is that?|11:45.|12:15.|11:15.
One meal is shared by everyone at the table. Which behaviour is considerate?|Take a fair portion.|Take all the food.|Hide the serving spoon.
Ece tried a new dish and liked it. Which reply shows this?|It was delicious.|It was a railway station.|I didn't try anything.
A museum displays clothes from different cultures. What can visitors learn about?|Traditional ways of dressing.|Tomorrow's bus times.|Their own exam marks.`),
pack(`conserve|korumak (kaynak)|to use a resource carefully and avoid waste
compost|kompost|decayed plant material used to improve soil
refill|yeniden doldurmak|to fill a container again
emission|salım|a substance released into the air`,
`We should ___ water when brushing our teeth.|save|saves|saving
Don't ___ bottles on the trail.|leave|leaves|leaving
There is too ___ rubbish beside the river.|much|many|few
We can ___ this bottle instead of buying another.|refill|refills|refilling
The volunteers cleaned the park ___.|themselves|himself|herself
Cycling produces ___ exhaust than driving a petrol car.|less|fewer|many
If everyone helps, the park ___ be cleaner.|will|was|did
___ can we save electricity? Turn off unused lights.|How|Whose|How old`,
`A tap runs while nobody is using it. What should you do?|Turn it off.|Open another tap.|Leave it running.
You have a reusable bottle. Which choice creates less plastic waste?|Refill it.|Buy a new bottle every hour.|Throw it away after one drink.
Vegetable peel can become compost. Where can it go?|A suitable compost bin.|A river.|A glass recycling box.
Two friends live near school. Which journey has no petrol exhaust?|Walking.|Travelling alone by car.|Taking separate taxis.
The picnic ends with litter on the grass. What is the group's responsibility?|Collect it and dispose of it properly.|Hide it under a tree.|Leave it for animals.
The class used 10 paper sheets yesterday and 6 today. How many fewer today?|Four.|Six.|Sixteen.
A sign says “Stay on the path.” Why should walkers follow it?|To protect plants and habitats.|To step on more flowers.|To reach a private garden.
Which plan conserves electricity?|Switch off lights in an empty room.|Keep all lights on overnight.|Open the fridge door for hours.`),
pack(`forecast|hava tahmini|a prediction of the weather
observatory|gözlemevi|a place with equipment for studying space
crescent|hilal|the thin curved shape of a partly lit moon
cloudy|bulutlu|covered with many clouds`,
`The forecast says it ___ rain tomorrow.|will|was|did
We ___ the Moon through a telescope last night.|saw|see|seeing
The sky is too ___ to see many stars.|cloudy|cloud|clouds
Earth is ___ than Mercury.|larger|largest|largely
___ planet do we live on?|Which|Who|Whose
The students visited the observatory ___.|yesterday|tomorrow|next week
You should stay ___ during a dangerous storm.|indoors|above|underneath
There are ___ clouds now than before; the sky is clearing.|fewer|less|much`,
`Forecast: heavy rain in the afternoon. Which item is useful for going outside?|A raincoat.|A sunhat only.|A swimming medal.
You want to observe stars with a large telescope. Where could you go?|An observatory.|A bakery.|A railway platform.
The Moon looks like a thin curve tonight. Which shape is this?|A crescent.|A full circle.|A square.
Clouds cover the entire sky. Why might stars be hard to see?|The clouds block the view.|Stars have all disappeared.|The Moon has become Earth.
The temperature falls from 10°C to 4°C. What happened?|It became colder.|It became warmer.|It stayed the same.
An alert warns of a severe storm. What is the safest plan?|Follow official advice and stay sheltered.|Stand under a lone tree.|Swim in open water.
Earth takes about one year to go around the Sun. What does it orbit?|The Sun.|Mars.|The Moon.
The sky was clear yesterday but is cloudy today. Which day was better for stargazing?|Yesterday.|Today.|Both were fully cloudy.`),
pack(`efficient|verimli|working well without wasting energy or time
renewable|yenilenebilir|able to be naturally replaced
automatic|otomatik|working without constant human control
invention|icat|a new device or method created by someone`,
`I think future homes ___ use less energy.|will|was|did
Robots won't ___ every problem for us.|solve|solves|solved
Solar energy is ___.|renewable|renew|renewing
This machine works ___.|automatically|automatic|automation
There may be ___ electric buses in the future.|more|much|a little
We will still need ___ how to think for ourselves.|to learn|learns|learned
___ will people travel in the future? Perhaps by cleaner trains.|How|Whose|How old
Our invention will help people, ___ it?|won't|doesn't|isn't`,
`A lamp uses less electricity for the same light. What describes it?|More efficient.|More wasteful.|Less useful by definition.
Wind returns naturally and can generate power. What kind of energy source is it?|Renewable.|A single-use battery.|A fossil fuel.
“I think people will use cleaner transport.” What is this?|A prediction.|A past event.|A completed experiment.
A robot waters plants when the soil is dry. What makes it automatic?|It responds without a person each time.|It has no function.|It only works when pushed by hand.
A student invents a low-cost water filter. Which problem could it help address?|Access to cleaner water.|Missing football scores.|Late television programmes.
Ali says robots will help doctors. Ece says they will help teachers. Do their predictions have to conflict?|No, both roles are possible.|Yes, only one job can use robots.|Yes, robots can never help people.
Which sentence expresses a negative prediction?|Cars won't need petrol one day.|Cars used petrol yesterday.|Cars are parked outside.
A future device is useful but wastes resources. What improvement would help?|Make it more efficient.|Make it waste more energy.|Remove every useful function.`)
];
})(typeof globalThis!=='undefined'?globalThis:this);
