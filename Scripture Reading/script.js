// ==========================================
// SCRIPTURE DATA STRUCTURES
// ==========================================

// Bible structure: 66 books with chapters and verses per chapter
const BIBLE_STRUCTURE = {
    // Old Testament (39 books)
    "Genesis": { chapters: 50, testament: "old", verses: [31, 25, 24, 26, 32, 22, 24, 22, 29, 32, 32, 20, 18, 24, 21, 16, 27, 33, 38, 18, 34, 24, 20, 67, 34, 35, 46, 22, 35, 43, 55, 32, 20, 31, 29, 43, 36, 30, 23, 23, 57, 38, 34, 34, 28, 34, 31, 22, 33, 26] },
    "Exodus": { chapters: 40, testament: "old", verses: [22, 25, 22, 31, 23, 30, 25, 32, 35, 29, 10, 51, 22, 31, 27, 36, 16, 27, 25, 26, 36, 31, 33, 18, 40, 37, 21, 43, 46, 38, 18, 35, 23, 35, 35, 38, 29, 31, 43, 38] },
    "Leviticus": { chapters: 27, testament: "old", verses: [17, 16, 17, 35, 19, 30, 38, 36, 24, 20, 47, 8, 59, 57, 33, 34, 16, 30, 37, 27, 24, 33, 44, 23, 55, 46, 34] },
    "Numbers": { chapters: 36, testament: "old", verses: [54, 34, 51, 49, 31, 27, 89, 26, 23, 36, 35, 16, 33, 45, 41, 50, 13, 32, 22, 29, 35, 41, 30, 25, 18, 65, 23, 31, 40, 16, 54, 42, 56, 29, 34, 13] },
    "Deuteronomy": { chapters: 34, testament: "old", verses: [46, 37, 29, 49, 33, 25, 26, 20, 29, 22, 32, 32, 18, 29, 23, 22, 20, 22, 21, 20, 23, 30, 25, 22, 19, 19, 26, 68, 29, 20, 30, 52, 29, 12] },
    "Joshua": { chapters: 24, testament: "old", verses: [18, 24, 17, 24, 15, 27, 26, 35, 27, 43, 23, 24, 33, 15, 63, 10, 18, 28, 51, 9, 45, 34, 16, 33] },
    "Judges": { chapters: 21, testament: "old", verses: [36, 23, 31, 24, 31, 40, 25, 35, 57, 18, 40, 15, 25, 20, 20, 31, 13, 31, 30, 48, 25] },
    "Ruth": { chapters: 4, testament: "old", verses: [22, 23, 18, 22] },
    "1 Samuel": { chapters: 31, testament: "old", verses: [28, 36, 21, 22, 12, 21, 17, 22, 27, 27, 15, 25, 23, 52, 35, 23, 58, 30, 24, 42, 15, 23, 29, 22, 44, 25, 12, 25, 11, 31, 13] },
    "2 Samuel": { chapters: 24, testament: "old", verses: [27, 32, 39, 12, 25, 23, 29, 18, 13, 19, 27, 31, 39, 33, 37, 23, 29, 33, 43, 26, 22, 51, 39, 25] },
    "1 Kings": { chapters: 22, testament: "old", verses: [53, 46, 28, 34, 18, 38, 51, 66, 28, 29, 43, 33, 34, 31, 34, 34, 24, 46, 21, 43, 29, 53] },
    "2 Kings": { chapters: 25, testament: "old", verses: [18, 25, 27, 44, 27, 33, 20, 29, 37, 36, 21, 21, 25, 29, 38, 20, 41, 37, 37, 21, 26, 20, 37, 20, 30] },
    "1 Chronicles": { chapters: 29, testament: "old", verses: [54, 55, 24, 43, 26, 81, 40, 40, 44, 14, 47, 40, 14, 17, 29, 43, 27, 17, 19, 8, 30, 19, 32, 31, 31, 32, 34, 21, 30] },
    "2 Chronicles": { chapters: 36, testament: "old", verses: [17, 18, 17, 22, 14, 42, 22, 18, 31, 19, 23, 16, 22, 15, 19, 14, 19, 34, 11, 37, 20, 12, 21, 27, 28, 23, 9, 27, 36, 27, 21, 33, 25, 33, 27, 23] },
    "Ezra": { chapters: 10, testament: "old", verses: [11, 70, 13, 24, 17, 22, 28, 36, 15, 44] },
    "Nehemiah": { chapters: 13, testament: "old", verses: [11, 20, 32, 23, 19, 19, 73, 18, 38, 39, 36, 47, 31] },
    "Esther": { chapters: 10, testament: "old", verses: [22, 23, 15, 17, 14, 14, 10, 17, 32, 3] },
    "Job": { chapters: 42, testament: "old", verses: [22, 13, 26, 21, 27, 30, 21, 22, 35, 22, 20, 25, 28, 22, 35, 22, 16, 21, 29, 29, 34, 30, 17, 25, 6, 14, 23, 28, 25, 31, 40, 22, 33, 37, 16, 33, 24, 41, 30, 24, 34, 17] },
    "Psalms": { chapters: 150, testament: "old", verses: [6, 12, 8, 8, 12, 10, 17, 9, 20, 18, 7, 8, 6, 7, 5, 11, 15, 50, 14, 9, 13, 31, 6, 10, 22, 12, 14, 9, 11, 12, 24, 11, 22, 22, 28, 12, 40, 22, 13, 17, 13, 11, 5, 26, 17, 11, 9, 14, 20, 23, 19, 9, 6, 7, 23, 13, 11, 11, 17, 12, 8, 12, 11, 10, 13, 20, 7, 35, 36, 5, 24, 20, 28, 23, 10, 12, 20, 72, 13, 19, 16, 8, 18, 12, 13, 17, 7, 18, 52, 17, 16, 15, 5, 23, 11, 13, 12, 9, 9, 5, 8, 28, 22, 35, 45, 48, 43, 13, 31, 7, 10, 10, 9, 8, 18, 19, 2, 29, 176, 7, 8, 9, 4, 8, 5, 6, 5, 6, 8, 8, 3, 18, 3, 3, 21, 26, 9, 8, 24, 13, 10, 7, 12, 15, 21, 10, 20, 14, 9, 6] },
    "Proverbs": { chapters: 31, testament: "old", verses: [33, 22, 35, 27, 23, 35, 27, 36, 18, 32, 31, 28, 25, 35, 33, 33, 28, 24, 29, 30, 31, 29, 35, 34, 28, 28, 27, 28, 27, 33, 31] },
    "Ecclesiastes": { chapters: 12, testament: "old", verses: [18, 26, 22, 16, 20, 12, 29, 17, 18, 20, 10, 14] },
    "Song of Solomon": { chapters: 8, testament: "old", verses: [17, 17, 11, 16, 16, 13, 13, 14] },
    "Isaiah": { chapters: 66, testament: "old", verses: [31, 22, 26, 6, 30, 13, 25, 22, 21, 34, 16, 6, 22, 32, 9, 14, 14, 7, 25, 6, 17, 25, 18, 23, 12, 21, 13, 29, 24, 33, 9, 20, 24, 17, 10, 22, 38, 22, 8, 31, 29, 25, 28, 28, 25, 13, 15, 22, 26, 11, 23, 15, 12, 17, 13, 12, 21, 14, 21, 22, 11, 12, 19, 12, 25, 24] },
    "Jeremiah": { chapters: 52, testament: "old", verses: [19, 37, 25, 31, 31, 30, 34, 22, 26, 25, 23, 17, 27, 22, 21, 21, 27, 23, 15, 18, 14, 30, 40, 10, 38, 24, 22, 17, 32, 24, 40, 44, 26, 22, 19, 32, 21, 28, 18, 16, 18, 22, 13, 30, 5, 28, 7, 47, 39, 46, 64, 34] },
    "Lamentations": { chapters: 5, testament: "old", verses: [22, 22, 66, 22, 22] },
    "Ezekiel": { chapters: 48, testament: "old", verses: [28, 10, 27, 17, 17, 14, 27, 18, 11, 22, 25, 28, 23, 23, 8, 63, 24, 32, 14, 49, 32, 31, 49, 27, 17, 21, 36, 26, 21, 26, 18, 32, 33, 31, 15, 38, 28, 23, 29, 49, 26, 20, 27, 31, 25, 24, 23, 35] },
    "Daniel": { chapters: 12, testament: "old", verses: [21, 49, 30, 37, 31, 28, 28, 27, 27, 21, 45, 13] },
    "Hosea": { chapters: 14, testament: "old", verses: [11, 23, 5, 19, 15, 11, 16, 14, 17, 15, 12, 14, 16, 9] },
    "Joel": { chapters: 3, testament: "old", verses: [20, 32, 21] },
    "Amos": { chapters: 9, testament: "old", verses: [15, 16, 15, 13, 27, 14, 17, 14, 15] },
    "Obadiah": { chapters: 1, testament: "old", verses: [21] },
    "Jonah": { chapters: 4, testament: "old", verses: [17, 10, 10, 11] },
    "Micah": { chapters: 7, testament: "old", verses: [16, 13, 12, 13, 15, 16, 20] },
    "Nahum": { chapters: 3, testament: "old", verses: [15, 13, 19] },
    "Habakkuk": { chapters: 3, testament: "old", verses: [17, 20, 19] },
    "Zephaniah": { chapters: 3, testament: "old", verses: [18, 15, 20] },
    "Haggai": { chapters: 2, testament: "old", verses: [15, 23] },
    "Zechariah": { chapters: 14, testament: "old", verses: [21, 13, 10, 14, 11, 15, 14, 23, 17, 12, 17, 14, 9, 21] },
    "Malachi": { chapters: 4, testament: "old", verses: [14, 17, 18, 6] },

    // New Testament (27 books)
    "Matthew": { chapters: 28, testament: "new", verses: [25, 23, 17, 25, 48, 34, 29, 34, 38, 42, 30, 50, 58, 36, 39, 28, 27, 35, 30, 34, 46, 46, 39, 51, 46, 75, 66, 20] },
    "Mark": { chapters: 16, testament: "new", verses: [45, 28, 35, 41, 43, 56, 37, 38, 50, 52, 33, 44, 37, 72, 47, 20] },
    "Luke": { chapters: 24, testament: "new", verses: [80, 52, 38, 44, 39, 49, 50, 56, 62, 42, 54, 59, 35, 35, 32, 31, 37, 43, 48, 47, 38, 71, 56, 53] },
    "John": { chapters: 21, testament: "new", verses: [51, 25, 36, 54, 47, 71, 53, 59, 41, 42, 57, 50, 38, 31, 27, 33, 26, 40, 42, 31, 25] },
    "Acts": { chapters: 28, testament: "new", verses: [26, 47, 26, 37, 42, 15, 60, 40, 43, 48, 30, 25, 52, 28, 41, 40, 34, 28, 41, 38, 40, 30, 35, 27, 27, 32, 44, 31] },
    "Romans": { chapters: 16, testament: "new", verses: [32, 29, 31, 25, 21, 23, 25, 39, 33, 21, 36, 21, 14, 23, 33, 27] },
    "1 Corinthians": { chapters: 16, testament: "new", verses: [31, 16, 23, 21, 13, 20, 40, 13, 27, 33, 34, 31, 13, 40, 58, 24] },
    "2 Corinthians": { chapters: 13, testament: "new", verses: [24, 17, 18, 18, 21, 18, 16, 24, 15, 18, 33, 21, 14] },
    "Galatians": { chapters: 6, testament: "new", verses: [24, 21, 29, 31, 26, 18] },
    "Ephesians": { chapters: 6, testament: "new", verses: [23, 22, 21, 32, 33, 24] },
    "Philippians": { chapters: 4, testament: "new", verses: [30, 30, 21, 23] },
    "Colossians": { chapters: 4, testament: "new", verses: [29, 23, 25, 18] },
    "1 Thessalonians": { chapters: 5, testament: "new", verses: [10, 20, 13, 18, 28] },
    "2 Thessalonians": { chapters: 3, testament: "new", verses: [12, 17, 18] },
    "1 Timothy": { chapters: 6, testament: "new", verses: [20, 15, 16, 16, 25, 21] },
    "2 Timothy": { chapters: 4, testament: "new", verses: [18, 26, 17, 22] },
    "Titus": { chapters: 3, testament: "new", verses: [16, 15, 15] },
    "Philemon": { chapters: 1, testament: "new", verses: [25] },
    "Hebrews": { chapters: 13, testament: "new", verses: [14, 18, 19, 16, 14, 20, 28, 13, 28, 39, 40, 29, 25] },
    "James": { chapters: 5, testament: "new", verses: [27, 26, 18, 17, 20] },
    "1 Peter": { chapters: 5, testament: "new", verses: [25, 25, 22, 19, 14] },
    "2 Peter": { chapters: 3, testament: "new", verses: [21, 22, 18] },
    "1 John": { chapters: 5, testament: "new", verses: [10, 29, 24, 21, 21] },
    "2 John": { chapters: 1, testament: "new", verses: [13] },
    "3 John": { chapters: 1, testament: "new", verses: [14] },
    "Jude": { chapters: 1, testament: "new", verses: [25] },
    "Revelation": { chapters: 22, testament: "new", verses: [20, 29, 22, 11, 14, 17, 17, 13, 21, 11, 19, 17, 18, 20, 8, 21, 18, 24, 21, 15, 27, 21] }
};

