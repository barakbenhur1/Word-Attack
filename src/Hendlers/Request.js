// Import the Axios library for making HTTP requests
const axios = require("axios");
const result = require("./Result");

// Function to fetch a random article title from Wikipedia with language and length options
async function getWord(language, length, words) {
  if (words.length < 10000 && language == "en") {
    return await getEnglishWord(length, words);
  } else {
    return await getFromWiki(language, length, words);
  }
}

async function getFromWiki(language, length, words) {
  const url = `https://${language}.wikipedia.org/w/api.php`;

  const params = {
    action: "query",
    list: "random",
    rnlimit: 5,
    format: "json",
    prop: "extracts",
    exchars: 500,
    explaintext: true,
  };

  try {
    const { data } = await axios.get(url, { params });
    const articles = data.query.random;

    for (let article of articles) {
      const titleWords = article.title.split(" ");
      const extractWords = (article.extract || "").split(" ");

      const combinedWords = [...titleWords, ...extractWords];
      const word = combinedWords.find(
        (w) =>
          w.length === length && (language == "en" ? isEnglish(w) : isHebrew(w))
      );

      if (
        result.exsit(word) &&
        (await isWordInLanguage(word, language)) &&
        !words.includes(word)
      ) {
        return word;
      }
    }
    return getFromWiki(language, length, words);
  } catch (error) {
    return error;
  }
}

async function getEnglishWord(length, words) {
  const options = {
    method: "GET",
    url: "https://word-generator2.p.rapidapi.com/",
    params: { length: length },
    headers: {
      "x-rapidapi-key": "8d3836a577mshcb3b08ace209963p1056f4jsnec07b98e10ce",
      "x-rapidapi-host": "word-generator2.p.rapidapi.com",
    },
  };
  try {
    const response = await axios.request(options);
    const wordList = response.data.body;

    if (wordList.length === 0) {
      return `No English words found with length ${length}.`;
    }
    const word = wordList[Math.floor(Math.random() * wordList.length)];
    if (words.includes(word)) {
      return getEnglishWord(length, words);
    }
    return word;
  } catch (error) {
    return console.error("Error fetching word:", error);
  }
}

function isHebrew(str) {
  const hebrewRegex = /^[\u0590-\u05FF]+$/;
  return hebrewRegex.test(str);
}

function isEnglish(text) {
  // Regular expression to match only English letters (both uppercase and lowercase) and spaces
  const englishRegex = /^[A-Za-z]+$/;
  return englishRegex.test(text);
}

async function isWordInLanguage(word, language) {
  if (language == "he") {
    try {
      const url = `https://he.wiktionary.org/w/api.php?action=query&titles=${word}&prop=categories|extracts&format=json&explaintext`;
      const response = await axios.get(url);

      const pages = response.data.query.pages;
      const page = Object.values(pages)[0];

      // If no page extract found, word does not exist
      if (!page.extract) return false;

      // Check if the word is categorized as a name
      const isName =
        page.categories &&
        page.categories.some((category) =>
          category.title.includes("שמות פרטיים")
        );

      return !isName; // Return true if it's a valid word and not a name
    } catch (error) {
      console.error("Error:", error.message);
      return false; // Error or not found
    }
  } else {
    try {
      // Replace with the actual dictionary API URL (Wordnik, Oxford, etc.)
      const url = `https://api.dictionaryapi.dev/api/v2/entries/${language}/${word}`;

      // Make API request
      const response = await axios.get(url);

      // If a definition is found, the word exists in the language
      if (response.data.length > 0) {
        return true; // Word exists
      }
    } catch (error) {
      // If the word doesn't exist or there's an error, return false
      console.error(
        "Error or word not found:",
        error.response?.statusText || error.message
      );
      return false;
    }

    return false;
  }
}

module.exports = { getWord };
