/* story.js — all story text, NPC dialogue and item descriptions (original writing).
   Allowed characters: A-Z 0-9 . , ! ? ' - : / ( ) " + = */
(function (O) {
  'use strict';

  O.STORY = [
    { scene: 'orpheus', text: 'LONG AGO, WHEN THE GODS STILL WALKED AMONG MORTALS, A YOUNG MAN NAMED ORPHEUS LIVED IN THE HILLS OF ARCADIA.' },
    { scene: 'lovers', text: 'HIS MUSIC COULD CALM WILD BEASTS, AND HIS HEART BELONGED TO THE GENTLE EURYDICE.' },
    { scene: 'serpent', text: 'BUT ON THE DAY OF THEIR WEDDING, A SERPENT HIDDEN IN THE GRASS BIT EURYDICE, AND HER LIFE FADED AWAY.' },
    { scene: 'hades', text: 'HADES, LORD OF THE UNDERWORLD, CLAIMED HER SOUL AND LOCKED IT IN THE DEEPEST HALL OF TARTARUS.' },
    { scene: 'oath', text: 'ORPHEUS SWORE BEFORE THE GODS OF OLYMPUS THAT HE WOULD BRING HER BACK. AND SO HIS JOURNEY BEGAN...' }
  ];

  O.ITEMS = {
    club: { name: 'THE WOODEN CLUB', icon: 'iconClub', desc: 'PRESS B TO ATTACK. HOLD DOWN AND PRESS B TO STRIKE LOW.' },
    blessing: { name: "ZEUS'S BLESSING", icon: 'heart', desc: 'YOUR LIFE HAS GROWN STRONGER.' },
    sandals: { name: 'THE SANDALS OF HERMES', icon: 'iconSandals', desc: 'NOW YOU CAN JUMP MUCH HIGHER THAN BEFORE.' }
  };

  O.ENDING = [
    { t: 'WITH THE GIFT OF HERMES,', c: '#fcfcfc' },
    { t: 'ORPHEUS LEFT ARCADIA.', c: '#fcfcfc' },
    { t: '', c: '#fcfcfc' },
    { t: 'MANY TRIALS STILL AWAIT', c: '#fcfcfc' },
    { t: 'BEFORE TARTARUS.', c: '#fcfcfc' },
    { t: '', c: '#fcfcfc' },
    { t: 'END OF PART 1', c: '#f8b800' },
    { t: 'THANK YOU FOR PLAYING!', c: '#80c0fc' }
  ];

  O.questHint = function (st) {
    const f = st.flags;
    if (!st.items.club) return 'TALK TO THE ELDER OF THE VILLAGE.';
    if (!f.metZeus) return 'VISIT THE TEMPLE OF ZEUS, EAST OF THE VILLAGE.';
    if (!f.boarDefeated) return 'CROSS THE FOREST OF ARCADIA AND DEFEAT THE ERYMANTHIAN BOAR.';
    if (!st.items.sandals) return 'MEET HERMES IN HIS SHRINE, BEYOND THE BOAR\'S DEN.';
    return 'THE ROAD CONTINUES IN ATTICA... (PART 2)';
  };

  // NPC conversations. g.say(speaker, pages, next) / g.ask(speaker, text, options, cb)
  O.TALK = {
    elder(g) {
      const st = g.st;
      if (!st.items.club) {
        g.say('ELDER', [
          'ORPHEUS... I SAW IT ALL. THE SERPENT, AND THEN THE SHADOW OF HADES TAKING EURYDICE AWAY.',
          'NO MORTAL HAS EVER RETURNED FROM THE UNDERWORLD. BUT YOU HAVE THE COURAGE OF A HERO.',
          'TAKE THIS OLD CLUB. IT IS NOT MUCH, BUT IT WILL KEEP THE BEASTS AWAY.'
        ], () => g.giveItem('club', () => g.say('ELDER', [
          'NOW GO TO THE TEMPLE OF ZEUS, EAST OF THE VILLAGE. THE KING OF THE GODS MAY HEAR YOUR PRAYER.'
        ])));
      } else if (!st.flags.metZeus) {
        g.say('ELDER', ['THE TEMPLE OF ZEUS IS TO THE EAST. STAND AT ITS DOOR AND PRESS UP TO ENTER.']);
      } else {
        g.say('ELDER', [
          'SNAKES CRAWL TOO LOW FOR A NORMAL SWING. HOLD DOWN AND ATTACK TO STRIKE THEM.',
          'AND WHEN THE BOAR CHARGES, JUMP! A STUNNED BEAST IS AN EASY TARGET.'
        ]);
      }
    },

    merchant(g) {
      const st = g.st;
      g.ask('MERCHANT', 'FRESH AMBROSIA FROM MOUNT OLYMPUS! ONE JAR FOR 10 OLIVES. DO YOU WANT ONE?', ['YES', 'NO'], (sel) => {
        if (sel !== 0) { g.say('MERCHANT', ['COME BACK ANY TIME, ORPHEUS.']); return; }
        if (st.olives < 10) g.say('MERCHANT', ['YOU DO NOT HAVE ENOUGH OLIVES. THE CREATURES OF THE FOREST OFTEN DROP THEM.']);
        else if (st.ambrosia >= 3) g.say('MERCHANT', ['YOU CANNOT CARRY MORE THAN THREE JARS.']);
        else {
          st.olives -= 10; st.ambrosia++;
          g.sfx('buy');
          g.say('MERCHANT', ['THANK YOU! PRESS START TO OPEN YOUR STATUS AND DRINK IT WHEN YOU ARE HURT.']);
        }
      });
    },

    villager(g) {
      g.villagerTalk = (g.villagerTalk || 0) + 1;
      if (g.villagerTalk % 2) {
        g.say('WOMAN', ['THEY SAY THE ERYMANTHIAN BOAR HAS MADE ITS DEN IN THE FOREST. EVEN THE SATYRS FEAR IT.']);
      } else {
        g.say('WOMAN', ['IF YOU FALL IN BATTLE, THE GODS WILL LET YOU CONTINUE FROM THE LAST TEMPLE YOU VISITED.']);
      }
    },

    zeus(g) {
      const st = g.st;
      if (!st.flags.metZeus) {
        st.flags.metZeus = true;
        g.say('ZEUS', [
          'ORPHEUS, SON OF CALLIOPE. I KNOW WHY YOU HAVE COME.',
          'HADES HAS BROKEN THE LAW OF OLYMPUS. EURYDICE\'S SOUL IS CHAINED IN THE DEPTHS OF TARTARUS.',
          'NO MORTAL CAN ENTER HIS KINGDOM ALONE. YOU MUST EARN THE GIFTS OF THE GODS, ONE BY ONE.',
          'FIRST, CROSS THE FOREST OF ARCADIA. THE ERYMANTHIAN BOAR GUARDS THE PATH TO THE SHRINE OF HERMES.',
          'TAKE MY BLESSING.'
        ], () => g.giveItem('blessing', () => {
          g.save();
          g.say('ZEUS', ['WHENEVER YOU RETURN TO ME, YOUR JOURNEY WILL BE RECORDED. GO NOW, AND DO NOT FEAR THE DARK.']);
        }));
      } else {
        g.ask('ZEUS', 'SHALL I RECORD YOUR JOURNEY AND RESTORE YOUR LIFE?', ['YES', 'NO'], (sel) => {
          if (sel === 0) {
            st.hp = st.maxHp;
            g.sfx('life');
            g.save();
            g.say('ZEUS', ['YOUR JOURNEY HAS BEEN RECORDED. GO IN PEACE.']);
          }
        });
      }
    },

    hermes(g) {
      const st = g.st;
      if (!st.items.sandals) {
        g.say('HERMES', [
          'WELL DONE, ORPHEUS! THE BOAR WILL TROUBLE ARCADIA NO MORE.',
          'I AM HERMES, MESSENGER OF THE GODS AND GUIDE OF SOULS. I KNOW THE ROAD TO THE UNDERWORLD.',
          'BUT THE ROAD IS LONG AND STEEP. TAKE MY WINGED SANDALS.'
        ], () => g.giveItem('sandals', () => g.say('HERMES', [
          'NOW SEEK ATHENA IN ATTICA. HER WISDOM WILL GUIDE YOUR NEXT STEPS.',
          'FAREWELL, SON OF CALLIOPE. EURYDICE IS WAITING FOR YOU.'
        ], () => {
          st.flags.part1Done = true;
          g.save();
          g.toEnding();
        })));
      } else {
        g.say('HERMES', ['THE ROAD TO ATTICA WILL OPEN SOON, ORPHEUS. (PART 2 IS COMING!)']);
      }
    }
  };
})(window.OLY);