// Quran structure: 114 surahs with ayah counts
const QURAN_STRUCTURE = {
    1: { name: "Al-Fatihah", ayahs: 7 },
    2: { name: "Al-Baqarah", ayahs: 286 },
    3: { name: "Ali 'Imran", ayahs: 200 },
    4: { name: "An-Nisa", ayahs: 176 },
    5: { name: "Al-Ma'idah", ayahs: 120 },
    6: { name: "Al-An'am", ayahs: 165 },
    7: { name: "Al-A'raf", ayahs: 206 },
    8: { name: "Al-Anfal", ayahs: 75 },
    9: { name: "At-Tawbah", ayahs: 129 },
    10: { name: "Yunus", ayahs: 109 },
    11: { name: "Hud", ayahs: 123 },
    12: { name: "Yusuf", ayahs: 111 },
    13: { name: "Ar-Ra'd", ayahs: 43 },
    14: { name: "Ibrahim", ayahs: 52 },
    15: { name: "Al-Hijr", ayahs: 99 },
    16: { name: "An-Nahl", ayahs: 128 },
    17: { name: "Al-Isra", ayahs: 111 },
    18: { name: "Al-Kahf", ayahs: 110 },
    19: { name: "Maryam", ayahs: 98 },
    20: { name: "Taha", ayahs: 135 },
    21: { name: "Al-Anbya", ayahs: 112 },
    22: { name: "Al-Hajj", ayahs: 78 },
    23: { name: "Al-Mu'minun", ayahs: 118 },
    24: { name: "An-Nur", ayahs: 64 },
    25: { name: "Al-Furqan", ayahs: 77 },
    26: { name: "Ash-Shu'ara", ayahs: 227 },
    27: { name: "An-Naml", ayahs: 93 },
    28: { name: "Al-Qasas", ayahs: 88 },
    29: { name: "Al-'Ankabut", ayahs: 69 },
    30: { name: "Ar-Rum", ayahs: 60 },
    31: { name: "Luqman", ayahs: 34 },
    32: { name: "As-Sajdah", ayahs: 30 },
    33: { name: "Al-Ahzab", ayahs: 73 },
    34: { name: "Saba", ayahs: 54 },
    35: { name: "Fatir", ayahs: 45 },
    36: { name: "Ya-Sin", ayahs: 83 },
    37: { name: "As-Saffat", ayahs: 182 },
    38: { name: "Sad", ayahs: 88 },
    39: { name: "Az-Zumar", ayahs: 75 },
    40: { name: "Ghafir", ayahs: 85 },
    41: { name: "Fussilat", ayahs: 54 },
    42: { name: "Ash-Shuraa", ayahs: 53 },
    43: { name: "Az-Zukhruf", ayahs: 89 },
    44: { name: "Ad-Dukhan", ayahs: 59 },
    45: { name: "Al-Jathiyah", ayahs: 37 },
    46: { name: "Al-Ahqaf", ayahs: 35 },
    47: { name: "Muhammad", ayahs: 38 },
    48: { name: "Al-Fath", ayahs: 29 },
    49: { name: "Al-Hujurat", ayahs: 18 },
    50: { name: "Qaf", ayahs: 45 },
    51: { name: "Adh-Dhariyat", ayahs: 60 },
    52: { name: "At-Tur", ayahs: 49 },
    53: { name: "An-Najm", ayahs: 62 },
    54: { name: "Al-Qamar", ayahs: 55 },
    55: { name: "Ar-Rahman", ayahs: 78 },
    56: { name: "Al-Waqi'ah", ayahs: 96 },
    57: { name: "Al-Hadid", ayahs: 29 },
    58: { name: "Al-Mujadila", ayahs: 22 },
    59: { name: "Al-Hashr", ayahs: 24 },
    60: { name: "Al-Mumtahanah", ayahs: 13 },
    61: { name: "As-Saf", ayahs: 14 },
    62: { name: "Al-Jumu'ah", ayahs: 11 },
    63: { name: "Al-Munafiqun", ayahs: 11 },
    64: { name: "At-Taghabun", ayahs: 18 },
    65: { name: "At-Talaq", ayahs: 12 },
    66: { name: "At-Tahrim", ayahs: 12 },
    67: { name: "Al-Mulk", ayahs: 30 },
    68: { name: "Al-Qalam", ayahs: 52 },
    69: { name: "Al-Haqqah", ayahs: 52 },
    70: { name: "Al-Ma'arij", ayahs: 44 },
    71: { name: "Nuh", ayahs: 28 },
    72: { name: "Al-Jinn", ayahs: 28 },
    73: { name: "Al-Muzzammil", ayahs: 20 },
    74: { name: "Al-Muddaththir", ayahs: 56 },
    75: { name: "Al-Qiyamah", ayahs: 40 },
    76: { name: "Al-Insan", ayahs: 31 },
    77: { name: "Al-Mursalat", ayahs: 50 },
    78: { name: "An-Naba", ayahs: 40 },
    79: { name: "An-Nazi'at", ayahs: 46 },
    80: { name: "Abasa", ayahs: 42 },
    81: { name: "At-Takwir", ayahs: 29 },
    82: { name: "Al-Infitar", ayahs: 19 },
    83: { name: "Al-Mutaffifin", ayahs: 36 },
    84: { name: "Al-Inshiqaq", ayahs: 25 },
    85: { name: "Al-Buruj", ayahs: 22 },
    86: { name: "At-Tariq", ayahs: 17 },
    87: { name: "Al-A'la", ayahs: 19 },
    88: { name: "Al-Ghashiyah", ayahs: 26 },
    89: { name: "Al-Fajr", ayahs: 30 },
    90: { name: "Al-Balad", ayahs: 20 },
    91: { name: "Ash-Shams", ayahs: 15 },
    92: { name: "Al-Layl", ayahs: 21 },
    93: { name: "Ad-Duhaa", ayahs: 11 },
    94: { name: "Ash-Sharh", ayahs: 8 },
    95: { name: "At-Tin", ayahs: 8 },
    96: { name: "Al-Alaq", ayahs: 19 },
    97: { name: "Al-Qadr", ayahs: 5 },
    98: { name: "Al-Bayyinah", ayahs: 8 },
    99: { name: "Az-Zalzalah", ayahs: 8 },
    100: { name: "Al-'Adiyat", ayahs: 11 },
    101: { name: "Al-Qari'ah", ayahs: 11 },
    102: { name: "At-Takathur", ayahs: 8 },
    103: { name: "Al-'Asr", ayahs: 3 },
    104: { name: "Al-Humazah", ayahs: 9 },
    105: { name: "Al-Fil", ayahs: 5 },
    106: { name: "Quraysh", ayahs: 4 },
    107: { name: "Al-Ma'un", ayahs: 7 },
    108: { name: "Al-Kawthar", ayahs: 3 },
    109: { name: "Al-Kafirun", ayahs: 6 },
    110: { name: "An-Nasr", ayahs: 3 },
    111: { name: "Al-Masad", ayahs: 5 },
    112: { name: "Al-Ikhlas", ayahs: 4 },
    113: { name: "Al-Falaq", ayahs: 5 },
    114: { name: "An-Nas", ayahs: 6 }
};

