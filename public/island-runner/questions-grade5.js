/* Original supplementary practice. Each row: prompt | correct | distractor | distractor. */
(function(root){
const pack=(words,gaps,questions)=>({words,gaps,questions});
root.RunnerExpansion=root.RunnerExpansion||{};
root.RunnerExpansion[5]=[
pack(`playground|oyun alanı|an outdoor place where children play
laboratory|laboratuvar|a room with equipment for science experiments
headteacher|okul müdürü|the person in charge of a school
secretary|sekreter|a person who organises office messages and records
coach|antrenör|a person who trains a sports team
gate|kapı|an entrance in a fence or wall
noticeboard|duyuru panosu|a board used to display announcements
chess|satranç|a board game with kings and queens
drama|tiyatro|acting in plays
country|ülke|a nation with its own government
nationality|milliyet|the status of belonging to a particular nation
celebration|kutlama|a special event for a happy occasion
flag|bayrak|a piece of cloth representing a country
noise|gürültü|a loud or unpleasant sound
join|katılmak|to become a member of a group
rule|kural|an instruction about what is allowed`,
`I ___ from Türkiye.|am|is|are
Efe and Ada ___ in the chess club.|are|is|am
___ is your English teacher? Ms Kaya.|Who|Where|When
We ___ shout in the school library.|mustn’t|are|have
Please ___ quietly in the corridor.|walk|walks|walking
Deniz likes ___ chess.|playing|play|plays
She is ___ assistant at our school.|an|a|theirs
This is my friend. ___ is from Spain.|He|They|We
Our club meets ___ Mondays.|on|at|under
___ your brother like the drama club?|Does|Do|Is
The science club ___ after school.|meets|meet|meeting
The children ___ from Italy.|are|is|am`,
`Where do you do science experiments at school?|In the laboratory.|At the school gate.|In the canteen.
Which club is best for acting in plays?|The drama club.|The chess club.|The sports club.
Where are you from?|I’m from Türkiye.|I’m eleven.|I’m in the garden.
What is your nationality?|I’m Turkish.|I’m at school.|I’m in Class 5-A.
You need to enter a quiet room. What do you ask?|May I come in?|How many goals?|Where are your shoes?
What should you read to learn the school rules?|The noticeboard.|The lunch menu.|The weather forecast.`),
pack(`desk|sıra|a piece of furniture you sit at to write
pencil case|kalem kutusu|a small container for pens and pencils
eraser|silgi|an object used to remove pencil marks
marker|tahta kalemi|a pen used to write on a whiteboard
bookshelf|kitaplık|furniture with shelves for books
science|fen bilimleri|the school subject about the natural world
music|müzik|the school subject about songs and instruments
art|görsel sanatlar|the school subject involving painting and drawing
weekday|hafta içi günü|a day from Monday to Friday
weekend|hafta sonu|Saturday and Sunday together
noon|öğle|twelve o’clock in the daytime
quarter|çeyrek|one of four equal parts
borrow|ödünç almak|to use something and return it later
lend|ödünç vermek|to let someone use something temporarily
raise|kaldırmak|to move something upwards
carefully|dikkatlice|in a way that avoids mistakes or harm`,
`There ___ one dictionary on my desk.|is|are|am
There are four ___ in my pencil case.|erasers|eraser|erasing
Please give ___ the marker. I need it.|me|I|my
Ayşe needs her book. Give it to ___.|her|she|hers
It is quarter ___ nine: 9:15.|past|to|at
It is quarter ___ ten: 9:45.|to|past|on
Our maths lesson is ___ Tuesday.|on|in|at
We ___ got two English lessons today.|have|has|are
Ece ___ got a new notebook.|has|have|is
Please ___ your hand before speaking.|raise|raises|raising
Do not ___ in class. Speak quietly.|shout|shouts|shouting
The plural of “box” is ___.|boxes|boxs|boxies`,
`What day comes after Wednesday?|Thursday.|Tuesday.|Friday.
What time is 11:45?|Quarter to twelve.|Quarter past eleven.|Half past twelve.
Which two days are the weekend?|Saturday and Sunday.|Monday and Tuesday.|Thursday and Friday.
Can I borrow your eraser?|Yes, here you are.|It is Thursday.|They are at home.
What do you do before answering in class?|Raise your hand.|Shout at everyone.|Run to the door.
What time is 7:00?|Seven o’clock.|Half past seven.|Quarter to seven.`),
pack(`neck|boyun|the body part between your head and shoulders
finger|el parmağı|one of the five parts at the end of a hand
knee|diz|the joint in the middle of a leg
teeth|dişler|the hard white parts used for biting food
straight|düz|not curved or curly
wavy|dalgalı|shaped in gentle curves
scarf|atkı|a piece of clothing worn around the neck
belt|kemer|a band worn around the waist
boots|çizme|footwear that covers the feet and ankles or more
trousers|pantolon|clothing covering each leg separately
sunglasses|güneş gözlüğü|dark glasses that protect the eyes from sunlight
comfortable|rahat|making you feel physically relaxed
usually|genellikle|on most occasions
always|her zaman|on every occasion
never|asla|not on any occasion
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
`Which description is about hair?|It is long and wavy.|It is a blue scarf.|It is a silver watch.
What do you wear when it rains?|A raincoat.|Sunglasses only.|A swimming costume.
When do you brush your teeth?|In the morning and at night.|On my feet.|In my schoolbag.
Does your brother wear a cap?|Yes, he does.|Yes, he is.|Yes, I am.
Which word means “every time”?|Always.|Never.|Rarely.
Where do you wear a belt?|Around your waist.|On your fingers.|Around your ankles.`),
pack(`aunt|teyze veya hala|your mother’s or father’s sister
uncle|dayı veya amca|your mother’s or father’s brother
cousin|kuzen|the child of your aunt or uncle
grandparents|büyükanne ve büyükbaba|your parents’ parents
picnic|piknik|a meal eaten outdoors
barbecue|mangal|an outdoor meal with food cooked on a grill
tent|çadır|a portable shelter used when camping
guitar|gitar|a musical instrument with strings and a long neck
camera|fotoğraf makinesi|a device used to take photographs
board game|masa oyunu|a game played by moving pieces on a board
pet care|evcil hayvan bakımı|looking after an animal kept at home
tidy up|toparlamak|to put things in their proper places
relax|dinlenmek|to rest and become less worried
swimming|yüzme|moving through water using your body
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
`Your aunt’s son is your ___.|Cousin.|Uncle.|Grandfather.
What do you sleep in when you go camping?|A tent.|A camera.|A guitar.
What is Mum doing in the garden?|She is watering the plants.|She waters them daily.|She has green eyes.
Are the children dancing now?|No, they are singing.|No, they don’t.|No, she isn’t.
Which sentence describes a routine?|We visit Grandma on Sundays.|We are visiting her now.|Look! They are visiting.
What can you use to take a family photo?|A camera.|A tent.|A board game.`),
pack(`neighbour|komşu|a person who lives next to or near you
street|sokak|a road with buildings beside it
hospital|hastane|a place where ill people receive medical care
pharmacy|eczane|a place where you buy medicine
supermarket|süpermarket|a large shop selling food and household goods
cinema|sinema|a place where people watch films on a large screen
bus stop|otobüs durağı|a place where people wait for a bus
post office|postane|a place where you can send letters and parcels
opposite|karşısında|on the other side and facing something
between|arasında|in the space separating two things
behind|arkasında|at the back of something
near|yakınında|not far away from something
corner|köşe|the place where two streets or sides meet
square|meydan|an open public space in a town
traffic lights|trafik ışıkları|coloured road signals for vehicles and people
apartment|daire|a set of rooms to live in within a larger building`,
`The pharmacy is ___ the bakery and the bank.|between|under|inside
There ___ two bus stops on this road.|are|is|am
___ there a hospital near your home?|Is|Are|Do
There isn’t ___ cinema in our village.|a|an|some
The plural of “city” is ___.|cities|citys|cityes
This is Deniz___ house.|’s|s’|s
We ___ to the park on Saturdays.|walk|walks|walking
The bus stop is ___ the school: just two steps away.|near|far from|above
My neighbours ___ very friendly.|are|is|am
There is ___ old museum in our town.|an|a|some
The bank is opposite the ___.|hospital|quiet|crowded
Two ___ live in that house.|families|familys|family`,
`Where can you buy medicine?|At the pharmacy.|At the cinema.|At the bus stop.
Where do people wait for a bus?|At a bus stop.|In a museum.|In a pharmacy.
How many parks are there?|There are two.|It is green.|It is next to the bank.
Where can you send a parcel?|At the post office.|At the cinema.|At the hospital.
What does “opposite the school” mean?|Facing it across the road.|Inside the classroom.|On the school roof.
Is your house near the park?|Yes, it is a short walk.|Yes, there are three.|Yes, I like apples.`),
pack(`narrow|dar|having a small distance from one side to the other
tall|uzun|having a greater than usual height
short|kısa|having little height or length
busy|işlek|full of activity or people doing things
clean|temiz|without dirt
dirty|kirli|covered with dirt
modern|modern|designed in a recent style
old|eski|having existed for a long time
expensive|pahalı|costing a lot of money
cheap|ucuz|costing little money
beautiful|güzel|pleasant or attractive to look at
noisy|gürültülü|making a lot of sound
village|köy|a small settlement in the countryside
skyscraper|gökdelen|a very tall city building with many floors
gallery|galeri|a place where paintings are displayed
pavement|kaldırım|a path beside a road for people walking`,
`A skyscraper is ___ than a small house.|taller|tall|tallest
This road is ___ than that narrow path.|wider|wide|widest
Our village is ___ than the busy city.|quieter|quiet|quietest
This shop is ___ than the old one.|bigger|big|biggest
The blue bike is ___ than the red one: 50 TL, not 80 TL.|cheaper|cheap|cheapest
This park is ___ beautiful than that car park.|more|most|many
The bus is ___ than walking when the road is clear.|faster|fast|fastest
My new bag is ___ than my old one.|better|good|best
The market is ___ crowded than the empty square.|more|most|much
There ___ many tall buildings in the city.|are|is|am
Selin___ bicycle is outside the gallery.|’s|s’|s
We ___ the museum every summer.|visit|visits|visiting`,
`Which word compares two things?|Bigger.|Big.|Biggest.
One street has many cars; the other has none. Which is busier?|The street with many cars.|The empty street.|Both are equally busy.
A ticket costs 20 TL here and 40 TL there. Which is cheaper?|The 20 TL ticket.|The 40 TL ticket.|They cost the same.
Where can you look at paintings?|In an art gallery.|At a bus stop.|On a football pitch.
Which sentence describes a quiet place?|There is very little noise.|People are shouting everywhere.|Many horns are sounding.
What should people walk on beside a road?|The pavement.|The traffic lights.|The roof.`),
pack(`dairy|süt ürünleri|foods made from milk
beef|dana eti|meat from a cow
beans|fasulye|small seeds often cooked and eaten as food
jam|reçel|a sweet spread made from fruit and sugar
salt|tuz|a white substance used to make food salty
pepper|karabiber|a spice often paired with salt
garlic|sarımsak|a strong-smelling bulb used to flavour food
slice|dilimlemek|to cut food into thin flat pieces
boil|kaynatmak|to heat a liquid until it bubbles strongly
recipe|yemek tarifi|instructions for preparing a dish
menu|menü|a list of food and drinks at a restaurant
waiter|garson|a person who serves food at tables
bill|hesap|a statement of how much you must pay
starter|başlangıç yemeği|a small dish served before the main course
main course|ana yemek|the main dish of a meal
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
You are thirsty. What would you order?|A glass of water.|A slice of bread.|A bowl of rice.
How much sugar do you need?|Two spoons.|Two apples.|Two plates.
What do you read to choose a dish?|The menu.|The bus timetable.|The school rules.
What do you say to order politely?|Can I have some pasta, please?|Bring it now!|Why is school closed?
Which one is uncountable in “a glass of ___”?|Water.|Apple.|Plate.`),
pack(`lion|aslan|a large wild cat whose male has a mane
wolf|kurt|a wild dog that often lives in a pack
fox|tilki|a wild animal with a pointed nose and a bushy tail
bear|ayı|a large strong mammal with thick fur
camel|deve|a desert animal with one or two humps
dolphin|yunus|a sea mammal known for its curved mouth and fin
whale|balina|a very large sea mammal
penguin|penguen|a flightless bird that swims very well
turtle|kaplumbağa|an animal with a hard shell on its back
snake|yılan|a long reptile without legs
monkey|maymun|a primate that often climbs trees
giraffe|zürafa|a very tall animal with a long neck
wing|kanat|a body part birds use for flying
tail|kuyruk|the long part at the back of many animals
fur|kürk|the thick hair covering some animals
climb|tırmanmak|to move upwards using hands or feet`,
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
Which animal is a reptile?|A snake.|A bear.|A whale.
What keeps a bear warm?|Its fur.|Its feathers.|Its scales.
Where should wild animals live?|In suitable natural habitats.|In tiny boxes.|In school desks.`),
pack(`continent|kıta|one of the Earth’s very large land areas
lake|göl|a large area of water surrounded by land
mountain|dağ|a very high natural rise in the land
waterfall|şelale|water dropping from a high place
canyon|kanyon|a deep valley with steep rocky sides
coral reef|mercan resifi|a sea structure formed by tiny coral animals
sand dune|kum tepesi|a hill of sand made by wind
rock|kaya|a large piece of natural stone
season|mevsim|one of the four main parts of the year
climate|iklim|the usual weather of an area over many years
temperature|sıcaklık|how hot or cold something is
spring|ilkbahar|the season between winter and summer
autumn|sonbahar|the season between summer and winter
sky|gökyüzü|the space above the Earth seen from the ground
peaceful|huzurlu|calm and free from disturbance
explore|keşfetmek|to travel around a place to learn about it`,
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
`What is a waterfall?|Water falling from a high place.|A hill made of sand.|A large dry plain.
Which season comes before summer?|Spring.|Autumn.|Winter.
Where would you see a coral reef?|In the sea.|In a snowy mountain.|In a classroom.
What tells us how hot or cold the air is?|Temperature.|Nationality.|Height.
A place is calm and quiet. Which word describes it?|Peaceful.|Noisy.|Crowded.
What is the difference between an island and a lake?|An island is land; a lake is water.|Both are types of mountains.|Both are types of buildings.`),
pack(`pack|bavul hazırlamak|to put things into a bag for a trip
ticket|bilet|a document that lets you travel or enter a place
hotel|otel|a building where travellers pay to stay
tour|tur|a planned visit around interesting places
guide|rehber|a person who shows visitors around a place
destination|gidilecek yer|the place someone is travelling to
souvenir|hatıra eşyası|an object kept to remember a visit
beach|plaj|an area of sand or stones beside the sea
sandcastle|kumdan kale|a model castle made from wet sand
seashell|deniz kabuğu|the hard outer covering of some sea animals
amusement park|eğlence parkı|a place with rides and games
historical|tarihî|connected with events or places from the past
famous|ünlü|known by many people
invite|davet etmek|to ask someone to come to an event
book|rezervasyon yapmak|to reserve a seat or room in advance
sightseeing|turistik yerleri gezme|visiting interesting places as a tourist`,
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
What are you going to do at the beach?|Build a sandcastle.|Climb a bookshelf.|Borrow a classroom.
Would you like to join our trip?|Yes, I’d love to.|It is my notebook.|There are two doors.
Why do people buy souvenirs?|To remember their trip.|To make the train faster.|To change the weather.`)
];
})(typeof globalThis!=='undefined'?globalThis:this);
