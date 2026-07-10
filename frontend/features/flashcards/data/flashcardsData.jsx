//C:\quran-similarity-app\frontend\src\features\flashcards\data\flashcardsData.jsx
export const flashcardsData = [
  {
    id: 1,
    title: "Category 1: Surah Openings",
    study: `
      <h3>6 Surahs Beginning with الٓمٓ</h3>
      <p>1. Al-Baqarah, 2. Āl ’Imrān, 3. Al-’Ankabūt, 4. Ar-Rūm, 5. Luqmān, 6. As-Sajdah</p>
      <p><strong>Memory Pattern:</strong> The first two are Madinan. The remaining four are Makkan.</p>
      
      <h3>5 Surahs Beginning with الحمد لله</h3>
      <p>1. Al-Fātiḥah, 2. Al-An‘ām, 3. Al-Kahf, 4. Saba’, 5. Fāṭir</p>
      <p><strong>Pattern:</strong> These Surahs open with praise of Allah.</p>

      <h3>5 Surahs Beginning with الٓر</h3>
      <p>1. Yūnus, 2. Hūd, 3. Yūsuf, 4. Ibrāhīm, 5. Al-Ḥijr</p>
      <p><strong>Mnemonic Flow:</strong> The sequence moves through connected prophetic narratives.</p>

      <h3>7 Surahs Beginning với إذا</h3>
      <p>1. Al-Wāqi‘ah, 2. Al-Munāfiqūn, 3. At-Takwīr, 4. Al-Infiṭār, 5. Al-Inshiqāq, 6. Az-Zalzalah, 7. An-Naṣr</p>
      <p><strong>Pattern:</strong> Most describe major future events and scenes of the Hereafter.</p>

      <h3>10 Surahs Beginning with يا أيها</h3>
      <p>1. An-Nisā’, 2. Al-Mā’idah, 3. Al-Ḥajj, 4. Al-Aḥzāb, 5. Al-Ḥujurāt, 6. Al-Mumtaḥanah, 7. Aṭ-Ṭalāq, 8. At-Taḥrīm, 9. Al-Muzzammil, 10. Al-Muddaththir</p>

      <h3>Groups of Two</h3>
      <ul>
        <li><strong>ألم (2):</strong> Ash-Sharḥ, Al-Fīl</li>
        <li><strong>قل (5):</strong> Al-Jinn, Al-Kāfirūn, Al-Ikhlāṣ, Al-Falaq, An-Nās</li>
        <li><strong>إنا (4):</strong> Al-Fatḥ, Nūḥ, Al-Qadr, Al-Kawthar</li>
        <li><strong>قد (2):</strong> Al-Mu’minūn, Al-Mujādilah</li>
        <li><strong>تبارك (2):</strong> Al-Furqān, Al-Mulk</li>
        <li><strong>هل (2):</strong> Al-Insān, Al-Ghāshiyah</li>
        <li><strong>ويل (2):</strong> Al-Muṭaffifīn, Al-Humazah</li>
        <li><strong>والسماء (2):</strong> Al-Burūj, Aṭ-Ṭāriq</li>
        <li><strong>طسم (2):</strong> Ash-Shu‘arā’, Al-Qaṣaṣ</li>
        <li><strong>يسبح (2):</strong> Al-Jumu‘ah, At-Taghābun</li>
        <li><strong>لا (2):</strong> Al-Qiyāmah, Al-Balad</li>
      </ul>

      <h3>7 Surahs Beginning with حم</h3>
      <p>1. Ghāfir, 2. Fuṣṣilat, 3. Ash‑Shūrā, 4. Az‑Zukhruf, 5. Ad‑Dukhān, 6. Al‑Jāthiyah, 7. Al‑Aḥqāf</p>
      <p><strong>Important Rule:</strong> The seven Ḥā‑Mīm Surahs come consecutively in the Qur’an.</p>
    `,
    cards: [
      { front: "Name the seven Surahs beginning with حم.", back: "1. Ghāfir\n2. Fuṣṣilat\n3. Ash‑Shūrā\n4. Az‑Zukhruf\n5. Ad‑Dukhān\n6. Al‑Jāthiyah\n7. Al‑Aḥqāf" },
      { front: "Which Surahs begin with الٓر?", back: "1. Yūnus\n2. Hūd\n3. Yūsuf\n4. Ibrāhīm\n5. Al‑Ḥijr" },
      { front: "Which Surahs begin with هل?", back: "1. Al‑Insān\n2. Al‑Ghāshiyah" },
      { front: "Which Surahs start with يسبح?", back: "1. Al‑Jumu‘ah\n2. At‑Taghābun" },
      { front: "Which Surahs open with تبارك?", back: "1. Al‑Furqān\n2. Al‑Mulk" },
      { front: "Which two Surahs begin with لا?", back: "1. Al‑Qiyāmah\n2. Al‑Balad" },
      { front: "Which two Surahs begin with طسم?", back: "1. Ash‑Shu‘arā’\n2. Al‑Qaṣaṣ" },
      { front: "How many Surahs begin with يا أيها? Name the first two.", back: "10 Surahs.\n1. An-Nisā’\n2. Al-Mā’idah" },
      { front: "Memory Pattern for الٓمٓ: Which are Madinan and which are Makkan?", back: "Madinan: Al-Baqarah, Āl ’Imrān\nMakkan: Al-’Ankabūt, Ar-Rūm, Luqmān, As-Sajdah" }
    ]
  },
  {
    id: 2,
    title: "Category 2: Verses Appearing Only Twice",
    study: `
      <p>This category focuses on rare repeated phrases. These phrases are powerful anchors for recognition memory, Surah linking, and Mutashābihāt precision. Each phrase appears exactly twice in the Qur’an.</p>
      <ul>
        <li><strong>وَمَا أَهْلَكْنَا مِن قَرْيَةٍ:</strong> Al‑Ḥijr & Ash‑Shu‘arā’</li>
        <li><strong>فَبِئْسَ مَثْوَى الْمُتَكَبِّرِينَ:</strong> Az‑Zumar & Ghāfir</li>
        <li><strong>أَصْحَابُ الرَّسِّ:</strong> Al‑Furqān & Qāf</li>
        <li><strong>أَفْرِغْ عَلَيْنَا صَبْرًا:</strong> Al‑Baqarah & Al‑A‘rāf</li>
        <li><strong>إِنَّا أَرْسَلْنَاكَ شَاهِدًا:</strong> Al‑Aḥzāb & Al‑Fatḥ</li>
        <li><strong>أَلَمْ يَرَوْا كَمْ أَهْلَكْنَا:</strong> Al‑An‘ām & Yā Sīn</li>
        <li><strong>وَمَا تُنفِقُوا مِن شَيْءٍ:</strong> Āl ’Imrān & Al‑Anfāl</li>
        <li><strong>وَلَكِنَّ أَكْثَرَهُمْ لَا يَشْكُرُونَ:</strong> Yūnus & An‑Naml</li>
        <li><strong>ذَلِكَ مِنْ أَنبَاءِ الْغَيْبِ:</strong> Āl ’Imrān & Yūsuf</li>
        <li><strong>يَسْأَلُونَكَ عَنِ السَّاعَةِ:</strong> Al‑A‘rāf & An‑Nāzi‘āt</li>
        <li><strong>وَهُوَ اللَّطِيفُ الْخَبِيرُ:</strong> Al‑An‘ām & Al‑Mulk</li>
        <li><strong>فَهَلْ أَنتُم مُّسْلِمُونَ:</strong> Hūd & Al‑Anbiyā’</li>
        <li><strong>إِنَّ الْأَبْرَارَ لَفِي نَعِيمٍ:</strong> Al‑Infiṭār & Al‑Muṭaffifīn</li>
        <li><strong>وَمَا مِن دَابَّةٍ:</strong> Al‑An‘ām & Hūd</li>
        <li><strong>إِنَّ هَذَا الْقُرْآنَ:</strong> Al‑Isrā’ & An‑Naml</li>
        <li><strong>إِنَّهُ لَكَبِيرُكُمُ:</strong> Ṭā‑Hā & Ash‑Shu‘arā’</li>
      </ul>
    `,
    cards: [
      { front: "Where does “إِنَّهُ لَكَبِيرُكُمُ” appear?", back: "1. Ṭā‑Hā\n2. Ash‑Shu‘arā’" },
      { front: "Which phrase appears in Al‑Infiṭār and Al‑Muṭaffifīn?", back: "إِنَّ الْأَبْرَارَ لَفِي نَعِيمٍ" },
      { front: "Which two Surahs contain “أَصْحَابُ الرَّسِّ”?", back: "1. Al‑Furqān\n2. Qāf" },
      { front: "Where does يَسْأَلُونَكَ عَنِ السَّاعَةِ appear?", back: "1. Al‑A‘rāf\n2. An‑Nāzi‘āت" },
      { front: "Which phrase appears in Āl ’Imrān and Al‑Anfāl?", back: "وَمَا تُنفِقُوا مِن شَيْءٍ" },
      { front: "Where does وَهُوَ اللَّطِيفُ الْخَبِيرُ appear?", back: "1. Al‑An‘ām\n2. Al‑Mulk" },
      { front: "Which two Surahs contain فَهَلْ أَنتُم مُّسْلِمُونَ?", back: "1. Hūd\n2. Al‑Anbiyā’" }
    ]
  },
  {
    id: 3,
    title: "Category 3: Mnemonics & Memory Systems",
    study: `
      <h3>“Travel Through the Earth” Mnemonic</h3>
      <p><strong>Verse:</strong> أفلم يسيروا في الأرض</p>
      <p><strong>Mnemonic:</strong> غفر الله للحج محمد يوسف</p>
      <p>The mnemonic identifies the four Surahs containing the verse:</p>
      <ol>
        <li>Ghāfir</li>
        <li>Al‑Ḥajj</li>
        <li>Muḥammad</li>
        <li>Yūsuf</li>
      </ol>

      <h3>Singular vs Plural Fruit Rule</h3>
      <p><strong>Core Rule:</strong> If the Surah name is singular → <strong>فاكهة</strong>. If the Surah name is plural → <strong>فواكه</strong>.</p>
      <p><strong>Singular Examples:</strong> Yā Sīn, Ṣād, Az‑Zukhr43, Ad‑Dukhān, Aṭ‑Ṭūr, Ar‑Raḥmān, Al‑Wāqi‘ah, ’Abasa</p>
      <p><strong>Plural Examples:</strong> Al‑Mu’minūn, Aṣ‑Ṣaffāt, Al‑Mursalāt</p>

      <h3>Sabbaha vs Yusabbihu Rule</h3>
      <p><strong>Core Rule:</strong> Check the first letter of the Surah name. If the first letter has NO dots → <strong>سبح</strong>. If the first letter HAS dots → <strong>يسبح</strong>.</p>
      <p><strong>No Dots Example:</strong> Al‑Ḥadīd → سبح</p>
      <p><strong>With Dots Example:</strong> At‑Taghābun → يسبح</p>

      <h3>رجل and القسط Placement Rule</h3>
      <p><strong>رجل Rule:</strong> Al‑Qaṣaṣ (The word رجل enters early). Yā Sīn (The word رجل appears later).</p>
      <p><strong>القسط Rule:</strong> An‑Nisā’ (القسط appears earlier). Al‑Mā’idah (القسط appears later).</p>
    `,
    cards: [
      { front: "What does “غفر الله للحج محمد يوسف” refer to?", back: "The 4 Surahs containing أفلم يسيروا في الأرض:\n1. Ghāfir\n2. Al‑Ḥajj\n3. Muḥammad\n4. Yūsuf" },
      { front: "When is فواكه used?", back: "When the Surah name is Plural.\n(e.g., Al‑Mu’minūn, Aṣ‑Ṣaffāt, Al‑Mursalāt)" },
      { front: "When is فاكهة used?", back: "When the Surah name is Singular.\n(e.g., Yā Sīn, Ṣād, Ar‑Raḥmān)" },
      { front: "Which Surah uses سبح instead of يسبح?", back: "Al‑Ḥadīd\n(Because the letter Alif has no dots)" },
      { front: "In which Surah does رجل appear later?", back: "Yā Sīn\n(In Al‑Qaṣaṣ it appears early)" },
      { front: "In which Surah does القسط appear later?", back: "Al‑Mā’idah\n(In An‑Nisā’ it appears earlier)" }
    ]
  },
  {
    id: 4,
    title: "Category 4: Qur’anic Spelling Precision",
    study: `
      <h3>Open Tā’ Rule — امرأت</h3>
      <p><strong>Principle:</strong> Used when the husband is explicitly mentioned.</p>
      <ul>
        <li>امرأت عمران</li>
        <li>امرأت العزيز</li>
        <li>امرأت فرعون</li>
        <li>امرأت نوح</li>
        <li>امرأت لوط</li>
      </ul>

      <h3>Closed Tā’ Rule — امرأة</h3>
      <p><strong>Principle:</strong> Used when the husband is not mentioned.</p>
      <ul>
        <li>أو امرأة وله أخ</li>
        <li>إني وجدت امرأة تملكهم</li>
        <li>وامرأة مؤمنة</li>
      </ul>
    `,
    cards: [
      { front: "Why is “امرأت فرعون” written with open tā’?", back: "Because the husband (Pharaoh) is explicitly mentioned." },
      { front: "When is امرأة written with closed tā’?", back: "When the husband is NOT explicitly mentioned in the context." },
      { front: "Give two examples of امرأت (Open Tā’).", back: "1. امرأت عمران\n2. امرأت العزيز" },
      { front: "Give two examples of امرأة (Closed Tā’).", back: "1. أو امرأة وله أخ\n2. وامرأة مؤمنة" }
    ]
  },
  {
    id: 5,
    title: "Category 5: Alphabet Method",
    study: `
      <p>The alphabet method uses Arabic alphabetical order to distinguish similar verses.</p>
      <ul>
        <li><strong>Baqarah 2:18 vs 2:171:</strong> يرجعون vs يعقلون (ر comes before ع)</li>
        <li><strong>Baqarah 2:125 vs Al‑Ḥajj 22:26:</strong> العاكفين vs القائمين (ع comes before ق)</li>
        <li><strong>Āl ’Imrān 3:167 vs Al‑Fatḥ 48:11:</strong> بأفواههم vs بألسنتهم (ف comes before ل)</li>
        <li><strong>Al‑Ḥijr 15:73 vs 15:83:</strong> مشرقين vs مصبحين (ش comes before ص)</li>
        <li><strong>Al‑Kahf 18:71 vs 18:74:</strong> إمرا vs نكرا (ء comes before ن)</li>
        <li><strong>Al‑Ḥajj 22:28 vs 22:36:</strong> البائس vs القانع (ب comes before ق)</li>
        <li><strong>Yūsuf 12:2 vs Az‑Zukhr43 43:3:</strong> أنزلناه vs جعلناه (أ comes before ج)</li>
        <li><strong>Fuṣṣilat 41:52 vs Al‑Aḥqāf 46:10:</strong> ثم كفرتم vs وكفرتم به (ث comes before و)</li>
        <li><strong>Al‑Mujādilah 58:4 vs 58:5:</strong> أليم vs مهين (أ comes before م)</li>
      </ul>
    `,
    cards: [
      { front: "Which comes first: مشرقين or مصبحين?", back: "مشرقين (Al-Ḥijr 15:73)\nRule: ش comes before ص" },
      { front: "Which verse contains بألسنتهم?", back: "Al‑Fatḥ 48:11\nRule: ف (Baqarah) comes before ل (Al-Fatḥ)" },
      { front: "Why does أنزلناه come before جعلناه?", back: "أ comes before ج in the Arabic alphabet." },
      { front: "Which comes first: البائس or القانع?", back: "البائس (Al-Ḥajj 22:28)\nRule: ب comes before ق" },
      { front: "Which comes first: إمرا or نكرا?", back: "إمرا (Al-Kahf 18:71)\nRule: ء comes before ن" }
    ]
  },
  {
    id: 6,
    title: "Category 6: Sūrah Ar‑Raḥmān Sequence",
    study: `
      <p>This system memorises every verse following <strong>فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ</strong> using one master mnemonic.</p>
      
      <h3>Master Mnemonic</h3>
      <p style={{fontSize: '20px', fontWeight: 'bold', color: '#004D40', textAlign: 'center', margin: '20px 0'}}>خِرْمِي وَكَيْسِي يَفَّ فِيْهِ وَذَفَّ فَمُفَكَّهُ وَمُفَفَّفُ حَلُمَتْ</p>

      <h3>Verse Mapping</h3>
      <ul>
        <li><strong>خ</strong> → خلق الانسان من صلصال كالفخار</li>
        <li><strong>ر</strong> → رب المشرقين ورب المغربين</li>
        <li><strong>م</strong> → مرج البحرين يلتقيان</li>
        <li><strong>ي</strong> → يخرج منهما اللؤلؤ والمرجان</li>
        <li><strong>و</strong> → وله الجوار المنشآت</li>
        <li><strong>ك</strong> → كل من عليها فان</li>
        <li><strong>ي</strong> → يسئله من في السماوات والارض</li>
        <li><strong>س</strong> → سنفرغ لكم أيها الثقلان</li>
        <li><strong>ي</strong> → يا معشر الجن والانس</li>
        <li><strong>ي</strong> → يرسل عليكما شواظ من نار</li>
        <li><strong>ف</strong> → فإذا انشقت السماء</li>
        <li><strong>ف</strong> → فيومئذ لا يسأل</li>
        <li><strong>ي</strong> → يعرف المجرمون بسيماهم</li>
        <li><strong>هـ</strong> → هذه جهنم</li>
        <li><strong>و</strong> → ولمن خاف مقام ربه جنتان</li>
        <li><strong>ذ</strong> → ذواتا أفنان</li>
        <li><strong>ف</strong> → فيهما عينان تجريان</li>
        <li><strong>ف</strong> → فيهما من كل فاكهة زوجان</li>
        <li><strong>م</strong> → متكئين على فرش</li>
        <li><strong>ف</strong> → فيهن قاصرات الطرف</li>
        <li><strong>ك</strong> → كأنهن الياقوت والمرجان</li>
        <li><strong>هـ</strong> → هل جزاء الاحسان الا الاحسان</li>
        <li><strong>و</strong> → ومن دونهما جنتان</li>
        <li><strong>م</strong> → مدهامتان</li>
        <li><strong>ف</strong> → فيهما عينان نضاختان</li>
        <li><strong>ف</strong> → فيهما فاكهة ونخل ورمان</li>
        <li><strong>ف</strong> -> فيهن خيرات حسان</li>
        <li><strong>ح</strong> → حور مقصورات في الخيام</li>
        <li><strong>ل</strong> → لم يطمثهن انس قبلهم</li>
        <li><strong>م</strong> → متكئين على رفرف خضر</li>
        <li><strong>ت</strong> → تبارك اسم ربك</li>
      </ul>
    `,
    cards: [
      { front: "Which mnemonic letter represents “مرج البحرين”?", back: "م (Meem)" },
      { front: "What follows the mnemonic letter س?", back: "سنفرغ لكم أيها الثقلان" },
      { front: "Which verse corresponds to the letter ت?", back: "تبارك اسم ربك" },
      { front: "What is the Master Mnemonic for Surah Ar-Rahman?", back: "خِرْمِي وَكَيْسِي يَفَّ فِيْهِ وَذَفَّ فَمُفَكَّهُ وَمُفَفَّفُ حَلُمَتْ" },
      { front: "Which verse corresponds to the letter ك in the middle of the mnemonic?", back: "كأنهن الياقوت والمرجان" }
    ]
  },
  {
    id: 7,
    title: "Category 7: Inheritance Verses (Mawārīth)",
    study: `
      <p>This category focuses on inheritance verse patterns in Sūrah An‑Nisā’.</p>
      
      <h3>Core Rule</h3>
      <p>Any inheritance verse containing <strong>ث</strong> is followed by <strong>ثلث</strong> (One-Third).</p>
      
      <h3>Examples</h3>
      <ul>
        <li><strong>4:11:</strong> اثنتين → فلهن ثلثا</li>
        <li><strong>4:11:</strong> وورثه → فلأمه الثلث</li>
        <li><strong>4:12:</strong> أكثر → فهم شركاء في الثلث</li>
        <li><strong>4:176:</strong> اثنتين → فلهما الثلثان</li>
      </ul>
    `,
    cards: [
      { front: "What follows inheritance verses containing ث?", back: "ثلث (One-Third)" },
      { front: "Which verse contains “فلهما الثلثان”?", back: "An-Nisā’ 4:176" },
      { front: "What is the inheritance mnemonic rule for the letter ث?", back: "If a verse contains ث, it is followed by ثلث." }
    ]
  },
  {
    id: 8,
    title: "Category 8: Enter & Exit Systems",
    study: `
      <p>This category focuses on reversed word order in similar verses.</p>
      <ul>
        <li><strong>Shafā‘ah Pair:</strong> First starts with شفاعة ends with عدل. Second starts with عدل ends with شفاعة.</li>
        <li><strong>Sujjadan Pair:</strong> Al‑Baqarah (ادخلوا الباب سجداً وقولوا حطة) vs Al‑A‘rāف (وقولوا حطة وادخلوا الباب سجدا).</li>
        <li><strong>نفعا Pair:</strong> Al‑A‘rāf (نفعا وضرا) vs Yūnus (ضرا ونفعا).</li>
        <li><strong>نرزقكم Pair:</strong> Al‑An‘āم (نرزقكم وإياهم) vs Al‑Isrā’ (نرزقهم وإياكم).</li>
        <li><strong>الكتاب Pair:</strong> Al‑Ḥijr (الكتاب وقرآن) vs An‑Naml (القرآن وكتاب).</li>
        <li><strong>قلوبكم Pair:</strong> Āl ’Imrān (قلوبكم به) vs Al‑Anfāل (به قلوبكم).</li>
      </ul>
    `,
    cards: [
      { front: "Which Surah reverses “حطة” and “سجداً”?", back: "Al‑A‘rāf\n(Baqarah: سجداً ثم حطة)\n(A'raf: حطة ثم سجداً)" },
      { front: "Which Surah says نرزقكم وإياهم?", back: "Al‑An‘āم\n(Al-Isrā’ reverses it to نرزقهم وإياكم)" },
      { front: "Which Surah says به قلوبكم instead of قلوبكم به?", back: "Al‑Anfāl\n(Āl ’Imrān says قلوبكم به)" },
      { front: "In the Shafa'ah pair, what word do they both share in the middle?", back: "ولا يؤخذ منها" }
    ]
  },
  {
    id: 9,
    title: "Category 9: Narrative Variations",
    study: `
      <h3>إلا إبليس Variations</h3>
      <ul>
        <li><strong>Al‑Baqarah:</strong> أبى واستكبر</li>
        <li><strong>Al‑A‘rāf:</strong> لم يكن</li>
        <li><strong>Al‑Ḥijr:</strong> أبى أن يكون</li>
        <li><strong>Al‑Kahf:</strong> كان من الجن</li>
        <li><strong>Ṭā‑Hā:</strong> أبى</li>
        <li><strong>Ṣād:</strong> استكبر</li>
      </ul>

      <h3>وإذ قلنا للملائكة Variations</h3>
      <ul>
        <li><strong>وإذ قلنا للملائكة:</strong> Al‑Baqarah, Al‑Isrā’, Al‑Kahf, Ṭā‑Hā</li>
        <li><strong>إذ قال ربك:</strong> Al‑Baqarah, Al‑Ḥijr</li>
        <li><strong>ثم قلنا:</strong> Al‑A‘rāf</li>
        <li><strong>إذ قال ربك:</strong> Ṣād</li>
      </ul>
    `,
    cards: [
      { front: "Which Surah contains “أبى أن يكون”?", back: "Al‑Ḥijr" },
      { front: "Which Surah uses “ثم قلنا” for the angels?", back: "Al‑A‘rāf" },
      { front: "Which Surah says “كان من الجن” regarding Iblis?", back: "Al‑Kahf" },
      { front: "Which Surahs use “وإذ قلنا للملائكة”?", back: "1. Al‑Baqarah\n2. Al‑Isrā’\n3. Al‑Kahf\n4. Ṭā‑Hā" },
      { front: "What are the exact two words used for Iblis in Al-Baqarah?", back: "أبى واستكبر" }
    ]
  }
];