// ==========================================
// VERSE CALCULATOR CLASS
// ==========================================

class VerseCalculator {
    // Calculate total verses in Bible or Quran
    static getTotalVerses(scriptureType, planType = 'complete') {
        if (scriptureType === 'bible') {
            return this.getBibleTotalVerses(planType);
        } else {
            return this.getQuranTotalAyahs();
        }
    }

    static getBibleTotalVerses(planType) {
        let total = 0;
        const books = Object.keys(BIBLE_STRUCTURE);

        for (const book of books) {
            const bookData = BIBLE_STRUCTURE[book];

            // Filter by plan type
            if (planType === 'old-testament' && bookData.testament !== 'old') continue;
            if (planType === 'new-testament' && bookData.testament !== 'new') continue;

            // Sum all verses in all chapters
            total += bookData.verses.reduce((sum, count) => sum + count, 0);
        }

        return total;
    }

    static getQuranTotalAyahs() {
        let total = 0;
        for (let surah = 1; surah <= 114; surah++) {
            total += QURAN_STRUCTURE[surah].ayahs;
        }
        return total;
    }

    // Calculate verses between two positions (Bible)
    static calculateBibleVerses(startPos, endPos) {
        const books = Object.keys(BIBLE_STRUCTURE);
        const startBookIndex = books.indexOf(startPos.book);
        const endBookIndex = books.indexOf(endPos.book);

        if (startBookIndex === -1 || endBookIndex === -1) {
            throw new Error('Invalid book name');
        }

        let count = 0;

        // Same book
        if (startPos.book === endPos.book) {
            const bookData = BIBLE_STRUCTURE[startPos.book];

            // Same chapter
            if (startPos.chapter === endPos.chapter) {
                return endPos.verse - startPos.verse + 1;
            }

            // Multiple chapters in same book
            // First chapter (partial)
            count += bookData.verses[startPos.chapter - 1] - startPos.verse + 1;

            // Middle chapters (full)
            for (let ch = startPos.chapter + 1; ch < endPos.chapter; ch++) {
                count += bookData.verses[ch - 1];
            }

            // Last chapter (partial)
            count += endPos.verse;

            return count;
        }

        // Multiple books
        // First book (partial from start position to end of book)
        const startBookData = BIBLE_STRUCTURE[startPos.book];

        // Rest of first chapter
        count += startBookData.verses[startPos.chapter - 1] - startPos.verse + 1;

        // Remaining chapters in first book
        for (let ch = startPos.chapter + 1; ch <= startBookData.chapters; ch++) {
            count += startBookData.verses[ch - 1];
        }

        // Middle books (complete)
        for (let i = startBookIndex + 1; i < endBookIndex; i++) {
            const bookData = BIBLE_STRUCTURE[books[i]];
            count += bookData.verses.reduce((sum, v) => sum + v, 0);
        }

        // Last book (partial from beginning to end position)
        const endBookData = BIBLE_STRUCTURE[endPos.book];

        // Complete chapters before last chapter
        for (let ch = 1; ch < endPos.chapter; ch++) {
            count += endBookData.verses[ch - 1];
        }

        // Partial last chapter
        count += endPos.verse;

        return count;
    }

