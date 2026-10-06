/* Context practice: four additional words, eight gaps and eight applied tasks per island. */
(function(root){
const pack=(words,gaps,questions)=>({words,gaps,questions});
root.RunnerVariety=root.RunnerVariety||{};
root.RunnerVariety[5]=[
pack(`member|üye|a person in a club or team
rehearsal|prova|a practice before a show
permission|izin|when someone says you can do something
international|uluslararası|about two or more countries`,
`Can I ___ the music club, please?|join|joins|joining
There are two new ___ in our club.|members|member|membership
Our school concert is ___ Friday.|on|at|in
Mina is from Italy. ___ is Italian.|She|Her|Hers
We need ___ before leaving the classroom.|permission|nationality|noise
The rehearsal starts at three. Please ___ late.|don't be|doesn't be|isn't
___ club do you like: chess or drama?|Which|Who|Where
I like music, ___ I don't like acting.|but|under|every`,
`Notice: Chess Club, Tuesday, Room 4. Where is the club?|Room 4.|The playground.|Room 2.
Ece likes acting. Which club is good for her?|Drama.|Chess.|Science.
Leo is from Italy, Mina from Türkiye. Who is Italian?|Leo.|Mina.|Both of them.
Library rule: Be quiet. What can you do there?|Read a book quietly.|Play loud music.|Shout to a friend.
Today is Thursday. When is the Friday club?|Tomorrow.|Today.|Yesterday.
Ali: “Can I join your game?” Choose a kind reply.|Sure, come and play.|No. Go away!|I am from France.
Sports club: 15:00. Drama club: 16:00. Which starts first?|Sports club.|Drama club.|They start together.
It is the Turkish flag. Which country is it?|Türkiye.|Italy.|Spain.`),
pack(`ruler|cetvel|a tool for drawing straight lines
scissors|makas|a tool for cutting paper
glue|yapıştırıcı|sticky stuff to put paper together
worksheet|çalışma kâğıdı|a paper with exercises on it`,
`There is one ___ on my desk.|ruler|rulers|ruling
There are three ___ next to the board.|boxes|box|boxs
We need scissors ___ the art lesson.|for|under|between
The lesson starts ___ half past nine.|at|in|on
This worksheet is mine. Please give it to ___.|me|my|I
We need to ___ the two pictures.|colour|colours|colouring
___ rulers are there? Three.|How many|How much|How old
I can't find my scissors. Can I borrow ___?|yours|you|your`,
`English 9:00, Art 10:00, Music 11:00. What comes after English?|Art.|Music.|English again.
You have 2 worksheets and get 3 more. How many?|Five.|Three.|Two.
The clock shows 8:00. What time is it?|Eight o'clock.|Half past eight.|Twelve o'clock.
What do you use to draw a straight line?|A ruler.|Glue.|Scissors.
How do you say 10:30?|Half past ten.|Quarter past ten.|Half past eleven.
Ada has one box. Efe has two. Who has more?|Efe.|Ada.|They have the same.
Your friend needs your glue. What do you say?|Here you are.|It is Wednesday.|I am twelve.
The bag is under the desk. Where is it?|Below the desk.|On the board.|In the cupboard.`),
pack(`elbow|dirsek|the middle of your arm; it bends
sleeve|kol (giysi)|the arm part of a shirt
striped|çizgili|with lines on it, like a zebra
brush|fırçalamak|to clean teeth or tidy hair`,
`She ___ her hair before school.|brushes|brush|brushing
My shirt has two long ___.|sleeves|sleeve|sleeving
This is Ali's coat. It is ___.|his|he|him
I wear a coat ___ it is cold.|because|but|or
My brother doesn't ___ striped shirts.|like|likes|liking
___ do you get dressed? After breakfast.|When|Whose|How many
These shoes ___ too small for me.|are|is|am
We ___ wear boots to bed.|never|always|every`,
`Mina brushes her teeth, then gets dressed. What is second?|Gets dressed.|Brushes her teeth.|Goes to bed.
What is a blue striped shirt?|A blue shirt with lines.|A plain red shirt.|A green shirt with spots.
It is rainy and cold. What do you wear?|A coat and boots.|Shorts and sandals.|A swimsuit and sunglasses.
Ada: 7:00. Ali: 8:00. Who gets up earlier?|Ada.|Ali.|They get up together.
“I never wear a hat.” What does never mean?|Not at any time.|Every time.|Most of the time.
One foot, two feet. Which sentence is correct?|My feet are cold.|My foots are cold.|My feets is cold.
The jacket is Ece's. Which sentence is right?|It is her jacket.|It is his jacket.|It is their jacket.
What has sleeves?|A shirt.|A shoe.|A belt.`),
pack(`nephew|erkek yeğen|the son of your brother or sister
niece|kız yeğen|the daughter of your brother or sister
hammock|hamak|a cloth bed that hangs between trees
puzzle|yapboz|a picture game with many small pieces`,
`Look! My uncle ___ fixing the chair.|is|are|am
My cousins ___ playing a game now.|are|is|am
Dad usually ___ dinner on Sundays.|cooks|cook|cooking
We are ___ a puzzle at the moment.|doing|does|do
My aunt's daughter is my ___.|cousin|grandmother|uncle
Mum isn't ___ TV. She is reading.|watching|watches|watch
___ your grandparents live near you?|Do|Does|Is
I help my parents. They help ___ too.|me|my|I`,
`Dad usually cooks. Now he is reading. What's he doing?|Reading.|Cooking.|Sleeping.
Can is your sister's son. Who is he?|Your nephew.|Your uncle.|Your father.
Your mother's sister is visiting. Who is she?|Your aunt.|Your niece.|Your daughter.
Ece is reading. Ali is painting. Who is painting?|Ali.|Ece.|Both of them.
Which sentence is about a daily routine?|We eat together every evening.|We are eating now.|Look! The soup is boiling.
Your cousin has heavy bags. What do you say?|Can I help you?|Where is Italy?|Do you like blue?
Dad is watering flowers outside. What is he doing?|Watering flowers.|Buying flowers.|Drawing flowers.
One puzzle piece is missing. What do you need?|The missing piece.|Another spoon.|A bus ticket.`),
pack(`bookshop|kitapçı|a shop that sells books
police station|polis merkezi|a building where police officers work
sports centre|spor merkezi|a place for exercise and sports
car park|otopark|a place to leave cars`,
`There ___ a bookshop near our school.|is|are|am
There are two ___ on this street.|bakeries|bakery|bakerys
The bank is ___ the cinema and the cafe.|between|under|into
You can buy bread ___ the bakery.|at|over|through
___ there any parks near here?|Are|Is|Am
Go straight on and turn ___ at the lights.|left|loud|hungry
The sports centre is opposite ___.|us|we|our
There aren't ___ cars in the car park today.|any|a|an`,
`You want to buy a book. Where do you go?|A bookshop.|A police station.|A car park.
The cafe is next to the bank. Where's the bank?|Next to the cafe.|Far from the cafe.|Inside the cafe.
Sign: Turn right for the library. What do you do?|Go right.|Go left.|Go back home.
There are two parks and one hospital. How many parks?|Two.|One.|Three.
You want to play basketball. Where can you go?|The sports centre.|The bakery.|The post office.
The car park is full. What does this mean?|No space for more cars.|There are no cars.|It sells new cars.
“Is there a bank near here?” Which answer is right?|Yes, opposite the school.|I am eleven.|I like swimming.
Museum: open until 5:00. It is 6:00. Is it open?|No, it is closed.|Yes, it is open.|Yes, until 7:00.`),
pack(`safe|güvenli|not dangerous
lively|canlı|full of life and fun
high|yüksek|far above the ground
low|alçak|close to the ground`,
`The tower is taller ___ the house.|than|then|that
This road is ___ than the main road. There are fewer cars.|quieter|quietest|quiet
Our park is more ___ than the noisy square.|peaceful|peacefully|peace
These streets ___ wider than that path.|are|is|am
The village isn't as busy ___ the city.|as|than|from
The new bridge is ___ than the old one.|safer|safest|safely
Which building is ___: 20 metres or 30 metres?|higher|highest|highly
I like the park ___ it is quiet.|because|but|or`,
`Which is taller: a 40-metre or 25-metre tower?|The 40-metre tower.|The 25-metre tower.|They are the same.
Which street is quieter: 3 cars or 30 cars?|The street with 3 cars.|The street with 30 cars.|They are the same.
Village: 200 people. City: 20,000. Which has more people?|The city.|The village.|They are the same.
Cafe: quiet. Station: noisy. Where is it easier to read?|The cafe.|The station.|Both are noisy.
The old road has holes. Which road is safer?|The new road.|The old road.|Both are the same.
Park A: 10 minutes. Park B: 5. Which is nearer?|Park B.|Park A.|They are the same.
Shop A: 20 lira. Shop B: 40. Which is cheaper?|Shop A.|Shop B.|They are the same.
Which sentence compares two places?|Parks are greener than squares.|The park is near me.|The park has a tree.`),
pack(`fork|çatal|a tool with points used for eating
spoon|kaşık|a tool for eating soup
saucer|fincan tabağı|a small plate under a cup
napkin|peçete|paper or cloth used to wipe your mouth`,
`How ___ water would you like?|much|many|any
There are two ___ on the table.|spoons|spoon|spooning
I'd like ___ apple, please.|an|a|two
May I ___ the menu, please?|see|sees|seeing
There isn't ___ milk in the fridge.|any|a|many
We need a ___ of bread for each sandwich.|slice|litre|bottle
Would you like tea ___ juice?|or|because|under
This soup is hot. Eat it ___.|carefully|careful|care`,
`Menu: soup 30 lira, salad 20 lira. Which is cheaper?|The salad.|The soup.|Both cost the same.
What do you eat soup with?|A spoon.|A fork.|A ruler.
Waiter: “Anything to drink?” What do you say?|Water, please.|A fork, please.|Two sandwiches, please.
You have one apple. You need three. How many more?|Two.|Three.|Four.
“I'm full, thank you.” What does it mean?|I don't want more food.|I am very hungry.|I want the menu.
How do you ask for the bill politely?|The bill, please.|Give me food now!|Where is the library?
You need milk for the recipe. What do you buy?|Milk.|A fork.|A napkin.
There are four people and three spoons. What is missing?|One spoon.|Three spoons.|Four people.`),
pack(`beak|gaga|the hard mouth of a bird
paw|pati|the foot of a cat or dog
feather|tüy (kuş)|one of the soft parts covering a bird
fin|yüzgeç|a body part that helps a fish swim`,
`A bird uses its ___ to pick up food.|beak|paw|fin
Penguins can swim, ___ they can't fly.|but|because|under
Two ___ are sleeping by the tree.|foxes|fox|foxs
A fish ___ got fins.|has|have|is
___ can an eagle do? It can fly.|What|Whose|How many
These animals live ___ the forest.|in|on|at
An elephant is ___ than a rabbit.|heavier|heaviest|heavily
Please don't ___ wild animals.|feed|feeds|feeding`,
`It has feathers and a beak. What is it?|A bird.|A fish.|A cat.
A fish has fins. What can it do?|Swim.|Fly.|Climb trees.
Sign: Do not feed the animals. What do you do?|Don't give them food.|Give them bread.|Give them sweets.
A fox has four paws. Two foxes have how many?|Eight.|Four.|Six.
Camels live in deserts. What is a desert like?|Dry and sandy.|Deep and wet.|Icy and cold.
Duck: swimming. Eagle: flying. Which one is in the water?|The duck.|The eagle.|Both.
What can a rabbit do?|It can jump.|It is white.|It has long ears.
You find a hurt bird. Who can help?|An animal doctor.|A ticket seller.|A bus driver.`),
pack(`shore|kıyı|the land next to a sea or lake
hill|tepe|a small mountain
plain|ova|a large area of flat land
cave|mağara|a big dark hole in rock`,
`There ___ a cave behind the waterfall.|is|are|am
Two rivers ___ through this valley.|flow|flows|flowing
The lake is ___ than the small pond.|deeper|deepest|deeply
We walk ___ the shore, beside the water.|along|under|into
This mountain is covered ___ snow.|with|to|at
___ is the island? In the middle of the lake.|Where|Who|Whose
Mountains are usually ___ than hills.|higher|highest|highly
Don't ___ rubbish near the river.|leave|leaves|leaving`,
`Water falls from a high rock. What is it?|A waterfall.|A plain.|A desert.
What is an island?|Land with water all around.|A hole in a rock.|Flat land with no water.
You step off the boat onto land. Where are you?|On the shore.|On a mountain top.|Inside a cave.
What carries water from a lake to the sea?|A river.|A hill.|A cave.
Which is higher: a 2,000-metre or 1,500-metre mountain?|The 2,000-metre mountain.|The 1,500-metre mountain.|They are the same.
What is a plain like?|Flat and wide.|High and rocky.|Deep and dark.
It rains a lot. What happens to the river?|It gets deeper.|It gets smaller.|It turns into sand.
A cave is dark. What helps you see?|A torch.|A spoon.|Sunglasses.`),
pack(`passport|pasaport|a document for travelling to other countries
campsite|kamp alanı|a place where you stay in tents
backpack|sırt çantası|a bag carried on your back
departure|hareket (yolculuk)|the time you leave on a trip`,
`We are going to ___ at the campsite.|stay|stays|staying
Mina ___ going to visit her cousins tomorrow.|is|are|am
They are ___ to travel by train.|going|go|goes
I am not going ___ a heavy suitcase.|to take|taking|takes
___ are you going to stay? At a hotel.|Where|Who|Whose
Our train leaves ___ nine o'clock.|at|in|on
We need two ___ for the journey.|tickets|ticket|ticketing
I'm going to pack a coat ___ it is cold there.|because|but|or`,
`Ada has a tent. Where is she going to stay?|At a campsite.|At a swimming pool.|In a museum.
Ticket: departure 08:00. What happens at 8:00?|The trip starts.|Lunch ends.|The trip ends.
Where can you get a train?|The train station.|The beach.|The bookshop.
“I am going to visit Ankara.” When is the visit?|In the future.|In the past.|Every day.
You are going to another country. What do you need?|A passport.|A worksheet.|A menu.
Mina wants her hands free. Which bag is best?|A backpack.|Two shopping bags.|A big handbag.
Bus at 9:00. You arrive at 8:45. Early or late?|Early.|Late.|Exactly on time.
What do you pack for the beach?|A swimsuit and a towel.|Glue and a frying pan.|A ruler and scissors.`)
];
})(typeof globalThis!=='undefined'?globalThis:this);
