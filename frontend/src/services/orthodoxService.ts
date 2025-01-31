export const formatBibleReference = (
  book: string,
  chapter: number,
  verse?: number | string
): string => {
  if (verse) {
    return `${book} ${chapter}:${verse}`;
  }
  return `${book} ${chapter}`;
};

// Add a utility function to help with reference formatting
export const formatBibleBookName = (bookName: string): string => {
  const bookMap: { [key: string]: string } = {
    Genesis: "GEN",
    Exodus: "EXO",
    Leviticus: "LEV",
    Numbers: "NUM",
    Deuteronomy: "DEU",
    Joshua: "JOS",
    Judges: "JDG",
    Ruth: "RUT",
    "1 Samuel": "1SA",
    "2 Samuel": "2SA",
    "1 Kings": "1KI",
    "2 Kings": "2KI",
    "1 Chronicles": "1CH",
    "2 Chronicles": "2CH",
    Ezra: "EZR",
    Nehemiah: "NEH",
    Esther: "EST",
    Job: "JOB",
    Psalms: "PSA",
    Proverbs: "PRO",
    Ecclesiastes: "ECC",
    "Song of Solomon": "SNG",
    Isaiah: "ISA",
    Jeremiah: "JER",
    Lamentations: "LAM",
    Ezekiel: "EZK",
    Daniel: "DAN",
    Hosea: "HOS",
    Joel: "JOL",
    Amos: "AMO",
    Obadiah: "OBA",
    Jonah: "JON",
    Micah: "MIC",
    Nahum: "NAM",
    Habakkuk: "HAB",
    Zephaniah: "ZEP",
    Haggai: "HAG",
    Zechariah: "ZEC",
    Malachi: "MAL",
    Matthew: "MAT",
    Mark: "MRK",
    Luke: "LUK",
    John: "JHN",
    Acts: "ACT",
    Romans: "ROM",
    "1 Corinthians": "1CO",
    "2 Corinthians": "2CO",
    Galatians: "GAL",
    Ephesians: "EPH",
    Philippians: "PHP",
    Colossians: "COL",
    "1 Thessalonians": "1TH",
    "2 Thessalonians": "2TH",
    "1 Timothy": "1TI",
    "2 Timothy": "2TI",
    Titus: "TIT",
    Philemon: "PHM",
    Hebrews: "HEB",
    James: "JAS",
    "1 Peter": "1PE",
    "2 Peter": "2PE",
    "1 John": "1JN",
    "2 John": "2JN",
    "3 John": "3JN",
    Jude: "JUD",
    Revelation: "REV",
  };

  return bookMap[bookName] || bookName;
};

// Helper function to format references
export const formatReference = (reference: string): string => {
  // Example input: "Ephesians 4:1-6"
  // Example output: "EPH.4.1-EPH.4.6"
  const [book, passage] = reference.split(" ");
  const formattedBook = formatBibleBookName(book);

  if (passage.includes("-")) {
    const [start, end] = passage.split("-");
    const [startChapter, startVerse] = start.split(":");
    const [endChapter, endVerse] = end.includes(":")
      ? end.split(":")
      : [startChapter, end];

    return `${formattedBook}.${startChapter}.${startVerse}-${formattedBook}.${endChapter}.${endVerse}`;
  } else {
    const [chapter, verse] = passage.split(":");
    return `${formattedBook}.${chapter}.${verse}`;
  }
};

// Add a new function to fetch daily readings and saints
export const fetchDailyOrthodoxData = async (
  year: number,
  month: number,
  day: number
): Promise<any> => {
  try {
    const response = await fetch(
      `https://orthocal.info/api/julian/${year}/${month}/${day}`
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data; // Return the entire data object
  } catch (error) {
    console.error("Failed to fetch daily Orthodox data:", error);
    throw error;
  }
};