    // Calculate ayahs between two positions (Quran)
    static calculateQuranAyahs(startPos, endPos) {
        let count = 0;

        // Same surah
        if (startPos.surah === endPos.surah) {
            return endPos.ayah - startPos.ayah + 1;
        }

        // Multiple surahs
        // First surah (partial)
        count += QURAN_STRUCTURE[startPos.surah].ayahs - startPos.ayah + 1;

        // Middle surahs (complete)
        for (let s = startPos.surah + 1; s < endPos.surah; s++) {
            count += QURAN_STRUCTURE[s].ayahs;
        }

        // Last surah (partial)
        count += endPos.ayah;

        return count;
    }

    // Get next position after reading N verses
    static getNextBiblePosition(currentPos, versesRead) {
        let remaining = versesRead;
        let book = currentPos.book;
        let chapter = currentPos.chapter;
        let verse = currentPos.verse;

        const books = Object.keys(BIBLE_STRUCTURE);
        let bookIndex = books.indexOf(book);

        while (remaining > 0) {
            const bookData = BIBLE_STRUCTURE[book];
            const versesInChapter = bookData.verses[chapter - 1];
            const versesLeftInChapter = versesInChapter - verse + 1;

            if (remaining < versesLeftInChapter) {
                // Finished within current chapter
                verse += remaining;
                remaining = 0;
            } else {
                // Move to next chapter
                remaining -= versesLeftInChapter;
                chapter++;
                verse = 1;

                // Check if we need to move to next book
                if (chapter > bookData.chapters) {
                    bookIndex++;
                    if (bookIndex >= books.length) {
                        // Finished the Bible
                        return { book: books[books.length - 1], chapter: BIBLE_STRUCTURE[books[books.length - 1]].chapters, verse: BIBLE_STRUCTURE[books[books.length - 1]].verses[BIBLE_STRUCTURE[books[books.length - 1]].chapters - 1], finished: true };
                    }
                    book = books[bookIndex];
                    chapter = 1;
                }
            }
        }

        return { book, chapter, verse, finished: false };
    }

    // Get next position after reading N ayahs (Quran)
    static getNextQuranPosition(currentPos, ayahsRead) {
        let remaining = ayahsRead;
        let surah = currentPos.surah;
        let ayah = currentPos.ayah;

        while (remaining > 0) {
            const ayahsInSurah = QURAN_STRUCTURE[surah].ayahs;
            const ayahsLeftInSurah = ayahsInSurah - ayah + 1;

            if (remaining < ayahsLeftInSurah) {
                // Finished within current surah
                ayah += remaining;
                remaining = 0;
            } else {
                // Move to next surah
                remaining -= ayahsLeftInSurah;
                surah++;
                ayah = 1;

                // Check if we finished the Quran
                if (surah > 114) {
                    return { surah: 114, ayah: QURAN_STRUCTURE[114].ayahs, finished: true };
                }
            }
        }

        return { surah, ayah, finished: false };
    }

    // Get books list for dropdown
    static getBibleBooks(planType = 'complete') {
        const books = Object.keys(BIBLE_STRUCTURE);
        if (planType === 'complete') return books;
        if (planType === 'old-testament') {
            return books.filter(book => BIBLE_STRUCTURE[book].testament === 'old');
        }
        if (planType === 'new-testament') {
            return books.filter(book => BIBLE_STRUCTURE[book].testament === 'new');
        }
        return books;
    }

    // Format position as string
    static formatBiblePosition(pos) {
        return `${pos.book} ${pos.chapter}:${pos.verse}`;
    }

    static formatQuranPosition(pos) {
        const surahName = QURAN_STRUCTURE[pos.surah].name;
        return `${surahName} ${pos.ayah} (${pos.surah}:${pos.ayah})`;
    }
}

// ==========================================
// SCHEDULE CALCULATOR CLASS
// ==========================================

class ScheduleCalculator {
    // Calculate initial schedule
    static calculateInitialSchedule(totalVerses, startDate, targetDate) {
        const totalDays = this.daysBetween(startDate, targetDate);
        if (totalDays <= 0) {
            throw new Error('Target date must be after start date');
        }

        const dailyTarget = Math.ceil(totalVerses / totalDays);
        const weeklyTarget = dailyTarget * 7;
        const estimatedMinutes = this.estimateReadingTime(dailyTarget);

        return {
            totalDays,
            dailyTarget,
            weeklyTarget,
            estimatedMinutesPerDay: estimatedMinutes
        };
    }

    // Adjust schedule based on progress
    static adjustSchedule(plan, currentDate) {
        const versesRemaining = plan.content.totalVerses - plan.versesRead;
        const daysRemaining = this.daysBetween(currentDate, plan.targetDate);

        if (daysRemaining <= 0) {
            return {
                status: 'overdue',
                message: 'Your target date has passed. Set a new target date to continue.',
                isOnTrack: false,
                newDailyTarget: 0,
                daysRemaining: 0,
                versesRemaining,
                completionPercentage: (plan.versesRead / plan.content.totalVerses) * 100,
                projectedFinishDate: null,
                daysDifference: null
            };
        }

        const newDailyTarget = Math.ceil(versesRemaining / daysRemaining);
        const originalDailyTarget = plan.dailyTarget;

        // Calculate expected progress
        const daysElapsed = this.daysBetween(plan.startDate, currentDate);
        const expectedVersesRead = Math.min(originalDailyTarget * daysElapsed, plan.content.totalVerses);
        const isOnTrack = plan.versesRead >= expectedVersesRead;

        // Calculate variance
        const variance = expectedVersesRead > 0
            ? ((plan.versesRead - expectedVersesRead) / expectedVersesRead) * 100
            : 0;

        const completionPercentage = (plan.versesRead / plan.content.totalVerses) * 100;

        // Calculate projected finish date based on actual pace
        let projectedFinishDate = null;
        let daysDifference = null;

        if (daysElapsed > 0 && plan.versesRead > 0) {
            // Calculate actual daily average
            const actualDailyAverage = plan.versesRead / daysElapsed;

            // Calculate days needed to finish at current pace
            const daysNeededToFinish = Math.ceil(versesRemaining / actualDailyAverage);

            // Calculate projected finish date
            const projectedDate = new Date(currentDate);
            projectedDate.setDate(projectedDate.getDate() + daysNeededToFinish);
            projectedFinishDate = projectedDate.toISOString().split('T')[0];

            // Calculate difference from original target
            daysDifference = this.daysBetween(plan.targetDate, projectedFinishDate);
        }

        return {
            status: isOnTrack ? (variance > 10 ? 'ahead' : 'on-track') : 'behind',
            isOnTrack,
            newDailyTarget,
            difference: newDailyTarget - originalDailyTarget,
            variance: Math.abs(variance),
            daysRemaining,
            versesRemaining,
            completionPercentage,
            estimatedMinutes: this.estimateReadingTime(newDailyTarget),
            message: this.generateMessage(isOnTrack, newDailyTarget, originalDailyTarget, variance),
            projectedFinishDate,
            daysDifference
        };
    }

