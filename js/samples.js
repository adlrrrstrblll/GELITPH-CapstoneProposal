// Original fictional writing for demonstration, never represented as interviews.
// Built-in samples are read-only and do not count toward the collection target.
const image = (url, description, credit) => ({ kind: 'image', url, name: 'Illustrative photograph', description, credit });
const airport = image('assets/airport-luggage.jpg', 'Travel bags in an airport waiting area. Illustrative photograph.', 'MChe Lee / Unsplash');
const home = image('assets/home.jpg', 'A house in Moalboal, Cebu. Illustrative photograph.', 'Jan Ledermann / Unsplash');
const jeepney = image('assets/jeepney.jpg', 'A jeepney on a Manila street. Illustrative photograph.', 'Sadia Afreen / Unsplash');
const adobo = image('assets/adobo.jpg', 'Chicken adobo served on a plate. Illustrative photograph.', 'dbgg1979 / CC BY 2.0');
const cooking = image('assets/lumpia-prep.jpg', 'Hands wrapping lumpia in a kitchen. Illustrative photograph.', 'Kayte Young / WFIU');
const meal = image('assets/shared-meal.jpg', 'People sharing a meal in Baguio. Illustrative photograph.', 'Joyce Romero / Unsplash');


export const SAMPLE_STORIES = [
  {
    id: 'sample-lina', pairId: 'sample-sunday', title: 'The space between Sunday calls',
    author: 'Lina', perspective: 'left', theme: 'Leaving', isSample: true,
    narrative: 'The first thing I packed was not clothing. It was a photograph of my daughter in her school uniform, standing a little too straight because she wanted to look grown up.\n\nIn the room I rented abroad, I placed it beside the kettle. Every morning, while the water boiled, I looked at the picture and tried to imagine what she was doing. Sometimes I got the time difference wrong. I would call just as she was leaving for school, and all we had time to say was, “Kumain ka na?”\n\nOn Sundays we leave the call open while she does her homework and I fold my laundry. We do not always talk. I hear a tricycle outside our gate, or my sister reminding her to bring in the clothes before it rains. For a little while, the room sounds like home.\n\nI tell her about work, but also about the small things: a bird outside my window, the soup I tried to cook, the word I finally learned to pronounce. I want her to know the person I am here, not only the money I send.\n\nAt the end of each call, she says, “Next Sunday ulit, Ma.” We have made a place for each other in the week.',
    media: [airport, { kind: 'audio', url: 'assets/sunday-narration.wav', name: 'SAMPLE computer-voiced narration', description: 'Computer-voiced excerpt of this fictional story. This is not an interview recording.' }],
    transcript: 'Image: travel bags in an airport waiting area, used as an illustration.\nAudio, computer-voiced sample: On Sundays we leave the call open while she does her homework and I fold my laundry. We do not always talk. I hear a tricycle outside our gate, or my sister reminding her to bring in the clothes before it rains. For a little while, the room sounds like home.'
  },
  {
    id: 'sample-mika', pairId: 'sample-sunday', title: 'I leave the camera on',
    author: 'Mika', perspective: 'stayed', theme: 'Staying', isSample: true,
    narrative: 'When Mama first left, I saved up things to tell her. I wrote them on the back of my notebook: the science quiz, the new girl in class, the way our dog slept under her chair.\n\nBy the time Sunday came, the list felt too long. I usually told her I was fine. I did not know how to explain that a perfectly ordinary Tuesday could be the day I missed her most.\n\nNow we leave the camera on. Sometimes she watches me erase the same answer three times. Sometimes I hear her humming while she folds a shirt. I have learned which corner of her room catches the afternoon light.\n\nLast week I held the phone near the kitchen while Tita cooked. Mama told us we were cutting the onions too thick. We laughed, and for a moment it felt as if she was standing beside the stove.\n\nI still write in the notebook. But I no longer wait for something important to happen before I call. I think the ordinary things are what we have been trying to share.',
    media: [home],
    transcript: 'Illustrative photograph of a house in Moalboal, Cebu. It is not the fictional family’s house.'
  },
  {
    id: 'sample-ben', pairId: 'sample-recipe', title: 'A recipe without measurements',
    author: 'Ben', perspective: 'left', theme: 'Remembering', isSample: true,
    narrative: 'My father never measured the vinegar. He poured until the pot smelled right, added a little water, and said I would know when it was enough.\n\nYears later, in a kitchen far from the one I grew up in, I called him to ask for the recipe. He said, “Tantiyahin mo lang.” Just estimate. I laughed because it was the least useful instruction and the most familiar thing he could have said.\n\nWe stayed on the phone while I cooked. I showed him the pot. He leaned so close to the screen that I could only see his forehead. More pepper, he said. Let it simmer. Stop stirring.\n\nThe adobo tasted different. The soy sauce was a brand I had never used, and I had bought the wrong cut of meat. Still, I took a photograph and sent it home.\n\nNow I cook it when I have friends over. I tell them how my father taught me, one uncertain instruction at a time. The recipe has become a conversation we can pick up wherever we are.',
    media: [adobo, { kind: 'video', url: 'assets/remembering.webm', name: 'SAMPLE silent visual study', description: 'A silent, eight-second visual study using the credited jeepney photograph. Original illustrative sample; not contributor footage.' }],
    transcript: 'Image: chicken adobo. Silent video: a jeepney on a Manila street. The video slowly moves across the same photograph with the words “An ordinary day. A familiar kind of home.” There is no speech or audio track.'
  },
  {
    id: 'sample-ramon', pairId: 'sample-recipe', title: 'Tell me when it starts to simmer',
    author: 'Ramon', perspective: 'stayed', theme: 'Remembering', isSample: true,
    narrative: 'When my son called to ask how to cook adobo, I almost said, “You have watched me do this a hundred times.” Instead I told him to show me his pot.\n\nThere were things I could not tell through a screen. I could not smell the vinegar or hear how hard it was boiling. So we worked slowly. He held up bottles. I asked him to tilt the camera. We both pretended the connection was better than it was.\n\nWhen he sent a photograph of the finished meal, I showed it to his mother. She said the sauce looked too thin. Then she asked me to save the picture.\n\nI used to think I needed big news before I could call him. Now I ask what he has cooked. He asks what we have had for lunch. There are days when that is the whole conversation.\n\nThe kitchen is quieter without him opening every lid. But sometimes, when my phone rings beside the chopping board, it feels a little less quiet.',
    media: [cooking], transcript: 'Illustrative photograph of hands preparing lumpia; not the fictional narrator.'
  },
  {
    id: 'sample-teresa', pairId: 'sample-homecoming', title: 'We kept your place at the table',
    author: 'Teresa', perspective: 'stayed', theme: 'Coming Home', isSample: true,
    narrative: 'Three days before my brother came home, I washed the curtains. There was no reason he would notice them. It was simply something I could do with the waiting.\n\nWe argued in the family chat about what to cook. He asked us not to make a fuss. Then he sent a list of dishes he had missed, which was his way of making a fuss too.\n\nAt the airport I worried that we would not know how to be around each other. We had become good at calls that lasted twenty minutes. A whole month together felt like a different language.\n\nIn the car, he asked us to open the windows. He pointed out a shop that was gone and another that had changed its name. At home, he sat in his old place and asked who had moved the rice cooker.\n\nWe laughed. The next morning we had to learn each other’s routines again. Homecoming, I think, is made of those small adjustments. We kept a place for him, but we were all allowed to have changed.',
    media: [meal], transcript: 'Illustrative photograph of a shared meal in Baguio; not a photograph of the fictional family.'
  },
  {
    id: 'sample-joel', pairId: 'sample-homecoming', title: 'A familiar road, a different me',
    author: 'Joel', perspective: 'left', theme: 'Coming Home', isSample: true,
    narrative: 'I thought I would recognize everything on the drive home. Instead I kept asking questions. Was that bakery always there? When did the road get wider? Who painted the gate?\n\nMy sister laughed and said I had become a tourist. I laughed too, although it bothered me more than I expected. I had kept home still in my memory, as if everyone had agreed to wait.\n\nFor the first few days, I woke before the rest of the house. I made coffee and sat outside. Little by little, the morning sounds became familiar again. A neighbor swept the pavement. Someone called to a child who was late for school.\n\nI began helping with ordinary errands. I learned the new route to the market. I listened to stories that had never made it into a phone call.\n\nI still have a life in another country. I am learning that this does not cancel the one I have here. Maybe belonging can be something we keep making, even after we return.',
    media: [jeepney], transcript: 'Illustrative photograph of a jeepney in Manila, used to evoke everyday travel. Not footage of a contributor’s return.'
  }
,
{
  "id": "sample-ari",
  "pairId": "sample-weather",
  "title": "The first winter coat",
  "author": "Ari",
  "perspective": "left",
  "theme": "Leaving",
  "isSample": true,
  "narrative": "I bought my first winter coat during a sale in September. Outside the shop, people were still wearing shorts. I carried the coat home in a bag and sent Mama a photograph of the price tag. She asked whether it covered my ears.\n\nWhen the first snow came, I discovered that the coat was only the beginning. I needed gloves I could find in the dark, boots that did not leak, and enough time to miss a bus without panicking.\n\nMama began sending a message before I left for work: Nakakain ka na? It was evening for her. Sometimes the photograph attached was of the street outside our house, bright with sun.\n\nOne morning I sent her a short video of snow collecting on my sleeve. She watched it three times. Then she asked me to put my phone away and get my hands back into my pockets.",
  "media": [
    {
      "kind": "image",
      "url": "assets/winter.jpg",
      "name": "Illustrative photograph",
      "description": "A snow-covered street in Toronto. Illustrative image, not a portrait of the narrator.",
      "credit": "Rolandas S / Unsplash"
    }
  ],
  "transcript": "Illustrative image: A snow-covered street in Toronto."
},
{
  "id": "sample-nora",
  "pairId": "sample-weather",
  "title": "It is still warm here",
  "author": "Nora",
  "perspective": "stayed",
  "theme": "Staying",
  "isSample": true,
  "narrative": "The first time Ari showed me snow, I asked if it made a sound. On the screen it looked like rain that had forgotten to fall quickly. Ari laughed and opened the window so I could listen.\n\nI had helped pack the suitcase with shirts, towels, and a small bag of coffee. None of it seemed useful against that weather. I kept wanting to send something warmer, although I did not know what would fit in a box.\n\nSo I send the morning instead. The neighbor opening the store. Our dog asleep beside the gate. The mango tree after someone has swept the yard. I never know which ordinary thing Ari might want to see.\n\nAt first I wrote, It is still warm here, as if it were an invitation to come home. Now I write it because we have found something to talk about before either of us has to say we miss the other.",
  "media": [
    {
      "kind": "image",
      "url": "assets/sari-store.jpg",
      "name": "Illustrative photograph",
      "description": "Neighbors outside a sari-sari store in Cebu City. Illustrative image, not a portrait of the narrator.",
      "credit": "XT7 Core / Unsplash"
    }
  ],
  "transcript": "Illustrative image: Neighbors outside a sari-sari store in Cebu City."
},
{
  "id": "sample-camille",
  "pairId": "sample-language",
  "title": "The words I kept",
  "author": "Camille",
  "perspective": "left",
  "theme": "Belonging",
  "isSample": true,
  "narrative": "I still know the words Lola used when I was small. Tsinelas. Kumain ka na. Ingat. The longer sentences arrive slowly now. I can hear what I want to say, but when I open my mouth, the words come out in the wrong order.\n\nFor a while, I let my mother do most of the talking on our calls. I smiled, waved, and waited for a question I could answer with oo. Afterwards, I felt as though I had visited a house and stayed by the door.\n\nLast month I started a page in my notebook called Things to tell Lola. I wrote about the plant on my windowsill and a neighbor's noisy dog. Beside each sentence, I left space for the words I would have to ask her for.\n\nOur next call lasted nearly an hour. I said half of it in English. Lola corrected one word, told me a story about our old dog, and asked what I planned to cook for dinner.",
  "media": [
    {
      "kind": "image",
      "url": "assets/writing.jpg",
      "name": "Illustrative photograph",
      "description": "A person writing in a notebook over coffee. Illustrative image, not a portrait of the narrator.",
      "credit": "Oliver Kallion / Unsplash"
    }
  ],
  "transcript": "Illustrative image: A person writing in a notebook over coffee."
},
{
  "id": "sample-elena",
  "pairId": "sample-language",
  "title": "You can answer in English",
  "author": "Elena",
  "perspective": "stayed",
  "theme": "Belonging",
  "isSample": true,
  "narrative": "When Camille calls, I sometimes forget how long it has been since she lived here. I ask a question as quickly as I would across the dining table. Then I see her turn to her mother for help, and I remember to slow down.\n\nI used to think that if I kept speaking Tagalog, the words would return to her on their own. Perhaps some of them will. But I noticed that our conversations were getting shorter, and I did not want her to feel that every call was a lesson.\n\nNow I say, You can answer in English. Tell me first. We can find the other words later. Sometimes she holds up her notebook, and we spend ten minutes naming things we can see from our windows.\n\nYesterday she told me about a flower that had finally opened. I did not know its English name. She sent a photograph. We looked at it together, and for once neither of us needed to translate anything.",
  "media": [
    {
      "kind": "image",
      "url": "assets/shared-meal.jpg",
      "name": "Illustrative photograph",
      "description": "People sharing a meal in Baguio. Illustrative image, not a portrait of the narrator.",
      "credit": "Joyce Romero / Unsplash"
    }
  ],
  "transcript": "Illustrative image: People sharing a meal in Baguio."
}
];

export const PAIR_HEADINGS = {
 'sample-sunday': { title: 'Two sides of\nthe same distance.', description: 'One shared experience. Two ways of remembering it.' },
 'sample-recipe': { title: 'A recipe becomes\na conversation.', description: 'A kitchen here. A kitchen there. Something familiar between them.' },
 'sample-homecoming': { title: 'Coming home.\nFinding each other.', description: 'A familiar place, and the people we are becoming.' },
 'sample-weather': { title: 'Different weather.\nThe same care.', description: 'A winter coat, a morning message, and the distance between them.' },
 'sample-language': { title: 'Some words find\ntheir way home.', description: 'Two generations make room for the words they know, and the ones they are learning.' }
};
