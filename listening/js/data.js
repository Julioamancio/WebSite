/*
 * Banco de provas – Listening/Reading B2 – 3ª Etapa – Colégio Santo Antônio
 *
 * Estrutura de cada prova:
 *   sections[0] -> Question 1 (listening, múltipla escolha)
 *   sections[1] -> Question 2 (listening, completar lacunas)
 *   sections[2] -> Question 3 (reading, múltipla escolha)
 *
 * Áudio: o player tenta, em ordem,
 *   1) listening/audio/<local>   (opcional – coloque o MP3 nesta pasta para funcionar offline)
 *   2) o arquivo público no Google Drive (driveId)
 *   3) o player incorporado do Google Drive (iframe), se os dois anteriores falharem.
 *
 * Lacunas: "accept" lista as respostas aceitas (sem diferenciar maiúsculas/minúsculas).
 * "reject" lista palavras parecidas que NÃO devem ser aceitas como "erro de grafia".
 * "pattern" (opcional) é uma expressão regular extra de respostas aceitas.
 */
window.LISTENING_TESTS = [
  /* =====================================================================
   * 1ª SÉRIE – TIPO A – TURMAS FG
   * ===================================================================== */
  {
    id: "1s-tipo-a-fg",
    serie: "1ª Série",
    tipo: "Tipo A",
    turmas: "FG",
    level: "B2",
    etapa: "3ª Etapa",
    topics: ["Junior radio reporter", "Chocolate maker", "Sandy on the ski slope"],
    sections: [
      {
        kind: "listening-mc",
        number: 1,
        points: 0.6,
        instructions:
          "You will hear an interview with a teenager called Luke Fuller, who’s talking about working as a junior reporter for his local radio station. For questions 1–5, select the best answer (A, B, C, D or E).",
        audio: { driveId: "1P4K3FrZg6e_8jx9RgmgdNpE-u8wDnxEE", local: "1s-fg-q1.mp3", duration: "9 min 05 s" },
        source:
          "CAMBRIDGE UNIVERSITY PRESS & ASSESSMENT. B2 First for Schools – Sample Paper 1: Listening. Cambridge, 2022.",
        questions: [
          {
            stem: "What was the aim of Luke’s work at the radio station?",
            options: [
              "to encourage media careers",
              "to teach teens to write scripts",
              "to find out about famous people",
              "to show teens their stories matter",
              "to develop teens’ technical skills"
            ],
            answer: "D",
            explanation:
              "Luke diz: <q>It was about making us see that everyone has a story that’s worth telling.</q> A alternativa A é a armadilha: ele menciona que alguns podem trabalhar em rádio, <q>but that wasn’t really the purpose</q>. C está errada porque o foco era em <q>ordinary teenagers and not local celebrities</q>."
          },
          {
            stem: "Luke says the most difficult thing to learn was how to",
            options: [
              "handle the equipment.",
              "speak in the right way.",
              "write the scripts.",
              "choose topics to discuss.",
              "work with the producers."
            ],
            answer: "B",
            explanation:
              "<q>The weird thing was having to practise being natural and relaxed. I’d never thought about how hard that would be.</q> Ou seja, o difícil foi falar de forma natural. O equipamento não foi problema (<q>I’m quite good with technical stuff</q>) e eles foram orientados a <b>não</b> escrever roteiro (<q>rather than write a script</q>)."
          },
          {
            stem: "What problem did Luke expect to have when he reported from his school?",
            options: [
              "missing lessons at school",
              "a lack of events to report",
              "a negative reaction from teachers",
              "getting no advice from staff",
              "feeling awkward in the role"
            ],
            answer: "E",
            explanation:
              "<q>It meant I’d be the centre of attention for a few days, which I wasn’t looking forward to because I’m rather shy.</q> Ele esperava se sentir desconfortável. B está errada (<q>no shortage of stuff to talk about</q>) e C/D também: os professores apoiaram e <q>one or two gave me some advice</q>."
          },
          {
            stem: "What surprised Luke when he started interviewing people?",
            options: [
              "how honest they were with him",
              "how confident they seemed to be",
              "how well-prepared they were",
              "how long the interviews lasted",
              "how little time there was"
            ],
            answer: "A",
            explanation:
              "<q>In the end people often opened up and revealed much more than I’d expected.</q> As pessoas se abriram e foram sinceras. B é o contrário: no início ficavam <q>self-conscious</q>. C também é o contrário: alguns <q>didn’t feel ready</q>."
          },
          {
            stem: "What does Luke say about the whole experience of being a reporter?",
            options: [
              "He regrets complaining about parts of it.",
              "It suited his curiosity about people.",
              "He enjoyed its many different demands.",
              "It was easier than he had expected.",
              "It made him want to be a producer."
            ],
            answer: "C",
            explanation:
              "<q>I had to be a journalist, a producer and an engineer all at the same time and each role needed specific skills… it was hard work, but I didn’t mind.</q> B é a opinião da mãe dele, que ele considera brincadeira (<q>I think she’s just joking</q>). A está errada: <q>I never complained</q>. D está errada: <q>it was hard work</q>."
          }
        ],
        tapescript: `Int: My guest today is Luke Fuller, who’s 17 and who’s just spent a month working as a junior reporter for his local radio station. It sounds fascinating. What was the purpose of what you were doing, Luke?

Luke: Well, the radio station in my town wanted to encourage teenagers to have a go at being reporters. This meant taking your microphone everywhere and talking to people about what was happening in their lives. The whole idea was to focus on ordinary teenagers and not local celebrities or anyone like that. It was about making us see that everyone has a story that’s worth telling. Some of us might go on to work at a radio station, but that wasn’t really the purpose.

Int: So, how did you prepare?

Luke: Well, we had a bit of training. Of course I had to familiarise myself with the equipment, but I’m quite good with technical stuff so that wasn’t too much of a problem. The weird thing was having to practise being natural and relaxed. I’d never thought about how hard that would be. We were told to be spontaneous rather than write a script or anything like that. I must admit I love writing, so I did jot down some ideas anyway!

Int: How did you feel about the idea of reporting from your school?

Luke: Well, it meant I’d be the centre of attention for a few days, which I wasn’t looking forward to because I’m rather shy. These reports weren’t part of my school work, but my teachers seemed quite keen on the idea anyway, and one or two gave me some advice. And there was plenty of stuff going on at school. It’s a lively place so there was no shortage of stuff to talk about.

Int: So what happened when you did your first interviews with people at school?

Luke: As soon as I got the microphone out, even my most talkative friends tended to go all self-conscious. Sometimes I had to begin recording a few minutes before the start of the interview just to put people at their ease. There wasn’t always time to explain things to them before the interview, so sometimes one or two of them didn’t feel ready. But you know, in the end people often opened up and revealed much more than I’d expected, which was great.

Int: What happens after you’ve recorded something? Is it edited or changed in any way?

Luke: Everything you record has to be carefully edited. Luckily I got the chance to work on this with producers at the station so it wasn’t as if I’d no control over the content, although it only went out on the radio a week later, it wasn’t live. Even so, kids I’d talked to at school wanted to know that anything silly or embarrassing they said wouldn’t be broadcast. Unfortunately sometimes even good stuff had to be cut because time’s very limited! That’s a pity, but I understood the reasons for it.

Int: So, overall did you enjoy being a reporter?

Luke: Sure, it was a lot of fun. My mum says I liked it because it gave me permission to ask loads of personal questions but I think she’s just joking. What was really cool about it was that I had to be a journalist, a producer and an engineer all at the same time and each role needed specific skills. I never complained about having to do everything. Yeah, it was hard work, but I didn’t mind.

Int: And has it changed your attitude to radio at all?

Luke: Some of my friends think the radio is just for music. But I’ve never thought like that. It can make you feel like someone is talking directly to you. I hope that’s how people will feel when they hear me! What I’ve learned is that because there are no pictures, you have to be creative and pay attention to the words you use. It made me appreciate how good radio reporters have to be at expressing themselves. That’s not to say there’s no place for music.

Int: Great talking to you Luke.`
      },
      {
        kind: "listening-gap",
        number: 2,
        points: 0.6,
        heading: "Chocolate maker",
        instructions:
          "You will hear a young man called Sam Conti telling a group of students about his job as a specialist chocolate maker. For questions 1–5, complete the sentences with a word or short phrase.",
        audio: { driveId: "1xxFWHMdKKgPal0dGdN79-898Y-0UBKIs", local: "1s-fg-q2.mp3", duration: "9 min 03 s" },
        source:
          "CAMBRIDGE UNIVERSITY PRESS & ASSESSMENT. B2 First for Schools – Sample Paper 2: Listening. Cambridge, 2015.",
        questions: [
          {
            before: "Sam uses the word",
            after: "to describe the process of growing cocoa beans.",
            answer: "complex",
            accept: ["complex", "very complex", "a very complex one", "complex one"],
            reject: ["complete", "comply"],
            explanation:
              "<q>Growing high-quality cocoa beans is a process that’s not at all straightforward – in fact it’s a very complex one.</q> Cuidado: <i>straightforward</i> aparece, mas negado (<i>not at all</i>)."
          },
          {
            before: "Sam learnt that cocoa beans are similar to",
            after: "in the way the weather affects them.",
            answer: "grapes",
            accept: ["grapes"],
            reject: ["grape", "grapés"],
            explanation:
              "<q>In fact, the beans are more like grapes really – so each year’s crop is of a different quality.</q> <i>Apples</i> e <i>bananas</i> são citadas como contraste (frutas <b>menos</b> afetadas pelo clima)."
          },
          {
            before: "Sam can identify the quality of chocolate when he hears a sound he calls the",
            after: ".",
            answer: "snap",
            accept: ["snap", "the snap"],
            reject: ["snack", "slap", "snip", "snaps"],
            explanation:
              "<q>I want to hear ‘the snap’ – if it makes that noise, it means it’s good.</q>"
          },
          {
            before: "Sam tries to make a chocolate without any",
            after: "in the flavour.",
            answer: "bitterness",
            accept: ["bitterness"],
            reject: ["sweetness", "bitter"],
            explanation:
              "<q>What I’m aiming for is a rich and rounded flavour without bitterness.</q> <i>Sweetness</i> é o distrator: ele quer <q>only a limited sweetness</q>, não ausência total."
          },
          {
            before: "Sam says he gets his most original ideas while he is",
            after: ".",
            answer: "driving",
            accept: ["driving", "driving a car", "driving his car"],
            reject: ["diving", "drying", "swimming", "running"],
            explanation:
              "<q>I actually come up with most of my strangest recipes when I’m driving.</q> <i>Swimming</i> e <i>running</i> aparecem logo antes, mas são os exercícios que ele faz para compensar as calorias."
          }
        ],
        tapescript: `Hi – my name’s Sam Conti and my job is making and selling chocolate. Later on, I’m going to show you some of my chocolate – you might even get a chance to try some – but first a bit about me. People often ask how I got into this business. Well, my parents wanted me to have a steady job, and they suggested studying something like Medicine at university, because they thought a job in that area would pay well, or even Economics, but at the time I thought Law might open more doors, so that’s what I did. But life doesn’t always work out the way you plan it.

After finishing my degree, I took time out and went travelling in South America, where I ended up staying over a year on a cocoa plantation. I discovered that growing high-quality cocoa beans is a process that’s not at all straightforward – in fact it’s a very complex one. So there’s far more to the making of chocolate than first meets the eye. I had no idea, for example, how easily the cocoa beans are affected by changes in weather and climate – much more than other fruit like apples or bananas. In fact, the beans are more like grapes really – so each year’s crop is of a different quality.

When I came home, I decided to open a small shop making and selling my own chocolate – that was hard work I can tell you, because so much can go wrong with chocolate. The hardest bit is melting it in precisely the right way, but cooling it correctly isn’t easy either. To learn the trade, I set about testing all the chocolate I could find. The first thing I do is break off a piece. I want to hear ‘the snap’ – if it makes that noise, it means it’s good. Then I smell it just before popping it into my mouth. I’ll never forget the first chocolates I sold in the shop – I got such a buzz from it – and I’ve never lost that thrill. Another thing I like to do is write up my experiments. I keep a diary for this. It’s the key to my success. One day I’ll put it all on a database, but I haven’t had time yet.

I make a range of chocolates, but what I’m aiming for is a rich and rounded flavour without bitterness. I want top quality but there must be a richness, and only a limited sweetness – and, of course, a completely new recipe so that I can be setting a new trend. That takes time, and trying out new ideas means tasting a lot! To counter the calories, I go swimming and do a lot of running. But even then chocolates aren’t far from my mind. I actually come up with most of my strangest recipes when I’m driving – once I’ve got an idea, I pick up samples and ingredients, and do the cooking myself. I keep playing with flavours until I feel it’s ready to try on friends. These sessions have produced some fantastic ideas, such as chilli-flavoured chocolate, which was much more successful than anyone imagined. But I’ve also had my fair share of disasters, like chocolate flavoured with cheese, which nobody bought. I test recipes out on my family and they’re never shy about telling me what they really think.

Anyway, I’ve got some chocolate here for you to try, but before we do that I’d like to show you a short video clip that shows me actually making the stuff in my laboratory. Yes that’s the name I use for the place where I work, because it is quite scientific what I do. But it’s a workshop really, and it’s located in what used to be an old sweet factory next to my house – here it is coming up on the screen now.`
      },
      {
        kind: "reading-mc",
        number: 3,
        points: 0.8,
        instructions:
          "Read the extract from a novel about an American teenager called Sandy, who is on a skiing trip. For questions 1–5, choose the answer (A, B, C, D or E) which you think fits best according to the text.",
        passageTitle: "",
        passageSubtitle: "",
        source:
          "CAMBRIDGE UNIVERSITY PRESS & ASSESSMENT. B2 First for Schools – Sample Paper 1: Reading and Use of English, Part 5. Cambridge, 2022.",
        passage: `‘How did I ever manage to get myself into this?’ Sandy wondered aloud and then groaned, although no one was there to hear her. She looked down again from the top of the slope and quickly shut her eyes to block out the sight. ‘Help!’ she said pleadingly in barely more than a whisper with her eyes still closed. ‘Michael? Anyone? Please, oh please… somebody help me out of this mess!’ She was louder the second time, but without anyone nearby to respond – not even Michael, her best friend – it did little to resolve her present dilemma.

At thirteen, short-haired Sandy was quite tall for her age, but thin, which only gave her an appearance of greater height. At the moment, she was dressed in a colorful, thick winter jacket that had a bold bright pink and white design sweeping across a purple background. Her smooth water-repellent pants were the same purple color as her jacket – it was obviously a fashionable, co-ordinated outfit. Warm dark purple gloves covered her hands, and her attire was topped off – literally – with a purple ski hat, scarf and stylish ski goggles. If anyone had been around to see her, dressed the way she was, she would have been clearly visible from a long distance away against the almost solid white backdrop of snow surrounding her.

Sandy opened her eyes and glanced again at the sign posted near her at the top of the slope: it was a triple diamond slope, an expert-level ski run. How had she ended up there? She reproached herself that Michael had at least shown enough sense to get off the ski lift at an earlier opportunity to go down a more moderate slope. Absorbed by the view from near the top of the Sierra Nevada Mountain range in the Lake Tahoe area – shared between California on the west side of the range and Nevada on the east – she had foolishly decided to ride the lift up a little further and had found herself facing this ski slope, one that was well above her slightly more than beginner-level skier abilities.

Sandy sighed deeply, tightly gripped her ski poles in her gloved hands, pointed her skis straight, and pushed back on the poles in her hands enough to cause herself to inch forward as all other avenues seemed to be closed to her. Once more than half of the length of her skis was sticking out into the air – only their back ends were still making contact with the snow at the slope’s top – her balance began shifting forward, her skis followed, and she found herself rapidly picking up speed as she headed straight down the excessively challenging slope.

‘How am I supposed to slow down?’ Sandy shouted, but with the wind whipping by and the trees rushing past on either side of her, she could hardly hear herself. Everything she had learned about skiing in the previous two days seemed to have faded from her mind. Concentrating only on maintaining her balance, she kept her skis pointed straight downhill, which unfortunately only made her pick up more speed on the steep, icy slope.

‘Simone would know how to ski expertly down this slippery slope’, Sandy thought as she tried to imagine herself as Simone, international spy and heroine of the Simone LeClerc adventure series that Sandy loved to read. Coming up ahead of her, Sandy saw the ski lift which Michael had gotten off earlier. She desperately hoped she would find her friend among the skiers and snowboarders waiting there and she would be able to stop.`,
        questions: [
          {
            stem: "What is the writer’s purpose in the first paragraph?",
            options: [
              "to explain why Sandy was in this situation",
              "to give relevant details of Sandy’s character",
              "to introduce the fact that Sandy faced a challenge",
              "to describe how Sandy planned to solve a problem",
              "to show that Michael had abandoned Sandy"
            ],
            answer: "C",
            explanation:
              "O 1º parágrafo mostra Sandy no topo da pista, fechando os olhos e pedindo ajuda (<q>somebody help me out of this mess!</q>): o autor apresenta o desafio. A explicação de <b>por que</b> ela está ali (A) só aparece no 3º parágrafo. E está errada: Michael apenas desceu por uma pista mais fácil antes."
          },
          {
            stem: "What does the writer suggest about Sandy’s clothes?",
            options: [
              "They made it unlikely she would be seen.",
              "She wore them because she was in a team.",
              "They were too heavy for the conditions.",
              "She had chosen them with care.",
              "They showed she was an expert skier."
            ],
            answer: "D",
            explanation:
              "<q>It was obviously a fashionable, co-ordinated outfit.</q> Tudo combinava em roxo – roupas escolhidas com cuidado. A diz o contrário do texto (<q>clearly visible from a long distance</q>). E está errada: ela é <q>slightly more than beginner-level</q>."
          },
          {
            stem: "According to the third paragraph, why did Sandy end up on the expert slope?",
            options: [
              "Michael had advised her to go there.",
              "She was too busy enjoying the view.",
              "She wanted to impress her friend.",
              "She had misread the sign at the lift.",
              "She was following a group of skiers."
            ],
            answer: "B",
            explanation:
              "<q>Absorbed by the view… she had foolishly decided to ride the lift up a little further.</q> A distração com a paisagem a levou até lá. A está errada: Michael teve o bom senso de descer <b>antes</b>, numa pista moderada."
          },
          {
            stem: "Why did Sandy start skiing down the slope?",
            options: [
              "She began moving by accident.",
              "She wanted to catch up with Michael.",
              "She didn’t realise how fast she would go.",
              "She didn’t want to admit it was too hard.",
              "She thought it was her only option."
            ],
            answer: "E",
            explanation:
              "<q>…to cause herself to inch forward as all other avenues seemed to be closed to her.</q> Ela achou que não havia outra saída. A está errada: ela empurrou os bastões de propósito (<q>pushed back on the poles… to cause herself to inch forward</q>)."
          },
          {
            stem: "What do we learn about Sandy in the final paragraph?",
            options: [
              "She prefers books to sport.",
              "She is an adventurous person.",
              "She admires a character from fiction.",
              "She has given up hope of stopping.",
              "She blames Michael for leaving her."
            ],
            answer: "C",
            explanation:
              "Ela se imagina como <q>Simone, international spy and heroine of the Simone LeClerc adventure series that Sandy loved to read</q> – admira uma personagem de ficção. D está errada: ela <q>desperately hoped… she would be able to stop</q>. A não é dito: o texto não compara livros e esporte."
          }
        ]
      }
    ]
  },

  /* =====================================================================
   * 1ª SÉRIE – TIPO B – TURMAS ABC
   * ===================================================================== */
  {
    id: "1s-tipo-b-abc",
    serie: "1ª Série",
    tipo: "Tipo B",
    turmas: "ABC",
    level: "B2",
    etapa: "3ª Etapa",
    topics: ["Swimmer Helen Gibson", "Puffins in Iceland", "Scotty Weems"],
    sections: [
      {
        kind: "listening-mc",
        number: 1,
        points: 0.6,
        instructions:
          "You will hear part of an interview with a successful young swimmer called Helen Gibson. For questions 1–5, select the best answer (A, B, C, D or E).",
        audio: { driveId: "16vJU3L9DUkbAnLniXDeJDV9EXAoZR795", local: "1s-abc-q1.mp3", duration: "8 min 03 s" },
        source:
          "CAMBRIDGE UNIVERSITY PRESS & ASSESSMENT. B2 First for Schools – Sample Paper 2: Listening. Cambridge, 2015.",
        questions: [
          {
            stem: "Why did Helen first take up swimming?",
            options: [
              "She wanted to beat her older brothers.",
              "She wanted to share a hobby with her father.",
              "She had got tired of running.",
              "Her parents suggested it.",
              "She was a natural in the water."
            ],
            answer: "D",
            explanation:
              "<q>He and Mum convinced me to have some swimming coaching to build up my confidence in the water.</q> A está errada: os irmãos a <b>desanimaram</b> (<q>I never stood a chance of beating them</q>). B se refere à corrida, o esporte do pai. E foi dito depois, pelo pessoal do clube."
          },
          {
            stem: "Helen thinks she’s been successful as a swimmer because",
            options: [
              "she has natural ability.",
              "she has the right attitude.",
              "she has support from those around her.",
              "her coaches have always been strict.",
              "she belongs to a good club."
            ],
            answer: "B",
            explanation:
              "<q>I’m pretty focused generally, things aren’t worth doing if you’re not passionate about them – not everybody has that drive… ultimately it was down to me.</q> A está errada: ela não acreditou quando disseram que era <i>natural</i>. As instalações (C/E) aparecem só como sorte, não como a causa principal."
          },
          {
            stem: "Looking back on her training programme as a schoolgirl, Helen",
            options: [
              "wishes she had studied more.",
              "regrets the loss of her social life.",
              "found the workouts rather dull.",
              "wishes she had trained less.",
              "appreciates the effort of her coaches."
            ],
            answer: "E",
            explanation:
              "<q>I had some amazing coaches who planned fun workouts… I’m grateful to them for that.</q> A está errada (<q>I never got behind with the studies</q>); B também (<q>I was cool with that</q>); C é o contrário (<q>fun workouts</q>)."
          },
          {
            stem: "What does Helen enjoy about her life as a professional swimmer?",
            options: [
              "travelling to competitions",
              "being in the public eye",
              "focusing on her main aims",
              "reading about herself",
              "earning a good salary"
            ],
            answer: "C",
            explanation:
              "<q>I love being fit and challenging myself as an athlete – now I’ve left school I can concentrate on that 100%.</q> A está errada: <q>living out of a suitcase isn’t my idea of a good time</q>. B e D são apresentados como <i>downsides</i>."
          },
          {
            stem: "What has Helen found most difficult during her career?",
            options: [
              "competing in her home area",
              "dealing with losing races",
              "recovering from injuries",
              "handling the press",
              "keeping up with training"
            ],
            answer: "A",
            explanation:
              "<q>But there’s nothing worse than competing in front of a home crowd – their expectations are so high.</q> A expressão <i>nothing worse</i> indica o mais difícil. C: ela evitou lesões sérias. B: é difícil, mas ela lida com isso com a psicóloga. D: <q>I can laugh it off</q>."
          }
        ],
        tapescript: `Int: My guest today is champion swimmer Helen Gibson. Helen, welcome. Was swimming always your sport as a kid?

H: Well, I come from a pretty sporty family actually, and both my older brothers were strong swimmers, which put me off a bit at first because I never stood a chance of beating them. So, I actually took up running – that was my Dad’s sport and was something I could share with him. He’d take me running along by these canals. I was always a bit frightened of falling in, so he and Mum convinced me to have some swimming coaching to build up my confidence in the water. And of course, it wasn’t long before I gave up the running altogether.

Int: So why did the swimming go so well?

H: People at the club I joined said I was a natural swimmer, but I didn’t believe them till I started winning regional championships, then national – then I was like, wow! I can do this. I’m pretty focused generally, things aren’t worth doing if you’re not passionate about them – not everybody has that drive. It’s a tough sport though, and ultimately it was down to me, and of course I was fortunate to have all the facilities I needed nearby.

Int: So what was your training schedule like in those early years?

H: Very intensive really – every spare moment when I wasn’t at school or doing homework was given over to training, though I never got behind with the studies actually. Fortunately I had some amazing coaches who planned fun workouts – it’s more productive that way and I’m grateful to them for that. At the beginning, I took time out to hang out with friends, but as I got more successful, my routine ruled that out, but I was cool with that because swimming had become my life.

Int: How do you feel before a big race?

H: It’s what I’ve trained for, so I try to keep calm, get ready in good time. I go and stand by the pool a couple of events before my race, with my hood up and my headphones on – music keeps me grounded. I always do the same series of stretches because they suit my body, but I don’t think about the other swimmers in the event, because I can’t influence what they do – it’s all about my own ability.

Int: So, now you’ve turned professional. What’s that like?

H: I love being fit and challenging myself as an athlete – now I’ve left school I can concentrate on that 100%. Of course, being in the public eye has its downsides – like reading stuff about yourself that’s untrue – I can laugh it off, but some athletes find it hard to deal with. I do get to travel – some people would love that, but actually living out of a suitcase isn’t my idea of a good time.

Int: So what’s the hardest thing to deal with?

H: Getting injured isn’t fun for anyone – I’ve been fortunate in avoiding anything too serious, but I get the usual aches and pains. You feel miserable, but you have to stay strong. Not getting results is also tough – I talk regularly with my sports psychologist if things aren’t going well, so that I don’t start feeling negative about things. But there’s nothing worse than competing in front of a home crowd – their expectations are so high. Once I got really stressed out just thinking who was watching.

Int: Any advice for kids listening, who’d like to follow in your footsteps?

H: If I say: ‘If you keep trying kids, you can be like me,’ that sounds great, doesn’t it? But it can’t be true for everybody. I’ve matured a lot recently, and see things more clearly. I’ve given up any idea of going to college and pursuing another career for the moment, but that’s my decision – I’m not saying it’s the only way. In fact what I would say is, it’s important to learn from your own successes and failures, because only you know what you’re really capable of.`
      },
      {
        kind: "listening-gap",
        number: 2,
        points: 0.6,
        heading: "Puffins",
        instructions:
          "You will hear a student called Duncan Heap talking about his recent trip to Iceland to study sea birds called puffins. For questions 1–5, complete the sentences with a word or short phrase.",
        audio: { driveId: "1BYzuzcF5Xvs4W7kx0xH4sda7Uh6MXYaB", local: "1s-abc-q2.mp3", duration: "8 min 24 s" },
        source:
          "CAMBRIDGE UNIVERSITY PRESS & ASSESSMENT. B2 First for Schools – Sample Paper 1: Listening. Cambridge, 2022.",
        questions: [
          {
            before: "Duncan was surprised to learn a puffin’s",
            after: "can help it to change direction when flying.",
            answer: "feet",
            accept: ["feet"],
            reject: ["foot", "wings", "wing", "beak"],
            explanation:
              "<q>I didn’t expect their feet to be used when they were flying… but actually they use them to alter their direction in the air!</q> As asas (<i>wings</i>) são citadas para nadar."
          },
          {
            before: "Duncan explains that puffins create",
            after: "as a place to make their nests.",
            answer: "holes",
            accept: ["holes", "holes underground", "underground holes"],
            reject: ["poles", "holds", "ledges", "hole"],
            explanation:
              "<q>Puffins nest underground rather than on cliff-top ledges as I’d imagined. They dig holes, so their nests are very well protected.</q> <i>Ledges</i> era o que ele imaginava – distrator."
          },
          {
            before: "Duncan was surprised to find out that young puffins are driven by",
            after: "to leave their nests.",
            answer: "hunger",
            accept: ["hunger", "being hungry", "hungry"],
            reject: ["loneliness", "anger", "danger"],
            explanation:
              "<q>Apparently it’s hunger rather than loneliness that makes young puffins fly from their nests.</q> <i>Loneliness</i> é explicitamente descartada."
          },
          {
            before: "In town,",
            after: "are the most dangerous places for young puffins to land.",
            answer: "(the) gardens",
            accept: ["gardens", "the gardens"],
            reject: ["roads", "beaches", "garden"],
            explanation:
              "<q>But gardens present more of a threat. They’re dark and there are lurking cats.</q> Nas praias são resgatados facilmente e nas ruas os motoristas dirigem devagar."
          },
          {
            before: "Duncan laughed when he saw a young puffin being put into a boy’s",
            after: ".",
            answer: "(upturned) umbrella",
            accept: ["umbrella", "upturned umbrella", "an upturned umbrella", "an umbrella"],
            reject: ["shoe box", "box"],
            explanation:
              "<q>I even saw one boy putting a young puffin in an upturned umbrella, which made me laugh!</q> As caixas de sapato eram o que todos usavam – não era engraçado."
          }
        ],
        tapescript: `Do you like sea birds? If so, you’ll love puffins. They spend most of their lives at sea, but last August I was lucky enough to see them up close, when I visited the Westman Islands, in Iceland, where they build their nests.

First of all though, a few facts about puffins. They have a squat black-and-white body, short wings and a large colourful beak, which I think makes them look really funny on dry land. But puffins are built more to swim underwater than to fly or walk. When you see them swimming, it’s an impressive sight. Their wings help them propel themselves through the water. I didn’t expect their feet to be used when they were flying, except perhaps just to moderate their speed, like brakes, but actually they use them to alter their direction in the air! In the water, puffins can dive deep, holding their breath for up to two minutes, to catch fish.

When spring comes, puffins can be seen on high cliffs on the Westman Islands, making their nests. It’s quite a sight, I’m told. I wasn’t aware of this, but puffins nest underground rather than on cliff-top ledges as I’d imagined. They dig holes, so their nests are very well protected. Each female puffin lays just one egg in its nest each year, which the pair watches over for six weeks, day and night. While they wait, you can hear them underground making noises that might be like talking – loud growling calls, almost like laughter, which some describe as sounding like a cow, and I tend to agree! Young puffins, though, once hatched, sound more like a duck or a goose, ‘peeping’ for food from their parents.

I was told that, as winter beckons, their parents leave them behind and fly off to sea, but apparently it’s hunger rather than loneliness that makes young puffins fly from their nests. That’s something I didn’t expect. And this is what I saw when I was there. In the daytime I watched young puffins diving off the cliffs to gain enough speed for flight, as they headed out to sea. At night-time, though, which is when most of them fly off, it was a different story. The thing is, puffins instinctively use the stars for navigation, but the lights of a town can fool them and make them head in the wrong direction, so the young puffins end up landing all over the place.

Some puffins land on the beaches, where they are easily rescued. Others aren’t so lucky. If it’s on the roads, cars aren’t so much of a problem as people know to drive extra slowly at this time of year. But gardens present more of a threat. They’re dark and there are lurking cats. So I helped the local teenagers, who are allowed to stay out late, and we roamed around the town with cardboard shoe boxes, rescuing young puffins as we went. I even saw one boy putting a young puffin in an upturned umbrella, which made me laugh! They didn’t seem to mind being handled and it’s not unusual for a single teenager to catch ten birds in one evening.

After a night spent as guests of their rescuers, with the box as a temporary bed, we carried the young birds down to the beach and threw them up high. It was a really rewarding experience to see them glide towards the sea and freedom. Sometimes the puffins aren’t ready for release, if they’ve been injured or whatever. In which case, they get taken to the local museum, which becomes a sort of puffin hotel for a few days each year.

You can buy all sorts of puffin souvenirs on the islands. I took some great photographs of the birds, one of which is now the screensaver on my computer – I’ve got a puffin mousemat too, that’s really cute – a much better souvenir than a puffin T-shirt or baseball cap – that’s the sort of thing most people buy.`
      },
      {
        kind: "reading-mc",
        number: 3,
        points: 0.8,
        instructions:
          "Read the extract from a novel about a teenager called Scotty Weems. For questions 1–5, choose the answer (A, B, C, D or E) which you think fits best according to the text.",
        passageTitle: "Scotty Weems",
        passageSubtitle: "",
        source:
          "CAMBRIDGE UNIVERSITY PRESS & ASSESSMENT. B2 First for Schools – Sample Paper 2: Reading and Use of English, Part 5. Cambridge, 2015.",
        passage: `It began falling in the morning. I noticed it at the start of second period, biology, but I guess it could have started at the end of first period. There wasn’t much to it at first, and it had been snowing a lot that month, so I didn’t give it a great deal of thought. It was those small flakes, like grains of sugar. By third period, the flakes had fattened up and got serious, and people were starting to talk about it.

‘Think they’ll let us out early?’ my friend, Pete said as we gathered our stuff and headed for our next class, Spanish. I looked out the window and sized it up. It was really coming down and there were already two or three centimeters on the windowsill. ‘Maybe,’ I said. ‘Is it supposed to be a big one?’ ‘Supposed to be huge: “Winter Storm Warning.” Where have you been?’ he said. ‘School, basketball practice, homework, whatever. Excuse me for not watching the weather forecast.’ ‘Well, if it’s as big as all that, they’ll probably let us go.’ ‘I hope you’re right, Weems,’ he said.

My name is Scotty Weems. I prefer ‘Scotty’, but most people, even my friends, call me ‘Weems’. I guess it’s easy to say. Anyway, I’m an athlete, so since I was a little kid, I’ve heard it shouted every time I’ve done something right and every time I messed up, too. These days it’s on the back of my basketball jersey. I like to think that someday people will be chanting it from the sidelines: ‘Weems! Weems! Weems!’ Chanting fans make any name sound good.

It was a Tuesday, and before the snow started falling the main thing on my radar was the start of the basketball season. The first game was supposed to be that night. So when Pete said, ‘Think they’ll let us out early?’ what I heard was, ‘Think they’ll cancel the game?’ Pete Dubois was one of my best friends, him and Jason Gillispie. The three of us were pretty tight. Pete blended in. It was sort of his role. It might sound strange, being known for what you aren’t, but Pete wasn’t super hip or incredibly smart. He listened to mainstream rock and wore whatever clothes he’d been given by his parents. You needed some kids like that, otherwise all you had were competing groups, all dressed in outfits that amounted to uniforms and trying to play their music louder than yours.

So for Pete, early dismissal just meant more time at home, playing video games and eating pizza. For me, it meant not collecting the payoff for all those hours of practice I’d put in over the off-season, all those jump-shots I’d taken in the gym and out in the driveway. ‘They’re going to cancel the game,’ I said to Pete. ‘That’s for sure.’ ‘Oh, yeah,’ said Pete. ‘That’s bad.’

Pete didn’t play basketball, not in a team anyway. Neither did Jason. They were the same friends I’d always had, the neighborhood kids I’d ridden bikes with when we were nine. I guess it’s kind of weird to still have the same friends as when you were a little kid. It’s not like you’re expected to move on by high school, but you’re definitely allowed. And most sporty kids run in packs, you know? But I had only just got onto the first team, so I was still kind of an outsider there anyway. I knew those guys would like me just fine when I became one of the top players, and that was my goal for this season. As for my real friends, Pete and Jason, I didn’t have to prove anything to them.`,
        questions: [
          {
            stem: "How does Scotty say he felt about the snow at first?",
            options: [
              "He feared it would affect his plans.",
              "He was relieved it was only falling lightly.",
              "He was shocked by its sudden appearance.",
              "He thought it was nothing to worry about.",
              "He was excited about a possible day off."
            ],
            answer: "D",
            explanation:
              "<q>There wasn’t much to it at first, and it had been snowing a lot that month, so I didn’t give it a great deal of thought.</q> A preocupação com o jogo (A) só aparece depois, quando Pete fala em sair mais cedo."
          },
          {
            stem: "What does ‘like that’ in the fourth paragraph refer to?",
            options: [
              "being an average type of person",
              "being part of a competing group",
              "being interested in rock music",
              "wearing carefully chosen clothes",
              "hiding your real personality"
            ],
            answer: "A",
            explanation:
              "<i>Like that</i> retoma a descrição de Pete: <q>Pete blended in… wasn’t super hip or incredibly smart</q> – uma pessoa comum. B é o oposto: sem pessoas como Pete, <q>all you had were competing groups</q>. D também: ele usava <q>whatever clothes he’d been given by his parents</q>."
          },
          {
            stem: "Why does Scotty react differently from Pete to the idea of an early dismissal?",
            options: [
              "He is afraid of missing important lessons.",
              "He does not like spending time at home.",
              "He thinks Pete is too lazy to care.",
              "He is afraid he will miss his first game.",
              "He wants to stay and practise in the gym."
            ],
            answer: "D",
            explanation:
              "<q>What I heard was, ‘Think they’ll cancel the game?’</q> e <q>it meant not collecting the payoff for all those hours of practice</q>. Para Scotty, sair cedo significava perder o primeiro jogo da temporada."
          },
          {
            stem: "What does Scotty suggest about his place on the basketball team?",
            options: [
              "He expected to be made captain soon.",
              "He was unsure whether he wanted to stay.",
              "He had not yet become part of the group.",
              "He was more popular than his teammates.",
              "He felt the coach did not rate him."
            ],
            answer: "C",
            explanation:
              "<q>I had only just got onto the first team, so I was still kind of an outsider there anyway.</q> A e D não têm apoio no texto: ele ainda <b>pretende</b> se tornar <q>one of the top players</q>."
          },
          {
            stem: "What do we learn about Scotty in the final paragraph?",
            options: [
              "He is embarrassed that his friends are not sporty.",
              "He lacks confidence in making new friends.",
              "He values his basketball teammates most.",
              "He plans to leave his old friends behind.",
              "He feels secure about the friendships he has."
            ],
            answer: "E",
            explanation:
              "<q>As for my real friends, Pete and Jason, I didn’t have to prove anything to them.</q> Ele se sente seguro com essas amizades. C está errada: os <i>real friends</i> são Pete e Jason, não o time. D contradiz o texto."
          }
        ]
      }
    ]
  },

  /* =====================================================================
   * 1ª SÉRIE – TIPO C – TURMAS DE
   * ===================================================================== */
  {
    id: "1s-tipo-c-de",
    serie: "1ª Série",
    tipo: "Tipo C",
    turmas: "DE",
    level: "B2",
    etapa: "3ª Etapa",
    topics: ["Five short situations", "The Iron Age Project", "Rising Star"],
    sections: [
      {
        kind: "listening-mc",
        number: 1,
        points: 0.6,
        instructions:
          "You will hear people talking in five different situations. For questions 1–5, select the best answer (A, B, C, D or E).",
        audio: { driveId: "1D5yB_w-VneL6baXOeZW-U7XBsR7jCfCR", local: "1s-de-q1.mp3", duration: "7 min 50 s" },
        source:
          "CAMBRIDGE UNIVERSITY PRESS & ASSESSMENT. B2 First for Schools Lesson Plans: Listening Part 1. Cambridge, 2020.",
        questions: [
          {
            context: "You hear a teacher talking to her class about some project work.",
            stem: "Why is she talking to them?",
            options: [
              "to explain the project’s topic",
              "to set a new deadline",
              "to suggest ways to approach it",
              "to explain how it will be marked",
              "to warn of the effects of late work"
            ],
            answer: "C",
            explanation:
              "Ela dá orientações de como fazer o trabalho: escolher um parceiro, planejar a divisão das tarefas, usar internet, livros e até o museu. A está errada: <q>I’ll give you the outline of the project in a minute</q> (ainda não explicou o tema). B/E: o prazo é só lembrado, não é novo nem há ameaça."
          },
          {
            context: "You hear two friends talking about a film they have just seen.",
            stem: "What do they agree about?",
            options: [
              "how good the effects were",
              "how weak the story was",
              "how misleading the hype was",
              "how exciting some scenes were",
              "whether it is worth seeing again"
            ],
            answer: "D",
            explanation:
              "Ele: <q>the car chases were spectacular – and scary</q>. Ela: <q>I was on the edge of my seat sometimes, no doubt about that.</q> Concordam sobre algumas cenas empolgantes. A: ela discorda (<q>I wouldn’t go that far!</q>). B, C: só ela critica. E: só ele veria de novo."
          },
          {
            context: "You hear a boy talking about a school trip he’s just been on.",
            stem: "What did he think of it?",
            options: [
              "It was surprisingly interesting.",
              "Only parts of it were enjoyable.",
              "It was worse than he expected.",
              "It helped him with his report.",
              "It was better than drama class."
            ],
            answer: "B",
            explanation:
              "O filme <q>wasn’t too bad actually</q> e <q>one or two of the interactive displays were fun</q>, mas as palestras foram chatas: só partes foram boas. C é a armadilha: <q>it sounded pretty dull to me and I wasn’t wrong</q> – foi <b>como</b> ele esperava, não pior. D: <q>it’s not very good</q>. E: <q>I wish I’d gone to drama instead</q>."
          },
          {
            context: "You overhear a girl leaving a voicemail message.",
            stem: "What is she doing?",
            options: [
              "accepting an invitation",
              "cancelling a plan",
              "asking for a lift home",
              "apologising for being late",
              "giving details of a plan"
            ],
            answer: "E",
            explanation:
              "Ela passa detalhes: o jogo começa às seis, podem se encontrar uma hora depois, a irmã vai junto e o pai vai buscá-los de carro. C está errada: o pai <b>já concordou</b> (<q>My Dad’s agreed to pick us up</q>). D: ela se desculpa por não ter encontrado a amiga, não por atraso."
          },
          {
            context: "You hear the weather forecast on a local radio station.",
            stem: "What will the weather be like this afternoon?",
            options: [
              "less cloudy than this morning",
              "warmer than this morning",
              "much the same as this morning",
              "as wet as last night",
              "more humid than this morning"
            ],
            answer: "B",
            explanation:
              "<q>Temperatures have fallen overnight. These will pick up again as the day progresses</q> – vai esquentar. A é o contrário (<q>a build-up of cloud later this afternoon</q>). D: <q>unlikely to see a repeat of last night’s heavy rain</q>. E: <q>we’ve certainly lost that humidity</q>."
          }
        ],
        tapescript: `1 – Teacher: Now, what you’ll have to do is find a partner to work with. It doesn’t matter whether you’ve worked with them before, in fact it might be better if you haven’t! I’ll give you the outline of the project in a minute, but just to say that you’ll need to spend some time on planning – like how you’ll divide up the work between you and so on. You’ll certainly need the internet, and other sources like books and you may even want to take yourselves down to the museum. But don’t forget – the deadline for the completed project is the end of the month, so there’s no time to waste.

2 – M: Awesome film! I’ve never seen effects like those … ever!
F: Well, they were OK – but I wouldn’t go that far! And there wasn’t much of a story, was there? It was just bang crash all the way. I found it a bit samey in places, to be honest.
M: But the car chases were spectacular – and scary – it was worth seeing just for them.
F: I was on the edge of my seat sometimes, no doubt about that. But after all that hype beforehand – and even a couple of awards – weren’t you a bit disappointed with the film as a whole?
M: No way! I could sit through it again anytime, no problem.

3 – Boy: I hadn’t been that keen to go on the trip – it was part of our Geography course and there was a report to do afterwards – it sounded pretty dull to me and I wasn’t wrong. It also meant missing my drama class – which was a real shame. The tour of the museum kicked off with a film about the place, which wasn’t too bad actually, but after that it was downhill all the way. Although one or two of the interactive displays were fun, the talks we had to sit through couldn’t have been less interesting. I’ve finally done the report, but it’s not very good. I wish I’d gone to drama instead!

4 – Girl: Hi – it’s me. Sorry I missed you after school – hope you caught the bus OK! I’ve asked about next Wednesday and the match starts at six, not seven – so we can meet an hour later if you like – we must’ve read the time wrong on the poster. Anyway, I’ll be coming with my sister if that’s OK – she really wants to see it – so if your brother wants to come along as well then that’d be cool. My Dad’s agreed to pick us up in the car afterwards – that’ll save us having to wait for the bus. Call me if there’s a problem – I’ll see you at school tomorrow anyway. Byeeee!

5 – M: So it’s coming up to eleven o’clock and time to go over to Heidi at the weather centre. Good morning Heidi.
F: Hi Tom.
M: Now, lots of local kids are going to the barbecue in the park later today. Is the weather going to be kind to them?
F: Well Tom, after last night’s storms we’ve certainly lost that humidity everyone was complaining about, and temperatures have fallen overnight. These will pick up again as the day progresses, however, and we should be in for a nice evening. Although we will see a build-up of cloud later this afternoon, we’re unlikely to see a repeat of last night’s heavy rain.`
      },
      {
        kind: "listening-gap",
        number: 2,
        points: 0.6,
        heading: "The Iron Age Project",
        instructions:
          "You will hear an interview with a young man called Mark Sharp who took part in ‘The Iron Age Project’, during which he lived as people did in Britain over two thousand years ago. For questions 1–5, complete the sentences with a word or short phrase.",
        audio: { driveId: "1YQ5wTBuW9sh86T0t8NwRIZNOZtGVLKur", local: "1s-de-q2.mp3", duration: "8 min 26 s" },
        source:
          "CAMBRIDGE UNIVERSITY PRESS & ASSESSMENT. B2 First for Schools Lesson Plans: Listening Part 4. Cambridge, 2020.",
        questions: [
          {
            before: "The volunteers lived as people did in the Iron Age for",
            after: "months.",
            answer: "three / 3",
            accept: ["three", "3"],
            reject: ["twenty", "20", "two", "2"],
            explanation:
              "<q>Twenty volunteers lived for three months as people did two thousand years ago.</q> <i>Twenty</i> é o número de voluntários e <i>two thousand</i> é a época – distratores numéricos."
          },
          {
            before: "Mark says there aren’t many",
            after: "on Iron Age building, so even their teachers were guessing.",
            answer: "books",
            accept: ["books"],
            reject: ["boots", "hooks", "looks", "cooks", "book"],
            explanation:
              "<q>There aren’t many books on Iron Age building, and even our teachers were guessing.</q>"
          },
          {
            before: "Mark’s mattress was stuffed with",
            after: ", which made his bed quite comfortable.",
            answer: "feathers",
            accept: ["feathers"],
            reject: ["leathers", "feather", "wool", "straw"],
            explanation:
              "<q>A mattress stuffed with feathers and a nice thick woollen blanket.</q> A lã (<i>wool</i>) era do cobertor e a palha (<i>straw</i>) foi usada nas casas."
          },
          {
            before: "Mark was supposed to fasten his cloak with a",
            after: ".",
            answer: "brooch (aceita-se: broach)",
            accept: ["brooch", "broach"],
            reject: ["belt", "brush"],
            explanation:
              "<q>A cloak which I was supposed to fasten with a brooch.</q> (<i>brooch</i> = broche). O cinto (<i>belt</i>) era da túnica."
          },
          {
            before: "The project made Mark value something he used to take for granted: having time for",
            after: ".",
            answer: "leisure",
            accept: ["leisure", "leisure time"],
            reject: ["pleasure", "measure"],
            explanation:
              "<q>It made me value things I used to take for granted, like having time for leisure.</q>"
          }
        ],
        tapescript: `Int: The Iron Age Project took place last autumn, when twenty volunteers lived for three months as people did two thousand years ago. A television programme was made about their experiences. Mark Sharp, seventeen at the time, was one of those volunteers. Mark, what a great opportunity to go back in time and live in the Iron Age. How did you come to join the project?

Mark: Well, the project was a joint one between the history department of the local university and a TV company. The history professors had some theories they wanted to try out, and the TV company thought it would make a good programme. They wanted everything as authentic as possible and were keen to have people with experience of livestock. One of the things we Iron Agers had to do was look after cows and sheep. I accompanied my mum and dad, who were sheep farmers, and just the kind of people the organisers were looking for.

Int: Did you have to do any training before the project started?

Mark: Yeah, it was pretty intense. We were shown Iron Age ways of growing food, cooking, stuff like that. We also learnt how to make the round houses we lived in, using wood, straw and mud. That was hard work. And it was all a bit experimental. There aren’t many books on Iron Age building, and even our teachers were guessing. And it’s not like you can pay a visit to an Iron Age community and ask them things.

Int: And were the houses comfortable to live in?

Mark: It wasn’t as bad as I’d expected. My bed was quite luxurious, with a mattress stuffed with feathers and a nice thick woollen blanket. And I was so tired at night that I was asleep before I could even think about not having a TV or a computer. The house was always warm too, because we had to keep logs burning all the time. Actually, I could have done without that. The smoke made me cough and my eyes watered.

Int: Oh, I believe you wore some very colourful clothes.

Mark: Yeah, red and blue in stripes and checks. I had some trousers which were quite tight, and a tunic with a belt, and a cloak which I was supposed to fasten with a brooch. I soon lost the hat. Everything was made of wool, and so I sweated a lot when I was working in the sun. A bit unpleasant, really.

Int: So tell me something about the work you did.

Mark: I suppose you could say I was a farm labourer. We had a chief, and he set me my task for the day, though everyone discussed what needed to be done the night before. I did a lot of digging, collecting firewood and anything else that I was told to do. It was all very physical, and my muscles really ached. But being in the open air made a pleasant change from normal student life stuck in a classroom all day.

Int: Did you have any free time?

Mark: Well, sort of. We worked until it got dark, then we ate and went to bed. The diet was a bit monotonous, but there was always plenty of it. I was so hungry after a day’s work I’d have eaten anything. I’d imagined us sitting around the fire after our meal and telling each other stories or reciting poems, but I’m sad to say it never happened. People were too tired, I suppose.

Int: So, was it a valuable experience?

Mark: Yes. I don’t know if it helped the history professors with their theories, or what the TV programme will show. Personally, I don’t believe it’s possible to find out how an Iron Age person really thought. I could never forget I was from the 21st century, even though I was supposedly living like an Iron Age labourer. On the other hand, it made me value things I used to take for granted, like having time for leisure, so I’m grateful for that.

Int: Thanks, Mark. It’s been interesting talking to you.`
      },
      {
        kind: "reading-mc",
        number: 3,
        points: 0.8,
        instructions:
          "Read the newspaper article about a young professional footballer. For questions 1–5, choose the answer (A, B, C, D or E) which you think fits best according to the text.",
        passageTitle: "Rising Star",
        passageSubtitle: "Margaret Garelly goes to meet Duncan Williams, who plays for Chelsea Football Club.",
        source:
          "CAMBRIDGE UNIVERSITY PRESS & ASSESSMENT. B2 First – Sample Paper 1: Reading and Use of English. Cambridge, 2022.",
        passage: `It’s my first time driving to Chelsea’s training ground and I turn off slightly too early at the London University playing fields. Had he accepted football’s rejections in his early teenage years, it is exactly the sort of ground Duncan Williams would have found himself running around on at weekends. At his current age of 18, he would have been a bright first-year undergraduate mixing his academic studies with a bit of football, rugby and cricket, given his early talent in all these sports. However, Duncan undoubtedly took the right path. Instead of studying, he is sitting with his father Gavin in one of the interview rooms at Chelsea’s training base reflecting on Saturday’s match against Manchester City. Such has been his rise to fame that it is with some disbelief that you listen to him describing how his career was nearly all over before it began.

Gavin, himself a fine footballer – a member of the national team in his time – and now a professional coach, sent Duncan to three professional clubs as a 14 year-old, but all three turned him down. ‘I worked with him a lot when he was around 12, and it was clear he had fantastic technique and skill. But then the other boys shot up in height and he didn’t. But I was still upset and surprised that no team seemed to want him, that they couldn’t see what he might develop into in time. When Chelsea accepted him as a junior, it was made clear to him that this was more of a last chance than a new beginning. They told him he had a lot of hard work to do and wasn’t part of their plans. Fortunately, that summer he just grew and grew, and got much stronger as well.’

Duncan takes up the story: ‘The first half of that season I played in the youth team. I got lucky – the first-team manager came to watch us play QPR, and though we lost 3-1, I had a really good game. I moved up to the first team after that performance.’ Gavin points out that it can be beneficial to be smaller and weaker when you are developing – it forces you to learn how to keep the ball better, how to use ‘quick feet’ to get out of tight spaces. ‘A couple of years ago, Duncan would run past an opponent as if he wasn’t there but then the other guy would close in on him. I used to say to him, “Look, if you can do that now, imagine what you’ll be like when you’re 17, 18 and you’re big and quick and they won’t be able to get near you.” If you’re a smaller player, you have to use your brain a lot more.’

Not every kid gets advice from an ex-England player over dinner, nor their own private training sessions. Now Duncan is following in Gavin’s footsteps. He has joined a national scheme where people like him give advice to ambitious young teenagers who are hoping to become professionals. He is an old head on young shoulders. Yet he’s also like a young kid in his enthusiasm. And fame has clearly not gone to his head; it would be hard to meet a more likeable, humble young man. So will he get to play for the national team? ‘One day I’d love to, but when that is, is for somebody else to decide.’ The way he is playing, that won’t be long.`,
        questions: [
          {
            stem: "What does the writer suggest in the first paragraph?",
            options: [
              "Duncan still hopes to go to university.",
              "Duncan might never have become a professional.",
              "Duncan regrets not going to university.",
              "Duncan was only talented at football.",
              "Duncan’s father wanted him to study."
            ],
            answer: "B",
            explanation:
              "<q>Had he accepted football’s rejections…</q> e <q>his career was nearly all over before it began</q>: ele quase não virou profissional. C está errada: <q>Duncan undoubtedly took the right path</q>. D também: ele tinha talento para <q>football, rugby and cricket</q>."
          },
          {
            stem: "Why was Gavin upset when the three clubs turned Duncan down?",
            options: [
              "They had misjudged Duncan’s technique.",
              "They had promised Duncan a place.",
              "Duncan had already agreed to join one.",
              "They did not recognise his potential.",
              "They thought he was too young."
            ],
            answer: "D",
            explanation:
              "<q>I was still upset and surprised that no team seemed to want him, that they couldn’t see what he might develop into in time.</q> A está errada: a técnica era reconhecida (<q>fantastic technique and skill</q>); o problema era a altura, não a idade (E)."
          },
          {
            stem: "When Chelsea accepted Duncan as a junior, the club",
            options: [
              "was sure he would become a star.",
              "wanted him in the first team at once.",
              "asked his father to coach him.",
              "expected him to grow quickly.",
              "saw it as his final opportunity."
            ],
            answer: "E",
            explanation:
              "<q>It was made clear to him that this was more of a last chance than a new beginning.</q> A/B estão erradas: <q>wasn’t part of their plans</q>. D: o crescimento veio por sorte (<q>Fortunately, that summer he just grew</q>), não era esperado."
          },
          {
            stem: "According to Gavin, being smaller as a young player",
            options: [
              "made Duncan a more thoughtful player.",
              "helped Duncan to win more tackles.",
              "made Duncan play more aggressively.",
              "stopped Duncan from keeping the ball.",
              "caused Duncan to lose confidence."
            ],
            answer: "A",
            explanation:
              "<q>If you’re a smaller player, you have to use your brain a lot more.</q> D é o contrário: ser menor <q>forces you to learn how to keep the ball better</q>."
          },
          {
            stem: "What does the writer suggest about Duncan in the final paragraph?",
            options: [
              "He is confident he will play for England soon.",
              "He enjoys coaching more than playing.",
              "He is mature but still enthusiastic.",
              "He has been chosen to lead a national scheme.",
              "He finds it hard to cope with fame."
            ],
            answer: "C",
            explanation:
              "<q>He is an old head on young shoulders. Yet he’s also like a young kid in his enthusiasm.</q> A está errada: <q>when that is, is for somebody else to decide</q>. D: ele <b>participa</b> do programa, não o lidera. E: <q>fame has clearly not gone to his head</q>."
          }
        ]
      }
    ]
  },

  /* =====================================================================
   * 2ª SÉRIE – TIPO A – TURMAS CDE
   * ===================================================================== */
  {
    id: "2s-tipo-a-cde",
    serie: "2ª Série",
    tipo: "Tipo A",
    turmas: "CDE",
    level: "B2",
    etapa: "3ª Etapa",
    topics: ["Art gallery job", "Vacation job in Australia", "Caitlin and the island"],
    sections: [
      {
        kind: "listening-mc",
        number: 1,
        points: 0.6,
        instructions:
          "You will hear part of a radio interview with a woman called Rachel Reed, who works in a commercial art gallery, a shop which sells works of art. For questions 1–5, select the best answer (A, B, C, D or E).",
        audio: { driveId: "1JrrwDwMATHUjrWeqloS9jgL8tG2E8j4d", local: "2s-cde-q1.mp3", duration: "8 min 42 s" },
        source:
          "CAMBRIDGE UNIVERSITY PRESS & ASSESSMENT. B2 First – Sample Paper 1: Listening. Cambridge, 2022.",
        questions: [
          {
            stem: "What does Rachel say about her job title?",
            options: [
              "It makes her seem too important.",
              "It misleads people about her work.",
              "It changes with each exhibition.",
              "It sounds rather informal.",
              "It fits most of what she does."
            ],
            answer: "E",
            explanation:
              "<q>Mine is marketing manager – although I do a lot of other things too, it does describe the majority of what I do.</q> B é o contrário. C: ela diz que dá para <i>inventar</i> o cargo, mas não que ele muda a cada exposição."
          },
          {
            stem: "What is the most common reason for the gallery not exhibiting an artist’s work?",
            options: [
              "the style of the work",
              "the subject of the work",
              "the quality of the work",
              "the manager’s personal taste",
              "the price of the work"
            ],
            answer: "C",
            explanation:
              "<q>It might be the style, or sometimes the subject matter… but more often than not, it’s just that they’re not of the required standard.</q> <i>More often than not</i> indica o motivo mais comum: a qualidade. Estilo e tema (A/B) são citados como motivos menos frequentes."
          },
          {
            stem: "When can phone calls from artists be difficult for Rachel?",
            options: [
              "when they ask to meet the manager",
              "when payments are late",
              "when their work doesn’t sell",
              "when their work is rejected",
              "when they ask about exhibition dates"
            ],
            answer: "D",
            explanation:
              "<q>I send letters explaining why we can’t show their work – some of them phone up to argue about it – I find those calls very hard to deal with.</q> B está errada: sobre ligações a respeito de dinheiro, ela diz <q>I don’t mind those so much</q>."
          },
          {
            stem: "Why does Rachel include a commentary in the catalogue?",
            options: [
              "to explain how prices are decided",
              "to give background on the artist",
              "to quote reviews by expert critics",
              "to advertise the gallery’s services",
              "to encourage sales over the phone"
            ],
            answer: "B",
            explanation:
              "<q>I try to find out what has influenced them, where they learned to paint, what the subject matter represents…</q> C está errada: <q>I try to avoid quoting from positive reviews</q>. D também: <q>it’s not meant to be advertising</q>."
          },
          {
            stem: "What does Rachel say is the best part of her job?",
            options: [
              "never knowing what a day will bring",
              "working with really nice people",
              "being surrounded by works of art",
              "writing and researching catalogues",
              "working without an assistant"
            ],
            answer: "A",
            explanation:
              "<q>The really rewarding thing for me is that you never know how a day is going to go.</q> B e C aparecem depois como <q>the added bonus</q> – vantagens extras, não a melhor parte."
          }
        ],
        tapescript: `Int: This evening in our series ‘Careers with a Difference’ our guest is Rachel Reed who works for a small commercial art gallery. Rachel welcome.

RR: Hello.

Int: Rachel, what exactly do you do?

RR: Well, there’s two great things about working for a really small company. Firstly, you get to do a bit of everything. The other is that you can practically invent your job title. Mine is marketing manager – although I do a lot of other things too, it does describe the majority of what I do.

Int: So, tell us about your day.

RR: Well, it all starts with the huge pile of post we get. We often get artists sending in photographs of their work to see if we’d be interested in exhibiting it. I learned very early on how to differentiate between the ‘possibles’ and those which are unsuitable.

Int: But how do you tell?

RR: It might be the style, or sometimes the subject matter is just not going to look right in our gallery, but more often than not, it’s just that they’re not of the required standard. The ‘possibles’ I pass on to the gallery manager who makes the final decision.

Int: So you have quite a lot of contact with artists?

RR: Yes. Sometimes I spend nearly all day on the phone and about fifty percent of the time it’s artists. I send letters explaining why we can’t show their work – some of them phone up to argue about it – I find those calls very hard to deal with. Artists we do exhibit also phone to find out if we’ve managed to sell anything and, if we have, when the money will be coming through. I don’t mind those so much. Most other calls are from clients. We have a new artist exhibiting here every two to four weeks and before the show takes place, we send out a catalogue to the clients on our database.

Int: Obviously the catalogue’s illustrated?

RR: Oh yes, and as soon as the catalogue goes out, we start getting phone calls because people see something they like and want to reserve it. Sometimes they even buy things over the phone. The catalogue also contains a commentary about the artist, which I have to write and research. I try to find out what has influenced them, where they learned to paint, what the subject matter represents, that sort of thing, but I try to avoid quoting from positive reviews of their work; it’s not meant to be advertising as such.

Int: So your job is not all administrative?

RR: Compared to a typical office, that side of it’s quite minimal, that’s why I can cope without an assistant. There are systems in place to deal with routine jobs. For instance, I don’t have to send out the catalogues – the company which prints them also prints the envelopes and posts them. Another company takes care of the food and drinks when we have the opening of a new exhibition.

Int: And are you involved in other aspects of the business?

RR: Yes. We also offer a consultancy service for large companies that want to display works of art in their offices. I phone round companies, explain what we do and, if they’re interested, make an appointment for the gallery manager to go and see them. It’s interesting, the companies tend to go much more for modern or abstract art than people coming to the gallery.

Int: And the best part of the job for you?

RR: The really rewarding thing for me is that you never know how a day is going to go. Some days it’ll be really quiet, other days it’s really busy and you don’t know what you’re going to have to cope with. And there’s the added bonus of working with really nice people and of course I have the pleasure of spending my days surrounded by beautiful works of art, so I can’t complain.

Int: Thank you Rachel.`
      },
      {
        kind: "listening-gap",
        number: 2,
        points: 0.6,
        heading: "My Vacation Job in Australia",
        instructions:
          "You will hear a man called Chris Graham talking to a group of students about a vacation job he had in Australia. For questions 1–5, complete the sentences with a word or short phrase.",
        audio: { driveId: "1CB3M9dmLQtD3U1aGvIMDFeyuH640zU3x", local: "2s-cde-q2.mp3", duration: "8 min 16 s" },
        source:
          "CAMBRIDGE UNIVERSITY PRESS & ASSESSMENT. B2 First – Sample Paper 2: Listening. Cambridge, 2022.",
        questions: [
          {
            before: "For most of the time he was working for the travel company, Chris lived in a",
            after: "on the edge of the town.",
            answer: "caravan",
            accept: ["caravan"],
            reject: ["hotel", "hotel room", "cabin", "caravans"],
            explanation:
              "<q>At first, I was given a room in a hotel in town but I found that I felt quite lonely so I moved into a caravan on the outskirts.</q> O hotel foi só no começo – distrator."
          },
          {
            before: "Chris used to pick the tourists up from their hotels at around",
            after: "in the morning.",
            answer: "5 / five / 5 a.m.",
            accept: ["5", "five", "5am", "5 am", "5:00", "5.00", "5:00 am", "5.00 am", "five o'clock", "five oclock", "5 o'clock"],
            pattern: "^(at\\s+)?(around\\s+)?(5|five)((\\s*[:.]\\s*00)|(\\s+o\\s*'?\\s*clock))?(\\s*a\\.?\\s*m\\.?)?$",
            reject: ["2", "two", "2 pm", "six", "6"],
            explanation:
              "<q>I used to pick them up from their hotels around 5.00 a.m.</q> <i>Two in the afternoon</i> é o horário do segundo grupo."
          },
          {
            before: "Many of the tourists were unaware of the need to keep their",
            after: "covered up when they were in the sun.",
            answer: "shoulders",
            accept: ["shoulders"],
            reject: ["head", "neck", "heads", "necks", "soldiers", "shoulder"],
            explanation:
              "<q>They knew, of course, about covering their head and neck with a hat but often left their shoulders uncovered.</q> Cabeça e pescoço eles <b>já sabiam</b> que deviam cobrir."
          },
          {
            before: "The tourists particularly wanted to know how to tell the difference between the",
            after: "of the wild animals.",
            answer: "tracks",
            accept: ["tracks", "animal tracks", "footprints"],
            reject: ["trucks", "tricks", "track", "plants"],
            explanation:
              "<q>The tourists were especially keen to find out how to distinguish the tracks of kangaroos from wallabies and wild dogs.</q> (<i>tracks</i> = pegadas/rastros). As plantas foram assunto do grupo da tarde."
          },
          {
            before: "Chris has mixed feelings about the local government’s plan to build a bigger",
            after: ".",
            answer: "airport",
            accept: ["airport"],
            reject: ["railway station", "station", "airports"],
            explanation:
              "<q>There’s now an airport but the local government is keen to get one built which can take more flights… I’m not sure about that… but it would be good for the local economy.</q> A estação de trem e o ônibus são distratores."
          }
        ],
        tapescript: `Hello everyone. My name is Chris Graham and I spent my last vacation working in Australia. The place I was in is a popular tourist spot so there are lots of student jobs advertised in the newspaper – from hotel work to being a tour guide. I saw my job, for a bus driver, on the internet, and so I applied. I’d recommend you do that too. The whole idea of getting to know another country really appealed to me and I’m really pleased I had the opportunity to go.

I worked for a company which tries to help tourists understand what life used to be like before Europeans arrived – a time before clothes, cars and electricity. Many of the local people, the Aborigines, work for the company. Studying tourism at university wasn’t essential to get the job – in fact, my subject’s history. What I did do was a short training course when I first arrived, though, to learn about the local plants and animals.

At first, I was given a room in a hotel in town but I found that I felt quite lonely so I moved into a caravan on the outskirts. Lots of other staff lived on the site and I got to meet lots of the local people there too. Everyone was really friendly and, as there wasn’t a cinema or restaurant nearby, people frequently had a party on Saturday night and I was always invited.

I worked six days a week, and I had to get up really early in the morning when most people, and even the birds and animals, are asleep. This is so the tourists can get to take photos of the sunrise. I used to pick them up from their hotels around 5.00 a.m. and then head out of town and into the desert. The tourists were from all over the world and often had no experience of the heat. They knew, of course, about covering their head and neck with a hat but often left their shoulders uncovered, which wasn’t very sensible, especially if they hadn’t been in the country for long and weren’t used to the sun.

After we had been into the desert, I would take the tourists to the local cultural centre, where they had the opportunity to ask questions. The tourists were especially keen to find out how to distinguish the tracks of kangaroos from wallabies and wild dogs. After the morning session I usually went back home, had a shower and a rest, then started again around two in the afternoon. I used to take the afternoon group to a water hole, where they were shown which plants could be eaten and which were also used to make weapons for hunting.

At one time, there were very few tourists in the particular area I worked in, because you needed to get a coach from the small railway station in the nearest large town, a good 200 kilometres away. There’s now an airport but the local government is keen to get one built which can take more flights, especially from abroad. I’m not sure about that, as I think it’s busy enough as it is, but it would be good for the local economy, no doubt about it.

Anyway, I really recommend working in Australia during your vacation. The busy tourist season in the area where I worked is from May to October, so you need to make sure your application is in by the January of the year you are hoping to work. You might not hear until March as it takes a while to process the applications and get references, but make sure you don’t leave it too late.`
      },
      {
        kind: "reading-mc",
        number: 3,
        points: 0.8,
        instructions:
          "Read the extract from a novel in which a young woman called Caitlin talks about her life on an island. For questions 1–5, choose the answer (A, B, C, D or E) which you think fits best according to the text.",
        passageTitle: "",
        passageSubtitle: "",
        source:
          "CAMBRIDGE UNIVERSITY PRESS & ASSESSMENT. B2 First – Sample Paper 1: Reading and Use of English, Part 5. Cambridge, 2022.",
        passage: `We live on the island of Hale. It’s about four kilometres long and two kilometres wide at its broadest point, and it’s joined to the mainland by a causeway called the Stand – a narrow road built across the mouth of the river which separates us from the rest of the country. Most of the time you wouldn’t know we’re on an island because the river mouth between us and the mainland is just a vast stretch of tall grasses and brown mud. But when there’s a high tide and the water rises a half a metre or so above the road and nothing can pass until the tide goes out again a few hours later, then you know it’s an island.

We were on our way back from the mainland. My older brother, Dominic, had just finished his first year at university in a town 150 km away. Dominic’s train was due in at five and he’d asked for a lift back from the station. Now, Dad normally hates being disturbed when he’s writing (which is just about all the time), and he also hates having to go anywhere, but despite the typical sighs and moans – why can’t he get a taxi? what’s wrong with the bus? – I could tell by the sparkle in his eyes that he was really looking forward to seeing Dominic.

So, anyway, Dad and I had driven to the mainland and picked up Dominic from the station. He had been talking non-stop from the moment he’d slung his rucksack in the boot and got in the car. University this, university that, writers, books, parties, people, money, gigs… And when I say talking, I don’t mean talking as in having a conversation, I mean talking as in jabbering like a mad thing. I didn’t like it… the way he spoke and waved his hands around as if he was some kind of intellectual or something. It was embarrassing. It made me feel uncomfortable – that kind of discomfort you feel when someone you like, someone close to you, suddenly starts acting like a complete idiot. And I didn’t like the way he was ignoring me, either. For all the attention I was getting I might as well not have been there. I felt a stranger in my own car.

As we approached the island on that Friday afternoon, the tide was low and the Stand welcomed us home, stretched out before us, clear and dry, beautifully hazy in the heat – a raised strip of grey concrete bound by white railings and a low footpath on either side, with rough cobbled banks leading down to the water. Beyond the railings, the water was glinting with that wonderful silver light we sometimes get here in the late afternoon which lazes through to the early evening.

We were about halfway across when I saw the boy. My first thought was how odd it was to see someone walking on the Stand. You don’t often see people walking around here. Between Hale and Moulton (the nearest town about thirty kilometres away on the mainland), there’s nothing but small cottages, farmland, heathland and a couple of hills. So islanders don’t walk because of that. If they’re going to Moulton they tend to take the bus. So the only pedestrians you’re likely to see around here are walkers or bird-watchers. But even from a distance I could tell that the figure ahead didn’t fit into either of these categories. I wasn’t sure how I knew, I just did.

As we drew closer, he became clearer. He was actually a young man rather than a boy. Although he was on the small side, he wasn’t as slight as I’d first thought. He wasn’t exactly muscular, but he wasn’t weedy-looking either. It’s hard to explain. There was a sense of strength about him, a graceful strength that showed in his balance, the way he held himself, the way he walked…`,
        questions: [
          {
            stem: "In the first paragraph, what is Caitlin’s main point about the island?",
            options: [
              "It is linked to the mainland by several roads.",
              "It is much smaller than it looks from the mainland.",
              "It can be dangerous to cross from the mainland.",
              "It is a difficult place for people to live in.",
              "It is only completely cut off at certain times."
            ],
            answer: "E",
            explanation:
              "<q>Most of the time you wouldn’t know we’re on an island… But when there’s a high tide… nothing can pass… then you know it’s an island.</q> Só fica isolada na maré alta. A está errada: há <b>uma</b> estrada (<q>a causeway called the Stand</q>)."
          },
          {
            stem: "What does Caitlin suggest about her father?",
            options: [
              "His writing stops him doing things he wants to with his family.",
              "His first reaction to his son’s request is unusual.",
              "He easily hides his true feelings from his daughter.",
              "His son’s arrival is one event he will stop work for.",
              "He shows little interest in seeing his son again."
            ],
            answer: "D",
            explanation:
              "Ele odeia ser interrompido quando escreve, mas <q>I could tell by the sparkle in his eyes that he was really looking forward to seeing Dominic.</q> B está errada: as reclamações são <q>typical</q>. C: ela percebeu o que ele sentia (<q>I could tell</q>). E é o contrário."
          },
          {
            stem: "Caitlin emphasises her feelings of discomfort because she",
            options: [
              "can’t follow what her brother is talking about.",
              "is confused about why she can no longer relate to her brother.",
              "is upset by the unexpected change in her brother’s behaviour.",
              "feels foolish that her brother’s attention matters so much.",
              "is annoyed that her father takes her brother’s side."
            ],
            answer: "C",
            explanation:
              "<q>That kind of discomfort you feel when someone you like, someone close to you, suddenly starts acting like a complete idiot.</q> O incômodo vem da mudança repentina no comportamento do irmão. A: ela entende o que ele diz; o problema é o jeito. E: o pai nem é mencionado nesse trecho."
          },
          {
            stem: "In ‘because of that’ in the fifth paragraph, ‘that’ refers to the fact that",
            options: [
              "locals think it is odd to walk anywhere.",
              "it is easier to take the bus than to walk.",
              "people have everything they need on the island.",
              "the paths on the island are unsafe.",
              "there is nowhere in particular to walk to."
            ],
            answer: "E",
            explanation:
              "A frase anterior explica o <i>that</i>: <q>there’s nothing but small cottages, farmland, heathland and a couple of hills.</q> Ou seja, não há para onde ir a pé. B é consequência (vão de ônibus para Moulton), não a referência de <i>that</i>."
          },
          {
            stem: "What do we learn about Caitlin’s reactions to the boy?",
            options: [
              "She thought he looked lost and confused.",
              "She realised her first impression of him was wrong.",
              "She was able to think of a reason for him being there.",
              "She thought she had seen him somewhere before.",
              "She felt rather frightened when she saw him."
            ],
            answer: "B",
            explanation:
              "<q>He was actually a young man rather than a boy… he wasn’t as slight as I’d first thought.</q> A primeira impressão estava errada. C é o contrário: <q>I wasn’t sure how I knew, I just did</q>. E: ela descreve uma <q>graceful strength</q>, sem medo."
          }
        ]
      }
    ]
  },

  /* =====================================================================
   * 2ª SÉRIE – TIPO B – TURMAS AB
   * ===================================================================== */
  {
    id: "2s-tipo-b-ab",
    serie: "2ª Série",
    tipo: "Tipo B",
    turmas: "AB",
    level: "B2",
    etapa: "3ª Etapa",
    topics: ["The Power of Practice", "Spectacled bears", "Kombat Kate"],
    sections: [
      {
        kind: "listening-mc",
        number: 1,
        points: 0.6,
        instructions:
          "You will hear part of a radio interview with an author called Mickey Smith, who is talking about becoming excellent at sport. For questions 1–5, select the best answer (A, B, C, D or E).",
        audio: { driveId: "1S02sfpa3x89IUlSN9jI1w4yV7195H-Zo", local: "2s-ab-q1.mp3", duration: "8 min 50 s" },
        source:
          "CAMBRIDGE UNIVERSITY PRESS & ASSESSMENT. B2 First – Sample Paper 2: Listening. Cambridge, 2022.",
        questions: [
          {
            stem: "Mickey believes that outstanding football players",
            options: [
              "have more natural talent than others.",
              "are faster runners than other players.",
              "are aware of other players’ positions.",
              "concentrate better than other players.",
              "take more risks than other players."
            ],
            answer: "C",
            explanation:
              "<q>The way a great footballer understands where his teammates are around him on the field is what helps him score goals, rather than speed.</q> B é descartada por <i>rather than speed</i>. A contradiz a tese dele: talento natural não existe."
          },
          {
            stem: "How did Mickey feel when he first became successful at gymnastics?",
            options: [
              "aware that others lacked the same chances",
              "grateful to have such a good coach",
              "convinced he had a natural gift for it",
              "proud of all the hard work he had done",
              "lucky to have a good training routine"
            ],
            answer: "C",
            explanation:
              "<q>My initial reaction when I got to the top was, ‘Wow’, I must have been born with this ability.</q> A pergunta é sobre a reação <b>inicial</b>. O reconhecimento do técnico e do clube (B/E) veio depois: <q>What I now understand is…</q>"
          },
          {
            stem: "Mickey says that the motivation to continue training for long periods of time",
            options: [
              "comes mainly from good coaching.",
              "appears early in future experts.",
              "doesn’t come naturally to most people.",
              "is linked to physical fitness.",
              "depends on your beliefs about ability."
            ],
            answer: "E",
            explanation:
              "<q>If you believe being good at something is down to natural ability, when you fail… you’re more likely to give up. If you believe excellence is about effort… you’re going to see it as an opportunity to grow.</q> A motivação depende daquilo em que você acredita."
          },
          {
            stem: "Mickey says that coaches working with young people need to understand that",
            options: [
              "children think differently from adults.",
              "young people are naturally driven to succeed.",
              "physical fitness should come first.",
              "young people’s mindset matters more than their skills.",
              "children need to compete from an early age."
            ],
            answer: "D",
            explanation:
              "<q>Coaching young people is more about psychology than it is about the technical side of things.</q> A é o contrário: <q>little difference from how you encourage adults really</q>. B: o técnico precisa <b>criar</b> esse desejo."
          },
          {
            stem: "According to Mickey, what can cause some sports people to fail at important events?",
            options: [
              "They haven’t trained enough.",
              "They become too aware of their actions.",
              "They lack experience of pressure.",
              "They are tired from too much training.",
              "They underestimate their rivals."
            ],
            answer: "B",
            explanation:
              "<q>When you choke you become so anxious that instead of delivering your skill automatically, you become conscious of what you’re doing.</q> A está errada: acontece <q>no matter how many times they’ve done it before</q>."
          }
        ],
        tapescript: `F: Today on the programme we have Mickey Smith, author of the book The Power of Practice. Mickey, in your book you talk about what makes a champion sportsperson. Your argument is that talent – a natural aptitude or skill – doesn’t exist. Right?

M: Right. I know that’s controversial because it’s thought that people are born with natural abilities. I have my critics but the evidence from research I’ve done backs up my argument. If you look at anyone who’s reached a high level in any complex task, you’ll find they’ve spent many years building up to it. This has started other people thinking and doing their own research. I’ve no doubt they’ll reach the same conclusions I have.

F: What about physical abilities like speed? Isn’t that what makes one footballer better than another, for example?

M: There are physical issues that are significant in some activities. However, in virtually all complex tasks the limiting factor is a mental thing. People don’t become the greatest footballers because they move around the pitch quickly. While he may not realise it, the way a great footballer understands where his teammates are around him on the field is what helps him score goals, rather than speed.

F: In your book you also talk about geographical areas where lots of people become experts in the same activity. Gymnastics, for example.

M: The town I grew up in produced the top gymnasts of my generation, myself included. My initial reaction when I got to the top was, ‘Wow’, I must have been born with this ability to do gymnastics. But what about the others? What I now understand is that this excellence was down to having access to a fantastic coach and a 7-day-a-week gymnastics club, where we transformed ourselves from ordinary to extraordinary. Opportunity’s another factor determining success.

F: Your argument is that to become excellent you have to practise for thousands of hours. That’s a lot of training.

M: That’s right. How successful you are is down to how long you’re prepared to work. Evidence suggests those who make it believe excellence relies on practice. If you believe being good at something is down to natural ability, when you fail, you’ll think you don’t have enough of it – and you’re more likely to give up. If you believe excellence is about effort, when you fail you’re going to see it as an opportunity to grow.

F: What approach should coaches take when training youngsters in sport?

M: The way to go about it is to ensure the child enjoys what they’re learning – that it becomes an internal desire to progress. Coaching young people is more about psychology than it is about the technical side of things – it’s making the young performer really care about where they’re going, motivating them in the right way, that will enable them to actually get there – little difference from how you encourage adults really.

F: Why don’t more people who play sport try harder to improve?

M: Well, they see sports stars and assume they were born brilliant, but there’s no evidence to suggest that. You just don’t see the painstaking process it took to get them there when they’re winning games on your TV screen. If you did, their brilliance wouldn’t seem so miraculous. The illusion is to think they got there quickly and think ‘Oh my goodness, I could never get up that slope.’

F: Given everything you’ve said about top performers, why do they sometimes fail at crucial moments? That’s called ‘choking’, right?

M: Yes. It’s to do with the expectation to succeed, no matter how many times they’ve done it before. When you first practise a skill you have to exert conscious control over it. When you become proficient you’re able to do it subconsciously. When you choke you become so anxious that instead of delivering your skill automatically, you become conscious of what you’re doing and it’s like you’ve never done it before.`
      },
      {
        kind: "listening-gap",
        number: 2,
        points: 0.6,
        heading: "Spectacled Bears",
        instructions:
          "You will hear a woman called Angela Thomas, who works for a wildlife organisation, talking about the spectacled bear. For questions 1–5, complete the sentences with a word or short phrase.",
        audio: { driveId: "1DWX-0CcZ-7g9L1-qdfAs4nSYi3t3Tl_j", local: "2s-ab-q2.mp3", duration: "9 min 10 s" },
        source:
          "CAMBRIDGE UNIVERSITY PRESS & ASSESSMENT. B2 First – Sample Paper 1: Listening. Cambridge, 2022.",
        questions: [
          {
            before: "Angela mentions that the bear’s markings can be found on its",
            after: "as well as its eyes and cheeks.",
            answer: "chest",
            accept: ["chest"],
            reject: ["chess", "cheeks", "cheek", "neck", "chests"],
            explanation:
              "<q>They can extend as far as the bear’s cheeks or even chest.</q> Olhos e bochechas já estão na frase – a resposta é o que falta: <i>chest</i> (peito)."
          },
          {
            before: "Experts estimate that only about",
            after: "spectacled bears are left in the wild.",
            answer: "2,400",
            accept: ["2400", "2,400", "2.400", "two thousand four hundred", "two thousand and four hundred"],
            reject: ["4000", "4,000", "2000", "400"],
            explanation:
              "<q>It’s been estimated that there are only about 2,400 still around.</q> <i>4,000</i> é a altitude (em metros) de alguns habitats – distrator."
          },
          {
            before: "Bears sometimes sit up a tree for days on a",
            after: "they have made, which Angela finds funny.",
            answer: "platform",
            accept: ["platform"],
            reject: ["nest", "branch", "platforms"],
            explanation:
              "<q>They’ve been known to sit up in a tree for days – they make a platform.</q>"
          },
          {
            before: "When they do eat meat, bears prefer",
            after: "to birds or insects.",
            answer: "(small) mice",
            accept: ["mice", "small mice"],
            reject: ["nice", "rice", "mouse", "birds", "insects"],
            explanation:
              "<q>Something like birds or insects though they like small mice best if they can get them!</q> Aves e insetos já estão na frase como comparação."
          },
          {
            before: "A man who studied the bears in Peru has published a very funny",
            after: "about his time there.",
            answer: "diary",
            accept: ["diary"],
            reject: ["dairy", "series", "book", "diaries"],
            explanation:
              "<q>He’s spent a long time in Peru studying them, and has published a very funny diary of his time there.</q> Atenção à grafia: <i>diary</i> (diário) ≠ <i>dairy</i> (laticínio). A <i>television series</i> é um distrator."
          }
        ],
        tapescript: `Thanks for inviting me tonight. As you know, my main interest is in conservation and I’m lucky enough to work with lots of different organisations looking after animals both in captivity and in the wild. I’d been fascinated by all kinds of bears for a long time before I started working in this field. But it was the spectacled bear that really attracted me – some people find it appealing because of its size and shape, and it’s less well known than other types of bear, but for me I thought it was such a great name! It comes from the patches of yellowish fur around the bear’s eyes which grow in a sort of circle shape, like glasses, although these golden markings vary greatly from one bear to another and may not be limited to the eyes – they can extend as far as the bear’s cheeks or even chest.

I’d like to explain what we know about this bear, and why I find it so fascinating. It’s the only survivor of a type of bear that once ranged across America during the last Ice Age. We thought that it was only found in certain places in Venezuela and Chile, but I was thrilled to read some reports that suggested it might also be living in northern parts of Argentina and eastern Panama. It’s quite difficult to find spectacled bears in the wild because they are quite shy animals, and tend to live in a wide variety of habitats, which can range from dry coastal deserts to high mountain areas above 4,000 metres. They are most commonly found in forests, though. Being such timid animals they tend to come out at night, which is another thing that makes them difficult to see, though, like me, you may be surprised to learn that they don’t sleep all through the winter as many other types of bear do.

We’re not sure about the actual number of spectacled bears that remain in the wild, but it’s been estimated that there are only about 2,400 still around. The bears are endangered not so much because they are hunted by other animals, but what I find really sad is the fact that humans destroy their habitat. Spectacled bears are quite small compared with other bears, and of course they do have other enemies – these mostly include mountain lions and jaguars – but they remain a smaller threat.

The bears are primarily vegetarian, and their normal diet is tree bark and berries. On rare occasions though they eat honey, which I thought was just something in children’s books. I was interested to find that they are incredibly good climbers, and one thing I found really funny is that they’ve been known to sit up in a tree for days – they make a platform – why? – I couldn’t guess, but they’re waiting for fruit to ripen so they can eat it! It’s quite surprising that although they rarely eat meat they have extremely strong jaws and wide, flat teeth. Very occasionally they do eat meat – something like birds or insects though they like small mice best if they can get them!

We’re really trying to make people more aware of the bears, and we’ve made a television series about one man’s efforts to make people understand the dangers facing the animals. He’s spent a long time in Peru studying them, and has published a very funny diary of his time there. I hope everyone will read it, and support our efforts to help these fascinating creatures! So are there any questions?`
      },
      {
        kind: "reading-mc",
        number: 3,
        points: 0.8,
        instructions:
          "Read the article about a woman who trains actors in fighting skills. For questions 1–5, choose the answer (A, B, C, D or E) which you think fits best according to the text.",
        passageTitle: "Kombat Kate",
        passageSubtitle: "James Stanton meets ‘Kombat Kate’ Waters, who trains theatre actors in how to ‘fight’ on stage.",
        source:
          "CAMBRIDGE UNIVERSITY PRESS & ASSESSMENT. B2 First – Sample Paper 2: Reading and Use of English, Part 5. Cambridge, 2022.",
        passage: `There must be few occasions when it would be really rude to refuse an invitation to head-butt someone you’ve just met! But I’m in one of those right now. I’m in a rehearsal room in a theatre with a group of actors, facing up to stage fighting director Kate Waters. I’ve already dragged her around the room and slapped her on the arm. Now she wants me to head-butt her. But fear not, this is all strictly pretend!

‘Imagine there’s a tin can on my shoulder,’ she says. ‘Now try to knock it off.’ I lower my head as instructed, then lift it sharply, aiming for the imaginary can, hoping desperately that I don’t miscalculate the angle and end up doing damage to her face. To my amazement, I get it right. ‘That was good,’ says Waters. ‘Now maybe try it again without smiling.’

Waters, known in the industry as Kombat Kate, is showing me how actors fight each other without getting hurt, and that includes sword-fighting. (She inspires fierce devotion: when I tweet that I’m meeting Waters, one actress friend responds: ‘She’s amazing. She taught me how to be a secret service agent in two days.’)

Perhaps the most famous play Kate has worked on recently was called Noises Off. She taught the cast how to fall down stairs without breaking any bones. One of the fight scenes is fairly close, Kate tells me, to the one we’re trying out now. ‘I’ve just slowed it down a bit,’ she says tactfully, before inviting me to throw her against the wall. I obey, making sure I let go of her quickly, so she can control her own movement. Push your opponent too hard, and they will hit the wall for real. I watch her hit the wall before falling to the ground. She’s fine, of course. ‘That’s my party trick,’ she says with a grin. ‘Works every time.’

Once the lesson is over Kate tells me how she became one of only two women on the official register of stage fight directors. Already a keen martial arts expert from childhood, Kate did drama at university, and one module of her course introduced her to stage combat. When she made enquiries about the possibility of teaching it as a career, she was told about the register and the qualifications she’d need to be accepted onto it. It was no small order: as well as a certificate in advanced stage combat, she would need a black belt in karate and proficiency in fencing, a sport she’d never tried before.

But she rose to the challenge and taught the subject for several years at a drama college before going freelance and becoming a fight advisor for the theatrical world. The play she’s working on is Shakespeare’s Richard III. This involves a famous sword fight. With no instructions left by the great playwright other than – Enter Richard and Richmond: they fight, Richard dies – the style and sequence of the fight is down to Kate and the actors.

‘I try to get as much information as possible about what a fight would have been like in a particular period,’ Kate explains. ‘But because what I’m eventually doing is telling a dramatic story, not all of it is useful. The scene has to be exciting and do something for the audience.’

Ultimately, of course, a stage fight is all smoke and mirrors. In our lesson, Kate shows me how an actor will stand with his or her back to the audience ahead of a choreographed slap or punch. When the slap comes it makes contact not with skin but with air: the actor whacks his chest or leg to make the sound of the slap.

In the rehearsal room, I can’t resist asking Kate how she thinks she would fare in a real fight. Would she give her attacker a hard time? She laughs, ‘Oh, I’d be awful,’ she says. ‘I only know how to fake it.’ I can’t help thinking, however, that she’s just being rather modest.`,
        questions: [
          {
            stem: "In the first paragraph, the writer is aware of",
            options: [
              "a critical attitude from Kate.",
              "the concern of the other actors.",
              "the need to reassure his readers.",
              "having been in a similar situation before.",
              "his own lack of physical fitness."
            ],
            answer: "C",
            explanation:
              "<q>But fear not, this is all strictly pretend!</q> O autor tranquiliza o leitor, que poderia se assustar com a cabeçada. Não há crítica de Kate (A) nem menção à preocupação dos atores (B)."
          },
          {
            stem: "How does the writer feel when Kate mentions the tin can?",
            options: [
              "worried about hurting Kate",
              "relieved that Kate is just pretending",
              "concerned that he may injure his head",
              "sure he won’t take it seriously enough",
              "embarrassed in front of the actors"
            ],
            answer: "A",
            explanation:
              "<q>Hoping desperately that I don’t miscalculate the angle and end up doing damage to her face.</q> A preocupação é com o rosto <b>dela</b>, não com a própria cabeça (C). O pedido <q>without smiling</q> (D) vem depois e não expressa o sentimento dele."
          },
          {
            stem: "When Kate and the writer try out a scene similar to one in Noises Off, we learn that",
            options: [
              "the writer isn’t sure of his instructions.",
              "Kate has adapted it slightly for the writer.",
              "the writer is unwilling to do it at first.",
              "Kate reacts quickly to a mistake he makes.",
              "the writer pushes Kate too hard."
            ],
            answer: "B",
            explanation:
              "<q>‘I’ve just slowed it down a bit,’ she says tactfully.</q> Ela adaptou a cena para o jornalista. E está errada: ele <q>let go of her quickly</q>, como deveria. C: <q>I obey</q>."
          },
          {
            stem: "What does the phrase ‘no small order’ in the fifth paragraph suggest?",
            options: [
              "Few teachers were willing to train Kate.",
              "Very few people ever perfect stage combat.",
              "Her university course had been very hard.",
              "Getting onto the register was a real challenge.",
              "Learning karate took up most of her time."
            ],
            answer: "D",
            explanation:
              "<i>No small order</i> = uma exigência nada pequena: <q>as well as a certificate in advanced stage combat, she would need a black belt in karate and proficiency in fencing, a sport she’d never tried before.</q> E está errada: ela já praticava artes marciais desde a infância."
          },
          {
            stem: "What does the writer tell us about the sword fight in the play Richard III?",
            options: [
              "It’s a particularly challenging scene to do.",
              "Its action is conveyed through spoken words.",
              "It is widely agreed to be the best of its kind.",
              "Shakespeare left detailed notes about it.",
              "Its details need to be made up."
            ],
            answer: "E",
            explanation:
              "<q>With no instructions left by the great playwright other than – they fight, Richard dies – the style and sequence of the fight is down to Kate and the actors.</q> Os detalhes precisam ser criados. D é o oposto."
          }
        ]
      }
    ]
  }
];