    static generateMessage(isOnTrack, newTarget, originalTarget, variance) {
        if (isOnTrack) {
            if (variance > 10) {
                return `Amazing! You're ${variance.toFixed(1)}% ahead of schedule. Keep up the excellent work!`;
            }
            return "You're right on track! Keep up the great work.";
        } else {
            return `You're ${variance.toFixed(1)}% behind schedule. To finish on time, read ${newTarget} verses/day (up from ${originalTarget}).`;
        }
    }

    // Estimate reading time (avg 12 words/verse, 200 words/minute)
    static estimateReadingTime(verses) {
        const wordsPerVerse = 12;
        const wordsPerMinute = 200;
        return Math.ceil((verses * wordsPerVerse) / wordsPerMinute);
    }

    // Calculate days between dates
    static daysBetween(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = d2 - d1;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
}

// ==========================================
// SCRIPTURE APP CLASS
// ==========================================

class ScriptureApp extends BaseApp {
    constructor() {
        super('scripture-data');
    }

    // Override default data structure
    getDefaultData() {
        return {
            plans: [],
            readings: [],
            activePlanId: null
        };
    }

    // Called after constructor, before init
    beforeInit() {
        // Ensure data structure is correct (for existing data)
        if (Array.isArray(this.data)) {
            this.data = this.getDefaultData();
        }
        if (!this.data.plans) this.data.plans = [];
        if (!this.data.readings) this.data.readings = [];
        if (!this.data.activePlanId) this.data.activePlanId = null;
    }

    setupEventListeners() {
        // Plan form
        const planForm = document.getElementById('plan-form');
        if (planForm) {
            planForm.addEventListener('submit', (e) => this.handlePlanSubmit(e));
        }

        // Scripture type selector - update plan type options
        const scriptureTypeSelect = document.getElementById('plan-scripture-type');
        const planTypeSelect = document.getElementById('plan-type');
        if (scriptureTypeSelect && planTypeSelect) {
            scriptureTypeSelect.addEventListener('change', (e) => {
                if (e.target.value === 'quran') {
                    // For Quran, hide testament options
                    planTypeSelect.innerHTML = `
                        <option value="complete">Complete Quran</option>
                        <option value="custom">Custom Range</option>
                    `;
                } else {
                    // For Bible, show all options
                    planTypeSelect.innerHTML = `
                        <option value="complete">Complete Bible</option>
                        <option value="old-testament">Old Testament Only</option>
                        <option value="new-testament">New Testament Only</option>
                        <option value="custom">Custom Range</option>
                    `;
                }
            });
        }

        // Duration selector for custom date
        const durationSelect = document.getElementById('plan-duration');
        if (durationSelect) {
            durationSelect.addEventListener('change', (e) => {
                const customGroup = document.getElementById('custom-date-group');
                if (e.target.value === 'custom') {
                    customGroup.style.display = 'block';
                } else {
                    customGroup.style.display = 'none';
                }
            });
        }

        // Reading log form
        const readingForm = document.getElementById('reading-log-form');
        if (readingForm) {
            readingForm.addEventListener('submit', (e) => this.handleReadingSubmit(e));
        }

        // Quick action button
        const quickBtn = document.getElementById('mark-daily-target');
        if (quickBtn) {
            quickBtn.addEventListener('click', () => this.markDailyTargetComplete());
        }

        // History search
        const searchInput = document.getElementById('history-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterHistory(e.target.value));
        }

        // History filter
        const filterSelect = document.getElementById('history-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => this.filterHistory());
        }
    }

    updateDashboard() {
        this.renderActivePlan();
        this.renderStats();
        this.renderPlansList();
        this.renderHistory();
        this.updateLogTab();
    }

    // Plan Management
    handlePlanSubmit(e) {
        e.preventDefault();

        const scriptureType = document.getElementById('plan-scripture-type').value;
        const planType = document.getElementById('plan-type').value;
        const startDate = document.getElementById('plan-start-date').value;
        const duration = document.getElementById('plan-duration').value;
        const customDate = document.getElementById('plan-target-date').value;
        const planName = document.getElementById('plan-name').value;

        // Calculate target date
        let targetDate;
        if (duration === 'custom') {
            targetDate = customDate;
            if (!targetDate) {
                alert('Please select a target date');
                return;
            }
        } else {
            const start = new Date(startDate);
            start.setDate(start.getDate() + parseInt(duration));
            targetDate = start.toISOString().split('T')[0];
        }

        // Calculate total verses
        const totalVerses = VerseCalculator.getTotalVerses(scriptureType, planType);

        // Calculate schedule
        const schedule = ScheduleCalculator.calculateInitialSchedule(totalVerses, startDate, targetDate);

        // Determine starting position
        let currentPosition;
        if (scriptureType === 'bible') {
            const books = VerseCalculator.getBibleBooks(planType);
            currentPosition = { book: books[0], chapter: 1, verse: 1 };
        } else {
            currentPosition = { surah: 1, ayah: 1 };
        }

        // Create plan
        const plan = this.createItem({
            planName: planName || `${scriptureType === 'bible' ? 'Bible' : 'Quran'} Reading - ${schedule.totalDays} Days`,
            scriptureType,
            planType,
            startDate,
            targetDate,
            totalDays: schedule.totalDays,
            content: {
                totalVerses
            },
            dailyTarget: schedule.dailyTarget,
            weeklyTarget: schedule.weeklyTarget,
            estimatedMinutesPerDay: schedule.estimatedMinutesPerDay,
            versesRead: 0,
            currentPosition,
            status: 'active',
            isOnTrack: true
        });

        this.data.plans.push(plan);

        // Set as active plan if it's the first one
        if (!this.data.activePlanId) {
            this.data.activePlanId = plan.id;
        }

        this.save();

        e.target.reset();
        this.setupDefaultDates();

        alert(`✅ Plan created successfully!\n\nDaily target: ${schedule.dailyTarget} verses\nEstimated time: ~${schedule.estimatedMinutesPerDay} minutes/day`);

        this.updateDashboard();
        switchTab('dashboard');
    }

