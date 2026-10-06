/* v10.4.1 Challenge Deck · Ask a Question: short, easy cards for every island of grades 5–8, on each island's theme.
   Each row: answer | the question that asks for it | wrong question | wrong question.
   The wrong questions are proper English too, but they ask for something else (a place instead of a time, …).
   Island Run's own questions are not changed. */
(function(root){
 'use strict';
 const rows=text=>text.trim().split('\n').map(line=>line.split('|').map(part=>part.trim()));
 const bank={
 5:[
`In the library.|Where do you read books?|When do you read books?|Who reads books?
At eight o'clock.|What time does school start?|Where does school start?|Who starts school?
Our headteacher.|Who is the head of our school?|Where is our school?|When is our school open?
On Fridays.|When is the chess club?|Where is the chess club?|Who is in the chess club?
Blue and white.|What colour is your uniform?|Where is your uniform?|Whose uniform is this?
In the canteen.|Where do you eat lunch?|What do you eat for lunch?|When do you eat lunch?`,
`A ruler.|What do you use to draw lines?|Where do you draw lines?|Who draws lines?
On the board.|Where does the teacher write?|What does the teacher write?|When does the teacher write?
Twenty-five.|How many students are in your class?|Who is in your class?|Where is your class?
Ms Demir.|Who is your English teacher?|When is your English lesson?|Where is your English teacher?
In my pencil case.|Where is your eraser?|What colour is your eraser?|Whose eraser is this?
Twice a week.|How often do you have English?|How long is the English lesson?|Where do you have English?`,
`I'm eleven.|How old are you?|How are you?|Where are you from?
From Turkey.|Where are you from?|What is your name?|How old are you?
Turkish.|What is your nationality?|Where do you live?|When is your birthday?
In May.|When is your birthday?|Where is your birthday party?|How old are you?
Playing football.|What do you like doing?|Where do you like going?|Who do you like?
I'm fine, thanks.|How are you?|Who are you?|Where are you?`,
`My uncle.|Who is your father's brother?|Where is your father's brother?|How old is your father's brother?
Three.|How many brothers do you have?|Who are your brothers?|Where are your brothers?
She is a doctor.|What does your mother do?|Where is your mother?|How is your mother?
At home.|Where is your grandmother?|Who is your grandmother?|How old is your grandmother?
My sister.|Who helps you with homework?|Where do you do homework?|When do you do homework?
On Sundays.|When do you visit your grandparents?|Where do your grandparents live?|Who visits your grandparents?`,
`Next to the bank.|Where is the post office?|What is the post office?|When does the post office open?
Turn left.|How can I get to the park?|When is the park open?|What is in the park?
At the bakery.|Where can I buy bread?|When can I buy bread?|What can I buy?
By bus.|How do you go to school?|Where do you go to school?|When do you go to school?
Ten minutes.|How long is the walk to school?|Where is the school?|Who walks to school?
The pharmacy.|Where can you buy medicine?|When do you take medicine?|Why do you take medicine?`,
`At the museum.|Where do you see old paintings?|When do you see paintings?|Who paints pictures?
It's very busy.|What is the city centre like?|Where is the city centre?|When do you go to the centre?
On the corner.|Where is the café?|What is the café's name?|When does the café open?
Twenty lira.|How much is the ticket?|How many tickets do you need?|Where is the ticket?
Because it is quiet.|Why do you like the park?|Where is the park?|When do you go to the park?
The police officer.|Who helps you when you are lost?|Where do you get lost?|When do you get lost?`,
`In Japan.|Where is Tokyo?|What is Tokyo?|When do you visit Tokyo?
English.|What language do people speak in England?|Where is England?|Who speaks English?
Pizza.|What is a famous Italian food?|Where is Italy?|Who makes pizza?
By plane.|How do you travel to another country?|Where do you travel?|When do you travel?
Red and white.|What colour is the Turkish flag?|Where is the Turkish flag?|Whose flag is this?
Twelve hours.|How long is the flight?|Where does the flight go?|Who is on the flight?`,
`In the sea.|Where do fish live?|What do fish eat?|When do fish sleep?
Grass.|What do cows eat?|Where do cows live?|How many cows are there?
In spring.|When do flowers grow?|Where do flowers grow?|Why do flowers grow?
It's sunny.|What is the weather like?|Where is the sun?|When does it rain?
Because it is cold.|Why do you wear a coat?|When do you wear a coat?|Where is your coat?
On a farm.|Where do horses live?|What do horses eat?|How fast are horses?`,
`The Moon.|What do we see at night?|Where do we sleep at night?|When do we see stars?
Eight.|How many planets are there?|How big are the planets?|Where are the planets?
A rocket.|What do astronauts travel in?|Where do astronauts live?|Who are astronauts?
Next year.|When will you be twelve?|Where will you be?|How old will you be?
I want to be a pilot.|What do you want to be?|Where do you want to go?|Who do you want to meet?
Mars.|Which planet is red?|Where is Mars?|How big is Mars?`,
`Robots.|What will help us at home?|Where will we live?|When will we travel?
On the Moon.|Where did astronauts walk in 1969?|When did astronauts walk?|Who walked on the Moon?
Neil Armstrong.|Who walked on the Moon first?|Where did he walk?|When did he walk?
In 2050.|When will cars fly?|Where will cars fly?|Why will cars fly?
Very hot.|What is the Sun like?|Where is the Sun?|When does the Sun rise?
With a telescope.|How do we see faraway stars?|Where are the stars?|When do we see the stars?`],
 6:[
`Science.|What is your favourite subject?|Where is your science class?|Who is your science teacher?
In room 12.|Where is the art class?|When is the art class?|Who teaches art?
Mr Kaya.|Who teaches maths?|When is maths?|Where is the maths class?
At half past three.|What time does school finish?|Where does school finish?|Why does school finish?
Because I was ill.|Why were you absent yesterday?|When were you absent?|Where were you yesterday?
Twice a week.|How often do you have PE?|How long is PE?|Where do you have PE?`,
`Open your books.|What did the teacher say?|Where are your books?|Whose books are these?
Yes, you can.|Can I borrow your pen?|Where is your pen?|What colour is your pen?
Forty minutes.|How long is a lesson?|How many lessons are there?|When does the lesson start?
In my bag.|Where is your homework?|What is your homework?|When do you do your homework?
It's Ayşe's.|Whose notebook is this?|Where is the notebook?|What is in the notebook?
Because it's noisy.|Why are you closing the door?|Where is the door?|Who is closing the door?`,
`At seven o'clock.|What time do you get up?|Where do you sleep?|Why do you get up early?
I usually walk.|How do you get to school?|Where is your school?|When do you leave home?
Reading comics.|What do you do for fun?|Where do you go at weekends?|Who do you play with?
Tall with short hair.|What does your best friend look like?|Where does your friend live?|How old is your friend?
Every evening.|How often do you watch TV?|What do you watch on TV?|Where do you watch TV?
Drawing.|What are you good at?|Where do you draw?|When do you draw?`,
`My cousin.|Who is your aunt's son?|Where does your aunt live?|How old is your aunt?
She's cooking.|What is your mum doing now?|Where is your mum now?|Who is your mum with?
In the living room.|Where does your family watch TV?|What does your family watch?|When does your family watch TV?
He washes the dishes.|How does your brother help at home?|Where does your brother live?|How old is your brother?
Every summer.|How often do you visit your grandma?|Where does your grandma live?|Who visits your grandma?
Forty-two.|How old is your father?|What is your father's job?|Where is your father?`,
`Go straight and turn right.|How can I get to the bank?|Why is the bank closed?|When does the bank open?
Opposite the school.|Where is the bus stop?|Which bus do you take?|When does the bus come?
Number 14.|Which bus goes to the centre?|Where is the centre?|When does the bus leave?
It's quiet and green.|What is your neighbourhood like?|Where is your neighbourhood?|Who lives in your neighbourhood?
Bread and milk.|What did you buy at the shop?|Where is the shop?|When did you go shopping?
About ten minutes.|How long does the walk take?|Where do you walk?|Who walks with you?`,
`At the hospital.|Where does a nurse work?|What does a nurse do?|When does a nurse work?
He cuts hair.|What does a barber do?|Where does a barber work?|Who is your barber?
Because it's cheaper.|Why do you take the bus?|Which bus do you take?|Where do you take the bus?
On the left.|Where is the cinema?|What is on at the cinema?|When does the film start?
Yes, there is.|Is there a park near here?|Where is the park?|What is in the park?
Fifteen lira.|How much is the pizza?|How many pizzas are there?|Which pizza do you want?`,
`In Spain.|Where do people eat paella?|What is paella?|When do people eat paella?
With chopsticks.|How do people eat in Japan?|What do people eat in Japan?|Where is Japan?
On 23 April.|When is Children's Day in Turkey?|Where do children celebrate?|How do children celebrate?
Hello.|What does “merhaba” mean in English?|Where do people say “merhaba”?|Who says “merhaba”?
Because it's a holiday.|Why is the school closed today?|When is the school open?|Where is the school?
Brazil.|Which country is famous for carnival?|What is carnival?|When is carnival?`,
`Plastic.|What pollutes the sea?|Where is the sea?|When do we swim in the sea?
Recycle it.|What should we do with old paper?|Where is the old paper?|Who has the old paper?
Because there is no rain.|Why are the plants dry?|Where are the plants?|What are the plants?
In the rainforest.|Where do many animals live?|What do animals eat?|When do animals sleep?
Turn off the lights.|How can we save energy?|Where is the energy?|Why is energy expensive?
Very hot and dry.|What is the desert like?|Where is the desert?|Who lives in the desert?`,
`Jupiter.|Which is the biggest planet?|Where is Jupiter?|How hot is Jupiter?
In 1969.|When did people land on the Moon?|Where did they land?|Who landed on the Moon?
Because there is no air.|Why do astronauts wear helmets?|What do astronauts wear?|Where do astronauts live?
On a space station.|Where do astronauts live in space?|When do astronauts sleep?|Who are astronauts?
A scientist.|What will you be in the future?|Where will you live?|When will you finish school?
Robots will.|Who will clean our houses?|Where will we live?|When will we have robots?`,
`It's red and dusty.|What is Mars like?|Where is Mars?|How far is Mars?
Maybe in 2040.|When will people live on Mars?|Why will people live on Mars?|How will people get to Mars?
By rocket.|How will we travel to Mars?|When will we travel to Mars?|Who will travel to Mars?
The Milky Way.|What is the name of our galaxy?|Where is our galaxy?|How big is our galaxy?
Every day.|How often does the Sun rise?|Where does the Sun rise?|Why does the Sun rise?
Electric cars.|What will we drive in the future?|Where will we drive?|When will we drive?`],
 7:[
`Long, curly hair.|What does your sister look like?|Where does your sister live?|How old is your sister?
Friendly and funny.|What is your brother like?|What does your brother look like?|Where is your brother?
About 1.60 metres.|How tall is Ali?|How old is Ali?|Where is Ali?
Because she is very kind.|Why do you like your teacher?|Who is your teacher?|When do you see your teacher?
Elif is.|Who is the tallest in your class?|Where is the tallest student?|How tall are you?
Blue.|What colour are his eyes?|Whose eyes are these?|Where are his glasses?`,
`Every Saturday.|How often do you play tennis?|Where do you play tennis?|Who do you play tennis with?
In the sports centre.|Where do you go swimming?|When do you go swimming?|Why do you go swimming?
Because it's exciting.|Why do you like basketball?|When do you play basketball?|Where do you play basketball?
Eleven.|How many players are in a football team?|Who are the players?|Where do the players train?
A racket.|What do you need for tennis?|Where do you play tennis?|When do you play tennis?
Galatasaray.|Which team do you support?|Where does the team play?|When does the team play?`,
`In 1881.|When was Atatürk born?|Where was Atatürk born?|Who was Atatürk?
In Thessaloniki.|Where was Atatürk born?|When was Atatürk born?|Why is Atatürk famous?
She was a scientist.|What was Marie Curie's job?|Where did Marie Curie live?|When did Marie Curie die?
Thomas Edison.|Who invented the light bulb?|When did he invent it?|Where did he invent it?
For 22 years.|How long did she live in Paris?|Where did she live?|When did she move?
Because she won two Nobel Prizes.|Why is Marie Curie famous?|Where was Marie Curie from?|When did Marie Curie work?`,
`In Africa.|Where do lions live?|What do lions eat?|How long do lions sleep?
Meat.|What do tigers eat?|Where do tigers live?|How fast do tigers run?
Because people hunt them.|Why are rhinos in danger?|Where do rhinos live?|What do rhinos eat?
About 20 hours a day.|How long do koalas sleep?|Where do koalas sleep?|What do koalas eat?
The cheetah.|Which animal is the fastest?|Where does the cheetah live?|How fast is the cheetah?
Up to 100 years.|How long can tortoises live?|Where do tortoises live?|What do tortoises eat?`,
`Cartoons.|What kind of programmes do you like?|When do you watch TV?|Where do you watch TV?
At 8 p.m.|What time does the news start?|Which channel is the news on?|Who reads the news?
On Channel 5.|Which channel is the match on?|What time is the match?|Who is playing?
Because they're funny.|Why do you like sitcoms?|When do you watch sitcoms?|Which sitcom do you like?
About two hours.|How long do you watch TV daily?|What do you watch?|Where do you watch TV?
The weather forecast.|What tells you about tomorrow's weather?|When is the weather forecast?|Where is it sunny tomorrow?`,
`On 29 October.|When is Republic Day?|How do we celebrate Republic Day?|Why do we celebrate Republic Day?
With a party and a cake.|How do you celebrate your birthday?|When is your birthday?|Who comes to your party?
My classmates.|Who did you invite to the party?|When was the party?|Where was the party?
At my house.|Where is the party?|When is the party?|Why are you having a party?
Balloons and snacks.|What do we need for the party?|Who is coming to the party?|When does the party start?
Because it's New Year's Eve.|Why are there fireworks tonight?|Where are the fireworks?|When do the fireworks start?`,
`About flying.|What did you dream about last night?|Where did you sleep?|When did you wake up?
In a forest.|Where were you in your dream?|Who was in your dream?|When did you have the dream?
My best friend.|Who was in your dream?|Where was your dream?|When did you have the dream?
It was scary.|How was your dream?|Where was your dream?|Who was in your dream?
At midnight.|When did you wake up?|Why did you wake up?|Where did you wake up?
Because I had a nightmare.|Why did you wake up?|When did you wake up?|Where did you sleep?`,
`At the post office.|Where can you send a letter?|What is in the letter?|Who sends letters?
To borrow books.|Why do people go to the library?|When does the library open?|Where is the library?
At 9 a.m.|What time does the museum open?|Where is the museum?|Why do people visit museums?
At the police station.|Where do you report a crime?|When did the crime happen?|Who saw the crime?
Doctors and nurses.|Who works at the hospital?|Where is the hospital?|When does the hospital close?
Next to the town hall.|Where is the fire station?|What does a firefighter do?|Who works at the fire station?`,
`Paper, glass and plastic.|What can we recycle?|Where can we recycle?|Why should we recycle?
In the recycling bin.|Where should we put empty bottles?|What are bottles made of?|Why do we use bottles?
Because it saves trees.|Why should we recycle paper?|What is paper made of?|Where do we buy paper?
Use less water.|How can we protect nature?|Who protects nature?|Why is nature important?
Cars and factories.|What causes air pollution?|Where is the air dirty?|When is the air clean?
Twice a week.|How often do you recycle?|What do you recycle?|Where do you recycle?`,
`Mercury.|Which planet is closest to the Sun?|How hot is Mercury?|What is Mercury like?
It has rings.|What is special about Saturn?|Where is Saturn?|How big is Saturn?
Because it's too hot.|Why can't people live on Venus?|Where is Venus?|What colour is Venus?
365 days.|How long is a year on Earth?|Where is Earth?|Why is Earth blue?
Yes, it does.|Does Mars have moons?|Where is Mars?|What colour is Mars?
Neptune.|Which planet is farthest from the Sun?|Where is Neptune?|What colour is Neptune?`],
 8:[
`Because he's honest.|Why is Emre your best friend?|When did you meet Emre?|Where does Emre live?
At primary school.|Where did you meet your best friend?|Who is your best friend?|Why do you like your best friend?
For five years.|How long have you known her?|When did you meet her?|Where did you meet her?
Sure, I'd love to.|Would you like to come to my party?|Where is your party?|When is your party?
Sorry, I can't.|Can you come to the cinema tonight?|Which film are you watching?|Where is the cinema?
She keeps secrets.|What makes her a good friend?|Who is her best friend?|Where are her friends?`,
`Pop music.|What kind of music do you prefer?|Where do you listen to music?|When do you listen to music?
Hanging out with friends.|What do you like doing at weekends?|Where do you go at weekends?|Who do you meet at weekends?
At the shopping mall.|Where do teenagers usually meet?|When do teenagers meet?|Why do teenagers meet?
Because I have exams.|Why can't you go out tonight?|Where are you going tonight?|What are you doing tonight?
Once a month.|How often do you go to concerts?|Which concert are you going to?|Who goes to concerts with you?
I can't stand it.|How do you feel about jazz?|Where do people play jazz?|Who plays jazz?`,
`Flour, eggs and milk.|What do you need for pancakes?|How do you make pancakes?|When do you eat pancakes?
Boil it for ten minutes.|How do you cook pasta?|What is pasta made of?|Where is the pasta?
Two cups.|How much sugar do we need?|Where is the sugar?|Why do we need sugar?
Three.|How many eggs do we need?|How much milk do we need?|Where are the eggs?
In the fridge.|Where do you keep the butter?|What do you do with butter?|Why do you need butter?
Wash the vegetables.|What is the first step?|Where are the vegetables?|Who cooks the vegetables?`,
`Speaking.|Can I speak to Mert, please?|Where is Mert?|Who is Mert?
It's Selin.|Who's calling, please?|Where are you calling from?|Why are you calling?
He's out at the moment.|Is Emir there?|Where does Emir live?|What does Emir do?
0532 555 1234.|What's your phone number?|Whose phone is this?|Where is your phone?
Because the line was busy.|Why couldn't you call me?|When did you call me?|Who called you?
Tomorrow at ten.|When can you call me back?|Where can you call me?|Who will call me back?`,
`To do my homework.|Why do you use the internet?|When do you use the internet?|Where do you use the internet?
About two hours a day.|How long are you online every day?|What do you do online?|Where are you online?
A search engine.|What do you use to find information?|Where is the information?|Why do you need information?
Never share it.|What should you do with your password?|Where is your password?|When do you change your password?
I download it.|How do you get a new app?|Where is the app?|Which app do you like?
My cousin.|Who did you video chat with?|When did you chat?|Where were you?`,
`Rafting.|Which adventure sport have you tried?|Where did you go rafting?|When did you go rafting?
In Antalya.|Where did you go paragliding?|When did you go paragliding?|Who did you go with?
Because it's dangerous.|Why are you afraid of bungee jumping?|Where can you go bungee jumping?|When did you go bungee jumping?
It was thrilling!|How was the roller coaster?|Where was the roller coaster?|Who rode the roller coaster?
No, never.|Have you ever been scuba diving?|Where did you go scuba diving?|Who went scuba diving?
A helmet and gloves.|What do you need for climbing?|Where do you go climbing?|When do you go climbing?`,
`Cappadocia.|Which place did you visit last summer?|How did you get there?|Why did you go there?
By plane.|How did you travel to Rome?|When did you travel to Rome?|Why did you go to Rome?
In a hotel.|Where did you stay?|How long did you stay?|Who did you stay with?
For a week.|How long did you stay there?|Where did you stay?|When did you go there?
The historical sites.|What did you like most?|Where did you eat?|Who did you travel with?
It was amazing.|How was your holiday?|Where was your holiday?|When was your holiday?`,
`I do the dishes.|How do you help at home?|Where do you live?|When do you get home?
My brother does.|Who takes out the rubbish?|When do you take out the rubbish?|Where is the rubbish?
Every Saturday.|How often do you clean your room?|Why do you clean your room?|Who cleans your room?
Because it's my turn.|Why are you ironing the clothes?|What are you ironing?|Where is the iron?
I hate it.|How do you feel about vacuuming?|Who does the vacuuming?|When do you vacuum?
In the washing machine.|Where do you wash the clothes?|When do you wash the clothes?|Who washes the clothes?`,
`Alexander Fleming.|Who discovered penicillin?|When was penicillin discovered?|Why is penicillin important?
In a laboratory.|Where do scientists do experiments?|Why do scientists do experiments?|When do scientists do experiments?
To see tiny things.|Why do scientists use microscopes?|Where do scientists work?|Who uses microscopes?
At 100 degrees.|When does water boil?|Why does water boil?|Where does water boil?
Ice.|What does water become when it freezes?|Where does water freeze?|When does water freeze?
Mix the two liquids.|What is the next step?|Where are the liquids?|Who mixes the liquids?`,
`An earthquake.|What shakes the ground?|Where are earthquakes common?|When did the earthquake happen?
Under a table.|Where should you hide in an earthquake?|When do earthquakes happen?|Why do earthquakes happen?
Because of heavy rain.|Why did the river flood?|Where did the river flood?|When did the river flood?
Stay calm.|What should you do in a storm?|Where do storms happen?|Why do storms happen?
A volcano.|What erupts with hot lava?|Where are volcanoes?|When did the volcano erupt?
Strong winds.|What does a hurricane bring?|Where do hurricanes start?|When do hurricanes come?`]
 };
 const api={grades:Object.fromEntries(Object.entries(bank).map(([grade,islands])=>[grade,islands.map(rows)]))};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.LeagueAskBank=api;
})(typeof globalThis!=='undefined'?globalThis:this);
