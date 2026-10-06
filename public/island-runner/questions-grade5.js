/* Original supplementary practice. Each row: prompt | correct | distractor | distractor. */
(function(root){
const pack=(words,gaps,questions)=>({words,gaps,questions});
root.RunnerExpansion=root.RunnerExpansion||{};
root.RunnerExpansion[5]=[
pack(`playground|oyun alanı|an outdoor place where children play
laboratory|laboratuvar|a room for science experiments
headteacher|okul müdürü|the leader of a school
secretary|sekreter|a person who works in the school office
coach|antrenör|a person who trains a sports team
gate|kapı|a door in a fence or wall
noticeboard|duyuru panosu|a board for school news and notes
chess|satranç|a board game with kings and queens
drama|tiyatro|acting in plays
country|ülke|a land like Türkiye or Spain
nationality|milliyet|where you are from, like Turkish or Italian
celebration|kutlama|a happy party for a special day
flag|bayrak|a cloth with a country’s colours
noise|gürültü|a loud, bad sound
join|katılmak|to become a member of a group
rule|kural|something you must or mustn’t do`,
`I ___ from Türkiye.|am|is|are
Efe and Ada ___ in the chess club.|are|is|am
___ is your English teacher? Ms Kaya.|Who|Where|When
We ___ shout in the school library.|mustn’t|are|have
Please ___ quietly in the corridor.|walk|walks|walking
Deniz likes ___ chess.|playing|play|plays
Mr Demir is ___ English teacher.|an|a|they
This is my friend. ___ is from Spain.|He|They|We
Our club meets ___ Mondays.|on|at|under
___ your brother like the drama club?|Does|Do|Is
The science club ___ after school.|meets|meet|meeting
The children ___ from Italy.|are|is|am`,
`Where do you do science experiments?|In the laboratory.|At the school gate.|In the canteen.
Which club is for acting?|The drama club.|The chess club.|The sports club.
Where are you from?|I’m from Türkiye.|I’m eleven.|I’m in the garden.
What is your nationality?|I’m Turkish.|I’m at school.|I’m in Class 5-A.
You want to enter a classroom. What do you say?|May I come in?|How many goals?|Where are your shoes?
Where can you read the school rules?|On the noticeboard.|On the lunch menu.|On the weather map.`),
pack(`desk|sıra|a table for students in class
pencil case|kalem kutusu|a small bag or box for pens
eraser|silgi|it takes away pencil marks
marker|tahta kalemi|a pen for writing on the board
bookshelf|kitaplık|shelves for keeping books
science|fen bilimleri|the lesson about plants, animals and experiments
music|müzik|the lesson with songs and instruments
art|görsel sanatlar|the lesson with painting and drawing
weekday|hafta içi günü|a day from Monday to Friday
weekend|hafta sonu|Saturday and Sunday together
noon|öğle|twelve o’clock in the daytime
quarter|çeyrek|one of four equal parts
borrow|ödünç almak|to take something for a short time
lend|ödünç vermek|to give something for a short time
raise|kaldırmak|to move something up
carefully|dikkatlice|with attention, so nothing goes wrong`,
`There ___ one dictionary on my desk.|is|are|am
There are four ___ in my pencil case.|erasers|eraser|erasing
Please give ___ the marker. I need it.|me|I|my
Ayşe needs her book. Give it to ___.|her|she|hers
9:15 is quarter ___ nine.|past|to|at
9:45 is quarter ___ ten.|to|past|on
Our maths lesson is ___ Tuesday.|on|in|at
We ___ got two English lessons today.|have|has|are
Ece ___ got a new notebook.|has|have|is
Please ___ your hand before speaking.|raise|raises|raising
Do not ___ in class. Speak quietly.|shout|shouts|shouting
One box, two ___.|boxes|boxs|boxies`,
`What day comes after Wednesday?|Thursday.|Tuesday.|Friday.
What time is 11:45?|Quarter to twelve.|Quarter past eleven.|Half past twelve.
Which two days are the weekend?|Saturday and Sunday.|Monday and Tuesday.|Thursday and Friday.
Can I borrow your eraser?|Yes, here you are.|It is Thursday.|They are at home.
You want to answer in class. What do you do?|Raise my hand.|Shout at everyone.|Run to the door.
What time is 7:00?|Seven o’clock.|Half past seven.|Quarter to seven.`),
pack(`neck|boyun|the body part between your head and shoulders
finger|el parmağı|you have five on each hand
knee|diz|the middle part of your leg; it bends
teeth|dişler|the white parts in your mouth for biting
straight|düz|not curly or wavy
wavy|dalgalı|a little curly, like sea waves
scarf|atkı|you wear it around your neck in winter
belt|kemer|it holds your trousers up
boots|çizme|tall shoes for rain or snow
trousers|pantolon|clothes that cover your two legs
sunglasses|güneş gözlüğü|dark glasses for sunny days
comfortable|rahat|it feels nice to wear or sit in
usually|genellikle|most of the time
always|her zaman|all the time, every day
never|asla|zero times; not one time
get dressed|giyinmek|to put your clothes on`,
`He ___ his teeth every morning.|brushes|brush|brushing
I ___ my homework after school.|do|does|doing
She doesn’t ___ glasses.|wear|wears|wearing
___ you get up at seven?|Do|Does|Are
This is her jacket. ___ jacket is green.|Her|She|Hers
We put our shoes on our ___.|feet|foots|foot
One tooth, two ___.|teeth|tooths|toothes
Ali reads every day, ___ he?|doesn’t|don’t|isn’t
They walk to school, ___ they?|don’t|doesn’t|isn’t
I ___ wear gloves in summer. It is too hot.|never|always|every
My brother ___ up at half past six.|gets|get|getting
You ___ your coat in cold weather.|wear|wears|wearing`,
`Which sentence is about hair?|It is long and wavy.|It is a blue scarf.|It is a silver watch.
What do you wear when it rains?|A raincoat.|Sunglasses only.|A swimming costume.
When do you brush your teeth?|Every morning and night.|Only on Sundays.|Once a year.
Does your brother wear a cap?|Yes, he does.|Yes, he is.|Yes, I am.
Which word means “every time”?|Always.|Never.|Sometimes.
Where do you wear a belt?|Around your waist.|On your fingers.|Around your ankles.`),
pack(`aunt|teyze veya hala|your mother’s or father’s sister
uncle|dayı veya amca|your mother’s or father’s brother
cousin|kuzen|the child of your aunt or uncle
grandparents|büyükanne ve büyükbaba|your mum and dad’s parents
picnic|piknik|a meal on a blanket in a park
barbecue|mangal|cooking meat on a fire outside
tent|çadır|a small cloth house for camping
guitar|gitar|a music instrument with six strings
camera|fotoğraf makinesi|a machine for taking photos
board game|masa oyunu|a game like chess or Ludo
pet care|evcil hayvan bakımı|looking after your cat or dog
tidy up|toparlamak|to put things back in their places
relax|dinlenmek|to rest and feel calm
swimming|yüzme|moving your arms and legs in water
dancing|dans etme|moving your body to music
take a photograph|fotoğraf çekmek|to make a picture using a camera`,
`Mum ___ watering the flowers now.|is|are|am
The children ___ playing a board game.|are|is|am
I am ___ my bedroom at the moment.|tidying|tidy|tidies
Listen! My cousin ___ the guitar.|is playing|play|plays
We usually ___ at home on Mondays.|stay|stays|staying
Today we ___ camping by a lake.|are|is|am
My uncle isn’t ___ TV now.|watching|watch|watches
___ your aunt cooking dinner?|Is|Are|Do
They are taking photos, ___ they?|aren’t|isn’t|don’t
She is reading, ___ she?|isn’t|aren’t|doesn’t
My dad ___ the dog every evening.|feeds|feed|feeding
This camera belongs to me. It is ___.|mine|my|me`,
`Who is your aunt’s son?|Your cousin.|Your uncle.|Your grandfather.
What do you sleep in at a camp?|A tent.|A camera.|A guitar.
Mum is in the garden. What is she doing?|She is watering the flowers.|She has green eyes.|She is a teacher.
Are the children dancing now?|No, they are singing.|No, they don’t.|No, she isn’t.
Which sentence is about a routine?|We visit Grandma on Sundays.|We are visiting her now.|Look! They are visiting.
What do you take photos with?|A camera.|A tent.|A board game.`),
pack(`neighbour|komşu|a person who lives next to you
street|sokak|a road with houses on both sides
hospital|hastane|a place where doctors help sick people
pharmacy|eczane|a place where you buy medicine
supermarket|süpermarket|a big shop for food and drinks
cinema|sinema|a place where you watch films
bus stop|otobüs durağı|a place where people wait for a bus
post office|postane|you send letters and parcels there
opposite|karşısında|across the road, facing something
between|arasında|in the middle of two things
behind|arkasında|at the back of something
near|yakınında|not far away from something
corner|köşe|where two streets meet
square|meydan|an open place in the town centre
traffic lights|trafik ışıkları|red, yellow and green lights on roads
apartment|daire|a home in a big building`,
`The pharmacy is ___ the bakery and the bank.|between|under|inside
There ___ two bus stops on this road.|are|is|am
___ there a hospital near your home?|Is|Are|Do
There isn’t ___ cinema in our village.|a|an|some
The plural of “city” is ___.|cities|citys|cityes
This is Deniz___ house.|’s|s’|s
We ___ to the park on Saturdays.|walk|walks|walking
The bus stop is ___ the school. It is two steps away.|near|far from|above
My neighbours ___ very friendly.|are|is|am
There is ___ old museum in our town.|an|a|some
The bank is opposite the ___.|hospital|quiet|crowded
Two ___ live in that house.|families|familys|family`,
`Where can you buy medicine?|At the pharmacy.|At the cinema.|At the bus stop.
Where do people wait for a bus?|At a bus stop.|In a museum.|In a pharmacy.
How many parks are there?|There are two.|It is green.|Next to the bank.
Where can you send a parcel?|At the post office.|At the cinema.|At the hospital.
What does “opposite the school” mean?|Across the road from it.|Inside the classroom.|On the school roof.
Is your house near the park?|Yes, it is very close.|Yes, there are three.|Yes, I like apples.`),
pack(`narrow|dar|not wide
tall|uzun|very high, like a giraffe
short|kısa|not tall or long
busy|işlek|full of people and cars
clean|temiz|without dirt
dirty|kirli|covered with dirt
modern|modern|new and in today’s style
old|eski|not new; from long ago
expensive|pahalı|costing a lot of money
cheap|ucuz|not costing much money
beautiful|güzel|very nice to look at
noisy|gürültülü|full of loud sounds
village|köy|a very small town in the country
skyscraper|gökdelen|a very tall city building with many floors
gallery|galeri|a place where you can see paintings
pavement|kaldırım|a path beside a road for people walking`,
`A skyscraper is ___ than a small house.|taller|tall|tallest
This road is ___ than that narrow path.|wider|wide|widest
Our village is ___ than the busy city.|quieter|quiet|quietest
This shop is ___ than the old one.|bigger|big|biggest
A 50 TL bike is ___ than an 80 TL bike.|cheaper|cheap|cheapest
This park is ___ beautiful than that car park.|more|most|many
The bus is ___ than walking.|faster|fast|fastest
My new bag is ___ than my old one.|better|good|best
The market is ___ crowded than the empty square.|more|most|very
There ___ many tall buildings in the city.|are|is|am
Selin___ bicycle is outside the gallery.|’s|s’|s
We ___ the museum every summer.|visit|visits|visiting`,
`Which word compares two things?|Bigger.|Big.|Biggest.
A: 50 cars. B: 2 cars. Which street is busier?|Street A.|Street B.|They are the same.
Which ticket is cheaper: 20 TL or 40 TL?|The 20 TL ticket.|The 40 TL ticket.|They cost the same.
Where can you look at paintings?|In an art gallery.|At a bus stop.|On a football pitch.
Which sentence is about a quiet place?|There is no noise.|People are shouting.|Cars are very loud.
Where do people walk next to a road?|On the pavement.|On the traffic lights.|On the roof.`),
pack(`dairy|süt ürünleri|foods made from milk
beef|dana eti|meat from a cow
beans|fasulye|small seeds we cook and eat
jam|reçel|sweet fruit you put on bread
salt|tuz|a white powder; sea water has it
pepper|karabiber|a black powder, often used with salt
garlic|sarımsak|a small white plant with a strong smell
slice|dilimlemek|to cut food into thin pieces
boil|kaynatmak|to make water very hot, until it bubbles
recipe|yemek tarifi|steps that tell you how to cook something
menu|menü|a list of food in a restaurant
waiter|garson|a person who serves food at tables
bill|hesap|a paper that shows how much to pay
starter|başlangıç yemeği|a small dish before the main meal
main course|ana yemek|the biggest dish of a meal
thirsty|susamış|needing a drink`,
`How ___ water do you need?|much|many|a
How ___ apples are on the plate?|many|much|an
Can I ___ the menu, please?|see|sees|seeing
She ___ got some fresh bread.|has|have|is
We ___ got three tomatoes.|have|has|are
There is ___ lemon in the bowl.|a|an|many
There are two ___ in the bag.|potatoes|potatos|potato
Please ___ the bread into thin pieces.|slice|slices|slicing
I would like ___ soup, please.|some|a|many
Milk ___ a drink.|is|are|am
Can we pay ___ cash?|in|on|at
The soup is hot. Taste it ___.|carefully|careful|care`,
`Which food is a dairy product?|Cheese.|Bread.|Rice.
You are thirsty. What do you order?|A glass of water.|A slice of bread.|A bowl of rice.
How much sugar do you need?|Two spoons.|Two apples.|Two plates.
What do you read to choose your food?|The menu.|The bus timetable.|The school rules.
How do you order politely?|Can I have pasta, please?|Bring it now!|Why is school closed?
Which word fits “a glass of ___”?|Water.|Apple.|Plate.`),
pack(`lion|aslan|a big wild cat; the king of animals
wolf|kurt|a wild dog that lives in groups
fox|tilki|an orange wild animal with a big tail
bear|ayı|a big strong animal with thick fur
camel|deve|a big desert animal you can ride
dolphin|yunus|a clever, friendly sea animal
whale|balina|the biggest animal in the sea
penguin|penguen|a black and white bird that can’t fly
turtle|kaplumbağa|an animal with a hard shell
snake|yılan|a long animal with no legs
monkey|maymun|a funny animal that climbs trees
giraffe|zürafa|a very tall animal with a long neck
wing|kanat|a body part birds use to fly
tail|kuyruk|a dog moves it when it is happy
fur|kürk|the soft hair on animals like cats
climb|tırmanmak|to go up using hands and feet`,
`A giraffe ___ got a long neck.|has|have|is
Birds have got two ___.|wings|wing|winges
A penguin ___ fly, but it can swim.|can’t|can|does
Lions ___ in the sea.|don’t live|doesn’t live|isn’t living
A camel ___ in a desert.|lives|live|living
___ an eagle fly?|Can|Has|Is
Fish have fins, ___ lions have legs.|but|because|when
Two ___ are running through the forest.|wolves|wolfs|wolf
A snake ___ got legs.|hasn’t|haven’t|doesn’t
Monkeys can ___ trees.|climb|climbs|climbing
The bear is bigger ___ the fox.|than|then|that
There ___ many animals in this forest.|are|is|am`,
`Which animal has a very long neck?|A giraffe.|A fox.|A penguin.
Which animal has a hard shell?|A turtle.|A wolf.|A dolphin.
Can penguins swim?|Yes, they can.|Yes, they are.|Yes, it is.
Which animal has no legs?|A snake.|A bear.|A monkey.
What keeps a bear warm?|Its fur.|Its feathers.|Its scales.
Where do wild animals live?|In forests and jungles.|In tiny boxes.|In school desks.`),
pack(`continent|kıta|a very big area of land, like Asia
lake|göl|a lot of water with land all around
mountain|dağ|very high land, often with snow on top
waterfall|şelale|water dropping from a high place
canyon|kanyon|a deep valley with high rock walls
coral reef|mercan resifi|a colourful home for fish under the sea
sand dune|kum tepesi|a hill of sand made by wind
rock|kaya|a big, hard stone
season|mevsim|one of four parts of the year
climate|iklim|the usual weather in a place
temperature|sıcaklık|how hot or cold something is
spring|ilkbahar|the season between winter and summer
autumn|sonbahar|the season between summer and winter
sky|gökyüzü|the blue space above us
peaceful|huzurlu|calm and quiet
explore|keşfetmek|to go around a new place to learn`,
`The river ___ through the valley.|flows|flow|flowing
We are going to ___ a waterfall.|see|sees|seeing
There ___ a beautiful lake near the mountain.|is|are|am
The ocean is ___ than this small lake.|bigger|big|biggest
Summer comes after ___.|spring|autumn|winter
It is colder ___ winter than in summer.|in|on|at
The children ___ going to explore the island.|are|is|am
I ___ going to take a photograph of the canyon.|am|is|are
This mountain is higher ___ that hill.|than|then|that
There are many ___ on the beach.|rocks|rock|rockes
A lake is surrounded by ___.|land|stars|clouds
We ___ need warm coats in cold weather.|usually|never|not`,
`What is a waterfall?|Water falling from high rocks.|A hill made of sand.|A large dry plain.
Which season comes before summer?|Spring.|Autumn.|Winter.
Where can you see a coral reef?|In the sea.|On a snowy mountain.|In a classroom.
What tells us how hot or cold the air is?|Temperature.|Nationality.|Height.
A place is calm and quiet. Which word describes it?|Peaceful.|Noisy.|Crowded.
Which one is water: an island or a lake?|A lake.|An island.|Both of them.`),
pack(`pack|bavul hazırlamak|to fill your bag before a trip
ticket|bilet|a paper you buy to travel
hotel|otel|a building where you pay to sleep
tour|tur|a trip with a group to see places
guide|rehber|a person who shows visitors around a place
destination|gidilecek yer|the place you are travelling to
souvenir|hatıra eşyası|a gift you buy to remember a trip
beach|plaj|the sandy place next to the sea
sandcastle|kumdan kale|a model castle made from wet sand
seashell|deniz kabuğu|a pretty hard shell from the sea
amusement park|eğlence parkı|a place with rides and games
historical|tarihî|from the past; very old and important
famous|ünlü|known by many people
invite|davet etmek|to ask someone to come to a party
book|rezervasyon yapmak|to save a room or seat early
sightseeing|turistik yerleri gezme|looking at famous places on holiday`,
`She ___ going to visit her grandparents.|is|are|am
We are ___ to travel by train.|going|go|goes
Are you going to ___ a hotel room?|book|books|booking
I am not going to ___ at home all summer.|stay|stays|staying
They ___ going to swim today. It is too cold.|aren’t|isn’t|am not
___ is he going to visit? The castle.|What|Who|How many
___ are you going to travel? By bus.|How|Who|Whose
We are going to leave ___ Friday.|on|in|at
Our train leaves ___ half past eight.|at|on|in
Mum is going to ___ her camera.|bring|brings|bringing
The plural of “beach” is ___.|beaches|beachs|beachies
We ___ going to make a sandcastle.|are|is|am`,
`How are you going to get there?|By train.|At a hotel.|For a week.
When are you going to leave?|Next Monday.|By bus.|To Antalya.
What do you buy before taking a train?|A ticket.|A menu.|A recipe.
What are you going to do at the beach?|Build a sandcastle.|Do a maths test.|Clean the classroom.
Would you like to join our trip?|Yes, I’d love to.|It is my notebook.|There are two doors.
Why do people buy souvenirs?|To remember their trip.|To make the train faster.|To change the weather.`)
];
})(typeof globalThis!=='undefined'?globalThis:this);