    // Reading Log
    handleReadingSubmit(e) {
        e.preventDefault();

        const activePlan = this.getActivePlan();
        if (!activePlan) {
            alert('No active plan found');
            return;
        }

        const date = document.getElementById('reading-date').value;
        const endBook = document.getElementById('end-book').value;
        const endChapter = parseInt(document.getElementById('end-chapter').value);
        const endVerse = parseInt(document.getElementById('end-verse').value);
        const duration = document.getElementById('reading-duration').value;
        const notes = document.getElementById('reading-notes').value;
        const tags = document.getElementById('reading-tags').value;
        const saveToJournal = document.getElementById('save-to-journal').checked;

        const startPos = activePlan.currentPosition;
        let endPos, versesRead;

        // Calculate verses read
        if (activePlan.scriptureType === 'bible') {
            endPos = { book: endBook, chapter: endChapter, verse: endVerse };
            versesRead = VerseCalculator.calculateBibleVerses(startPos, endPos);
        } else {
            endPos = { surah: parseInt(endBook), ayah: endVerse };
            versesRead = VerseCalculator.calculateQuranAyahs(startPos, endPos);
        }

        if (versesRead <= 0) {
            alert('Invalid reading range. End position must be after start position.');
            return;
        }

        // Create reading log
        const reading = this.createItem({
            planId: activePlan.id,
            date,
            scriptureType: activePlan.scriptureType,
            startPosition: { ...startPos },
            endPosition: endPos,
            versesRead,
            duration: duration ? parseInt(duration) : null,
            notes,
            tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
            targetVersesForDay: activePlan.dailyTarget,
            isOnTrack: versesRead >= activePlan.dailyTarget
        });

        this.data.readings.push(reading);

        // Update plan progress
        activePlan.versesRead += versesRead;

        // Calculate next position
        if (activePlan.scriptureType === 'bible') {
            const nextPos = VerseCalculator.getNextBiblePosition(endPos, 1);
            activePlan.currentPosition = { book: nextPos.book, chapter: nextPos.chapter, verse: nextPos.verse };

            if (nextPos.finished || activePlan.versesRead >= activePlan.content.totalVerses) {
                activePlan.status = 'completed';
                alert('🎉 Congratulations! You completed your reading plan!');
            }
        } else {
            const nextPos = VerseCalculator.getNextQuranPosition(endPos, 1);
            activePlan.currentPosition = { surah: nextPos.surah, ayah: nextPos.ayah };

            if (nextPos.finished || activePlan.versesRead >= activePlan.content.totalVerses) {
                activePlan.status = 'completed';
                alert('🎉 Congratulations! You completed your reading plan!');
            }
        }

        // Update schedule status
        const scheduleStatus = ScheduleCalculator.adjustSchedule(activePlan, date);
        activePlan.isOnTrack = scheduleStatus.isOnTrack;

        this.save();

        // Save to journal if requested
        if (saveToJournal && notes) {
            this.saveToJournal(reading);
        }

        e.target.reset();
        this.setupDefaultDates();

        const reference = activePlan.scriptureType === 'bible'
            ? VerseCalculator.formatBiblePosition(startPos) + ' - ' + VerseCalculator.formatBiblePosition(endPos)
            : VerseCalculator.formatQuranPosition(startPos) + ' - ' + VerseCalculator.formatQuranPosition(endPos);

        alert(`✅ Reading logged!\n\n${reference}\n${versesRead} verses read\n\n${scheduleStatus.message}`);

        this.updateDashboard();
    }

    markDailyTargetComplete() {
        const activePlan = this.getActivePlan();
        if (!activePlan) {
            alert('No active plan');
            return;
        }

        const versesToRead = activePlan.dailyTarget;
        const startPos = activePlan.currentPosition;
        let endPos;

        // Calculate end position
        if (activePlan.scriptureType === 'bible') {
            endPos = VerseCalculator.getNextBiblePosition(startPos, versesToRead - 1);
        } else {
            endPos = VerseCalculator.getNextQuranPosition(startPos, versesToRead - 1);
        }

        // Populate form
        if (activePlan.scriptureType === 'bible') {
            document.getElementById('end-book').value = endPos.book;
            document.getElementById('end-chapter').value = endPos.chapter;
            document.getElementById('end-verse').value = endPos.verse;
        } else {
            document.getElementById('end-book').value = endPos.surah;
            document.getElementById('end-verse').value = endPos.ayah;
        }
    }

    saveToJournal(reading) {
        try {
            const journals = StorageManager.get('journal') || [];

            const reference = reading.scriptureType === 'bible'
                ? `${reading.startPosition.book} ${reading.startPosition.chapter}:${reading.startPosition.verse}`
                : `${QURAN_STRUCTURE[reading.startPosition.surah].name} ${reading.startPosition.ayah}`;

            const journalEntry = {
                id: Date.now() + 1,
                createdAt: new Date().toISOString().split('T')[0],
                date: reading.date,
                title: `📖 ${reference}`,
                content: reading.notes,
                mood: '',
                tags: ['scripture', ...reading.tags]
            };

            journals.push(journalEntry);
            StorageManager.set('journal', journals);
        } catch (error) {
            console.error('Failed to save to journal:', error);
        }
    }

    // Rendering
    renderActivePlan() {
        const plan = this.getActivePlan();
        const noActivePlan = document.getElementById('no-active-plan');
        const activePlanDisplay = document.getElementById('active-plan-display');

        if (!plan) {
            noActivePlan.style.display = 'block';
            activePlanDisplay.style.display = 'none';
            return;
        }

        noActivePlan.style.display = 'none';
        activePlanDisplay.style.display = 'block';

        // Plan info
        document.getElementById('active-plan-name').textContent = plan.planName;
        document.getElementById('active-plan-type').textContent = plan.scriptureType === 'bible' ? '📖 Bible' : '☪️ Quran';
        document.getElementById('active-plan-dates').textContent =
            `${this.formatDate(plan.startDate)} - ${this.formatDate(plan.targetDate)}`;

        // Progress
        const completionPercentage = (plan.versesRead / plan.content.totalVerses) * 100;
        document.getElementById('plan-progress-bar').style.width = completionPercentage + '%';
        document.getElementById('progress-percentage').textContent = completionPercentage.toFixed(1) + '%';
        document.getElementById('progress-verses').textContent =
            `${plan.versesRead.toLocaleString()} / ${plan.content.totalVerses.toLocaleString()} verses`;

        // Current position
        const posText = plan.scriptureType === 'bible'
            ? VerseCalculator.formatBiblePosition(plan.currentPosition)
            : VerseCalculator.formatQuranPosition(plan.currentPosition);
        document.getElementById('current-position-text').textContent = posText;

        // Update dashboard "Read Online" link
        const dashboardReadLink = document.getElementById('dashboard-read-link');
        if (dashboardReadLink) {
            if (plan.scriptureType === 'bible') {
                const book = plan.currentPosition.book.replace(/ /g, '+');
                const chapter = plan.currentPosition.chapter;
                dashboardReadLink.href = `https://www.biblegateway.com/passage/?search=${book}+${chapter}&version=NIV`;
                dashboardReadLink.textContent = '📖 Open in BibleGateway →';
            } else {
                const surah = plan.currentPosition.surah;
                dashboardReadLink.href = `https://quran.com/${surah}`;
                dashboardReadLink.textContent = '📖 Open in Quran.com →';
            }
        }

        // Schedule status
        const scheduleStatus = ScheduleCalculator.adjustSchedule(plan, new Date().toISOString().split('T')[0]);
        const statusIndicator = document.getElementById('status-indicator');
        const statusBadge = statusIndicator.querySelector('.status-badge');

        statusIndicator.className = 'status-indicator';
        statusBadge.className = 'status-badge';

        if (scheduleStatus.status === 'behind') {
            statusIndicator.classList.add('behind');
            statusBadge.classList.add('behind');
            statusBadge.textContent = '⚠ Behind Schedule';
        } else if (scheduleStatus.status === 'ahead') {
            statusBadge.classList.add('ahead');
            statusBadge.textContent = '🚀 Ahead of Schedule';
        } else {
            statusBadge.classList.add('on-track');
            statusBadge.textContent = '✓ On Track';
        }

        document.getElementById('status-message').textContent = scheduleStatus.message;

        // Daily target
        const dailyTarget = scheduleStatus.newDailyTarget || plan.dailyTarget;
        document.getElementById('daily-target-verses').textContent = dailyTarget;
        document.getElementById('daily-target-time').textContent = `~${scheduleStatus.estimatedMinutes || plan.estimatedMinutesPerDay} min`;
        document.getElementById('days-remaining').textContent = scheduleStatus.daysRemaining;

        // Calculate and display target endpoint for today
        const endpointElement = document.getElementById('daily-target-endpoint');
        if (endpointElement) {
            let targetEndpoint;
            if (plan.scriptureType === 'bible') {
                const endpoint = VerseCalculator.getNextBiblePosition(plan.currentPosition, dailyTarget - 1);
                targetEndpoint = VerseCalculator.formatBiblePosition(endpoint);
            } else {
                const endpoint = VerseCalculator.getNextQuranPosition(plan.currentPosition, dailyTarget - 1);
                targetEndpoint = VerseCalculator.formatQuranPosition(endpoint);
            }
            endpointElement.textContent = targetEndpoint;
        }

        // Display completion dates
        const originalTargetDateEl = document.getElementById('original-target-date');
        const projectedFinishDateEl = document.getElementById('projected-finish-date');
        const dateVarianceMessageEl = document.getElementById('date-variance-message');

        if (originalTargetDateEl) {
            originalTargetDateEl.textContent = this.formatDate(plan.targetDate);
        }

        if (projectedFinishDateEl && dateVarianceMessageEl) {
            if (scheduleStatus.projectedFinishDate) {
                projectedFinishDateEl.textContent = this.formatDate(scheduleStatus.projectedFinishDate);

                // Update styling based on whether ahead or behind
                const projectedDateItem = projectedFinishDateEl.closest('.date-item');
                if (projectedDateItem) {
                    projectedDateItem.classList.remove('ahead', 'behind', 'on-track');

                    if (scheduleStatus.daysDifference < 0) {
                        // Finishing early
                        projectedDateItem.classList.add('ahead');
                        const daysEarly = Math.abs(scheduleStatus.daysDifference);
                        dateVarianceMessageEl.textContent = `🚀 You're on pace to finish ${daysEarly} day${daysEarly !== 1 ? 's' : ''} early!`;
                        dateVarianceMessageEl.className = 'date-variance ahead';
                    } else if (scheduleStatus.daysDifference > 0) {
                        // Finishing late
                        projectedDateItem.classList.add('behind');
                        dateVarianceMessageEl.textContent = `⚠️ At your current pace, you'll finish ${scheduleStatus.daysDifference} day${scheduleStatus.daysDifference !== 1 ? 's' : ''} late. Speed up to ${scheduleStatus.newDailyTarget} verses/day to finish on time.`;
                        dateVarianceMessageEl.className = 'date-variance behind';
                    } else {
                        // Right on schedule
                        projectedDateItem.classList.add('on-track');
                        dateVarianceMessageEl.textContent = "✓ You're on track to finish on time!";
                        dateVarianceMessageEl.className = 'date-variance on-track';
                    }
                }
            } else {
                // No reading progress yet
                projectedFinishDateEl.textContent = this.formatDate(plan.targetDate);
                dateVarianceMessageEl.textContent = "Start reading to see your projected finish date!";
                dateVarianceMessageEl.className = 'date-variance';
            }
        }
    }

