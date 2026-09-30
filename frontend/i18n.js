'use strict';
const CARD_META = [{"number":"0","symbol":"✧"},{"number":"I","symbol":"✳"},{"number":"II","symbol":"☾"},{"number":"III","symbol":"❋"},{"number":"VI","symbol":"♡"},{"number":"VII","symbol":"✦"},{"number":"VIII","symbol":"∞"},{"number":"IX","symbol":"⋆"},{"number":"XIV","symbol":"≈"},{"number":"XVII","symbol":"☆"},{"number":"XIX","symbol":"☀"},{"number":"XXI","symbol":"◎"}];
const LOCALES = {
  "ko": {
    "ui": {
      "brand": "꼬불 고양이 점집",
      "headerNote": "마음이 쉬어 가는 작은 점집",
      "eyebrow": "너를 위한 작은 마법",
      "heading": "어서 와.\n오늘은 어떤 마음이야?",
      "lead": "복잡한 생각은 잠깐 내려놓고,\n네 마음에 닿는 카드 한 장을 골라 봐.",
      "topicsLabel": "타로 질문 주제",
      "today": "오늘의 나",
      "love": "사랑과 관계",
      "work": "일과 도전",
      "catAlt": "별 망토를 입은 곱슬 고양이",
      "caption": "천천히 골라도 괜찮아.",
      "resultCaption": "네 마음에 닿는 부분만 가져가.",
      "readingTitle": "마음이 가는 한 장",
      "pickStep": "01 — 카드를 골라 줘",
      "resultStep": "02 — 너에게 온 한 장",
      "deckNote": "정답은 없어. 조금 더 눈길이 가는 쪽으로.",
      "resultIntro": "고양이가 건네는 오늘의 이야기",
      "again": "다시 섞어 보기",
      "actionLabel": "오늘의 작은 실천",
      "footer": "작은 우연, 다정한 해석.",
      "disclaimer": "재미와 자기 성찰을 위한 타로예요. 선택의 주인은 언제나 당신이에요.",
      "motionOff": "움직임 끄기",
      "motionOn": "움직임 켜기",
      "language": "언어 선택",
      "title": "꼬불 고양이 점집 · 오늘의 한 장",
      "description": "작은 낙서 점집에서 고양이와 함께 뽑는 오늘의 타로 한 장.",
      "invalidTopic": "알 수 없는 주제예요.",
      "invalidPosition": "카드 위치는 0, 1, 2 중 하나여야 해요.",
      "alreadyDrawn": "다시 섞은 뒤 카드를 골라 주세요.",
      "invalidInput": "유효한 주제와 카드 위치가 필요해요."
    },
    "questions": {
      "today": "“오늘 나에게 필요한 이야기는 뭘까?”",
      "love": "“관계를 위해 어떤 마음을 가져볼까?”",
      "work": "“다음 걸음을 위해 무엇을 살펴볼까?”"
    },
    "drawLabels": [
      "왼쪽 카드 뽑기",
      "가운데 카드 뽑기",
      "오른쪽 카드 뽑기"
    ],
    "cards": [
      [
        "새로운 발걸음",
        "THE FOOL",
        "완벽한 준비를 기다리다 첫걸음까지 미루고 있지는 않아? 작은 시작에는 작은 용기면 충분해.",
        "호기심이 가는 일을 딱 10분만 해 봐.",
        "상대를 미리 단정 짓기보다 새로운 이야기를 들어 봐.",
        "시작부터 잘하려 하지 말고 작은 초안을 만들어 봐."
      ],
      [
        "네 안의 가능성",
        "THE MAGICIAN",
        "네가 이미 가진 것들을 한번 세어 봐. 아직 서툴러도, 시작에 필요한 도구는 생각보다 가까이 있을 수 있어.",
        "잘하는 것 세 가지를 적어 봐.",
        "네가 원하는 것을 솔직하고 구체적인 말로 전해 봐.",
        "지금 쓸 수 있는 시간과 도구부터 정리해 봐."
      ],
      [
        "조용한 마음의 소리",
        "THE HIGH PRIESTESS",
        "답을 서둘러 내지 않아도 괜찮아. 소란이 잦아들면 네 마음이 무엇을 원하는지 조금 더 또렷해질 거야.",
        "알림을 잠시 끄고 조용히 쉬어 봐.",
        "말 사이의 침묵까지 편안하게 기다려 줘.",
        "찜찜했던 부분을 기록하고 사실부터 확인해 봐."
      ],
      [
        "돌봄의 시간",
        "THE EMPRESS",
        "마음도 물을 주어야 자라나. 더 해내려 애쓰기 전에 오늘의 너를 충분히 돌봐 줬는지 살펴봐.",
        "좋아하는 음식과 편안한 휴식을 챙겨 줘.",
        "작은 고마움을 말로 표현해 봐.",
        "잘 자랄 수 있도록 작업 환경부터 편안하게 만들어 봐."
      ],
      [
        "마음에 가까운 선택",
        "THE LOVERS",
        "모두에게 좋은 답 대신 네가 소중하게 여기는 쪽을 살펴봐. 선택에는 너의 마음도 들어갈 자리가 있어.",
        "지키고 싶은 가치 한 가지를 적어 봐.",
        "서로 원하는 관계의 모습을 차분히 이야기해 봐.",
        "조건만큼 네가 오래 중요하게 여길 기준을 살펴봐."
      ],
      [
        "나만의 속도",
        "THE CHARIOT",
        "방향이 정해졌다면 다른 사람의 속도와 비교하지 않아도 돼. 오늘 갈 수 있는 만큼, 한 걸음만 움직여 보자.",
        "오늘 끝낼 작은 일 하나를 골라 봐.",
        "상대의 속도와 너의 속도를 함께 존중해 줘.",
        "목표를 이번 주에 할 수 있는 작은 단계로 나눠 봐."
      ],
      [
        "다정한 용기",
        "STRENGTH",
        "힘은 꼭 큰 목소리로 드러나지 않아. 불안한 마음을 다그치지 않고 데리고 가는 것도 용기야.",
        "스스로에게 다정한 한 문장을 건네 봐.",
        "이기려 하기보다 이해하려는 질문을 하나 해 봐.",
        "어려운 일을 가장 쉬운 부분부터 시작해 봐."
      ],
      [
        "나를 만나는 시간",
        "THE HERMIT",
        "잠깐 혼자 머무르는 건 뒤처지는 일이 아니야. 바깥의 정답에서 한 발 물러나 너만의 생각을 들어 봐.",
        "짧은 산책이나 조용한 메모 시간을 가져 봐.",
        "혼자 있고 싶은 마음을 오해 없이 설명해 봐.",
        "다른 사람의 방식보다 너에게 맞는 방식을 찾아 봐."
      ],
      [
        "조금씩, 균형 있게",
        "TEMPERANCE",
        "한꺼번에 바꾸지 않아도 돼. 해야 하는 일과 쉬는 시간을 조금씩 섞어 보면 네게 맞는 균형이 보일 거야.",
        "일정 사이에 작은 빈칸을 남겨 둬.",
        "서로 다른 방식을 절반씩 시도해 봐.",
        "한 번에 벌이는 일의 수를 조금 줄여 봐."
      ],
      [
        "작은 희망",
        "THE STAR",
        "아직 멀어 보이는 일에도 작은 빛은 있어. 오늘 눈에 들어온 좋은 것 하나가 다음 걸음의 힘이 될 수 있어.",
        "오늘 고마웠던 순간 하나를 적어 봐.",
        "기대하는 마음을 부담 없는 한마디로 전해 봐.",
        "오래 품었던 아이디어에 작은 시간을 내줘."
      ],
      [
        "기쁨을 누려도 돼",
        "THE SUN",
        "잘한 일을 얼른 넘겨버리지 말아 줘. 작아 보여도 너의 수고는 축하받을 만해. 기쁨을 느끼는 시간을 가져 보자.",
        "작은 성취 하나를 스스로 축하해 줘.",
        "함께 웃을 수 있는 가벼운 시간을 만들어 봐.",
        "완료한 일을 눈에 보이게 표시하고 잠깐 쉬어 가."
      ],
      [
        "한 바퀴의 마침표",
        "THE WORLD",
        "지금까지 온 길을 돌아봐. 끝맺음은 다음 시작을 위한 자리가 되기도 해. 남은 작은 매듭 하나를 정리해 보자.",
        "미뤄 둔 작은 마무리 하나를 끝내 봐.",
        "함께 지나온 시간에서 고마운 장면을 나눠 봐.",
        "끝낸 일에서 배운 점을 다음 일을 위해 남겨 둬."
      ]
    ]
  }
};
Object.assign(LOCALES, {
 en: {
 ui: {brand:'Curly Cat Tarot',headerNote:'A little place to rest your heart',eyebrow:'A LITTLE MAGIC, JUST FOR YOU',heading:'Welcome in.\nHow is your heart today?',lead:'Set your busy thoughts aside for a moment.\nChoose a card that speaks to you.',topicsLabel:'Reading topic',today:'Today & me',love:'Love & connection',work:'Work & new steps',catAlt:'A curly-haired cat wearing a starry cape',caption:'Take your time choosing.',resultCaption:'Keep whatever speaks to you.',readingTitle:'A card that calls to you',pickStep:'01 — Choose a card',resultStep:'02 — Your card',deckNote:'There is no right answer. Follow your curiosity.',resultIntro:'A little message from your cat',again:'Shuffle again',actionLabel:'One small step today',footer:'A little chance. A kind perspective.',disclaimer:'Tarot for fun and self-reflection. Your choices are always yours.',motionOff:'Pause motion',motionOn:'Enable motion',language:'Choose a language',title:'Curly Cat Tarot · A card for today',description:'Choose a tarot card with a friendly doodle cat and find a gentle moment of reflection.',invalidTopic:'Unknown topic.',invalidPosition:'Choose card position 0, 1, or 2.',alreadyDrawn:'Shuffle again before choosing another card.',invalidInput:'Choose a valid topic and card position.'},
 questions:{today:'“What might I need to hear today?”',love:'“What could help me nurture my connections?”',work:'“What should I consider before my next step?”'},drawLabels:['Draw the left card','Draw the middle card','Draw the right card'],
 cards:[
 ['A fresh start','THE FOOL','Are you waiting to feel perfectly ready before taking the first step? A small beginning only needs a little courage.','Spend just ten minutes on something you are curious about.','Listen to a new story before deciding what someone is like.','Start with a small draft instead of trying to get everything right.'],
 ['Possibility within you','THE MAGICIAN','Take a look at what you already have. Even if you are still learning, the tools you need to begin may be closer than you think.','Write down three things you do well.','Say what you want honestly and clearly.','Start by taking stock of the time and tools available to you.'],
 ['Your quiet inner voice','THE HIGH PRIESTESS','You do not have to rush toward an answer. When the noise settles, you may hear what your heart wants a little more clearly.','Turn off notifications for a while and take a quiet break.','Leave room for comfortable pauses between words.','Note what feels uncertain and check the facts first.'],
 ['Time for care','THE EMPRESS','Your heart needs tending, too. Before trying to do more, ask whether you have given yourself enough care today.','Make time for a meal you enjoy and a restful break.','Put a small feeling of gratitude into words.','Make your workspace a little more comfortable so your ideas can grow.'],
 ['A choice close to your heart','THE LOVERS','Rather than finding an answer that pleases everyone, look at what matters to you. Your feelings deserve a place in your choices.','Write down one value you want to honor.','Talk calmly about the kind of relationship you both want.','Alongside practical conditions, consider what will matter to you over time.'],
 ['At your own pace','THE CHARIOT','Once you have a direction, you do not need to match anyone else’s pace. Take just one step that feels possible today.','Choose one small task you can finish today.','Respect your own pace as well as the other person’s.','Break your goal into small steps you can take this week.'],
 ['Gentle courage','STRENGTH','Strength does not always speak loudly. Moving forward without scolding your anxious heart is a kind of courage, too.','Offer yourself one kind sentence.','Ask a question to understand, rather than to win.','Begin a difficult task with its easiest part.'],
 ['Time with yourself','THE HERMIT','Spending a little time alone does not mean falling behind. Step away from other people’s answers and listen to your own thoughts.','Take a short walk or spend a quiet moment writing.','Explain your need for time alone so it is not misunderstood.','Look for a way of working that suits you, rather than copying someone else’s.'],
 ['A little more balance','TEMPERANCE','You do not have to change everything at once. Make a little room for both effort and rest, and notice the balance that suits you.','Leave a little breathing space in your schedule.','Try making room for both of your different approaches.','Reduce the number of things you start at the same time.'],
 ['A small hope','THE STAR','Even something that feels far away can hold a little light. One good thing you notice today may help you take the next step.','Write down one moment you felt grateful for today.','Share a hope in a gentle, pressure-free way.','Give a little time to an idea you have carried for a while.'],
 ['Room for joy','THE SUN','Do not rush past what you have done well. Even small efforts deserve a little celebration. Give yourself time to enjoy them.','Celebrate one small accomplishment.','Make time for something lighthearted you can enjoy together.','Mark a task as done, then take a short break.'],
 ['Completing a circle','THE WORLD','Look back at the path you have traveled. An ending can make room for a beginning. Tie up one small loose end.','Finish one small thing you have been putting off.','Share a grateful memory from the time you have spent together.','Save a lesson from a finished project for the next one.']
 ]},
 id: {
 ui:{brand:'Tarot Kucing Keriting',headerNote:'Tempat kecil untuk menenangkan hati',eyebrow:'SEDIKIT KEAJAIBAN UNTUKMU',heading:'Selamat datang.\nApa kabar hatimu hari ini?',lead:'Istirahatkan pikiranmu sejenak.\nPilih satu kartu yang terasa dekat di hati.',topicsLabel:'Topik bacaan tarot',today:'Diriku hari ini',love:'Cinta & hubungan',work:'Kerja & langkah baru',catAlt:'Kucing berbulu keriting dengan jubah bermotif bintang',caption:'Pilih pelan-pelan saja, tidak apa-apa.',resultCaption:'Ambil pesan yang terasa cocok untukmu.',readingTitle:'Satu kartu yang menarik hatimu',pickStep:'01 — Pilih satu kartu',resultStep:'02 — Kartu untukmu',deckNote:'Tidak ada jawaban yang paling benar. Ikuti rasa penasaranmu.',resultIntro:'Pesan kecil dari si kucing',again:'Kocok lagi',actionLabel:'Langkah kecil hari ini',footer:'Pertemuan kecil, sudut pandang yang hangat.',disclaimer:'Tarot untuk hiburan dan refleksi diri. Pilihan tetap ada di tanganmu.',motionOff:'Matikan animasi',motionOn:'Nyalakan animasi',language:'Pilih bahasa',title:'Tarot Kucing Keriting · Kartu hari ini',description:'Pilih satu kartu tarot bersama kucing bergaya coretan dan nikmati sejenak waktu untuk merenung.',invalidTopic:'Topik tidak dikenal.',invalidPosition:'Pilih posisi kartu 0, 1, atau 2.',alreadyDrawn:'Kocok lagi sebelum memilih kartu lain.',invalidInput:'Pilih topik dan posisi kartu yang valid.'},
 questions:{today:'“Pesan apa yang kubutuhkan hari ini?”',love:'“Sikap apa yang bisa membantu hubunganku?”',work:'“Apa yang perlu kupertimbangkan untuk langkah berikutnya?”'},drawLabels:['Ambil kartu kiri','Ambil kartu tengah','Ambil kartu kanan'],
 cards:[
 ['Langkah awal yang baru','SI PENGEMBARA','Apa kamu menunggu sampai benar-benar siap untuk melangkah? Awal yang kecil cukup ditemani sedikit keberanian.','Luangkan sepuluh menit untuk hal yang membuatmu penasaran.','Dengarkan cerita baru sebelum menyimpulkan seperti apa seseorang.','Buat draf kecil dulu, tanpa harus langsung sempurna.'],
 ['Potensi dalam dirimu','SANG PENYIHIR','Coba lihat apa saja yang sudah kamu miliki. Meski masih belajar, bekal untuk memulai mungkin lebih dekat dari yang kamu kira.','Tuliskan tiga hal yang bisa kamu lakukan dengan baik.','Sampaikan keinginanmu dengan jujur dan jelas.','Catat dulu waktu dan sarana yang bisa kamu gunakan sekarang.'],
 ['Suara hati yang tenang','SANG PENDETA WANITA','Kamu tidak perlu terburu-buru menemukan jawaban. Saat suasana lebih tenang, keinginan hatimu mungkin terdengar lebih jelas.','Matikan notifikasi sejenak dan nikmati waktu tenang.','Beri ruang untuk jeda yang nyaman di antara percakapan.','Catat hal yang terasa mengganjal, lalu periksa faktanya.'],
 ['Waktunya merawat diri','SANG PERMAISURI','Hati juga perlu dirawat agar tumbuh. Sebelum berusaha melakukan lebih banyak, lihat apakah kamu sudah cukup menjaga dirimu hari ini.','Nikmati makanan kesukaanmu dan istirahat yang nyaman.','Ungkapkan rasa terima kasih, meski untuk hal kecil.','Buat tempat kerjamu lebih nyaman agar ide bisa berkembang.'],
 ['Pilihan yang dekat di hati','SEPASANG KEKASIH','Daripada mencari jawaban yang menyenangkan semua orang, lihat apa yang berharga bagimu. Perasaanmu juga layak ikut dalam pilihanmu.','Tuliskan satu nilai yang ingin kamu pegang.','Bicarakan dengan tenang hubungan seperti apa yang kalian inginkan.','Selain syarat praktis, pertimbangkan hal yang akan tetap penting bagimu nanti.'],
 ['Dengan iramamu sendiri','KERETA PERANG','Kalau arahmu sudah jelas, kamu tidak harus menyamai kecepatan orang lain. Ambil satu langkah yang sanggup kamu jalani hari ini.','Pilih satu tugas kecil yang bisa selesai hari ini.','Hargai iramamu sendiri sekaligus irama orang lain.','Bagi tujuanmu menjadi langkah kecil untuk minggu ini.'],
 ['Keberanian yang lembut','KEKUATAN','Kekuatan tidak selalu bersuara keras. Melangkah tanpa memarahi hatimu yang cemas juga sebuah keberanian.','Ucapkan satu kalimat baik kepada dirimu sendiri.','Bertanyalah untuk memahami, bukan untuk menang.','Mulai pekerjaan sulit dari bagian yang paling mudah.'],
 ['Waktu untuk diri sendiri','SANG PERTAPA','Menyendiri sebentar bukan berarti tertinggal. Beri jarak dari jawaban orang lain dan dengarkan pikiranmu sendiri.','Jalan-jalan sebentar atau luangkan waktu tenang untuk menulis.','Jelaskan kebutuhanmu untuk menyendiri agar tidak disalahpahami.','Cari cara kerja yang cocok untukmu, bukan sekadar mengikuti orang lain.'],
 ['Sedikit demi sedikit, seimbang','KESEIMBANGAN','Kamu tidak perlu mengubah semuanya sekaligus. Sisipkan usaha dan istirahat sedikit demi sedikit, lalu temukan keseimbangan yang cocok.','Sisakan sedikit ruang kosong dalam jadwalmu.','Coba beri ruang bagi cara kalian yang berbeda.','Kurangi jumlah hal yang kamu mulai bersamaan.'],
 ['Harapan kecil','BINTANG','Hal yang masih terasa jauh pun bisa menyimpan sedikit cahaya. Satu hal baik yang kamu lihat hari ini bisa menjadi bekal langkah berikutnya.','Tuliskan satu momen yang kamu syukuri hari ini.','Sampaikan harapanmu dengan ringan, tanpa memberi tekanan.','Luangkan sedikit waktu untuk ide yang sudah lama kamu simpan.'],
 ['Boleh menikmati bahagia','MATAHARI','Jangan buru-buru melewati hal yang sudah kamu lakukan dengan baik. Usahamu, sekecil apa pun, pantas dirayakan. Beri waktu untuk menikmatinya.','Rayakan satu pencapaian kecilmu.','Luangkan waktu untuk hal ringan yang bisa membuat kalian tertawa.','Tandai pekerjaan yang selesai, lalu istirahat sebentar.'],
 ['Menutup satu putaran','DUNIA','Lihat kembali perjalananmu. Sebuah akhir juga bisa memberi ruang untuk awal baru. Coba bereskan satu urusan kecil yang tersisa.','Selesaikan satu hal kecil yang selama ini tertunda.','Bagikan kenangan yang kamu syukuri dari waktu bersama.','Catat pelajaran dari pekerjaan yang selesai untuk bekal berikutnya.']
 ]},
 fr: {
 ui:{brand:'Le Tarot du Chat Bouclé',headerNote:'Un petit refuge pour ton cœur',eyebrow:'UN PEU DE MAGIE, RIEN QUE POUR TOI',heading:'Bienvenue.\nComment va ton cœur ?',lead:'Laisse tes pensées se poser un instant.\nChoisis une carte qui te parle.',topicsLabel:'Thème du tirage',today:'Moi, aujourd’hui',love:'Amour et liens',work:'Travail et projets',catAlt:'Un chat au pelage bouclé portant une cape étoilée',caption:'Prends ton temps pour choisir.',resultCaption:'Garde ce qui te parle.',readingTitle:'La carte qui t’attire',pickStep:'01 — Choisis une carte',resultStep:'02 — Ta carte',deckNote:'Il n’y a pas de bonne réponse. Suis ta curiosité.',resultIntro:'Le petit message de ton chat',again:'Mélanger à nouveau',actionLabel:'Un petit pas aujourd’hui',footer:'Un peu de hasard, un regard bienveillant.',disclaimer:'Un tarot pour s’amuser et réfléchir sur soi. Tes choix t’appartiennent toujours.',motionOff:'Arrêter l’animation',motionOn:'Activer l’animation',language:'Choisir la langue',title:'Le Tarot du Chat Bouclé · La carte du jour',description:'Tire une carte avec un petit chat dessiné à la main et offre-toi un moment de réflexion tout en douceur.',invalidTopic:'Thème inconnu.',invalidPosition:'Choisis la position 0, 1 ou 2.',alreadyDrawn:'Mélange à nouveau avant de choisir une autre carte.',invalidInput:'Choisis un thème et une position de carte valides.'},
 questions:{today:'« Quel message pourrait m’aider aujourd’hui ? »',love:'« Quelle attitude pourrait nourrir mes liens ? »',work:'« Que prendre en compte avant mon prochain pas ? »'},drawLabels:['Tirer la carte de gauche','Tirer la carte du milieu','Tirer la carte de droite'],
 cards:[
 ['Un nouveau départ','LE MAT','Attends-tu que tout soit prêt pour faire le premier pas ? Un petit début n’a besoin que d’un peu de courage.','Consacre dix minutes à quelque chose qui t’intrigue.','Écoute une nouvelle histoire avant de te faire une idée de quelqu’un.','Commence par une petite ébauche, sans chercher la perfection.'],
 ['Tes possibilités intérieures','LE BATELEUR','Regarde ce que tu as déjà à ta disposition. Même si tu apprends encore, les outils pour commencer sont peut-être plus proches que tu ne le crois.','Note trois choses que tu sais bien faire.','Exprime ce que tu souhaites avec sincérité et précision.','Fais le point sur le temps et les outils dont tu disposes.'],
 ['La voix discrète de ton cœur','LA PAPESSE','Tu n’as pas à trouver une réponse tout de suite. Quand le bruit retombe, les envies de ton cœur peuvent devenir plus claires.','Coupe les notifications un instant et repose-toi au calme.','Laisse une place aux silences paisibles dans la conversation.','Note ce qui te laisse dans le doute et vérifie d’abord les faits.'],
 ['Le temps de prendre soin','L’IMPÉRATRICE','Ton cœur aussi a besoin d’attention pour grandir. Avant d’en faire davantage, demande-toi si tu as assez pris soin de toi aujourd’hui.','Accorde-toi un repas que tu aimes et une vraie pause.','Mets des mots sur une petite gratitude.','Rends ton espace de travail plus agréable pour laisser grandir tes idées.'],
 ['Un choix proche de ton cœur','L’AMOUREUX','Au lieu de chercher une réponse qui plaise à tout le monde, regarde ce qui compte pour toi. Tes sentiments ont aussi leur place dans tes choix.','Note une valeur que tu souhaites respecter.','Parlez calmement de la relation que vous souhaitez construire.','Au-delà des conditions pratiques, pense à ce qui comptera durablement pour toi.'],
 ['À ton propre rythme','LE CHARIOT','Une fois ta direction choisie, tu n’as pas à suivre le rythme des autres. Fais simplement un pas à ta portée aujourd’hui.','Choisis une petite tâche à terminer aujourd’hui.','Respecte ton rythme autant que celui de l’autre.','Découpe ton objectif en petites étapes pour cette semaine.'],
 ['Un courage tout en douceur','LA FORCE','La force ne parle pas toujours fort. Avancer sans gronder ton cœur inquiet, c’est aussi du courage.','Adresse-toi une phrase bienveillante.','Pose une question pour comprendre, plutôt que pour avoir raison.','Commence une tâche difficile par sa partie la plus simple.'],
 ['Un moment avec toi-même','L’ERMITE','Passer un moment en solitaire ne veut pas dire prendre du retard. Éloigne-toi des réponses des autres pour écouter tes propres pensées.','Fais une courte promenade ou écris quelques lignes au calme.','Explique ton besoin de solitude pour éviter les malentendus.','Cherche une méthode qui te convient, plutôt que celle des autres.'],
 ['Un peu plus d’équilibre','TEMPÉRANCE','Tu n’as pas besoin de tout changer d’un coup. Fais un peu de place à l’effort comme au repos et découvre l’équilibre qui te convient.','Garde un peu d’espace libre dans ton emploi du temps.','Essayez de faire une place à vos deux façons de faire.','Réduis un peu le nombre de choses que tu commences en même temps.'],
 ['Une petite lueur d’espoir','L’ÉTOILE','Même ce qui semble encore loin peut abriter une petite lumière. Une belle chose remarquée aujourd’hui peut t’aider à faire le prochain pas.','Note un moment pour lequel tu ressens de la gratitude aujourd’hui.','Exprime un espoir avec douceur, sans mettre de pression.','Accorde un peu de temps à une idée que tu portes depuis longtemps.'],
 ['Une place pour la joie','LE SOLEIL','Ne passe pas trop vite sur ce que tu as bien fait. Même petits, tes efforts méritent d’être célébrés. Prends le temps de les savourer.','Célèbre une petite réussite.','Créez un moment léger pour rire ensemble.','Marque une tâche comme terminée, puis fais une petite pause.'],
 ['La fin d’un cycle','LE MONDE','Regarde le chemin parcouru. Une fin peut aussi faire de la place à un nouveau départ. Termine une petite chose restée en suspens.','Achève une petite tâche que tu repoussais.','Partage un souvenir précieux de vos moments ensemble.','Garde une leçon d’un projet terminé pour le prochain.']
 ]},
 es: {
 ui:{brand:'El Tarot del Gato Rizado',headerNote:'Un pequeño refugio para tu corazón',eyebrow:'UN POCO DE MAGIA, SOLO PARA TI',heading:'Pasa, estás en casa.\n¿Cómo está tu corazón?',lead:'Deja descansar tus pensamientos un momento.\nElige una carta que conecte contigo.',topicsLabel:'Tema de la lectura',today:'Yo, hoy',love:'Amor y vínculos',work:'Trabajo y proyectos',catAlt:'Un gato de pelo rizado con una capa de estrellas',caption:'Tómate tu tiempo para elegir.',resultCaption:'Quédate con lo que conecte contigo.',readingTitle:'La carta que te llama',pickStep:'01 — Elige una carta',resultStep:'02 — Tu carta',deckNote:'No hay una respuesta correcta. Sigue tu curiosidad.',resultIntro:'Un pequeño mensaje de tu gato',again:'Volver a barajar',actionLabel:'Un pequeño paso para hoy',footer:'Un poco de azar, una mirada amable.',disclaimer:'Tarot para divertirte y reflexionar. Tus decisiones siempre son tuyas.',motionOff:'Pausar animación',motionOn:'Activar animación',language:'Elegir idioma',title:'El Tarot del Gato Rizado · Tu carta de hoy',description:'Elige una carta de tarot con un simpático gato dibujado a mano y regálate un momento de reflexión.',invalidTopic:'Tema desconocido.',invalidPosition:'Elige la posición 0, 1 o 2.',alreadyDrawn:'Vuelve a barajar antes de elegir otra carta.',invalidInput:'Elige un tema y una posición de carta válidos.'},
 questions:{today:'«¿Qué mensaje podría ayudarme hoy?»',love:'«¿Qué actitud podría ayudarme a cuidar mis vínculos?»',work:'«¿Qué debería considerar antes de dar el siguiente paso?»'},drawLabels:['Sacar la carta de la izquierda','Sacar la carta del centro','Sacar la carta de la derecha'],
 cards:[
 ['Un nuevo comienzo','EL LOCO','¿Esperas a tenerlo todo listo antes de dar el primer paso? Un pequeño comienzo solo necesita un poco de valor.','Dedica diez minutos a algo que te dé curiosidad.','Escucha una historia nueva antes de hacerte una idea de alguien.','Empieza con un pequeño borrador, sin buscar la perfección.'],
 ['Lo que puedes crear','EL MAGO','Mira lo que ya tienes a tu alcance. Aunque sigas aprendiendo, las herramientas para empezar pueden estar más cerca de lo que crees.','Escribe tres cosas que haces bien.','Expresa lo que quieres con sinceridad y claridad.','Haz primero un repaso del tiempo y los recursos disponibles.'],
 ['La voz tranquila de tu corazón','LA SACERDOTISA','No tienes que apresurarte a encontrar una respuesta. Cuando el ruido baje, quizá escuches con más claridad lo que tu corazón quiere.','Desactiva las notificaciones un rato y descansa en silencio.','Deja espacio para pausas cómodas en la conversación.','Anota lo que te genera dudas y comprueba primero los hechos.'],
 ['Tiempo para cuidarte','LA EMPERATRIZ','Tu corazón también necesita cuidados para crecer. Antes de intentar hacer más, pregúntate si hoy te has cuidado lo suficiente.','Disfruta de una comida que te guste y de un buen descanso.','Pon en palabras un pequeño agradecimiento.','Haz más agradable tu espacio de trabajo para que tus ideas puedan crecer.'],
 ['Una elección cercana al corazón','LOS ENAMORADOS','En lugar de buscar una respuesta que guste a todo el mundo, mira lo que es valioso para ti. Tus sentimientos también tienen lugar en tus decisiones.','Escribe un valor que quieras respetar.','Hablen con calma sobre la relación que desean construir.','Además de las condiciones prácticas, considera lo que seguirá siendo importante para ti.'],
 ['A tu propio ritmo','EL CARRO','Cuando tengas una dirección, no necesitas seguir el ritmo de otras personas. Da un solo paso que esté a tu alcance hoy.','Elige una pequeña tarea que puedas terminar hoy.','Respeta tanto tu ritmo como el de la otra persona.','Divide tu objetivo en pequeños pasos para esta semana.'],
 ['Un valor sereno','LA FUERZA','La fuerza no siempre habla en voz alta. Avanzar sin regañar a tu corazón inquieto también es una forma de valentía.','Dedícate una frase amable.','Haz una pregunta para comprender, no para ganar.','Empieza una tarea difícil por la parte más sencilla.'],
 ['Un rato contigo','EL ERMITAÑO','Pasar un rato a solas no significa quedarse atrás. Toma distancia de las respuestas ajenas y escucha tus propios pensamientos.','Da un paseo corto o escribe un momento en calma.','Explica tu necesidad de estar a solas para evitar malentendidos.','Busca una forma de trabajar que te encaje, en lugar de copiar la de otra persona.'],
 ['Un poco más de equilibrio','LA TEMPLANZA','No tienes que cambiarlo todo de golpe. Haz un poco de espacio para el esfuerzo y el descanso, y descubre el equilibrio que te funciona.','Deja un pequeño hueco libre en tu agenda.','Intenten dar espacio a las dos maneras de hacer las cosas.','Reduce un poco la cantidad de cosas que empiezas a la vez.'],
 ['Una pequeña esperanza','LA ESTRELLA','Incluso lo que parece lejano puede guardar una pequeña luz. Algo bueno que notes hoy puede ayudarte a dar el siguiente paso.','Anota un momento de hoy por el que sientas gratitud.','Comparte una ilusión con suavidad, sin presionar.','Dedica un poco de tiempo a una idea que llevas guardando.'],
 ['Espacio para la alegría','EL SOL','No pases de largo por lo que has hecho bien. Incluso tus pequeños esfuerzos merecen celebrarse. Date tiempo para disfrutarlos.','Celebra un pequeño logro.','Busquen un momento ligero para reír juntos.','Marca una tarea como terminada y descansa un momento.'],
 ['Cerrar un ciclo','EL MUNDO','Mira el camino que has recorrido. Un final también puede abrir espacio para un comienzo. Resuelve un pequeño asunto pendiente.','Termina algo pequeño que llevabas posponiendo.','Comparte un recuerdo que agradezcas del tiempo que han pasado juntos.','Guarda una lección de un proyecto terminado para el próximo.']
 ]}
});
// Room-specific text stays outside the artwork so all five languages can reflow.
const ROOM_COPY = {
 ko: {roomHeading:'고양이의 작은 방에 어서 와.',openReading:'해석 읽기',greetLabel:'고양이에게 인사하기',greeting:'와 줘서 반가워. 편하게 쉬어 가.',caption:'책상 위에서 마음이 가는 카드를 골라 봐.',resultCaption:'이 카드가 왔네. 아래에 네 이야기를 적어 뒀어.'},
 en: {roomHeading:'Welcome to the cat’s little room.',openReading:'Read your message',greetLabel:'Say hello to the cat',greeting:'I’m glad you’re here. Make yourself at home.',caption:'Choose a card from my desk. Take your time.',resultCaption:'Here’s your card. Your message is waiting below.'},
 id: {roomHeading:'Selamat datang di kamar kecil si kucing.',openReading:'Baca pesanmu',greetLabel:'Sapa si kucing',greeting:'Senang kamu datang. Anggap saja rumah sendiri.',caption:'Pilih kartu di mejaku yang menarik hatimu.',resultCaption:'Ini kartumu. Pesan untukmu ada di bawah.'},
 fr: {roomHeading:'Bienvenue dans la petite chambre du chat.',openReading:'Lire ton message',greetLabel:'Dire bonjour au chat',greeting:'Ça me fait plaisir de te voir. Installe-toi.',caption:'Choisis une carte sur ma table. Prends ton temps.',resultCaption:'Voici ta carte. Ton message t’attend plus bas.'},
 es: {roomHeading:'Pasa al pequeño cuarto del gato.',openReading:'Leer tu mensaje',greetLabel:'Saludar al gato',greeting:'Me alegra verte. Ponte a gusto.',caption:'Elige una carta de mi mesa. No hay prisa.',resultCaption:'Esta es tu carta. Tu mensaje te espera abajo.'}
};
for (const [lang, text] of Object.entries(ROOM_COPY)) Object.assign(LOCALES[lang].ui, text);
