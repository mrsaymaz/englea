/* Context practice: four additional words, eight gaps and eight applied tasks per island. */
(function(root){
const pack=(words,gaps,questions)=>({words,gaps,questions});
root.RunnerVariety=root.RunnerVariety||{};
root.RunnerVariety[5]=[
pack(`member|üye|a person who belongs to a club
rehearsal|prova|a practice before a performance
permission|izin|approval to do something
international|uluslararası|involving more than one country`,
`Can I ___ the music club, please?|join|joins|joining
There are two new ___ in our club.|members|member|membership
Our school concert is ___ Friday.|on|at|in
Mina is from Italy. ___ is Italian.|She|Her|Hers
We need ___ before leaving the classroom.|permission|nationality|noise
The rehearsal starts at three. Please ___ late.|don't be|doesn't be|isn't
___ club do you prefer: chess or drama?|Which|Who|Where
I like music, ___ I don't like acting.|but|under|every`,
`Notice: CHESS CLUB — Tuesday, Room 4. Where should a new member go?|Room 4.|The playground.|Room 2.
Deniz enjoys singing. Ece enjoys acting. Which club suits Ece?|Drama.|Chess.|Science.
Leo: I'm from Italy. Mina: I'm from Türkiye. Which statement is true?|They are from different countries.|Both are from Italy.|Both are from Türkiye.
Library rule: Work quietly. Which action follows the rule?|Read without shouting.|Play loud music.|Call across the room.
The club meets on Friday. Today is Thursday. When is the meeting?|Tomorrow.|Today.|Yesterday.
Your friend says, “May I join your game?” Choose a welcoming reply.|Of course. Come and play.|Don't read this book.|It is in France.
Sports club: 15:00. Drama club: 16:00. Which starts first?|Sports club.|Drama club.|They start together.
The flag belongs to Türkiye. Which nationality matches it?|Turkish.|Italian.|Spanish.`),
pack(`ruler|cetvel|a tool for measuring short lengths
scissors|makas|a tool with two blades for cutting paper
glue|yapıştırıcı|a sticky material used to join things
worksheet|çalışma kâğıdı|a sheet with exercises to complete`,
`There is one ___ on my desk.|ruler|rulers|ruling
There are three ___ beside the board.|boxes|box|boxs
We need scissors ___ this art activity.|for|under|between
The lesson begins ___ half past nine.|at|in|on
This worksheet is mine. Please give it to ___.|me|my|I
Our teacher asks us to ___ the two pictures.|compare|compares|comparing
___ rulers are there? Three.|How many|How much|How old
I can't find my scissors. Can I borrow ___?|yours|you|your`,
`Timetable: English 09:00; Art 10:00; Music 11:00. What follows English?|Art.|Music.|English again.
You have two worksheets. The teacher gives you three more. How many now?|Five.|Three.|Two.
The short hand is at 8 and the long hand at 12. What time is it?|Eight o'clock.|Half past eight.|Twelve o'clock.
You need to draw a straight line. Which tool should you use?|A ruler.|Glue.|Scissors.
The lesson starts at 10:30. Which time means the same?|Half past ten.|Quarter past ten.|Half past eleven.
Ada has one box. Efe has two boxes. Which sentence is correct?|Efe has more boxes.|Ada has more boxes.|They have the same number.
Your classmate needs your glue. Which reply is helpful?|Here you are.|It is Wednesday.|I am twelve.
There is a bag under the desk. Where should you look for it?|Below the desk.|On the board.|Inside the clock.`),
pack(`elbow|dirsek|the joint in the middle of an arm
sleeve|kol (giysi)|the part of a shirt that covers an arm
striped|çizgili|having a pattern of lines
brush|fırçalamak|to clean or tidy using a brush`,
`She ___ her hair before school.|brushes|brush|brushing
My shirt has two long ___.|sleeves|sleeve|sleeving
This is Ali's coat. It is ___.|his|he|him
I wear a coat ___ it is cold.|because|but|or
My brother doesn't ___ striped shirts.|like|likes|liking
___ do you get dressed? After breakfast.|When|Whose|How many
These shoes ___ too small for me.|are|is|am
We ___ wear boots to bed.|never|always|every`,
`Mina brushes her teeth, gets dressed and leaves home. What does she do second?|Gets dressed.|Leaves home.|Brushes her teeth.
Efe wears a blue striped shirt. Which description matches?|A blue shirt with lines.|A plain red shirt.|A green shirt with spots.
It is raining and cold. Which pair is suitable?|A coat and boots.|Shorts and sandals.|A swimsuit and sunglasses.
Ada wakes up at 7:00. Ali wakes up at 8:00. Who gets up earlier?|Ada.|Ali.|They get up together.
“I never wear a hat.” What does this mean?|I don't wear a hat at any time.|I wear one every day.|I wear one on most days.
One foot, two feet. Which sentence is correct?|My feet are cold.|My foots are cold.|My feets is cold.
The jacket belongs to Ece. Which sentence has the same meaning?|It is her jacket.|It is his jacket.|It is their jackets.
A sleeve is part of which item?|A shirt.|A shoe.|A belt.`),
pack(`nephew|erkek yeğen|the son of your brother or sister
niece|kız yeğen|the daughter of your brother or sister
hammock|hamak|a hanging bed made of cloth or rope
puzzle|yapboz|a game of fitting pieces together`,
`Look! My uncle ___ fixing the chair.|is|are|am
My cousins ___ playing a game now.|are|is|am
Dad usually ___ dinner on Sundays.|cooks|cook|cooking
We are ___ a puzzle at the moment.|doing|does|do
My aunt's daughter is my ___.|cousin|grandmother|uncle
Mum isn't ___ TV. She is reading.|watching|watches|watch
___ your grandparents live near you?|Do|Does|Is
I help my parents. They help ___ too.|me|my|I`,
`Dad cooks every Sunday. Today is Sunday, but he is reading now. What is he doing now?|Reading.|Cooking.|Sleeping.
Aunt Selin has a son, Can. What is Can to Selin's sister?|Her nephew.|Her uncle.|Her father.
Your mother's sister is visiting. Who is she?|Your aunt.|Your niece.|Your daughter.
Ece is reading. Ali is painting. Neither is watching TV. Who is painting?|Ali.|Ece.|Both of them.
“Usually” describes a routine. Which sentence is a routine?|We eat together every evening.|We are eating now.|Look! The soup is boiling.
Your cousin is carrying heavy bags. What can you offer?|Can I help you?|Where is Italy?|Do you like blue?
Mum: Where is Dad? Ada: He is in the garden, watering flowers. What is Dad doing?|Watering flowers.|Buying flowers.|Drawing flowers.
They have a puzzle with one missing piece. What do they need?|The missing piece.|Another spoon.|A bus ticket.`),
pack(`bookshop|kitapçı|a shop that sells books
police station|polis merkezi|a building where police officers work
sports centre|spor merkezi|a place for exercise and sports
car park|otopark|an area where cars can be left`,
`There ___ a bookshop near our school.|is|are|am
There are two ___ on this street.|bakeries|bakery|bakerys
The bank is ___ the cinema and the cafe.|between|under|into
You can buy bread ___ the bakery.|at|over|through
___ there any parks near here?|Are|Is|Am
Walk straight and turn ___ at the lights.|left|loud|hungry
The sports centre is opposite ___.|us|we|our
There aren't ___ cars in the car park today.|any|a|an`,
`You need a new dictionary. Which place should you visit?|A bookshop.|A police station.|A car park.
The cafe is between the bank and the school. What is next to the cafe?|The bank.|The airport.|The forest.
Sign: LIBRARY — turn right. What should you do?|Go right.|Go left.|Go back home.
There are two parks and one hospital. Which place is more numerous?|Parks.|Hospitals.|They are equal.
You want to play indoor basketball. Where can you go?|The sports centre.|The bakery.|The post office.
The car park is full. What does this mean?|There are no empty parking spaces.|There are no cars.|It sells new cars.
A tourist asks, “Is there a bank nearby?” Which reply answers the question?|Yes, opposite the school.|I am eleven.|I like swimming.
The museum closes at 5:00. You arrive at 6:00. What is true?|The museum is closed.|It opens in one minute.|You arrived before closing.`),
pack(`safe|güvenli|protected from danger
lively|canlı|full of energy and activity
high|yüksek|far above the ground
low|alçak|not far above the ground`,
`The tower is taller ___ the house.|than|then|that
This road is ___ than the main road. There are fewer cars.|quieter|quietest|quiet
Our park is more ___ than the noisy square.|peaceful|peacefully|peace
These streets ___ wider than that path.|are|is|am
The village isn't as busy ___ the city.|as|than|from
This bridge is ___ than the old bridge. It has strong new rails.|safer|safest|safely
Which building is ___, the 20-metre one or the 30-metre one?|higher|highest|highly
I prefer the park ___ it is quiet.|because|but|or`,
`Tower A is 40 metres tall. Tower B is 25 metres tall. Which is taller?|Tower A.|Tower B.|They are the same height.
Street A has 3 cars; Street B has 30. Which is less busy?|Street A.|Street B.|Both are equally busy.
A village has 200 people. A city has 20,000. Which has more people?|The city.|The village.|They have equal populations.
The cafe is quiet. The station is noisy. Where is it easier to read quietly?|The cafe.|The station.|Both are noisy.
The old road has holes. The new road is smooth. Which is safer for a bicycle?|The new road.|The old road.|The road with more holes.
Park A is 10 minutes away. Park B is 5 minutes away. Which is nearer?|Park B.|Park A.|Both are equally near.
An item costs 20 lira here and 40 lira there. Which price is cheaper?|20 lira.|40 lira.|Both are the same.
Which sentence compares two places?|The park is greener than the square.|The park is near my house.|There is a tree in the park.`),
pack(`fork|çatal|a tool with points used for eating
spoon|kaşık|a tool with a small bowl used for eating
saucer|fincan tabağı|a small plate under a cup
napkin|peçete|paper or cloth used to wipe your mouth`,
`How ___ water would you like?|much|many|any
There are two ___ on the table.|spoons|spoon|spooning
I'd like ___ apple, please.|an|a|two
May I ___ the menu, please?|see|sees|seeing
There isn't ___ milk in the jug.|any|a|many
We need a ___ of bread for each sandwich.|slice|litre|bottle
Would you like tea ___ juice?|or|because|under
This soup is hot. Eat it ___.|carefully|careful|care`,
`Menu: soup 30 lira; salad 20 lira. Which costs less?|The salad.|The soup.|Both cost the same.
You need to eat soup. Which tool is most useful?|A spoon.|Scissors.|A ruler.
The waiter asks, “Anything to drink?” Which answer fits?|Water, please.|A fork, please.|Two sandwiches, please.
You have one apple and need three. How many more do you need?|Two.|Three.|Four.
“I'm full, thank you.” What is the speaker saying?|They don't want more food.|They need more food.|They want the menu.
A customer asks politely for the bill. Which sentence fits?|Could I have the bill, please?|Give food now!|Where is the library?
A recipe needs milk, but the bottle is empty. What should you buy?|Milk.|A fork.|A napkin.
There are four guests and three spoons. What is missing?|One spoon.|Three spoons.|Four guests.`),
pack(`beak|gaga|the hard mouth of a bird
paw|pati|the foot of a cat or dog
feather|tüy (kuş)|one of the soft parts covering a bird
fin|yüzgeç|a body part that helps a fish swim`,
`A bird uses its ___ to pick up food.|beak|paw|fin
Ducks can swim, ___ they can't breathe underwater.|but|because|under
Two ___ are sleeping by the tree.|foxes|fox|foxs
A fish ___ got fins.|has|have|is
___ can an eagle do? It can fly.|What|Whose|How many
These animals live ___ the forest.|in|on|at
An elephant is ___ than a rabbit.|heavier|heaviest|heavily
Please don't ___ wild animals.|feed|feeds|feeding`,
`It has feathers, a beak and two wings. Which animal fits?|A bird.|A fish.|A cat.
A fish lives in water and uses fins. Which action can it do?|Swim.|Fly with wings.|Climb with paws.
The sign says “Do not feed the animals.” What should visitors do?|Keep their food to themselves.|Give bread to every animal.|Leave sweets in the cage.
A fox has four paws. How many paws do two foxes have?|Eight.|Four.|Six.
Camels live in deserts. Which habitat matches?|A dry, sandy place.|A deep ocean.|An icy sea.
The duck is swimming. The eagle is flying. Which one is in the water?|The duck.|The eagle.|Both.
Which sentence describes an ability?|A rabbit can jump.|A rabbit is white.|A rabbit has long ears.
An injured bird needs help. Who should you ask?|An adult or animal expert.|A ticket seller.|A bus passenger for candy.`),
pack(`shore|kıyı|the land along the edge of a sea or lake
hill|tepe|a raised area of land smaller than a mountain
plain|ova|a large area of flat land
cave|mağara|a large natural hole in rock`,
`There ___ a cave behind the waterfall.|is|are|am
Two rivers ___ through this valley.|flow|flows|flowing
The lake is ___ than the small pond.|deeper|deepest|deeply
We walk ___ the shore, beside the water.|along|under|into
This mountain is covered ___ snow.|with|to|at
___ is the island? In the middle of the lake.|Where|Who|Whose
Mountains are usually ___ than hills.|higher|highest|highly
Don't ___ litter beside the river.|leave|leaves|leaving`,
`Water falls from a high rock into a pool. What is this feature?|A waterfall.|A plain.|A desert.
An island has water on every side. Which description matches?|Land surrounded by water.|A hole inside rock.|Flat land without water.
You leave the boat and stand at the edge of the lake. Where are you?|On the shore.|At the summit.|Inside a cave.
The map shows a blue line joining a lake to the sea. What is it likely to be?|A river.|A hill.|A road made of sand.
One mountain is 2,000 metres high; another is 1,500 metres. Which is higher?|The 2,000-metre mountain.|The 1,500-metre mountain.|They are equal.
A plain is flat. Which activity needs the least climbing there?|Walking across it.|Climbing a cliff.|Reaching a mountain summit.
Rain fills the river and it becomes deeper. What changed?|The water level.|The number of mountains.|The length of the road.
A cave is dark inside. What would help you see safely?|A torch.|A spoon.|Sunglasses.`),
pack(`passport|pasaport|an official document used for international travel
campsite|kamp alanı|a place where people can put up tents
backpack|sırt çantası|a bag carried on your back
departure|hareket (yolculuk)|the act of leaving to start a journey`,
`We are going to ___ at the campsite.|stay|stays|staying
Mina ___ going to visit her cousins tomorrow.|is|are|am
They are ___ to travel by train.|going|go|goes
I am not going ___ a heavy suitcase.|to take|taking|takes
___ are you going to stay? At a hotel.|Where|Who|Whose
Our train leaves ___ nine o'clock.|at|in|on
We need two ___ for the journey.|tickets|ticket|ticketing
I'm going to pack a coat ___ it may be cold.|because|but|or`,
`Ada plans to sleep in a tent. Where is she going to stay?|At a campsite.|At a swimming pool.|In a museum.
Ticket: departure 08:00. What does this time tell you?|When the journey starts.|When lunch ends.|When the trip was booked.
Efe is going to take a train. Which place should he go to?|The railway station.|The beach.|The bookshop.
“I am going to visit Ankara tomorrow.” Is this a plan or a past event?|A plan.|A past event.|A daily habit only.
You are travelling to another country. Which document may you need?|A passport.|A worksheet.|A restaurant menu.
Mina wants to carry both hands free. Which bag is best?|A backpack.|Two shopping bags.|A bag held in each hand.
The coach leaves at 9:00. You arrive at 8:45. Are you early or late?|Early.|Late.|Exactly on time.
You plan a beach holiday. Which pair should you pack?|A swimsuit and a towel.|A frying pan and glue.|A ruler and a saw.`)
];
})(typeof globalThis!=='undefined'?globalThis:this);