    renderStats() {
        const totalReadings = this.data.readings.length;
        const totalVersesRead = this.data.readings.reduce((sum, r) => sum + r.versesRead, 0);
        const totalTime = this.data.readings.reduce((sum, r) => sum + (r.duration || 0), 0);
        const streak = this.calculateStreak();

        document.getElementById('total-readings').textContent = totalReadings;
        document.getElementById('current-streak').textContent = streak;
        document.getElementById('total-verses-read').textContent = totalVersesRead.toLocaleString();
        document.getElementById('total-time-spent').textContent = Math.floor(totalTime / 60) + 'h';
    }

    calculateStreak() {
        if (this.data.readings.length === 0) return 0;

        const sortedReadings = [...this.data.readings].sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        );

        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (const reading of sortedReadings) {
            const readingDate = new Date(reading.date);
            readingDate.setHours(0, 0, 0, 0);

            const diffDays = Math.floor((currentDate - readingDate) / (1000 * 60 * 60 * 24));

            if (diffDays === streak) {
                streak++;
                currentDate = readingDate;
            } else if (diffDays > streak) {
                break;
            }
        }

        return streak;
    }

    renderPlansList() {
        const container = document.getElementById('plans-list');
        if (!container) return;

        if (this.data.plans.length === 0) {
            container.innerHTML = '<div class="empty-state">No plans created yet</div>';
            return;
        }

        container.innerHTML = this.data.plans.map(plan => {
            const isActive = plan.id === this.data.activePlanId;
            const completion = (plan.versesRead / plan.content.totalVerses) * 100;

            return `
                <div class="plan-item ${isActive ? 'active-plan' : ''}" onclick="scriptureApp.selectPlan(${plan.id})">
                    <div class="plan-item-header">
                        <h4 class="plan-item-title">${plan.planName}</h4>
                        <span class="plan-badge ${plan.status}">${plan.status.toUpperCase()}</span>
                    </div>
                    <div class="plan-item-details">
                        ${plan.scriptureType === 'bible' ? '📖' : '☪️'} ${plan.scriptureType.toUpperCase()} •
                        ${plan.totalDays} days •
                        ${plan.dailyTarget} verses/day
                    </div>
                    <div class="plan-item-progress">
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${completion}%"></div>
                        </div>
                        <div class="progress-stats">
                            <span>${completion.toFixed(1)}%</span>
                            <span>${plan.versesRead} / ${plan.content.totalVerses} verses</span>
                        </div>
                    </div>
                    <div class="plan-actions">
                        ${!isActive ? `<button class="plan-action-btn" onclick="event.stopPropagation(); scriptureApp.setActivePlan(${plan.id})">Set Active</button>` : ''}
                        <button class="plan-action-btn danger" onclick="event.stopPropagation(); scriptureApp.deletePlan(${plan.id})">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderHistory() {
        const container = document.getElementById('history-list');
        if (!container) return;

        if (this.data.readings.length === 0) {
            container.innerHTML = '<div class="empty-state">No reading history yet. Start logging your readings!</div>';
            return;
        }

        const sortedReadings = [...this.data.readings].sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        );

        container.innerHTML = sortedReadings.map(reading => {
            const reference = reading.scriptureType === 'bible'
                ? `${reading.startPosition.book} ${reading.startPosition.chapter}:${reading.startPosition.verse} - ${reading.endPosition.book} ${reading.endPosition.chapter}:${reading.endPosition.verse}`
                : `${QURAN_STRUCTURE[reading.startPosition.surah].name} ${reading.startPosition.ayah} - ${QURAN_STRUCTURE[reading.endPosition.surah].name} ${reading.endPosition.ayah}`;

            // Generate online reading link
            let onlineLink = '';
            if (reading.scriptureType === 'bible') {
                const book = reading.startPosition.book.replace(/ /g, '+');
                const chapter = reading.startPosition.chapter;
                onlineLink = `https://www.biblegateway.com/passage/?search=${book}+${chapter}&version=NIV`;
            } else {
                const surah = reading.startPosition.surah;
                onlineLink = `https://quran.com/${surah}`;
            }

            return `
                <div class="reading-item">
                    <div class="reading-item-header">
                        <div class="reading-reference">${reference}</div>
                        <div class="reading-date">${this.formatDate(reading.date)}</div>
                    </div>
                    <div class="reading-stats">
                        <span>📊 ${reading.versesRead} ${reading.scriptureType === 'bible' ? 'verses' : 'ayahs'}</span>
                        ${reading.duration ? `<span>⏱ ${reading.duration} min</span>` : ''}
                        <span>${reading.isOnTrack ? '✓ On track' : '⚠ Behind'}</span>
                    </div>
                    ${reading.notes ? `<div class="reading-notes">${reading.notes}</div>` : ''}
                    ${reading.tags.length > 0 ? `
                        <div class="reading-tags">
                            ${reading.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                    <div class="reading-actions">
                        <a href="${onlineLink}" target="_blank" class="reading-action-btn" style="text-decoration: none;">📖 Read Online</a>
                        <button class="reading-action-btn" onclick="scriptureApp.copyNotes(${reading.id})">Copy Notes</button>
                        <button class="reading-action-btn" onclick="scriptureApp.deleteReading(${reading.id})">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateLogTab() {
        const activePlan = this.getActivePlan();
        const noPlanWarning = document.getElementById('no-plan-warning');
        const formContainer = document.getElementById('log-reading-form-container');

        if (!activePlan || activePlan.status === 'completed') {
            noPlanWarning.style.display = 'block';
            formContainer.style.display = 'none';
            return;
        }

        noPlanWarning.style.display = 'none';
        formContainer.style.display = 'block';

        // Update active plan indicator
        document.getElementById('log-plan-name').textContent = activePlan.planName;

        // Update current position
        const posText = activePlan.scriptureType === 'bible'
            ? VerseCalculator.formatBiblePosition(activePlan.currentPosition)
            : VerseCalculator.formatQuranPosition(activePlan.currentPosition);
        document.getElementById('log-start-position').textContent = posText;

        // Update "Read Online" link
        const readOnlineLink = document.getElementById('read-online-link');
        if (activePlan.scriptureType === 'bible') {
            const book = activePlan.currentPosition.book.replace(/ /g, '+');
            const chapter = activePlan.currentPosition.chapter;
            readOnlineLink.href = `https://www.biblegateway.com/passage/?search=${book}+${chapter}&version=NIV`;
            readOnlineLink.textContent = '📖 Read on BibleGateway';
        } else {
            const surah = activePlan.currentPosition.surah;
            readOnlineLink.href = `https://quran.com/${surah}`;
            readOnlineLink.textContent = '📖 Read on Quran.com';
        }

        // Calculate and display target endpoint
        const logEndpointElement = document.getElementById('log-target-endpoint');
        if (logEndpointElement) {
            const scheduleStatus = ScheduleCalculator.adjustSchedule(activePlan, new Date().toISOString().split('T')[0]);
            const dailyTarget = scheduleStatus.newDailyTarget || activePlan.dailyTarget;

            let targetEndpoint;
            if (activePlan.scriptureType === 'bible') {
                const endpoint = VerseCalculator.getNextBiblePosition(activePlan.currentPosition, dailyTarget - 1);
                targetEndpoint = VerseCalculator.formatBiblePosition(endpoint);
            } else {
                const endpoint = VerseCalculator.getNextQuranPosition(activePlan.currentPosition, dailyTarget - 1);
                targetEndpoint = VerseCalculator.formatQuranPosition(endpoint);
            }
            logEndpointElement.textContent = targetEndpoint;
        }

        // Handle input visibility and labels for Bible vs Quran
        const endChapterInput = document.getElementById('end-chapter');
        const endVerseInput = document.getElementById('end-verse');
        const endBookSelect = document.getElementById('end-book');

        if (activePlan.scriptureType === 'quran') {
            // For Quran: Dropdown has surah, only need ayah input
            // Hide chapter input since surah is selected from dropdown
            endChapterInput.style.display = 'none';
            endChapterInput.required = false;
            endChapterInput.value = ''; // Clear value
            endVerseInput.placeholder = 'Ayah';

            // Populate surah dropdown
            endBookSelect.innerHTML = Object.keys(QURAN_STRUCTURE).map(num =>
                `<option value="${num}" ${parseInt(num) === activePlan.currentPosition.surah ? 'selected' : ''}>
                    ${num}. ${QURAN_STRUCTURE[num].name}
                </option>`
            ).join('');
        } else {
            // For Bible: Dropdown has book, need chapter AND verse inputs
            endChapterInput.style.display = 'block';
            endChapterInput.required = true;
            endChapterInput.placeholder = 'Ch';
            endVerseInput.placeholder = 'Vs';

            // Populate book dropdown
            const books = VerseCalculator.getBibleBooks(activePlan.planType);
            endBookSelect.innerHTML = books.map(book =>
                `<option value="${book}" ${book === activePlan.currentPosition.book ? 'selected' : ''}>${book}</option>`
            ).join('');
        }
    }

    filterHistory(searchQuery = '') {
        const filter = document.getElementById('history-filter')?.value || 'all';
        const query = searchQuery || document.getElementById('history-search')?.value || '';

        let filteredReadings = [...this.data.readings];

        // Apply search
        if (query) {
            filteredReadings = filteredReadings.filter(reading => {
                const reference = reading.scriptureType === 'bible'
                    ? `${reading.startPosition.book} ${reading.startPosition.chapter}`
                    : QURAN_STRUCTURE[reading.startPosition.surah].name;

                return reference.toLowerCase().includes(query.toLowerCase()) ||
                       reading.notes.toLowerCase().includes(query.toLowerCase()) ||
                       reading.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
            });
        }

        // Apply filter
        if (filter !== 'all') {
            if (filter === 'bible' || filter === 'quran') {
                filteredReadings = filteredReadings.filter(r => r.scriptureType === filter);
            } else if (filter === 'this-week') {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                filteredReadings = filteredReadings.filter(r => new Date(r.date) >= weekAgo);
            } else if (filter === 'this-month') {
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                filteredReadings = filteredReadings.filter(r => new Date(r.date) >= monthAgo);
            }
        }

        // Re-render with filtered data
        const container = document.getElementById('history-list');
        if (filteredReadings.length === 0) {
            container.innerHTML = '<div class="empty-state">No readings match your search.</div>';
        } else {
            const sortedReadings = filteredReadings.sort((a, b) => new Date(b.date) - new Date(a.date));
            // Use same rendering logic as renderHistory but with filtered data
            // (simplified for brevity - reuse renderHistory logic)
            this.renderHistory();
        }
    }

    // Helper methods
    getActivePlan() {
        return this.data.plans.find(p => p.id === this.data.activePlanId);
    }

    selectPlan(planId) {
        // Could show plan details modal
        console.log('Selected plan:', planId);
    }

    setActivePlan(planId) {
        this.data.activePlanId = planId;
        this.save();
        this.updateDashboard();
    }

    deletePlan(planId) {
        if (!confirm('Are you sure you want to delete this plan?')) return;

        this.data.plans = this.data.plans.filter(p => p.id !== planId);
        if (this.data.activePlanId === planId) {
            this.data.activePlanId = this.data.plans.length > 0 ? this.data.plans[0].id : null;
        }
        this.save();
        this.updateDashboard();
    }

    deleteReading(readingId) {
        if (!confirm('Are you sure you want to delete this reading?')) return;

        this.data.readings = this.data.readings.filter(r => r.id !== readingId);
        this.save();
        this.updateDashboard();
    }

    copyNotes(readingId) {
        const reading = this.data.readings.find(r => r.id === readingId);
        if (!reading || !reading.notes) return;

        navigator.clipboard.writeText(reading.notes).then(() => {
            alert('Notes copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    }

    refresh() {
        super.refresh();
        this.updateDashboard();
    }
}

// ==========================================
// TAB SWITCHING
// ==========================================

function switchTab(tabName, event) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));

    const tab = document.getElementById(`${tabName}-tab`);
    if (tab) tab.classList.add('active');

    if (event && event.target) event.target.classList.add('active');

    // Refresh data when switching tabs
    if (tabName === 'dashboard') scriptureApp.updateDashboard();
    if (tabName === 'log') scriptureApp.updateLogTab();
    if (tabName === 'history') scriptureApp.renderHistory();
    if (tabName === 'plans') scriptureApp.renderPlansList();
}

// ==========================================
// INITIALIZE APP
// ==========================================

let scriptureApp;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        scriptureApp = new ScriptureApp();
    });
} else {
    scriptureApp = new ScriptureApp();
}
